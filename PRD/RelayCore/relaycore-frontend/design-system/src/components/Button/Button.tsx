import React from 'react';
import styled, { css } from 'styled-components';
import { tokens } from '../../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const getVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return css`
        background-color: ${({ theme }) => theme.colors.primary};
        color: ${({ theme }) => theme.colors.white};
        &:hover:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.primaryDark};
        }
        &:active:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.primaryDarker};
        }
      `;
    case 'secondary':
      return css`
        background-color: ${({ theme }) => theme.colors.secondary};
        color: ${({ theme }) => theme.colors.white};
        &:hover:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.secondaryDark};
        }
        &:active:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.secondaryDarker};
        }
      `;
    case 'tertiary':
      return css`
        background-color: transparent;
        color: ${({ theme }) => theme.colors.primary};
        border: 1px solid ${({ theme }) => theme.colors.primary};
        &:hover:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.backgroundLight};
        }
        &:active:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.background};
        }
      `;
    case 'danger':
      return css`
        background-color: ${({ theme }) => theme.colors.danger};
        color: ${({ theme }) => theme.colors.white};
        &:hover:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.dangerDark};
        }
        &:active:not(:disabled) {
          background-color: ${({ theme }) => theme.colors.dangerDarker};
        }
      `;
    default:
      return '';
  }
};

const getSizeStyles = (size: ButtonSize) => {
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

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${tokens.borders.radius.md};
  font-family: ${tokens.typography.fontFamily.base};
  font-weight: ${tokens.typography.fontWeight.medium};
  transition: all ${tokens.animations.duration.fast} ${tokens.animations.easing.easeInOut};
  cursor: pointer;
  border: none;
  outline: none;
  gap: ${tokens.spacing.xs};
  
  ${({ variant = 'primary' }) => getVariantStyles(variant)}
  ${({ size = 'medium' }) => getSizeStyles(size)}
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: ${tokens.spacing.xs};
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner />}
      {!isLoading && leftIcon && <span>{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span>{rightIcon}</span>}
    </StyledButton>
  );
};