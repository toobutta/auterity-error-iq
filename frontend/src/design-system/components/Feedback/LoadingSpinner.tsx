import React from 'react';
import { cn } from '../../utils/cn';

// Loading spinner sizes
export const SPINNER_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10'
} as const;

// Loading spinner variants
export const SPINNER_VARIANTS = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  white: 'text-white'
} as const;

// Loading spinner props
export interface LoadingSpinnerProps {
  size?: keyof typeof SPINNER_SIZES;
  variant?: keyof typeof SPINNER_VARIANTS;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

// Loading spinner component
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  showLabel = false,
  label = 'Loading...'
}) => {
  const sizeClasses = SPINNER_SIZES[size];
  const variantClasses = SPINNER_VARIANTS[variant];

  return (
    <div className={cn('loading-spinner-wrapper', showLabel && 'flex items-center space-x-2', className)}>
      <svg
        className={cn('animate-spin', sizeClasses, variantClasses)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>

      {showLabel && (
        <span className="text-sm text-gray-600" aria-live="polite">
          {label}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
