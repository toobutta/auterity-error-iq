import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import WorkflowErrorDisplay from "../WorkflowErrorDisplay";
import { ErrorProvider } from "../../contexts/ErrorContext";
import * as workflowsApi from "../../api/workflows";

// Mock the workflows API
vi.mock("../../api/workflows", () => ({
  getExecution: vi.fn(),
  getExecutionLogs: vi.fn(),
  retryWorkflowExecution: vi.fn(),
}));

// Mock the error utils
vi.mock("../../utils/errorUtils", () => ({
  createAppError: vi.fn(() => ({
    id: "error-123",
    code: "WORKFLOW_EXECUTION_FAILED",
    message: "Workflow execution failed",
    category: "workflow",
    severity: "high",
    correlationId: "corr-456",
    context: {
      workflowId: "workflow-789",
      executionId: "exec-123",
      timestamp: new Date(),
    },
    retryable: true,
    userFriendlyMessage: "The workflow could not be completed due to an error.",
    actionable: true,
  })),
}));

const mockGetExecution = vi.mocked(workflowsApi.getExecution);
const mockGetExecutionLogs = vi.mocked(workflowsApi.getExecutionLogs);

import { WorkflowExecution } from "../../types/workflow";
import {
  ExecutionLog,
  ExtendedExecutionLogEntry,
} from "../../types/execution-logs";
import { ExecutionLogEntry } from "../../types/execution";

const mockFailedExecution: WorkflowExecution = {
  id: "exec-123",
  workflowId: "workflow-456",
  workflowName: "Test Workflow",
  status: "failed",
  inputData: {
    customerName: "John Doe",
    vehicleType: "sedan",
  },
  outputData: null,
  startedAt: "2024-01-01T10:00:00Z",
  completedAt: "2024-01-01T10:05:00Z",
  errorMessage: "AI service timeout occurred during processing",
  duration: 300000,
};

const mockExecutionLogs: ExecutionLogEntry[] = [
  {
    id: "log-1",
    executionId: "exec-123",
    stepName: "Initialize Workflow",
    level: "info",
    message: "Workflow started",
    timestamp: "2024-01-01T10:00:00Z",
    data: { step: "start" },
  },
  {
    id: "log-2",
    executionId: "exec-123",
    stepName: "Process Customer Data",
    level: "info",
    message: "Processing customer information",
    timestamp: "2024-01-01T10:01:00Z",
    data: { customerName: "John Doe" },
  },
  {
    id: "log-3",
    executionId: "exec-123",
    stepName: "AI Analysis",
    level: "error",
    message: "AI service timeout",
    timestamp: "2024-01-01T10:05:00Z",
    data: {},
  },
];

// Define the type for the component props
interface WorkflowErrorDisplayProps {
  executionId: string;
  workflowId?: string;
  onRetrySuccess?: (newExecutionId: string) => void;
  onClose?: () => void;
  className?: string;
}

const renderWithErrorProvider = (component: React.ReactElement) => {
  return render(<ErrorProvider>{component}</ErrorProvider>);
};

