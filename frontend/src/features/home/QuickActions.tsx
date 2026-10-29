import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowDownLeft, ArrowRight, Plus } from 'lucide-react-native';
import { AppText } from '@/components/AppText';
import { colors, radii, shadow, space } from '@/theme/tokens';

type QuickActionsProps = {
  onExpense: () => void;
  onIncome: () => void;
};

export function QuickActions({ onExpense, onIncome }: QuickActionsProps) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Catat pengeluaran"
        testID="new-expense"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onExpense();
        }}
        style={({ pressed }) => [
          styles.primary,
          shadow,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
        ]}
      >
        <View style={styles.plusCircle}>
          <Plus size={20} color={colors.primary} />
        </View>
        <AppText
          variant="bodySm"
          weight="semiBold"
          color={colors.onPrimary}
          numberOfLines={1}
          style={styles.primaryLabel}
        >
          Catat Pengeluaran
        </AppText>
        <ArrowRight size={18} color={colors.onPrimary} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Catat pemasukan"
        testID="new-income"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onIncome();
        }}
        style={({ pressed }) => [
          styles.secondary,
          { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
        ]}
      >
        <ArrowDownLeft size={18} color={colors.primary} />
        <AppText variant="labelSm" weight="semiBold" color={colors.primary}>
          Masuk
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
  },
  primary: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.primary,
    borderRadius: radii.control,
  },
  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  primaryLabel: {
    flex: 1,
    minWidth: 0,
  },
  secondary: {
    width: 84,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: radii.control,
    flexShrink: 0,
  },
});
