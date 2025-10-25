import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { MetricsDashboard } from "./components/MetricsDashboard";
import { SystemStatus } from "./components/SystemStatus";
import { ProviderStatus } from "./components/ProviderStatus";
import { AlertPanel } from "./components/AlertPanel";

interface RealtimeMetrics {
  timestamp: number;
  system: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_latency: number;
    total_cost: number;
    error_rate: number;
  };
  providers: Array<{
    provider: string;
    total_requests: number;
    successful_requests: number;
    average_latency: number;
    average_cost: number;
    error_rate: number;
  }>;
  activeRequests: number;
  errorRate: number;
  averageLatency: number;
}

interface SystemAlert {
  id: string;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: number;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io("http://localhost:3001", {
      auth: {
        token: process.env.REACT_APP_WEBSOCKET_TOKEN || "admin-token",
      },
    });

    socketInstance.on("connect", () => {

      setConnected(true);

      // Subscribe to metrics updates
      socketInstance.emit("subscribe_metrics", [
        "system",
        "providers",
        "costs",
      ]);

      // Request initial system status
      socketInstance.emit("admin_command", { type: "get_system_status" });
    });

    socketInstance.on("disconnect", () => {

      setConnected(false);
    });

    socketInstance.on("metrics_update", (data: RealtimeMetrics) => {
      setMetrics(data);
    });

    socketInstance.on("system_alert", (alert: SystemAlert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    });

    socketInstance.on("admin_response", (response: any) => {
      if (response.type === "system_status") {
        setSystemStatus(response.data);
      }
    });

    socketInstance.on("error", (error: any) => {

    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleAdminCommand = (command: any) => {
    if (socket && connected) {
      socket.emit("admin_command", command);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-400">
          RelayCore Admin Dashboard
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <div
            className={`flex items-center gap-2 ${connected ? "text-green-400" : "text-red-400"}`}
          >
            <div
              className={`w-3 h-3 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
            ></div>
            <span>{connected ? "Connected" : "Disconnected"}</span>
          </div>
          {metrics && (
            <div className="text-gray-400">
              Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="lg:col-span-2 xl:col-span-2">
          <MetricsDashboard
            metrics={metrics}
            onAdminCommand={handleAdminCommand}
          />
        </div>

        <div className="space-y-6">
          <SystemStatus
            status={systemStatus}
            connected={connected}
            onAdminCommand={handleAdminCommand}
          />

          <ProviderStatus providers={metrics?.providers || []} />

          <AlertPanel alerts={alerts} onClearAlerts={() => setAlerts([])} />
        </div>
      </div>
    </div>
  );
}

export default App;


