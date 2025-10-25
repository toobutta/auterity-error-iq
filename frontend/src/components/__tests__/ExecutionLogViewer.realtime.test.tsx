import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ExecutionLogViewer } from "../ExecutionLogViewer";
import * as workflowsApi from "../../api/workflows";
import { useWebSocketLogs } from "../../hooks/useWebSocketLogs";

// Mock the API
jest.mock("../../api/workflows");
const mockGetExecutionLogs =
  workflowsApi.getExecutionLogs as jest.MockedFunction<
    typeof workflowsApi.getExecutionLogs
  >;

// Mock the WebSocket hook
jest.mock("../../hooks/useWebSocketLogs");
const mockUseWebSocketLogs = useWebSocketLogs as jest.MockedFunction<
  typeof useWebSocketLogs
>;

describe("ExecutionLogViewer - Real-time Integration", () => {
  const mockExecutionId = "test-execution-123";

  const mockWebSocketReturn = {
    logs: [],
    connectionStatus: "disconnected" as const,
    error: null,
    reconnect: jest.fn(),
    clearLogs: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    mockGetExecutionLogs.mockResolvedValue([]);
    mockUseWebSocketLogs.mockReturnValue(mockWebSocketReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should show real-time indicator when enabled", async () => {
    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Real-time")).toBeInTheDocument();
    });
  });

  it("should not show real-time indicator when disabled", async () => {
    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={false}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Real-time")).not.toBeInTheDocument();
    });
  });

  it("should display connection status when real-time is enabled", async () => {
    mockUseWebSocketLogs.mockReturnValue({
      ...mockWebSocketReturn,
      connectionStatus: "connected",
    });

    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Live")).toBeInTheDocument();
    });
  });

  it("should show connecting status", async () => {
    mockUseWebSocketLogs.mockReturnValue({
      ...mockWebSocketReturn,
      connectionStatus: "connecting",
    });

    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Connecting...")).toBeInTheDocument();
    });
  });

  it("should show error status and reconnect button", async () => {
    mockUseWebSocketLogs.mockReturnValue({
      ...mockWebSocketReturn,
      connectionStatus: "error",
      error: "Connection failed",
    });

    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Connection failed")).toBeInTheDocument();
      expect(screen.getByText("Reconnect")).toBeInTheDocument();
    });
  });

  it("should call reconnect when reconnect button is clicked", async () => {
    const mockReconnect = jest.fn();
    mockUseWebSocketLogs.mockReturnValue({
      ...mockWebSocketReturn,
      connectionStatus: "error",
      reconnect: mockReconnect,
    });

    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    const reconnectButton = await screen.findByText("Reconnect");
    fireEvent.click(reconnectButton);

    expect(mockReconnect).toHaveBeenCalledTimes(1);
  });

  it("should display real-time logs", async () => {
    const mockLogs = [
      {
        id: "log-1",
        execution_id: mockExecutionId,
        step_name: "Real-time Step",
        step_type: "process",
        input_data: { test: "input" },
        output_data: { test: "output" },
        duration_ms: 1500,
        timestamp: "2023-01-01T12:00:00Z",
        level: "info" as const,
      },
    ];

    mockUseWebSocketLogs.mockReturnValue({
      ...mockWebSocketReturn,
      logs: mockLogs,
      connectionStatus: "connected",
    });

    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Real-time Step")).toBeInTheDocument();
      expect(screen.getByText("1 of 1 logs")).toBeInTheDocument();
    });
  });

  it("should show auto-scroll toggle button", async () => {
    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Auto-scroll")).toBeInTheDocument();
    });
  });

  it("should show clear button when real-time is enabled", async () => {
    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Clear")).toBeInTheDocument();
    });
  });

  it("should call clearLogs when clear button is clicked", async () => {
    const mockClearLogs = jest.fn();
    mockUseWebSocketLogs.mockReturnValue({
      ...mockWebSocketReturn,
      clearLogs: mockClearLogs,
    });

    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    const clearButton = await screen.findByText("Clear");
    fireEvent.click(clearButton);

    expect(mockClearLogs).toHaveBeenCalledTimes(1);
  });

  it("should not show refresh button when real-time is enabled", async () => {
    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Refresh")).not.toBeInTheDocument();
    });
  });

  it("should show refresh button when real-time is disabled", async () => {
    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });
  });

  it("should not call WebSocket hook when real-time is disabled", () => {
    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={false}
      />,
    );

    expect(mockUseWebSocketLogs).toHaveBeenCalledWith(mockExecutionId, {
      enabled: false,
    });
  });

  it("should call WebSocket hook with correct parameters when enabled", () => {
    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={true}
      />,
    );

    expect(mockUseWebSocketLogs).toHaveBeenCalledWith(mockExecutionId, {
      enabled: true,
    });
  });

  it("should handle mixed logs from API and WebSocket", async () => {
    // Mock API logs
    mockGetExecutionLogs.mockResolvedValue([
      {
        id: "api-log-1",
        executionId: mockExecutionId,
        stepName: "API Step",
        timestamp: "2023-01-01T11:00:00Z",
        level: "info",
        message: "API log message",
        data: { source: "api" },
        duration: 500,
      },
    ]);

    // Mock WebSocket logs
    const wsLogs = [
      {
        id: "ws-log-1",
        execution_id: mockExecutionId,
        step_name: "WebSocket Step",
        step_type: "process",
        input_data: { source: "websocket" },
        output_data: {},
        duration_ms: 750,
        timestamp: "2023-01-01T12:00:00Z",
        level: "info" as const,
      },
    ];

    mockUseWebSocketLogs.mockReturnValue({
      ...mockWebSocketReturn,
      logs: wsLogs,
      connectionStatus: "connected",
    });

    render(
      <ExecutionLogViewer
        executionId={mockExecutionId}
        enableRealTime={false} // This will fetch API logs
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("API Step")).toBeInTheDocument();
    });
  });
});


