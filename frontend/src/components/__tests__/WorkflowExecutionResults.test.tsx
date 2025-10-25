import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from "vitest";
import WorkflowExecutionResults from "../WorkflowExecutionResults";
import { ErrorProvider } from "../../contexts/ErrorContext";
import * as workflowsApi from "../../api/workflows";
// Types imported for reference but not directly used in test structure
// import type { WorkflowExecution } from '../../types/workflow-core';

// Mock the API with all required functions
vi.mock("../../api/workflows", () => ({
  getExecution: vi.fn(),
  getExecutionLogs: vi.fn(),
  executeWorkflow: vi.fn(),
  getWorkflows: vi.fn(),
  getWorkflow: vi.fn(),
  createWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  cancelExecution: vi.fn(),
  getExecutionHistory: vi.fn(),
  getWorkflowPerformance: vi.fn(),
  getSystemPerformance: vi.fn(),
  getDashboardMetrics: vi.fn(),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe("WorkflowExecutionResults Component", () => {
  const mockExecution = {
    id: "exec-123",
    status: "completed",
    duration: 12345,
    startedAt: "2025-07-29T12:34:56.789Z",
    completedAt: "2025-07-29T12:34:56.789Z",
    inputData: { input: "test" },
    outputData: {
      result: "success",
      data: { key: "value" },
    },
  };

  const renderWithErrorProvider = (component: React.ReactElement) => {
    return render(<ErrorProvider>{component}</ErrorProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (
      workflowsApi.getExecution as MockedFunction<
        typeof workflowsApi.getExecution
      >
    ).mockResolvedValue(mockExecution);
  });

  it("renders component with completed status", async () => {
    renderWithErrorProvider(
      <WorkflowExecutionResults executionId="exec-123" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Execution Results")).toBeInTheDocument();
      expect(screen.getByText("completed")).toBeInTheDocument();
      expect(screen.getByText("12.3s")).toBeInTheDocument();
      expect(screen.getByText("Output Data")).toBeInTheDocument();
    });
  });

  it("copies output to clipboard when button is clicked", async () => {
    renderWithErrorProvider(
      <WorkflowExecutionResults executionId="exec-123" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Execution Results")).toBeInTheDocument();
    });

    const copyButton = screen.getByRole("button", { name: /copy output/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(mockExecution.outputData, null, 2),
    );
  });

  it("renders error display when execution fails", async () => {
    const errorExecution = {
      ...mockExecution,
      status: "failed",
      errorMessage: "Test error message",
    };

    (
      workflowsApi.getExecution as MockedFunction<
        typeof workflowsApi.getExecution
      >
    ).mockResolvedValue(errorExecution);
    (
      workflowsApi.getExecutionLogs as MockedFunction<
        typeof workflowsApi.getExecutionLogs
      >
    ).mockResolvedValue([]);

    renderWithErrorProvider(
      <WorkflowExecutionResults executionId="exec-123" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Workflow Execution Failed")).toBeInTheDocument();
      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });
  });

  it("handles primitive output data correctly", async () => {
    const primitiveExecution = {
      ...mockExecution,
      outputData: 42,
    };

    (
      workflowsApi.getExecution as MockedFunction<
        typeof workflowsApi.getExecution
      >
    ).mockResolvedValue(primitiveExecution);

    renderWithErrorProvider(
      <WorkflowExecutionResults executionId="exec-123" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Output Data")).toBeInTheDocument();
    });
  });

  it("handles string output data correctly", async () => {
    const stringExecution = {
      ...mockExecution,
      outputData: "Test string output",
    };

    (
      workflowsApi.getExecution as MockedFunction<
        typeof workflowsApi.getExecution
      >
    ).mockResolvedValue(stringExecution);

    renderWithErrorProvider(
      <WorkflowExecutionResults executionId="exec-123" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Output Data")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", () => {
    renderWithErrorProvider(
      <WorkflowExecutionResults executionId="exec-123" />,
    );

    expect(
      screen.getByText("Loading execution results..."),
    ).toBeInTheDocument();
  });

  it("shows error state when API call fails", async () => {
    (
      workflowsApi.getExecution as MockedFunction<
        typeof workflowsApi.getExecution
      >
    ).mockRejectedValue(new Error("API Error"));

    renderWithErrorProvider(
      <WorkflowExecutionResults executionId="exec-123" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Error Loading Results")).toBeInTheDocument();
      expect(
        screen.getByText(/Failed to fetch execution results: API Error/),
      ).toBeInTheDocument();
    });
  });
});


