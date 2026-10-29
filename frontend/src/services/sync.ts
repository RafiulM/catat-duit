import {
  ensureCategory,
  failOutbox,
  findTransactionByClientId,
  getBudget,
  getTransaction,
  listOutbox,
  markTransactionFailed,
  markTransactionSynced,
  prepareLocalTransactionsForSync,
  removeOutbox,
  saveBudget,
  setLastSyncAt,
  upsertRemoteCategory,
} from '@/data/repository';
import type { Budget, RemoteTransaction } from '@/data/types';
import {
  ApiError,
  apiCreateBudget,
  apiCreateTransaction,
  apiDeleteBudget,
  apiDeleteTransaction,
  apiFetchBudgets,
  apiFetchCategories,
  apiFetchTransactions,
  apiUpdateBudget,
  apiUpdateTransaction,
} from '@/services/api';
import { invalidateLocalData } from '@/data/query-keys';
import { getSessionToken } from '@/services/session';
import { todayISO } from '@/utils/date';

let syncing = false;

export type SyncOutcome = {
  skipped: boolean;
  pushed: number;
  pulled: number;
  failed: number;
  error?: string;
};

const EMPTY_OUTCOME: SyncOutcome = {
  skipped: true,
  pushed: 0,
  pulled: 0,
  failed: 0,
};

export function isSyncing(): boolean {
  return syncing;
}

export async function syncNow(
  options: { pull?: boolean } = {},
): Promise<SyncOutcome> {
  const token = getSessionToken();
  if (!token) return { ...EMPTY_OUTCOME, error: 'Masuk dulu untuk sinkronisasi.' };
  if (syncing) return EMPTY_OUTCOME;

  syncing = true;
  let pushed = 0;
  let pulled = 0;
  let failed = 0;

  try {
    await prepareLocalTransactionsForSync();

    if (options.pull !== false) {
      const categories = await apiFetchCategories(token);
      for (const category of categories) {
        await upsertRemoteCategory({
          id: category.id,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          isDefault: category.isDefault,
          isArchived: category.isArchived,
        });
      }
    }

    const pushResult = await pushOutbox(token);
    pushed = pushResult.pushed;
    failed = pushResult.failed;
    if (options.pull !== false) {
      pulled = await pullTransactions(token);
      await pullBudget(token);
    }
    await setLastSyncAt(new Date().toISOString());

    invalidateLocalData();
    return { skipped: false, pushed, pulled, failed };
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      const { useAuthStore } = await import('@/stores/auth-store');
      await useAuthStore.getState().handleSessionExpired();
      return {
        skipped: false,
        pushed,
        pulled,
        failed,
        error: 'Sesi berakhir. Silakan masuk lagi.',
      };
    }
    return {
      skipped: false,
      pushed,
      pulled,
      failed,
      error:
        error instanceof ApiError
          ? error.message
          : 'Sinkronisasi gagal. Data tetap aman di perangkat.',
    };
  } finally {
    syncing = false;
    invalidateLocalData();
  }
}

async function pushOutbox(
  token: string,
): Promise<{ pushed: number; failed: number }> {
  const operations = await listOutbox();
  let pushed = 0;
  let failed = 0;

  for (const operation of operations) {
    if (operation.op === 'create') {
      const transaction = await getTransaction(operation.transactionId);
      if (!transaction) {
        await removeOutbox(operation.id);
        continue;
      }
      try {
        const remote = await apiCreateTransaction(token, {
          categoryId: transaction.categoryId,
          type: transaction.type,
          amount: transaction.amount,
          note: transaction.note,
          transactionDate: transaction.transactionDate,
          clientId: transaction.clientId,
        });
        await markTransactionSynced(transaction.id, remote.id, {
          amount: remote.amount,
          note: remote.note ?? transaction.note,
          transactionDate: remote.transactionDate,
          categoryId: remote.category.id,
          type: remote.type,
        });
        await removeOutbox(operation.id);
        pushed += 1;
      } catch (error) {
        if (error instanceof ApiError && error.isNetworkError) throw error;
        if (error instanceof ApiError && error.isUnauthorized) throw error;
        await failOutbox(operation.id, messageOf(error));
        await markTransactionFailed(transaction.id, messageOf(error));
        failed += 1;
      }
      continue;
    }

    if (operation.op === 'update') {
      const transaction = await getTransaction(operation.transactionId);
      if (!transaction) {
        await removeOutbox(operation.id);
        continue;
      }
      if (!transaction.serverId) {
        await removeOutbox(operation.id);
        continue;
      }
      try {
        const remote = await apiUpdateTransaction(
          token,
          transaction.serverId,
          {
            categoryId: transaction.categoryId,
            type: transaction.type,
            amount: transaction.amount,
            note: transaction.note,
            transactionDate: transaction.transactionDate,
          },
        );
        await markTransactionSynced(transaction.id, remote.id, {
          amount: remote.amount,
          note: remote.note ?? transaction.note,
          transactionDate: remote.transactionDate,
          categoryId: remote.category.id,
          type: remote.type,
        });
        await removeOutbox(operation.id);
        pushed += 1;
      } catch (error) {
        if (error instanceof ApiError && error.isNetworkError) throw error;
        if (error instanceof ApiError && error.isUnauthorized) throw error;
        await failOutbox(operation.id, messageOf(error));
        await markTransactionFailed(transaction.id, messageOf(error));
        failed += 1;
      }
      continue;
    }

    if (!operation.serverId) {
      await removeOutbox(operation.id);
      continue;
    }
    try {
      await apiDeleteTransaction(token, operation.serverId);
      await removeOutbox(operation.id);
      pushed += 1;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        await removeOutbox(operation.id);
        continue;
      }
      if (error instanceof ApiError && error.isNetworkError) throw error;
      if (error instanceof ApiError && error.isUnauthorized) throw error;
      await failOutbox(operation.id, messageOf(error));
      failed += 1;
    }
  }

  return { pushed, failed };
}

