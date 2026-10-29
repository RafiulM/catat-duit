import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { colors, radii, space } from '@/theme/tokens';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <View
      style={[
        styles.container,
        compact ? styles.compact : null,
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon size={22} color={colors.primary} />
      </View>
      <AppText variant="bodyLg" weight="medium" style={styles.title}>
        {title}
      </AppText>
      <AppText
        variant="bodySm"
        color={colors.textMuted}
        align="center"
        style={styles.description}
      >
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: space.xxl,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.card,
  },
  compact: {
    padding: space.xl,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: space.lg,
    textAlign: 'center',
  },
  description: {
    marginTop: space.xs,
    maxWidth: 280,
  },
  action: {
    marginTop: space.xl,
  },
});
