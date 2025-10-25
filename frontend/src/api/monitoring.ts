import { apiClient } from "./client";

export interface SystemMetrics {
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

export interface Alert {
  id: string;
  system: string;
  type: "error" | "warning" | "info";
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  severity: "low" | "medium" | "high" | "critical";
}

export interface AlertSettings {
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

export interface MonitoringOverview {
  totalRequests: number;
  totalCosts: number;
  avgResponseTime: number;
  avgErrorRate: number;
  activeAlerts: number;
  criticalAlerts: number;
  systemStatus: {
    autmatrix: "healthy" | "warning" | "error";
    relaycore: "healthy" | "warning" | "error";
    neuroweaver: "healthy" | "warning" | "error";
  };
}

/**
 * Fetch unified metrics from all three systems
 */
export const getUnifiedMetrics = async (
  timeRange: "1h" | "24h" | "7d" | "30d" = "24h",
  systems?: ("autmatrix" | "relaycore" | "neuroweaver")[],
): Promise<SystemMetrics[]> => {
  const params = new URLSearchParams({
    timeRange,
    ...(systems && { systems: systems.join(",") }),
  });

  const response = await apiClient.get<SystemMetrics[]>(
    `/api/monitoring/metrics?${params}`,
  );

  // Transform response to ensure proper date parsing
  return response.map((metric: SystemMetrics) => ({
    ...metric,
    timestamp: new Date(metric.timestamp),
    alerts: metric.alerts.map((alert: Alert) => ({
      ...alert,
      timestamp: new Date(alert.timestamp),
    })),
  }));
};

/**
 * Fetch AutoMatrix specific metrics
 */
export const getAutoMatrixMetrics = async (
  timeRange = "24h",
): Promise<SystemMetrics[]> => {
  const response = await apiClient.get<SystemMetrics[]>(
    `/api/autmatrix/metrics?timeRange=${timeRange}`,
  );
  return response.map((metric: SystemMetrics) => ({
    ...metric,
    timestamp: new Date(metric.timestamp),
  }));
};

/**
 * Fetch RelayCore specific metrics
 */
export const getRelayCoreMetrics = async (
  timeRange = "24h",
): Promise<SystemMetrics[]> => {
  const response = await apiClient.get(
    `/api/relaycore/metrics?timeRange=${timeRange}`,
  );
  return response.map((metric: SystemMetrics) => ({
    ...metric,
    timestamp: new Date(metric.timestamp),
  }));
};

/**
 * Fetch NeuroWeaver specific metrics
 */
export const getNeuroWeaverMetrics = async (
  timeRange = "24h",
): Promise<SystemMetrics[]> => {
  const response = await apiClient.get(
    `/api/neuroweaver/metrics?timeRange=${timeRange}`,
  );
  return response.map((metric: SystemMetrics) => ({
    ...metric,
    timestamp: new Date(metric.timestamp),
  }));
};

/**
 * Fetch all active alerts across systems
 */
export const getActiveAlerts = async (): Promise<Alert[]> => {
  const response = await apiClient.get<Alert[]>("/api/monitoring/alerts");
  return response.map((alert: Alert) => ({
    ...alert,
    timestamp: new Date(alert.timestamp),
  }));
};

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = async (alertId: string): Promise<void> => {
  await apiClient.post(`/api/monitoring/alerts/${alertId}/acknowledge`);
};

/**
 * Fetch monitoring overview/summary
 */
export const getMonitoringOverview = async (): Promise<MonitoringOverview> => {
  return await apiClient.get("/api/monitoring/overview");
};

/**
 * Fetch alert settings
 */
export const getAlertSettings = async (): Promise<AlertSettings> => {
  return await apiClient.get("/api/monitoring/alert-settings");
};

/**
 * Update alert settings
 */
export const updateAlertSettings = async (
  settings: AlertSettings,
): Promise<AlertSettings> => {
  return await apiClient.put("/api/monitoring/alert-settings", settings);
};

/**
 * Test alert notification (for testing purposes)
 */
export const testAlertNotification = async (
  type: "email" | "slack",
): Promise<void> => {
  await apiClient.post("/api/monitoring/test-notification", { type });
};

/**
 * Fetch system health status
 */
export const getSystemHealth = async (): Promise<{
  autmatrix: { status: string; uptime: number; lastCheck: Date };
  relaycore: { status: string; uptime: number; lastCheck: Date };
  neuroweaver: { status: string; uptime: number; lastCheck: Date };
}> => {
  const response = await apiClient.get("/api/monitoring/health");
  return {
    autmatrix: {
      ...response.autmatrix,
      lastCheck: new Date(response.autmatrix.lastCheck),
    },
    relaycore: {
      ...response.relaycore,
      lastCheck: new Date(response.relaycore.lastCheck),
    },
    neuroweaver: {
      ...response.neuroweaver,
      lastCheck: new Date(response.neuroweaver.lastCheck),
    },
  };
};

/**
 * Fetch cost breakdown by system
 */
export const getCostBreakdown = async (
  timeRange = "24h",
): Promise<{
  autmatrix: { total: number; breakdown: { [key: string]: number } };
  relaycore: { total: number; breakdown: { [key: string]: number } };
  neuroweaver: { total: number; breakdown: { [key: string]: number } };
}> => {
  return await apiClient.get(`/api/monitoring/costs?timeRange=${timeRange}`);
};

/**
 * Fetch usage statistics
 */
export const getUsageStatistics = async (
  timeRange = "24h",
): Promise<{
  totalRequests: number;
  requestsBySystem: { [key: string]: number };
  avgResponseTime: number;
  responseTimeBySystem: { [key: string]: number };
  errorRate: number;
  errorRateBySystem: { [key: string]: number };
}> => {
  return await apiClient.get(`/api/monitoring/usage?timeRange=${timeRange}`);
};

/**
 * Export monitoring data (for reporting)
 */
export const exportMonitoringData = async (
  format: "csv" | "json" | "pdf",
  timeRange = "24h",
  systems?: string[],
): Promise<Blob> => {
  const params = new URLSearchParams({
    format,
    timeRange,
    ...(systems && { systems: systems.join(",") }),
  });

  const response = await fetch(`/api/monitoring/export?${params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to export monitoring data");
  }

  return response.blob();
};