async function pullTransactions(token: string): Promise<number> {
  let page = 1;
  let pulled = 0;
  let hasNext = true;

  while (hasNext && page <= 10) {
    const result = await apiFetchTransactions(token, { page, limit: 100 });
    for (const remote of result.data) {
      await mergeRemoteTransaction(remote);
      pulled += 1;
    }
    hasNext = result.meta.hasNextPage;
    page += 1;
  }

  return pulled;
}

async function mergeRemoteTransaction(remote: RemoteTransaction): Promise<void> {
  await ensureCategory({
    id: remote.category.id,
    name: remote.category.name,
    type: remote.category.type,
    icon: remote.category.icon,
    color: remote.category.color,
  });

  const existing = await findTransactionByClientId(remote.clientId);
  if (existing) {
    await markTransactionSynced(existing.id, remote.id, {
      amount: remote.amount,
      note: remote.note ?? existing.note,
      transactionDate: remote.transactionDate,
      categoryId: remote.category.id,
      type: remote.type,
    });
    return;
  }

  const { getDatabase } = await import('@/data/db');
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO transactions
      (id, server_id, client_id, category_id, type, amount, note,
       transaction_date, created_at, updated_at, sync_status, sync_error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', NULL)`,
    [
      remote.id,
      remote.id,
      remote.clientId,
      remote.category.id,
      remote.type,
      Math.round(remote.amount),
      remote.note ?? remote.category.name,
      remote.transactionDate,
      remote.createdAt,
      remote.updatedAt,
    ],
  );
}

async function pullBudget(token: string): Promise<void> {
  const budgets = await apiFetchBudgets(token, { activeOnly: true });
  const currentMonth = todayISO().slice(0, 7);
  const monthly =
    budgets.find(
      (budget) =>
        budget.period === 'monthly' &&
        (budget.month === currentMonth || budget.month === null),
    ) ?? null;
  const daily = budgets.find((budget) => budget.period === 'daily') ?? null;
  const remote = monthly ?? daily;

  if (remote) {
    await saveBudget({
      period: remote.period,
      amount: remote.amount,
      month: remote.month,
      isActive: remote.isActive,
      serverId: remote.id,
    });
    return;
  }

  const local = await getBudget();
  if (!local) return;

  try {
    const created = await apiCreateBudget(token, {
      period: local.period,
      amount: local.amount,
      month: local.month,
      isActive: local.isActive,
    });
    await saveBudget({ ...local, serverId: created.id });
  } catch {
    // A local budget remains valid when the server rejects it; the next sync
    // will try again while the user can keep managing it offline.
  }
}

export async function syncBudgetToServer(
  budget: Budget,
  previous?: Budget | null,
): Promise<Budget> {
  const token = getSessionToken();
  if (!token) return budget;

  try {
    if (previous?.serverId && previous.period !== budget.period) {
      try {
        await apiDeleteBudget(token, previous.serverId);
      } catch {
        // If the old budget is already gone, creating the new period still works.
      }
      const created = await apiCreateBudget(token, {
        period: budget.period,
        amount: budget.amount,
        month: budget.month,
        isActive: budget.isActive,
      });
      return { ...budget, serverId: created.id };
    }

    if (budget.serverId) {
      const updated = await apiUpdateBudget(token, budget.serverId, {
        amount: budget.amount,
        isActive: budget.isActive,
      });
      return { ...budget, serverId: updated.id };
    }
    const created = await apiCreateBudget(token, {
      period: budget.period,
      amount: budget.amount,
      month: budget.month,
      isActive: budget.isActive,
    });
    return { ...budget, serverId: created.id };
  } catch {
    return budget;
  }
}

export async function removeBudgetFromServer(budget: Budget | null): Promise<void> {
  const token = getSessionToken();
  if (!token || !budget?.serverId) return;
  try {
    await apiDeleteBudget(token, budget.serverId);
  } catch {
    // Local removal still takes effect; a later pull will reconcile the server.
  }
}

function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Sinkronisasi gagal';
}
