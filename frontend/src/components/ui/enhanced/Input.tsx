import React, { forwardRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const inputVariants = cva(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        success: 'border-green-500 focus-visible:ring-green-500',
        error: 'border-red-500 focus-visible:ring-red-500',
        warning: 'border-yellow-500 focus-visible:ring-yellow-500',
        info: 'border-blue-500 focus-visible:ring-blue-500',
      },
      size: {
        default: 'h-10',
        sm: 'h-8 px-2 text-xs',
        lg: 'h-12 px-4 text-base',
        xl: 'h-14 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  error?: string;
  hint?: string;
  label?: string;
  required?: boolean;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    type = 'text',
    leftIcon,
    rightIcon,
    clearable,
    onClear,
    error,
    hint,
    label,
    required,
    containerClassName,
    value,
    onChange,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(value || '');

    const currentValue = value !== undefined ? value : internalValue;
    const hasValue = currentValue && currentValue.toString().length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      setInternalValue('');
      onClear?.();
      if (props.name) {
        // Trigger onChange for form libraries
        const syntheticEvent = {
          target: { name: props.name, value: '' },
          currentTarget: { name: props.name, value: '' },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      }
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;
    const effectiveVariant = error ? 'error' : variant;

    const inputElement = (
      <div className={cn('relative', containerClassName)}>
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}

        <input
          type={inputType}
          className={cn(
            inputVariants({ variant: effectiveVariant, size }),
            leftIcon && 'pl-10',
            (rightIcon || (type === 'password') || (clearable && hasValue)) && 'pr-10',
            className
          )}
          ref={ref}
          value={currentValue}
          onChange={handleChange}
          {...props}
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {clearable && hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear input"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}

          {rightIcon && !type === 'password' && !(clearable && hasValue) && rightIcon}
        </div>
      </div>
    );

    if (label || error || hint) {
      return (
        <div className="space-y-1">
          {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {inputElement}
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          {hint && !error && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {hint}
            </p>
          )}
        </div>
      );
    }

    return inputElement;
  }
);

Input.displayName = 'Input';

// Enhanced input components
export interface SearchInputProps extends Omit<InputProps, 'type'> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, debounceMs = 300, onChange, ...props }, ref) => {
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        onSearch?.(e.target.value);
      }, debounceMs);

      setDebounceTimer(timer);
    };

    React.useEffect(() => {
      return () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
      };
    }, [debounceTimer]);

    return (
      <Input
        ref={ref}
        type="text"
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        placeholder="Search..."
        onChange={handleChange}
        {...props}
      />
    );
  }
);
SearchInput.displayName = 'SearchInput';

export interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ min, max, step = 1, precision, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Apply precision if specified
      if (precision !== undefined && value) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          value = numValue.toFixed(precision);
        }
      }

      // Create synthetic event with formatted value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value,
        },
      };

      onChange?.(syntheticEvent);
    };

    return (
      <Input
        ref={ref}
        type="number"
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
NumberInput.displayName = 'NumberInput';

export interface EmailInputProps extends Omit<InputProps, 'type'> {
  validateFormat?: boolean;
}

const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ validateFormat = true, onChange, ...props }, ref) => {
    const [isValid, setIsValid] = useState(true);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (validateFormat && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsValid(emailRegex.test(value));
      } else {
        setIsValid(true);
      }

      onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        type="email"
        variant={validateFormat && !isValid ? 'error' : 'default'}
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        error={!isValid ? 'Please enter a valid email address' : undefined}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
EmailInput.displayName = 'EmailInput';

export interface URLInputProps extends Omit<InputProps, 'type'> {
  validateFormat?: boolean;
}

const URLInput = forwardRef<HTMLInputElement, URLInputProps>(
  ({ validateFormat = true, onChange, ...props }, ref) => {
    const [isValid, setIsValid] = useState(true);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (validateFormat && value) {
        try {
          new URL(value);
          setIsValid(true);
        } catch {
          setIsValid(false);
        }
      } else {
        setIsValid(true);
      }

      onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        type="url"
        variant={validateFormat && !isValid ? 'error' : 'default'}
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        }
        error={!isValid ? 'Please enter a valid URL' : undefined}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
URLInput.displayName = 'URLInput';

export interface PhoneInputProps extends Omit<InputProps, 'type'> {
  countryCode?: string;
  format?: 'international' | 'national';
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ countryCode = '+1', format = 'national', onChange, ...props }, ref) => {
    const [phoneNumber, setPhoneNumber] = useState('');

    const formatPhoneNumber = (value: string) => {
      // Remove all non-numeric characters
      const numbers = value.replace(/\D/g, '');

      if (format === 'national') {
        // Format as (XXX) XXX-XXXX
        if (numbers.length <= 3) {
          return numbers;
        } else if (numbers.length <= 6) {
          return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
        } else {
          return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
        }
      }

      return numbers;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setPhoneNumber(formatted);

      // Create synthetic event with formatted value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: countryCode + formatted.replace(/\D/g, ''),
        },
      };

      onChange?.(syntheticEvent);
    };

    return (
      <Input
        ref={ref}
        type="tel"
        value={phoneNumber}
        leftIcon={
          <span className="text-sm font-medium text-muted-foreground">
            {countryCode}
          </span>
        }
        placeholder="(555) 123-4567"
        onChange={handleChange}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = 'PhoneInput';

export {
  Input,
  SearchInput,
  NumberInput,
  EmailInput,
  URLInput,
  PhoneInput,
  inputVariants,
};
