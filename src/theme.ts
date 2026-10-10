// Single source of truth for colours, spacing, radii and type sizes.
// Existing COLORS / SPACING keys are unchanged, so current screens keep working.

export const COLORS = {
  // existing
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

  // new tokens (replace the repeated hex literals in screens)
  surface: '#FFFFFF',
  divider: '#EEEEEE',
  softBorder: '#DDDDDD',
  accentTint: '#F8EFCF',
  iconBg: '#F8F5EC',
  onAccent: '#FFFFFF',
  onDark: '#FFFFFF',
  tabInactive: '#777777',
} as const;

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
