import { ExecutionLogEntry as BaseExecutionLogEntry } from "./execution";

export interface ExtendedExecutionLogEntry extends BaseExecutionLogEntry {
  duration?: number;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorMessage?: string;
  stepType?: string;
}

export interface ExecutionLog {
  id: string;
  stepName: string;
  level: "info" | "warning" | "error" | "debug";
  message: string;
  timestamp: string;
  duration: number;
  data: Record<string, unknown>;
  stepType?: string;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorMessage?: string;
}

export type ExecutionLogLevel = "info" | "warning" | "error" | "debug";

export interface ExecutionLogMetadata {
  totalSteps: number;
  failedStepIndex?: number;
  totalDuration: number;
  hasErrors: boolean;
}


