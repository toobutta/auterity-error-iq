import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Toast positions
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

// Toast props
export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast configuration
export const TOAST_CONFIG = {
  success: {
    icon: '✓',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600'
  },
  error: {
    icon: '✕',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600'
  },
  warning: {
    icon: '⚠',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600'
  },
  info: {
    icon: 'ℹ',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600'
  }
} as const;

// Toast component
const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  description,
  duration = 5000,
  onClose,
  action
}) => {
  const config = TOAST_CONFIG[type];

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  return (
    <div
      className={cn(
        'toast-item',
        'max-w-sm w-full',
        'shadow-lg rounded-lg border pointer-events-auto',
        'transform transition-all duration-300 ease-in-out',
        config.bgColor,
        config.borderColor,
        config.textColor
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className={cn('flex-shrink-0', config.iconColor)}>
            <span className="text-lg font-semibold">
              {config.icon}
            </span>
          </div>

          {/* Content */}
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium">
              {title}
            </p>
            {description && (
              <p className="mt-1 text-sm opacity-90">
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="ml-4 flex-shrink-0 flex">
            {action && (
              <button
                type="button"
                className={cn(
                  'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  'text-sm font-medium transition-colors duration-200',
                  'hover:bg-black hover:bg-opacity-10'
                )}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            )}

            <button
              type="button"
              className={cn(
                'ml-2 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                'text-sm font-medium transition-colors duration-200',
                'hover:bg-black hover:bg-opacity-10'
              )}
              onClick={() => onClose(id)}
              aria-label="Dismiss"
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        {duration > 0 && (
          <div className="mt-3">
            <div className="bg-black bg-opacity-10 rounded-full h-1">
              <div
                className="bg-current h-1 rounded-full transition-all duration-100 ease-linear"
                style={{
                  width: '100%',
                  animation: `shrink ${duration}ms linear forwards`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;
