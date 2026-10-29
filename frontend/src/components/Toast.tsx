import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Check, TriangleAlert, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { colors, radii, shadowRaised, space } from '@/theme/tokens';

export type ToastTone = 'success' | 'error' | 'info';

type ToastInput = {
  title: string;
  detail?: string;
  tone?: ToastTone;
};

type ToastItem = ToastInput & { id: number };

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
  dismissToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ ...input, id: Date.now() });
    timer.current = setTimeout(() => {
      setToast(null);
      timer.current = null;
    }, 4200);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastView toast={toast} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

function ToastView({
  toast,
  onDismiss,
}: {
  toast: ToastItem | null;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useMemo(() => new Animated.Value(16), []);
  const opacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (toast) {
      translateY.setValue(16);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toast, translateY, opacity]);

  if (!toast) return null;

  const isError = toast.tone === 'error';
  const Icon = isError ? TriangleAlert : Check;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        { bottom: Math.max(insets.bottom, space.md) + 72 },
      ]}
    >
      <Animated.View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            opacity,
            transform: [{ translateY }],
            backgroundColor: isError ? colors.danger : colors.text,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: isError ? colors.dangerSoft : colors.primary },
          ]}
        >
          <Icon size={16} color={isError ? colors.danger : colors.lime} />
        </View>
        <View style={styles.copy}>
          <AppText
            variant="bodySm"
            weight="semiBold"
            color={isError ? colors.canvas : colors.canvas}
          >
            {toast.title}
          </AppText>
          {toast.detail ? (
            <AppText
              variant="labelSm"
              color={isError ? colors.canvas : colors.mint}
              style={styles.detail}
            >
              {toast.detail}
            </AppText>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup notifikasi"
          onPress={onDismiss}
          hitSlop={10}
          style={styles.close}
        >
          <X size={14} color={isError ? colors.canvas : colors.mint} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    alignItems: 'center',
    zIndex: 70,
  },
  toast: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    padding: space.lg,
    borderRadius: radii.card,
    ...shadowRaised,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  detail: {
    marginTop: 2,
  },
  close: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
