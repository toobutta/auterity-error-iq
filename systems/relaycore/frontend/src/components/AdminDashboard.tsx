import React, { useState, useEffect } from "react";
import {
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Zap,
  Server,
} from "lucide-react";

interface SystemMetrics {
  totalRequests: number;
  activeProviders: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

interface ProviderStatus {
  name: string;
  status: "operational" | "degraded" | "offline";
  requestsPerMinute: number;
  averageCost: number;
  errorRate: number;
}

interface BudgetInfo {
  total: number;
  used: number;
  remaining: number;
  period: string;
}

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalRequests: 0,
    activeProviders: 0,
    totalCost: 0,
    averageResponseTime: 0,
    errorRate: 0,
    uptime: 0,
  });

  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [budget, setBudget] = useState<BudgetInfo>({
    total: 0,
    used: 0,
    remaining: 0,
    period: "monthly",
  });

  const [alerts] = useState([
    {
      id: 1,
      type: "warning",
      message: "OpenAI usage approaching budget limit",
      timestamp: "2 minutes ago",
    },
    {
      id: 2,
      type: "error",
      message: "Anthropic API temporarily unavailable",
      timestamp: "5 minutes ago",
    },
    {
      id: 3,
      type: "info",
      message: "New model version deployed",
      timestamp: "1 hour ago",
    },
  ]);

  useEffect(() => {
    // Mock data - replace with real API calls
    setMetrics({
      totalRequests: 15420,
      activeProviders: 3,
      totalCost: 247.5,
      averageResponseTime: 234,
      errorRate: 0.023,
      uptime: 99.97,
    });

    setProviders([
      {
        name: "OpenAI",
        status: "operational",
        requestsPerMinute: 45,
        averageCost: 0.0023,
        errorRate: 0.01,
      },
      {
        name: "Anthropic",
        status: "degraded",
        requestsPerMinute: 28,
        averageCost: 0.0031,
        errorRate: 0.05,
      },
      {
        name: "NeuroWeaver",
        status: "operational",
        requestsPerMinute: 12,
        averageCost: 0.0018,
        errorRate: 0.02,
      },
    ]);

    setBudget({
      total: 500,
      used: 247.5,
      remaining: 252.5,
      period: "monthly",
    });
  }, []);

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = "blue",
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && <p className="text-sm text-green-600 mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-full bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const ProviderStatusCard = ({ provider }: { provider: ProviderStatus }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{provider.name}</h3>
        <div
          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            provider.status === "operational"
              ? "bg-green-100 text-green-800"
              : provider.status === "degraded"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {provider.status === "operational" && (
            <CheckCircle className="h-3 w-3" />
          )}
          {provider.status === "degraded" && <Clock className="h-3 w-3" />}
          {provider.status === "offline" && (
            <AlertTriangle className="h-3 w-3" />
          )}
          <span className="capitalize">{provider.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Requests/min</p>
          <p className="font-medium">{provider.requestsPerMinute}</p>
        </div>
        <div>
          <p className="text-gray-600">Avg Cost</p>
          <p className="font-medium">${provider.averageCost.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-gray-600">Error Rate</p>
          <p className="font-medium">
            {(provider.errorRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );

  const AlertItem = ({ alert }: { alert: any }) => (
    <div
      className={`p-4 rounded-lg border ${
        alert.type === "error"
          ? "bg-red-50 border-red-200"
          : alert.type === "warning"
            ? "bg-yellow-50 border-yellow-200"
            : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div
            className={`p-1 rounded ${
              alert.type === "error"
                ? "bg-red-100"
                : alert.type === "warning"
                  ? "bg-yellow-100"
                  : "bg-blue-100"
            }`}
          >
            {alert.type === "error" && (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            {alert.type === "warning" && (
              <Clock className="h-4 w-4 text-yellow-600" />
            )}
            {alert.type === "info" && (
              <Activity className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{alert.message}</p>
            <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            RelayCore Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            AI Routing Hub Management & Analytics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Requests"
            value={metrics.totalRequests.toLocaleString()}
            icon={Activity}
            trend="+12.5% from last week"
            color="blue"
          />
          <MetricCard
            title="Active Providers"
            value={metrics.activeProviders}
            icon={Server}
            color="green"
          />
          <MetricCard
            title="Total Cost"
            value={`$${metrics.totalCost.toFixed(2)}`}
            icon={DollarSign}
            trend={`${((metrics.totalCost / budget.total) * 100).toFixed(1)}% of budget`}
            color="purple"
          />
          <MetricCard
            title="Avg Response Time"
            value={`${metrics.averageResponseTime}ms`}
            icon={Zap}
            color="orange"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Error Rate"
            value={`${(metrics.errorRate * 100).toFixed(2)}%`}
            icon={AlertTriangle}
            color="red"
          />
          <MetricCard
            title="System Uptime"
            value={`${metrics.uptime}%`}
            icon={CheckCircle}
            color="green"
          />
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">
                Budget Usage
              </h3>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span className="font-medium">${budget.used.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Remaining</span>
                <span className="font-medium text-green-600">
                  ${budget.remaining.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(budget.used / budget.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {((budget.used / budget.total) * 100).toFixed(1)}% of{" "}
                {budget.period} budget
              </p>
            </div>
          </div>
        </div>

        {/* Provider Status & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Provider Status */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  Provider Status
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.map((provider) => (
                    <ProviderStatusCard
                      key={provider.name}
                      provider={provider}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                System Alerts
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>

              {alerts.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No active alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Charts Placeholder */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Performance Analytics
          </h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Performance charts and analytics</p>
              <p className="text-sm text-gray-400">
                Integration with monitoring stack needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


