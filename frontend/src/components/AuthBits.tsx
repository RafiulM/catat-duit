import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowLeft, type LucideIcon } from 'lucide-react-native';
import { AppText } from './AppText';
import { Card } from './Card';
import { colors, radii, space } from '@/theme/tokens';

export function AuthCard({ children }: { children: ReactNode }) {
  return <Card style={styles.card}>{children}</Card>;
}

export function AuthHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View>
      <AppText variant="labelSm" weight="semiBold" color={colors.textSubtle} style={styles.eyebrow}>
        {eyebrow.toUpperCase()}
      </AppText>
      <AppText variant="headingSm" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="bodySm" color={colors.textMuted}>
        {subtitle}
      </AppText>
    </View>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <AppText
      variant="labelSm"
      weight="medium"
      color={colors.danger}
      accessibilityLiveRegion="polite"
    >
      {message}
    </AppText>
  );
}

export function AuthNote({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <View style={styles.note}>
      <Icon size={16} color={colors.textMuted} />
      <AppText variant="labelSm" color={colors.textMuted} style={styles.noteText}>
        {children}
      </AppText>
    </View>
  );
}

export function AuthDivider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <AppText variant="labelSm" color={colors.textSubtle}>
        atau
      </AppText>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function AuthBackLink({
  label = 'Kembali ke masuk',
  onPress,
}: {
  label?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.back, { opacity: pressed ? 0.6 : 1 }]}
    >
      <ArrowLeft size={12} color={colors.primary} />
      <AppText variant="labelSm" weight="semiBold" color={colors.primary}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function AuthFooterLink({
  prefix,
  actionLabel,
  onAction,
}: {
  prefix: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.footer}>
      <AppText variant="labelSm" color={colors.textMuted}>
        {prefix}{' '}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onAction}
        hitSlop={6}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <AppText variant="labelSm" weight="semiBold" color={colors.primary}>
          {actionLabel}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.xxl,
    borderRadius: radii.panel,
  },
  eyebrow: {
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 2,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.control,
  },
  noteText: {
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginVertical: space.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    marginBottom: space.lg,
    paddingVertical: space.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: space.xl,
  },
});
