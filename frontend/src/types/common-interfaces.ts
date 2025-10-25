/**
 * Common TypeScript interfaces for the Auterity Unified project
 *
 * This file contains shared interfaces that can be used across the application
 * to replace 'any' types with proper type definitions.
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  errors?: string[];
}

/**
 * Error response from API
 */
export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, unknown>;
  path?: string;
  timestamp?: string;
}

/**
 * Generic key-value record for metadata
 */
export type Metadata = Record<string, unknown>;

/**
 * Base node interface for workflow nodes
 */
export interface BaseNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: NodeData;
}

/**
 * Node data interface
 */
export interface NodeData {
  label: string;
  description?: string;
  config: NodeConfig;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
}

/**
 * Node configuration
 */
export interface NodeConfig {
  type: string;
  [key: string]: unknown;
}

/**
 * Edge connecting nodes
 */
export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: string;
}

/**
 * Workflow execution result
 */
export interface ExecutionResult {
  id: string;
  status: "success" | "error" | "running" | "pending";
  startTime: string;
  endTime?: string;
  outputs: Record<string, unknown>;
  errors?: ExecutionError[];
  logs?: LogEntry[];
}

/**
 * Execution error
 */
export interface ExecutionError {
  message: string;
  nodeId?: string;
  stack?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Monitoring metrics
 */
export interface Metrics {
  timestamp: string;
  metrics: {
    [key: string]: number | string | boolean;
  };
  tags?: Record<string, string>;
}

/**
 * User permissions
 */
export interface UserPermissions {
  canView: boolean;
  canEdit: boolean;
  canExecute: boolean;
  canDelete: boolean;
  canManage: boolean;
}

/**
 * Utility type for API request options
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  withCredentials?: boolean;
}

/**
 * Utility type for pagination
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Utility type for search/filter parameters
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, string | number | boolean | null>;
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
  page?: number;
  pageSize?: number;
}


