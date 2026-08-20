/**
 * Design System: The Calligrapher's Manuscript
 *
 * Monochrome palette with strict 0px border radius.
 * No shadows - only tonal layering for depth.
 * Typography: Noto Serif JP (headlines) + Inter (body/labels)
 * Transitions: instant (0ms) or 50ms max
 */

export const colors = {
  // Surface hierarchy
  surface: '#fcf8f8',
  surfaceDim: '#dcd9d9',
  surfaceBright: '#fcf8f8',
  surfaceContainer: '#f0edec',
  surfaceContainerLow: '#f6f3f2',
  surfaceContainerHigh: '#ebe7e7',
  surfaceContainerHighest: '#e5e2e1',
  surfaceContainerLowest: '#ffffff',
  surfaceVariant: '#e5e2e1',

  // Primary (black ink)
  primary: '#000000',
  onPrimary: '#e5e2e1',
  primaryContainer: '#3c3b3b',
  onPrimaryContainer: '#ffffff',
  primaryFixed: '#5f5e5e',
  primaryFixedDim: '#474646',

  // Secondary (muted ink)
  secondary: '#5e5e5e',
  onSecondary: '#ffffff',
  secondaryContainer: '#d5d4d4',
  onSecondaryContainer: '#1b1c1c',
  secondaryFixed: '#c7c6c6',
  secondaryFixedDim: '#acabab',

  // Tertiary
  tertiary: '#3a3c3c',
  onTertiary: '#e2e2e2',
  tertiaryContainer: '#737575',
  onTertiaryContainer: '#ffffff',

  // Background
  background: '#fcf8f8',
  onBackground: '#1c1b1b',
  onSurface: '#1c1b1b',
  onSurfaceVariant: '#474747',

  // Outline (borders)
  outline: '#777777',
  outlineVariant: '#c6c6c6',

  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',

  // Inverse
  inverseSurface: '#313030',
  inverseOnSurface: '#f3f0ef',
  inversePrimary: '#c9c6c5',

  surfaceTint: '#5f5e5e',
} as const;

export const typography = {
  // Kanji Focus - massive display
  displayLg: {
    fontFamily: 'var(--font-headline)',
    fontSize: '3.5rem', // 56px
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.02em',
  },
  displayMd: {
    fontFamily: 'var(--font-headline)',
    fontSize: '2.75rem', // 44px
    fontWeight: 700,
    lineHeight: 1.1,
  },

  // Section headers
  headlineLg: {
    fontFamily: 'var(--font-headline)',
    fontSize: '2rem', // 32px
    fontWeight: 600,
    lineHeight: 1.2,
  },
  headlineSm: {
    fontFamily: 'var(--font-headline)',
    fontSize: '1.5rem', // 24px
    fontWeight: 600,
    lineHeight: 1.3,
  },

  // Body text
  bodyLg: {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem', // 16px
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.02em',
  },
  bodySm: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem', // 14px
    fontWeight: 400,
    lineHeight: 1.4,
  },

  // UI labels
  labelLg: {
    fontFamily: 'var(--font-label)',
    fontSize: '0.875rem', // 14px
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  labelMd: {
    fontFamily: 'var(--font-label)',
    fontSize: '0.75rem', // 12px
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  labelSm: {
    fontFamily: 'var(--font-label)',
    fontSize: '0.65rem', // 10.4px
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
} as const;

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '5rem', // 80px
} as const;

export const borderRadius = {
  none: '0px',
  // All components use 0px radius - sharp corners only
} as const;

export const transitions = {
  snap: '0ms', // Instant
  ink: '50ms', // Fast snap like physical switch
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
