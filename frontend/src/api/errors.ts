import client from "./client";
import { ErrorReportData, ErrorContext } from "../types/error";

export interface WorkflowExecutionError {
  id: string;
  type: "validation" | "runtime" | "ai_service" | "timeout" | "system";
  message: string;
  details?: string;
  stackTrace?: string;
  failurePoint?: {
    stepId: string;
    stepName: string;
    stepIndex: number;
  };
  timestamp: string;
  context?: ErrorContext;
}

/**
 * Report an error to the backend for analysis and tracking
 */
export const reportError = async (report: ErrorReportData): Promise<void> => {
  const response = await client.post("/api/errors/report", report);
  return response.data;
};

/**
 * Get detailed error information for a specific execution
 */
export const getErrorDetails = async (
  executionId: string,
): Promise<WorkflowExecutionError> => {
  const response = await client.get(`/api/executions/${executionId}/error`);
  return response.data;
};

/**
 * Get error statistics and trends
 */
export interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: WorkflowExecutionError[];
  topErrorMessages: Array<{ message: string; count: number }>;
}

export const getErrorStats = async (
  timeRange?: string,
): Promise<ErrorStats> => {
  const params = timeRange ? `?timeRange=${timeRange}` : "";
  const response = await client.get(`/api/errors/stats${params}`);
  return response.data;
};


