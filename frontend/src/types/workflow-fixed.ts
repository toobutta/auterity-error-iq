import { Node as ReactFlowNode, Edge as ReactFlowEdge } from "@xyflow/react";

export interface NodeConfig {
  [key: string]: unknown;
}

export interface NodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  type: string;
  config: NodeConfig;
  isValid?: boolean;
  validationErrors?: string[];
}

export interface WorkflowNode extends ReactFlowNode {
  id: string;
  data: NodeData;
}

export interface WorkflowEdge extends ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ExecutionLogEntry {
  id: string;
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  stepId?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface FormData {
  [key: string]:
    | string
    | number
    | boolean
    | Record<string, unknown>
    | unknown[];
}


