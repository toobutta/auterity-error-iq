/**
 * Auterity Spacing System
 * Provides consistent spacing values across the application
 * with clear structure and hierarchy for layout composition
 */

// Base spacing scale with 4px (0.25rem) increments
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
} as const;

// Layout-specific spacing for page structure and component composition
export const layoutSpacing = {
  page: {
    xs: '1rem',     // 16px - Minimal page padding for mobile
    sm: '1.5rem',   // 24px - Standard page padding for small screens
    md: '2rem',     // 32px - Default page padding
    lg: '3rem',     // 48px - Comfortable page padding for large screens
    xl: '4rem',     // 64px - Extra spacious padding
  },
  section: {
    xs: '1.5rem',   // 24px - Minimal section spacing
    sm: '2rem',     // 32px - Default section spacing
    md: '3rem',     // 48px - Comfortable section spacing
    lg: '4rem',     // 64px - Spacious section spacing
    xl: '6rem',     // 96px - Extra spacious section spacing
  },
  component: {
    xs: '0.5rem',   // 8px - Tight component spacing
    sm: '0.75rem',  // 12px - Default small component spacing
    md: '1rem',     // 16px - Standard component spacing
    lg: '1.5rem',   // 24px - Large component spacing
    xl: '2rem',     // 32px - Extra large component spacing
  },
  // Stack spacing (vertical rhythm)
  stack: {
    xs: '0.5rem',   // 8px - Minimal vertical spacing 
    sm: '0.75rem',  // 12px - Compact vertical spacing
    md: '1rem',     // 16px - Default vertical spacing
    lg: '1.5rem',   // 24px - Comfortable vertical spacing
    xl: '2rem',     // 32px - Spacious vertical spacing
  },
  // Inline spacing (horizontal rhythm)
  inline: {
    xs: '0.25rem',  // 4px - Minimal horizontal spacing
    sm: '0.5rem',   // 8px - Compact horizontal spacing
    md: '0.75rem',  // 12px - Default horizontal spacing
    lg: '1rem',     // 16px - Comfortable horizontal spacing
    xl: '1.5rem',   // 24px - Spacious horizontal spacing
  },
} as const;

// Responsive spacing with different values based on screen size
export const responsiveSpacing = {
  // Space that grows with screen size - for containers, sections, etc.
  container: {
    base: '1rem',      // Default padding (16px) - mobile
    sm: '1.5rem',      // Small screens (24px)
    md: '2rem',        // Medium screens (32px)
    lg: '3rem',        // Large screens (48px)
    xl: '4rem',        // Extra large screens (64px)
    '2xl': '6rem',     // 2XL screens (96px)
  },
  // Responsive margin for page sections
  section: {
    base: '2rem',      // Default spacing (32px) - mobile
    sm: '2.5rem',      // Small screens (40px)
    md: '3rem',        // Medium screens (48px)
    lg: '4rem',        // Large screens (64px)
    xl: '5rem',        // Extra large screens (80px)
    '2xl': '6rem',     // 2XL screens (96px)
  },
  // Responsive gap for grid layouts
  grid: {
    base: '1rem',      // Default gap (16px) - mobile
    sm: '1.5rem',      // Small screens (24px)
    md: '2rem',        // Medium screens (32px)
    lg: '2.5rem',      // Large screens (40px)
    xl: '3rem',        // Extra large screens (48px)
  },
} as const;

export type SpacingScale = typeof spacing;
export type LayoutSpacing = typeof layoutSpacing;
export type ResponsiveSpacing = typeof responsiveSpacing;