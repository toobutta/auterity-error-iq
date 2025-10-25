import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { LoadingSpinner } from '../LoadingSpinner';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 shadow-sm hover:shadow-md active:shadow-sm',
        secondary:
          'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus-visible:ring-neutral-400 border border-neutral-200',
        ghost:
          'hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-400',
        danger:
          'bg-semantic-error text-white hover:bg-red-600 focus-visible:ring-semantic-error shadow-sm hover:shadow-md',
        link:
          'text-primary-500 underline-offset-4 hover:underline focus-visible:ring-primary-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
        md: 'h-10 px-4 text-sm rounded-md gap-2',
        lg: 'h-12 px-6 text-base rounded-lg gap-2.5',
        icon: 'h-10 w-10 rounded-md',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const showLeftIcon = leftIcon && !loading;
    const showRightIcon = rightIcon && !loading;

    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <LoadingSpinner
            size={size === 'sm' ? 'sm' : 'md'}
            className="mr-2"
          />
        )}
        {showLeftIcon && <span className="inline-flex">{leftIcon}</span>}
        {children}
        {showRightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';