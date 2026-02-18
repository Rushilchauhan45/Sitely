// ============================================================
// 🎨 SITELY COLOR THEME
// Sky Blue + Black Premium Dark Theme
// ============================================================

const Colors = {
  // Primary palette
  skyBlue: '#00BFFF',
  skyBlueLight: '#38BDF8',
  skyBlueMedium: '#0EA5E9',
  skyBlueDark: '#0284C7',
  skyBlueMuted: '#075985',

  // Secondary (blacks)
  black: '#0A0A0A',
  blackLight: '#111111',
  blackMedium: '#1A1A2E',
  blackCard: '#16213E',
  blackSurface: '#0F3460',

  // Accent (whites)
  white: '#FFFFFF',
  whiteOff: '#F8FAFC',
  whiteMuted: '#E2E8F0',
  whiteSubtle: '#94A3B8',

  // Gradients (use as arrays)
  gradientPrimary: ['#00BFFF', '#0284C7', '#0A0A0A'] as const,
  gradientButton: ['#00BFFF', '#0EA5E9', '#0284C7'] as const,
  gradientCard: ['rgba(0,191,255,0.12)', 'rgba(14,165,233,0.06)', 'rgba(10,10,10,0.9)'] as const,
  gradientHeader: ['#0EA5E9', '#0284C7', '#1A1A2E'] as const,
  gradientDark: ['#1A1A2E', '#16213E', '#0F3460'] as const,

  // Glass effects
  glass: 'rgba(255,255,255,0.08)',
  glassLight: 'rgba(255,255,255,0.12)',
  glassMedium: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.15)',
  glassBorderLight: 'rgba(0,191,255,0.2)',

  // Functional
  error: '#EF4444',
  errorLight: 'rgba(239,68,68,0.15)',
  success: '#10B981',
  successLight: 'rgba(16,185,129,0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.15)',
  gold: '#FBBF24',

  // Semantic theme tokens (dark-first since app is dark themed)
  primary: '#00BFFF',
  primaryLight: 'rgba(0,191,255,0.15)',
  primaryDark: '#0284C7',
  primaryGradientStart: '#00BFFF',
  primaryGradientEnd: '#0284C7',
  secondary: '#38BDF8',
  secondaryLight: 'rgba(56,189,248,0.12)',
  accent: '#F8FAFC',
  accentLight: 'rgba(248,250,252,0.08)',

  background: '#0A0A0A',
  surface: '#1A1A2E',
  surfaceElevated: '#16213E',
  cardGlass: 'rgba(26,26,46,0.85)',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.05)',
  tint: '#00BFFF',
  tabIconDefault: '#64748B',
  tabIconSelected: '#00BFFF',
  cardShadow: 'rgba(0,191,255,0.15)',
  overlay: 'rgba(0,0,0,0.7)',
  inputBg: 'rgba(255,255,255,0.06)',
  shimmer: 'rgba(0,191,255,0.08)',
  glow: 'rgba(0,191,255,0.4)',
  glowStrong: 'rgba(0,191,255,0.6)',
};

export default Colors;

export type ThemeColors = typeof Colors;

// Since the app is always dark themed, this returns the same palette
export function useThemeColors(_colorScheme?: 'light' | 'dark' | null): ThemeColors {
  return Colors;
}
