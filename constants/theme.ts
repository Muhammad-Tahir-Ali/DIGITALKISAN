import { Platform } from 'react-native';
import { Colors, Green, Amber } from './colors';

// ---------------------------------------------------------------------------
// Typography Scale
// ---------------------------------------------------------------------------
export const FontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const LineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// ---------------------------------------------------------------------------
// Spacing Scale
// ---------------------------------------------------------------------------
export const Spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

/** Shorthand spacing tokens (most used) */
export const Space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------
export const Radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Shadow Presets (iOS + Android)
// ---------------------------------------------------------------------------
export const Shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
  /** Green-tinted brand shadow */
  brand: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

// ---------------------------------------------------------------------------
// Z-Index
// ---------------------------------------------------------------------------
export const ZIndex = {
  base: 0,
  raised: 10,
  dropdown: 40,
  sticky: 50,
  navbar: 80,
  overlay: 90,
  modal: 100,
  toast: 110,
  tooltip: 120,
} as const;

// ---------------------------------------------------------------------------
// Animation Durations
// ---------------------------------------------------------------------------
export const Duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
  verySlow: 600,
} as const;

// ---------------------------------------------------------------------------
// Component Size Presets
// ---------------------------------------------------------------------------
export const ComponentSize = {
  sm: {
    height: 32,
    paddingHorizontal: 12,
    fontSize: FontSize.sm,
    iconSize: 14,
    borderRadius: Radius.md,
  },
  md: {
    height: 44,
    paddingHorizontal: 16,
    fontSize: FontSize.base,
    iconSize: 16,
    borderRadius: Radius.lg,
  },
  lg: {
    height: 54,
    paddingHorizontal: 24,
    fontSize: FontSize.md,
    iconSize: 20,
    borderRadius: Radius.xl,
  },
} as const;

// ---------------------------------------------------------------------------
// React Native Paper Theme Override
// ---------------------------------------------------------------------------
export const PaperThemeColors = {
  primary: Colors.primary,
  primaryContainer: Green[100],
  onPrimary: '#FFFFFF',
  onPrimaryContainer: Colors.primaryDark,
  secondary: Colors.secondary,
  secondaryContainer: Amber[100],
  onSecondary: '#1A1A1A',
  onSecondaryContainer: Colors.secondaryDark,
  background: Colors.background,
  surface: Colors.surface,
  surfaceVariant: Colors.surfaceSecondary,
  onBackground: Colors.textPrimary,
  onSurface: Colors.textPrimary,
  onSurfaceVariant: Colors.textSecondary,
  error: Colors.error,
  errorContainer: Colors.errorLight,
  onError: '#FFFFFF',
  outline: Colors.border,
  outlineVariant: Colors.borderStrong,
};

// ---------------------------------------------------------------------------
// Master Theme Export
// ---------------------------------------------------------------------------
export const Theme = {
  colors: Colors,
  fontSize: FontSize,
  fontWeight: FontWeight,
  lineHeight: LineHeight,
  letterSpacing: LetterSpacing,
  spacing: Spacing,
  space: Space,
  radius: Radius,
  shadow: Shadow,
  zIndex: ZIndex,
  duration: Duration,
  componentSize: ComponentSize,
  paperTheme: { colors: PaperThemeColors },
} as const;

export type ThemeType = typeof Theme;
