import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '@/data/repository';
import { invalidateLocalData } from '@/data/query-keys';
import type {
  NewTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from '@/data/types';
import { isSignedIn } from '@/services/session';
import { syncNow } from '@/services/sync';

function flushInBackground(): void {
  if (!isSignedIn()) return;
  void syncNow({ pull: false });
}

export async function addTransaction(
  input: NewTransactionInput,
): Promise<Transaction> {
  const transaction = await createTransaction(input);
  invalidateLocalData();
  flushInBackground();
  return transaction;
}

export async function editTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const transaction = await updateTransaction(id, input);
  invalidateLocalData();
  flushInBackground();
  return transaction;
}

export async function removeTransaction(id: string): Promise<void> {
  await deleteTransaction(id);
  invalidateLocalData();
  flushInBackground();
}
