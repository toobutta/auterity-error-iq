/**
 * Error utility functions for categorization, severity assessment, and user-friendly messaging
 */

import {
  AppError,
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
} from "../types/error";

/**
 * Generate a unique error ID
 */
export const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Categorize error based on error code and message
 */
export const categorizeError = (
  code: string,
  message: string,
): ErrorCategory => {
  const codeUpper = code.toUpperCase();
  const messageUpper = message.toUpperCase();

  if (
    codeUpper.includes("AUTH") ||
    codeUpper.includes("LOGIN") ||
    codeUpper.includes("TOKEN")
  ) {
    return ErrorCategory.AUTHENTICATION;
  }

  if (
    codeUpper.includes("PERMISSION") ||
    codeUpper.includes("FORBIDDEN") ||
    codeUpper.includes("UNAUTHORIZED")
  ) {
    return ErrorCategory.AUTHORIZATION;
  }

  if (
    codeUpper.includes("VALIDATION") ||
    codeUpper.includes("INVALID") ||
    messageUpper.includes("REQUIRED")
  ) {
    return ErrorCategory.VALIDATION;
  }

  if (
    codeUpper.includes("NETWORK") ||
    codeUpper.includes("TIMEOUT") ||
    codeUpper.includes("CONNECTION")
  ) {
    return ErrorCategory.NETWORK;
  }

  if (codeUpper.includes("WORKFLOW") || messageUpper.includes("WORKFLOW")) {
    return ErrorCategory.WORKFLOW;
  }

  if (
    codeUpper.includes("AI") ||
    codeUpper.includes("GPT") ||
    messageUpper.includes("AI SERVICE")
  ) {
    return ErrorCategory.AI_SERVICE;
  }

  if (
    codeUpper.includes("DATABASE") ||
    codeUpper.includes("SQL") ||
    messageUpper.includes("DATABASE")
  ) {
    return ErrorCategory.DATABASE;
  }

  if (codeUpper.includes("HTTP") || codeUpper.includes("API")) {
    return ErrorCategory.API;
  }

  return ErrorCategory.UNKNOWN;
};

/**
 * Determine error severity based on category and code
 */
export const assessErrorSeverity = (
  category: ErrorCategory,
  code: string,
): ErrorSeverity => {
  const codeUpper = code.toUpperCase();

  // Critical errors that require immediate attention
  if (
    category === ErrorCategory.SYSTEM ||
    codeUpper.includes("CRITICAL") ||
    codeUpper.includes("FATAL") ||
    codeUpper.includes("500")
  ) {
    return ErrorSeverity.CRITICAL;
  }

  // High severity errors that significantly impact functionality
  if (
    category === ErrorCategory.AUTHENTICATION ||
    category === ErrorCategory.DATABASE ||
    codeUpper.includes("403") ||
    codeUpper.includes("404") ||
    codeUpper.includes("EXECUTION_FAILED")
  ) {
    return ErrorSeverity.HIGH;
  }

  // Medium severity errors that impact user experience
  if (
    category === ErrorCategory.WORKFLOW ||
    category === ErrorCategory.AI_SERVICE ||
    category === ErrorCategory.NETWORK ||
    codeUpper.includes("TIMEOUT") ||
    codeUpper.includes("400")
  ) {
    return ErrorSeverity.MEDIUM;
  }

  // Low severity errors that are minor inconveniences
  return ErrorSeverity.LOW;
};

/**
 * Generate user-friendly error messages
 */
export const generateUserFriendlyMessage = (
  category: ErrorCategory,
  code: string,
  originalMessage: string,
): string => {
  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      return "Please log in to continue. Your session may have expired.";

    case ErrorCategory.AUTHORIZATION:
      return "You don't have permission to perform this action. Please contact your administrator.";

    case ErrorCategory.VALIDATION:
      return "Please check your input and try again. Some required fields may be missing or invalid.";

    case ErrorCategory.NETWORK:
      return "Connection problem detected. Please check your internet connection and try again.";

    case ErrorCategory.WORKFLOW:
      return "There was a problem with the workflow execution. Please review your workflow configuration.";

    case ErrorCategory.AI_SERVICE:
      return "The AI service is temporarily unavailable. Please try again in a few moments.";

    case ErrorCategory.DATABASE:
      return "We're experiencing database issues. Please try again later.";

    case ErrorCategory.API:
      if (code.includes("404")) {
        return "The requested resource was not found.";
      }
      if (code.includes("500")) {
        return "Server error occurred. Our team has been notified.";
      }
      return "Service temporarily unavailable. Please try again.";

    default:
      return (
        originalMessage || "An unexpected error occurred. Please try again."
      );
  }
};

/**
 * Determine if an error is retryable
 */
export const isRetryableError = (
  category: ErrorCategory,
  code: string,
): boolean => {
  const codeUpper = code.toUpperCase();

  // Never retry authentication or authorization errors
  if (
    category === ErrorCategory.AUTHENTICATION ||
    category === ErrorCategory.AUTHORIZATION
  ) {
    return false;
  }

  // Never retry validation errors
  if (category === ErrorCategory.VALIDATION) {
    return false;
  }

  // Retry network and temporary service errors
  if (
    category === ErrorCategory.NETWORK ||
    category === ErrorCategory.AI_SERVICE ||
    codeUpper.includes("TIMEOUT") ||
    codeUpper.includes("503") ||
    codeUpper.includes("502") ||
    codeUpper.includes("500")
  ) {
    return true;
  }

  return false;
};

/**
 * Generate suggested actions for error recovery
 */
export const generateSuggestedActions = (
  category: ErrorCategory,
  _code: string,
): string[] => {
  const actions: string[] = [];

  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      actions.push("Log in again");
      actions.push("Clear browser cache and cookies");
      break;

    case ErrorCategory.AUTHORIZATION:
      actions.push("Contact your administrator");
      actions.push("Check your user permissions");
      break;

    case ErrorCategory.VALIDATION:
      actions.push("Review and correct the highlighted fields");
      actions.push("Ensure all required fields are filled");
      break;

    case ErrorCategory.NETWORK:
      actions.push("Check your internet connection");
      actions.push("Try refreshing the page");
      actions.push("Wait a moment and try again");
      break;

    case ErrorCategory.WORKFLOW:
      actions.push("Review your workflow configuration");
      actions.push("Check workflow step connections");
      actions.push("Verify input parameters");
      break;

    case ErrorCategory.AI_SERVICE:
      actions.push("Wait a few minutes and try again");
      actions.push("Simplify your request");
      actions.push("Contact support if the issue persists");
      break;

    default:
      actions.push("Try refreshing the page");
      actions.push("Contact support if the problem continues");
      break;
  }

  return actions;
};

/**
 * Create a comprehensive AppError from basic error information
 */
export const createAppError = (
  code: string,
  message: string,
  context: Partial<ErrorContext> = {},
  details?: string,
  stack?: string,
  correlationId?: string,
): AppError => {
  const category = categorizeError(code, message);
  const severity = assessErrorSeverity(category, code);
  const userFriendlyMessage = generateUserFriendlyMessage(
    category,
    code,
    message,
  );
  const retryable = isRetryableError(category, code);
  const suggestedActions = generateSuggestedActions(category, code);

  return {
    id: generateErrorId(),
    code,
    message,
    details,
    category,
    severity,
    correlationId,
    context: {
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context,
    },
    stack,
    retryable,
    userFriendlyMessage,
    actionable: suggestedActions.length > 0,
    suggestedActions,
  };
};


