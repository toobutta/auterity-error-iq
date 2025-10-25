/**
 * Auterity Elevation System
 * Provides consistent shadow and elevation styles
 * with subtle 3D effects inspired by Lego's dimensional quality
 */

// Base shadow values with subtle earth tone coloring
export const shadows = {
  // Crisp shadows with slight warm undertones for dimensionality
  sm: '0px 1px 2px 0px rgba(58, 54, 52, 0.05), 0px 1px 3px 0px rgba(58, 54, 52, 0.1)',
  md: '0px 2px 4px -1px rgba(58, 54, 52, 0.06), 0px 4px 6px -1px rgba(58, 54, 52, 0.1)',
  lg: '0px 4px 6px -2px rgba(58, 54, 52, 0.05), 0px 10px 15px -3px rgba(58, 54, 52, 0.1)',
  xl: '0px 10px 15px -3px rgba(58, 54, 52, 0.08), 0px 20px 25px -5px rgba(58, 54, 52, 0.12)',
  '2xl': '0px 25px 50px -12px rgba(58, 54, 52, 0.15)',
  
  // Inner shadows for pressed/inset elements
  inner: 'inset 0px 2px 4px 0px rgba(58, 54, 52, 0.06)',
  'inner-md': 'inset 0px 4px 8px 0px rgba(58, 54, 52, 0.08)',
  
  // Special effects
  glow: '0px 0px 15px 2px rgba(181, 132, 99, 0.15)', // Subtle clay glow
  'glow-blue': '0px 0px 15px 2px rgba(56, 150, 220, 0.15)', // Subtle sky blue glow
  'glow-green': '0px 0px 15px 2px rgba(86, 140, 120, 0.15)', // Subtle forest green glow
  outline: '0px 0px 0px 2px rgba(181, 132, 99, 0.2)', // Clay outline
  
  // No shadow option
  none: 'none',
};

// Elevation system combining shadows with subtle transformations
export const elevation = {
  // Flat elements (no elevation)
  flat: {
    shadow: shadows.none,
    borderWidth: '1px',
    transform: 'translateZ(0)',
  },
  
  // Subtly raised elements (buttons, cards, etc.)
  raised: {
    shadow: shadows.sm,
    transform: 'translateZ(0)',
  },
  
  // Medium elevation (dropdown menus, popovers)
  lifted: {
    shadow: shadows.md,
    transform: 'translateZ(0)',
  },
  
  // High elevation (modals, dialogs)
  floating: {
    shadow: shadows.lg,
    transform: 'translateZ(0)',
  },
  
  // Highest elevation (notifications, tooltips)
  overlay: {
    shadow: shadows.xl,
    transform: 'translateZ(0)',
  },
  
  // Interactive elements with hover/focus states
  interactive: {
    rest: shadows.sm,
    hover: shadows.md,
    active: shadows.inner,
    focus: shadows.outline,
  },
  
  // Lego-inspired dimensional elements with subtle 3D effect
  dimensional: {
    rest: {
      shadow: shadows.md,
      transform: 'translateY(0)',
      transition: 'transform 150ms ease, box-shadow 150ms ease',
    },
    hover: {
      shadow: shadows.lg,
      transform: 'translateY(-2px)',
    },
    active: {
      shadow: shadows.sm,
      transform: 'translateY(0)',
    },
  },
};

// Border radii for consistent rounding
export const radii = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.25rem',    // 4px 
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',   // Circular
};

// Border widths
export const borderWidths = {
  0: '0px',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
};

export type ShadowSystem = typeof shadows;
export type ElevationSystem = typeof elevation;
export type RadiiSystem = typeof radii;
export type BorderWidthSystem = typeof borderWidths;


