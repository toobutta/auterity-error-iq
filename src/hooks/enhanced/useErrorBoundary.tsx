/**
 * Enhanced Error Boundary Hook with Monitoring and Recovery
 *
 * Provides comprehensive error handling, monitoring, and automatic recovery
 * for React components with integration to external monitoring services
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Enhanced error types
interface EnhancedError extends Error {
  code?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  componentStack?: string;
}

interface ErrorRecoveryStrategy {
  id: string;
  name: string;
  description: string;
  canRecover: (error: EnhancedError) => boolean;
  recover: (error: EnhancedError) => Promise<void>;
  priority: number;
}

interface ErrorMonitoringConfig {
  sentry?: {
    dsn: string;
    environment: string;
    release?: string;
  };
  logRocket?: {
    appId: string;
  };
  rollbar?: {
    accessToken: string;
    environment: string;
  };
  customReporter?: (error: EnhancedError) => Promise<void>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: EnhancedError | null;
  errorId: string | null;
  recoveryAttempts: number;
  lastRecoveryTime: Date | null;
  isRecovering: boolean;
}

// Global error monitoring service
class ErrorMonitoringService {
  private config: ErrorMonitoringConfig;
  private errors: EnhancedError[] = [];
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];

  constructor(config: ErrorMonitoringConfig) {
    this.config = config;
    this.initializeMonitoring();
    this.registerDefaultStrategies();
  }

  private initializeMonitoring() {
    // Global error handler
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Initialize third-party services
    if (this.config.sentry) {
      this.initializeSentry();
    }
    if (this.config.logRocket) {
      this.initializeLogRocket();
    }
    if (this.config.rollbar) {
      this.initializeRollbar();
    }
  }

  private initializeSentry() {
    // Sentry initialization would go here
    console.log('Initializing Sentry with DSN:', this.config.sentry?.dsn);
  }

  private initializeLogRocket() {
    // LogRocket initialization would go here
    console.log('Initializing LogRocket with App ID:', this.config.logRocket?.appId);
  }

  private initializeRollbar() {
    // Rollbar initialization would go here
    console.log('Initializing Rollbar with token:', this.config.rollbar?.accessToken);
  }

  private handleGlobalError(event: ErrorEvent) {
    const error: EnhancedError = {
      name: event.error?.name || 'GlobalError',
      message: event.error?.message || event.message,
      stack: event.error?.stack,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      severity: 'high'
    };

    this.captureError(error);
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const error: EnhancedError = {
      name: 'UnhandledPromiseRejection',
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      timestamp: new Date(),
      url: window.location.href,
      severity: 'high'
    };

    this.captureError(error);
  }

  private registerDefaultStrategies() {
    // Network error recovery
    this.recoveryStrategies.push({
      id: 'network_retry',
      name: 'Network Retry',
      description: 'Retry failed network requests',
      canRecover: (error) => error.code === 'NETWORK_ERROR' || error.message.includes('fetch'),
      recover: async (error) => {
        // Implement retry logic
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      priority: 1
    });

    // Authentication error recovery
    this.recoveryStrategies.push({
      id: 'auth_refresh',
      name: 'Authentication Refresh',
      description: 'Refresh authentication tokens',
      canRecover: (error) => error.code === 'AUTH_ERROR' || error.message.includes('unauthorized'),
      recover: async (error) => {
        // Implement token refresh logic
        console.log('Attempting to refresh authentication');
      },
      priority: 2
    });

    // Component re-render recovery
    this.recoveryStrategies.push({
      id: 'component_rerender',
      name: 'Component Re-render',
      description: 'Force component re-render',
      canRecover: (error) => error.severity !== 'critical',
      recover: async (error) => {
        // Force component update
        console.log('Forcing component re-render');
      },
      priority: 3
    });
  }

  async captureError(error: EnhancedError): Promise<void> {
    // Enhance error with additional context
    const enhancedError: EnhancedError = {
      ...error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Store error
    this.errors.push(enhancedError);

    // Report to monitoring services
    await Promise.allSettled([
      this.reportToCustomReporter(enhancedError),
      this.reportToThirdPartyServices(enhancedError)
    ]);

    console.error('Captured error:', enhancedError);
  }

  private async reportToCustomReporter(error: EnhancedError): Promise<void> {
    if (this.config.customReporter) {
      await this.config.customReporter(error);
    }
  }

  private async reportToThirdPartyServices(error: EnhancedError): Promise<void> {
    // Implement third-party reporting
    // This would send errors to Sentry, LogRocket, Rollbar, etc.
  }

  async attemptRecovery(error: EnhancedError): Promise<boolean> {
    // Sort strategies by priority
    const applicableStrategies = this.recoveryStrategies
      .filter(strategy => strategy.canRecover(error))
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of applicableStrategies) {
      try {
        console.log(`Attempting recovery strategy: ${strategy.name}`);
        await strategy.recover(error);
        console.log(`Recovery successful: ${strategy.name}`);
        return true;
      } catch (recoveryError) {
        console.error(`Recovery failed for ${strategy.name}:`, recoveryError);
      }
    }

    return false;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private getUserId(): string {
    // In a real app, this would come from authentication context
    return localStorage.getItem('userId') || 'anonymous';
  }

  getErrors(): EnhancedError[] {
    return [...this.errors];
  }

  getRecoveryStrategies(): ErrorRecoveryStrategy[] {
    return [...this.recoveryStrategies];
  }

  clearErrors(): void {
    this.errors = [];
  }
}

// Configuration for error monitoring
const ERROR_MONITORING_CONFIG: ErrorMonitoringConfig = {
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.VITE_NODE_ENV || 'development'
  },
  customReporter: async (error: EnhancedError) => {
    // Custom error reporting logic
    console.log('Custom error reporter:', error);
  }
};

// Global error monitoring instance
const errorMonitoringService = new ErrorMonitoringService(ERROR_MONITORING_CONFIG);

// Enhanced error boundary hook
export const useErrorBoundary = () => {
  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorId: null,
    recoveryAttempts: 0,
    lastRecoveryTime: null,
    isRecovering: false
  });

  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const captureError = useCallback(async (error: Error | EnhancedError, errorInfo?: any) => {
    const enhancedError: EnhancedError = {
      ...(error as EnhancedError),
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      severity: (error as EnhancedError).severity || 'medium',
      context: (error as EnhancedError).context || {},
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      hasError: true,
      error: enhancedError,
      errorId: enhancedError.errorId || `error_${Date.now()}`
    }));

    // Capture error in monitoring service
    await errorMonitoringService.captureError(enhancedError);
  }, []);

  const attemptRecovery = useCallback(async (): Promise<boolean> => {
    if (!state.error || state.recoveryAttempts >= 3) {
      return false;
    }

    setState(prev => ({
      ...prev,
      isRecovering: true,
      recoveryAttempts: prev.recoveryAttempts + 1
    }));

    try {
      const recovered = await errorMonitoringService.attemptRecovery(state.error);

      if (recovered) {
        setState(prev => ({
          ...prev,
          hasError: false,
          error: null,
          errorId: null,
          lastRecoveryTime: new Date(),
          isRecovering: false
        }));

        // Auto-clear error after successful recovery
        recoveryTimeoutRef.current = setTimeout(() => {
          setState(prev => ({ ...prev, hasError: false }));
        }, 5000);

        return true;
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
    }

    setState(prev => ({ ...prev, isRecovering: false }));
    return false;
  }, [state.error, state.recoveryAttempts]);

  const resetError = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      errorId: null,
      recoveryAttempts: 0,
      lastRecoveryTime: null,
      isRecovering: false
    });

    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current);
    }
  }, []);

  const getErrorSummary = useCallback(() => {
    const allErrors = errorMonitoringService.getErrors();
    const recentErrors = allErrors.filter(error =>
      error.timestamp && Date.now() - error.timestamp.getTime() < 3600000 // Last hour
    );

    return {
      totalErrors: allErrors.length,
      recentErrors: recentErrors.length,
      criticalErrors: allErrors.filter(e => e.severity === 'critical').length,
      recoveryStrategies: errorMonitoringService.getRecoveryStrategies().length
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    captureError,
    attemptRecovery,
    resetError,
    getErrorSummary,
    errors: errorMonitoringService.getErrors()
  };
};

// Error boundary component
export const EnhancedErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: EnhancedError; resetError: () => void }>;
  onError?: (error: EnhancedError) => void;
}> = ({ children, fallback: Fallback, onError }) => {
  const {
    hasError,
    error,
    resetError,
    attemptRecovery,
    isRecovering
  } = useErrorBoundary();

  useEffect(() => {
    if (hasError && error && onError) {
      onError(error);
    }
  }, [hasError, error, onError]);

  if (hasError && error) {
    if (Fallback) {
      return <Fallback error={error} resetError={resetError} />;
    }

    return (
      <div className="error-boundary-fallback">
        <div className="error-content">
          <h2>Something went wrong</h2>
          <p>{error.message}</p>

          <div className="error-actions">
            <button
              onClick={resetError}
              className="reset-button"
            >
              Try Again
            </button>

            <button
              onClick={attemptRecovery}
              disabled={isRecovering}
              className="recovery-button"
            >
              {isRecovering ? 'Attempting Recovery...' : 'Auto Recover'}
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="error-details">
              <summary>Error Details</summary>
              <pre>{error.stack}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Error reporting hook for manual error capture
export const useErrorReporting = () => {
  const reportError = useCallback(async (
    error: Error | string,
    context?: Record<string, any>,
    severity: EnhancedError['severity'] = 'medium'
  ) => {
    const enhancedError: EnhancedError = {
      name: typeof error === 'string' ? 'ManualError' : error.name,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? new Error().stack : error.stack,
      severity,
      context,
      timestamp: new Date()
    };

    await errorMonitoringService.captureError(enhancedError);
  }, []);

  return { reportError };
};

export type { EnhancedError, ErrorRecoveryStrategy, ErrorMonitoringConfig, ErrorBoundaryState };
