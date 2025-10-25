import React, { useState, useMemo } from "react";
import {
  AgentLog,
  ModelTrainingJob,
  CorrelationData,
} from "./ConversationLogViewer";

interface CorrelationPanelProps {
  logs: AgentLog[];
  trainingJobs: ModelTrainingJob[];
  selectedLog?: AgentLog;
  selectedJob?: ModelTrainingJob;
  onLogSelect?: (log: AgentLog) => void;
  onJobSelect?: (job: ModelTrainingJob) => void;
}

export const CorrelationPanel: React.FC<CorrelationPanelProps> = ({
  logs,
  trainingJobs,
  selectedLog,
  selectedJob,
  onLogSelect,
  onJobSelect,
}) => {
  const [viewMode, setViewMode] = useState<"timeline" | "network" | "details">(
    "timeline",
  );
  const [timeRange, setTimeRange] = useState<
    "1h" | "6h" | "24h" | "7d" | "all"
  >("24h");

  // Calculate correlations
  const correlations = useMemo(() => {
    const correlationMap: CorrelationData[] = [];

    logs.forEach((log) => {
      const relatedJobs = trainingJobs.filter((job) => {
        // Direct correlation - job triggered by this log
        if (job.triggeredBy?.logId === log.id) {
          return true;
        }

        // Indirect correlation - same model used
        if (job.modelId === log.modelId) {
          return true;
        }

        // Temporal correlation - job started within timeframe of log
        const timeDiff = Math.abs(
          job.startTime.getTime() - log.timestamp.getTime(),
        );
        return timeDiff < 3600000; // Within 1 hour
      });

      if (relatedJobs.length > 0) {
        correlationMap.push({
          agentLog: log,
          relatedTrainingJobs: relatedJobs,
          correlation: {
            type: relatedJobs.some((job) => job.triggeredBy?.logId === log.id)
              ? "direct"
              : relatedJobs.some((job) => job.modelId === log.modelId)
                ? "indirect"
                : "temporal",
            confidence: relatedJobs.some(
              (job) => job.triggeredBy?.logId === log.id,
            )
              ? 0.9
              : relatedJobs.some((job) => job.modelId === log.modelId)
                ? 0.7
                : 0.4,
            reason: relatedJobs.some((job) => job.triggeredBy?.logId === log.id)
              ? "Training job directly triggered by this conversation"
              : relatedJobs.some((job) => job.modelId === log.modelId)
                ? "Same model used in conversation and training"
                : "Training job started around the same time as conversation",
          },
        });
      }
    });

    return correlationMap;
  }, [logs, trainingJobs]);

  // Filter by time range
  const filteredCorrelations = useMemo(() => {
    if (timeRange === "all") return correlations;

    const now = new Date();
    const cutoff = new Date();

    switch (timeRange) {
      case "1h":
        cutoff.setHours(now.getHours() - 1);
        break;
      case "6h":
        cutoff.setHours(now.getHours() - 6);
        break;
      case "24h":
        cutoff.setDate(now.getDate() - 1);
        break;
      case "7d":
        cutoff.setDate(now.getDate() - 7);
        break;
    }

    return correlations.filter((c) => c.agentLog.timestamp >= cutoff);
  }, [correlations, timeRange]);

  // Get correlations for selected log
  const selectedLogCorrelations = useMemo(() => {
    if (!selectedLog) return [];
    return filteredCorrelations.filter((c) => c.agentLog.id === selectedLog.id);
  }, [filteredCorrelations, selectedLog]);

  // Get correlations for selected job
  const selectedJobCorrelations = useMemo(() => {
    if (!selectedJob) return [];
    return filteredCorrelations.filter((c) =>
      c.relatedTrainingJobs.some((job) => job.id === selectedJob.id),
    );
  }, [filteredCorrelations, selectedJob]);

  const getCorrelationColor = (
    type: CorrelationData["correlation"]["type"],
  ) => {
    switch (type) {
      case "direct":
        return "text-green-600 bg-green-50 border-green-200";
      case "indirect":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "temporal":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getCorrelationIcon = (type: CorrelationData["correlation"]["type"]) => {
    switch (type) {
      case "direct":
        return "🎯";
      case "indirect":
        return "🔗";
      case "temporal":
        return "⏰";
      default:
        return "❓";
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Timeline View Component
  const TimelineView = () => {
    const timelineData = useMemo(() => {
      const events: Array<{
        id: string;
        timestamp: Date;
        type: "log" | "job_start" | "job_end";
        data: AgentLog | ModelTrainingJob;
        correlation?: CorrelationData;
      }> = [];

      // Add log events
      filteredCorrelations.forEach((correlation) => {
        events.push({
          id: `log-${correlation.agentLog.id}`,
          timestamp: correlation.agentLog.timestamp,
          type: "log",
          data: correlation.agentLog,
          correlation,
        });

        // Add job events
        correlation.relatedTrainingJobs.forEach((job) => {
          events.push({
            id: `job-start-${job.id}`,
            timestamp: job.startTime,
            type: "job_start",
            data: job,
            correlation,
          });

          if (job.endTime) {
            events.push({
              id: `job-end-${job.id}`,
              timestamp: job.endTime,
              type: "job_end",
              data: job,
              correlation,
            });
          }
        });
      });

      return events.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
    }, [filteredCorrelations]);

    return (
      <div className="space-y-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>

          {/* Timeline events */}
          <div className="space-y-6">
            {timelineData.map((event) => (
              <div
                key={event.id}
                className="relative flex items-start space-x-4"
              >
                {/* Timeline dot */}
                <div
                  className={`relative z-10 w-4 h-4 rounded-full border-2 ${
                    event.type === "log"
                      ? "bg-blue-500 border-blue-500"
                      : event.type === "job_start"
                        ? "bg-green-500 border-green-500"
                        : "bg-red-500 border-red-500"
                  }`}
                ></div>

                {/* Event content */}
                <div className="flex-1 glass-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium">
                          {event.type === "log"
                            ? "💬 Agent Log"
                            : event.type === "job_start"
                              ? "🚀 Training Started"
                              : "✅ Training Completed"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {event.timestamp.toLocaleString()}
                        </span>
                      </div>

                      {event.type === "log" ? (
                        <div
                          className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded"
                          onClick={() => onLogSelect?.(event.data as AgentLog)}
                        >
                          <div className="font-medium">
                            {(event.data as AgentLog).agentName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {(event.data as AgentLog).message}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 p-2 rounded"
                          onClick={() =>
                            onJobSelect?.(event.data as ModelTrainingJob)
                          }
                        >
                          <div className="font-medium">
                            {(event.data as ModelTrainingJob).modelName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {event.type === "job_start"
                              ? "Training started"
                              : `Training completed - ${(event.data as ModelTrainingJob).progress}%`}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Correlation indicator */}
                    {event.correlation && (
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium border ${getCorrelationColor(event.correlation.correlation.type)}`}
                      >
                        <span className="mr-1">
                          {getCorrelationIcon(
                            event.correlation.correlation.type,
                          )}
                        </span>
                        {formatConfidence(
                          event.correlation.correlation.confidence,
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Details View Component
  const DetailsView = () => {
    const activeCorrelations = selectedLog
      ? selectedLogCorrelations
      : selectedJob
        ? selectedJobCorrelations
        : filteredCorrelations.slice(0, 5);

    return (
      <div className="space-y-4">
        {activeCorrelations.map((correlation, index) => (
          <div
            key={`${correlation.agentLog.id}-${index}`}
            className="glass-card p-6"
          >
            {/* Correlation Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`px-3 py-1 rounded-lg text-sm font-medium border ${getCorrelationColor(correlation.correlation.type)}`}
                >
                  <span className="mr-2">
                    {getCorrelationIcon(correlation.correlation.type)}
                  </span>
                  {correlation.correlation.type} correlation
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Confidence:{" "}
                  {formatConfidence(correlation.correlation.confidence)}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {correlation.correlation.reason}
            </div>

            {/* Agent Log */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  💬 Agent Log
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {correlation.agentLog.timestamp.toLocaleString()}
                </span>
              </div>
              <div className="font-medium mb-1">
                {correlation.agentLog.agentName}
              </div>
              <div className="text-sm">{correlation.agentLog.message}</div>
              {correlation.agentLog.modelName && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Model: {correlation.agentLog.modelName}
                </div>
              )}
            </div>

            {/* Related Training Jobs */}
            <div className="space-y-3">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                Related Training Jobs ({correlation.relatedTrainingJobs.length})
              </div>
              {correlation.relatedTrainingJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        🤖 {job.modelName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {job.startTime.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          job.status === "completed"
                            ? "bg-green-500 text-white"
                            : job.status === "running"
                              ? "bg-blue-500 text-white"
                              : job.status === "failed"
                                ? "bg-red-500 text-white"
                                : "bg-gray-500 text-white"
                        }`}
                      >
                        {job.status} - {job.progress}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>Learning Rate: {job.parameters.learningRate}</div>
                    <div>Batch Size: {job.parameters.batchSize}</div>
                    <div>Epochs: {job.parameters.epochs}</div>
                    <div>Dataset: {job.parameters.dataset}</div>
                  </div>

                  {job.metrics && (
                    <div className="mt-2 flex space-x-4 text-xs">
                      {job.metrics.accuracy && (
                        <div>
                          Accuracy: {(job.metrics.accuracy * 100).toFixed(1)}%
                        </div>
                      )}
                      {job.metrics.loss && (
                        <div>Loss: {job.metrics.loss.toFixed(4)}</div>
                      )}
                    </div>
                  )}

                  {job.triggeredBy && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      Triggered by: {job.triggeredBy.type.replace("_", " ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {activeCorrelations.length === 0 && (
          <div className="glass-card p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-lg font-medium mb-1">
                No correlations found
              </div>
              <div className="text-sm">
                {selectedLog || selectedJob
                  ? "No related training activities for the selected item"
                  : "Select a log or training job to see correlations"}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              View:
            </span>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1 text-xs ${viewMode === "timeline" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode("details")}
                className={`px-3 py-1 text-xs ${viewMode === "details" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              >
                Details
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Range:
            </span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
              className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredCorrelations.length} correlations found
          </div>
        </div>
      </div>

      {/* Selected Item Info */}
      {(selectedLog || selectedJob) && (
        <div className="glass-card p-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
            {selectedLog ? "💬 Selected Log" : "🤖 Selected Training Job"}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            {selectedLog
              ? `${selectedLog.agentName} - ${selectedLog.timestamp.toLocaleString()}`
              : `${selectedJob?.modelName} - ${selectedJob?.startTime.toLocaleString()}`}
          </div>
        </div>
      )}

      {/* View Content */}
      {viewMode === "timeline" && <TimelineView />}
      {viewMode === "details" && <DetailsView />}
    </div>
  );
};


