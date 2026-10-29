import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, radii, space } from '@/theme/tokens';

type ChipProps = {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  icon?: LucideIcon;
  tone?: 'default' | 'mint' | 'warning';
  style?: ViewStyle;
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function Chip({
  label,
  onPress,
  selected = false,
  icon: Icon,
  tone = 'default',
  style,
  accessibilityLabel,
  disabled = false,
}: ChipProps) {
  const selectedBackground =
    tone === 'warning' ? colors.warningSoft : tone === 'mint' ? colors.mint : colors.mint;
  const selectedText =
    tone === 'warning' ? colors.warning : colors.primary;

  const content = (
    <View style={styles.content}>
      {Icon ? (
        <Icon
          size={14}
          color={selected ? selectedText : colors.textMuted}
        />
      ) : null}
      <AppText
        variant="labelSm"
        weight="semiBold"
        color={selected ? selectedText : colors.textMuted}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </View>
  );

  if (!onPress) {
    return (
      <View
        style={[
          styles.base,
          selected
            ? { backgroundColor: selectedBackground, borderColor: selectedBackground }
            : { backgroundColor: colors.canvas, borderColor: colors.borderSubtle },
          style,
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        selected
          ? { backgroundColor: selectedBackground, borderColor: selectedBackground }
          : { backgroundColor: colors.canvas, borderColor: colors.borderSubtle },
        { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
});
