import React from 'react';
import {
  View,
  ViewProps,
  StyleSheet,
  ViewStyle,
  Pressable,
  PressableProps,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Shadow, Space } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type CardVariant = 'elevated' | 'outlined' | 'filled';

interface CardProps extends ViewProps {
  /** Visual variant */
  variant?: CardVariant;
  /** Remove all internal padding */
  noPadding?: boolean;
  /** Override container style */
  style?: ViewStyle;
  /** Padding override */
  padding?: number;
  /** Border radius override */
  radius?: number;
}

interface PressableCardProps extends CardProps, Omit<PressableProps, 'style' | 'children'> {
  /** Makes the card pressable with a press handler */
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Variant style maps
// ---------------------------------------------------------------------------
type VariantStyle = {
  bg: string;
  border?: string;
  borderWidth?: number;
  shadow?: object;
};

const VARIANT_MAP: Record<CardVariant, VariantStyle> = {
  elevated: {
    bg: Colors.surface,
    shadow: Shadow.md,
  },
  outlined: {
    bg: Colors.surface,
    border: Colors.border,
    borderWidth: 1,
  },
  filled: {
    bg: Colors.green[50],
    border: Colors.green[100],
    borderWidth: 1,
  },
};

// ---------------------------------------------------------------------------
// Card (non-pressable)
// ---------------------------------------------------------------------------
export function Card({
  variant = 'elevated',
  noPadding = false,
  padding,
  radius = Radius.xl,
  style,
  children,
  ...rest
}: CardProps) {
  const v = VARIANT_MAP[variant];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderRadius: radius,
          borderWidth: v.borderWidth ?? 0,
          borderColor: v.border ?? 'transparent',
          padding: noPadding ? 0 : (padding ?? Space.base),
          ...(v.shadow ?? {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// PressableCard — same API + onPress + ripple feedback
// ---------------------------------------------------------------------------
export function PressableCard({
  variant = 'elevated',
  noPadding = false,
  padding,
  radius = Radius.xl,
  style,
  children,
  onPress,
  ...rest
}: PressableCardProps) {
  const v = VARIANT_MAP[variant];

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: Colors.green[100], borderless: false, radius }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed
            ? darken(v.bg)
            : v.bg,
          borderRadius: radius,
          borderWidth: v.borderWidth ?? 0,
          borderColor: v.border ?? 'transparent',
          padding: noPadding ? 0 : (padding ?? Space.base),
          opacity: pressed ? 0.93 : 1,
          ...(v.shadow ?? {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// CardSection — semantic divider within a Card
// ---------------------------------------------------------------------------
interface CardSectionProps extends ViewProps {
  divided?: boolean;
}

export function CardSection({ divided = false, style, children, ...rest }: CardSectionProps) {
  return (
    <View
      style={[
        divided && styles.divided,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Slightly darken a hex color on press (approximation for pure RN) */
function darken(hex: string): string {
  // For white/light surfaces just use a neutral tint
  if (hex === '#FFFFFF' || hex === Colors.surface) return Colors.gray[50];
  if (hex === Colors.green[50]) return Colors.green[100];
  return hex;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: Space.base,
    marginTop: Space.base,
  },
});
