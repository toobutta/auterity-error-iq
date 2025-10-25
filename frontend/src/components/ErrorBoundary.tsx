import React, { Component, ErrorInfo, ReactNode } from "react";
import { AppError, ErrorSeverity } from "../types/error";
import { createAppError } from "../utils/errorUtils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  enableReporting?: boolean;
  component?: string;
}

interface State {
  hasError: boolean;
  error?: AppError;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
}

// Sanitize log output to prevent log injection
const sanitizeForLog = (input: string): string => {
  return input
    .replace(/[\r\n]/g, " ")
    .replace(/[<>]/g, "")
    .substring(0, 1000);
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const appError = createAppError(
      "REACT_ERROR_BOUNDARY",
      error.message,
      { component: "ErrorBoundary" },
      error.stack,
      error.stack,
    );

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sanitize error data before logging
    const sanitizedMessage = sanitizeForLog(error.message);
    const sanitizedStack = error.stack ? sanitizeForLog(error.stack) : "";

    console.error("ErrorBoundary caught an error:", {
      message: sanitizedMessage,
      stack: sanitizedStack,
      componentStack: sanitizeForLog(errorInfo.componentStack),
    });

    const appError = createAppError(
      "REACT_ERROR_BOUNDARY",
      error.message,
      {
        component: this.props.component || "Unknown",
        action: "render",
      },
      `${error.stack}\n\nComponent Stack:\n${errorInfo.componentStack}`,
      error.stack,
    );

    this.setState({ errorInfo });
    this.props.onError?.(appError, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReportError = () => {
    if (!this.props.enableReporting || !this.state.error) return;

    // Sanitize error data before reporting
    const sanitizedError = {
      ...this.state.error,
      message: sanitizeForLog(this.state.error.message),
      details: this.state.error.details
        ? sanitizeForLog(this.state.error.details)
        : undefined,
    };

  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const isCritical = error.severity === ErrorSeverity.CRITICAL;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
            <div
              className={`px-6 py-4 ${isCritical ? "bg-red-50 border-b border-red-200" : "bg-yellow-50 border-b border-yellow-200"}`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {isCritical ? (
                    <svg
                      className="h-8 w-8 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-8 w-8 text-yellow-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-lg font-medium ${isCritical ? "text-red-800" : "text-yellow-800"}`}
                  >
                    {isCritical ? "Critical Error" : "Application Error"}
                  </h3>
                  <p
                    className={`text-sm ${isCritical ? "text-red-600" : "text-yellow-600"}`}
                  >
                    {error.userFriendlyMessage}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              {this.props.showDetails && (
                <div className="mb-4">
                  <button
                    onClick={this.toggleDetails}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <svg
                      className={`h-4 w-4 mr-1 transform transition-transform ${this.state.showDetails ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    {this.state.showDetails ? "Hide" : "Show"} Technical Details
                  </button>

                  {this.state.showDetails && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <div className="text-xs text-gray-600 space-y-2">
                        <div>
                          <strong>Error Code:</strong> {error.code}
                        </div>
                        <div>
                          <strong>Category:</strong> {error.category}
                        </div>
                        <div>
                          <strong>Severity:</strong> {error.severity}
                        </div>
                        {error.correlationId && (
                          <div>
                            <strong>Correlation ID:</strong>{" "}
                            {error.correlationId}
                          </div>
                        )}
                        <div>
                          <strong>Timestamp:</strong>{" "}
                          {error.context.timestamp.toISOString()}
                        </div>
                        {error.details && (
                          <div>
                            <strong>Details:</strong>
                            <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                              {sanitizeForLog(error.details)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error.actionable &&
                error.suggestedActions &&
                error.suggestedActions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">
                      Suggested Actions:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {error.suggestedActions.map((action, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={this.handleRetry}
                >
                  Try Again
                </button>

                <button
                  type="button"
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  onClick={this.handleRefreshPage}
                >
                  Refresh Page
                </button>

                {this.props.enableReporting && (
                  <button
                    type="button"
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    onClick={this.handleReportError}
                  >
                    Report Issue
                  </button>
                )}

                {!this.props.showDetails && (
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 px-4 py-2 text-sm font-medium"
                    onClick={this.toggleDetails}
                  >
                    Show Details
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


