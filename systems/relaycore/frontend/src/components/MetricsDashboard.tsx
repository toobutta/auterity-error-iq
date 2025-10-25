import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface MetricsDashboardProps {
  metrics: any;
  onAdminCommand: (command: any) => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  onAdminCommand,
}) => {
  if (!metrics) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">System Metrics</h2>
        <div className="text-gray-400">Loading metrics...</div>
      </div>
    );
  }

  const providerData = metrics.providers.map((provider: any) => ({
    name: provider.provider,
    requests: provider.total_requests,
    latency: provider.average_latency,
    errorRate: provider.error_rate * 100,
    cost: provider.average_cost,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Requests</div>
          <div className="text-2xl font-bold text-blue-400">
            {metrics.system.total_requests}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Success Rate</div>
          <div className="text-2xl font-bold text-green-400">
            {(
              (metrics.system.successful_requests /
                metrics.system.total_requests) *
              100
            ).toFixed(1)}
            %
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Latency</div>
          <div className="text-2xl font-bold text-yellow-400">
            {metrics.system.average_latency}ms
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Cost</div>
          <div className="text-2xl font-bold text-purple-400">
            ${metrics.system.total_cost.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Provider Performance Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Provider Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={providerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="requests" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Latency Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Response Latency by Provider
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={providerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "6px",
              }}
            />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#10B981"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Admin Actions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onAdminCommand({ type: "reset_metrics" })}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
          >
            Reset Metrics
          </button>
          <button
            onClick={() => onAdminCommand({ type: "get_detailed_metrics" })}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
          >
            Get Detailed Metrics
          </button>
          <button
            onClick={() => onAdminCommand({ type: "get_system_status" })}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
          >
            Refresh Status
          </button>
          <button
            onClick={() => {
              if (
                confirm("Are you sure you want to initiate emergency shutdown?")
              ) {
                onAdminCommand({ type: "emergency_shutdown" });
              }
            }}
            className="bg-red-800 hover:bg-red-900 px-4 py-2 rounded transition-colors"
          >
            Emergency Shutdown
          </button>
        </div>
      </div>
    </div>
  );
};


