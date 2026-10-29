import { getDatabase } from './db';
import { findCategory } from './categories';
import type {
  Budget,
  Category,
  CategoryBreakdownItem,
  CategoryType,
  DailyTrendPoint,
  MonthOption,
  MonthSummary,
  NewTransactionInput,
  OutboxOperation,
  Transaction,
  TransactionFilters,
  TransactionType,
  UpdateTransactionInput,
} from './types';
import { isSignedIn } from '@/services/session';
import {
  currentMonthKey,
  daysInMonth,
  endOfMonth,
  nowISO,
  startOfMonth,
  todayISO,
} from '@/utils/date';
import { createId } from '@/utils/id';

type CategoryRow = {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_default: number;
  is_archived: number;
  sort_order: number;
};

type TransactionRow = {
  id: string;
  server_id: string | null;
  client_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  note: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  sync_status: Transaction['syncStatus'];
  sync_error: string | null;
};

type OutboxRow = {
  id: number;
  op: OutboxOperation['op'];
  transaction_id: string;
  server_id: string | null;
  created_at: string;
  attempts: number;
  last_error: string | null;
};

type AggregateRow = {
  income: number;
  expense: number;
  count: number;
  income_count: number;
  expense_count: number;
  today_expense: number;
};

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    color: row.color,
    isDefault: row.is_default === 1,
    isArchived: row.is_archived === 1,
  };
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    serverId: row.server_id,
    clientId: row.client_id,
    categoryId: row.category_id,
    type: row.type,
    amount: Number(row.amount),
    note: row.note,
    transactionDate: row.transaction_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    syncError: row.sync_error,
  };
}

function mapOutbox(row: OutboxRow): OutboxOperation {
  return {
    id: row.id,
    op: row.op,
    transactionId: row.transaction_id,
    serverId: row.server_id,
    createdAt: row.created_at,
    attempts: row.attempts,
    lastError: row.last_error,
  };
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export async function listCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT * FROM categories
     WHERE is_archived = 0
     ORDER BY sort_order ASC, name ASC`,
  );
  return rows.map(mapCategory);
}

export async function listAllCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories ORDER BY sort_order ASC, name ASC',
  );
  return rows.map(mapCategory);
}

/** Keeps the locally owned palette for defaults and server data for custom rows. */
export async function upsertRemoteCategory(input: {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  isArchived: boolean;
}): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<CategoryRow>(
    'SELECT * FROM categories WHERE id = ?',
    [input.id],
  );
  if (existing) {
    // Default categories keep the local design palette; custom categories follow
    // the server value so edits made on another device are reflected here.
    const color = input.isDefault ? existing.color : input.color;
    await db.runAsync(
      `UPDATE categories
       SET name = ?, type = ?, icon = ?, color = ?, is_archived = ?, is_default = ?
       WHERE id = ?`,
      [
        input.name,
        input.type,
        input.icon,
        color,
        input.isArchived ? 1 : 0,
        input.isDefault ? 1 : 0,
        input.id,
      ],
    );
    return;
  }

  await db.runAsync(
    `INSERT INTO categories
      (id, name, type, icon, color, is_default, is_archived, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, 100)`,
    [
      input.id,
      input.name,
      input.type,
      input.icon,
      input.color,
      input.isDefault ? 1 : 0,
      input.isArchived ? 1 : 0,
    ],
  );
}

export async function ensureCategory(input: {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO categories
      (id, name, type, icon, color, is_default, is_archived, sort_order)
     VALUES (?, ?, ?, ?, ?, 0, 0, 100)`,
    [input.id, input.name, input.type, input.icon, input.color],
  );
}

/* -------------------------------------------------------------------------- */
/* Transactions                                                                */
/* -------------------------------------------------------------------------- */

