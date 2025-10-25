import React, { createContext, useContext, ReactNode } from "react";
import { useErrorHandler } from "../hooks/useErrorHandler";
import {
  AppError,
  ErrorContext as ErrorContextType,
  ErrorRecoveryAction,
  ErrorReportData,
  ErrorCategory,
  ErrorSeverity,
} from "../types/error";
import { ErrorToast } from "../components/ErrorToast";

interface ExtendedErrorContextType {
  errors: AppError[];
  hasErrors: boolean;
  hasCriticalErrors: boolean;
  hasRetryableErrors: boolean;
  addError: (
    error: Partial<AppError> | string,
    context?: Partial<ErrorContextType>,
  ) => AppError;
  removeError: (error: AppError) => void;
  clearErrors: () => void;
  handleApiError: (
    error: unknown,
    context?: Partial<ErrorContextType>,
  ) => AppError;
  handleWorkflowError: (
    error: unknown,
    workflowId?: string,
    executionId?: string,
    context?: Partial<ErrorContextType>,
  ) => AppError;
  retryError: (
    error: AppError,
    retryAction: () => Promise<void>,
  ) => Promise<void>;
  reportError: (reportData: ErrorReportData) => Promise<void>;
  getErrorsByCategory: (category: ErrorCategory) => AppError[];
  getErrorsBySeverity: (severity: ErrorSeverity) => AppError[];
}

const ErrorContext = createContext<ExtendedErrorContextType | undefined>(
  undefined,
);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
  maxErrors?: number;
  enableErrorReporting?: boolean;
  toastPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({
  children,
  maxErrors = 10,
  enableErrorReporting = true,
  toastPosition = "top-right",
}) => {
  const errorHandler = useErrorHandler({
    maxErrors,
    enableErrorReporting,
  });

  const handleRetry = async (error: AppError) => {
    // Default retry logic - can be overridden by specific components
    if (error.category === "auth" || error.category === "api") {
      // For network/API errors, we could retry the last failed request
      // This would need to be implemented based on the specific use case

    }
  };

  const getRecoveryActions = (error: AppError): ErrorRecoveryAction[] => {
    const actions: ErrorRecoveryAction[] = [];

    // Add common recovery actions based on error category
    switch (error.category) {
      case "auth":
        actions.push({
          label: "Login Again",
          action: () => {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
          },
          primary: true,
        });
        break;

      case "network":
        actions.push({
          label: "Refresh Page",
          action: () => window.location.reload(),
          primary: true,
        });
        break;

      case "workflow":
        actions.push({
          label: "Go to Workflows",
          action: () => (window.location.href = "/workflows"),
        });
        break;
    }

    return actions;
  };

  return (
    <ErrorContext.Provider value={errorHandler}>
      {children}

      {/* Render error toasts */}
      <div
        className={`fixed ${
          toastPosition === "top-right"
            ? "top-4 right-4"
            : toastPosition === "top-left"
              ? "top-4 left-4"
              : toastPosition === "bottom-right"
                ? "bottom-4 right-4"
                : "bottom-4 left-4"
        } space-y-4 z-50`}
      >
        {errorHandler.errors.map((error) => (
          <ErrorToast
            key={error.id}
            error={error}
            position={toastPosition}
            onDismiss={() => errorHandler.removeError(error)}
            onRetry={error.retryable ? () => handleRetry(error) : undefined}
            onReport={
              enableErrorReporting
                ? () => errorHandler.reportError({ error })
                : undefined
            }
            recoveryActions={getRecoveryActions(error)}
          />
        ))}
      </div>
    </ErrorContext.Provider>
  );
};


