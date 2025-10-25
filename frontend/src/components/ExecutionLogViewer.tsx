import React, { useEffect, useState, useCallback, useRef } from "react";
import { getExecutionLogs } from "../api/workflows";
import { useWebSocketLogs } from "../hooks/useWebSocketLogs";

interface InputData {
  [key: string]: string | number | boolean | null;
}

interface OutputData {
  [key: string]: string | number | boolean | null;
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  step_name: string;
  step_type: string;
  input_data: InputData;
  output_data: OutputData;
  duration_ms: number;
  timestamp: string;
  error_message?: string;
  level: "info" | "warning" | "error";
}
interface ExecutionLogViewerProps {
  executionId: string;
  className?: string;
  maxHeight?: string;
  enableRealTime?: boolean;
}

export const ExecutionLogViewer: React.FC<ExecutionLogViewerProps> = ({
  executionId,
  className = "",
  maxHeight = "max-h-96",
  enableRealTime = true,
}) => {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [filterLevel, setFilterLevel] = useState<
    "all" | "info" | "warning" | "error"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  // Refs for auto-scroll functionality
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // WebSocket hook for real-time logs
  const {
    logs: realtimeLogs,
    connectionStatus,
    error: wsError,
    reconnect,
    clearLogs: clearRealtimeLogs,
  } = useWebSocketLogs(executionId, { enabled: enableRealTime });

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getExecutionLogs(executionId);
      // Transform API response to match our interface
      const transformedLogs: ExecutionLog[] = data.map((log) => ({
        id: log.id,
        execution_id: log.executionId,
        step_name: log.stepName || "Unknown Step",
        step_type: log.stepName ? "step" : "system",
        input_data: (log.data || {}) as InputData,
        output_data: (log.data || {}) as OutputData,
        duration_ms: log.duration || 0,
        timestamp: log.timestamp,
        error_message: log.level === "error" ? log.message : undefined,
        level:
          log.level === "debug"
            ? "info"
            : (log.level as "info" | "warning" | "error"),
      }));

      setLogs(transformedLogs);
    } catch (err) {
      setError("Failed to load execution logs");

    } finally {
      setLoading(false);
    }
  }, [executionId]);

  // Merge real-time logs with existing logs
  useEffect(() => {
    if (enableRealTime && realtimeLogs.length > 0) {
      setLogs((prevLogs) => {
        // Create a map of existing logs by ID to avoid duplicates
        const existingLogsMap = new Map(prevLogs.map((log) => [log.id, log]));

        // Add new real-time logs that don't already exist
        const newLogs = realtimeLogs.filter(
          (log) => !existingLogsMap.has(log.id),
        );

        if (newLogs.length > 0) {
          const mergedLogs = [...prevLogs, ...newLogs];
          // Sort by timestamp to maintain chronological order
          return mergedLogs.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );
        }

        return prevLogs;
      });
    }
  }, [realtimeLogs, enableRealTime]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // Handle scroll to detect if user has scrolled up (disable auto-scroll)
  const handleScroll = useCallback(() => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        logsContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setAutoScroll(isAtBottom);
    }
  }, []);

  useEffect(() => {
    if (executionId) {
      // Only fetch initial logs if real-time is disabled or as fallback
      if (!enableRealTime) {
        fetchLogs();
      } else {
        setLoading(false); // Real-time logs will populate the component
      }
    }
  }, [executionId, fetchLogs, enableRealTime]);

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    const matchesSearch =
      searchTerm === "" ||
      log.step_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.step_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.error_message &&
        log.error_message.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesLevel && matchesSearch;
  });

  // Get connection status display info
  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case "connected":
        return { color: "bg-green-500", text: "Live", icon: "🟢" };
      case "connecting":
        return { color: "bg-yellow-500", text: "Connecting...", icon: "🟡" };
      case "error":
        return { color: "bg-red-500", text: "Error", icon: "🔴" };
      default:
        return { color: "bg-gray-500", text: "Disconnected", icon: "⚫" };
    }
  };

  const connectionInfo = getConnectionStatusInfo();

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatJsonData = (data: InputData | OutputData) => {
    if (!data || Object.keys(data).length === 0) return "No data";
    return JSON.stringify(data, null, 2);
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="animate-pulse" data-testid="loading-skeleton">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Logs
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        {/* Connection Status Bar */}
        {enableRealTime && (
          <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connectionInfo.color}`} />
              <span className="text-sm text-gray-600">
                {connectionInfo.text}
              </span>
              {wsError && (
                <span className="text-xs text-red-600 ml-2">{wsError}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {connectionStatus === "error" && (
                <button
                  onClick={reconnect}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <svg
                    className="h-3 w-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reconnect
                </button>
              )}
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`inline-flex items-center px-2 py-1 border shadow-sm text-xs font-medium rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  autoScroll
                    ? "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
              >
                <svg
                  className="h-3 w-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                Auto-scroll
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Execution Logs
            {enableRealTime && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Real-time
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredLogs.length} of {logs.length} logs
            </span>
            {!enableRealTime && (
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg
                  className="h-3 w-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            )}
            {enableRealTime && (
              <button
                onClick={clearRealtimeLogs}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="h-3 w-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Level Filter */}
          <div className="sm:w-40">
            <select
              value={filterLevel}
              onChange={(e) =>
                setFilterLevel(
                  e.target.value as "all" | "info" | "warning" | "error",
                )
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div
        ref={logsContainerRef}
        className={`${maxHeight} overflow-y-auto`}
        onScroll={handleScroll}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Logs Found
            </h3>
            <p className="text-gray-600">
              {logs.length === 0
                ? "No execution logs available for this workflow."
                : "No logs match your current filters."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Log Header */}
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{getLevelIcon(log.level)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {log.step_name}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}
                          >
                            {log.step_type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{formatTimestamp(log.timestamp)}</span>
                          <span>
                            Duration: {formatDuration(log.duration_ms)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {log.error_message && (
                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <strong>Error:</strong> {log.error_message}
                      </div>
                    )}

                    {/* Expandable Details */}
                    {expandedLogs.has(log.id) && (
                      <div className="mt-3 space-y-3">
                        {/* Input Data */}
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-1">
                            Input Data:
                          </h5>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {formatJsonData(log.input_data)}
                          </pre>
                        </div>

                        {/* Output Data */}
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-1">
                            Output Data:
                          </h5>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {formatJsonData(log.output_data)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleLogExpansion(log.id)}
                    className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                  >
                    <svg
                      className={`h-5 w-5 transform transition-transform ${expandedLogs.has(log.id) ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Auto-scroll anchor */}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};


