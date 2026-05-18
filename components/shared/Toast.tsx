import React, {
  createContext, useContext, useState, useCallback,
  useRef, useEffect,
} from 'react';
import {
  View, Text, Animated, StyleSheet,
  TouchableOpacity, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// ─── Types ──────────────────────────────────────────────────────────────────
type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
}

// ─── Config ─────────────────────────────────────────────────────────────────
const VARIANT_CONFIG: Record<ToastVariant, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: { bg: '#F0FDF4', border: '#86EFAC', icon: 'check-circle', iconColor: '#16A34A' },
  error:   { bg: '#FEF2F2', border: '#FCA5A5', icon: 'x-circle',     iconColor: '#DC2626' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', icon: 'alert-triangle', iconColor: '#D97706' },
  info:    { bg: '#EFF6FF', border: '#93C5FD', icon: 'info',          iconColor: '#2563EB' },
};

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 280, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: Platform.OS !== 'web' }),
    ]).start(() => setToast(null));
  }, [translateY, opacity]);

  const showToast = useCallback(
    ({ message, title, variant = 'success', duration = 3000 }: ToastOptions) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, title, variant, duration });
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 60, friction: 10, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
      timer.current = setTimeout(hide, duration);
    },
    [translateY, opacity, hide]
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const cfg = toast ? VARIANT_CONFIG[toast.variant ?? 'success'] : VARIANT_CONFIG.info;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            { backgroundColor: cfg.bg, borderColor: cfg.border },
            { transform: [{ translateY }], opacity },
          ]}
          pointerEvents="box-none"
        >
          <View style={[styles.iconWrap, { backgroundColor: `${cfg.iconColor}18` }]}>
            <Feather name={cfg.icon as any} size={18} color={cfg.iconColor} />
          </View>
          <View style={styles.textWrap}>
            {toast.title && <Text style={[styles.toastTitle, { color: cfg.iconColor }]}>{toast.title}</Text>}
            <Text style={styles.toastMsg}>{toast.message}</Text>
          </View>
          <TouchableOpacity onPress={hide} hitSlop={12}>
            <Feather name="x" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export const useToast = () => useContext(ToastContext);

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 16, right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: { flex: 1 },
  toastTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  toastMsg: { fontSize: 13, fontWeight: '500', color: '#374151', lineHeight: 18 },
});
