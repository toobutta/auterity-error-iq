import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkflowExecutionHistory from "../WorkflowExecutionHistory";
import * as workflowsApi from "../../api/workflows";

// Mock the workflows API with all required functions
vi.mock("../../api/workflows", () => ({
  getExecutionHistory: vi.fn(),
  getExecution: vi.fn(),
  getExecutionLogs: vi.fn(),
  executeWorkflow: vi.fn(),
  getWorkflows: vi.fn(),
  getWorkflow: vi.fn(),
  createWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  cancelExecution: vi.fn(),
  getWorkflowPerformance: vi.fn(),
  getSystemPerformance: vi.fn(),
  getDashboardMetrics: vi.fn(),
}));

const mockGetExecutionHistory = vi.mocked(workflowsApi.getExecutionHistory);

const mockExecutions = [
  {
    id: "execution-1",
    workflowId: "workflow-1",
    workflowName: "Customer Inquiry Workflow",
    status: "completed" as const,
    inputData: { customerName: "John Doe" },
    outputData: { response: "Thank you for your inquiry" },
    startedAt: "2023-01-01T10:00:00Z",
    completedAt: "2023-01-01T10:05:00Z",
    duration: 300000,
  },
  {
    id: "execution-2",
    workflowId: "workflow-2",
    workflowName: "Lead Processing Workflow",
    status: "failed" as const,
    inputData: { leadData: "test" },
    startedAt: "2023-01-01T11:00:00Z",
    completedAt: "2023-01-01T11:02:00Z",
    errorMessage: "AI service unavailable",
    duration: 120000,
  },
  {
    id: "execution-3",
    workflowId: "workflow-1",
    workflowName: "Customer Inquiry Workflow",
    status: "running" as const,
    inputData: { customerName: "Jane Smith" },
    startedAt: "2023-01-01T12:00:00Z",
  },
];

