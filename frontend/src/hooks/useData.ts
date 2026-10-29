import { useQuery } from '@tanstack/react-query';
import {
  getAvailableMonths,
  getBudget,
  getCategoryBreakdown,
  getDailyTrend,
  getLastSyncAt,
  getMonthSummary,
  getTransaction,
  listCategories,
  listTransactions,
  pendingOperationCount,
} from '@/data/repository';
import { queryKeys } from '@/data/query-keys';
import type { TransactionFilters, TransactionType } from '@/data/types';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: listCategories,
  });
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => listTransactions(filters),
  });
}

export function useTransaction(id: string | null) {
  return useQuery({
    queryKey: queryKeys.transaction(id ?? ''),
    queryFn: () => getTransaction(id as string),
    enabled: Boolean(id),
  });
}

export function useMonthSummary(month: string) {
  return useQuery({
    queryKey: queryKeys.summary(month),
    queryFn: () => getMonthSummary(month),
  });
}

export function useCategoryBreakdown(
  month: string,
  type: TransactionType = 'expense',
) {
  return useQuery({
    queryKey: queryKeys.breakdown(month, type),
    queryFn: () => getCategoryBreakdown(month, type),
  });
}

export function useDailyTrend(month: string) {
  return useQuery({
    queryKey: queryKeys.trend(month),
    queryFn: () => getDailyTrend(month),
  });
}

export function useAvailableMonths() {
  return useQuery({
    queryKey: queryKeys.months,
    queryFn: () => getAvailableMonths(12),
  });
}

export function useBudget() {
  return useQuery({
    queryKey: queryKeys.budget,
    queryFn: getBudget,
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: queryKeys.pending,
    queryFn: pendingOperationCount,
  });
}

export function useLastSyncAt() {
  return useQuery({
    queryKey: queryKeys.lastSync,
    queryFn: getLastSyncAt,
  });
}
