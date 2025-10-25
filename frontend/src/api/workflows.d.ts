export interface WorkflowApiResponse {
  id: string;
  name: string;
  description?: string;
  definition: {
    steps: Record<string, unknown>[];
    connections: Record<string, unknown>[];
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ExecutionApiResponse {
  id: string;
  workflow_id: string;
  status: "pending" | "running" | "completed" | "failed";
  input_data: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}


