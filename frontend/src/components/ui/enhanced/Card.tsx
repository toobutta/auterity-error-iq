import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../utils/cn';

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: '',
        elevated: 'shadow-lg',
        outlined: 'border-2 shadow-none',
        filled: 'bg-muted',
        glass: 'backdrop-blur-md bg-white/10 border-white/20 shadow-lg',
        gradient: 'bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20',
        success: 'border-green-200 bg-green-50',
        warning: 'border-yellow-200 bg-yellow-50',
        error: 'border-red-200 bg-red-50',
        info: 'border-blue-200 bg-blue-50',
      },
      size: {
        default: '',
        sm: 'p-3',
        lg: 'p-8',
        xl: 'p-12',
      },
      hover: {
        none: '',
        lift: 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200',
        glow: 'hover:shadow-lg hover:shadow-primary/25 transition-all duration-200',
        scale: 'hover:scale-105 transition-transform duration-200',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      hover: 'none',
    },
  }
);

const cardHeaderVariants = cva('flex flex-col space-y-1.5 pb-4', {
  variants: {
    size: {
      default: 'p-6',
      sm: 'p-4',
      lg: 'p-8',
      xl: 'p-10',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const cardContentVariants = cva('pt-0', {
  variants: {
    size: {
      default: 'px-6',
      sm: 'px-4',
      lg: 'px-8',
      xl: 'px-10',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const cardFooterVariants = cva('flex items-center pt-4', {
  variants: {
    size: {
      default: 'px-6 pb-6',
      sm: 'px-4 pb-4',
      lg: 'px-8 pb-8',
      xl: 'px-10 pb-10',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, hover }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export interface CardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ size }), className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ size }), className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ size }), className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, level = 3, ...props }, ref) => {
    const Component = `h${level}` as keyof JSX.IntrinsicElements;
    return (
      <Component
        ref={ref}
        className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

// Enhanced card components with additional features
export interface StatCardProps extends CardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  description?: string;
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, change, icon, description, className, ...props }, ref) => (
    <Card ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <div className={cn(
                  'flex items-center text-xs font-medium',
                  change.trend === 'up' && 'text-green-600',
                  change.trend === 'down' && 'text-red-600',
                  change.trend === 'neutral' && 'text-muted-foreground'
                )}>
                  {change.trend === 'up' && '↗'}
                  {change.trend === 'down' && '↘'}
                  {change.trend === 'neutral' && '→'}
                  {Math.abs(change.value)}%
                  {change.label && <span className="ml-1">{change.label}</span>}
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
);
StatCard.displayName = 'StatCard';

export interface MetricCardProps extends CardProps {
  title: string;
  value: string | number;
  unit?: string;
  target?: number;
  showProgress?: boolean;
  color?: 'default' | 'success' | 'warning' | 'error';
}

const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  ({ title, value, unit, target, showProgress, color = 'default', className, ...props }, ref) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const progress = target ? Math.min((numericValue / target) * 100, 100) : 0;

    const colorClasses = {
      default: 'text-primary',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
    };

    return (
      <Card ref={ref} className={cn('', className)} {...props}>
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <p className={cn('text-3xl font-bold', colorClasses[color])}>
                {value}
              </p>
              {unit && (
                <span className="text-lg text-muted-foreground">{unit}</span>
              )}
            </div>
            {target && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                {showProgress && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        color === 'success' && 'bg-green-600',
                        color === 'warning' && 'bg-yellow-600',
                        color === 'error' && 'bg-red-600',
                        color === 'default' && 'bg-primary'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
MetricCard.displayName = 'MetricCard';

export interface FeatureCardProps extends CardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  action?: React.ReactNode;
  disabled?: boolean;
}

const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ title, description, icon, badge, action, disabled, className, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        'relative transition-all duration-200',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:shadow-md cursor-pointer',
        className
      )}
      {...props}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">{title}</h3>
                {badge && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {badge}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
          {action && (
            <div className="flex-shrink-0 ml-4">
              {action}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
);
FeatureCard.displayName = 'FeatureCard';

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  StatCard,
  MetricCard,
  FeatureCard,
  cardVariants,
  cardHeaderVariants,
  cardContentVariants,
  cardFooterVariants,
};
