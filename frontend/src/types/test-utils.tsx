import { vi } from "vitest";
import { ReactFlowProvider } from "@xyflow/react";
import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";

// Vitest mock types
export const mockVi = vi;

// React Flow node prop types for testing
export interface MockNodeProps {
  id: string;
  type: string;
  data: {
    label: string;
    description?: string;
    type: string;
    config: Record<string, unknown>;
    isValid?: boolean;
    validationErrors?: string[];
  };
  zIndex: number;
  selected: boolean;
  isConnectable: boolean;
  xPos: number;
  yPos: number;
  dragHandle?: string;
}

// Test wrapper components
export const TestRouterWrapper = ({ children }: { children: ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

export const TestReactFlowWrapper = ({ children }: { children: ReactNode }) => {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
};

// Mock data factories
export const createMockWorkflowExecution = (
  overrides: Record<string, unknown> = {},
) => ({
  id: "test-execution-1",
  workflowId: "test-workflow-1",
  workflowName: "Test Workflow",
  status: "completed" as const,
  inputData: { input: "test" },
  outputData: { result: "success" },
  startedAt: "2024-01-01T00:00:00Z",
  completedAt: "2024-01-01T00:01:00Z",
  duration: 60000,
  ...overrides,
});

export const createMockExecutionLog = (
  overrides: Record<string, unknown> = {},
) => ({
  id: "log-1",
  executionId: "test-execution-1",
  timestamp: "2024-01-01T00:00:00Z",
  level: "info" as const,
  message: "Test log message",
  stepId: "step-1",
  stepName: "Test Step",
  data: {},
  ...overrides,
});


