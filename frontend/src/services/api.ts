import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type {
  AuthSession,
  BudgetPeriod,
  CategoryType,
  RemoteBudget,
  RemoteCategory,
  RemoteTransaction,
  SessionUser,
  TransactionType,
} from '@/data/types';

const defaultApiUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

const LOOPBACK_URL = /^(https?:\/\/)(localhost|127\.0\.0\.1|10\.0\.2\.2)(?=[:/]|$)/i;

/**
 * Di perangkat fisik (Expo Go), `localhost` menunjuk ke HP itu sendiri.
 * Saat development, ganti host loopback dengan IP komputer yang menjalankan
 * Metro (diambil dari `hostUri`), supaya backend di komputer yang sama
 * bisa dijangkau lewat jaringan LAN.
 */
function resolveDevHost(url: string): string {
  if (!__DEV__ || Platform.OS === 'web' || !LOOPBACK_URL.test(url)) return url;
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (!devHost || devHost === 'localhost' || devHost.endsWith('.exp.direct')) {
    return url;
  }
  return url.replace(LOOPBACK_URL, `$1${devHost}`);
}

export const API_URL = resolveDevHost(
  (process.env.EXPO_PUBLIC_API_URL?.trim() || defaultApiUrl).replace(/\/+$/, ''),
);

const REQUEST_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  authCode?: string;

  constructor(input: {
    message: string;
    status: number;
    code?: string;
    details?: unknown;
    authCode?: string;
  }) {
    super(input.message);
    this.name = 'ApiError';
    this.status = input.status;
    this.code = input.code ?? 'REQUEST_FAILED';
    this.details = input.details;
    this.authCode = input.authCode;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

type Envelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractError(payload: unknown, status: number): ApiError {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const nested = record.error;
    if (nested && typeof nested === 'object') {
      const error = nested as Record<string, unknown>;
      return new ApiError({
        message:
          typeof error.message === 'string'
            ? error.message
            : 'Permintaan tidak dapat diproses.',
        code: typeof error.code === 'string' ? error.code : 'REQUEST_FAILED',
        details: error.details,
        status,
      });
    }
    if (typeof record.message === 'string') {
      return new ApiError({
        message: record.message,
        code: typeof record.code === 'string' ? record.code : 'REQUEST_FAILED',
        status,
        details: record.details,
        authCode: typeof record.code === 'string' ? record.code : undefined,
      });
    }
  }
  return new ApiError({
    message:
      status >= 500
        ? 'Server sedang bermasalah. Coba lagi sebentar lagi.'
        : 'Permintaan tidak dapat diproses.',
    status,
  });
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: Record<string, unknown>; response: Response }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: 'omit',
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new ApiError({
      message: aborted
        ? 'Koneksi terlalu lama. Periksa jaringan lalu coba lagi.'
        : 'Tidak bisa menghubungi server. Periksa koneksi internetmu.',
      status: 0,
      code: 'NETWORK_ERROR',
    });
  }
  clearTimeout(timeout);

  const payload = await parseBody(response);

  if (!response.ok) {
    throw extractError(payload, response.status);
  }

  if (response.status === 204) {
    return { data: null as T, response };
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in (payload as Record<string, unknown>)
  ) {
    const envelope = payload as Envelope<T>;
    return { data: envelope.data, meta: envelope.meta, response };
  }

  return { data: payload as T, response };
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

type AuthApiPayload = {
  user?: SessionUser;
  token?: string;
};

async function authCall(
  path: string,
  body: unknown,
): Promise<{ token: string; user: SessionUser }> {
  const result = await apiRequest<AuthApiPayload>(`/api/auth${path}`, {
    method: 'POST',
    body,
  });
  const token =
    result.response.headers.get('set-auth-token') ??
    result.data?.token ??
    null;
  const user = result.data?.user;
  if (!token || !user) {
    throw new ApiError({
      message: 'Server tidak mengembalikan sesi yang valid.',
      status: 500,
      code: 'INVALID_AUTH_RESPONSE',
    });
  }
  return { token, user };
}

export async function apiSignUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthSession> {
  const result = await authCall('/sign-up/email', input);
  return { token: result.token, user: result.user };
}

export async function apiSignIn(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const result = await authCall('/sign-in/email', input);
  return { token: result.token, user: result.user };
}

export async function apiSignOut(token: string): Promise<void> {
  await apiRequest('/api/auth/sign-out', {
    method: 'POST',
    token,
    body: {},
  });
}

export async function apiRequestPasswordReset(email: string): Promise<void> {
  await apiRequest('/api/auth/request-password-reset', {
    method: 'POST',
    body: { email, redirectTo: 'catatduit://auth/reset-password' },
  });
}

export async function apiResetPassword(input: {
  token: string;
  newPassword: string;
}): Promise<void> {
  await apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: input,
  });
}

