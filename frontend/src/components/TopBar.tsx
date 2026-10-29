import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  CloudCheck,
  CloudOff,
  HardDrive,
  UserRound,
  WalletMinimal,
} from 'lucide-react-native';
import { AppText } from './AppText';
import { usePendingCount } from '@/hooks/useData';
import { useAuthStore } from '@/stores/auth-store';
import { colors, radii, space } from '@/theme/tokens';
import { initialOf } from '@/utils/format';

export function TopBar() {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const { data: pending = 0 } = usePendingCount();
  const authed = status === 'authed';
  const hasPending = authed && pending > 0;

  const openSettings = () => router.push('/pengaturan');

  const syncLabel = authed
    ? hasPending
      ? `${pending} menunggu`
      : 'Tersimpan'
    : 'Lokal';
  const syncDescription = authed
    ? hasPending
      ? `${pending} perubahan menunggu koneksi. Buka pengaturan.`
      : 'Semua catatan tersimpan di server. Buka pengaturan.'
    : 'Catatan tersimpan di perangkat ini. Masuk untuk mencadangkan ke server.';

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Catat Duit, ke beranda"
          onPress={() => router.navigate('/')}
          style={styles.brand}
        >
          <View style={styles.brandMark}>
            <WalletMinimal size={18} color={colors.primary} />
          </View>
          <AppText variant="bodyMd" weight="semiBold" numberOfLines={1}>
            Catat Duit
          </AppText>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={syncDescription}
            onPress={openSettings}
            hitSlop={6}
            style={({ pressed }) => [
              styles.syncChip,
              authed
                ? hasPending
                  ? styles.syncPending
                  : styles.syncSynced
                : styles.syncLocal,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {authed ? (
              hasPending ? (
                <CloudOff size={12} color={colors.warning} />
              ) : (
                <CloudCheck size={12} color={colors.positive} />
              )
            ) : (
              <HardDrive size={12} color={colors.textSubtle} />
            )}
            <AppText
              variant="labelSm"
              weight="semiBold"
              color={
                authed
                  ? hasPending
                    ? colors.warning
                    : colors.positive
                  : colors.textSubtle
              }
              numberOfLines={1}
            >
              {syncLabel}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              user ? `Buka profil ${user.name}` : 'Buka pengaturan akun'
            }
            onPress={openSettings}
            hitSlop={6}
            style={({ pressed }) => [
              styles.avatar,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {user ? (
              <AppText variant="labelSm" weight="semiBold" color={colors.primary}>
                {initialOf(user.name)}
              </AppText>
            ) : (
              <UserRound size={16} color={colors.primary} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  inner: {
    minHeight: 56,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minWidth: 0,
    flexShrink: 1,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: radii.control,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    flexShrink: 0,
  },
  syncChip: {
    minHeight: 32,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  syncPending: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  syncSynced: {
    backgroundColor: colors.positiveSoft,
    borderColor: colors.positive,
  },
  syncLocal: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSubtle,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
