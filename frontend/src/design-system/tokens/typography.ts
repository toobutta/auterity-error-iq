/**
 * Auterity Typography System
 * Clean and professional typography system inspired by Google's clean UI principles
 * with humanized touches for an anthropomorphic feel
 */

export const typography = {
  // Font families
  fontFamily: {
    // Primary font for UI elements - clean and professional
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    // Secondary font with slightly more personality for headings
    display: '"DM Sans", Inter, system-ui, sans-serif',
    // Monospace font for code snippets, logs, and technical content
    mono: '"Fira Code", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  // Font sizes with clear scale progression
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },

  // Font weights to control emphasis and hierarchy
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights for optimal readability
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing for fine-tuned typography
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text styles - predefined combinations for consistent usage
  textStyles: {
    // Headings
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.25,
      fontFamily: '"DM Sans", Inter, system-ui, sans-serif',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 700,
      lineHeight: 1.25,
      fontFamily: '"DM Sans", Inter, system-ui, sans-serif',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      fontFamily: '"DM Sans", Inter, system-ui, sans-serif',
      letterSpacing: '-0.015em',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: '"DM Sans", Inter, system-ui, sans-serif',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: '"DM Sans", Inter, system-ui, sans-serif',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: '"DM Sans", Inter, system-ui, sans-serif',
    },

    // Body text
    body: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    'body-lg': {
      fontSize: '1.125rem',
      fontWeight: 400,
      lineHeight: 1.5,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    'body-sm': {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    'body-xs': {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
      fontFamily: 'Inter, system-ui, sans-serif',
    },

    // UI elements
    label: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.4,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: 'Inter, system-ui, sans-serif',
      letterSpacing: '0.025em',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: 'Inter, system-ui, sans-serif',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },

    // Special elements
    code: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      fontFamily: '"Fira Code", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    quote: {
      fontSize: '1.125rem',
      fontWeight: 400,
      lineHeight: 1.6,
      fontFamily: 'Inter, system-ui, sans-serif',
      fontStyle: 'italic',
    },
  },
} as const;

export type TypographySystem = typeof typography;