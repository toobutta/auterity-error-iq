/**
 * Comprehensive error type definitions for the application
 */

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NETWORK = "network",
  API = "api",
  WORKFLOW = "workflow",
  AI_SERVICE = "ai_service",
  DATABASE = "database",
  SYSTEM = "system",
  USER_INPUT = "user_input",
  UNKNOWN = "unknown",
}

export interface ErrorContext {
  userId?: string;
  workflowId?: string;
  executionId?: string;
  component?: string;
  action?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
}

export interface AppError {
  id: string;
  code: string;
  message: string;
  details?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  correlationId?: string;
  context: ErrorContext;
  stack?: string;
  retryable: boolean;
  userFriendlyMessage: string;
  actionable: boolean;
  suggestedActions?: string[];
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export interface ErrorDisplayOptions {
  showDetails: boolean;
  showStack: boolean;
  showCorrelationId: boolean;
  allowDismiss: boolean;
  autoHide: boolean;
  hideAfter?: number;
}

export interface ErrorReportData {
  error: AppError;
  userFeedback?: string;
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
}


