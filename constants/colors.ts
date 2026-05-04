/**
 * DigitalKisan — Color System
 *
 * Pakistani agricultural theme: deep greens, golden amber, warm neutrals.
 */

// ---------------------------------------------------------------------------
// Primary — Deep Green (fields, crops, nature)
// ---------------------------------------------------------------------------
export const Green = {
  50: '#F0FDF4',
  100: '#DCFCE7',
  200: '#BBF7D0',
  300: '#86EFAC',
  400: '#4ADE80',
  500: '#22C55E',
  600: '#16A34A',
  700: '#15803D',
  800: '#166534',
  900: '#14532D',
  950: '#052E16',
} as const;

// ---------------------------------------------------------------------------
// Secondary — Golden Amber (wheat, harvest, prosperity)
// ---------------------------------------------------------------------------
export const Amber = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
  950: '#451A03',
} as const;

// ---------------------------------------------------------------------------
// Neutral Gray (surfaces, borders, text)
// ---------------------------------------------------------------------------
export const Gray = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#A3A3A3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0A0A0A',
} as const;

// ---------------------------------------------------------------------------
// Semantic colors
// ---------------------------------------------------------------------------
export const Semantic = {
  success: {
    light: '#DCFCE7',
    DEFAULT: '#16A34A',
    dark: '#14532D',
  },
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#D97706',
    dark: '#78350F',
  },
  error: {
    light: '#FEE2E2',
    DEFAULT: '#DC2626',
    dark: '#7F1D1D',
  },
  info: {
    light: '#DBEAFE',
    DEFAULT: '#2563EB',
    dark: '#1E3A8A',
  },
} as const;

// ---------------------------------------------------------------------------
// Pakistani agricultural tints
// ---------------------------------------------------------------------------
export const AgriTints = {
  /** Mitti — earthy clay soil */
  mitti: '#C8956C',
  mittiLight: '#F5E6D3',
  /** Kanak — golden wheat */
  kanak: '#E8C55A',
  kanakLight: '#FBF3D0',
  /** Sabz — irrigation water blue-green */
  sabz: '#0E9F6E',
  sabzLight: '#D1FAE5',
  /** Aftab — sun-baked orange */
  aftab: '#F97316',
  aftabLight: '#FFEDD5',
  /** Shab — night sky deep blue for logistics */
  shab: '#1E3A5F',
  shabLight: '#DBEAFE',
  /** Safed — pure white */
  safed: '#FFFFFF',
  /** Peela — golden yellow/amber */
  peela: '#F59E0B',
} as const;

// ---------------------------------------------------------------------------
// App-level semantic aliases (used throughout all screens)
// ---------------------------------------------------------------------------
export const Colors = {
  // Palettes
  green: Green,
  amber: Amber,
  gray: Gray,

  // Brand
  primary: Green[700],
  primaryMid: Green[600],  // for gradients / mid-tone
  primaryLight: Green[100],
  primaryDark: Green[900],

  secondary: Amber[500],
  secondaryLight: Amber[100],
  secondaryDark: Amber[800],

  // Surfaces
  background: '#F8FAFB',
  backgroundAlt: '#F1F5F1',  // slightly tinted bg
  surface: '#FFFFFF',
  surfaceSecondary: Gray[50],
  surfaceTertiary: Gray[100],
  surfaceElevated: '#FFFFFF', // cards that should stand out

  // Glass / translucent
  glassBg: 'rgba(255,255,255,0.08)',
  glassBgStrong: 'rgba(255,255,255,0.16)',
  glassBorder: 'rgba(255,255,255,0.14)',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textPrimaryBrand: Green[700],
  textSecondaryBrand: Amber[600],

  // Borders
  border: '#E8EDF2',
  borderStrong: '#D1D9E0',
  borderBrand: Green[300],
  cardBorder: '#F0F4F8',  // ultra-light card borders

  // Semantic shortcuts
  success: Semantic.success.DEFAULT,
  successLight: Semantic.success.light,
  warning: Semantic.warning.DEFAULT,
  warningLight: Semantic.warning.light,
  error: Semantic.error.DEFAULT,
  errorLight: Semantic.error.light,
  info: Semantic.info.DEFAULT,
  infoLight: Semantic.info.light,

  // Agri tints (use directly via AgriTints)
  agri: AgriTints,

  // Overlays
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.12)',
} as const;

export type ColorToken = keyof typeof Colors;
