/**
 * Test utilities and mock data for unit tests
 * Created to fix missing test-utils.ts import error
 */

import {
  Workflow,
  WorkflowExecution,
  WorkflowNode,
  WorkflowEdge,
} from "./workflow-core";

// Mock API response wrapper
export interface MockApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// Mock workflow data for testing
export interface MockWorkflowApi {
  getWorkflows: jest.MockedFunction<() => Promise<Workflow[]>>;
  executeWorkflow: jest.MockedFunction<
    (id: string) => Promise<WorkflowExecution>
  >;
  cancelWorkflow: jest.MockedFunction<(id: string) => Promise<void>>;
}

// Test workflow factory
export const createMockWorkflow = (
  overrides: Partial<Workflow> = {},
): Workflow => ({
  id: "test-workflow-1",
  name: "Test Workflow",
  description: "A test workflow for unit testing",
  version: 1,
  created_at: new Date("2023-01-01T00:00:00Z"),
  updated_at: new Date("2023-01-01T00:00:00Z"),
  created_by: "test-user",
  status: "draft",
  nodes: [],
  edges: [],
  metadata: {
    tags: ["test"],
    category: "testing",
  },
  ...overrides,
});

// Test workflow execution factory
export const createMockExecution = (
  overrides: Partial<WorkflowExecution> = {},
): WorkflowExecution => ({
  id: "test-execution-1",
  workflow_id: "test-workflow-1",
  status: "pending",
  input_data: {},
  output_data: null,
  error_message: null,
  started_at: new Date("2023-01-01T00:00:00Z"),
  completed_at: null,
  execution_logs: [],
  ...overrides,
});

// Test node factory
export const createMockNode = (
  overrides: Partial<WorkflowNode> = {},
): WorkflowNode => ({
  id: "test-node-1",
  type: "start",
  position: { x: 0, y: 0 },
  data: {
    label: "Test Node",
    description: "A test node",
    config: {},
  },
  ...overrides,
});

// Test edge factory
export const createMockEdge = (
  overrides: Partial<WorkflowEdge> = {},
): WorkflowEdge => ({
  id: "test-edge-1",
  source: "test-node-1",
  target: "test-node-2",
  ...overrides,
});

// Common test assertions
export const expectWorkflowToBeValid = (workflow: Workflow): void => {
  expect(workflow.id).toBeDefined();
  expect(workflow.name).toBeDefined();
  expect(workflow.status).toMatch(/^(draft|active|inactive|archived)$/);
  expect(Array.isArray(workflow.nodes)).toBe(true);
  expect(Array.isArray(workflow.edges)).toBe(true);
};

// Mock fetch function for API tests
export const createMockFetch = (response: unknown, status = 200): jest.Mock => {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(response),
    text: jest.fn().mockResolvedValue(JSON.stringify(response)),
  });
};

// Test environment helpers
export const waitForNextTick = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100,
): Promise<void> => {
  const startTime = Date.now();

  while (!condition() && Date.now() - startTime < timeout) {
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
};


