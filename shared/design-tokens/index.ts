// Shared design system for three-system architecture
import { AuterityColors } from './colors';
import { AuterityTypography } from './typography';
import { AuteritySpacing } from './spacing';

export * from './colors';
export * from './typography';
export * from './spacing';

// Main export for the complete design system
export const AuterityDesignTokens = {
  colors: AuterityColors,
  typography: AuterityTypography,
  spacing: AuteritySpacing
};
