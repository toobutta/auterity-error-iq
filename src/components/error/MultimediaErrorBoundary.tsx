import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class MultimediaErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('Multimedia Error Boundary caught an error:', error, errorInfo);

    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error monitoring service
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, this would send to your error monitoring service
    // For now, we'll log to console and could send to services like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      retryCount: this.state.retryCount
    };

    // Send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, or custom error service
      // this.errorMonitoringService.captureException(error, {
      //   contexts: { react: errorInfo },
      //   tags: { component: 'multimedia', retryCount: this.state.retryCount }
      // });
    }

    console.error('Error Report:', errorReport);
  };

  private getCurrentUserId = (): string => {
    // Get current user ID from your auth system
    // This is a placeholder - replace with your actual user identification
    return localStorage.getItem('userId') || 'anonymous';
  };

  private getSessionId = (): string => {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleGoHome = () => {
    window.location.href = '/multimedia';
  };

  private handleReload = () => {
    window.location.reload();
  };

  private getErrorMessage = (error: Error): string => {
    // Convert technical errors to user-friendly messages
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Unable to connect to our servers. Please check your internet connection.';
    }

    if (error.message.includes('permission') || error.message.includes('access')) {
      return 'You don\'t have permission to perform this action.';
    }

    if (error.message.includes('quota') || error.message.includes('limit')) {
      return 'You\'ve reached your usage limit. Please upgrade your plan.';
    }

    if (error.message.includes('timeout')) {
      return 'The operation timed out. Please try again.';
    }

    if (error.message.includes('video') || error.message.includes('media')) {
      return 'There was an issue processing your media file. Please try a different file.';
    }

    // Default user-friendly message
    return 'Something went wrong. Our team has been notified and is working to fix this issue.';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={cn('multimedia-error-boundary', this.props.className)}>
          <div className="error-container">
            <div className="error-icon">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500" />
            </div>

            <div className="error-content">
              <h2 className="error-title">Oops! Something went wrong</h2>
              <p className="error-message">
                {this.state.error ? this.getErrorMessage(this.state.error) : 'An unexpected error occurred.'}
              </p>

              {this.state.retryCount < this.maxRetries && this.props.showRetry !== false && (
                <div className="error-actions">
                  <button
                    onClick={this.handleRetry}
                    className="retry-button"
                    disabled={this.state.retryCount >= this.maxRetries}
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </button>
                </div>
              )}

              <div className="error-actions secondary">
                <button onClick={this.handleGoHome} className="secondary-button">
                  <HomeIcon className="w-4 h-4" />
                  Go to Dashboard
                </button>
                <button onClick={this.handleReload} className="secondary-button">
                  <ArrowPathIcon className="w-4 h-4" />
                  Reload Page
                </button>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Technical Details (Development Only)</summary>
                <pre className="error-stack">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="error-component-stack">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="error-footer">
              <p className="error-reference">
                Error ID: {this.getSessionId().split('_')[1]}
              </p>
              <p className="error-help">
                If this problem persists, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withMultimediaErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <MultimediaErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </MultimediaErrorBoundary>
  );

  WrappedComponent.displayName = `withMultimediaErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for manual error reporting
export function useErrorReporting() {
  const reportError = (error: Error, context?: Record<string, any>) => {
    console.error('Manual error report:', error, context);

    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // this.errorMonitoringService.captureException(error, {
      //   contexts: context,
      //   tags: { source: 'manual-report' }
      // });
    }
  };

  const reportUserAction = (action: string, details?: Record<string, any>) => {
    console.log('User action reported:', action, details);

    // Track user actions for debugging
    // This could be sent to analytics service
  };

  return {
    reportError,
    reportUserAction
  };
}
