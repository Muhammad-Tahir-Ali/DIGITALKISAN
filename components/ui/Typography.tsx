import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight, LineHeight } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Shared Props
// ---------------------------------------------------------------------------
interface BaseTextProps extends TextProps {
  /** Make text bold weight */
  bold?: boolean;
  /** Render in muted (textSecondary) color */
  muted?: boolean;
  /** Render in primary brand green */
  primary?: boolean;
  /** Render in secondary brand amber */
  secondary?: boolean;
  /** Align */
  center?: boolean;
  right?: boolean;
  /** Number of lines */
  lines?: number;
}

// ---------------------------------------------------------------------------
// Internal helper: color resolution
// ---------------------------------------------------------------------------
function resolveColor(props: BaseTextProps): string {
  if (props.primary) return Colors.primary;
  if (props.secondary) return Colors.secondary;
  if (props.muted) return Colors.textSecondary;
  return Colors.textPrimary;
}

// ---------------------------------------------------------------------------
// Heading 1 — Screen titles (30px bold)
// ---------------------------------------------------------------------------
export function Heading1({ bold, muted, primary, secondary, center, right, lines, style, ...rest }: BaseTextProps) {
  return (
    <Text
      numberOfLines={lines}
      style={[
        styles.h1,
        { color: resolveColor({ bold, muted, primary, secondary }) },
        center && styles.center,
        right && styles.right,
        style,
      ]}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// Heading 2 — Section titles (24px bold)
// ---------------------------------------------------------------------------
export function Heading2({ bold, muted, primary, secondary, center, right, lines, style, ...rest }: BaseTextProps) {
  return (
    <Text
      numberOfLines={lines}
      style={[
        styles.h2,
        { color: resolveColor({ bold, muted, primary, secondary }) },
        center && styles.center,
        right && styles.right,
        style,
      ]}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// Heading 3 — Card / subsection titles (20px semibold)
// ---------------------------------------------------------------------------
export function Heading3({ bold, muted, primary, secondary, center, right, lines, style, ...rest }: BaseTextProps) {
  return (
    <Text
      numberOfLines={lines}
      style={[
        styles.h3,
        { color: resolveColor({ bold, muted, primary, secondary }) },
        center && styles.center,
        right && styles.right,
        style,
      ]}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// Body — Default body copy (14px regular)
// ---------------------------------------------------------------------------
export function Body({ bold, muted, primary, secondary, center, right, lines, style, ...rest }: BaseTextProps) {
  return (
    <Text
      numberOfLines={lines}
      style={[
        styles.body,
        bold && styles.weightBold,
        { color: resolveColor({ bold, muted, primary, secondary }) },
        center && styles.center,
        right && styles.right,
        style,
      ]}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// BodySmall — Secondary body (12px)
// ---------------------------------------------------------------------------
export function BodySmall({ bold, muted, primary, secondary, center, right, lines, style, ...rest }: BaseTextProps) {
  return (
    <Text
      numberOfLines={lines}
      style={[
        styles.bodySmall,
        bold && styles.weightBold,
        { color: resolveColor({ bold, muted, primary, secondary }) },
        center && styles.center,
        right && styles.right,
        style,
      ]}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// Caption — Tiny supporting text (11px)
// ---------------------------------------------------------------------------
export function Caption({ bold, muted, primary, secondary, center, right, lines, style, ...rest }: BaseTextProps) {
  return (
    <Text
      numberOfLines={lines}
      style={[
        styles.caption,
        bold && styles.weightBold,
        { color: resolveColor({ bold: bold, muted: muted ?? true, primary, secondary }) },
        center && styles.center,
        right && styles.right,
        style,
      ]}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// Label — Form labels / badges (12px medium, uppercase tracking)
// ---------------------------------------------------------------------------
export function Label({ bold, muted, primary, secondary, center, right, lines, style, ...rest }: BaseTextProps) {
  return (
    <Text
      numberOfLines={lines}
      style={[
        styles.label,
        { color: resolveColor({ bold, muted, primary, secondary }) },
        center && styles.center,
        right && styles.right,
        style,
      ]}
      {...rest}
    />
  );
}

// ---------------------------------------------------------------------------
// Convenience re-export: all variants as a namespace
// ---------------------------------------------------------------------------
export const Typography = {
  Heading1,
  Heading2,
  Heading3,
  Body,
  BodySmall,
  Caption,
  Label,
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  h1: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['2xl'] * LineHeight.snug,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * LineHeight.snug,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.normal,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.normal,
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * LineHeight.normal,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.snug,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: Colors.textPrimary,
  },
  // modifiers
  weightBold: { fontWeight: FontWeight.bold },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
});
