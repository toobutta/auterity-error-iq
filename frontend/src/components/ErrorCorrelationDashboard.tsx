import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Activity,
  RefreshCw,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ErrorCorrelation {
  id: string;
  pattern: string;
  root_cause: string;
  affected_systems: string[];
  confidence: number;
  error_count: number;
  created_at: string;
  resolved_at?: string;
}

interface CorrelationAlert {
  correlation_id: string;
  pattern: string;
  root_cause: string;
  affected_systems: string[];
  confidence: number;
  error_count: number;
  timestamp: string;
}

interface CorrelationStatus {
  total_correlations: number;
  pattern_distribution: Record<string, number>;
  affected_systems: Record<string, number>;
  recent_alerts: CorrelationAlert[];
  active_correlations: number;
  recovery_actions_executed: number;
}

interface RecoveryAction {
  id: string;
  name: string;
  description: string;
  applicable_patterns: string[];
  applicable_categories: string[];
  action_type: string;
  retry_count: number;
  retry_delay: number;
  timeout: number;
}

const ErrorCorrelationDashboard: React.FC = () => {
  const [status, setStatus] = useState<CorrelationStatus | null>(null);
  const [correlations, setCorrelations] = useState<ErrorCorrelation[]>([]);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string>("all");
  const [selectedSystem, setSelectedSystem] = useState<string>("all");

  useEffect(() => {
    fetchCorrelationData();
    const interval = setInterval(fetchCorrelationData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCorrelationData = async () => {
    try {
      setLoading(true);

      // Fetch correlation status
      const statusResponse = await fetch("/api/v1/error-correlation/status");
      if (!statusResponse.ok) throw new Error("Failed to fetch status");
      const statusData = await statusResponse.json();
      setStatus(statusData);

      // Fetch recent correlations
      const correlationsResponse = await fetch(
        "/api/v1/error-correlation/correlations?limit=20",
      );
      if (!correlationsResponse.ok)
        throw new Error("Failed to fetch correlations");
      const correlationsData = await correlationsResponse.json();
      setCorrelations(correlationsData.correlations);

      // Fetch recovery actions
      const actionsResponse = await fetch(
        "/api/v1/error-correlation/recovery-actions",
      );
      if (!actionsResponse.ok)
        throw new Error("Failed to fetch recovery actions");
      const actionsData = await actionsResponse.json();
      setRecoveryActions(actionsData.recovery_actions);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const triggerManualRecovery = async (
    correlationId: string,
    actionId: string,
  ) => {
    try {
      const response = await fetch(
        `/api/v1/error-correlation/manual-recovery/${correlationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recovery_action: actionId }),
        },
      );

      if (!response.ok) throw new Error("Failed to trigger recovery");

      // Refresh data after triggering recovery
      await fetchCorrelationData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recovery trigger failed");
    }
  };

  const getPatternColor = (pattern: string): string => {
    const colors: Record<string, string> = {
      cascading_failure: "bg-red-100 text-red-800",
      common_root_cause: "bg-orange-100 text-orange-800",
      dependency_failure: "bg-yellow-100 text-yellow-800",
      resource_exhaustion: "bg-purple-100 text-purple-800",
      authentication_propagation: "bg-blue-100 text-blue-800",
      network_partition: "bg-green-100 text-green-800",
    };
    return colors[pattern] || "bg-gray-100 text-gray-800";
  };

  const getSystemColor = (system: string): string => {
    const colors: Record<string, string> = {
      autmatrix: "bg-blue-500",
      relaycore: "bg-green-500",
      neuroweaver: "bg-purple-500",
    };
    return colors[system] || "bg-gray-500";
  };

  const formatPattern = (pattern: string): string => {
    return pattern
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading correlation data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">Error: {error}</span>
        </div>
        <button
          onClick={fetchCorrelationData}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Error Correlation Dashboard
          </h1>
          <p className="text-gray-600">
            Cross-system error analysis and automated recovery
          </p>
        </div>
        <button
          onClick={fetchCorrelationData}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Status Overview */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Correlations
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {status.total_correlations}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Correlations
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {status.active_correlations}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Recovery Actions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {status.recovery_actions_executed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Affected Systems
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(status.affected_systems).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Distribution */}
      {status && Object.keys(status.pattern_distribution).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Error Pattern Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(status.pattern_distribution).map(
              ([pattern, count]) => (
                <div
                  key={pattern}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getPatternColor(pattern)}`}
                  >
                    {formatPattern(pattern)}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {count}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      {status && status.recent_alerts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Alerts
          </h2>
          <div className="space-y-3">
            {status.recent_alerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPatternColor(alert.pattern)}`}
                    >
                      {formatPattern(alert.pattern)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Confidence: {(alert.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">
                    {alert.root_cause}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {alert.affected_systems.map((system) => (
                      <span
                        key={system}
                        className={`w-3 h-3 rounded-full ${getSystemColor(system)}`}
                        title={system}
                      />
                    ))}
                    <span className="text-xs text-gray-500">
                      {alert.affected_systems.join(", ")}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {formatTimestamp(alert.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correlations List */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Correlations
          </h2>
          <div className="flex space-x-2">
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Patterns</option>
              {status &&
                Object.keys(status.pattern_distribution).map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {formatPattern(pattern)}
                  </option>
                ))}
            </select>
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Systems</option>
              {status &&
                Object.keys(status.affected_systems).map((system) => (
                  <option key={system} value={system}>
                    {system}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {correlations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No correlations found</p>
            </div>
          ) : (
            correlations.map((correlation) => (
              <div
                key={correlation.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPatternColor(correlation.pattern)}`}
                      >
                        {formatPattern(correlation.pattern)}
                      </span>
                      <span className="text-sm text-gray-600">
                        Confidence: {(correlation.confidence * 100).toFixed(0)}%
                      </span>
                      {correlation.resolved_at ? (
                        <CheckCircle
                          className="w-4 h-4 text-green-500"
                          title="Resolved"
                        />
                      ) : (
                        <AlertTriangle
                          className="w-4 h-4 text-orange-500"
                          title="Active"
                        />
                      )}
                    </div>

                    <p className="text-gray-900 mb-2">
                      {correlation.root_cause}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <span>Systems:</span>
                        {correlation.affected_systems.map((system) => (
                          <span
                            key={system}
                            className={`w-3 h-3 rounded-full ${getSystemColor(system)}`}
                            title={system}
                          />
                        ))}
                      </div>
                      <span>Errors: {correlation.error_count}</span>
                      <span>
                        Created: {formatTimestamp(correlation.created_at)}
                      </span>
                    </div>
                  </div>

                  {!correlation.resolved_at && (
                    <div className="ml-4">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            triggerManualRecovery(
                              correlation.id,
                              e.target.value,
                            );
                            e.target.value = "";
                          }
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                        defaultValue=""
                      >
                        <option value="">Recovery Actions</option>
                        {recoveryActions
                          .filter((action) =>
                            action.applicable_patterns.includes(
                              correlation.pattern,
                            ),
                          )
                          .map((action) => (
                            <option key={action.id} value={action.id}>
                              {action.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recovery Actions */}
      {recoveryActions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Recovery Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recoveryActions.map((action) => (
              <div
                key={action.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h3 className="font-medium text-gray-900">{action.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {action.description}
                </p>
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <div>Type: {action.action_type}</div>
                  <div>Retry Count: {action.retry_count}</div>
                  <div>Timeout: {action.timeout}s</div>
                  <div>
                    Patterns:{" "}
                    {action.applicable_patterns.map(formatPattern).join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorCorrelationDashboard;


