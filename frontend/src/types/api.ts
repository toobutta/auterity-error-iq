/**
 * Core API response type definitions for TypeScript compliance
 * Created for CURSOR-TASK-001: TypeScript Compliance Cleanup
 */

// Base API response structure
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: number;
  timestamp?: string;
}

// Error response structure
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Monitoring API types
export interface SystemMetrics {
  id: string;
  system: string;
  timestamp: Date;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: {
    bytes_sent: number;
    bytes_received: number;
  };
  alerts: Alert[];
  status: "healthy" | "warning" | "error";
}

export interface Alert {
  id: string;
  type: "cpu" | "memory" | "disk" | "network" | "custom";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, unknown>;
}

export interface AlertSettings {
  id: string;
  name: string;
  type: Alert["type"];
  threshold: number;
  enabled: boolean;
  notifications: {
    email: boolean;
    slack: boolean;
    webhook?: string;
  };
}

// Workflow API types
export interface WorkflowApiResponse<T = unknown> extends ApiResponse<T> {
  execution_id?: string;
  workflow_id?: string;
}

// Generic API client response type
export interface ClientResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  config: RequestConfig;
}

export interface RequestConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  data?: unknown;
  timeout?: number;
  requestStartTime?: number;
}

// Monitoring data structures
export interface MonitoringData {
  metrics: SystemMetrics[];
  alerts: Alert[];
  summary: {
    total_systems: number;
    healthy_systems: number;
    systems_with_alerts: number;
    critical_alerts: number;
  };
}

// Export all types for easy importing
export type {
  SystemMetrics as MonitoringMetrics,
  Alert as MonitoringAlert,
  AlertSettings as MonitoringAlertSettings,
};


