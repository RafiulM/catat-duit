import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { colors, radii, shadowRaised, space } from '@/theme/tokens';

export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
  accessibilityLabel?: string;
  scroll?: boolean;
};

export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  overlay,
  accessibilityLabel,
  scroll = true,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [mounted, setMounted] = useState(visible);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = useMemo(() => new Animated.Value(28), []);
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(Platform.OS === 'ios' ? event.endCoordinates.height : 0);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      // The sheet stays mounted while its exit animation finishes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      const duration = reduceMotion ? 0 : 240;
      translateY.setValue(reduceMotion ? 0 : 28);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: reduceMotion ? 0 : 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      const duration = reduceMotion ? 0 : 180;
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: reduceMotion ? 0 : 28,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, reduceMotion, translateY, opacity]);

  if (!mounted) return null;

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.flex}>
        <Animated.View style={[styles.backdrop, { opacity }]}>
          <Pressable
            style={styles.flex}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Tutup panel"
          />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel ?? title}
          style={[
            styles.panel,
            {
              paddingBottom:
                Math.max(insets.bottom, space.xl) + keyboardHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText
                variant="bodyLg"
                weight="medium"
                style={styles.title}
              >
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="labelSm" color={colors.textMuted} style={styles.subtitle}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup panel"
              onPress={close}
              hitSlop={8}
              style={({ pressed }) => [
                styles.close,
                { backgroundColor: pressed ? colors.surfaceMuted : colors.transparent },
              ]}
            >
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {scroll ? (
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
          {overlay}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '92%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radii.panel,
    borderTopRightRadius: radii.panel,
    ...shadowRaised,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: 'CalSans-Medium',
  },
  subtitle: {
    marginTop: 2,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: -4,
  },
  body: {
    marginTop: space.xl,
    flexShrink: 1,
  },
  bodyContent: {
    paddingBottom: space.xs,
  },
  footer: {
    paddingTop: space.lg,
    marginTop: space.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.canvas,
  },
});
