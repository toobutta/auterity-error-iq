// Input component types and interfaces

export type InputVariant = keyof typeof import('./Input').INPUT_VARIANTS;
export type InputSize = keyof typeof import('./Input').INPUT_SIZES;

export interface BaseInputProps {
  /** Input variant (default, error, success, warning) */
  variant?: InputVariant;

  /** Input size (xs, sm, md, lg) */
  size?: InputSize;

  /** Input label */
  label?: string;

  /** Helper text */
  helperText?: string;

  /** Error message */
  error?: string;

  /** Success message */
  success?: string;

  /** Warning message */
  warning?: string;

  /** Icon to display on the left side */
  leftIcon?: React.ReactNode;

  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;

  /** Full width input */
  fullWidth?: boolean;

  /** Loading state */
  loading?: boolean;
}

export interface InputProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  // Additional input-specific props can be added here
}

// Input component ref type
export type InputRef = HTMLInputElement;

// Textarea component types (extends input)
export interface TextareaProps extends Omit<InputProps, 'type'> {
  /** Number of rows */
  rows?: number;

  /** Auto-resize textarea */
  autoResize?: boolean;

  /** Maximum number of rows for auto-resize */
  maxRows?: number;
}

// Export types for external use
export type {
  InputVariant as InputVariantType,
  InputSize as InputSizeType,
  BaseInputProps as BaseInputPropsType,
  InputProps as InputPropsType,
  InputRef as InputRefType,
  TextareaProps as TextareaPropsType
};
