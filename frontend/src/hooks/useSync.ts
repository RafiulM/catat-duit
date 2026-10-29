import { useMutation } from '@tanstack/react-query';
import {
  removeBudgetFromServer,
  syncBudgetToServer,
  syncNow,
} from '@/services/sync';
import type { Budget } from '@/data/types';
import { invalidateLocalData } from '@/data/query-keys';

export function useSyncNow() {
  return useMutation({
    mutationFn: syncNow,
    onSettled: () => invalidateLocalData(),
  });
}

export function useSyncBudget() {
  return useMutation({
    mutationFn: (input: { budget: Budget; previous?: Budget | null }) =>
      syncBudgetToServer(input.budget, input.previous),
    onSettled: () => invalidateLocalData(),
  });
}

export function useRemoveBudget() {
  return useMutation({
    mutationFn: (budget: Budget | null) => removeBudgetFromServer(budget),
    onSettled: () => invalidateLocalData(),
  });
}
