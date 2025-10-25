import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { PerformanceDashboard } from "../PerformanceDashboard";
import * as workflowsApi from "../../api/workflows";

// Mock the API functions with all required exports
vi.mock("../../api/workflows", () => ({
  getWorkflowPerformance: vi.fn(),
  getSystemPerformance: vi.fn(),
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
  getDashboardMetrics: vi.fn(),
}));

// Mock Recharts components
vi.mock("recharts", () => ({
  LineChart: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="line-chart" {...props}>
      {children}
    </div>
  ),
  BarChart: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="bar-chart" {...props}>
      {children}
    </div>
  ),
  Line: (props: Record<string, unknown>) => (
    <div data-testid="line" {...props} />
  ),
  Bar: (props: Record<string, unknown>) => <div data-testid="bar" {...props} />,
  XAxis: (props: Record<string, unknown>) => (
    <div data-testid="x-axis" {...props} />
  ),
  YAxis: (props: Record<string, unknown>) => (
    <div data-testid="y-axis" {...props} />
  ),
  CartesianGrid: (props: Record<string, unknown>) => (
    <div data-testid="cartesian-grid" {...props} />
  ),
  Tooltip: (props: Record<string, unknown>) => (
    <div data-testid="tooltip" {...props} />
  ),
  Legend: (props: Record<string, unknown>) => (
    <div data-testid="legend" {...props} />
  ),
  ResponsiveContainer: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="responsive-container" {...props}>
      {children}
    </div>
  ),
}));

const mockPerformanceData = [
  {
    executionTime: 2500,
    resourceUsage: { cpu: 45, memory: 60 },
    workflowId: "test-workflow",
    timestamp: new Date("2024-01-01T10:00:00Z"),
    stepCount: 5,
    successRate: 0.95,
  },
  {
    executionTime: 3200,
    resourceUsage: { cpu: 55, memory: 70 },
    workflowId: "test-workflow",
    timestamp: new Date("2024-01-01T11:00:00Z"),
    stepCount: 6,
    successRate: 0.88,
  },
];

describe("PerformanceDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    vi.mocked(workflowsApi.getSystemPerformance).mockImplementation(
      () => new Promise(() => {}),
    );

    render(<PerformanceDashboard showSystemMetrics={true} />);

    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });

  it("renders error state when API call fails", async () => {
    vi.mocked(workflowsApi.getSystemPerformance).mockRejectedValue(
      new Error("API Error"),
    );

    render(<PerformanceDashboard showSystemMetrics={true} />);

    await waitFor(() => {
      expect(
        screen.getByText("Error Loading Performance Data"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load performance data"),
      ).toBeInTheDocument();
    });
  });

  it("renders no data state when no metrics available", async () => {
    vi.mocked(workflowsApi.getSystemPerformance).mockResolvedValue([]);

    render(<PerformanceDashboard showSystemMetrics={true} />);

    await waitFor(() => {
      expect(screen.getByText("No Performance Data")).toBeInTheDocument();
      expect(
        screen.getByText(
          "No performance metrics available yet. Execute some workflows to see data here.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("renders performance data with charts", async () => {
    vi.mocked(workflowsApi.getSystemPerformance).mockResolvedValue(
      mockPerformanceData,
    );

    render(<PerformanceDashboard showSystemMetrics={true} />);

    await waitFor(() => {
      expect(screen.getByText("System Performance")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });
  });

  it("switches between different chart types", async () => {
    vi.mocked(workflowsApi.getSystemPerformance).mockResolvedValue(
      mockPerformanceData,
    );

    render(<PerformanceDashboard showSystemMetrics={true} />);

    await waitFor(() => {
      expect(screen.getByText("Execution Time")).toBeInTheDocument();
    });

    // Click on Success Rate tab
    fireEvent.click(screen.getByText("Success Rate"));
    expect(screen.getByText("Success Rate")).toHaveClass("text-blue-600");

    // Click on Resource Usage tab
    fireEvent.click(screen.getByText("Resource Usage"));
    expect(screen.getByText("Resource Usage")).toHaveClass("text-blue-600");
  });

  it("displays summary statistics", async () => {
    vi.mocked(workflowsApi.getSystemPerformance).mockResolvedValue(
      mockPerformanceData,
    );

    render(<PerformanceDashboard showSystemMetrics={true} />);

    await waitFor(() => {
      expect(screen.getByText("Average")).toBeInTheDocument();
      expect(screen.getByText("Best")).toBeInTheDocument();
      expect(screen.getByText("Worst")).toBeInTheDocument();
      expect(screen.getByText("Data Points")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // Data points count
    });
  });

  it("calls workflow-specific API when workflowId provided", async () => {
    vi.mocked(workflowsApi.getWorkflowPerformance).mockResolvedValue(
      mockPerformanceData,
    );

    render(<PerformanceDashboard workflowId="test-workflow-123" />);

    await waitFor(() => {
      expect(workflowsApi.getWorkflowPerformance).toHaveBeenCalledWith(
        "test-workflow-123",
      );
      expect(screen.getByText("Workflow Performance")).toBeInTheDocument();
    });
  });

  it("refreshes data when refresh button clicked", async () => {
    vi.mocked(workflowsApi.getSystemPerformance).mockResolvedValue(
      mockPerformanceData,
    );

    render(<PerformanceDashboard showSystemMetrics={true} />);

    await waitFor(() => {
      expect(screen.getByText("System Performance")).toBeInTheDocument();
    });

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    expect(workflowsApi.getSystemPerformance).toHaveBeenCalledTimes(2);
  });

  it("handles retry on error", async () => {
    vi.mocked(workflowsApi.getSystemPerformance)
      .mockRejectedValueOnce(new Error("API Error"))
      .mockResolvedValueOnce(mockPerformanceData);

    render(<PerformanceDashboard showSystemMetrics={true} />);

    await waitFor(() => {
      expect(
        screen.getByText("Error Loading Performance Data"),
      ).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByText("Try Again");
    fireEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(screen.getByText("System Performance")).toBeInTheDocument();
    });
  });

  it("applies custom className", async () => {
    vi.mocked(workflowsApi.getSystemPerformance).mockResolvedValue(
      mockPerformanceData,
    );

    render(
      <PerformanceDashboard
        className="custom-class"
        showSystemMetrics={true}
      />,
    );

    await waitFor(() => {
      const dashboard = screen.getByRole("region", {
        name: "Workflow Performance Dashboard",
      });
      expect(dashboard).toHaveClass("custom-class");
    });
  });
});


