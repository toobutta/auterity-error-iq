export interface WorkflowStep {
  id: string;
  type: 'start' | 'ai_process' | 'condition' | 'action' | 'end';
  name: string;
  description?: string;
  config: {
    prompt?: string;
    condition?: string;
    action?: string;
    parameters?: Record<string, unknown>;
  };
  position: { x: number; y: number };
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowDefinition {
  id?: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  parameters?: Record<string, unknown>;
}

export interface WorkflowValidationError {
  type: 'missing_connection' | 'invalid_step' | 'circular_dependency' | 'missing_start' | 'missing_end';
  message: string;
  stepId?: string;
  connectionId?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  inputData: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  duration?: number; // in milliseconds
}

export interface NodeData {
  label: string;
  description?: string;
  type: WorkflowStep['type'];
  config: WorkflowStep['config'];
  isValid?: boolean;
  validationErrors?: string[];
}

export interface WorkflowExecutionError {
  id: string;
  type: 'validation' | 'runtime' | 'ai_service' | 'timeout' | 'system';
  message: string;
  details?: string;
  stackTrace?: string;
  failurePoint?: {
    stepId: string;
    stepName: string;
    stepIndex: number;
  };
  timestamp: string;
    context?: Record<string, unknown>;
}
