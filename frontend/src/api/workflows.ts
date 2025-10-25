import client from "./client";
import { WorkflowDefinition, WorkflowExecution } from "../types/workflow";
import { PerformanceMetrics } from "../types/performance";
import { ExecutionLogEntry } from "../types/execution";

// Workflow CRUD operations
export const createWorkflow = async (
  workflow: Omit<WorkflowDefinition, "id">,
): Promise<WorkflowDefinition> => {
  const response = await client.post("/api/workflows", workflow);
  return response.data;
};

export const getWorkflows = async (): Promise<WorkflowDefinition[]> => {
  const response = await client.get("/api/workflows");
  return response.data;
};

export const getWorkflow = async (id: string): Promise<WorkflowDefinition> => {
  const response = await client.get(`/api/workflows/${id}`);
  return response.data;
};

export const updateWorkflow = async (
  id: string,
  workflow: Partial<WorkflowDefinition>,
): Promise<WorkflowDefinition> => {
  const response = await client.put(`/api/workflows/${id}`, workflow);
  return response.data;
};

export const deleteWorkflow = async (id: string): Promise<void> => {
  await client.delete(`/api/workflows/${id}`);
};

// Workflow execution operations
export const executeWorkflow = async (
  workflowId: string,
  inputData: Record<string, unknown>,
): Promise<WorkflowExecution> => {
  const response = await client.post(`/api/workflows/${workflowId}/execute`, {
    input_data: inputData,
  });
  return response.data;
};

export const getExecution = async (
  executionId: string,
): Promise<WorkflowExecution> => {
  const response = await client.get(`/api/executions/${executionId}`);
  return response.data;
};

export const getExecutionLogs = async (
  executionId: string,
): Promise<ExecutionLogEntry[]> => {
  const response = await client.get(`/api/executions/${executionId}/logs`);
  return response.data;
};

export const cancelExecution = async (executionId: string): Promise<void> => {
  await client.post(`/api/executions/${executionId}/cancel`);
};

// Get execution history with filtering and pagination
export interface ExecutionHistoryParams {
  page?: number;
  pageSize?: number;
  status?: "pending" | "running" | "completed" | "failed";
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "started_at" | "completed_at" | "duration" | "status";
  sortOrder?: "asc" | "desc";
}

export interface ExecutionHistoryResponse {
  executions: WorkflowExecution[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getExecutionHistory = async (
  params: ExecutionHistoryParams = {},
): Promise<ExecutionHistoryResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append("page", params.page.toString());
  if (params.pageSize)
    queryParams.append("page_size", params.pageSize.toString());
  if (params.status) queryParams.append("status", params.status);
  if (params.search) queryParams.append("search", params.search);
  if (params.startDate) queryParams.append("start_date", params.startDate);
  if (params.endDate) queryParams.append("end_date", params.endDate);
  if (params.sortBy) queryParams.append("sort_by", params.sortBy);
  if (params.sortOrder) queryParams.append("sort_order", params.sortOrder);

  const response = await client.get(
    `/api/executions?${queryParams.toString()}`,
  );
  return response.data;
};

// Performance metrics API
export const getWorkflowPerformance = async (
  workflowId: string,
): Promise<PerformanceMetrics[]> => {
  const response = await client.get(`/api/workflows/${workflowId}/performance`);
  return response.data;
};

export const getSystemPerformance = async (): Promise<PerformanceMetrics[]> => {
  const response = await client.get("/api/performance/system");
  return response.data;
};

// Dashboard metrics API
export interface DashboardMetrics {
  totalWorkflows: number;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  activeExecutions: number;
  failedExecutions: number;
  executionsToday: number;
  executionsThisWeek: number;
}

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await client.get("/api/dashboard/metrics");
  return response.data;
};

/**
 * Retry a failed workflow execution with optional modified inputs
 */
export const retryWorkflowExecution = async (
  executionId: string,
  modifiedInputs?: Record<string, unknown>,
): Promise<{ executionId: string }> => {
  const response = await client.post(`/api/executions/${executionId}/retry`, {
    inputs: modifiedInputs,
  });
  return response.data;
};


