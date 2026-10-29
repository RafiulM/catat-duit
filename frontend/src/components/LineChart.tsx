import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { AppText } from './AppText';
import { colors, space } from '@/theme/tokens';

export type ChartPoint = {
  value: number;
  label: string;
  accessibilityLabel?: string;
};

type LineChartProps = {
  points: ChartPoint[];
  height?: number;
  lineColor?: string;
  fillColor?: string;
  showEveryLabel?: boolean;
  labelIndexes?: number[];
  highlightIndex?: number;
  accessibilityLabel: string;
};

const TOP_PADDING = 10;
const BOTTOM_PADDING = 8;

export function LineChart({
  points,
  height = 120,
  lineColor = colors.primary,
  fillColor = colors.mint,
  showEveryLabel = false,
  labelIndexes,
  highlightIndex,
  accessibilityLabel,
}: LineChartProps) {
  const [width, setWidth] = useState(0);
  const chartWidth = Math.max(width, 1);
  const plotHeight = height - TOP_PADDING - BOTTOM_PADDING;
  const peak = Math.max(1000, ...points.map((point) => point.value)) * 1.05;

  const coordinates = points.map((point, index) => {
    const x =
      points.length === 1
        ? chartWidth / 2
        : 6 + (index * (chartWidth - 12)) / (points.length - 1);
    const y =
      TOP_PADDING + (1 - Math.min(point.value, peak) / peak) * plotHeight;
    return { x, y, point };
  });

  const linePath = coordinates
    .map((coordinate, index) =>
      `${index === 0 ? 'M' : 'L'} ${coordinate.x} ${coordinate.y}`,
    )
    .join(' ');
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const areaPath =
    first && last
      ? `M ${first.x} ${TOP_PADDING + plotHeight} L ${coordinates
          .map((coordinate) => `${coordinate.x} ${coordinate.y}`)
          .join(' L ')} L ${last.x} ${TOP_PADDING + plotHeight} Z`
      : '';

  const labelStep = showEveryLabel
    ? Math.max(1, Math.ceil(points.length / 6))
    : Math.max(1, Math.ceil(points.length / 7));
  const absoluteLabelIndexes = labelIndexes
    ? Array.from(new Set(labelIndexes))
        .filter((index) => index >= 0 && index < points.length)
        .sort((a, b) => a - b)
    : [];
  const highlighted = coordinates[highlightIndex ?? coordinates.length - 1];

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={{ height }} onLayout={onLayout}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            {[0.25, 0.5, 0.75].map((fraction) => {
              const y = TOP_PADDING + fraction * plotHeight;
              return (
                <Line
                  key={fraction}
                  x1={4}
                  x2={chartWidth - 4}
                  y1={y}
                  y2={y}
                  stroke={colors.borderSubtle}
                  strokeWidth={1}
                  strokeDasharray="2 6"
                />
              );
            })}
            <Line
              x1={4}
              x2={chartWidth - 4}
              y1={TOP_PADDING + plotHeight}
              y2={TOP_PADDING + plotHeight}
              stroke={colors.borderSubtle}
              strokeWidth={1}
            />
            {areaPath ? (
              <Path d={areaPath} fill={fillColor} fillOpacity={0.68} />
            ) : null}
            {linePath ? (
              <Path
                d={linePath}
                fill="none"
                stroke={lineColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {coordinates.slice(0, -1).map((coordinate) => (
              <Circle
                key={coordinate.point.label}
                cx={coordinate.x}
                cy={coordinate.y}
                r={2.4}
                fill={lineColor}
              />
            ))}
            {highlighted ? (
              <Circle
                cx={highlighted.x}
                cy={highlighted.y}
                r={4.5}
                fill={lineColor}
                stroke={colors.canvas}
                strokeWidth={2}
              />
            ) : null}
          </Svg>
        ) : null}
      </View>
      {labelIndexes ? (
        <View style={styles.absoluteLabels}>
          {absoluteLabelIndexes.map((index) => {
            const point = points[index];
            if (!point) return null;
            const x =
              points.length === 1
                ? chartWidth / 2
                : 6 + (index * (chartWidth - 12)) / (points.length - 1);
            return (
              <View
                key={`${point.label}-${index}`}
                style={[
                  styles.axisLabel,
                  { left: Math.max(0, Math.min(chartWidth - 32, x - 16)) },
                ]}
              >
                <AppText variant="labelSm" color={colors.textMuted} numberOfLines={1}>
                  {point.label}
                </AppText>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.labels}>
          {points.map((point, index) => {
            const isLast = index === points.length - 1;
            const show = isLast || index === 0 || index % labelStep === 0;
            return (
              <View
                key={`${point.label}-${index}`}
                style={[styles.labelCell, { opacity: show ? 1 : 0 }]}
              >
                <AppText
                  variant="labelSm"
                  weight={isLast ? 'semiBold' : 'regular'}
                  color={isLast ? colors.primary : colors.textMuted}
                  numberOfLines={1}
                >
                  {point.label}
                </AppText>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: 'row',
    marginTop: space.xs,
  },
  labelCell: {
    flex: 1,
    alignItems: 'center',
  },
  absoluteLabels: {
    position: 'relative',
    height: 16,
    marginTop: space.xs,
  },
  axisLabel: {
    position: 'absolute',
    width: 32,
    alignItems: 'center',
  },
});
