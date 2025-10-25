import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { MetricCard } from "../components/MetricCard";
import { getDashboardMetrics, DashboardMetrics } from "../api/workflows";
import CrossFilterAnalyticsDashboard from "../components/CrossFilterAnalyticsDashboard";
import "../components/CrossFilterAnalyticsDashboard.css";

const PerformanceDashboard = lazy(() =>
  import("../components/PerformanceDashboard").then((module) => ({
    default: module.PerformanceDashboard,
  })),
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      const data = await getDashboardMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load dashboard metrics";
      setError(errorMessage);

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const formatPercentage = useCallback(
    (value: number) => `${(value * 100).toFixed(1)}%`,
    [],
  );

  const formatTime = useCallback((ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }, []);

  const handleNavigateToWorkflows = useCallback(() => {
    navigate("/workflows");
  }, [navigate]);

  const handleNavigateToTemplates = useCallback(() => {
    navigate("/templates");
  }, [navigate]);

  const handleNavigateToAnalytics = useCallback(() => {
    navigate("/analytics");
  }, [navigate]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-automotive-primary to-automotive-secondary bg-clip-text text-transparent">
                AutoMatrix Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitor your automotive workflow automation performance
              </p>
            </div>
            <div className="text-right">
              <button
                onClick={fetchMetrics}
                disabled={loading}
                className="glass-button glass-button-primary disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg
                      className="-ml-1 mr-2 h-4 w-4"
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
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="glass-card border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading dashboard
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Workflows"
            value={metrics?.totalWorkflows ?? 0}
            subtitle="Active workflows"
            icon="⚙️"
            variant="workflow"
            loading={loading}
          />
          <MetricCard
            title="Success Rate"
            value={metrics ? formatPercentage(metrics.successRate) : "0%"}
            subtitle="Last 30 days"
            trend={
              metrics && metrics.successRate > 0.85
                ? "up"
                : metrics && metrics.successRate < 0.7
                  ? "down"
                  : "neutral"
            }
            trendValue={
              metrics ? `${metrics.totalExecutions} executions` : "0 executions"
            }
            icon="✅"
            variant="performance"
            loading={loading}
          />
          <MetricCard
            title="Avg Execution Time"
            value={metrics ? formatTime(metrics.averageExecutionTime) : "0ms"}
            subtitle="Per workflow"
            icon="⏱️"
            variant="performance"
            loading={loading}
          />
          <MetricCard
            title="Active Now"
            value={metrics?.activeExecutions ?? 0}
            subtitle="Running workflows"
            icon="🔄"
            variant="workflow"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Today's Executions"
            value={metrics?.executionsToday ?? 0}
            subtitle="Workflows executed today"
            icon="📊"
            variant="customer"
            loading={loading}
          />
          <MetricCard
            title="This Week"
            value={metrics?.executionsThisWeek ?? 0}
            subtitle="Weekly execution count"
            icon="📈"
            variant="customer"
            loading={loading}
          />
          <MetricCard
            title="Failed Executions"
            value={metrics?.failedExecutions ?? 0}
            subtitle="Requiring attention"
            trend={metrics && metrics.failedExecutions > 0 ? "down" : "neutral"}
            icon="❌"
            variant="service"
            loading={loading}
          />
        </div>

        <div className="glass-card p-6">
          <CrossFilterAnalyticsDashboard
            enableRealTime={true}
            initialTimeRange="24h"
          />
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-xl mr-2">⚡</span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleNavigateToWorkflows}
              className="glass-button flex items-center p-4 hover:scale-105 transition-all duration-200 text-left"
            >
              <div className="text-2xl mr-3">⚙️</div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Create Workflow
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Build a new AI workflow
                </p>
              </div>
            </button>
            <button
              onClick={handleNavigateToTemplates}
              className="glass-button flex items-center p-4 hover:scale-105 transition-all duration-200 text-left"
            >
              <div className="text-2xl mr-3">📋</div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Browse Templates
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use automotive templates
                </p>
              </div>
            </button>
            <button
              onClick={handleNavigateToAnalytics}
              className="glass-button flex items-center p-4 hover:scale-105 transition-all duration-200 text-left"
            >
              <div className="text-2xl mr-3">📊</div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  View Analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Performance insights
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;


