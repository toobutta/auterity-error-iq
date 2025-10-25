// Design System Main Export

// Components
export * from './components/Button';
export * from './components/Input';
export * from './components/Feedback';

// Tokens
export * from './tokens/colors';
export * from './tokens/typography';
export * from './tokens/spacing';

// Utilities
export * from './utils/cn';

// Types
export type { StudioTheme } from '../types/studio';

// Theme utilities
export { getMultimediaTheme } from '../constants/multimediaThemes';

// Re-export commonly used utilities
export { cn, createVariants, createComponentClasses } from './utils/cn';
export { COLORS, SEMANTIC_COLORS, LIGHT_THEME_COLORS, DARK_THEME_COLORS } from './tokens/colors';
export { TYPOGRAPHY, TEXT_PRESETS } from './tokens/typography';
export { SPACING, SEMANTIC_SPACING, SIZES } from './tokens/spacing';
