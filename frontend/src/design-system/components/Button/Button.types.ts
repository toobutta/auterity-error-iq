// Button component types and interfaces

export type ButtonVariant = keyof typeof import('./Button').BUTTON_VARIANTS;
export type ButtonStyle = keyof typeof import('./Button').BUTTON_VARIANTS.primary;
export type ButtonSize = keyof typeof import('./Button').BUTTON_SIZES;

export interface BaseButtonProps {
  /** Button variant (primary, secondary, success, error, warning) */
  variant?: ButtonVariant;

  /** Button style (solid, outline, ghost) */
  style?: ButtonStyle;

  /** Button size (xs, sm, md, lg, xl) */
  size?: ButtonSize;

  /** Loading state */
  loading?: boolean;

  /** Loading text to display */
  loadingText?: string;

  /** Icon to display on the left side */
  leftIcon?: React.ReactNode;

  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;

  /** Full width button */
  fullWidth?: boolean;

  /** Button content */
  children: React.ReactNode;
}

export interface ButtonProps extends BaseButtonProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  // Additional button-specific props can be added here
}

// Button component ref type
export type ButtonRef = HTMLButtonElement;

// Button group component types
export interface ButtonGroupProps {
  /** Button group variant */
  variant?: ButtonVariant;

  /** Button group size */
  size?: ButtonSize;

  /** Whether buttons should be attached */
  attached?: boolean;

  /** Button group children */
  children: React.ReactNode;

  /** Additional CSS classes */
  className?: string;
}

// Export types for external use
export type {
  ButtonVariant as ButtonVariantType,
  ButtonStyle as ButtonStyleType,
  ButtonSize as ButtonSizeType,
  BaseButtonProps as BaseButtonPropsType,
  ButtonProps as ButtonPropsType,
  ButtonRef as ButtonRefType,
  ButtonGroupProps as ButtonGroupPropsType
};
