import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { AppText } from './AppText';
import { colors, radii, shadow, space } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dangerSolid';
type Size = 'md' | 'sm';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: ViewStyle;
};

const palette: Record<
  Variant,
  { background: string; border: string; text: string; icon: string }
> = {
  primary: {
    background: colors.primary,
    border: colors.primary,
    text: colors.onPrimary,
    icon: colors.lime,
  },
  secondary: {
    background: colors.mint,
    border: colors.mint,
    text: colors.primary,
    icon: colors.primary,
  },
  outline: {
    background: colors.canvas,
    border: colors.border,
    text: colors.text,
    icon: colors.text,
  },
  ghost: {
    background: colors.transparent,
    border: colors.transparent,
    text: colors.primary,
    icon: colors.primary,
  },
  danger: {
    background: colors.dangerSoft,
    border: colors.dangerSoft,
    text: colors.danger,
    icon: colors.danger,
  },
  dangerSolid: {
    background: colors.danger,
    border: colors.danger,
    text: colors.canvas,
    icon: colors.canvas,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  testID,
  style,
}: ButtonProps) {
  const tone = palette[variant];
  const height = size === 'md' ? 48 : 40;
  const iconSize = size === 'md' ? 18 : 16;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      testID={testID}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          paddingHorizontal: size === 'md' ? space.xxl : space.xl,
          borderRadius: radii.control,
          backgroundColor: disabled ? colors.surfaceMuted : tone.background,
          borderColor: disabled ? colors.borderSubtle : tone.border,
          opacity: pressed && !disabled ? 0.86 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
        variant === 'primary' && !disabled ? shadow : null,
        fullWidth ? styles.fullWidth : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tone.text} />
      ) : (
        <View style={styles.content}>
          {Icon && iconPosition === 'left' ? (
            <Icon color={disabled ? colors.textDisabled : tone.icon} size={iconSize} />
          ) : null}
          <AppText
            variant={size === 'md' ? 'bodySm' : 'labelSm'}
            weight="semiBold"
            color={disabled ? colors.textDisabled : tone.text}
            numberOfLines={1}
          >
            {label}
          </AppText>
          {Icon && iconPosition === 'right' ? (
            <Icon color={disabled ? colors.textDisabled : tone.icon} size={iconSize} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  fullWidth: {
    width: '100%',
  },
});
