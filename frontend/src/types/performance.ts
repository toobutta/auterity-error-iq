export interface PerformanceMetrics {
  executionTime: number;
  resourceUsage: { cpu: number; memory: number };
  workflowId: string;
  timestamp: Date;
  successRate?: number;
  stepCount?: number;
}


