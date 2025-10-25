import React, { useState } from "react";
import { Issue } from "./IssueList";
import { formatRelativeTime } from "../lib/utils";

interface IssueEvent {
  id: string;
  type: "occurrence" | "status_change" | "assignment" | "comment";
  timestamp: Date;
  description: string;
  user?: string;
  data?: Record<string, unknown>;
}

interface StackFrame {
  filename: string;
  function: string;
  lineno: number;
  colno?: number;
  context?: string[];
  pre_context?: string[];
  post_context?: string[];
}

interface IssueDetailProps {
  issue: Issue;
  events: IssueEvent[];
  stackTrace?: StackFrame[];
  onStatusChange?: (status: Issue["status"]) => void;
  onAssign?: (assignee: string) => void;
  onClose?: () => void;
}

const StatusSelector: React.FC<{
  current: Issue["status"];
  onChange: (status: Issue["status"]) => void;
}> = ({ current, onChange }) => {
  const statuses: { value: Issue["status"]; label: string; color: string }[] = [
    { value: "open", label: "Open", color: "bg-red-100 text-red-800" },
    {
      value: "investigating",
      label: "Investigating",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "resolved",
      label: "Resolved",
      color: "bg-green-100 text-green-800",
    },
    { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
  ];

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value as Issue["status"])}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
    >
      {statuses.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  );
};

const EventTimeline: React.FC<{ events: IssueEvent[] }> = ({ events }) => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      event.type === "occurrence"
                        ? "bg-red-500"
                        : event.type === "status_change"
                          ? "bg-blue-500"
                          : event.type === "assignment"
                            ? "bg-green-500"
                            : "bg-gray-500"
                    }`}
                  >
                    {event.type === "occurrence" && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {event.type === "status_change" && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {event.type === "assignment" && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    )}
                    {event.type === "comment" && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-900">{event.description}</p>
                    {event.user && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        by {event.user}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                    {formatRelativeTime(event.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const StackTraceView: React.FC<{ stackTrace: StackFrame[] }> = ({
  stackTrace,
}) => {
  const [expandedFrame, setExpandedFrame] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {stackTrace.map((frame, index) => (
        <div key={index} className="border border-gray-200 rounded-md">
          <button
            onClick={() =>
              setExpandedFrame(expandedFrame === index ? null : index)
            }
            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm">
                <span className="text-gray-600">{frame.filename}:</span>
                <span className="text-gray-900 font-medium">
                  {frame.function}
                </span>
                <span className="text-gray-500"> line {frame.lineno}</span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transform transition-transform ${
                  expandedFrame === index ? "rotate-180" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </button>

          {expandedFrame === index && frame.context && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="bg-gray-50 rounded-md p-3 mt-3">
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                  {frame.pre_context?.map((line, i) => (
                    <div key={`pre-${i}`} className="text-gray-500">
                      {frame.lineno - frame.pre_context!.length + i}: {line}
                    </div>
                  ))}
                  <div className="bg-red-100 text-red-800 px-1 rounded">
                    {frame.lineno}: {frame.context[0]}
                  </div>
                  {frame.post_context?.map((line, i) => (
                    <div key={`post-${i}`} className="text-gray-500">
                      {frame.lineno + i + 1}: {line}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const IssueDetail: React.FC<IssueDetailProps> = ({
  issue,
  events,
  stackTrace,
  onStatusChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "stacktrace"
  >("overview");

  return (
    <div className="bg-white shadow-lg rounded-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {issue.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Issue #{issue.id}</span>
              <span>•</span>
              <span>{issue.service}</span>
              <span>•</span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
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

          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
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
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {(["overview", "timeline", "stacktrace"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Impact */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Impact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {issue.affectedUsers.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Affected Users</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {issue.occurrenceCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Occurrences</div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {issue.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {issue.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                {onStatusChange ? (
                  <StatusSelector
                    current={issue.status}
                    onChange={onStatusChange}
                  />
                ) : (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      issue.status === "open"
                        ? "bg-red-100 text-red-800"
                        : issue.status === "investigating"
                          ? "bg-blue-100 text-blue-800"
                          : issue.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {issue.status}
                  </span>
                )}
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignee
                </label>
                {issue.assignee ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {issue.assignee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-900">
                      {issue.assignee.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Unassigned</span>
                )}
              </div>

              {/* Timestamps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeline
                </label>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>First seen: {formatRelativeTime(issue.timestamp)}</div>
                  <div>
                    Last seen: {formatRelativeTime(issue.lastOccurrence)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Event Timeline
            </h3>
            <EventTimeline events={events} />
          </div>
        )}

        {activeTab === "stacktrace" && stackTrace && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Stack Trace
            </h3>
            <StackTraceView stackTrace={stackTrace} />
          </div>
        )}
      </div>
    </div>
  );
};


