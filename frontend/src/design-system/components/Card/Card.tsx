import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { COLORS } from '../../tokens/colors';
import type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardMediaProps
} from './Card.types';

// Card variant styles
const CARD_VARIANTS = {
  default: 'bg-white border border-gray-200',
  elevated: 'bg-white border border-gray-200 shadow-lg',
  outlined: 'bg-white border-2 border-gray-300',
  filled: 'bg-gray-50 border border-gray-200'
} as const;

// Card size styles
const CARD_SIZES = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl'
} as const;

// Card padding styles
const CARD_PADDING = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8'
} as const;

// Interactive styles
const INTERACTIVE_STYLES = {
  base: 'cursor-pointer transition-all duration-200',
  hover: 'hover:shadow-md hover:-translate-y-1',
  selected: 'ring-2 ring-blue-500 ring-offset-2'
} as const;

// Card Header Component
export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  avatar,
  action,
  className,
  children
}) => {
  return (
    <div className={cn('flex items-start justify-between p-4 pb-2', className)}>
      <div className="flex items-start space-x-3 flex-1">
        {avatar && (
          <div className="flex-shrink-0">
            {avatar}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0 ml-3">
          {action}
        </div>
      )}
    </div>
  );
};

// Card Body Component
export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className,
  scrollable = false
}) => {
  return (
    <div
      className={cn(
        'p-4',
        scrollable && 'overflow-y-auto max-h-64',
        className
      )}
    >
      {children}
    </div>
  );
};

// Card Footer Component
export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  align = 'left'
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={cn(
      'flex items-center pt-2 px-4 pb-4 border-t border-gray-100',
      alignmentClasses[align],
      className
    )}>
      {children}
    </div>
  );
};

// Card Media Component
export const CardMedia: React.FC<CardMediaProps> = ({
  src,
  alt,
  height = 200,
  className,
  children
}) => {
  const style = typeof height === 'number' ? { height: `${height}px` } : { height };

  return (
    <div
      className={cn('relative overflow-hidden bg-gray-100', className)}
      style={style}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          {children || (
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};

// Main Card Component
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      interactive = false,
      selected = false,
      className,
      onClick,
      padding = 'md',
      ...props
    },
    ref
  ) => {
    const cardClasses = cn(
      // Base styles
      'bg-white overflow-hidden',

      // Variant styles
      CARD_VARIANTS[variant],

      // Size styles
      CARD_SIZES[size],

      // Interactive styles
      interactive && INTERACTIVE_STYLES.base,
      interactive && INTERACTIVE_STYLES.hover,
      selected && INTERACTIVE_STYLES.selected,

      // Padding
      !interactive && CARD_PADDING[padding],

      // Custom className
      className
    );

    const handleClick = () => {
      if (interactive && onClick) {
        onClick();
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (interactive && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick?.();
      }
    };

    const cardProps = {
      ref,
      className: cardClasses,
      onClick: interactive ? handleClick : undefined,
      onKeyDown: interactive ? handleKeyDown : undefined,
      tabIndex: interactive ? 0 : undefined,
      role: interactive ? 'button' : undefined,
      'aria-pressed': interactive ? selected : undefined,
      ...props
    };

    return (
      <div {...cardProps}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Compound component pattern
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Media = CardMedia;

export { Card };
export default Card;
