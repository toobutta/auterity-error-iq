import React from "react";
import { cn, formatNumber } from "../lib/utils";

interface KPIMetric {
  label: string;
  value: number;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
    period: string;
  };
  severity?: "critical" | "high" | "medium" | "low";
  loading?: boolean;
  target?: number;
}

interface KPIHeaderProps {
  metrics: KPIMetric[];
  lastUpdated?: Date;
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const TrendIcon: React.FC<{ trend: "up" | "down" | "neutral" }> = ({
  trend,
}) => {
  const baseClasses = "w-4 h-4";

  switch (trend) {
    case "up":
      return (
        <svg
          className={`${baseClasses} text-red-600`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "down":
      return (
        <svg
          className={`${baseClasses} text-green-600`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return (
        <svg
          className={`${baseClasses} text-neutral-400`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
};

const MetricSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg p-6 border border-neutral-200">
    <div className="animate-pulse">
      <div className="h-4 bg-neutral-200 rounded w-24 mb-2"></div>
      <div className="h-8 bg-neutral-200 rounded w-16 mb-2"></div>
      <div className="h-3 bg-neutral-200 rounded w-20"></div>
    </div>
  </div>
);

const MetricCard: React.FC<{ metric: KPIMetric }> = ({ metric }) => {
  if (metric.loading) {
    return <MetricSkeleton />;
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical":
        return "border-l-red-500";
      case "high":
        return "border-l-orange-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-neutral-200";
    }
  };

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-red-600";
      case "down":
        return "text-green-600";
      default:
        return "text-neutral-600";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg p-6 border border-neutral-200 border-l-4 ${getSeverityColor(metric.severity)} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-1">
            {metric.label}
          </p>
          <p className="text-3xl font-bold text-neutral-900 mb-1">
            {formatNumber(metric.value)}
          </p>
          {metric.change && (
            <div
              className={`flex items-center text-sm ${getTrendColor(metric.change.trend)} mt-2`}
            >
              <TrendIcon trend={metric.change.trend} />
              <span className="ml-1">
                {Math.abs(metric.change.value)}% {metric.change.period}
              </span>
            </div>
          )}
        </div>
        {metric.severity && (
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              metric.severity === "critical"
                ? "bg-red-100 text-red-800"
                : metric.severity === "high"
                  ? "bg-orange-100 text-orange-800"
                  : metric.severity === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
            }`}
          >
            {metric.severity}
          </div>
        )}
      </div>
    </div>
  );
};

export const KPIHeader: React.FC<KPIHeaderProps> = ({
  metrics,
  lastUpdated,
  refreshing,
  onRefresh,
}) => {
  return (
    <div className="mb-8">
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Error Monitoring Dashboard
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Real-time error tracking and system health overview
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-neutral-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-neutral-300 shadow-sm text-sm leading-4 font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
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
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>
    </div>
  );
};


