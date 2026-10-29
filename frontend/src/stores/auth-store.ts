import * as SecureStore from 'expo-secure-store';
import Storage from 'expo-sqlite/kv-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { resetLocalData } from '@/data/db';
import type { SessionUser } from '@/data/types';
import {
  ApiError,
  apiFetchMe,
  apiSignIn,
  apiSignOut,
  apiSignUp,
  apiUpdateProfile,
} from '@/services/api';
import { queryClient } from '@/services/query-client';
import { setSessionToken } from '@/services/session';

const TOKEN_KEY = 'catatduit.session.token';
const USER_KEY = 'catatduit.session.user';

type AuthStatus = 'loading' | 'guest' | 'authed';

type AuthState = {
  status: AuthStatus;
  user: SessionUser | null;
  token: string | null;
  error: string | null;
  busy: boolean;
  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  handleSessionExpired: () => Promise<void>;
  clearError: () => void;
};

async function readToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await Storage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function writeToken(token: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (token) await Storage.setItem(TOKEN_KEY, token);
      else await Storage.removeItem(TOKEN_KEY);
      return;
    }
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Token persistence failing should not crash the app; the session still
    // works for the current run.
  }
}

async function readCachedUser(): Promise<SessionUser | null> {
  try {
    const raw = await Storage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

async function writeCachedUser(user: SessionUser | null): Promise<void> {
  try {
    if (user) await Storage.setItem(USER_KEY, JSON.stringify(user));
    else await Storage.removeItem(USER_KEY);
  } catch {
    // Cache only.
  }
}

function messageFrom(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan. Coba lagi.';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,
  token: null,
  error: null,
  busy: false,

  bootstrap: async () => {
    const token = await readToken();
    const cachedUser = await readCachedUser();

    if (!token) {
      setSessionToken(null);
      set({ status: 'guest', token: null, user: null });
      return;
    }

    setSessionToken(token);
    set({
      status: cachedUser ? 'authed' : 'loading',
      token,
      user: cachedUser,
    });

    try {
      const user = await apiFetchMe(token);
      await writeCachedUser(user);
      set({ status: 'authed', user, token, error: null });
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        await get().handleSessionExpired();
        return;
      }
      if (cachedUser) {
        set({ status: 'authed', user: cachedUser, token });
        return;
      }
      // Offline with a token but no cached profile: keep the session so data
      // stays usable, and retry the profile later.
      set({ status: 'authed', token, user: null });
    }
  },

  signIn: async (email, password) => {
    set({ busy: true, error: null });
    try {
      const session = await apiSignIn({ email, password });
      setSessionToken(session.token);
      await writeToken(session.token);
      await writeCachedUser(session.user);
      queryClient.clear();
      set({
        status: 'authed',
        user: session.user,
        token: session.token,
        busy: false,
      });
    } catch (error) {
      set({ busy: false, error: messageFrom(error) });
      throw error;
    }
  },

  signUp: async (name, email, password) => {
    set({ busy: true, error: null });
    try {
      const session = await apiSignUp({ name, email, password });
      setSessionToken(session.token);
      await writeToken(session.token);
      await writeCachedUser(session.user);
      queryClient.clear();
      set({
        status: 'authed',
        user: session.user,
        token: session.token,
        busy: false,
      });
    } catch (error) {
      set({ busy: false, error: messageFrom(error) });
      throw error;
    }
  },

  signOut: async () => {
    const token = get().token;
    set({ busy: true });
    if (token) {
      try {
        await apiSignOut(token);
      } catch {
        // Signing out must work offline too.
      }
    }

    setSessionToken(null);
    await writeToken(null);
    await writeCachedUser(null);
    await resetLocalData();
    queryClient.clear();
    set({
      status: 'guest',
      user: null,
      token: null,
      busy: false,
      error: null,
    });
  },

  refreshUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const user = await apiFetchMe(token);
      await writeCachedUser(user);
      set({ user, error: null });
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        await get().handleSessionExpired();
      }
    }
  },

  updateProfile: async (name) => {
    const token = get().token;
    if (!token) throw new Error('Masuk dulu untuk mengubah profil.');
    const user = await apiUpdateProfile(token, { name });
    await writeCachedUser(user);
    set({ user, error: null });
  },

  handleSessionExpired: async () => {
    setSessionToken(null);
    await writeToken(null);
    await writeCachedUser(null);
    await resetLocalData();
    queryClient.clear();
    set({
      status: 'guest',
      user: null,
      token: null,
      busy: false,
      error: 'Sesi berakhir. Silakan masuk lagi.',
    });
  },

  clearError: () => set({ error: null }),
}));
