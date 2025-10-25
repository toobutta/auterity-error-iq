import React, { useEffect, useState, Suspense, lazy, useCallback } from "react";
import { getWorkflowPerformance, getSystemPerformance } from "../api/workflows";
import { PerformanceMetrics } from "../types/performance";

// Lazy load chart components to reduce initial bundle size
const LineChart = lazy(() =>
  import("./charts/LineChart").then((module) => ({
    default: module.LineChart,
  })),
);
const BarChart = lazy(() =>
  import("./charts/BarChart").then((module) => ({
    default: module.BarChart,
  })),
);

interface PerformanceDashboardProps {
  workflowId?: string;
  showSystemMetrics?: boolean;
  className?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  workflowId,
  showSystemMetrics = false,
  className = "",
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "execution-time" | "success-rate" | "resource-usage"
  >("execution-time");

  // Generate mock data for demonstration
  const generateMockData = useCallback((): PerformanceMetrics[] => {
    const now = new Date();
    const data: PerformanceMetrics[] = [];

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Last 24 hours
      data.push({
        executionTime: Math.random() * 5000 + 1000, // 1-6 seconds
        resourceUsage: {
          cpu: Math.random() * 80 + 10, // 10-90%
          memory: Math.random() * 70 + 20, // 20-90%
        },
        workflowId: workflowId || "system",
        timestamp,
        stepCount: Math.floor(Math.random() * 10) + 3,
        successRate: Math.random() * 0.3 + 0.7, // 70-100%
      });
    }

    return data;
  }, [workflowId]);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      let data: PerformanceMetrics[];
      if (workflowId) {
        data = await getWorkflowPerformance(workflowId);
      } else if (showSystemMetrics) {
        data = await getSystemPerformance();
      } else {
        // Generate mock data for demo purposes
        data = generateMockData();
      }

      setMetrics(data);
    } catch (err) {
      setError("Failed to load performance data");

    } finally {
      setLoading(false);
    }
  }, [workflowId, showSystemMetrics, generateMockData]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const tabs = [
    { id: "execution-time" as const, label: "Execution Time", icon: "⏱️" },
    { id: "success-rate" as const, label: "Success Rate", icon: "✅" },
    { id: "resource-usage" as const, label: "Resource Usage", icon: "💾" },
  ];

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="animate-pulse" data-testid="loading-skeleton">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="text-center py-12">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Performance Data
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchMetrics}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!metrics.length) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Performance Data
          </h3>
          <p className="text-gray-600">
            No performance metrics available yet. Execute some workflows to see
            data here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      role="region"
      aria-label="Workflow Performance Dashboard"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {workflowId ? "Workflow Performance" : "System Performance"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Performance metrics over the last 24 hours
            </p>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg
              className="h-4 w-4 mr-2"
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
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Trend Over Time
            </h3>
            <Suspense
              fallback={
                <div className="h-80 bg-gray-200 rounded animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Loading chart...</span>
                </div>
              }
            >
              <LineChart
                data={metrics}
                type={activeTab}
                aria-label={`${tabs.find((t) => t.id === activeTab)?.label} trend over time`}
              />
            </Suspense>
          </div>

          {/* Bar Chart */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Hourly Comparison
            </h3>
            <Suspense
              fallback={
                <div className="h-80 bg-gray-200 rounded animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Loading chart...</span>
                </div>
              }
            >
              <BarChart
                data={metrics.slice(-12)} // Last 12 hours
                type={activeTab}
                aria-label={`${tabs.find((t) => t.id === activeTab)?.label} hourly comparison`}
              />
            </Suspense>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-900">Average</div>
            <div className="text-2xl font-bold text-blue-600">
              {activeTab === "execution-time"
                ? `${Math.round(metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length)}ms`
                : activeTab === "success-rate"
                  ? `${((metrics.reduce((sum, m) => sum + (m.successRate || 0), 0) / metrics.length) * 100).toFixed(1)}%`
                  : `${(metrics.reduce((sum, m) => sum + m.resourceUsage.cpu, 0) / metrics.length).toFixed(1)}%`}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-900">Best</div>
            <div className="text-2xl font-bold text-green-600">
              {activeTab === "execution-time"
                ? `${Math.min(...metrics.map((m) => m.executionTime))}ms`
                : activeTab === "success-rate"
                  ? `${(Math.max(...metrics.map((m) => m.successRate || 0)) * 100).toFixed(1)}%`
                  : `${Math.min(...metrics.map((m) => m.resourceUsage.cpu)).toFixed(1)}%`}
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-sm font-medium text-red-900">Worst</div>
            <div className="text-2xl font-bold text-red-600">
              {activeTab === "execution-time"
                ? `${Math.max(...metrics.map((m) => m.executionTime))}ms`
                : activeTab === "success-rate"
                  ? `${(Math.min(...metrics.map((m) => m.successRate || 0)) * 100).toFixed(1)}%`
                  : `${Math.max(...metrics.map((m) => m.resourceUsage.cpu)).toFixed(1)}%`}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-900">Data Points</div>
            <div className="text-2xl font-bold text-gray-600">
              {metrics.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


