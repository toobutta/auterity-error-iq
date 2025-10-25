import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;
  private errorCount = 0;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.errorCount++;

    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state when props change (if enabled)
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasChanged = resetKeys.some(key => prevProps[key as keyof Props] !== this.props[key as keyof Props]);
      if (hasChanged) {
        this.resetError();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorId: this.state.errorId,
        errorCount: this.errorCount,
        // Add user context if available
        userId: this.getUserId(),
        sessionId: this.getSessionId()
      };

      // Send to monitoring service
      this.sendToMonitoring(errorReport);
    }
  };

  private sendToMonitoring = (errorReport: any) => {
    // Placeholder for monitoring service integration
    // Could be Sentry, LogRocket, Bugsnag, etc.
    console.log('Sending error to monitoring:', errorReport);

    // Example with fetch (replace with actual monitoring service)
    /*
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    }).catch(console.error);
    */
  };

  private getUserId = (): string | undefined => {
    // Get user ID from auth context or local storage
    try {
      return localStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  };

  private getSessionId = (): string | undefined => {
    // Get session ID from session storage or generate one
    try {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    } catch {
      return undefined;
    }
  };

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  resetErrorAfterDelay = (delay: number = 5000) => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.resetError();
    }, delay);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onReset={this.resetError}
          onRetry={() => window.location.reload()}
          errorCount={this.errorCount}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  onReset: () => void;
  onRetry: () => void;
  errorCount: number;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  onReset,
  onRetry,
  errorCount
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="error-boundary-fallback" role="alert" aria-live="assertive">
      <div className="error-boundary-content">
        <div className="error-boundary-icon">
          ⚠️
        </div>

        <h2 className="error-boundary-title">
          Something went wrong
        </h2>

        <p className="error-boundary-message">
          {errorCount > 1
            ? `This error has occurred ${errorCount} times. The application encountered an unexpected error.`
            : 'The application encountered an unexpected error.'
          }
        </p>

        <div className="error-boundary-actions">
          <button
            className="error-boundary-button primary"
            onClick={onReset}
            aria-label="Try to recover from the error"
          >
            Try Again
          </button>

          <button
            className="error-boundary-button secondary"
            onClick={onRetry}
            aria-label="Reload the entire application"
          >
            Reload App
          </button>

          <button
            className="error-boundary-button link"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-controls="error-details"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {showDetails && (
          <details className="error-boundary-details" id="error-details">
            <summary>Error Details</summary>
            <div className="error-details-content">
              {errorId && (
                <p><strong>Error ID:</strong> {errorId}</p>
              )}
              {error && (
                <>
                  <p><strong>Error Message:</strong> {error.message}</p>
                  {error.stack && (
                    <pre className="error-stack">
                      <strong>Stack Trace:</strong>
                      {error.stack}
                    </pre>
                  )}
                </>
              )}
              {errorInfo && (
                <pre className="error-component-stack">
                  <strong>Component Stack:</strong>
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

// Specialized error boundaries for different parts of the app
export const CanvasErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="canvas-error-fallback">
        <div className="canvas-error-icon">🎨</div>
        <h3>Canvas Error</h3>
        <p>The workflow canvas encountered an error.</p>
        <p>This might be due to insufficient memory or graphics driver issues.</p>
        <button onClick={() => window.location.reload()}>
          Reload Canvas
        </button>
      </div>
    }
    onError={(error, errorInfo) => {
      // Specific canvas error handling
      console.error('Canvas Error:', error);
      // Could send to specific monitoring endpoint
    }}
  >
    {children}
  </ErrorBoundary>
);

export const PanelErrorBoundary: React.FC<{ children: ReactNode; panelName: string }> = ({
  children,
  panelName
}) => (
  <ErrorBoundary
    fallback={
      <div className="panel-error-fallback">
        <div className="panel-error-icon">📋</div>
        <h4>{panelName} Error</h4>
        <p>The {panelName.toLowerCase()} panel encountered an error.</p>
        <button onClick={() => window.location.reload()}>
          Reload Panel
        </button>
      </div>
    }
    onError={(error, errorInfo) => {
      console.error(`${panelName} Panel Error:`, error);
    }}
  >
    {children}
  </ErrorBoundary>
);

// Hook for error reporting in functional components
export const useErrorReporting = () => {
  const reportError = React.useCallback((error: Error, context?: any) => {
    console.error('Error reported:', error, context);

    // Could send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send error report
    }
  }, []);

  return { reportError };
};

// Higher-order component for error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};
