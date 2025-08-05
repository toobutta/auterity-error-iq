import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';
import { tokens } from '../../tokens';

export type InputSize = 'small' | 'medium' | 'large';
export type InputVariant = 'default' | 'filled' | 'outlined';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  variant?: InputVariant;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
}

const getSizeStyles = (size: InputSize) => {
  switch (size) {
    case 'small':
      return css`
        padding: ${tokens.spacing.xs} ${tokens.spacing.sm};
        font-size: ${tokens.typography.fontSize.sm};
      `;
    case 'medium':
      return css`
        padding: ${tokens.spacing.sm} ${tokens.spacing.md};
        font-size: ${tokens.typography.fontSize.md};
      `;
    case 'large':
      return css`
        padding: ${tokens.spacing.md} ${tokens.spacing.lg};
        font-size: ${tokens.typography.fontSize.lg};
      `;
    default:
      return '';
  }
};

const getVariantStyles = (variant: InputVariant, error: boolean) => {
  switch (variant) {
    case 'default':
      return css`
        border: 1px solid ${({ theme }) => error ? theme.colors.danger : theme.colors.border};
        background-color: ${({ theme }) => theme.colors.white};
        &:focus {
          border-color: ${({ theme }) => error ? theme.colors.danger : theme.colors.primary};
          box-shadow: 0 0 0 2px ${({ theme }) => error ? theme.colors.dangerLight : theme.colors.primaryLight};
        }
      `;
    case 'filled':
      return css`
        border: 1px solid transparent;
        background-color: ${({ theme }) => error ? theme.colors.dangerLighter : theme.colors.backgroundLight};
        &:focus {
          border-color: ${({ theme }) => error ? theme.colors.danger : theme.colors.primary};
          background-color: ${({ theme }) => theme.colors.white};
        }
      `;
    case 'outlined':
      return css`
        border: 1px solid ${({ theme }) => error ? theme.colors.danger : theme.colors.border};
        background-color: transparent;
        &:focus {
          border-color: ${({ theme }) => error ? theme.colors.danger : theme.colors.primary};
          box-shadow: 0 0 0 2px ${({ theme }) => error ? theme.colors.dangerLight : theme.colors.primaryLight};
        }
      `;
    default:
      return '';
  }
};

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}
`;

const InputLabel = styled.label<{ error?: boolean }>`
  font-size: ${tokens.typography.fontSize.sm};
  font-weight: ${tokens.typography.fontWeight.medium};
  margin-bottom: ${tokens.spacing.xs};
  color: ${({ theme, error }) => error ? theme.colors.danger : theme.colors.textPrimary};
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<{
  size?: InputSize;
  variant?: InputVariant;
  error?: boolean;
  fullWidth?: boolean;
  hasLeftIcon?: boolean;
  hasRightIcon?: boolean;
}>`
  font-family: ${tokens.typography.fontFamily.base};
  border-radius: ${tokens.borders.radius.md};
  transition: all ${tokens.animations.duration.fast} ${tokens.animations.easing.easeInOut};
  outline: none;
  width: 100%;
  
  ${({ size = 'medium' }) => getSizeStyles(size)}
  ${({ variant = 'default', error = false }) => getVariantStyles(variant, error)}
  
  ${({ hasLeftIcon }) => hasLeftIcon && css`padding-left: 2.5rem;`}
  ${({ hasRightIcon }) => hasRightIcon && css`padding-right: 2.5rem;`}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const IconWrapper = styled.div<{ position: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ position }) => position === 'left' ? css`left: ${tokens.spacing.sm};` : css`right: ${tokens.spacing.sm};`}
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const HelperText = styled.div<{ error?: boolean }>`
  font-size: ${tokens.typography.fontSize.xs};
  margin-top: ${tokens.spacing.xs};
  color: ${({ theme, error }) => error ? theme.colors.danger : theme.colors.textSecondary};
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  size = 'medium',
  variant = 'default',
  fullWidth = false,
  error = false,
  helperText,
  leftIcon,
  rightIcon,
  label,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <InputContainer fullWidth={fullWidth}>
      {label && <InputLabel htmlFor={inputId} error={error}>{label}</InputLabel>}
      <InputWrapper>
        {leftIcon && <IconWrapper position="left">{leftIcon}</IconWrapper>}
        <StyledInput
          id={inputId}
          ref={ref}
          size={size}
          variant={variant}
          error={error}
          fullWidth={fullWidth}
          hasLeftIcon={!!leftIcon}
          hasRightIcon={!!rightIcon}
          {...props}
        />
        {rightIcon && <IconWrapper position="right">{rightIcon}</IconWrapper>}
      </InputWrapper>
      {helperText && <HelperText error={error}>{helperText}</HelperText>}
    </InputContainer>
  );
});

Input.displayName = 'Input';