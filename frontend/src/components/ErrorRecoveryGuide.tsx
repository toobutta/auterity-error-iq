import React, { useState } from "react";
import { ErrorCategory, ErrorSeverity } from "../types/error";

interface RecoveryStep {
  id: string;
  title: string;
  description: string;
  action?: () => void | Promise<void>;
  actionLabel?: string;
  completed?: boolean;
}

interface ErrorRecoveryGuideProps {
  category: ErrorCategory;
  severity: ErrorSeverity;
  errorMessage: string;
  onRetry?: () => Promise<void>;
  onContactSupport?: () => void;
  className?: string;
}

const ErrorRecoveryGuide: React.FC<ErrorRecoveryGuideProps> = ({
  category,
  severity,
  errorMessage,
  onRetry,
  onContactSupport,
  className = "",
}) => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isRetrying, setIsRetrying] = useState(false);

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps((prev) => new Set([...prev, stepId]));
  };

  const getRecoverySteps = (): RecoveryStep[] => {
    const steps: RecoveryStep[] = [];

    switch (category) {
      case ErrorCategory.AUTHENTICATION:
        steps.push(
          {
            id: "check-credentials",
            title: "Verify Login Credentials",
            description:
              "Ensure you are using the correct username and password.",
          },
          {
            id: "clear-cache",
            title: "Clear Browser Cache",
            description:
              "Clear your browser cache and cookies to remove any stored authentication data.",
            action: () => {
              // This would typically open browser settings or provide instructions
              alert(
                "Please clear your browser cache and cookies, then refresh the page.",
              );
            },
            actionLabel: "Clear Cache",
          },
          {
            id: "login-again",
            title: "Log In Again",
            description:
              "Try logging out and logging back in with fresh credentials.",
            action: () => {
              localStorage.removeItem("access_token");
              window.location.href = "/login";
            },
            actionLabel: "Go to Login",
          },
        );
        break;

      case ErrorCategory.VALIDATION:
        steps.push(
          {
            id: "check-inputs",
            title: "Review Input Fields",
            description:
              "Check all required fields are filled and contain valid data.",
          },
          {
            id: "check-format",
            title: "Verify Data Format",
            description:
              "Ensure data is in the correct format (dates, numbers, email addresses, etc.).",
          },
          {
            id: "check-limits",
            title: "Check Field Limits",
            description:
              "Verify that text fields don't exceed maximum length limits.",
          },
        );
        break;

      case ErrorCategory.NETWORK:
        steps.push(
          {
            id: "check-connection",
            title: "Check Internet Connection",
            description:
              "Verify your internet connection is stable and working.",
          },
          {
            id: "refresh-page",
            title: "Refresh the Page",
            description:
              "Try refreshing the page to re-establish the connection.",
            action: () => window.location.reload(),
            actionLabel: "Refresh Page",
          },
          {
            id: "wait-retry",
            title: "Wait and Retry",
            description:
              "Network issues are often temporary. Wait a few minutes and try again.",
          },
        );
        break;

      case ErrorCategory.AI_SERVICE:
        steps.push(
          {
            id: "simplify-request",
            title: "Simplify Your Request",
            description:
              "Try reducing the complexity or length of your input data.",
          },
          {
            id: "check-content",
            title: "Review Content Guidelines",
            description:
              "Ensure your content doesn't violate AI service usage policies.",
          },
          {
            id: "wait-service",
            title: "Wait for Service Recovery",
            description:
              "AI services may be temporarily unavailable. Wait a few minutes before retrying.",
          },
        );
        break;

      case ErrorCategory.WORKFLOW:
        steps.push(
          {
            id: "check-workflow",
            title: "Review Workflow Configuration",
            description:
              "Verify all workflow steps are properly connected and configured.",
          },
          {
            id: "check-parameters",
            title: "Validate Input Parameters",
            description:
              "Ensure all required parameters are provided and in the correct format.",
          },
          {
            id: "test-steps",
            title: "Test Individual Steps",
            description:
              "Try testing individual workflow steps to identify the problematic component.",
          },
        );
        break;

      case ErrorCategory.DATABASE:
        steps.push(
          {
            id: "wait-database",
            title: "Wait for Database Recovery",
            description:
              "Database issues are usually temporary. Wait a few minutes before retrying.",
          },
          {
            id: "check-data",
            title: "Verify Data Integrity",
            description:
              "Ensure the data you're trying to save or access is valid and complete.",
          },
        );
        break;

      default:
        steps.push(
          {
            id: "refresh-try-again",
            title: "Refresh and Try Again",
            description: "Try refreshing the page and repeating your action.",
            action: () => window.location.reload(),
            actionLabel: "Refresh Page",
          },
          {
            id: "check-browser",
            title: "Try a Different Browser",
            description:
              "Sometimes browser-specific issues can cause problems. Try using a different browser.",
          },
        );
        break;
    }

    // Add retry step if available
    if (onRetry) {
      steps.push({
        id: "retry-action",
        title: "Retry the Action",
        description:
          "After completing the above steps, try performing the action again.",
        action: async () => {
          setIsRetrying(true);
          try {
            await onRetry();
          } finally {
            setIsRetrying(false);
          }
        },
        actionLabel: isRetrying ? "Retrying..." : "Retry Now",
      });
    }

    // Add contact support step for high/critical severity
    if (
      (severity === ErrorSeverity.HIGH ||
        severity === ErrorSeverity.CRITICAL) &&
      onContactSupport
    ) {
      steps.push({
        id: "contact-support",
        title: "Contact Support",
        description:
          "If the issue persists, contact our support team for assistance.",
        action: onContactSupport,
        actionLabel: "Contact Support",
      });
    }

    return steps;
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return "text-red-600 bg-red-50 border-red-200";
      case ErrorSeverity.HIGH:
        return "text-orange-600 bg-orange-50 border-orange-200";
      case ErrorSeverity.MEDIUM:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const getCategoryIcon = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        );
      case ErrorCategory.NETWORK:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
            />
          </svg>
        );
      case ErrorCategory.AI_SERVICE:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        );
      case ErrorCategory.WORKFLOW:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const recoverySteps = getRecoverySteps();
  const severityColor = getSeverityColor(severity);
  const categoryIcon = getCategoryIcon(category);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className={`border-b border-gray-200 p-4 ${severityColor}`}>
        <div className="flex items-center">
          {categoryIcon}
          <div className="ml-3">
            <h3 className="font-medium">Error Recovery Guide</h3>
            <p className="text-sm opacity-75 capitalize">
              {category.replace("_", " ")} • {severity} severity
            </p>
            {errorMessage && (
              <p className="text-sm mt-1 font-mono bg-black bg-opacity-10 px-2 py-1 rounded">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recovery Steps */}
      <div className="p-4">
        <p className="text-gray-600 text-sm mb-4">
          Follow these steps to resolve the issue and get back on track:
        </p>

        <div className="space-y-4">
          {recoverySteps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);

            return (
              <div
                key={step.id}
                className={`border rounded-lg p-4 transition-colors ${
                  isCompleted
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {isCompleted ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium ${isCompleted ? "text-green-800" : "text-gray-900"}`}
                    >
                      {step.title}
                    </h4>
                    <p
                      className={`text-sm mt-1 ${isCompleted ? "text-green-700" : "text-gray-600"}`}
                    >
                      {step.description}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      {step.action && (
                        <button
                          onClick={async () => {
                            if (step.action) {
                              await step.action();
                              markStepCompleted(step.id);
                            }
                          }}
                          disabled={
                            isCompleted ||
                            (step.id === "retry-action" && isRetrying)
                          }
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            isCompleted
                              ? "bg-green-100 text-green-700 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          }`}
                        >
                          {isCompleted ? "Completed" : step.actionLabel}
                        </button>
                      )}

                      {!isCompleted && !step.action && (
                        <button
                          onClick={() => markStepCompleted(step.id)}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                          Mark as Done
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Progress: {completedSteps.size} of {recoverySteps.length} steps
              completed
            </span>
            <span className="text-gray-600">
              {Math.round((completedSteps.size / recoverySteps.length) * 100)}%
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(completedSteps.size / recoverySteps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Success Message */}
        {completedSteps.size === recoverySteps.length && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-green-800 font-medium">
                All recovery steps completed!
              </span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              You should now be able to proceed with your original action. If
              the issue persists, please contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorRecoveryGuide;


