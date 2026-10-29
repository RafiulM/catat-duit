import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radii, shadow, space } from '@/theme/tokens';

type CardProps = ViewProps & {
  padded?: boolean;
  tone?: 'canvas' | 'surface' | 'muted' | 'mint' | 'primary';
};

export function Card({
  padded = true,
  tone = 'canvas',
  style,
  children,
  ...rest
}: CardProps) {
  const toneStyle =
    tone === 'primary'
      ? { backgroundColor: colors.primary, borderColor: colors.primary }
      : tone === 'mint'
        ? { backgroundColor: colors.mint, borderColor: colors.mint }
        : tone === 'muted'
          ? { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle }
          : tone === 'surface'
            ? { backgroundColor: colors.surface, borderColor: colors.borderSubtle }
            : { backgroundColor: colors.canvas, borderColor: colors.borderSubtle };

  return (
    <View
      {...rest}
      style={[
        styles.base,
        toneStyle,
        padded ? styles.padded : null,
        tone === 'canvas' ? shadow : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radii.card,
  },
  padded: {
    padding: space.xl,
  },
});