export async function listTransactions(
  filters: TransactionFilters = {},
): Promise<Transaction[]> {
  const db = await getDatabase();
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim().toLowerCase()}%`;
    clauses.push('(LOWER(t.note) LIKE ? OR LOWER(c.name) LIKE ?)');
    params.push(term, term);
  }
  if (filters.type && filters.type !== 'all') {
    clauses.push('t.type = ?');
    params.push(filters.type);
  }
  if (filters.categoryId && filters.categoryId !== 'all') {
    clauses.push('t.category_id = ?');
    params.push(filters.categoryId);
  }
  if (filters.from) {
    clauses.push('t.transaction_date >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push('t.transaction_date <= ?');
    params.push(filters.to);
  }
  if (filters.month) {
    clauses.push('substr(t.transaction_date, 1, 7) = ?');
    params.push(filters.month);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = filters.limit ?? 500;
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT t.* FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     ${where}
     ORDER BY t.transaction_date DESC, t.created_at DESC
     LIMIT ?`,
    [...params, limit],
  );
  return rows.map(mapTransaction);
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE id = ?',
    [id],
  );
  return row ? mapTransaction(row) : null;
}

export async function findTransactionByClientId(
  clientId: string,
): Promise<Transaction | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE client_id = ?',
    [clientId],
  );
  return row ? mapTransaction(row) : null;
}

async function resolveNote(
  note: string | undefined,
  categoryId: string,
): Promise<string> {
  const trimmed = note?.trim();
  if (trimmed) return trimmed;
  const categories = await listAllCategories();
  return findCategory(categories, categoryId)?.name ?? 'Transaksi';
}

function queueCreateStatement(
  db: Awaited<ReturnType<typeof getDatabase>>,
  transactionId: string,
) {
  return db.runAsync(
    `INSERT INTO outbox (op, transaction_id, server_id, created_at)
     VALUES ('create', ?, NULL, ?)`,
    [transactionId, nowISO()],
  );
}

export async function createTransaction(
  input: NewTransactionInput,
): Promise<Transaction> {
  const db = await getDatabase();
  const now = nowISO();
  const id = createId();
  const clientId = createId();
  const note = await resolveNote(input.note, input.categoryId);
  const status: Transaction['syncStatus'] = isSignedIn() ? 'pending' : 'local';

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO transactions
        (id, server_id, client_id, category_id, type, amount, note,
         transaction_date, created_at, updated_at, sync_status, sync_error)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        id,
        clientId,
        input.categoryId,
        input.type,
        Math.round(input.amount),
        note,
        input.transactionDate,
        now,
        now,
        status,
      ],
    );
    if (status === 'pending') {
      await queueCreateStatement(db, id);
    }
  });

  const created = await getTransaction(id);
  if (!created) throw new Error('Transaksi gagal dibaca kembali');
  return created;
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const db = await getDatabase();
  const existing = await getTransaction(id);
  if (!existing) throw new Error('Transaksi tidak ditemukan');

  const now = nowISO();
  const nextCategoryId = input.categoryId ?? existing.categoryId;
  const nextNote =
    input.note !== undefined
      ? await resolveNote(input.note, nextCategoryId)
      : existing.note;
  const nextStatus: Transaction['syncStatus'] = existing.serverId
    ? 'pending'
    : existing.syncStatus === 'synced'
      ? 'pending'
      : existing.syncStatus;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE transactions
       SET category_id = ?, type = ?, amount = ?, note = ?,
           transaction_date = ?, updated_at = ?, sync_status = ?, sync_error = NULL
       WHERE id = ?`,
      [
        nextCategoryId,
        input.type ?? existing.type,
        input.amount !== undefined ? Math.round(input.amount) : existing.amount,
        nextNote,
        input.transactionDate ?? existing.transactionDate,
        now,
        nextStatus,
        id,
      ],
    );

    if (existing.serverId) {
      await db.runAsync(
        `DELETE FROM outbox WHERE transaction_id = ? AND op = 'update'`,
        [id],
      );
      await db.runAsync(
        `INSERT INTO outbox (op, transaction_id, server_id, created_at)
         VALUES ('update', ?, ?, ?)`,
        [id, existing.serverId, now],
      );
    } else {
      const queued = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM outbox WHERE transaction_id = ? AND op = 'create'`,
        [id],
      );
      if (!queued && isSignedIn()) {
        await queueCreateStatement(db, id);
      }
    }
  });

  const updated = await getTransaction(id);
  if (!updated) throw new Error('Transaksi gagal dibaca kembali');
  return updated;
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  const existing = await getTransaction(id);
  if (!existing) return;

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM outbox WHERE transaction_id = ?', [id]);
    if (existing.serverId) {
      await db.runAsync(
        `INSERT INTO outbox (op, transaction_id, server_id, created_at)
         VALUES ('delete', ?, ?, ?)`,
        [id, existing.serverId, nowISO()],
      );
    }
    await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  });
}

