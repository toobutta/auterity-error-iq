import React from 'react';
import styled, { css } from 'styled-components';
import { tokens } from '../../tokens';

export type CardVariant = 'default' | 'outlined' | 'elevated';

export interface CardProps {
  variant?: CardVariant;
  padding?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  fullWidth?: boolean;
}

const getVariantStyles = (variant: CardVariant) => {
  switch (variant) {
    case 'default':
      return css`
        background-color: ${({ theme }) => theme.colors.white};
        border: none;
        box-shadow: ${tokens.shadows.sm};
      `;
    case 'outlined':
      return css`
        background-color: ${({ theme }) => theme.colors.white};
        border: 1px solid ${({ theme }) => theme.colors.border};
        box-shadow: none;
      `;
    case 'elevated':
      return css`
        background-color: ${({ theme }) => theme.colors.white};
        border: none;
        box-shadow: ${tokens.shadows.lg};
      `;
    default:
      return '';
  }
};

const StyledCard = styled.div<{
  variant: CardVariant;
  padding: string;
  isClickable: boolean;
  fullWidth?: boolean;
}>`
  border-radius: ${tokens.borders.radius.lg};
  overflow: hidden;
  transition: all ${tokens.animations.duration.fast} ${tokens.animations.easing.easeInOut};
  
  ${({ variant }) => getVariantStyles(variant)}
  padding: ${({ padding }) => padding};
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}
  
  ${({ isClickable }) => isClickable && css`
    cursor: pointer;
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${tokens.shadows.md};
    }
  `}
`;

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = tokens.spacing.md,
  children,
  className,
  onClick,
  fullWidth = false,
}) => {
  return (
    <StyledCard
      variant={variant}
      padding={padding}
      isClickable={!!onClick}
      onClick={onClick}
      className={className}
      fullWidth={fullWidth}
    >
      {children}
    </StyledCard>
  );
};

export const CardHeader = styled.div`
  padding: ${tokens.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-weight: ${tokens.typography.fontWeight.medium};
`;

export const CardBody = styled.div`
  padding: ${tokens.spacing.md};
`;

export const CardFooter = styled.div`
  padding: ${tokens.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: ${tokens.spacing.sm};
`;