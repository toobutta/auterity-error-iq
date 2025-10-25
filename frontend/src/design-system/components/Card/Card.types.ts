import React from 'react';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Card variant */
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
  /** Whether card is interactive/hoverable */
  interactive?: boolean;
  /** Whether card is selected */
  selected?: boolean;
  /** Custom className */
  className?: string;
  /** Click handler for interactive cards */
  onClick?: () => void;
  /** Card padding */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

export interface CardMediaProps {
  src?: string;
  alt?: string;
  height?: number | string;
  className?: string;
  children?: React.ReactNode;
}
