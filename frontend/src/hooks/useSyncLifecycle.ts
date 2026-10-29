import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { useAuthStore } from '@/stores/auth-store';
import { useNetworkStore } from '@/stores/network-store';
import { syncNow } from '@/services/sync';

export function useSyncLifecycle(): void {
  const status = useAuthStore((state) => state.status);
  const setOnline = useNetworkStore((state) => state.setOnline);
  const initialSync = useRef(false);
  const previousOnline = useRef(useNetworkStore.getState().online);

  useEffect(() => {
    let active = true;
    let subscription: { remove: () => void } | undefined;

    Network.getNetworkStateAsync()
      .then((state) => {
        if (!active) return;
        setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
      })
      .catch(() => {
        if (active) setOnline(false);
      });

    subscription = Network.addNetworkStateListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [setOnline]);

  useEffect(() => {
    const online = useNetworkStore.getState().online;
    if (
      status === 'authed' &&
      online &&
      !initialSync.current
    ) {
      initialSync.current = true;
      void syncNow();
    }
    if (status === 'guest') {
      initialSync.current = false;
    }
  }, [status]);

  useEffect(() => {
    return useNetworkStore.subscribe((state) => {
      const cameBackOnline = state.online && !previousOnline.current;
      previousOnline.current = state.online;
      if (
        cameBackOnline &&
        useAuthStore.getState().status === 'authed'
      ) {
        void syncNow();
      }
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        nextState === 'active' &&
        useAuthStore.getState().status === 'authed' &&
        useNetworkStore.getState().online
      ) {
        void syncNow();
      }
    });
    return () => subscription.remove();
  }, []);
}
