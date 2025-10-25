/**
 * Auterity Modern Color System
 * Clean, technical color palette inspired by Anthropic's minimal aesthetic
 * and Vercel's modern developer-focused design language
 */

export const colors = {
  // Primary brand colors - clean and professional
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Primary brand color - clean sky blue
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },
  
  // Neutral colors - crisp grays for clean UI
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a'
  },
  
  // Accent colors - bold but sophisticated
  accent: {
    blue: '#3b82f6',    // Bright blue for links and CTAs
    green: '#10b981',   // Success and positive states
    purple: '#8b5cf6',  // Creative elements
    pink: '#ec4899',    // Highlights and alerts
    orange: '#f97316',  // Warnings and important info
    cyan: '#06b6d4',    // Information and tips
  },
  
  // Semantic colors for consistent messaging
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Surface colors for layered interfaces
  surface: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
    elevated: '#ffffff',
    muted: '#f9fafb',
    overlay: 'rgba(0, 0, 0, 0.5)',
    border: '#e5e5e5',
    'border-hover': '#d4d4d4',
    'border-focus': '#0ea5e9',
  },
  
  // Technical colors for code and system elements
  code: {
    background: '#1e1e1e',
    text: '#d4d4d4',
    comment: '#6a737d',
    string: '#7dd3fc',
    keyword: '#ec4899',
    function: '#fbbf24',
    number: '#10b981',
    operator: '#a3a3a3',
  },
  
  // Dark mode colors (for future implementation)
  dark: {
    surface: '#0a0a0a',
    'surface-elevated': '#171717',
    'surface-muted': '#262626',
    border: '#404040',
    'border-hover': '#525252',
    text: '#fafafa',
    'text-muted': '#a3a3a3',
  }
} as const;

export type ColorPalette = typeof colors;