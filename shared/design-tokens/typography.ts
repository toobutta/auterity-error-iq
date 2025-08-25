// Shared typography system for three-system architecture
export const AuterityTypography = {
  fontFamily: "Inter, system-ui, sans-serif",
  scale: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export type AuterityTypographySystem = typeof AuterityTypography;
