import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
} from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/Toast';
import { getDatabase } from '@/data/db';
import { useSyncLifecycle } from '@/hooks/useSyncLifecycle';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    'CalSans-Medium': require('../../assets/fonts/CalSansText-Medium.ttf'),
    'CalSans-SemiBold': require('../../assets/fonts/CalSansText-SemiBold.ttf'),
  });
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDatabase()
      .then(() => {
        if (active) setDbReady(true);
      })
      .catch((error: unknown) => {
        if (active) {
          setDbError(
            error instanceof Error ? error.message : 'Database lokal gagal dibuka.',
          );
        }
      });
    void useAuthStore.getState().bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && (dbReady || dbError)) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError, dbReady, dbError]);

  if (dbError) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorTitle}>Catat Duit belum bisa dibuka</Text>
        <Text style={styles.errorCopy}>{dbError}</Text>
        <Text style={styles.errorCopy}>
          Tutup lalu buka lagi aplikasi. Data di perangkat tidak dihapus.
        </Text>
      </View>
    );
  }

  if ((!fontsLoaded && !fontError) || !dbReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  useSyncLifecycle();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen
        name="auth/masuk"
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="auth/daftar"
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="auth/lupa-sandi"
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="auth/reset-password"
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="auth/email-verified"
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="pengaturan/kategori"
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.surface,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});
