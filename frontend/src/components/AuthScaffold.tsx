import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { WalletMinimal } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { colors, radii, space } from '@/theme/tokens';

export function AuthScaffold({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.shell}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Catat Duit, kembali ke beranda"
            onPress={() => router.replace('/')}
            hitSlop={6}
            style={({ pressed }) => [styles.brand, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={styles.mark}>
              <WalletMinimal size={18} color={colors.primary} />
            </View>
            <AppText variant="bodyMd" weight="semiBold">
              Catat Duit
            </AppText>
          </Pressable>
          <AppText variant="labelSm" weight="medium" color={colors.textSubtle}>
            Akun
          </AppText>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <AppText variant="labelSm" color={colors.textSubtle}>
            Data keuanganmu, aman dan rapi.
          </AppText>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minWidth: 0,
  },
  mark: {
    width: 32,
    height: 32,
    borderRadius: radii.control,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.xxl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.lime,
  },
});