describe("WorkflowErrorDisplay", () => {
  const defaultProps: WorkflowErrorDisplayProps = {
    executionId: "exec-123",
    workflowId: "workflow-456",
    onRetrySuccess: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetExecution.mockResolvedValue(mockFailedExecution);
    mockGetExecutionLogs.mockResolvedValue(mockExecutionLogs);
  });

  it("shows loading state initially", () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    expect(screen.getByText("Loading error details...")).toBeInTheDocument();
  });

  it("displays error information after loading", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Workflow Execution Failed")).toBeInTheDocument();
      expect(screen.getByText("Execution ID: exec-123")).toBeInTheDocument();
      expect(
        screen.getByText("AI service timeout occurred during processing"),
      ).toBeInTheDocument();
    });
  });

  it("categorizes errors correctly", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("AI Service")).toBeInTheDocument(); // Category
      expect(screen.getByText("Medium")).toBeInTheDocument(); // Severity
    });
  });

  it("shows execution timeline information", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Started:/)).toBeInTheDocument();
      expect(screen.getByText(/Failed:/)).toBeInTheDocument();
      expect(screen.getByText(/Duration:/)).toBeInTheDocument();
    });
  });

  it("displays execution logs when available", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Execution Logs (3 steps)")).toBeInTheDocument();
    });

    // Expand logs section
    const logsButton = screen.getByText("Execution Logs (3 steps)");
    fireEvent.click(logsButton);

    await waitFor(() => {
      expect(screen.getByText("Initialize Workflow")).toBeInTheDocument();
      expect(screen.getByText("Process Customer Data")).toBeInTheDocument();
      expect(screen.getByText("AI Analysis")).toBeInTheDocument();
    });
  });

  it("shows retry button when workflowId is provided", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Retry Execution")).toBeInTheDocument();
    });
  });

  it("hides retry button when workflowId is not provided", async () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay {...defaultProps} workflowId={undefined} />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Retry Execution")).not.toBeInTheDocument();
    });
  });

  it("shows report issue button", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Report Issue")).toBeInTheDocument();
    });
  });

  it("opens retry modal when retry button is clicked", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      const retryButton = screen.getByText("Retry Execution");
      fireEvent.click(retryButton);
    });

    expect(screen.getByText("Retry Workflow Execution")).toBeInTheDocument();
  });

  it("opens error report modal when report button is clicked", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      const reportButton = screen.getByText("Report Issue");
      fireEvent.click(reportButton);
    });

    expect(screen.getByText("Report Error")).toBeInTheDocument();
  });

  it("expands and collapses error sections", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      // Error Overview should be expanded by default
      expect(screen.getByText("Category")).toBeInTheDocument();
    });

    // Collapse error overview
    const overviewButton = screen.getByText("Error Overview");
    fireEvent.click(overviewButton);

    expect(screen.queryByText("Category")).not.toBeInTheDocument();

    // Expand it again
    fireEvent.click(overviewButton);
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("shows technical details section", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      const technicalButton = screen.getByText("Technical Details");
      fireEvent.click(technicalButton);
    });

    expect(
      screen.getAllByText("AI service timeout occurred during processing")[0],
    ).toBeInTheDocument();
  });

  it("handles execution loading error", async () => {
    mockGetExecution.mockRejectedValue(new Error("Failed to load execution"));

    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Loading error details...")).toBeInTheDocument();
    });
  });

  it("handles missing execution gracefully", async () => {
    mockGetExecution.mockResolvedValue({
      ...mockFailedExecution,
      status: "completed",
      completedAt: undefined,
    } as WorkflowExecution);

    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("No error information available"),
      ).toBeInTheDocument();
    });
  });

  it("handles execution logs loading failure gracefully", async () => {
    mockGetExecutionLogs.mockRejectedValue(new Error("Failed to load logs"));

    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Workflow Execution Failed")).toBeInTheDocument();
      // Should still show the main error display even if logs fail
    });
  });

  it("calls onClose when close button is clicked", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      const closeButton = screen.getByRole("button", { name: "" }); // X button
      fireEvent.click(closeButton);
    });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("identifies failure point from logs", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Step 3: AI Analysis")).toBeInTheDocument();
    });
  });

  it("formats timestamps correctly", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      // Should show formatted dates (exact format depends on locale)
      expect(screen.getByText(/Started:/)).toBeInTheDocument();
      expect(screen.getByText(/Failed:/)).toBeInTheDocument();
    });
  });

  it("formats duration correctly", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Duration:/)).toBeInTheDocument();
      expect(screen.getByText(/5\.0m/)).toBeInTheDocument(); // 300000ms = 5 minutes
    });
  });

  it("shows step details when expanded", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      const logsButton = screen.getByText("Execution Logs (3 steps)");
      fireEvent.click(logsButton);
    });

    // Find and expand a step's details
    const stepDetails = screen.getAllByText("View Step Data")[0];
    fireEvent.click(stepDetails);

    expect(screen.getAllByText("Input:")[0]).toBeInTheDocument();
  });

  it("handles retry success callback", async () => {
    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      const retryButton = screen.getByText("Retry Execution");
      fireEvent.click(retryButton);
    });

    // Mock successful retry (this would be handled by RetryWorkflowModal)
    // The component should call onRetrySuccess when retry succeeds
    expect(screen.getByText("Retry Workflow Execution")).toBeInTheDocument();
  });

  it("displays different error categories with appropriate styling", async () => {
    const validationErrorExecution: WorkflowExecution = {
      ...mockFailedExecution,
      errorMessage: "Validation failed: required field missing",
    };

    mockGetExecution.mockResolvedValue({
      ...validationErrorExecution,
      completedAt: undefined,
    } as WorkflowExecution);

    renderWithErrorProvider(<WorkflowErrorDisplay {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Validation")).toBeInTheDocument();
    });
  });
});


