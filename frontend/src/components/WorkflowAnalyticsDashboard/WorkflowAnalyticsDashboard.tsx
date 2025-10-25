import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import websocketService from "../../services/websocket";

// Simple loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
);

export interface WorkflowAnalyticsDashboardProps {
  className?: string;
  timePeriodDays?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface AnalyticsData {
  tenant_id: string;
  tenant_name: string;
  report_period: string;
  generated_at: string;
  executive_summary: string;
  key_metrics: {
    usage: {
      total_requests: number;
      successful_requests: number;
      success_rate: number;
      total_cost: number;
      avg_cost_per_request: number;
    };
    billing: {
      total_billed: number;
      billing_records_count: number;
    };
    users: {
      active_users: number;
      total_users: number;
      user_engagement_rate: number;
    };
    workflows: {
      total_executions: number;
      successful_executions: number;
      success_rate: number;
      avg_execution_time_ms: number;
    };
  };
  trends: Array<{
    metric: string;
    trend: string;
    slope: number;
    confidence: number;
    period_days: number;
    data_points: Array<{ timestamp: string; value: number }>;
  }>;
  predictions: Array<{
    metric: string;
    predicted_value: number;
    confidence_interval: [number, number];
    confidence_level: number;
    model_used: string;
    forecast_horizon: number;
    forecast_period: string;
    historical_data_points: number;
  }>;
  roi_analysis?: {
    total_investment: number;
    total_return: number;
    roi_percentage: number;
    payback_period_days: number;
    break_even_date: string;
    cost_savings: number;
    productivity_gains: number;
    revenue_increase: number;
  };
  recommendations: string[];
  alerts: string[];
}

export const WorkflowAnalyticsDashboard: React.FC<WorkflowAnalyticsDashboardProps> = ({
  className,
  timePeriodDays = 30,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/dashboard?time_period_days=${timePeriodDays}&include_predictions=true`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();

    if (autoRefresh) {
      const interval = setInterval(fetchAnalyticsData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [timePeriodDays, autoRefresh, refreshInterval]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading && !analyticsData) {
    return (
      <div className={cn("w-full flex items-center justify-center p-8", className)}>
        <LoadingSpinner />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("w-full p-4 border border-red-200 rounded-lg bg-red-50", className)}>
        <div className="text-red-800 font-medium">Error loading analytics</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={fetchAnalyticsData}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={cn("w-full p-4 border border-gray-200 rounded-lg bg-gray-50", className)}>
        <div className="text-gray-600">No analytics data available</div>
      </div>
    );
  }

  const { key_metrics, trends, predictions, roi_analysis, recommendations, alerts } = analyticsData;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workflow Analytics Dashboard</h2>
          <p className="text-gray-600">
            {analyticsData.tenant_name} • {analyticsData.report_period}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated?.toLocaleTimeString()}
          </div>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          )}>
            {isConnected ? "🟢 Live" : "🔴 Offline"}
          </div>
          <button
            onClick={fetchAnalyticsData}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Executive Summary</h3>
        <p className="text-blue-800">{analyticsData.executive_summary}</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usage Metrics */}
        <div className="bg-white p-4 border rounded-lg shadow">
          <h4 className="font-medium text-gray-900 mb-2">Total Requests</h4>
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(key_metrics.usage.total_requests)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Success Rate: {formatPercentage(key_metrics.usage.success_rate)}
          </div>
        </div>

        <div className="bg-white p-4 border rounded-lg shadow">
          <h4 className="font-medium text-gray-900 mb-2">Total Cost</h4>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(key_metrics.usage.total_cost)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Avg: {formatCurrency(key_metrics.usage.avg_cost_per_request)}
          </div>
        </div>

        {/* User Metrics */}
        <div className="bg-white p-4 border rounded-lg shadow">
          <h4 className="font-medium text-gray-900 mb-2">Active Users</h4>
          <div className="text-2xl font-bold text-purple-600">
            {formatNumber(key_metrics.users.active_users)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Engagement: {formatPercentage(key_metrics.users.user_engagement_rate)}
          </div>
        </div>

        {/* Workflow Metrics */}
        <div className="bg-white p-4 border rounded-lg shadow">
          <h4 className="font-medium text-gray-900 mb-2">Workflow Success</h4>
          <div className="text-2xl font-bold text-orange-600">
            {formatPercentage(key_metrics.workflows.success_rate)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {formatNumber(key_metrics.workflows.total_executions)} executions
          </div>
        </div>
      </div>

      {/* Trends and Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends */}
        <div className="bg-white p-4 border rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4">Key Trends</h3>
          <div className="space-y-3">
            {trends.slice(0, 3).map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getTrendIcon(trend.trend)}</span>
                  <span className="font-medium capitalize">{trend.metric.replace('_', ' ')}</span>
                </div>
                <span className={cn("font-medium", getTrendColor(trend.trend))}>
                  {trend.trend}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Predictions */}
        <div className="bg-white p-4 border rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4">Predictions (30 Days)</h3>
          <div className="space-y-3">
            {predictions.slice(0, 3).map((prediction, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium capitalize">
                    {prediction.metric.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatPercentage(prediction.confidence_level * 100)} confidence
                  </span>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {prediction.metric.includes('cost')
                    ? formatCurrency(prediction.predicted_value)
                    : formatNumber(Math.round(prediction.predicted_value))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROI Analysis */}
      {roi_analysis && (
        <div className="bg-white p-4 border rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4">ROI Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(roi_analysis.roi_percentage)}
              </div>
              <div className="text-sm text-gray-600">ROI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {roi_analysis.payback_period_days}
              </div>
              <div className="text-sm text-gray-600">Days to Break-even</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(roi_analysis.productivity_gains)}
              </div>
              <div className="text-sm text-gray-600">Productivity Gains</div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations */}
        <div className="bg-white p-4 border rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">💡</span>
                <span className="text-sm text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Alerts */}
        <div className="bg-white p-4 border rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-4">Alerts</h3>
          <ul className="space-y-2">
            {alerts.map((alert, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-red-500 mt-1">⚠️</span>
                <span className="text-sm text-gray-700">{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkflowAnalyticsDashboard;


