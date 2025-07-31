export interface ExecutionLogEntry {
  id: string;
  executionId: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  stepId?: string;
  stepName?: string;
  data?: Record<string, unknown>;
  duration?: number;
}

export interface ExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  successRate: number;
  errorRate: number;
  executionsToday: number;
  executionsThisWeek: number;
  executionsThisMonth: number;
}

export interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionDetails {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  steps: ExecutionStep[];
  logs: ExecutionLogEntry[];
  errorMessage?: string;
}