export async function apiFetchMe(token: string): Promise<SessionUser> {
  const result = await apiRequest<SessionUser>('/api/v1/me', { token });
  return result.data;
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                  */
/* -------------------------------------------------------------------------- */

export async function apiFetchCategories(token: string): Promise<RemoteCategory[]> {
  const result = await apiRequest<RemoteCategory[]>('/api/v1/categories', {
    token,
  });
  return result.data;
}

/* -------------------------------------------------------------------------- */
/* Transactions                                                                */
/* -------------------------------------------------------------------------- */

export async function apiFetchTransactions(
  token: string,
  params: { page?: number; limit?: number; month?: string } = {},
): Promise<{
  data: RemoteTransaction[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 100));
  query.set('sort', 'date_desc');
  if (params.month) query.set('month', params.month);

  const result = await apiRequest<RemoteTransaction[]>(
    `/api/v1/transactions?${query.toString()}`,
    { token },
  );
  const meta = result.meta as
    | {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
      }
    | undefined;

  return {
    data: result.data,
    meta: meta ?? {
      page: params.page ?? 1,
      limit: params.limit ?? 100,
      total: result.data.length,
      totalPages: 1,
      hasNextPage: false,
    },
  };
}

export async function apiCreateTransaction(
  token: string,
  input: {
    categoryId: string;
    type: TransactionType;
    amount: number;
    note?: string;
    transactionDate: string;
    clientId: string;
  },
): Promise<RemoteTransaction> {
  const result = await apiRequest<RemoteTransaction>('/api/v1/transactions', {
    method: 'POST',
    token,
    body: input,
  });
  return result.data;
}

export async function apiUpdateTransaction(
  token: string,
  id: string,
  input: {
    categoryId?: string;
    type?: TransactionType;
    amount?: number;
    note?: string;
    transactionDate?: string;
  },
): Promise<RemoteTransaction> {
  const result = await apiRequest<RemoteTransaction>(
    `/api/v1/transactions/${id}`,
    { method: 'PATCH', token, body: input },
  );
  return result.data;
}

export async function apiDeleteTransaction(
  token: string,
  id: string,
): Promise<void> {
  await apiRequest(`/api/v1/transactions/${id}`, {
    method: 'DELETE',
    token,
  });
}

/* -------------------------------------------------------------------------- */
/* Budgets                                                                     */
/* -------------------------------------------------------------------------- */

export async function apiFetchBudgets(
  token: string,
  params: { activeOnly?: boolean; period?: BudgetPeriod } = {},
): Promise<RemoteBudget[]> {
  const query = new URLSearchParams();
  if (params.activeOnly !== undefined) {
    query.set('activeOnly', String(params.activeOnly));
  }
  if (params.period) query.set('period', params.period);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const result = await apiRequest<RemoteBudget[]>(
    `/api/v1/budgets${suffix}`,
    { token },
  );
  return result.data;
}

export async function apiCreateBudget(
  token: string,
  input: {
    period: BudgetPeriod;
    amount: number;
    month?: string | null;
    isActive?: boolean;
  },
): Promise<RemoteBudget> {
  const result = await apiRequest<RemoteBudget>('/api/v1/budgets', {
    method: 'POST',
    token,
    body: {
      period: input.period,
      amount: input.amount,
      month: input.month ?? null,
      isActive: input.isActive ?? true,
    },
  });
  return result.data;
}

export async function apiUpdateBudget(
  token: string,
  id: string,
  input: { amount?: number; isActive?: boolean },
): Promise<RemoteBudget> {
  const result = await apiRequest<RemoteBudget>(`/api/v1/budgets/${id}`, {
    method: 'PATCH',
    token,
    body: input,
  });
  return result.data;
}

export async function apiDeleteBudget(token: string, id: string): Promise<void> {
  await apiRequest(`/api/v1/budgets/${id}`, {
    method: 'DELETE',
    token,
  });
}

/* -------------------------------------------------------------------------- */
/* Categories (write)                                                          */
/* -------------------------------------------------------------------------- */

export async function apiCreateCategory(
  token: string,
  input: {
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
  },
): Promise<RemoteCategory> {
  const result = await apiRequest<RemoteCategory>('/api/v1/categories', {
    method: 'POST',
    token,
    body: input,
  });
  return result.data;
}

export async function apiUpdateCategory(
  token: string,
  id: string,
  input: {
    name?: string;
    type?: CategoryType;
    icon?: string;
    color?: string;
    isArchived?: boolean;
  },
): Promise<RemoteCategory> {
  const result = await apiRequest<RemoteCategory>(`/api/v1/categories/${id}`, {
    method: 'PATCH',
    token,
    body: input,
  });
  return result.data;
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

export async function apiUpdateProfile(
  token: string,
  input: { name?: string; image?: string | null },
): Promise<SessionUser> {
  const result = await apiRequest<SessionUser>('/api/v1/me', {
    method: 'PATCH',
    token,
    body: input,
  });
  return result.data;
}

export async function apiChangeEmail(
  token: string,
  newEmail: string,
): Promise<string> {
  const result = await apiRequest<{ status: boolean; message: string }>(
    '/api/v1/me/email',
    {
      method: 'POST',
      token,
      body: { newEmail },
    },
  );
  return result.data.message;
}

export type { CategoryType };
