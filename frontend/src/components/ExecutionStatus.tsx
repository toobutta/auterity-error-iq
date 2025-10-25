import React, { useState, useEffect, useCallback, useRef } from "react";
import { WorkflowExecution } from "../types/workflow";
import { getExecution, getExecutionLogs } from "../api/workflows";

interface ExecutionStatusProps {
  executionId: string;
  onComplete?: (execution: WorkflowExecution) => void;
  showTimeline?: boolean;
  showLogs?: boolean;
}

interface ExecutionLog {
  id: string;
  step_name: string;
  step_type: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  duration_ms: number;
  timestamp: string;
  error_message?: string;
}

const ExecutionStatus: React.FC<ExecutionStatusProps> = ({
  executionId,
  onComplete,
  showTimeline = true,
  showLogs = false,
}) => {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 5;

  // Exponential backoff calculation
  const getPollingInterval = useCallback((retries: number) => {
    const baseInterval = 2000; // 2 seconds
    const maxInterval = 30000; // 30 seconds
    const interval = Math.min(
      baseInterval * Math.pow(1.5, retries),
      maxInterval,
    );
    return interval;
  }, []);

  const fetchExecutionData = useCallback(async () => {
    try {
      const executionData = await getExecution(executionId);
      setExecution(executionData);
      setError(null);
      setRetryCount(0);

      // Fetch logs if requested and execution is running or completed
      if (
        showLogs &&
        (executionData.status === "running" ||
          executionData.status === "completed")
      ) {
        try {
          const logsData = await getExecutionLogs(executionId);
          // Transform ExecutionLogEntry to ExecutionLog format
          const transformedLogs: ExecutionLog[] = logsData.map((entry) => ({
            id: entry.id,
            step_name: entry.stepName || "Unknown Step",
            step_type: entry.level || "info",
            input_data: entry.data || {},
            output_data: entry.data || {},
            duration_ms: entry.duration || 0,
            timestamp: entry.timestamp,
            error_message: entry.level === "error" ? entry.message : undefined,
          }));
          setLogs(transformedLogs);
        } catch (logError) {

        }
      }

      // Stop polling if execution is complete
      if (
        executionData.status === "completed" ||
        executionData.status === "failed"
      ) {
        setIsPolling(false);
        if (onComplete) {
          onComplete(executionData);
        }
      }
    } catch (err: unknown) {

      setError(
        err instanceof Error ? err.message : "Failed to fetch execution status",
      );
      setRetryCount((prev) => prev + 1);

      // Stop polling after max retries
      if (retryCount >= maxRetries) {
        setIsPolling(false);
        setError(
          `Failed to fetch execution status after ${maxRetries} attempts`,
        );
      }
    }
  }, [executionId, showLogs, onComplete, retryCount, maxRetries]);

  useEffect(() => {
    // Initial fetch
    fetchExecutionData();

    // Set up polling
    if (isPolling) {
      const interval = getPollingInterval(retryCount);
      intervalRef.current = setInterval(fetchExecutionData, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchExecutionData, isPolling, retryCount, getPollingInterval]);

  const getStatusColor = (status: WorkflowExecution["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "running":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: WorkflowExecution["status"]) => {
    switch (status) {
      case "pending":
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "running":
        return (
          <svg
            className="w-5 h-5 animate-spin"
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
        );
      case "completed":
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "failed":
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-red-600 mr-2"
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
          <span className="text-red-800 font-medium">Error</span>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
        {retryCount < maxRetries && (
          <button
            onClick={() => {
              setError(null);
              setRetryCount(0);
              setIsPolling(true);
            }}
            className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-gray-600 mr-2 animate-spin"
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
          <span className="text-gray-700">Loading execution status...</span>
        </div>
      </div>
    );
  }

  const statusColorClass = getStatusColor(execution.status);
  const statusIcon = getStatusIcon(execution.status);

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <div className={`border rounded-lg p-4 ${statusColorClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {statusIcon}
            <div className="ml-3">
              <h3 className="font-medium capitalize">{execution.status}</h3>
              <p className="text-sm opacity-75">
                Started at {formatTimestamp(execution.startedAt)}
                {execution.completedAt && (
                  <> • Completed at {formatTimestamp(execution.completedAt)}</>
                )}
              </p>
            </div>
          </div>
          {execution.duration && (
            <div className="text-right">
              <p className="font-medium">
                {formatDuration(execution.duration)}
              </p>
              <p className="text-sm opacity-75">Duration</p>
            </div>
          )}
        </div>

        {/* Progress Bar for Running Status */}
        {execution.status === "running" && (
          <div className="mt-3">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>
            <p className="text-sm mt-1 opacity-75">
              Processing workflow steps...
            </p>
          </div>
        )}

        {/* Error Message */}
        {execution.status === "failed" && execution.errorMessage && (
          <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
            <p className="text-red-800 text-sm font-medium">Error Details:</p>
            <p className="text-red-700 text-sm mt-1">
              {execution.errorMessage}
            </p>
          </div>
        )}
      </div>

      {/* Execution Timeline */}
      {showTimeline && logs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Execution Timeline</h4>
          <div className="space-y-3">
            {logs.map((log, index) => (
              <div key={log.id} className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm font-medium">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {log.step_name}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{formatTimestamp(log.timestamp)}</span>
                      <span className="mx-1">•</span>
                      <span>{formatDuration(log.duration_ms)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 capitalize">
                    {log.step_type.replace("_", " ")}
                  </p>
                  {log.error_message && (
                    <p className="text-sm text-red-600 mt-1">
                      Error: {log.error_message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Updates Indicator */}
      {isPolling && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
            Live updates every{" "}
            {Math.round(getPollingInterval(retryCount) / 1000)}s
          </p>
        </div>
      )}
    </div>
  );
};

export default ExecutionStatus;


