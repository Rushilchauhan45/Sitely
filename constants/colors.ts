const Colors = {
  light: {
    primary: '#E8840C',
    primaryLight: '#FFF3E0',
    primaryDark: '#C06A00',
    secondary: '#0E7C86',
    secondaryLight: '#E0F7FA',
    accent: '#2196F3',
    background: '#F5F6FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#1A1D26',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F0F1F5',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    tint: '#E8840C',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#E8840C',
    cardShadow: 'rgba(0,0,0,0.06)',
    overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    primary: '#F59E0B',
    primaryLight: '#3B2A0F',
    primaryDark: '#D97706',
    secondary: '#14B8A6',
    secondaryLight: '#0F2B2D',
    accent: '#60A5FA',
    background: '#0F1219',
    surface: '#1A1F2E',
    surfaceElevated: '#242938',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    border: '#2D3348',
    borderLight: '#1E2336',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    tint: '#F59E0B',
    tabIconDefault: '#64748B',
    tabIconSelected: '#F59E0B',
    cardShadow: 'rgba(0,0,0,0.3)',
    overlay: 'rgba(0,0,0,0.6)',
  },
};

export default Colors;

export type ThemeColors = typeof Colors.light;

export function useThemeColors(colorScheme: 'light' | 'dark' | null | undefined): ThemeColors {
  return Colors[colorScheme === 'dark' ? 'dark' : 'light'];
}
