export const breakpoints = {
  xs: '0px',      // Extra small devices (portrait phones)
  sm: '576px',    // Small devices (landscape phones)
  md: '768px',    // Medium devices (tablets)
  lg: '992px',    // Large devices (desktops)
  xl: '1200px',   // Extra large devices (large desktops)
  '2xl': '1400px', // Extra extra large devices
};

// Media query helpers
export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  
  // Max-width queries (down)
  xsDown: `@media (max-width: ${parseInt(breakpoints.sm) - 1}px)`,
  smDown: `@media (max-width: ${parseInt(breakpoints.md) - 1}px)`,
  mdDown: `@media (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
  lgDown: `@media (max-width: ${parseInt(breakpoints.xl) - 1}px)`,
  xlDown: `@media (max-width: ${parseInt(breakpoints['2xl']) - 1}px)`,
  
  // Between queries
  smOnly: `@media (min-width: ${breakpoints.sm}) and (max-width: ${parseInt(breakpoints.md) - 1}px)`,
  mdOnly: `@media (min-width: ${breakpoints.md}) and (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
  lgOnly: `@media (min-width: ${breakpoints.lg}) and (max-width: ${parseInt(breakpoints.xl) - 1}px)`,
  xlOnly: `@media (min-width: ${breakpoints.xl}) and (max-width: ${parseInt(breakpoints['2xl']) - 1}px)`,
  
  // Other useful queries
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',
  motion: '@media (prefers-reduced-motion: no-preference)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  darkMode: '@media (prefers-color-scheme: dark)',
  lightMode: '@media (prefers-color-scheme: light)',
  hover: '@media (hover: hover)',
  touchDevice: '@media (hover: none)',
  highDPI: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
};

// Container max widths
export const containers = {
  sm: '540px',
  md: '720px',
  lg: '960px',
  xl: '1140px',
  '2xl': '1320px',
};

// Grid system
export const grid = {
  columns: 12,
  gutter: {
    xs: '1rem',   // 16px
    sm: '1.5rem', // 24px
    md: '2rem',   // 32px
    lg: '2rem',   // 32px
    xl: '2.5rem', // 40px
  },
  margin: {
    xs: '1rem',   // 16px
    sm: '1.5rem', // 24px
    md: '2rem',   // 32px
    lg: '3rem',   // 48px
    xl: '4rem',   // 64px
  },
};