const mockHistoryResponse = {
  executions: mockExecutions,
  total: 3,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

describe("WorkflowExecutionHistory", () => {
  const user = userEvent.setup();
  const mockOnExecutionSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetExecutionHistory.mockResolvedValue(mockHistoryResponse);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    expect(screen.getByText("Loading executions...")).toBeInTheDocument();
  });

  it("renders execution history after loading", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Execution History")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText("Customer Inquiry Workflow")).toHaveLength(2);
    });

    expect(screen.getByText("Lead Processing Workflow")).toBeInTheDocument();
  });

  it("displays execution data correctly", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Customer Inquiry Workflow")).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();

    // Check execution IDs (truncated) - should have multiple instances
    expect(screen.getAllByText(/ID: executio/).length).toBeGreaterThan(0);
  });

  it("formats dates correctly", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Customer Inquiry Workflow")).toBeInTheDocument();
    });

    // Check that dates are formatted (exact format depends on locale)
    const dateElements = screen.getAllByText(/2023/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("formats duration correctly", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText("5.0m")).toBeInTheDocument(); // 300000ms = 5 minutes
    });

    expect(screen.getByText("2.0m")).toBeInTheDocument(); // 120000ms = 2 minutes
  });

  it("handles search functionality", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Search by workflow name/),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by workflow name/);
    const searchButton = screen.getByRole("button", { name: /Search/ });

    await user.type(searchInput, "Customer");
    await user.click(searchButton);

    expect(mockGetExecutionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "Customer",
        page: 1,
      }),
    );
  });

  it("handles status filtering", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("All statuses")).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue("All statuses");
    await user.selectOptions(statusSelect, "completed");

    const searchButton = screen.getByRole("button", { name: /Search/ });
    await user.click(searchButton);

    expect(mockGetExecutionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        page: 1,
      }),
    );
  });

  it("handles date range filtering", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument();
    });

    const startDateInput = screen.getByLabelText(/Start Date/);
    const endDateInput = screen.getByLabelText(/End Date/);
    const searchButton = screen.getByRole("button", { name: /Search/ });

    await user.type(startDateInput, "2023-01-01");
    await user.type(endDateInput, "2023-01-31");
    await user.click(searchButton);

    expect(mockGetExecutionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: "2023-01-01",
        endDate: "2023-01-31",
        page: 1,
      }),
    );
  });

  it("handles sorting by clicking column headers", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Execution History")).toBeInTheDocument();
    });

    // Find the Status header in the table (not the filter label)
    const statusHeaders = screen.getAllByText("Status");
    const tableStatusHeader = statusHeaders.find(
      (element) => element.closest("th") !== null,
    );

    expect(tableStatusHeader).toBeInTheDocument();

    // Click the status header to sort by status
    fireEvent.click(tableStatusHeader!);

    // Wait for the API to be called with the new sort parameters
    await waitFor(() => {
      expect(mockGetExecutionHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "status",
          sortOrder: "desc",
          page: 1,
        }),
      );
    });
  });

  it("handles pagination", async () => {
    const paginatedResponse = {
      ...mockHistoryResponse,
      totalPages: 3,
      page: 1,
    };
    mockGetExecutionHistory.mockResolvedValue(paginatedResponse);

    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /Next/ });
    await user.click(nextButton);

    expect(mockGetExecutionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
      }),
    );
  });

  it("handles page size changes", async () => {
    const paginatedResponse = {
      ...mockHistoryResponse,
      totalPages: 2,
    };
    mockGetExecutionHistory.mockResolvedValue(paginatedResponse);

    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    });

    const pageSizeSelect = screen.getByDisplayValue("10");
    await user.selectOptions(pageSizeSelect, "25");

    expect(mockGetExecutionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 25,
        page: 1,
      }),
    );
  });

  it("handles execution selection", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getAllByText("View Details")[0]).toBeInTheDocument();
    });

    const viewDetailsButtons = screen.getAllByText("View Details");
    await user.click(viewDetailsButtons[0]);

    expect(mockOnExecutionSelect).toHaveBeenCalledWith(mockExecutions[0]);
  });

  it("shows error state when API fails", async () => {
    const errorMessage = "Failed to load execution history";
    mockGetExecutionHistory.mockRejectedValue(new Error(errorMessage));

    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("shows empty state when no executions found", async () => {
    const emptyResponse = {
      executions: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
    mockGetExecutionHistory.mockResolvedValue(emptyResponse);

    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText("No executions found")).toBeInTheDocument();
    });
  });

  it("handles clear filters", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Search by workflow name/),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by workflow name/);
    const statusSelect = screen.getByDisplayValue("All statuses");
    const startDateInput = screen.getByLabelText(/Start Date/);
    const clearButton = screen.getByRole("button", { name: /Clear/ });

    // Set some filters
    await user.type(searchInput, "test");
    await user.selectOptions(statusSelect, "completed");
    await user.type(startDateInput, "2023-01-01");

    // Clear filters
    await user.click(clearButton);

    expect((searchInput as HTMLInputElement).value).toBe("");
    expect((statusSelect as HTMLSelectElement).value).toBe("");
    expect((startDateInput as HTMLInputElement).value).toBe("");
  });

  it("shows results summary", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Showing 3 of 3 executions")).toBeInTheDocument();
    });
  });

  it("disables pagination buttons appropriately", async () => {
    const multiPageResponse = {
      ...mockHistoryResponse,
      totalPages: 3,
      page: 1,
    };
    mockGetExecutionHistory.mockResolvedValue(multiPageResponse);

    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Previous/ })).toBeDisabled();
    });

    expect(screen.getByRole("button", { name: /Next/ })).not.toBeDisabled();
  });

  it("shows error indicator for failed executions", async () => {
    render(
      <WorkflowExecutionHistory onExecutionSelect={mockOnExecutionSelect} />,
    );

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    const errorElement = screen.getByText("Error");
    expect(errorElement).toHaveAttribute("title", "AI service unavailable");
  });

  it("refreshes data when refreshTrigger changes", async () => {
    const { rerender } = render(
      <WorkflowExecutionHistory
        onExecutionSelect={mockOnExecutionSelect}
        refreshTrigger={1}
      />,
    );

    await waitFor(() => {
      expect(mockGetExecutionHistory).toHaveBeenCalledTimes(1);
    });

    rerender(
      <WorkflowExecutionHistory
        onExecutionSelect={mockOnExecutionSelect}
        refreshTrigger={2}
      />,
    );

    await waitFor(() => {
      expect(mockGetExecutionHistory).toHaveBeenCalledTimes(2);
    });
  });
});


