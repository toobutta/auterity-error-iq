import React, { useState, useEffect, useCallback } from "react";
import {
  getExecutionHistory,
  ExecutionHistoryParams,
  ExecutionHistoryResponse,
} from "../api/workflows";
import { WorkflowExecution } from "../types/workflow";
import { sanitizeInput } from "../utils/sanitizer";

// Interface for API error responses
interface ApiErrorResponse {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

interface WorkflowExecutionHistoryProps {
  onExecutionSelect?: (execution: WorkflowExecution) => void;
  refreshTrigger?: number; // Can be used to trigger refresh from parent
}

const WorkflowExecutionHistory: React.FC<WorkflowExecutionHistoryProps> = ({
  onExecutionSelect,
  refreshTrigger,
}) => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Filter and pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<
    "started_at" | "completed_at" | "duration" | "status"
  >("started_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: ExecutionHistoryParams = {
        page: currentPage,
        pageSize,
        sortBy,
        sortOrder,
      };

      if (statusFilter)
        params.status = sanitizeInput(statusFilter) as
          | "pending"
          | "running"
          | "completed"
          | "failed"
          | "cancelled";
      if (searchQuery.trim()) params.search = sanitizeInput(searchQuery.trim());
      if (startDate) params.startDate = sanitizeInput(startDate);
      if (endDate) params.endDate = sanitizeInput(endDate);

      const response: ExecutionHistoryResponse =
        await getExecutionHistory(params);

      setExecutions(response.executions);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err: unknown) {
      const apiError = err as ApiErrorResponse;
      const errorMessage =
        apiError?.response?.data?.detail ||
        (err instanceof Error
          ? err.message
          : "Failed to load execution history");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    statusFilter,
    searchQuery,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions, refreshTrigger]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchExecutions();
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    if (!completedAt) return "-";

    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const duration = end - start;

    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    if (duration < 3600000) return `${(duration / 60000).toFixed(1)}m`;
    return `${(duration / 3600000).toFixed(1)}h`;
  };

  const getStatusBadge = (status: WorkflowExecution["status"]) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";

    switch (status) {
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "running":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "completed":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "failed":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortOrder === "asc" ? (
      <span className="text-blue-600">↑</span>
    ) : (
      <span className="text-blue-600">↓</span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Execution History
        </h2>

        {/* Filters */}
        <div className="space-y-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-wrap gap-4 items-end"
          >
            <div className="flex-1 min-w-64">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search workflows
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
                placeholder="Search by workflow name or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(sanitizeInput(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(sanitizeInput(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(sanitizeInput(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("");
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading executions...</span>
        </div>
      ) : (
        <>
          {/* Results summary */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {executions.length} of {total} executions
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workflow Name
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("started_at")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Started At</span>
                      {getSortIcon("started_at")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("completed_at")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Completed At</span>
                      {getSortIcon("completed_at")}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("duration")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Duration</span>
                      {getSortIcon("duration")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {executions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No executions found
                    </td>
                  </tr>
                ) : (
                  executions.map((execution) => (
                    <tr key={execution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {execution.workflowName || "Unknown Workflow"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {execution.id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(execution.status)}>
                          {execution.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(execution.startedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {execution.completedAt
                          ? formatDate(execution.completedAt)
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(
                          execution.startedAt,
                          execution.completedAt,
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => onExecutionSelect?.(execution)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View Details
                        </button>
                        {execution.status === "failed" &&
                          execution.errorMessage && (
                            <span
                              className="text-red-600"
                              title={execution.errorMessage}
                            >
                              Error
                            </span>
                          )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label htmlFor="pageSize" className="text-sm text-gray-700">
                  Show:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkflowExecutionHistory;


