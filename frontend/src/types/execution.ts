export interface ExecutionLogEntry {
  id: string;
  executionId: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  stepId?: string;
  stepName?: string;
  data?: Record<string, unknown>;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  stepId?: string;
  stepName?: string;
  data?: Record<string, unknown>;
}

export interface StatusUpdate {
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  message?: string;
  progress?: number;
  timestamp: string;
}

export interface SystemMetrics {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIO: number;
}

export interface PerformanceMetrics {
  workflowId: string;
  executionTime: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
  timestamp: string;
}

export interface UseWebSocketLogsReturn {
  logs: ExecutionLogEntry[];
  isConnected: boolean;
  connect: (executionId: string) => void;
  disconnect: () => void;
}


