import React, { useState, useMemo } from "react";
import { formatRelativeTime, getSeverityStyles } from "../lib/utils";

export interface Issue {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved" | "closed";
  timestamp: Date;
  affectedUsers: number;
  service: string;
  environment: "production" | "staging" | "development";
  assignee?: {
    name: string;
    avatar?: string;
  };
  tags: string[];
  lastOccurrence: Date;
  occurrenceCount: number;
}

interface IssueFilters {
  severity: string[];
  status: string[];
  service: string[];
  environment: string[];
  search: string;
}

interface IssueListProps {
  issues: Issue[];
  loading?: boolean;
  onIssueClick?: (issue: Issue) => void;
  onFilterChange?: (filters: IssueFilters) => void;
  showFilters?: boolean;
}

const SeverityBadge: React.FC<{ severity: Issue["severity"] }> = ({
  severity,
}) => {
  const severityConfig = {
    critical: {
      label: "Critical",
      bg: "bg-red-100",
      text: "text-red-800",
      dot: "bg-red-500",
    },
    high: {
      label: "High",
      bg: "bg-orange-100",
      text: "text-orange-800",
      dot: "bg-orange-500",
    },
    medium: {
      label: "Medium",
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      dot: "bg-yellow-500",
    },
    low: {
      label: "Low",
      bg: "bg-green-100",
      text: "text-green-800",
      dot: "bg-green-500",
    },
  };

  const config = severityConfig[severity];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`}></span>
      {config.label}
    </span>
  );
};

const StatusBadge: React.FC<{ status: Issue["status"] }> = ({ status }) => {
  const statusConfig = {
    open: { label: "Open", bg: "bg-red-100", text: "text-red-800" },
    investigating: {
      label: "Investigating",
      bg: "bg-blue-100",
      text: "text-blue-800",
    },
    resolved: { label: "Resolved", bg: "bg-green-100", text: "text-green-800" },
    closed: { label: "Closed", bg: "bg-gray-100", text: "text-gray-800" },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

const IssueRow: React.FC<{ issue: Issue; onClick?: () => void }> = ({
  issue,
  onClick,
}) => {
  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer border-b border-gray-200"
      onClick={onClick}
    >
      <td className="px-6 py-4">
        <div className="flex items-start space-x-3">
          <SeverityBadge severity={issue.severity} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {issue.title}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">{issue.service}</span>
              <span className="text-xs text-gray-300">•</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  issue.environment === "production"
                    ? "bg-red-100 text-red-700"
                    : issue.environment === "staging"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                }`}
              >
                {issue.environment}
              </span>
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <StatusBadge status={issue.status} />
      </td>

      <td className="px-6 py-4 text-sm text-gray-900">
        {issue.affectedUsers.toLocaleString()} users
      </td>

      <td className="px-6 py-4 text-sm text-gray-500">
        <div>
          <div>{formatRelativeTime(issue.lastOccurrence)}</div>
          <div className="text-xs text-gray-400">
            {issue.occurrenceCount} occurrences
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        {issue.assignee ? (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {issue.assignee.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-900">{issue.assignee.name}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Unassigned</span>
        )}
      </td>
    </tr>
  );
};

const FilterBar: React.FC<{
  filters: IssueFilters;
  onFilterChange: (filters: IssueFilters) => void;
  issueCount: number;
}> = ({ filters, onFilterChange, issueCount }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <input
              type="text"
              placeholder="Search issues..."
              value={filters.search}
              onChange={(e) =>
                onFilterChange({ ...filters, search: e.target.value })
              }
              className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <select
            value={filters.severity[0] || ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                severity: e.target.value ? [e.target.value] : [],
              })
            }
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.status[0] || ""}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value ? [e.target.value] : [],
              })
            }
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">{issueCount} issues</div>
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    {[...Array(5)].map((_, i) => (
      <tr key={i} className="border-b border-gray-200">
        <td className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
        </td>
        <td className="px-6 py-4">
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </td>
        <td className="px-6 py-4">
          <div className="space-y-1">
            <div className="h-3 w-12 bg-gray-200 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        </td>
      </tr>
    ))}
  </div>
);

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  loading = false,
  onIssueClick,
  onFilterChange,
  showFilters = true,
}) => {
  const [filters, setFilters] = useState<IssueFilters>({
    severity: [],
    status: [],
    service: [],
    environment: [],
    search: "",
  });

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Search filter
      if (
        filters.search &&
        !issue.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Severity filter
      if (
        filters.severity.length > 0 &&
        !filters.severity.includes(issue.severity)
      ) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(issue.status)) {
        return false;
      }

      return true;
    });
  }, [issues, filters]);

  const handleFilterChange = (newFilters: IssueFilters) => {
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {showFilters && (
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          issueCount={filteredIssues.length}
        />
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Seen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignee
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <LoadingSkeleton />
            ) : filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <IssueRow
                  key={issue.id}
                  issue={issue}
                  onClick={() => onIssueClick?.(issue)}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-4"
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
                    <p className="text-lg font-medium">No issues found</p>
                    <p className="text-sm">
                      Try adjusting your filters or check back later.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


