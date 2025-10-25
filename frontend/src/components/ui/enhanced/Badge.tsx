import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
        warning: 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        error: 'border-transparent bg-red-100 text-red-800 hover:bg-red-200',
        info: 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200',
        gradient: 'border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        glass: 'backdrop-blur-md bg-white/10 border-white/20 text-white',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
        xl: 'px-4 py-1.5 text-base',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        bounce: 'animate-bounce',
        ping: 'animate-ping',
        fadeIn: 'animate-in fade-in duration-300',
        slideIn: 'animate-in slide-in-from-right duration-300',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'none',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({
    className,
    variant,
    size,
    animation,
    leftIcon,
    rightIcon,
    removable,
    onRemove,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, animation }), className)}
        {...props}
      >
        {leftIcon && <span className="mr-1">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-1">{rightIcon}</span>}
        {removable && (
          <button
            onClick={onRemove}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            aria-label="Remove"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

// Enhanced badge components
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'online' | 'offline' | 'away' | 'busy' | 'maintenance' | 'error' | 'success';
  showDot?: boolean;
}

const StatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, showDot = true, children, className, ...props }, ref) => {
    const statusConfig = {
      online: {
        variant: 'success' as const,
        dotColor: 'bg-green-500',
        label: 'Online'
      },
      offline: {
        variant: 'secondary' as const,
        dotColor: 'bg-gray-500',
        label: 'Offline'
      },
      away: {
        variant: 'warning' as const,
        dotColor: 'bg-yellow-500',
        label: 'Away'
      },
      busy: {
        variant: 'error' as const,
        dotColor: 'bg-red-500',
        label: 'Busy'
      },
      maintenance: {
        variant: 'warning' as const,
        dotColor: 'bg-orange-500',
        label: 'Maintenance'
      },
      error: {
        variant: 'error' as const,
        dotColor: 'bg-red-500',
        label: 'Error'
      },
      success: {
        variant: 'success' as const,
        dotColor: 'bg-green-500',
        label: 'Success'
      },
    };

    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        className={cn('gap-1.5', className)}
        {...props}
      >
        {showDot && (
          <div className={cn('w-2 h-2 rounded-full', config.dotColor)} />
        )}
        {children || config.label}
      </Badge>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

export interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  showIcon?: boolean;
}

const PriorityBadge = forwardRef<HTMLDivElement, PriorityBadgeProps>(
  ({ priority, showIcon = true, children, className, ...props }, ref) => {
    const priorityConfig = {
      low: {
        variant: 'secondary' as const,
        icon: '↓',
        label: 'Low'
      },
      medium: {
        variant: 'info' as const,
        icon: '→',
        label: 'Medium'
      },
      high: {
        variant: 'warning' as const,
        icon: '↑',
        label: 'High'
      },
      urgent: {
        variant: 'error' as const,
        icon: '⚡',
        label: 'Urgent'
      },
      critical: {
        variant: 'destructive' as const,
        icon: '🚨',
        label: 'Critical'
      },
    };

    const config = priorityConfig[priority];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        className={cn('', className)}
        {...props}
      >
        {showIcon && <span>{config.icon}</span>}
        {children || config.label}
      </Badge>
    );
  }
);
PriorityBadge.displayName = 'PriorityBadge';

export interface CountBadgeProps extends Omit<BadgeProps, 'variant'> {
  count: number;
  max?: number;
  showZero?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const CountBadge = forwardRef<HTMLDivElement, CountBadgeProps>(
  ({ count, max, showZero = false, variant = 'default', className, ...props }, ref) => {
    if (count === 0 && !showZero) {
      return null;
    }

    const displayCount = max && count > max ? `${max}+` : count.toString();

    const variantClasses = {
      default: 'bg-primary text-primary-foreground',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-transparent px-2 py-1 text-xs font-semibold transition-colors',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {displayCount}
      </div>
    );
  }
);
CountBadge.displayName = 'CountBadge';

export interface NotificationBadgeProps extends Omit<BadgeProps, 'variant'> {
  count: number;
  max?: number;
  animated?: boolean;
}

const NotificationBadge = forwardRef<HTMLDivElement, NotificationBadgeProps>(
  ({ count, max, animated = true, className, ...props }, ref) => {
    if (count === 0) {
      return null;
    }

    const displayCount = max && count > max ? `${max}+` : count.toString();

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold min-w-[20px] h-5 px-1.5',
          animated && count > 0 && 'animate-bounce',
          className
        )}
        {...props}
      >
        {displayCount}
        {animated && count > 0 && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
        )}
      </div>
    );
  }
);
NotificationBadge.displayName = 'NotificationBadge';

export interface TagBadgeProps extends BadgeProps {
  color?: string;
  interactive?: boolean;
  onClick?: () => void;
}

const TagBadge = forwardRef<HTMLDivElement, TagBadgeProps>(
  ({ color, interactive, onClick, className, children, ...props }, ref) => {
    return (
      <Badge
        ref={ref}
        className={cn(
          'cursor-pointer hover:shadow-sm transition-all duration-200',
          interactive && 'hover:scale-105',
          color && `bg-${color}-100 text-${color}-800 border-${color}-200`,
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
        <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </Badge>
    );
  }
);
TagBadge.displayName = 'TagBadge';

export {
  Badge,
  StatusBadge,
  PriorityBadge,
  CountBadge,
  NotificationBadge,
  TagBadge,
  badgeVariants,
};
