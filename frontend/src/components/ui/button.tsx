import * as React from "react";
import { cn } from "../../lib/utils";

// Modern button variants with glassmorphism and enhanced animations
const buttonVariants = {
  // Base styles
  base: "inline-flex items-center justify-center font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",

  // Variants
  variants: {
    default:
      "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl focus-visible:ring-blue-500",
    destructive:
      "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl focus-visible:ring-red-500",
    outline:
      "border-2 border-neutral-300 dark:border-neutral-700 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 focus-visible:ring-neutral-500",
    secondary:
      "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 shadow-sm hover:shadow-md focus-visible:ring-neutral-500",
    ghost:
      "hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 focus-visible:ring-neutral-500",
    link: "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline focus-visible:ring-blue-500",

    // Error-IQ specific variants with enhanced styling
    critical:
      "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-500/25 focus-visible:ring-red-500",
    success:
      "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-green-500/25 focus-visible:ring-green-500",
    warning:
      "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-lg hover:shadow-yellow-500/25 focus-visible:ring-yellow-500",
    glass:
      "glass text-neutral-900 dark:text-neutral-100 hover:bg-white/20 dark:hover:bg-black/20 border border-white/20 dark:border-white/10 focus-visible:ring-white/50",
  },

  // Sizes
  sizes: {
    sm: "h-8 px-3 text-xs rounded-lg",
    md: "h-10 px-4 text-sm rounded-lg",
    lg: "h-12 px-6 text-base rounded-xl",
    xl: "h-14 px-8 text-lg rounded-xl",
    icon: "h-10 w-10 rounded-lg",
    "icon-sm": "h-8 w-8 rounded-lg",
    "icon-lg": "h-12 w-12 rounded-xl",
  },
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variants;
  size?: keyof typeof buttonVariants.sizes;
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  pulse?: boolean;
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      asChild = false,
      loading,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      pulse = false,
      glow = false,
      ...props
    },
    ref,
  ) => {
    const baseClasses = buttonVariants.base;
    const variantClasses = buttonVariants.variants[variant];
    const sizeClasses = buttonVariants.sizes[size];

    const pulseClasses = pulse ? "animate-pulse" : "";
    const glowClasses = glow ? "shadow-2xl animate-pulse" : "";

    const content = (
      <>
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
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
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && (
          <span className="mr-2 flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span>{loading && loadingText ? loadingText : children}</span>
        {!loading && rightIcon && (
          <span className="ml-2 flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </>
    );

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses,
          sizeClasses,
          pulseClasses,
          glowClasses,
          className,
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";

// Icon Button specialized component
export interface IconButtonProps
  extends Omit<ButtonProps, "leftIcon" | "rightIcon" | "children"> {
  icon: React.ReactNode;
  "aria-label": string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = "icon", ...props }, ref) => {
    return (
      <Button ref={ref} size={size} {...props}>
        {icon}
      </Button>
    );
  },
);

IconButton.displayName = "IconButton";

// Floating Action Button for modern interfaces
export interface FABProps extends Omit<ButtonProps, "size"> {
  size?: "md" | "lg";
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  offset?: "normal" | "large";
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
  (
    {
      className,
      position = "bottom-right",
      offset = "normal",
      size = "lg",
      variant = "default",
      ...props
    },
    ref,
  ) => {
    const positionClasses = {
      "bottom-right":
        offset === "large"
          ? "fixed bottom-8 right-8"
          : "fixed bottom-6 right-6",
      "bottom-left":
        offset === "large" ? "fixed bottom-8 left-8" : "fixed bottom-6 left-6",
      "top-right":
        offset === "large" ? "fixed top-8 right-8" : "fixed top-6 right-6",
      "top-left":
        offset === "large" ? "fixed top-8 left-8" : "fixed top-6 left-6",
    };

    const fabSize = size === "lg" ? "h-14 w-14" : "h-12 w-12";

    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(
          positionClasses[position],
          fabSize,
          "rounded-full shadow-2xl hover:shadow-3xl z-50 transition-all duration-300",
          className,
        )}
        {...props}
      />
    );
  },
);

FAB.displayName = "FAB";

export { Button, IconButton, FAB, buttonVariants };


