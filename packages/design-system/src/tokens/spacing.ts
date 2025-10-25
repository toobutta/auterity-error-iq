// Auterity Unified Spacing System
export const spacing = {
  // Spacing scale based on 4px grid
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem'        // 384px
} as const;

// Layout spacing utilities
export const layoutSpacing = {
  // Container padding
  container: {
    sm: 'spacing-4',    // 16px
    md: 'spacing-6',    // 24px
    lg: 'spacing-8',    // 32px
    xl: 'spacing-12'    // 48px
  },

  // Section spacing
  section: {
    sm: 'spacing-8',    // 32px
    md: 'spacing-12',   // 48px
    lg: 'spacing-16',   // 64px
    xl: 'spacing-24'    // 96px
  },

  // Component spacing
  component: {
    xs: 'spacing-2',    // 8px
    sm: 'spacing-3',    // 12px
    md: 'spacing-4',    // 16px
    lg: 'spacing-6',    // 24px
    xl: 'spacing-8'     // 32px
  },

  // Stack spacing (vertical rhythm)
  stack: {
    tight: 'spacing-2',     // 8px
    normal: 'spacing-4',    // 16px
    loose: 'spacing-6',     // 24px
    relaxed: 'spacing-8'    // 32px
  },

  // Inline spacing
  inline: {
    tight: 'spacing-1',     // 4px
    normal: 'spacing-2',    // 8px
    loose: 'spacing-3',     // 12px
    relaxed: 'spacing-4'    // 16px
  }
} as const;

// Breakpoint-aware spacing
export const responsiveSpacing = {
  // Mobile-first responsive spacing
  responsive: {
    xs: 'spacing-2',    // 8px on mobile
    sm: 'spacing-3',    // 12px on small screens+
    md: 'spacing-4',    // 16px on medium screens+
    lg: 'spacing-6',    // 24px on large screens+
    xl: 'spacing-8'     // 32px on extra large screens+
  },

  // Container queries for component spacing
  container: {
    small: 'spacing-3',     // 12px in small containers
    medium: 'spacing-4',    // 16px in medium containers
    large: 'spacing-6'      // 24px in large containers
  }
} as const;

export type SpacingScale = typeof spacing;
export type LayoutSpacing = typeof layoutSpacing;
export type ResponsiveSpacing = typeof responsiveSpacing;
