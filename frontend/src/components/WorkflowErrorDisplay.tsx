import React, { useState, useEffect } from "react";
import { WorkflowExecution } from "../types/workflow";
import {
  getExecution,
  getExecutionLogs,
  retryWorkflowExecution,
} from "../api/workflows";
import { useError } from "../contexts/ErrorContext";
import { ErrorCategory, ErrorSeverity } from "../types/error";
import { createAppError } from "../utils/errorUtils";
import { ExecutionLog } from "../types/execution-logs";
import { sanitizeInput } from "../utils/sanitizer";
// TODO: Re-enable when Kiro integration is needed
// import { useKiroIntegration } from '../hooks/useKiroIntegration';
import RetryWorkflowModal from "./RetryWorkflowModal";
import ErrorReportModal from "./ErrorReportModal";

interface WorkflowErrorDisplayProps {
  executionId: string;
  workflowId?: string;
  onRetrySuccess?: (newExecutionId: string) => void;
  onClose?: () => void;
  className?: string;
}

const WorkflowErrorDisplay: React.FC<WorkflowErrorDisplayProps> = ({
  executionId,
  workflowId,
  onRetrySuccess,
  onClose,
  className = "",
}) => {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["overview"]),
  );

  const { addError } = useError();
  // TODO: Implement permission checking when needed
  // const { hasPermission, getErrorRoute } = useKiroIntegration('admin');

  useEffect(() => {
    const fetchExecutionData = async () => {
      try {
        setLoading(true);
        const executionData = await getExecution(executionId);
        setExecution(executionData);

        // Fetch execution logs for detailed error analysis
        try {
          const logsData = await getExecutionLogs(executionId);
          const transformedLogs: ExecutionLog[] = logsData.map((entry) => ({
            id: entry.id,
            stepName: entry.stepName || "Unknown Step",
            level: (entry.level === "warn" ? "warning" : entry.level) || "info",
            message: entry.message || "",
            data: entry.data || {},
            inputData: entry.data || {},
            outputData: entry.data || {},
            duration: 0, // Default duration since API doesn't provide it
            timestamp: entry.timestamp,
            errorMessage: entry.level === "error" ? entry.message : undefined,
          })) as ExecutionLog[];
          setLogs(transformedLogs);
        } catch (logError) {

        }
      } catch (error) {
        addError("Failed to load execution details", {
          executionId,
          component: "WorkflowErrorDisplay",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExecutionData();
  }, [executionId, addError]);

  const categorizeError = (
    errorMessage: string,
    logs: ExecutionLog[],
  ): ErrorCategory => {
    const message = errorMessage.toLowerCase();

    if (
      message.includes("validation") ||
      message.includes("invalid input") ||
      message.includes("required field")
    ) {
      return ErrorCategory.VALIDATION;
    }
    if (
      message.includes("ai service") ||
      message.includes("openai") ||
      message.includes("gpt")
    ) {
      return ErrorCategory.AI_SERVICE;
    }
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("connection")
    ) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes("database") || message.includes("sql")) {
      return ErrorCategory.DATABASE;
    }
    if (
      message.includes("authentication") ||
      message.includes("unauthorized")
    ) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes("permission") || message.includes("forbidden")) {
      return ErrorCategory.AUTHORIZATION;
    }

    // Check logs for more context
    const hasAiErrors = logs.some(
      (log) =>
        log.errorMessage?.toLowerCase().includes("ai") ||
        log.stepType === "ai_process",
    );
    if (hasAiErrors) return ErrorCategory.AI_SERVICE;

    return ErrorCategory.WORKFLOW;
  };

  const getErrorSeverity = (
    category: ErrorCategory,
    errorMessage: string,
  ): ErrorSeverity => {
    if (
      errorMessage.toLowerCase().includes("critical") ||
      errorMessage.toLowerCase().includes("fatal")
    ) {
      return ErrorSeverity.CRITICAL;
    }

    switch (category) {
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.DATABASE:
        return ErrorSeverity.HIGH;
      case ErrorCategory.AI_SERVICE:
      case ErrorCategory.NETWORK:
      case ErrorCategory.WORKFLOW:
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.LOW;
    }
  };

  const getFailurePoint = (
    logs: ExecutionLog[],
  ): { stepName: string; stepIndex: number } | null => {
    const errorLog = logs.find((log) => log.errorMessage);
    if (errorLog) {
      const stepIndex = logs.findIndex((log) => log.id === errorLog.id);
      return {
        stepName: errorLog.stepName,
        stepIndex: stepIndex + 1,
      };
    }
    return null;
  };

  const handleRetrySuccess = async (
    modifiedInputs: Record<string, unknown>,
  ) => {
    try {
      // Sanitize inputs to prevent NoSQL injection
      const sanitizedInputs: Record<string, unknown> = {};
      Object.entries(modifiedInputs).forEach(([key, value]) => {
        sanitizedInputs[sanitizeInput(key)] =
          typeof value === "string" ? sanitizeInput(value) : value;
      });

      // Execute retry with sanitized inputs
      const response = await retryWorkflowExecution(
        executionId,
        sanitizedInputs,
      );
      setShowRetryModal(false);
      if (onRetrySuccess) {
        onRetrySuccess(response.executionId);
      }
    } catch (error) {

      // Error handling is done within the modal
    }
  };

  const handleReportSubmit = async () => {
    // The ErrorReportModal handles the submission internally
    setShowReportModal(false);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <div
        className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-center justify-center">
          <svg
            className="w-6 h-6 text-gray-400 animate-spin mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-gray-600">Loading error details...</span>
        </div>
      </div>
    );
  }

  if (!execution || execution.status !== "failed") {
    return (
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}
      >
        <div className="text-center text-gray-600">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>No error information available</p>
        </div>
      </div>
    );
  }

  const errorCategory = categorizeError(execution.errorMessage || "", logs);
  const errorSeverity = getErrorSeverity(
    errorCategory,
    execution.errorMessage || "",
  );
  const failurePoint = getFailurePoint(logs);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="w-8 h-8 text-red-600 mr-3"
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Workflow Execution Failed
              </h2>
              <p className="text-sm text-gray-600">
                Execution ID: {executionId}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          {workflowId && (
            <button
              onClick={() => setShowRetryModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry Execution
            </button>
          )}
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Report Issue
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Error Overview */}
        <div>
          <button
            onClick={() => toggleSection("overview")}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-red-600"
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
              Error Overview
            </h3>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has("overview") ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {expandedSections.has("overview") && (
            <div className="mt-4 space-y-4">
              {/* Error Categorization */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800">Category</h4>
                  <p className="text-red-700 capitalize">
                    {errorCategory.replace("_", " ")}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800">Severity</h4>
                  <p className="text-orange-700 capitalize">{errorSeverity}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800">Failure Point</h4>
                  <p className="text-yellow-700">
                    {failurePoint
                      ? `Step ${failurePoint.stepIndex}: ${failurePoint.stepName}`
                      : "Unknown"}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Error Message</h4>
                <p className="text-red-700 font-mono text-sm whitespace-pre-wrap">
                  {execution.errorMessage || "No error message available"}
                </p>
              </div>

              {/* Execution Timeline */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Execution Timeline
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Started:</strong>{" "}
                    {formatTimestamp(execution.startedAt)}
                  </p>
                  {execution.completedAt && (
                    <p>
                      <strong>Failed:</strong>{" "}
                      {formatTimestamp(execution.completedAt)}
                    </p>
                  )}
                  {execution.duration && (
                    <p>
                      <strong>Duration:</strong>{" "}
                      {formatDuration(execution.duration)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Logs */}
        {logs.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection("logs")}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Execution Logs ({logs.length} steps)
              </h3>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has("logs") ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {expandedSections.has("logs") && (
              <div className="mt-4 space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-4 ${
                      log.errorMessage
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span
                          className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3
                          ${
                            log.errorMessage
                              ? "bg-red-200 text-red-800"
                              : "bg-blue-200 text-blue-800"
                          }
                        `}
                        >
                          {index + 1}
                        </span>
                        <h4 className="font-medium text-gray-900">
                          {log.stepName}
                        </h4>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(log.timestamp)} •{" "}
                        {formatDuration(log.duration)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2 capitalize">
                      {log.level.replace("_", " ")}
                    </p>

                    {log.errorMessage && (
                      <div className="bg-red-100 border border-red-200 rounded p-3 mb-3">
                        <p className="text-red-800 font-medium text-sm">
                          Error:
                        </p>
                        <p className="text-red-700 text-sm font-mono mt-1">
                          {log.errorMessage}
                        </p>
                      </div>
                    )}

                    {/* Input/Output Data */}
                    {(Object.keys(log.inputData || {}).length > 0 ||
                      Object.keys(log.outputData || {}).length > 0) && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                          View Step Data
                        </summary>
                        <div className="mt-2 space-y-2">
                          {Object.keys(log.inputData || {}).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700">
                                Input:
                              </p>
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.inputData, null, 2)}
                              </pre>
                            </div>
                          )}
                          {Object.keys(log.outputData || {}).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700">
                                Output:
                              </p>
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.outputData, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stack Trace */}
        {execution.errorMessage && (
          <div>
            <button
              onClick={() => toggleSection("stack")}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
                Technical Details
              </h3>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has("stack") ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {expandedSections.has("stack") && (
              <div className="mt-4">
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {execution.errorMessage}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Retry Modal */}
      {showRetryModal && execution && workflowId && (
        <RetryWorkflowModal
          isOpen={showRetryModal}
          onClose={() => setShowRetryModal(false)}
          executionId={executionId}
          workflowId={workflowId}
          error={createAppError(
            "WORKFLOW_EXECUTION_FAILED",
            execution.errorMessage || "Workflow execution failed",
            {
              workflowId,
              executionId,
              component: "WorkflowErrorDisplay",
            },
          )}
          onRetry={handleRetrySuccess}
        />
      )}

      {/* Error Report Modal */}
      {showReportModal && execution && (
        <ErrorReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          error={createAppError(
            "WORKFLOW_EXECUTION_FAILED",
            execution.errorMessage || "Workflow execution failed",
            {
              workflowId,
              executionId,
              component: "WorkflowErrorDisplay",
            },
            JSON.stringify({ logs, execution }),
            undefined,
            execution.id,
          )}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
};

export default WorkflowErrorDisplay;


