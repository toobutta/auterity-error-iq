import React from 'react';
import { cn } from '../../design-system/utils/cn';

// Progress indicator variants
export const PROGRESS_VARIANTS = {
  linear: 'linear',
  circular: 'circular',
  semiCircular: 'semi-circular',
  steps: 'steps'
} as const;

// Progress indicator sizes
export const PROGRESS_SIZES = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
} as const;

// Progress indicator colors
export const PROGRESS_COLORS = {
  primary: {
    bg: 'text-blue-600',
    track: 'text-gray-200',
    fill: 'bg-blue-600'
  },
  success: {
    bg: 'text-green-600',
    track: 'text-gray-200',
    fill: 'bg-green-600'
  },
  warning: {
    bg: 'text-yellow-600',
    track: 'text-gray-200',
    fill: 'bg-yellow-600'
  },
  error: {
    bg: 'text-red-600',
    track: 'text-gray-200',
    fill: 'bg-red-600'
  }
} as const;

// Linear progress component
const LinearProgress: React.FC<{
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: keyof typeof PROGRESS_COLORS;
  showValue?: boolean;
  className?: string;
}> = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showValue = false,
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('bg-gray-200 rounded-full overflow-hidden', heightClasses[size])}>
        <div
          className={cn(
            'transition-all duration-300 ease-out rounded-full',
            PROGRESS_COLORS[color].fill
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
          <span>{Math.round(percentage)}% complete</span>
          <span>{value} / {max}</span>
        </div>
      )}
    </div>
  );
};

// Circular progress component
const CircularProgress: React.FC<{
  value: number;
  max?: number;
  size?: keyof typeof PROGRESS_SIZES;
  color?: keyof typeof PROGRESS_COLORS;
  thickness?: number;
  showValue?: boolean;
  className?: string;
}> = ({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  thickness = 4,
  showValue = false,
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 20; // SVG coordinate radius
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = PROGRESS_SIZES[size];
  const [width, height] = sizeClasses.split(' ').map(cls => cls.replace(/w-|h-/, ''));

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        className={sizeClasses}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          className={PROGRESS_COLORS[color].track}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          className={PROGRESS_COLORS[color].bg}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 24 24)"
          style={{
            transition: 'stroke-dashoffset 0.3s ease'
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {showValue && (
          <span className="text-xs font-medium text-gray-900">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
};

// Steps progress component
const StepsProgress: React.FC<{
  steps: Array<{
    id: string;
    label: string;
    completed: boolean;
    current?: boolean;
  }>;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}> = ({
  steps,
  orientation = 'horizontal',
  className = ''
}) => {
  const currentStepIndex = steps.findIndex(step => step.current);
  const completedSteps = steps.filter(step => step.completed).length;

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col space-y-4', className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-4">
            {/* Step indicator */}
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium',
              step.completed
                ? 'bg-green-600 border-green-600 text-white'
                : step.current
                ? 'border-blue-600 text-blue-600'
                : 'border-gray-300 text-gray-400'
            )}>
              {step.completed ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>

            {/* Step content */}
            <div className="flex-1">
              <div className={cn(
                'text-sm font-medium',
                step.completed
                  ? 'text-green-600'
                  : step.current
                  ? 'text-blue-600'
                  : 'text-gray-500'
              )}>
                {step.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            {/* Step indicator */}
            <div className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium mb-2',
              step.completed
                ? 'bg-green-600 border-green-600 text-white'
                : step.current
                ? 'border-blue-600 text-blue-600'
                : 'border-gray-300 text-gray-400'
            )}>
              {step.completed ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>

            {/* Step label */}
            <div className={cn(
              'text-xs text-center max-w-20',
              step.completed
                ? 'text-green-600'
                : step.current
                ? 'text-blue-600'
                : 'text-gray-500'
            )}>
              {step.label}
            </div>
          </div>
        ))}
      </div>

      {/* Progress line */}
      <div className="relative mt-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-full" />
        <div
          className="absolute top-0 left-0 h-1 bg-blue-600 rounded-full transition-all duration-300"
          style={{
            width: `${(completedSteps / steps.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
};

// Main progress indicator component
const ProgressIndicator: React.FC<{
  variant?: keyof typeof PROGRESS_VARIANTS;
  value?: number;
  max?: number;
  size?: keyof typeof PROGRESS_SIZES;
  color?: keyof typeof PROGRESS_COLORS;
  steps?: Array<{
    id: string;
    label: string;
    completed: boolean;
    current?: boolean;
  }>;
  orientation?: 'horizontal' | 'vertical';
  showValue?: boolean;
  thickness?: number;
  className?: string;
}> = ({
  variant = 'linear',
  value = 0,
  max = 100,
  size = 'md',
  color = 'primary',
  steps,
  orientation = 'horizontal',
  showValue = false,
  thickness = 4,
  className = ''
}) => {
  if (variant === 'steps' && steps) {
    return (
      <StepsProgress
        steps={steps}
        orientation={orientation}
        className={className}
      />
    );
  }

  if (variant === 'circular' || variant === 'semi-circular') {
    return (
      <CircularProgress
        value={value}
        max={max}
        size={size}
        color={color}
        thickness={thickness}
        showValue={showValue}
        className={className}
      />
    );
  }

  return (
    <LinearProgress
      value={value}
      max={max}
      size={size === 'xs' ? 'sm' : size === 'sm' ? 'md' : 'lg'}
      color={color}
      showValue={showValue}
      className={className}
    />
  );
};

export default ProgressIndicator;

// Export individual components for advanced usage
export { LinearProgress, CircularProgress, StepsProgress };

// Progress utilities
export const progressUtils = {
  // Calculate percentage
  getPercentage: (value: number, max: number = 100): number => {
    return Math.min((value / max) * 100, 100);
  },

  // Format progress text
  formatProgress: (value: number, max: number = 100, showPercentage = true): string => {
    const percentage = Math.round((value / max) * 100);
    return showPercentage ? `${percentage}%` : `${value}/${max}`;
  },

  // Get progress color based on percentage
  getProgressColor: (percentage: number): keyof typeof PROGRESS_COLORS => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'primary';
    if (percentage >= 40) return 'warning';
    return 'error';
  },

  // Check if progress is complete
  isComplete: (value: number, max: number = 100): boolean => {
    return value >= max;
  }
};
