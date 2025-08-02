import { useCallback, useState, useRef } from 'react';
import { AppError, ErrorCategory, ErrorSeverity, ErrorContext, ErrorReportData } from '../types/error';
import { createAppError } from '../utils/errorUtils';
import { useKiroIntegration } from './useKiroIntegration';

// Interface for processed API errors
interface ProcessedApiError {
  code?: string;
  message?: string;
  details?: string;
  stack?: string;
  correlationId?: string;
  category?: string;
  severity?: string;
  retryable?: boolean;
}

export interface ErrorHandlerOptions {
  maxErrors?: number;
  defaultAutoHide?: boolean;
  defaultHideAfter?: number;
  enableErrorReporting?: boolean;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    maxErrors = 10,
    defaultAutoHide = true,
    defaultHideAfter = 5000,
    enableErrorReporting = true
  } = options;

  const [errors, setErrors] = useState<AppError[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { triggerKiroHook, getErrorRoute } = useKiroIntegration();

  const removeError = useCallback((error: AppError) => {
    setErrors(prev => prev.filter(e => e.id !== error.id));
    
    // Clear timeout if exists
    const timeoutId = timeoutRefs.current.get(error.id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(error.id);
    }
  }, []);

  const addError = useCallback((
    errorInput: Partial<AppError> | string,
    context: Partial<ErrorContext> = {},
    autoHide: boolean = defaultAutoHide,
    hideAfter: number = defaultHideAfter
  ) => {
    let appError: AppError;

    if (typeof errorInput === 'string') {
      appError = createAppError('GENERIC_ERROR', errorInput, context);
    } else if (errorInput.id && errorInput.category && errorInput.severity) {
      // Already a complete AppError
      appError = errorInput as AppError;
    } else {
      // Partial AppError, need to enhance it
      appError = createAppError(
        errorInput.code || 'UNKNOWN_ERROR',
        errorInput.message || 'An unexpected error occurred',
        { ...context, ...errorInput.context },
        errorInput.details,
        errorInput.stack,
        errorInput.correlationId
      );
    }

    setErrors(prev => {
      // Remove oldest errors if we exceed maxErrors
      const newErrors = prev.length >= maxErrors ? prev.slice(1) : prev;
      return [...newErrors, appError];
    });

    // Set up auto-hide if enabled
    if (autoHide && hideAfter > 0) {
      const timeoutId = setTimeout(() => {
        removeError(appError);
        timeoutRefs.current.delete(appError.id);
      }, hideAfter);
      
      timeoutRefs.current.set(appError.id, timeoutId);
    }

    // Log error for debugging
    console.error('Error added:', appError);

    return appError;
  }, [maxErrors, defaultAutoHide, defaultHideAfter, removeError]);

  const clearErrors = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
    
    setErrors([]);
  }, []);

  const handleApiError = useCallback((error: unknown, context: Partial<ErrorContext> = {}) => {
    let appError: AppError;

    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      // Already processed API error with correlation ID
      const apiError = error as ProcessedApiError;
      appError = createAppError(
        apiError.code || 'API_ERROR',
        apiError.message || 'API request failed',
        context,
        apiError.details,
        apiError.stack,
        apiError.correlationId
      );
    } else if (error instanceof Error) {
      appError = createAppError(
        'API_ERROR',
        error.message,
        context,
        error.stack,
        error.stack
      );
    } else {
      appError = createAppError(
        'UNKNOWN_API_ERROR',
        'An unknown API error occurred',
        context,
        String(error)
      );
    }

    return addError(appError, context);
  }, [addError]);

  const handleWorkflowError = useCallback((
    error: unknown,
    workflowId?: string,
    executionId?: string,
    context: Partial<ErrorContext> = {}
  ) => {
    const workflowContext = {
      ...context,
      workflowId,
      executionId,
      component: 'WorkflowEngine'
    };

    const appError = handleApiError(error, workflowContext);
    
    // Trigger Kiro hook for workflow errors
    if (workflowId) {
      triggerKiroHook(workflowId, appError).catch(console.error);
    }
    
    return appError;
  }, [handleApiError, triggerKiroHook]);

  const retryError = useCallback(async (error: AppError, retryAction: () => Promise<void>) => {
    if (!error.retryable) {
      console.warn('Attempted to retry non-retryable error:', error);
      return;
    }

    try {
      await retryAction();
      removeError(error);
    } catch (retryError) {
      // Update the original error with retry information
      const updatedError = {
        ...error,
        details: `${error.details || ''}\n\nRetry failed: ${retryError}`
      };
      
      removeError(error);
      addError(updatedError);
    }
  }, [addError, removeError]);

  const reportError = useCallback(async (reportData: ErrorReportData) => {
    if (!enableErrorReporting) {
      console.warn('Error reporting is disabled');
      return;
    }

    try {
      // TODO: Implement actual error reporting to backend
      console.log('Error report:', reportData);
      
      // For now, just log the report
      // In a real implementation, this would send to an error reporting service
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }, [enableErrorReporting]);

  const getErrorsByCategory = useCallback((category: ErrorCategory) => {
    return errors.filter(error => error.category === category);
  }, [errors]);

  const getErrorsBySeverity = useCallback((severity: ErrorSeverity) => {
    return errors.filter(error => error.severity === severity);
  }, [errors]);

  const hasErrors = errors.length > 0;
  const hasCriticalErrors = errors.some(error => error.severity === ErrorSeverity.CRITICAL);
  const hasRetryableErrors = errors.some(error => error.retryable);

  return {
    errors,
    hasErrors,
    hasCriticalErrors,
    hasRetryableErrors,
    addError,
    removeError,
    clearErrors,
    handleApiError,
    handleWorkflowError,
    retryError,
    reportError,
    getErrorsByCategory,
    getErrorsBySeverity,
  };
};