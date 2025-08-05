export const borderWidths = {
  none: '0',
  thin: '1px',
  medium: '2px',
  thick: '4px',
};

export const borderStyles = {
  none: 'none',
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
};

export const borderRadius = {
  none: '0',
  xs: '0.125rem',    // 2px
  sm: '0.25rem',     // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',    // Fully rounded (circle/pill)
};

// Semantic border radius aliases
export const semanticBorderRadius = {
  button: borderRadius.lg,
  card: borderRadius.xl,
  input: borderRadius.md,
  badge: borderRadius.full,
  tooltip: borderRadius.md,
  modal: borderRadius.xl,
  checkbox: borderRadius.sm,
  switch: borderRadius.full,
};