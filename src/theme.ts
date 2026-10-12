// Single source of truth for colours, spacing, radii and type sizes.
// Colours come in light + dark palettes with identical keys — screens must
// read them via useThemeColors() so Settings can switch live.

export const lightColors = {
  background: '#FFFFFF',
  card: '#FFFDF8',
  text: '#222222',
  muted: '#8B8B8B',
  border: '#343434',
  accent: '#D7A62A',
  accentSoft: '#FFF3D6',
  dark: '#1F1F1F',
  success: '#4F9B78',
  danger: '#B84A4A',
  dangerSoft: '#FBEAEA',
  surface: '#FFFFFF',
  divider: '#EEEEEE',
  softBorder: '#DDDDDD',
  accentTint: '#F8EFCF',
  iconBg: '#F8F5EC',
  onAccent: '#FFFFFF',
  onDark: '#FFFFFF',
  tabInactive: '#777777',
} as const;

export const darkColors: Record<keyof typeof lightColors, string> = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#F5F2EA',
  muted: '#A8A29A',
  border: '#3A3A3A',
  accent: '#D7A62A',
  accentSoft: '#3A2E12',
  dark: '#1F1F1F',
  success: '#6FCF97',
  danger: '#E07070',
  dangerSoft: '#3A2222',
  surface: '#1A1A1A',
  divider: '#2B2B2B',
  softBorder: '#3A3A3A',
  accentTint: '#2E2510',
  iconBg: '#262626',
  onAccent: '#FFFFFF',
  onDark: '#FFFFFF',
  tabInactive: '#8A8A8A',
};

export type ThemeColors = Record<keyof typeof lightColors, string>;

/** Back-compat alias for the light palette. Prefer useThemeColors(). */
export const COLORS: ThemeColors = lightColors;

export type ThemeMode = 'light' | 'dark' | 'system';

export const SPACING = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
} as const;

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

// Nothing below 12: this is read by someone who just woke up.
export const FONT = {
  caption: 12,
  body: 14,
  bodyLg: 16,
  title: 20,
  headline: 28,
  display: 64,
} as const;

// Minimum touch target (iOS HIG / Material).
export const TOUCH_MIN = 44;
