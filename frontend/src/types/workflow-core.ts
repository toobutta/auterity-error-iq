/**
 * Core workflow data structures for TypeScript compliance
 * Created for CURSOR-TASK-001: TypeScript Compliance Cleanup
 */

// Base workflow types
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: WorkflowMetadata;
}

export type WorkflowStatus = "draft" | "active" | "inactive" | "archived";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: Position;
  data: WorkflowNodeData;
  style?: Record<string, unknown>;
  className?: string;
  selected?: boolean;
  dragging?: boolean;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  style?: Record<string, unknown>;
  className?: string;
  animated?: boolean;
  label?: string;
}

export interface Position {
  x: number;
  y: number;
}

export type NodeType =
  | "input"
  | "output"
  | "process"
  | "decision"
  | "api"
  | "ai"
  | "custom"
  | "automotive";

export interface WorkflowNodeData {
  label: string;
  description?: string;
  config: NodeConfiguration;
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
  validation?: ValidationRule[];
}

export interface NodeConfiguration {
  [key: string]: ConfigValue;
}

export type ConfigValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | ConfigValue[];

export interface NodeInput {
  id: string;
  name: string;
  type: InputType;
  required: boolean;
  default?: unknown;
  validation?: ValidationRule[];
}

export interface NodeOutput {
  id: string;
  name: string;
  type: OutputType;
  description?: string;
}

export type InputType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "file";
export type OutputType = InputType;

export interface ValidationRule {
  type: "required" | "minLength" | "maxLength" | "pattern" | "custom";
  value?: unknown;
  message: string;
}

export interface WorkflowMetadata {
  tags: string[];
  category: string;
  automotive_context?: AutomotiveContext;
  performance_metrics?: PerformanceMetrics;
  [key: string]: unknown;
}

export interface AutomotiveContext {
  dealership_role: "sales" | "service" | "parts" | "finance" | "management";
  customer_journey_stage:
    | "lead"
    | "prospect"
    | "customer"
    | "service"
    | "retention";
  integration_systems: string[];
}

export interface PerformanceMetrics {
  average_execution_time: number;
  success_rate: number;
  error_rate: number;
  last_executed: Date;
}

// Workflow execution types
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: ExecutionStatus;
  started_at: Date;
  completed_at?: Date;
  duration?: number;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: ExecutionError;
  steps: ExecutionStep[];
}

export type ExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface ExecutionStep {
  id: string;
  node_id: string;
  status: ExecutionStatus;
  started_at: Date;
  completed_at?: Date;
  duration?: number;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  error?: ExecutionError;
  logs: LogEntry[];
}

export interface ExecutionError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  recoverable: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";


