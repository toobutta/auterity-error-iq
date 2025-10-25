// Button component styles and utilities

import { cn } from '../../utils/cn';
import { BUTTON_VARIANTS, BUTTON_SIZES } from './Button';

/**
 * Generate button classes based on props
 */
export const getButtonClasses = ({
  variant = 'primary',
  style = 'solid',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = ''
}: {
  variant?: keyof typeof BUTTON_VARIANTS;
  style?: keyof typeof BUTTON_VARIANTS.primary;
  size?: keyof typeof BUTTON_SIZES;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}): string => {
  // Get variant classes
  const variantClasses = BUTTON_VARIANTS[variant][style];

  // Get size configuration
  const sizeConfig = BUTTON_SIZES[size];

  // Combine all classes
  return cn(
    // Base button styles
    'inline-flex items-center justify-center',
    'font-medium rounded-md',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:transform active:scale-95',

    // Size-specific styles
    `h-${sizeConfig.height}`,
    `px-${sizeConfig.paddingX}`,
    `text-${sizeConfig.fontSize}`,

    // Variant styles
    variantClasses,

    // Full width
    fullWidth && 'w-full',

    // Loading state
    loading && 'cursor-wait',

    // Custom className
    className
  );
};

/**
 * Get icon size class for a given button size
 */
export const getIconSizeClass = (size: keyof typeof BUTTON_SIZES): string => {
  return BUTTON_SIZES[size].iconSize;
};

/**
 * Get button size configuration
 */
export const getButtonSize = (size: keyof typeof BUTTON_SIZES) => {
  return BUTTON_SIZES[size];
};

/**
 * Button style utilities for consistent theming
 */
export const buttonStyles = {
  // Focus ring styles
  focusRing: {
    primary: 'focus:ring-blue-500',
    secondary: 'focus:ring-gray-500',
    success: 'focus:ring-green-500',
    error: 'focus:ring-red-500',
    warning: 'focus:ring-yellow-500'
  },

  // Hover effects
  hover: {
    lift: 'hover:transform hover:translate-y-[-1px]',
    glow: 'hover:shadow-lg',
    darken: 'hover:bg-opacity-80'
  },

  // Active effects
  active: {
    scale: 'active:transform active:scale-95',
    press: 'active:bg-opacity-90'
  },

  // Loading states
  loading: {
    overlay: 'relative before:absolute before:inset-0 before:bg-white before:bg-opacity-75',
    spinner: 'animate-spin text-current'
  }
};

/**
 * Button animation utilities
 */
export const buttonAnimations = {
  // Entrance animations
  enter: {
    fadeIn: 'animate-in fade-in duration-200',
    slideIn: 'animate-in slide-in-from-bottom-2 duration-200',
    scaleIn: 'animate-in zoom-in-95 duration-200'
  },

  // Exit animations
  exit: {
    fadeOut: 'animate-out fade-out duration-150',
    slideOut: 'animate-out slide-out-to-bottom-2 duration-150',
    scaleOut: 'animate-out zoom-out-95 duration-150'
  }
};

/**
 * Accessibility helpers for buttons
 */
export const buttonAccessibility = {
  // Focus management
  focus: {
    visible: 'focus:outline-none focus:ring-2 focus:ring-offset-2',
    inset: 'focus:outline-none focus:ring-2 focus:ring-inset',
    none: 'focus:outline-none'
  },

  // Screen reader support
  sr: {
    hidden: 'sr-only',
    description: 'sr-description'
  },

  // High contrast support
  highContrast: {
    border: 'border-2 border-current',
    text: 'text-current'
  }
};

/**
 * Button responsive utilities
 */
export const buttonResponsive = {
  // Responsive sizes
  responsive: {
    sm: 'text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3',
    md: 'text-base sm:text-lg px-4 sm:px-6 py-3 sm:py-4',
    lg: 'text-lg sm:text-xl px-6 sm:px-8 py-4 sm:py-5'
  },

  // Mobile optimizations
  mobile: {
    touch: 'min-h-[44px] min-w-[44px]', // iOS touch target size
    spacing: 'px-4 py-3',
    text: 'text-base' // Prevent zoom on iOS
  }
};

/**
 * Button theme utilities
 */
export const buttonThemes = {
  // Dark mode support
  dark: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white dark:bg-gray-500 dark:hover:bg-gray-600'
  },

  // High contrast mode
  highContrast: {
    primary: 'bg-black text-white border-2 border-black hover:bg-white hover:text-black',
    secondary: 'bg-white text-black border-2 border-black hover:bg-black hover:text-white'
  }
};
