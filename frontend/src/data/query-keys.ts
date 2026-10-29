import { queryClient } from '@/services/query-client';

export const queryKeys = {
  categories: ['categories'] as const,
  transactions: (filters?: unknown) =>
    ['transactions', filters ?? 'all'] as const,
  transaction: (id: string) => ['transaction', id] as const,
  summary: (month: string) => ['summary', month] as const,
  breakdown: (month: string, type: string) =>
    ['breakdown', month, type] as const,
  trend: (month: string) => ['trend', month] as const,
  months: ['months'] as const,
  budget: ['budget'] as const,
  pending: ['pending'] as const,
  lastSync: ['last-sync'] as const,
};

export function invalidateLocalData(): void {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['transaction'] });
  queryClient.invalidateQueries({ queryKey: ['summary'] });
  queryClient.invalidateQueries({ queryKey: ['breakdown'] });
  queryClient.invalidateQueries({ queryKey: ['trend'] });
  queryClient.invalidateQueries({ queryKey: ['months'] });
  queryClient.invalidateQueries({ queryKey: ['budget'] });
  queryClient.invalidateQueries({ queryKey: ['pending'] });
  queryClient.invalidateQueries({ queryKey: ['last-sync'] });
}
