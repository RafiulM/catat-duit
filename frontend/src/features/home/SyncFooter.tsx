import { Pressable, StyleSheet, View } from 'react-native';
import { CloudCheck, CloudOff, HardDrive } from 'lucide-react-native';
import { AppText } from '@/components/AppText';
import { colors, space } from '@/theme/tokens';

type SyncFooterProps = {
  authed: boolean;
  pending: number;
  onPress?: () => void;
};

export function SyncFooter({ authed, pending, onPress }: SyncFooterProps) {
  const pendingState = authed && pending > 0;
  const Icon = !authed ? HardDrive : pendingState ? CloudOff : CloudCheck;
  const color = !authed
    ? colors.textMuted
    : pendingState
      ? colors.warning
      : colors.positive;
  const copy = !authed
    ? 'Catatan aman di perangkat ini. Masuk untuk mencadangkan ke server.'
    : pendingState
      ? `${pending} perubahan menunggu jaringan. Data tetap aman di perangkat ini.`
      : 'Semua catatan sudah tersimpan di server.';

  const content = (
    <View style={styles.row}>
      <Icon size={14} color={color} style={styles.icon} />
      <AppText variant="labelSm" color={colors.textSubtle} style={styles.copy}>
        {copy}
      </AppText>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    marginTop: space.lg,
    paddingHorizontal: space.xs,
  },
  icon: {
    marginTop: 2,
  },
  copy: {
    flex: 1,
  },
});
