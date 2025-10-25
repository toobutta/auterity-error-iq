import React, { useState, useMemo } from "react";
import { sanitizeInput } from "../../utils/sanitizer";

// Types for Agent Logs and Model Training
export interface AgentLog {
  id: string;
  agentId: string;
  agentName: string;
  sessionId: string;
  timestamp: Date;
  message: string;
  messageType: "user" | "assistant" | "system" | "error";
  modelId?: string;
  modelName?: string;
  tokens?: number;
  response_time?: number;
  metadata?: Record<string, unknown>;
}

export interface ModelTrainingJob {
  id: string;
  modelId: string;
  modelName: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  startTime: Date;
  endTime?: Date;
  parameters: {
    learningRate: number;
    batchSize: number;
    epochs: number;
    dataset: string;
  };
  metrics?: {
    accuracy?: number;
    loss?: number;
    f1Score?: number;
    precision?: number;
    recall?: number;
  };
  triggeredBy?: {
    type:
      | "manual"
      | "agent_conversation"
      | "schedule"
      | "performance_threshold";
    agentSessionId?: string;
    logId?: string;
  };
  logs: string[];
}

export interface CorrelationData {
  agentLog: AgentLog;
  relatedTrainingJobs: ModelTrainingJob[];
  correlation: {
    type: "direct" | "indirect" | "temporal";
    confidence: number;
    reason: string;
  };
}

interface ConversationLogViewerProps {
  logs: AgentLog[];
  onLogSelect?: (log: AgentLog) => void;
  selectedLogId?: string;
  enableFiltering?: boolean;
  enableSearch?: boolean;
}

export const ConversationLogViewer: React.FC<ConversationLogViewerProps> = ({
  logs,
  onLogSelect,
  selectedLogId,
  enableFiltering = true,
  enableSearch = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterMessageType, setFilterMessageType] = useState<string>("");
  const [sortBy, setSortBy] = useState<"timestamp" | "agent" | "tokens">(
    "timestamp",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Get unique agents for filtering
  const uniqueAgents = useMemo(
    () => Array.from(new Set(logs.map((log) => log.agentName))).sort(),
    [logs],
  );

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Apply search filter
    if (searchTerm) {
      const sanitizedSearchTerm = sanitizeInput(searchTerm);
      filtered = filtered.filter(
        (log) =>
          log.message
            .toLowerCase()
            .includes(sanitizedSearchTerm.toLowerCase()) ||
          log.agentName
            .toLowerCase()
            .includes(sanitizedSearchTerm.toLowerCase()),
      );
    }

    // Apply agent filter
    if (filterAgent) {
      const sanitizedFilterAgent = sanitizeInput(filterAgent);
      filtered = filtered.filter(
        (log) => log.agentName === sanitizedFilterAgent,
      );
    }

    // Apply message type filter
    if (filterMessageType) {
      const sanitizedFilterMessageType = sanitizeInput(filterMessageType);
      filtered = filtered.filter(
        (log) => log.messageType === sanitizedFilterMessageType,
      );
    }

    // Sort logs
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "timestamp":
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case "agent":
          comparison = a.agentName.localeCompare(b.agentName);
          break;
        case "tokens":
          comparison = (a.tokens || 0) - (b.tokens || 0);
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [logs, searchTerm, filterAgent, filterMessageType, sortBy, sortOrder]);

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getMessageTypeIcon = (type: AgentLog["messageType"]) => {
    switch (type) {
      case "user":
        return "👤";
      case "assistant":
        return "🤖";
      case "system":
        return "⚙️";
      case "error":
        return "❌";
      default:
        return "💬";
    }
  };

  const getMessageTypeColor = (type: AgentLog["messageType"]) => {
    switch (type) {
      case "user":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "assistant":
        return "text-green-600 bg-green-50 border-green-200";
      case "system":
        return "text-gray-600 bg-gray-50 border-gray-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      {(enableFiltering || enableSearch) && (
        <div className="glass-card p-4 space-y-4">
          <div className="flex flex-wrap gap-4">
            {enableSearch && (
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(sanitizeInput(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {enableFiltering && (
              <>
                <select
                  value={filterAgent}
                  onChange={(e) =>
                    setFilterAgent(sanitizeInput(e.target.value))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Agents</option>
                  {uniqueAgents.map((agent) => (
                    <option key={agent} value={agent}>
                      {agent}
                    </option>
                  ))}
                </select>

                <select
                  value={filterMessageType}
                  onChange={(e) =>
                    setFilterMessageType(sanitizeInput(e.target.value))
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Types</option>
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                  <option value="system">System</option>
                  <option value="error">Error</option>
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field as typeof sortBy);
                    setSortOrder(order as typeof sortOrder);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="timestamp-desc">Newest First</option>
                  <option value="timestamp-asc">Oldest First</option>
                  <option value="agent-asc">Agent A-Z</option>
                  <option value="agent-desc">Agent Z-A</option>
                  <option value="tokens-desc">Most Tokens</option>
                  <option value="tokens-asc">Least Tokens</option>
                </select>
              </>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="space-y-2">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className={`glass-card p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedLogId === log.id
                ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                : ""
            }`}
            onClick={() => onLogSelect?.(log)}
          >
            <div className="flex items-start space-x-3">
              {/* Message Type Icon */}
              <div
                className={`px-2 py-1 rounded text-xs font-medium border ${getMessageTypeColor(log.messageType)}`}
              >
                <span className="mr-1">
                  {getMessageTypeIcon(log.messageType)}
                </span>
                {log.messageType}
              </div>

              {/* Log Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {log.agentName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {log.timestamp.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {log.tokens && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {log.tokens} tokens
                      </span>
                    )}
                    {log.response_time && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {log.response_time}ms
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(log.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {expandedLogs.has(log.id) ? "▼" : "▶"}
                    </button>
                  </div>
                </div>

                {/* Message Preview */}
                <div className="text-gray-700 dark:text-gray-300">
                  {expandedLogs.has(log.id) ? (
                    <div className="whitespace-pre-wrap">{log.message}</div>
                  ) : (
                    <div className="line-clamp-2">{log.message}</div>
                  )}
                </div>

                {/* Model Information */}
                {log.modelName && (
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Model: {log.modelName}
                  </div>
                )}

                {/* Metadata */}
                {expandedLogs.has(log.id) && log.metadata && (
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                    <div className="font-medium mb-1">Metadata:</div>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="glass-card p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📝</div>
              <div className="text-lg font-medium mb-1">No logs found</div>
              <div className="text-sm">
                Try adjusting your search or filters
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


