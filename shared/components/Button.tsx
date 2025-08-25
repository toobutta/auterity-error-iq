import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) => {
    const getVariantClasses = () => {
      switch (variant) {
        case "secondary":
          return "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500";
        case "danger":
          return "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500";
        case "ghost":
          return "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500";
        case "outline":
          return "bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500";
        default:
          return "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500";
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case "sm":
          return "px-3 py-1.5 text-sm";
        case "lg":
          return "px-6 py-3 text-lg";
        default:
          return "px-4 py-2 text-base";
      }
    };

    const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md
    focus:outline-none focus:ring-2 focus:ring-offset-2
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? "w-full" : ""}
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${className}
  `
      .trim()
      .replace(/\s+/g, " ");

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <LoadingSpinner
            size={size === "sm" ? "sm" : "md"}
            color={
              variant === "primary" || variant === "danger"
                ? "white"
                : "primary"
            }
            className="mr-2"
          />
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
