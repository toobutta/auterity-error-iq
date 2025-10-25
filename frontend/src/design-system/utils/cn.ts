import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for conditionally joining CSS classes
 * Combines clsx for conditional logic with tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a variant utility for component styling
 * Allows for type-safe variant combinations
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  variants: T
) {
  return function getVariantClasses(
    variant: keyof T,
    size?: keyof T[keyof T]
  ): string {
    const variantClasses = variants[variant];
    if (!variantClasses) return '';

    if (size && typeof size === 'string') {
      return variantClasses[size] || '';
    }

    return Object.values(variantClasses).join(' ');
  };
}

/**
 * Creates a component class name generator with consistent patterns
 */
export function createComponentClasses(
  componentName: string,
  variants: Record<string, Record<string, string>> = {}
) {
  return function generateClasses(
    props: {
      variant?: keyof typeof variants;
      size?: string;
      className?: string;
      disabled?: boolean;
      loading?: boolean;
      error?: boolean;
      success?: boolean;
    } = {}
  ): string {
    const {
      variant = 'default',
      size = 'md',
      className = '',
      disabled = false,
      loading = false,
      error = false,
      success = false
    } = props;

    const classes = [
      `component-${componentName}`,
      `variant-${String(variant)}`,
      `size-${size}`,
      className
    ];

    // State modifiers
    if (disabled) classes.push('state-disabled');
    if (loading) classes.push('state-loading');
    if (error) classes.push('state-error');
    if (success) classes.push('state-success');

    return cn(classes);
  };
}

/**
 * Creates responsive class utilities
 */
export const responsive = {
  hide: {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block'
  },
  show: {
    sm: 'block sm:hidden',
    md: 'block md:hidden',
    lg: 'block lg:hidden',
    xl: 'block xl:hidden'
  },
  text: {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl'
  }
};

/**
 * Color utility functions for dynamic styling
 */
export const colors = {
  // Get CSS custom property value
  get: (property: string) => `var(${property})`,

  // Primary colors
  primary: {
    50: 'var(--color-primary-50)',
    100: 'var(--color-primary-100)',
    500: 'var(--color-primary-500)',
    600: 'var(--color-primary-600)',
    700: 'var(--color-primary-700)'
  },

  // Semantic colors
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)'
};

/**
 * Typography utilities
 */
export const typography = {
  // Get typography CSS custom property
  get: (property: string) => `var(${property})`,

  // Font sizes
  size: {
    xs: 'var(--text-xs)',
    sm: 'var(--text-sm)',
    base: 'var(--text-base)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)'
  },

  // Font weights
  weight: {
    normal: 'var(--font-normal)',
    medium: 'var(--font-medium)',
    semibold: 'var(--font-semibold)',
    bold: 'var(--font-bold)'
  }
};

/**
 * Spacing utilities
 */
export const spacing = {
  // Get spacing CSS custom property
  get: (property: string) => `var(${property})`,

  // Spacing scale
  space: {
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    6: 'var(--space-6)',
    8: 'var(--space-8)'
  }
};

/**
 * Animation utilities
 */
export const animations = {
  // Transition utilities
  transition: {
    fast: 'transition-all duration-150 ease-out',
    normal: 'transition-all duration-200 ease-out',
    slow: 'transition-all duration-300 ease-out'
  },

  // Hover effects
  hover: {
    lift: 'hover:transform hover:translate-y-[-2px] hover:shadow-md',
    glow: 'hover:shadow-lg hover:shadow-primary/25'
  },

  // Loading animations
  loading: {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce'
  }
};

/**
 * Focus and accessibility utilities
 */
export const accessibility = {
  // Focus styles
  focus: {
    default: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    inset: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
    visible: 'focus:outline-none focus:ring-2 focus:ring-primary-500'
  },

  // Screen reader utilities
  sr: {
    only: 'sr-only',
    not: 'not-sr-only'
  },

  // High contrast mode
  highContrast: {
    border: 'border-2 border-gray-900 dark:border-gray-100'
  }
};

/**
 * Component state utilities
 */
export const states = {
  // Interactive states
  interactive: {
    disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
    loading: 'relative cursor-wait',
    active: 'ring-2 ring-primary-500 ring-offset-2'
  },

  // Validation states
  validation: {
    error: 'border-red-500 focus:ring-red-500',
    success: 'border-green-500 focus:ring-green-500',
    warning: 'border-yellow-500 focus:ring-yellow-500'
  }
};

/**
 * Layout utilities
 */
export const layout = {
  // Container utilities
  container: {
    sm: 'max-w-2xl mx-auto px-4',
    md: 'max-w-4xl mx-auto px-6',
    lg: 'max-w-6xl mx-auto px-8',
    xl: 'max-w-7xl mx-auto px-8'
  },

  // Flex utilities
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end'
  },

  // Grid utilities
  grid: {
    responsive: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
  }
};
