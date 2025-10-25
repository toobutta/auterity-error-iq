import React from "react";

interface SystemAlert {
  id: string;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: number;
}

interface AlertPanelProps {
  alerts: SystemAlert[];
  onClearAlerts: () => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  onClearAlerts,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-900";
      case "warning":
        return "border-yellow-500 bg-yellow-900";
      case "info":
        return "border-blue-500 bg-blue-900";
      default:
        return "border-gray-500 bg-gray-900";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return "🔴";
      case "warning":
        return "🟡";
      case "info":
        return "🔵";
      default:
        return "⚪";
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">System Alerts</h3>
        {alerts.length > 0 && (
          <button
            onClick={onClearAlerts}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-gray-400 text-center py-4">No active alerts</div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded p-3 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {getSeverityIcon(alert.severity)}
                </span>
                <div className="flex-1">
                  <div className="text-sm text-white">{alert.message}</div>
                  <div className="text-xs text-gray-300 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


