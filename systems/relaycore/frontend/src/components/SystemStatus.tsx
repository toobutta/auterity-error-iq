import React from "react";

interface SystemStatusProps {
  status: any;
  connected: boolean;
  onAdminCommand: (command: any) => void;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  status,
  connected,
  onAdminCommand,
}) => {
  const formatUptime = (uptimeSeconds: number) => {
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">System Status</h3>

      {!connected && (
        <div className="bg-red-900 border border-red-600 rounded p-3 mb-4">
          <div className="text-red-200">⚠️ Disconnected from server</div>
        </div>
      )}

      {status ? (
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">System Health:</span>
            <span
              className={`font-semibold ${status.system_health === "healthy" ? "text-green-400" : "text-red-400"}`}
            >
              {status.system_health}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Uptime:</span>
            <span className="text-white">{formatUptime(status.uptime)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Connected Clients:</span>
            <span className="text-white">{status.connected_clients}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Active Requests:</span>
            <span className="text-white">{status.active_requests}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Memory Usage:</span>
            <span className="text-white">
              {formatMemory(status.memory_usage?.heapUsed || 0)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Last Updated:</span>
            <span className="text-white">
              {new Date(status.last_updated).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">Loading system status...</div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={() => onAdminCommand({ type: "get_system_status" })}
          className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
          disabled={!connected}
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
};