/* -------------------------------------------------------------------------- */
/* Sync bookkeeping                                                            */
/* -------------------------------------------------------------------------- */

export async function listOutbox(): Promise<OutboxOperation[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<OutboxRow>(
    'SELECT * FROM outbox ORDER BY id ASC',
  );
  return rows.map(mapOutbox);
}

export async function removeOutbox(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM outbox WHERE id = ?', [id]);
}

export async function failOutbox(
  id: number,
  message: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?',
    [message, id],
  );
}

export async function markTransactionSynced(
  id: string,
  serverId: string,
  remote: Partial<
    Pick<
      Transaction,
      'amount' | 'note' | 'transactionDate' | 'categoryId' | 'type'
    >
  > = {},
): Promise<void> {
  const existing = await getTransaction(id);
  if (!existing) return;
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE transactions
     SET server_id = ?, sync_status = 'synced', sync_error = NULL,
         amount = ?, note = ?, transaction_date = ?, category_id = ?, type = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      serverId,
      remote.amount !== undefined ? Math.round(remote.amount) : existing.amount,
      remote.note ?? existing.note,
      remote.transactionDate ?? existing.transactionDate,
      remote.categoryId ?? existing.categoryId,
      remote.type ?? existing.type,
      nowISO(),
      id,
    ],
  );
}

export async function markTransactionFailed(
  id: string,
  message: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE transactions SET sync_status = 'failed', sync_error = ? WHERE id = ?`,
    [message, id],
  );
}

export async function prepareLocalTransactionsForSync(): Promise<void> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions
     WHERE server_id IS NULL AND sync_status IN ('local', 'failed')`,
  );

  await db.withTransactionAsync(async () => {
    for (const row of rows) {
      const queued = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM outbox WHERE transaction_id = ? AND op = 'create'`,
        [row.id],
      );
      if (!queued) {
        await queueCreateStatement(db, row.id);
      }
      await db.runAsync(
        `UPDATE transactions SET sync_status = 'pending', sync_error = NULL
         WHERE id = ?`,
        [row.id],
      );
    }
  });
}

export async function pendingOperationCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM outbox',
  );
  return row?.count ?? 0;
}

/* -------------------------------------------------------------------------- */
/* Aggregates                                                                  */
/* -------------------------------------------------------------------------- */

export async function getMonthSummary(
  month = currentMonthKey(),
): Promise<MonthSummary> {
  const db = await getDatabase();
  const from = startOfMonth(month);
  const to = endOfMonth(month);
  const today = todayISO();
  const row = await db.getFirstAsync<AggregateRow>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
       COUNT(*) AS count,
       COALESCE(SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END), 0) AS income_count,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END), 0) AS expense_count,
       COALESCE(SUM(CASE WHEN type = 'expense' AND transaction_date = ? THEN amount ELSE 0 END), 0) AS today_expense
     FROM transactions
     WHERE transaction_date >= ? AND transaction_date <= ?`,
    [today, from, to],
  );

  const income = Number(row?.income ?? 0);
  const expense = Number(row?.expense ?? 0);
  return {
    month,
    income,
    expense,
    balance: income - expense,
    transactionCount: Number(row?.count ?? 0),
    incomeCount: Number(row?.income_count ?? 0),
    expenseCount: Number(row?.expense_count ?? 0),
    todayExpense: Number(row?.today_expense ?? 0),
  };
}

export async function getCategoryBreakdown(
  month: string,
  type: TransactionType,
): Promise<{ total: number; items: CategoryBreakdownItem[] }> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    category_id: string;
    name: string;
    icon: string;
    color: string;
    total: number;
    count: number;
  }>(
    `SELECT c.id AS category_id, c.name AS name, c.icon AS icon,
            c.color AS color, SUM(t.amount) AS total, COUNT(*) AS count
     FROM transactions t
     INNER JOIN categories c ON c.id = t.category_id
     WHERE t.type = ? AND t.transaction_date >= ? AND t.transaction_date <= ?
     GROUP BY c.id, c.name, c.icon, c.color
     ORDER BY total DESC`,
    [type, startOfMonth(month), endOfMonth(month)],
  );

  const total = rows.reduce((sum, row) => sum + Number(row.total), 0);
  const items = rows.map((row) => ({
    categoryId: row.category_id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    total: Number(row.total),
    count: Number(row.count),
    percentage: total > 0 ? (Number(row.total) / total) * 100 : 0,
  }));
  return { total, items };
}

