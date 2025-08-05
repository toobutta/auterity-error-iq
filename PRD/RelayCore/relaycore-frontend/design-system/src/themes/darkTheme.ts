import { lightTheme } from './lightTheme';
import { colors } from '../tokens';

// Create a dark theme by extending the light theme
export const darkTheme = {
  ...lightTheme,
  name: 'dark',
  colors: {
    ...lightTheme.colors,
    // Override semantic colors for dark theme
    background: {
      primary: colors.neutral[900],
      secondary: colors.neutral[800],
      tertiary: colors.neutral[700],
    },
    text: {
      primary: colors.neutral[50],
      secondary: colors.neutral[300],
      tertiary: colors.neutral[400],
      inverse: colors.neutral[900],
    },
    border: {
      light: colors.neutral[700],
      medium: colors.neutral[600],
      dark: colors.neutral[500],
    },
    // Keep action colors the same for consistency
    action: {
      ...lightTheme.colors.action,
    },
    // Keep status colors the same for consistency
    status: {
      ...lightTheme.colors.status,
    },
  },
  // Override shadows for dark theme (softer shadows)
  shadows: {
    ...lightTheme.shadows,
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4)',
  },
  components: {
    // Component-specific theme overrides for dark mode will go here
  },
};