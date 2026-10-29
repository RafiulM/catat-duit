import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, radii, space } from '@/theme/tokens';

type ProgressBarProps = {
  percent: number;
  height?: number;
  trackColor?: string;
  showGradient?: boolean;
};

export function ProgressBar({
  percent,
  height = 6,
  trackColor = colors.primaryActive,
  showGradient = true,
}: ProgressBarProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={[
        styles.track,
        { height, borderRadius: radii.pill, backgroundColor: trackColor },
      ]}
    >
      {clamped > 0 ? (
        <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`grad-${id}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#B8B8FF" />
              <Stop offset="0.5" stopColor="#51E0CD" />
              <Stop offset="1" stopColor="#B8B8FF" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={clamped}
            height={height}
            rx={height / 2}
            fill={showGradient ? `url(#grad-${id})` : colors.mint}
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    marginTop: space.md,
  },
});
