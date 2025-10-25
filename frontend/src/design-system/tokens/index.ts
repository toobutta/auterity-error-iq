/**
 * Auterity Design System Tokens
 * Central export for all design tokens
 */

export { colors } from './colors';
export type { ColorPalette } from './colors';

export { typography } from './typography';
export type { TypographySystem } from './typography';

export { spacing, layoutSpacing, responsiveSpacing } from './spacing';
export type { SpacingScale, LayoutSpacing, ResponsiveSpacing } from './spacing';

export { shadows, elevation, radii, borderWidths } from './elevation';
export type { ShadowSystem, ElevationSystem, RadiiSystem, BorderWidthSystem } from './elevation';

export { animation } from './animation';
export type { AnimationSystem } from './animation';

// Composite token exports for convenience
export const tokens = {
  colors,
  typography,
  spacing,
  layoutSpacing,
  responsiveSpacing,
  shadows,
  elevation,
  radii,
  borderWidths,
  animation,
} as const;

export type DesignTokens = typeof tokens;

// CSS custom property generator
export const generateCSSVariables = () => {
  const cssVariables: Record<string, string> = {};
  
  // Colors
  Object.entries(colors).forEach(([category, values]) => {
    if (typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        cssVariables[`--color-${category}-${key}`] = value as string;
      });
    }
  });
  
  // Spacing
  Object.entries(spacing).forEach(([key, value]) => {
    cssVariables[`--spacing-${key}`] = value;
  });
  
  // Typography
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    cssVariables[`--font-size-${key}`] = value;
  });
  
  Object.entries(typography.fontWeight).forEach(([key, value]) => {
    cssVariables[`--font-weight-${key}`] = value.toString();
  });
  
  // Shadows
  Object.entries(shadows).forEach(([key, value]) => {
    cssVariables[`--shadow-${key}`] = value;
  });
  
  // Radii
  Object.entries(radii).forEach(([key, value]) => {
    cssVariables[`--radius-${key}`] = value;
  });
  
  // Animation
  Object.entries(animation.duration).forEach(([key, value]) => {
    cssVariables[`--duration-${key}`] = value;
  });
  
  return cssVariables;
};


