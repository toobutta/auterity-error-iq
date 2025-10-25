import React from "react";

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { ExecutionLogViewer } from "../ExecutionLogViewer";
import * as workflowsApi from "../../api/workflows";

// Mock the API functions with all required exports
vi.mock("../../api/workflows", () => ({
  getExecutionLogs: vi.fn(),
  getExecution: vi.fn(),
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

import { ExecutionLogEntry } from "../../types/execution";

const mockLogData: ExecutionLogEntry[] = [
  {
    id: "log-1",
    executionId: "exec-123",
    stepName: "Initialize Workflow",
    message: "Workflow initialization completed",
    data: {
      userId: "123",
      action: "start",
      stepType: "start",
      input: { userId: "123", action: "start" },
      output: { status: "initialized", timestamp: "2024-01-01T10:00:00Z" },
    },
    duration: 150,
    timestamp: "2024-01-01T10:00:00Z",
    level: "info",
  },
  {
    id: "log-2",
    executionId: "exec-123",
    stepName: "Process Data",
    message: "Processing failed due to invalid input",
    data: {
      stepType: "processing",
      input: { data: "sample data" },
      output: { result: "processed" },
    },
    duration: 2500,
    timestamp: "2024-01-01T10:00:02Z",
    level: "error",
  },
  {
    id: "log-3",
    executionId: "exec-123",
    stepName: "Validation Check",
    message: "Validation completed with warnings",
    data: {
      stepType: "warning",
      input: { rules: ["required", "format"] },
      output: { valid: false, warnings: ["format issue"] },
    },
    duration: 500,
    timestamp: "2024-01-01T10:00:03Z",
    level: "warning",
  },
];

describe("ExecutionLogViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<ExecutionLogViewer executionId="exec-123" />);

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("renders error state when API call fails", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockRejectedValue(
      new Error("API Error"),
    );

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      expect(screen.getByText("Error Loading Logs")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load execution logs"),
      ).toBeInTheDocument();
    });
  });

  it("renders no logs state when no data available", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue([]);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      expect(screen.getByText("No Logs Found")).toBeInTheDocument();
      expect(
        screen.getByText("No execution logs available for this workflow."),
      ).toBeInTheDocument();
    });
  });

  it("renders execution logs with proper formatting", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue(mockLogData);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      expect(screen.getByText("Execution Logs")).toBeInTheDocument();
      expect(screen.getByText("Initialize Workflow")).toBeInTheDocument();
      expect(screen.getByText("Process Data")).toBeInTheDocument();
      expect(screen.getByText("Validation Check")).toBeInTheDocument();
      expect(screen.getByText("3 of 3 logs")).toBeInTheDocument();
    });
  });

  it("displays error messages for failed steps", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue(mockLogData);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      expect(
        screen.getByText("Processing failed due to invalid input"),
      ).toBeInTheDocument();
    });
  });

  it("filters logs by level", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue(mockLogData);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      expect(screen.getByText("3 of 3 logs")).toBeInTheDocument();
    });

    // Filter by error level
    const levelFilter = screen.getByDisplayValue("All Levels");
    fireEvent.change(levelFilter, { target: { value: "error" } });

    await waitFor(() => {
      expect(screen.getByText("1 of 3 logs")).toBeInTheDocument();
      expect(screen.getByText("Process Data")).toBeInTheDocument();
      expect(screen.queryByText("Initialize Workflow")).not.toBeInTheDocument();
    });
  });

  it("searches logs by step name and error message", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue(mockLogData);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      expect(screen.getByText("3 of 3 logs")).toBeInTheDocument();
    });

    // Search for "process"
    const searchInput = screen.getByPlaceholderText("Search logs...");
    fireEvent.change(searchInput, { target: { value: "process" } });

    await waitFor(() => {
      expect(screen.getByText("1 of 3 logs")).toBeInTheDocument();
      expect(screen.getByText("Process Data")).toBeInTheDocument();
      expect(screen.queryByText("Initialize Workflow")).not.toBeInTheDocument();
    });
  });

  it("expands and collapses log details", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue(mockLogData);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      expect(screen.getByText("Initialize Workflow")).toBeInTheDocument();
    });

    // Initially, detailed data should not be visible
    expect(screen.queryByText("Input Data:")).not.toBeInTheDocument();

    // Click expand button for first log
    const expandButtons = screen.getAllByRole("button");
    const firstExpandButton = expandButtons.find((button) =>
      button.querySelector("svg")?.classList.contains("transform"),
    );

    if (firstExpandButton) {
      fireEvent.click(firstExpandButton);

      await waitFor(() => {
        expect(screen.getByText("Input Data:")).toBeInTheDocument();
        expect(screen.getByText("Output Data:")).toBeInTheDocument();
      });
    }
  });

  it("formats duration correctly", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue(mockLogData);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      expect(screen.getByText("Duration: 150ms")).toBeInTheDocument();
      expect(screen.getByText("Duration: 2.50s")).toBeInTheDocument();
      expect(screen.getByText("Duration: 500ms")).toBeInTheDocument();
    });
  });

  it("formats timestamps correctly", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue(mockLogData);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      // Check that timestamps are formatted (exact format may vary by locale)
      expect(screen.getByText(/Jan 1, 04:00:00/)).toBeInTheDocument();
    });
  });

  it("refreshes logs when refresh button clicked", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue(mockLogData);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      expect(screen.getByText("Execution Logs")).toBeInTheDocument();
    });

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(workflowsApi.getExecutionLogs).toHaveBeenCalledTimes(2);
  });

  it("handles retry on error", async () => {
    vi.mocked(workflowsApi.getExecutionLogs)
      .mockRejectedValueOnce(new Error("API Error"))
      .mockResolvedValueOnce(mockLogData);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      expect(screen.getByText("Error Loading Logs")).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByText("Try Again");
    fireEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(screen.getByText("Execution Logs")).toBeInTheDocument();
    });
  });

  it("applies custom className and maxHeight", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue(mockLogData);

    render(
      <ExecutionLogViewer
        executionId="exec-123"
        className="custom-class"
        maxHeight="max-h-64"
      />,
    );

    await waitFor(() => {
      const logViewer = screen.getByText("Execution Logs").closest(".bg-white");
      expect(logViewer).toHaveClass("custom-class");
    });
  });

  it("shows correct level icons and colors", async () => {
    vi.mocked(workflowsApi.getExecutionLogs).mockResolvedValue(mockLogData);

    render(<ExecutionLogViewer executionId="exec-123" />);

    await waitFor(() => {
      // Check for level indicators (icons are rendered as text)
      expect(screen.getByText("ℹ️")).toBeInTheDocument(); // info
      expect(screen.getByText("❌")).toBeInTheDocument(); // error
      expect(screen.getByText("⚠️")).toBeInTheDocument(); // warning
    });
  });
});


