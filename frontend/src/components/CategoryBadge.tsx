import { StyleSheet, View } from 'react-native';
import { CATEGORY_ICONS } from '@/data/categories';
import type { Category } from '@/data/types';
import { colors, radii } from '@/theme/tokens';
import { Shapes } from 'lucide-react-native';

type CategoryBadgeProps = {
  category?: Pick<Category, 'icon' | 'color'>;
  size?: number;
  radius?: number;
};

export function CategoryBadge({
  category,
  size = 36,
  radius = radii.control,
}: CategoryBadgeProps) {
  const Icon = CATEGORY_ICONS[category?.icon ?? 'shapes'] ?? Shapes;
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: category?.color ?? colors.surfaceMuted,
        },
      ]}
    >
      <Icon size={Math.round(size * 0.48)} color={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
