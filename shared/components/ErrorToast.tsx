import React, { useState, useCallback, useEffect } from "react";
import { AppError, ErrorSeverity, ErrorRecoveryAction } from "../types/error";

interface ErrorToastProps {
  error: AppError;
  onDismiss: () => void;
  onRetry?: () => Promise<void>;
  onReport?: () => void;
  recoveryActions?: ErrorRecoveryAction[];
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  autoHide?: boolean;
  hideAfter?: number;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onDismiss,
  onRetry,
  onReport,
  recoveryActions = [],
  position = "top-right",
  autoHide = true,
  hideAfter = 5000,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(hideAfter);

  // Auto-hide functionality
  useEffect(() => {
    if (!autoHide) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          onDismiss();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoHide, onDismiss]);

  const getSeverityStyles = useCallback((severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return {
          border: "border-red-200",
          bg: "bg-red-50",
          icon: "text-red-400",
          title: "text-red-800",
          text: "text-red-700",
        };
      case ErrorSeverity.HIGH:
        return {
          border: "border-orange-200",
          bg: "bg-orange-50",
          icon: "text-orange-400",
          title: "text-orange-800",
          text: "text-orange-700",
        };
      case ErrorSeverity.MEDIUM:
        return {
          border: "border-yellow-200",
          bg: "bg-yellow-50",
          icon: "text-yellow-400",
          title: "text-yellow-800",
          text: "text-yellow-700",
        };
      default:
        return {
          border: "border-blue-200",
          bg: "bg-blue-50",
          icon: "text-blue-400",
          title: "text-blue-800",
          text: "text-blue-700",
        };
    }
  }, []);

  const getPositionStyles = useCallback((pos: string) => {
    switch (pos) {
      case "top-left":
        return "top-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      default:
        return "top-4 right-4";
    }
  }, []);

  const getSeverityIcon = useCallback((severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case ErrorSeverity.HIGH:
        return (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  }, []);

  const handleRetry = useCallback(async () => {
    if (!onRetry || !error.retryable) return;

    setIsRetrying(true);
    try {
      await onRetry();
      onDismiss();
    } catch (retryError) {
      console.error("Retry failed:", retryError);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, error.retryable, onDismiss]);

  const styles = getSeverityStyles(error.severity);
  const positionClass = getPositionStyles(position);

  return (
    <div
      className={`fixed ${positionClass} max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden z-50 ${styles.border}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className={`${styles.bg} p-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className={styles.icon}>{getSeverityIcon(error.severity)}</div>
          </div>

          <div className="ml-3 w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className={`text-sm font-medium ${styles.title}`}>
                {error.severity === ErrorSeverity.CRITICAL
                  ? "Critical Error"
                  : error.severity === ErrorSeverity.HIGH
                    ? "Error"
                    : error.severity === ErrorSeverity.MEDIUM
                      ? "Warning"
                      : "Notice"}
              </p>

              {(error.details || error.correlationId) && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`text-xs ${styles.text} hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? "Less" : "More"}
                </button>
              )}
            </div>

            <p className={`mt-1 text-sm ${styles.text}`}>
              {error.userFriendlyMessage}
            </p>

            {isExpanded && (
              <div className="mt-2 space-y-1">
                {error.correlationId && (
                  <p className="text-xs text-gray-500">
                    ID: {error.correlationId}
                  </p>
                )}
                {error.details && (
                  <p className="text-xs text-gray-600 bg-white bg-opacity-50 p-2 rounded">
                    {error.details}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {(error.retryable || recoveryActions.length > 0 || onReport) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {error.retryable && onRetry && (
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="text-xs bg-white bg-opacity-80 hover:bg-opacity-100 px-2 py-1 rounded border border-current disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isRetrying ? "Retrying..." : "Retry"}
                  </button>
                )}

                {recoveryActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`text-xs px-2 py-1 rounded border border-current focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      action.primary
                        ? "bg-white bg-opacity-80 hover:bg-opacity-100"
                        : "bg-transparent hover:bg-white hover:bg-opacity-20"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}

                {onReport && (
                  <button
                    onClick={onReport}
                    className="text-xs bg-transparent hover:bg-white hover:bg-opacity-20 px-2 py-1 rounded border border-current focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Report
                  </button>
                )}
              </div>
            )}

            {/* Auto-hide timer */}
            {autoHide && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">
                  Auto-hide in {Math.ceil(timeLeft / 1000)}s
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-gray-400 h-1 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / hideAfter) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="ml-4 flex-shrink-0">
            <button
              className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onDismiss}
              aria-label="Close notification"
            >
              <svg
                className="h-5 w-5"
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
      </div>
    </div>
  );
};
