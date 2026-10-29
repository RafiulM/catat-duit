import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import type { CategoryBreakdownItem } from '@/data/types';
import { AppText } from './AppText';
import { colors, radii, space } from '@/theme/tokens';
import { formatRupiah } from '@/utils/format';

type DonutChartProps = {
  items: CategoryBreakdownItem[];
  total: number;
  size?: number;
  label: string;
};

export function DonutChart({
  items,
  total,
  size = 168,
  label,
}: DonutChartProps) {
  const strokeWidth = Math.round(size * 0.115);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const segments = items.map((item, index) => {
    const length = (item.percentage / 100) * circumference;
    const offset = -items
      .slice(0, index)
      .reduce(
        (sum, previous) => sum + (previous.percentage / 100) * circumference,
        0,
      );
    return { item, length, offset };
  });

  const description = items
    .slice(0, 4)
    .map((item) => `${item.name} ${Math.round(item.percentage)}%`)
    .join(', ');

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label}. ${description || 'Belum ada data'}`}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.borderSubtle}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {segments.map(({ item, length, offset }) => (
            <Circle
              key={item.categoryId}
              cx={center}
              cy={center}
              r={radius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={[Math.max(length - 2, 0), circumference]}
              strokeDashoffset={offset}
              fill="none"
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
      <View style={styles.center}>
        <AppText variant="labelSm" color={colors.textMuted} align="center">
          Total
        </AppText>
        <AppText
          variant="bodyMd"
          weight="semiBold"
          tabular
          align="center"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatRupiah(total)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxxl,
    borderRadius: radii.pill,
  },
  value: {
    fontFamily: 'CalSans-Medium',
  },
});
