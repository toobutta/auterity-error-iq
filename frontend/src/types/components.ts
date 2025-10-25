/**
 * Component prop interfaces for TypeScript compliance
 * Created for CURSOR-TASK-001: TypeScript Compliance Cleanup
 */

import { ReactNode } from "react";
import {
  Workflow,
  WorkflowExecution,
  WorkflowNode,
  WorkflowEdge,
} from "./workflow-core";
import { SystemMetrics, Alert, AlertSettings } from "./api";

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  "data-testid"?: string;
}

// Workflow Builder component props
export interface WorkflowBuilderProps extends BaseComponentProps {
  workflow?: Workflow;
  onSave: (workflow: Workflow) => void;
  onCancel: () => void;
  onValidationChange?: (isValid: boolean) => void;
  readOnly?: boolean;
  showToolbar?: boolean;
}

export interface NodeEditorProps extends BaseComponentProps {
  node: WorkflowNode;
  onChange: (node: WorkflowNode) => void;
  onClose: () => void;
  availableInputs?: string[];
  readOnly?: boolean;
}

export interface NodePaletteProps extends BaseComponentProps {
  onNodeDragStart: (
    nodeType: string,
    nodeData: Record<string, unknown>,
  ) => void;
  categories?: NodeCategory[];
  searchable?: boolean;
}

export interface NodeCategory {
  id: string;
  name: string;
  icon?: string;
  nodes: NodeDefinition[];
}

export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  icon?: string;
  defaultData: Record<string, unknown>;
  category: string;
}

// Workflow Canvas props
export interface WorkflowCanvasProps extends BaseComponentProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onEdgesChange: (edges: WorkflowEdge[]) => void;
  onNodeClick?: (node: WorkflowNode) => void;
  onEdgeClick?: (edge: WorkflowEdge) => void;
  readOnly?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
}

// Monitoring component props
export interface MonitoringDashboardProps extends BaseComponentProps {
  metrics?: SystemMetrics[];
  alerts?: Alert[];
  refreshInterval?: number;
  onRefresh?: () => void;
  showFilters?: boolean;
}

export interface AlertSettingsProps extends BaseComponentProps {
  settings: AlertSettings[];
  onSettingsChange: (settings: AlertSettings[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

// Execution component props
export interface WorkflowExecutionProps extends BaseComponentProps {
  execution: WorkflowExecution;
  onCancel?: () => void;
  onRetry?: () => void;
  showLogs?: boolean;
  autoRefresh?: boolean;
}

export interface ExecutionHistoryProps extends BaseComponentProps {
  executions: WorkflowExecution[];
  onExecutionClick: (execution: WorkflowExecution) => void;
  onRefresh?: () => void;
  pageSize?: number;
  showFilters?: boolean;
}

// RelayCore Admin Interface props
export interface RelayCoreAdminInterfaceProps extends BaseComponentProps {
  onBudgetUpdate?: (budget: number) => void;
  onProviderChange?: (provider: string) => void;
  initialBudget?: number;
  initialProvider?: string;
  showCostAnalytics?: boolean;
}

export interface BudgetConfig {
  daily_limit: number;
  monthly_limit: number;
  alert_threshold: number;
  auto_scaling: boolean;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: "openai" | "anthropic" | "google" | "custom";
  cost_per_token: number;
  rate_limit: number;
  enabled: boolean;
  health_status: "healthy" | "degraded" | "down";
}

// Form component props
export interface FormFieldProps extends BaseComponentProps {
  label: string;
  name: string;
  type?:
    | "text"
    | "number"
    | "email"
    | "password"
    | "textarea"
    | "select"
    | "checkbox";
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// Modal component props
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

// Button component props
export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

// Event handler types
export type ChangeHandler<T = unknown> = (value: T) => void;
export type ClickHandler = () => void;
export type SubmitHandler<T = Record<string, unknown>> = (data: T) => void;

// Common prop combinations
export interface InteractiveProps {
  onClick?: ClickHandler;
  onDoubleClick?: ClickHandler;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
}

export interface ErrorProps {
  error?: string | Error;
  onErrorClear?: () => void;
}


