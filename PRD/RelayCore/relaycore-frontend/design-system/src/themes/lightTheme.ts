import {
  colors,
  semanticColors,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  typographyStyles,
  spacing,
  semanticSpacing,
  borderRadius,
  semanticBorderRadius,
  borderWidths,
  borderStyles,
  shadows,
  semanticShadows,
  transitions,
  semanticTransitions,
  animations,
  breakpoints,
  mediaQueries,
  containers,
  grid,
  zIndex,
  semanticZIndex,
} from '../tokens';

export const lightTheme = {
  name: 'light',
  colors: {
    ...colors,
    ...semanticColors,
  },
  typography: {
    fontFamilies,
    fontSizes,
    fontWeights,
    lineHeights,
    letterSpacings,
    styles: typographyStyles,
  },
  spacing: {
    ...spacing,
    ...semanticSpacing,
  },
  borders: {
    radius: {
      ...borderRadius,
      ...semanticBorderRadius,
    },
    widths: borderWidths,
    styles: borderStyles,
  },
  shadows: {
    ...shadows,
    ...semanticShadows,
  },
  transitions: {
    duration: transitions.duration,
    timing: transitions.timing,
    presets: semanticTransitions,
  },
  animations,
  breakpoints: {
    values: breakpoints,
    mediaQueries,
    containers,
    grid,
  },
  zIndex: {
    ...zIndex,
    ...semanticZIndex,
  },
  components: {
    // Component-specific theme overrides will go here
  },
};

export type Theme = typeof lightTheme;