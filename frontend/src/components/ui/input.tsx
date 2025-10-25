import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "ghost" | "filled";
  inputSize?: "sm" | "md" | "lg";
  error?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  helperText?: string;
  errorText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      variant = "default",
      inputSize = "md",
      error = false,
      success = false,
      leftIcon,
      rightIcon,
      label,
      helperText,
      errorText,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = React.useId();
    const helperId = React.useId();

    const baseClasses =
      "w-full transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

    const sizeClasses = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-4 text-base",
    };

    const variantClasses = {
      default:
        "bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg",
      ghost:
        "bg-transparent border border-transparent rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800",
      filled:
        "bg-neutral-50 dark:bg-neutral-800 border border-transparent rounded-lg",
    };

    const stateClasses = error
      ? "border-red-500 dark:border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
      : success
        ? "border-green-500 dark:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
        : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400";

    const hasLeftIcon = Boolean(leftIcon);
    const hasRightIcon = Boolean(rightIcon);

    const paddingClasses = cn(
      hasLeftIcon && inputSize === "sm" && "pl-8",
      hasLeftIcon && inputSize === "md" && "pl-10",
      hasLeftIcon && inputSize === "lg" && "pl-12",
      hasRightIcon && inputSize === "sm" && "pr-8",
      hasRightIcon && inputSize === "md" && "pr-10",
      hasRightIcon && inputSize === "lg" && "pr-12",
    );

    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div
            className={cn(
              "absolute left-0 top-0 h-full flex items-center justify-center pointer-events-none text-neutral-500 dark:text-neutral-400",
              inputSize === "sm" && "w-8",
              inputSize === "md" && "w-10",
              inputSize === "lg" && "w-12",
            )}
          >
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          type={type}
          className={cn(
            baseClasses,
            sizeClasses[inputSize],
            variantClasses[variant],
            stateClasses,
            paddingClasses,
            "text-neutral-900 dark:text-neutral-100",
            "placeholder:text-neutral-500 dark:placeholder:text-neutral-400",
            className,
          )}
          disabled={disabled}
          aria-describedby={helperText || errorText ? helperId : undefined}
          aria-invalid={error}
          {...props}
        />

        {rightIcon && (
          <div
            className={cn(
              "absolute right-0 top-0 h-full flex items-center justify-center pointer-events-none text-neutral-500 dark:text-neutral-400",
              inputSize === "sm" && "w-8",
              inputSize === "md" && "w-10",
              inputSize === "lg" && "w-12",
            )}
          >
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (!label && !helperText && !errorText) {
      return inputElement;
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium",
              error
                ? "text-red-700 dark:text-red-300"
                : "text-neutral-900 dark:text-neutral-100",
              disabled && "opacity-50",
            )}
          >
            {label}
          </label>
        )}

        {inputElement}

        {(helperText || errorText) && (
          <p
            id={helperId}
            className={cn(
              "text-xs",
              error
                ? "text-red-600 dark:text-red-400"
                : "text-neutral-600 dark:text-neutral-400",
            )}
          >
            {errorText || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// Specialized search input for Error-IQ
export interface SearchInputProps
  extends Omit<InputProps, "leftIcon" | "type"> {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      onSearch,
      onClear,
      showClearButton = true,
      placeholder = "Search...",
      ...props
    },
    ref,
  ) => {
    const [value, setValue] = React.useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onSearch?.(newValue);
    };

    const handleClear = () => {
      setValue("");
      onSearch?.("");
      onClear?.();
    };

    const searchIcon = (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    );

    const clearIcon =
      value && showClearButton ? (
        <button
          type="button"
          onClick={handleClear}
          className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          aria-label="Clear search"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      ) : null;

    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        leftIcon={searchIcon}
        rightIcon={clearIcon}
        {...props}
      />
    );
  },
);

SearchInput.displayName = "SearchInput";

export { Input, SearchInput };


