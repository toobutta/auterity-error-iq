import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { SIZES } from '../../tokens/spacing';

// Input variants
export const INPUT_VARIANTS = {
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
  success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
  warning: 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500'
} as const;

// Input sizes
export const INPUT_SIZES = {
  xs: {
    height: SIZES.input.xs.height,
    paddingX: SIZES.input.xs.paddingX,
    fontSize: SIZES.input.xs.fontSize
  },
  sm: {
    height: SIZES.input.sm.height,
    paddingX: SIZES.input.sm.paddingX,
    fontSize: SIZES.input.sm.fontSize
  },
  md: {
    height: SIZES.input.md.height,
    paddingX: SIZES.input.md.paddingX,
    fontSize: SIZES.input.md.fontSize
  },
  lg: {
    height: SIZES.input.lg.height,
    paddingX: SIZES.input.lg.paddingX,
    fontSize: SIZES.input.lg.fontSize
  }
} as const;

// Input component props
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: keyof typeof INPUT_VARIANTS;
  size?: keyof typeof INPUT_SIZES;
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  warning?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

// Input component with forwardRef
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      label,
      helperText,
      error,
      success,
      warning,
      leftIcon,
      rightIcon,
      fullWidth = false,
      loading = false,
      disabled = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for accessibility
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    // Get variant classes
    const variantClasses = INPUT_VARIANTS[variant];

    // Get size configuration
    const sizeConfig = INPUT_SIZES[size];

    // Combine input classes
    const inputClasses = cn(
      // Base input styles
      'block w-full rounded-md border transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
      'placeholder:text-gray-400',

      // Size-specific styles
      `h-${sizeConfig.height}`,
      `px-${sizeConfig.paddingX}`,
      `text-${sizeConfig.fontSize}`,

      // Variant styles
      variantClasses,

      // Full width
      fullWidth && 'w-full',

      // Icon padding adjustments
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',

      // Loading state
      loading && 'cursor-wait',

      // Custom className
      className
    );

    // Determine status for styling
    const status = error ? 'error' : success ? 'success' : warning ? 'warning' : null;

    return (
      <div className={cn('input-wrapper', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">
                {leftIcon}
              </span>
            </div>
          )}

          {/* Input element */}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            disabled={disabled || loading}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` :
              success ? `${inputId}-success` :
              warning ? `${inputId}-warning` :
              helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {/* Right icon or loading spinner */}
          {rightIcon && !loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">
                {rightIcon}
              </span>
            </div>
          )}

          {/* Loading spinner */}
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg
                className="animate-spin h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
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
            </div>
          )}
        </div>

        {/* Helper text */}
        {helperText && !error && !success && !warning && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Success message */}
        {success && (
          <p
            id={`${inputId}-success`}
            className="mt-2 text-sm text-green-600"
          >
            {success}
          </p>
        )}

        {/* Warning message */}
        {warning && (
          <p
            id={`${inputId}-warning`}
            className="mt-2 text-sm text-yellow-600"
          >
            {warning}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
