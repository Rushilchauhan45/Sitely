// ============================================================
// 📝 SITELY TYPOGRAPHY
// Uses Poppins as primary font family
// ============================================================

export const Fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 42,
} as const;

export const LineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const;

// Pre-composed text styles
export const TextStyles = {
  h1: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes['4xl'],
    lineHeight: FontSizes['4xl'] * LineHeights.tight,
  },
  h2: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes['3xl'],
    lineHeight: FontSizes['3xl'] * LineHeights.tight,
  },
  h3: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes['2xl'],
    lineHeight: FontSizes['2xl'] * LineHeights.tight,
  },
  h4: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xl,
    lineHeight: FontSizes.xl * LineHeights.normal,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.relaxed,
  },
  bodyMedium: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.normal,
  },
  bodySm: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * LineHeights.relaxed,
  },
  caption: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    lineHeight: FontSizes.xs * LineHeights.normal,
  },
  button: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    lineHeight: FontSizes.md * LineHeights.normal,
  },
  buttonSm: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * LineHeights.normal,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * LineHeights.normal,
  },
  badge: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    lineHeight: FontSizes.xs * LineHeights.normal,
  },
} as const;
