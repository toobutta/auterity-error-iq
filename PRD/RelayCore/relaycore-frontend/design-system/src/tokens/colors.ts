export const colors = {
  // Primary colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#4f46e5', // Main primary color
    600: '#4338ca', // Darker primary
    700: '#3730a3',
    800: '#312e81',
    900: '#1e1b4b',
  },
  
  // Secondary colors
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main secondary color
    600: '#059669', // Darker secondary
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Neutral colors
  neutral: {
    50: '#f8fafc', // Light background
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155', // Dark light
    800: '#1e293b', // Dark
    900: '#0f172a',
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Base colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Semantic aliases
export const semanticColors = {
  background: {
    primary: colors.white,
    secondary: colors.neutral[50],
    tertiary: colors.neutral[100],
  },
  text: {
    primary: colors.neutral[800],
    secondary: colors.neutral[600],
    tertiary: colors.neutral[500],
    inverse: colors.white,
  },
  border: {
    light: colors.neutral[200],
    medium: colors.neutral[300],
    dark: colors.neutral[400],
  },
  action: {
    primary: colors.primary[500],
    primaryHover: colors.primary[600],
    secondary: colors.secondary[500],
    secondaryHover: colors.secondary[600],
    disabled: colors.neutral[300],
  },
  status: {
    success: colors.success[500],
    warning: colors.warning[500],
    danger: colors.danger[500],
    info: colors.primary[500],
  },
};