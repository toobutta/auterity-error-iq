import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

// Button variant styles
const buttonVariants = {
  variant: {
    default:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline:
      "border border-neutral-200 bg-white hover:bg-neutral-50 hover:text-neutral-900 focus:ring-primary-500",
    secondary:
      "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500",
    ghost: "hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-500",
    link: "text-primary-600 underline-offset-4 hover:underline focus:ring-primary-500",
    // Error-IQ specific variants
    critical:
      "bg-severity-critical text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-success text-white hover:bg-green-700 focus:ring-green-500",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8 text-lg",
    icon: "h-10 w-10 p-0",
  },
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const variantClasses = buttonVariants.variant[variant];
    const sizeClasses = buttonVariants.size[size];

    return (
      <button
        className={cn(baseClasses, variantClasses, sizeClasses, className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };


