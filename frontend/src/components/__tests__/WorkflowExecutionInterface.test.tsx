import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Workflows from "../../pages/Workflows";
import { ErrorProvider } from "../../contexts/ErrorContext";
import { AuthProvider } from "../../contexts/AuthContext";

// Mock the API modules with all required exports
vi.mock("../../api/workflows", () => ({
  getWorkflows: vi.fn(),
  executeWorkflow: vi.fn(),
  getExecution: vi.fn(),
  getExecutionHistory: vi.fn(),
  getExecutionLogs: vi.fn(),
  getWorkflow: vi.fn(),
  createWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  cancelExecution: vi.fn(),
  getWorkflowPerformance: vi.fn(),
  getSystemPerformance: vi.fn(),
  getDashboardMetrics: vi.fn(),
}));

// Define proper interfaces for component props
interface WorkflowExecutionFormProps {
  onExecutionStart?: (executionId: string) => void;
  className?: string;
}

interface ExecutionStatusProps {
  executionId: string;
  onComplete?: (execution: {
    id: string;
    status: string;
    workflowId: string;
  }) => void;
}

interface WorkflowExecutionResultsProps {
  executionId: string;
  workflowId: string;
}

interface WorkflowExecutionHistoryProps {
  onExecutionSelect?: (execution: {
    id: string;
    workflowId: string;
    status: string;
  }) => void;
}

interface WorkflowErrorDisplayProps {
  executionId: string;
  onRetrySuccess?: (newExecutionId: string) => void;
}

// Mock the child components to focus on integration
vi.mock("../../components/WorkflowExecutionForm", () => ({
  default: ({ onExecutionStart, className }: WorkflowExecutionFormProps) => (
    <div data-testid="workflow-execution-form" className={className}>
      <button
        onClick={() => onExecutionStart?.("test-execution-id")}
        data-testid="start-execution-btn"
      >
        Start Execution
      </button>
    </div>
  ),
}));

vi.mock("../../components/ExecutionStatus", () => ({
  default: ({ executionId, onComplete }: ExecutionStatusProps) => (
    <div data-testid="execution-status">
      <span>Execution ID: {executionId}</span>
      <button
        onClick={() =>
          onComplete?.({
            id: executionId,
            status: "completed",
            workflowId: "test-workflow",
          })
        }
        data-testid="complete-execution-btn"
      >
        Complete Execution
      </button>
    </div>
  ),
}));

vi.mock("../../components/WorkflowExecutionResults", () => ({
  default: ({ executionId, workflowId }: WorkflowExecutionResultsProps) => (
    <div data-testid="execution-results">
      <span>Results for execution: {executionId}</span>
      <span>Workflow: {workflowId}</span>
    </div>
  ),
}));

vi.mock("../../components/WorkflowExecutionHistory", () => ({
  default: ({ onExecutionSelect }: WorkflowExecutionHistoryProps) => (
    <div data-testid="execution-history">
      <button
        onClick={() =>
          onExecutionSelect?.({
            id: "history-execution-id",
            workflowId: "history-workflow-id",
            status: "completed",
          })
        }
        data-testid="select-history-execution-btn"
      >
        Select History Execution
      </button>
    </div>
  ),
}));

vi.mock("../../components/WorkflowErrorDisplay", () => ({
  default: ({ executionId, onRetrySuccess }: WorkflowErrorDisplayProps) => (
    <div data-testid="error-display">
      <span>Error for execution: {executionId}</span>
      <button
        onClick={() => onRetrySuccess?.("retry-execution-id")}
        data-testid="retry-execution-btn"
      >
        Retry Execution
      </button>
    </div>
  ),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ErrorProvider>{component}</ErrorProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
};

describe("Workflow Execution Interface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the workflow execution interface with tabs", () => {
    renderWithProviders(<Workflows />);

    expect(screen.getByText("Workflow Execution")).toBeInTheDocument();
    expect(screen.getByText("Execute Workflow")).toBeInTheDocument();
    expect(screen.getByText("Execution History")).toBeInTheDocument();
  });

  it("shows execution form by default", () => {
    renderWithProviders(<Workflows />);

    expect(screen.getByTestId("workflow-execution-form")).toBeInTheDocument();
    expect(screen.getByText("Start New Execution")).toBeInTheDocument();
  });

  it("switches to execution status when execution starts", async () => {
    renderWithProviders(<Workflows />);

    const startButton = screen.getByTestId("start-execution-btn");
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByTestId("execution-status")).toBeInTheDocument();
      expect(
        screen.getByText("Execution ID: test-execution-id"),
      ).toBeInTheDocument();
    });
  });

  it("shows execution results when execution completes", async () => {
    renderWithProviders(<Workflows />);

    // Start execution
    const startButton = screen.getByTestId("start-execution-btn");
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByTestId("execution-status")).toBeInTheDocument();
    });

    // Complete execution
    const completeButton = screen.getByTestId("complete-execution-btn");
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(screen.getByTestId("execution-results")).toBeInTheDocument();
      expect(
        screen.getByText("Results for execution: test-execution-id"),
      ).toBeInTheDocument();
    });
  });

  it("switches to history tab and shows history component", async () => {
    renderWithProviders(<Workflows />);

    const historyTab = screen.getByText("Execution History");
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByTestId("execution-history")).toBeInTheDocument();
    });
  });

  it("allows selecting execution from history", async () => {
    renderWithProviders(<Workflows />);

    // Switch to history tab
    const historyTab = screen.getByText("Execution History");
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByTestId("execution-history")).toBeInTheDocument();
    });

    // Select execution from history
    const selectButton = screen.getByTestId("select-history-execution-btn");
    fireEvent.click(selectButton);

    await waitFor(() => {
      // Should switch back to execute tab and show results
      expect(screen.getByTestId("execution-results")).toBeInTheDocument();
      expect(
        screen.getByText("Results for execution: history-execution-id"),
      ).toBeInTheDocument();
    });
  });

  it("provides new execution button when viewing results", async () => {
    renderWithProviders(<Workflows />);

    // Start and complete execution
    const startButton = screen.getByTestId("start-execution-btn");
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByTestId("execution-status")).toBeInTheDocument();
    });

    const completeButton = screen.getByTestId("complete-execution-btn");
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(screen.getByTestId("execution-results")).toBeInTheDocument();
    });

    // Should have "Start New Execution" button
    const newExecutionButton = screen.getByText("Start New Execution");
    expect(newExecutionButton).toBeInTheDocument();

    // Click it to reset to form
    fireEvent.click(newExecutionButton);

    await waitFor(() => {
      expect(screen.getByTestId("workflow-execution-form")).toBeInTheDocument();
      expect(screen.getByText("Start New Execution")).toBeInTheDocument();
    });
  });
});


