import React, { useState, useMemo } from "react";
import { ModelTrainingJob } from "./ConversationLogViewer";

interface ModelTrainingDashboardProps {
  jobs: ModelTrainingJob[];
  onJobSelect?: (job: ModelTrainingJob) => void;
  selectedJobId?: string;
  enableFiltering?: boolean;
  enableActions?: boolean;
}

export const ModelTrainingDashboard: React.FC<ModelTrainingDashboardProps> = ({
  jobs,
  onJobSelect,
  selectedJobId,
  enableFiltering = true,
  enableActions = true,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterModel, setFilterModel] = useState("");
  const [sortBy, setSortBy] = useState<"startTime" | "progress" | "modelName">(
    "startTime",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Get unique models for filtering
  const uniqueModels = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.modelName))).sort(),
    [jobs],
  );

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter((job) => job.status === filterStatus);
    }

    // Apply model filter
    if (filterModel) {
      filtered = filtered.filter((job) => job.modelName === filterModel);
    }

    // Sort jobs
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "startTime":
          comparison = a.startTime.getTime() - b.startTime.getTime();
          break;
        case "progress":
          comparison = a.progress - b.progress;
          break;
        case "modelName":
          comparison = a.modelName.localeCompare(b.modelName);
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [jobs, filterStatus, filterModel, sortBy, sortOrder]);

  const getStatusColor = (status: ModelTrainingJob["status"]) => {
    switch (status) {
      case "running":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      case "cancelled":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "pending":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: ModelTrainingJob["status"]) => {
    switch (status) {
      case "running":
        return "🔄";
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      case "cancelled":
        return "⏹️";
      case "pending":
        return "⏳";
      default:
        return "❓";
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const JobCard: React.FC<{ job: ModelTrainingJob }> = ({ job }) => (
    <div
      className={`glass-card p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
        selectedJobId === job.id
          ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
          : ""
      }`}
      onClick={() => onJobSelect?.(job)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {job.modelName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ID: {job.id}
          </p>
        </div>
        <div
          className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(job.status)}`}
        >
          <span className="mr-1">{getStatusIcon(job.status)}</span>
          {job.status}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="text-gray-900 dark:text-gray-100">
            {job.progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              job.status === "completed"
                ? "bg-green-500"
                : job.status === "failed"
                  ? "bg-red-500"
                  : job.status === "running"
                    ? "bg-blue-500"
                    : "bg-gray-400"
            }`}
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      {job.metrics && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {job.metrics.accuracy && (
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Accuracy
              </div>
              <div className="font-medium">
                {(job.metrics.accuracy * 100).toFixed(1)}%
              </div>
            </div>
          )}
          {job.metrics.loss && (
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Loss
              </div>
              <div className="font-medium">{job.metrics.loss.toFixed(4)}</div>
            </div>
          )}
        </div>
      )}

      {/* Parameters */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div>
          <span className="text-gray-500 dark:text-gray-400">
            Learning Rate:
          </span>
          <span className="ml-1 font-medium">
            {job.parameters.learningRate}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Batch Size:</span>
          <span className="ml-1 font-medium">{job.parameters.batchSize}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Epochs:</span>
          <span className="ml-1 font-medium">{job.parameters.epochs}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Dataset:</span>
          <span className="ml-1 font-medium">{job.parameters.dataset}</span>
        </div>
      </div>

      {/* Timing */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <div>Started: {job.startTime.toLocaleString()}</div>
        <div>Duration: {formatDuration(job.startTime, job.endTime)}</div>
      </div>

      {/* Triggered By */}
      {job.triggeredBy && (
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
          <div className="font-medium text-blue-700 dark:text-blue-300">
            Triggered by: {job.triggeredBy.type.replace("_", " ")}
          </div>
          {job.triggeredBy.agentSessionId && (
            <div className="text-blue-600 dark:text-blue-400">
              Session: {job.triggeredBy.agentSessionId}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {enableActions && (
        <div className="mt-4 flex space-x-2">
          {job.status === "running" && (
            <button className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
              Cancel
            </button>
          )}
          {job.status === "failed" && (
            <button className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
              Retry
            </button>
          )}
          <button className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
            View Logs
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            {enableFiltering && (
              <>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={filterModel}
                  onChange={(e) => setFilterModel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">All Models</option>
                  {uniqueModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
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
                  <option value="startTime-desc">Newest First</option>
                  <option value="startTime-asc">Oldest First</option>
                  <option value="progress-desc">Highest Progress</option>
                  <option value="progress-asc">Lowest Progress</option>
                  <option value="modelName-asc">Model A-Z</option>
                  <option value="modelName-desc">Model Z-A</option>
                </select>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredJobs.length} jobs
            </span>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 text-xs ${viewMode === "grid" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1 text-xs ${viewMode === "table" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Metrics
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedJobId === job.id
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                    onClick={() => onJobSelect?.(job)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {job.modelName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {job.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getStatusColor(job.status)}`}
                      >
                        <span className="mr-1">
                          {getStatusIcon(job.status)}
                        </span>
                        {job.status}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              job.status === "completed"
                                ? "bg-green-500"
                                : job.status === "failed"
                                  ? "bg-red-500"
                                  : job.status === "running"
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {job.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {job.metrics && (
                        <div className="space-y-1">
                          {job.metrics.accuracy && (
                            <div>
                              Acc: {(job.metrics.accuracy * 100).toFixed(1)}%
                            </div>
                          )}
                          {job.metrics.loss && (
                            <div>Loss: {job.metrics.loss.toFixed(3)}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDuration(job.startTime, job.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      {enableActions && (
                        <div className="flex space-x-1">
                          {job.status === "running" && (
                            <button className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
                              Cancel
                            </button>
                          )}
                          {job.status === "failed" && (
                            <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                              Retry
                            </button>
                          )}
                          <button className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600">
                            Logs
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredJobs.length === 0 && (
        <div className="glass-card p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">🤖</div>
            <div className="text-lg font-medium mb-1">
              No training jobs found
            </div>
            <div className="text-sm">Try adjusting your filters</div>
          </div>
        </div>
      )}
    </div>
  );
};