export async function getDailyTrend(
  month: string,
): Promise<{ days: DailyTrendPoint[]; totalIncome: number; totalExpense: number }> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    date: string;
    type: TransactionType;
    total: number;
  }>(
    `SELECT transaction_date AS date, type, SUM(amount) AS total
     FROM transactions
     WHERE transaction_date >= ? AND transaction_date <= ?
     GROUP BY transaction_date, type`,
    [startOfMonth(month), endOfMonth(month)],
  );

  const totalsByDate = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const current = totalsByDate.get(row.date) ?? { income: 0, expense: 0 };
    current[row.type] = Number(row.total);
    totalsByDate.set(row.date, current);
  }

  const days = daysInMonth(month).map((date) => {
    const totals = totalsByDate.get(date) ?? { income: 0, expense: 0 };
    return {
      date,
      income: totals.income,
      expense: totals.expense,
      net: totals.income - totals.expense,
    };
  });

  return {
    days,
    totalIncome: days.reduce((sum, day) => sum + day.income, 0),
    totalExpense: days.reduce((sum, day) => sum + day.expense, 0),
  };
}

export async function getAvailableMonths(
  limit = 12,
): Promise<MonthOption[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    month: string;
    income: number;
    expense: number;
    count: number;
  }>(
    `SELECT substr(transaction_date, 1, 7) AS month,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
            COUNT(*) AS count
     FROM transactions
     GROUP BY month
     ORDER BY month DESC
     LIMIT ?`,
    [limit],
  );

  const items = rows.map((row) => ({
    month: row.month,
    income: Number(row.income),
    expense: Number(row.expense),
    transactionCount: Number(row.count),
  }));
  const current = currentMonthKey();
  if (!items.some((item) => item.month === current)) {
    items.unshift({
      month: current,
      income: 0,
      expense: 0,
      transactionCount: 0,
    });
  }
  return items.sort((a, b) => b.month.localeCompare(a.month)).slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Settings and budget                                                         */
/* -------------------------------------------------------------------------- */

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM settings WHERE key = ?', [key]);
}

export async function getBudget(): Promise<Budget | null> {
  const raw = await getSetting('budget');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Budget>;
    if (
      (parsed.period === 'daily' || parsed.period === 'monthly') &&
      typeof parsed.amount === 'number' &&
      parsed.amount > 0
    ) {
      return {
        period: parsed.period,
        amount: parsed.amount,
        month: parsed.month ?? null,
        isActive: parsed.isActive ?? true,
        serverId: parsed.serverId ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveBudget(budget: Budget): Promise<void> {
  await setSetting('budget', JSON.stringify(budget));
}

export async function getLastSyncAt(): Promise<string | null> {
  return getSetting('lastSyncAt');
}

export async function setLastSyncAt(value: string): Promise<void> {
  await setSetting('lastSyncAt', value);
}

/* -------------------------------------------------------------------------- */
/* Export                                                                      */
/* -------------------------------------------------------------------------- */

export async function listTransactionsForExport(
  from: string,
  to: string,
): Promise<
  {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    note: string;
  }[]
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    transaction_date: string;
    type: TransactionType;
    category_name: string;
    amount: number;
    note: string;
  }>(
    `SELECT t.transaction_date, t.type, c.name AS category_name,
            t.amount, t.note
     FROM transactions t
     INNER JOIN categories c ON c.id = t.category_id
     WHERE t.transaction_date >= ? AND t.transaction_date <= ?
     ORDER BY t.transaction_date ASC, t.created_at ASC`,
    [from, to],
  );

  return rows.map((row) => ({
    date: row.transaction_date,
    type: row.type,
    category: row.category_name,
    amount: Number(row.amount),
    note: row.note,
  }));
}

