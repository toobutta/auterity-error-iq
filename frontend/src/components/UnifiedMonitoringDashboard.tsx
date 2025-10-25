import React, { useEffect, useState, Suspense, lazy, useCallback } from "react";
import { useWebSocketLogs } from "../hooks/useWebSocketLogs";

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

interface SystemMetrics {
  system: "autmatrix" | "relaycore" | "neuroweaver";
  timestamp: Date;
  usage: {
    requests: number;
    activeUsers: number;
    responseTime: number;
  };
  costs: {
    total: number;
    perRequest: number;
    budget: number;
    budgetUsed: number;
  };
  performance: {
    cpu: number;
    memory: number;
    uptime: number;
    errorRate: number;
  };
  alerts: Alert[];
}

interface Alert {
  id: string;
  system: string;
  type: "error" | "warning" | "info";
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  severity: "low" | "medium" | "high" | "critical";
}

interface AlertSettings {
  emailNotifications: boolean;
  slackNotifications: boolean;
  thresholds: {
    errorRate: number;
    responseTime: number;
    budgetUsage: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

interface UnifiedMonitoringDashboardProps {
  className?: string;
  refreshInterval?: number;
}

export const UnifiedMonitoringDashboard: React.FC<
  UnifiedMonitoringDashboardProps
> = ({
  className = "",
  refreshInterval = 30000, // 30 seconds
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    emailNotifications: true,
    slackNotifications: false,
    thresholds: {
      errorRate: 5,
      responseTime: 2000,
      budgetUsage: 80,
      cpuUsage: 80,
      memoryUsage: 85,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "usage" | "costs" | "performance" | "alerts"
  >("overview");
  const [selectedSystem, setSelectedSystem] = useState<
    "all" | "autmatrix" | "relaycore" | "neuroweaver"
  >("all");
  const [showAlertSettings, setShowAlertSettings] = useState(false);

  // Use WebSocket for real-time updates
  const { isConnected } = useWebSocketLogs();

  // Generate mock data for demonstration
  const generateMockMetrics = useCallback((): SystemMetrics[] => {
    const now = new Date();
    const systems: ("autmatrix" | "relaycore" | "neuroweaver")[] = [
      "autmatrix",
      "relaycore",
      "neuroweaver",
    ];
    const data: SystemMetrics[] = [];

    systems.forEach((system) => {
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Last 24 hours
        data.push({
          system,
          timestamp,
          usage: {
            requests: Math.floor(Math.random() * 1000) + 100,
            activeUsers: Math.floor(Math.random() * 50) + 10,
            responseTime: Math.random() * 2000 + 500,
          },
          costs: {
            total: Math.random() * 100 + 20,
            perRequest: Math.random() * 0.05 + 0.01,
            budget: 1000,
            budgetUsed: Math.random() * 80 + 10,
          },
          performance: {
            cpu: Math.random() * 80 + 10,
            memory: Math.random() * 70 + 20,
            uptime: Math.random() * 100,
            errorRate: Math.random() * 5,
          },
          alerts: [],
        });
      }
    });

    return data;
  }, []);

  // Generate mock alerts
  const generateMockAlerts = useCallback((): Alert[] => {
    const systems = ["AutoMatrix", "RelayCore", "NeuroWeaver"];
    const types: Alert["type"][] = ["error", "warning", "info"];
    const severities: Alert["severity"][] = [
      "low",
      "medium",
      "high",
      "critical",
    ];
    const messages = [
      "High CPU usage detected",
      "Response time threshold exceeded",
      "Budget usage approaching limit",
      "Model deployment completed",
      "Authentication service degraded",
      "Database connection pool exhausted",
    ];

    return Array.from({ length: 10 }, (_, i) => ({
      id: `alert-${i}`,
      system: systems[Math.floor(Math.random() * systems.length)],
      type: types[Math.floor(Math.random() * types.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      acknowledged: Math.random() > 0.7,
      severity: severities[Math.floor(Math.random() * severities.length)],
    }));
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // In a real implementation, these would be actual API calls
      // const autoMatrixMetrics = await fetch('/api/autmatrix/metrics').then(r => r.json());
      // const relayCoreMetrics = await fetch('/api/relaycore/metrics').then(r => r.json());
      // const neuroWeaverMetrics = await fetch('/api/neuroweaver/metrics').then(r => r.json());

      // For now, use mock data
      const mockMetrics = generateMockMetrics();
      const mockAlerts = generateMockAlerts();

      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
    } catch (err) {
      setError("Failed to load monitoring data");

    } finally {
      setLoading(false);
    }
  }, [generateMockMetrics, generateMockAlerts]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  // Filter metrics by selected system
  const filteredMetrics =
    selectedSystem === "all"
      ? metrics
      : metrics.filter((m) => m.system === selectedSystem);

  // Calculate aggregate statistics
  const aggregateStats = {
    totalRequests: filteredMetrics.reduce(
      (sum, m) => sum + m.usage.requests,
      0,
    ),
    totalCosts: filteredMetrics.reduce((sum, m) => sum + m.costs.total, 0),
    avgResponseTime:
      filteredMetrics.length > 0
        ? filteredMetrics.reduce((sum, m) => sum + m.usage.responseTime, 0) /
          filteredMetrics.length
        : 0,
    avgErrorRate:
      filteredMetrics.length > 0
        ? filteredMetrics.reduce((sum, m) => sum + m.performance.errorRate, 0) /
          filteredMetrics.length
        : 0,
    activeAlerts: alerts.filter((a) => !a.acknowledged).length,
    criticalAlerts: alerts.filter(
      (a) => a.severity === "critical" && !a.acknowledged,
    ).length,
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: "📊" },
    { id: "usage" as const, label: "Usage", icon: "📈" },
    { id: "costs" as const, label: "Costs", icon: "💰" },
    { id: "performance" as const, label: "Performance", icon: "⚡" },
    {
      id: "alerts" as const,
      label: "Alerts",
      icon: "🚨",
      badge: aggregateStats.activeAlerts,
    },
  ];

  const systems = [
    { id: "all" as const, label: "All Systems", color: "bg-gray-500" },
    { id: "autmatrix" as const, label: "AutoMatrix", color: "bg-blue-500" },
    { id: "relaycore" as const, label: "RelayCore", color: "bg-green-500" },
    {
      id: "neuroweaver" as const,
      label: "NeuroWeaver",
      color: "bg-purple-500",
    },
  ];

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className="animate-pulse" data-testid="loading-skeleton">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
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
            Error Loading Monitoring Data
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

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      role="region"
      aria-label="Unified Monitoring Dashboard"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Unified Monitoring Dashboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Real-time monitoring across AutoMatrix, RelayCore, and NeuroWeaver
              {!isConnected && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Disconnected
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAlertSettings(!showAlertSettings)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </button>
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
      </div>

      {/* System Filter */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            Filter by system:
          </span>
          <div className="flex space-x-2">
            {systems.map((system) => (
              <button
                key={system.id}
                onClick={() => setSelectedSystem(system.id)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  selectedSystem === system.id
                    ? `${system.color} text-white`
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${system.color}`}
                ></div>
                {system.label}
              </button>
            ))}
          </div>
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
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "overview" && (
          <OverviewTab
            metrics={filteredMetrics}
            stats={aggregateStats}
            alerts={alerts.slice(0, 5)}
          />
        )}
        {activeTab === "usage" && <UsageTab metrics={filteredMetrics} />}
        {activeTab === "costs" && <CostsTab metrics={filteredMetrics} />}
        {activeTab === "performance" && (
          <PerformanceTab metrics={filteredMetrics} />
        )}
        {activeTab === "alerts" && (
          <AlertsTab
            alerts={alerts}
            onAcknowledge={(alertId) => {
              setAlerts((prev) =>
                prev.map((a) =>
                  a.id === alertId ? { ...a, acknowledged: true } : a,
                ),
              );
            }}
          />
        )}
      </div>

      {/* Alert Settings Modal */}
      {showAlertSettings && (
        <AlertSettingsModal
          settings={alertSettings}
          onSave={setAlertSettings}
          onClose={() => setShowAlertSettings(false)}
        />
      )}
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  metrics: SystemMetrics[];
  stats: {
    totalRequests: number;
    totalCosts: number;
    avgResponseTime: number;
    avgErrorRate: number;
    activeAlerts: number;
    criticalAlerts: number;
  };
  alerts: Alert[];
}> = ({ stats, alerts }) => (
  <div className="space-y-6">
    {/* Key Metrics Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="text-sm font-medium text-blue-900">Total Requests</div>
        <div className="text-2xl font-bold text-blue-600">
          {stats.totalRequests.toLocaleString()}
        </div>
        <div className="text-xs text-blue-700 mt-1">Last 24 hours</div>
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <div className="text-sm font-medium text-green-900">Total Costs</div>
        <div className="text-2xl font-bold text-green-600">
          ${stats.totalCosts.toFixed(2)}
        </div>
        <div className="text-xs text-green-700 mt-1">Last 24 hours</div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-4">
        <div className="text-sm font-medium text-yellow-900">
          Avg Response Time
        </div>
        <div className="text-2xl font-bold text-yellow-600">
          {Math.round(stats.avgResponseTime)}ms
        </div>
        <div className="text-xs text-yellow-700 mt-1">Across all systems</div>
      </div>

      <div className="bg-red-50 rounded-lg p-4">
        <div className="text-sm font-medium text-red-900">Active Alerts</div>
        <div className="text-2xl font-bold text-red-600">
          {stats.activeAlerts}
        </div>
        <div className="text-xs text-red-700 mt-1">
          {stats.criticalAlerts} critical
        </div>
      </div>
    </div>

    {/* Recent Alerts */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Alerts</h3>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-2 bg-white rounded border"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  alert.type === "error"
                    ? "bg-red-500"
                    : alert.type === "warning"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                }`}
              ></div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {alert.message}
                </div>
                <div className="text-xs text-gray-500">
                  {alert.system} • {alert.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                alert.severity === "critical"
                  ? "bg-red-100 text-red-800"
                  : alert.severity === "high"
                    ? "bg-orange-100 text-orange-800"
                    : alert.severity === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {alert.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Usage Tab Component
const UsageTab: React.FC<{ metrics: SystemMetrics[] }> = ({ metrics }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Request Volume</h3>
      <Suspense
        fallback={
          <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
        }
      >
        <LineChart
          data={metrics}
          type="usage"
          aria-label="Request volume over time"
        />
      </Suspense>
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Active Users</h3>
      <Suspense
        fallback={
          <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
        }
      >
        <BarChart
          data={metrics.slice(-12)}
          type="usage"
          aria-label="Active users comparison"
        />
      </Suspense>
    </div>
  </div>
);

// Costs Tab Component
const CostsTab: React.FC<{ metrics: SystemMetrics[] }> = ({ metrics }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Cost Trends</h3>
      <Suspense
        fallback={
          <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
        }
      >
        <LineChart
          data={metrics}
          type="costs"
          aria-label="Cost trends over time"
        />
      </Suspense>
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Budget Usage</h3>
      <Suspense
        fallback={
          <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
        }
      >
        <BarChart
          data={metrics.slice(-12)}
          type="costs"
          aria-label="Budget usage comparison"
        />
      </Suspense>
    </div>
  </div>
);

// Performance Tab Component
const PerformanceTab: React.FC<{ metrics: SystemMetrics[] }> = ({
  metrics,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Response Time</h3>
      <Suspense
        fallback={
          <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
        }
      >
        <LineChart
          data={metrics}
          type="performance"
          aria-label="Response time over time"
        />
      </Suspense>
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">
        System Resources
      </h3>
      <Suspense
        fallback={
          <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
        }
      >
        <BarChart
          data={metrics.slice(-12)}
          type="performance"
          aria-label="System resources comparison"
        />
      </Suspense>
    </div>
  </div>
);

// Alerts Tab Component
const AlertsTab: React.FC<{
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
}> = ({ alerts, onAcknowledge }) => (
  <div className="space-y-4">
    {alerts.map((alert) => (
      <div
        key={alert.id}
        className={`p-4 rounded-lg border-l-4 ${
          alert.type === "error"
            ? "bg-red-50 border-red-400"
            : alert.type === "warning"
              ? "bg-yellow-50 border-yellow-400"
              : "bg-blue-50 border-blue-400"
        } ${alert.acknowledged ? "opacity-60" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`text-2xl ${
                alert.type === "error"
                  ? "text-red-500"
                  : alert.type === "warning"
                    ? "text-yellow-500"
                    : "text-blue-500"
              }`}
            >
              {alert.type === "error"
                ? "🚨"
                : alert.type === "warning"
                  ? "⚠️"
                  : "ℹ️"}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {alert.message}
              </div>
              <div className="text-xs text-gray-500">
                {alert.system} • {alert.timestamp.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                alert.severity === "critical"
                  ? "bg-red-100 text-red-800"
                  : alert.severity === "high"
                    ? "bg-orange-100 text-orange-800"
                    : alert.severity === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {alert.severity}
            </span>
            {!alert.acknowledged && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Acknowledge
              </button>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Alert Settings Modal Component
const AlertSettingsModal: React.FC<{
  settings: AlertSettings;
  onSave: (settings: AlertSettings) => void;
  onClose: () => void;
}> = ({ settings, onSave, onClose }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div className="mt-3">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Alert Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  onSave({
                    ...settings,
                    emailNotifications: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">
                Email notifications
              </span>
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.slackNotifications}
                onChange={(e) =>
                  onSave({
                    ...settings,
                    slackNotifications: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">
                Slack notifications
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">
              Alert Thresholds
            </h4>

            <div>
              <label className="block text-xs text-gray-700">
                Error Rate (%)
              </label>
              <input
                type="number"
                value={settings.thresholds.errorRate}
                onChange={(e) =>
                  onSave({
                    ...settings,
                    thresholds: {
                      ...settings.thresholds,
                      errorRate: Number(e.target.value),
                    },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-700">
                Response Time (ms)
              </label>
              <input
                type="number"
                value={settings.thresholds.responseTime}
                onChange={(e) =>
                  onSave({
                    ...settings,
                    thresholds: {
                      ...settings.thresholds,
                      responseTime: Number(e.target.value),
                    },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-700">
                Budget Usage (%)
              </label>
              <input
                type="number"
                value={settings.thresholds.budgetUsage}
                onChange={(e) =>
                  onSave({
                    ...settings,
                    thresholds: {
                      ...settings.thresholds,
                      budgetUsage: Number(e.target.value),
                    },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
);


