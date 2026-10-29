export type CategoryType = 'expense' | 'income' | 'both';
export type TransactionType = 'expense' | 'income';
export type SyncStatus = 'local' | 'pending' | 'synced' | 'failed';
export type BudgetPeriod = 'daily' | 'monthly';

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  isArchived: boolean;
};

export type Transaction = {
  id: string;
  serverId: string | null;
  clientId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  note: string;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  syncError: string | null;
};

export type NewTransactionInput = {
  categoryId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  transactionDate: string;
};

export type UpdateTransactionInput = Partial<NewTransactionInput>;

export type Budget = {
  period: BudgetPeriod;
  amount: number;
  month: string | null;
  isActive: boolean;
  serverId: string | null;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  token: string;
  user: SessionUser;
};

export type RemoteTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  note: string | null;
  transactionDate: string;
  clientId: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
    isDefault: boolean;
  };
  createdAt: string;
  updatedAt: string;
};

export type RemoteCategory = {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  isArchived: boolean;
  usageCount: number;
  createdAt: string;
};

export type RemoteBudget = {
  id: string;
  period: BudgetPeriod;
  amount: number;
  month: string | null;
  isActive: boolean;
  createdAt: string;
};

export type MonthSummary = {
  month: string;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  todayExpense: number;
};

export type CategoryBreakdownItem = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
};

export type DailyTrendPoint = {
  date: string;
  income: number;
  expense: number;
  net: number;
};

export type MonthOption = {
  month: string;
  income: number;
  expense: number;
  transactionCount: number;
};

export type OutboxOperation = {
  id: number;
  op: 'create' | 'update' | 'delete';
  transactionId: string;
  serverId: string | null;
  createdAt: string;
  attempts: number;
  lastError: string | null;
};

export type TransactionFilters = {
  search?: string;
  type?: TransactionType | 'all';
  categoryId?: string | 'all';
  from?: string;
  to?: string;
  month?: string;
  limit?: number;
};
