import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts, type } from '@/theme/tokens';

type Variant = keyof typeof type;
type Weight = 'regular' | 'medium' | 'semiBold' | 'bold';

const weightFamily: Record<Weight, string> = {
  regular: fonts.body,
  medium: fonts.medium,
  semiBold: fonts.semiBold,
  bold: fonts.bold,
};

export type AppTextProps = TextProps & {
  variant?: Variant;
  weight?: Weight;
  color?: string;
  tabular?: boolean;
  align?: TextStyle['textAlign'];
};

export function AppText({
  variant = 'bodyMd',
  weight,
  color = colors.text,
  tabular = false,
  align,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        type[variant],
        weight ? { fontFamily: weightFamily[weight] } : null,
        { color },
        align ? { textAlign: align } : null,
        tabular ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
    />
  );
}
