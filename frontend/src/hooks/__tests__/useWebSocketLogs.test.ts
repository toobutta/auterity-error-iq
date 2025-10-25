import { renderHook, act } from "@testing-library/react";
import { useWebSocketLogs } from "../useWebSocketLogs";

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 10);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent("close", {
        code: code || 1000,
        reason: reason || "",
      });
      this.onclose(closeEvent);
    }
  }

  send(_data: string) {
    // Mock send - in real tests you might want to capture this
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: unknown) {
    if (this.onmessage && this.readyState === MockWebSocket.OPEN) {
      const messageEvent = new MessageEvent("message", {
        data: JSON.stringify(data),
      });
      this.onmessage(messageEvent);
    }
  }

  // Helper method to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }
}

// Mock global WebSocket
(global as unknown as { WebSocket: unknown }).WebSocket =
  MockWebSocket as unknown as WebSocket;

// Mock environment variable
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.VITE_API_BASE_URL = "http://localhost:8000";
});

afterEach(() => {
  process.env = originalEnv;
});

describe("useWebSocketLogs", () => {
  const mockExecutionId = "test-execution-id";
  const getMockWebSocket = (): MockWebSocket => {
    const WS = (
      global as unknown as {
        WebSocket: typeof MockWebSocket & { lastInstance?: MockWebSocket };
      }
    ).WebSocket;
    return (WS as unknown as { lastInstance?: MockWebSocket })
      .lastInstance as MockWebSocket;
  };

  beforeEach(() => {
    // Capture the WebSocket instance for testing
    const OriginalWebSocket = (
      global as unknown as { WebSocket: typeof MockWebSocket }
    ).WebSocket;
    class TestWebSocket extends (OriginalWebSocket as unknown as typeof MockWebSocket) {
      static lastInstance?: MockWebSocket;
      constructor(url: string) {
        super(url);
        TestWebSocket.lastInstance = this as unknown as MockWebSocket;
      }
    }
    (global as unknown as { WebSocket: unknown }).WebSocket =
      TestWebSocket as unknown as WebSocket;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, { enabled: false }),
    );

    expect(result.current.logs).toEqual([]);
    expect(result.current.connectionStatus).toBe("disconnected");
    expect(result.current.error).toBeNull();
  });

  it("should connect to WebSocket when enabled", async () => {
    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, { enabled: true }),
    );

    expect(result.current.connectionStatus).toBe("connecting");

    // Wait for connection to open
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(result.current.connectionStatus).toBe("connected");
    expect(result.current.error).toBeNull();
  });

  it("should not connect when disabled", () => {
    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, { enabled: false }),
    );

    expect(result.current.connectionStatus).toBe("disconnected");
  });

  it("should receive and process log messages", async () => {
    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, { enabled: true }),
    );

    // Wait for connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    const mockLogMessage = {
      id: "log-1",
      execution_id: mockExecutionId,
      step_name: "Test Step",
      step_type: "process",
      input_data: { test: "input" },
      output_data: { test: "output" },
      duration_ms: 1000,
      timestamp: "2023-01-01T00:00:00Z",
      level: "info",
    };

    // Simulate receiving a message
    await act(async () => {
      getMockWebSocket().simulateMessage(mockLogMessage);
    });

    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0]).toMatchObject({
      id: "log-1",
      execution_id: mockExecutionId,
      step_name: "Test Step",
      level: "info",
    });
  });

  it("should handle connection errors", async () => {
    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, { enabled: true }),
    );

    // Wait for connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // Simulate error
    await act(async () => {
      getMockWebSocket().simulateError();
    });

    expect(result.current.connectionStatus).toBe("error");
    expect(result.current.error).toBe("WebSocket connection error");
  });

  it("should attempt reconnection on unexpected close", async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, {
        enabled: true,
        reconnectAttempts: 2,
        reconnectInterval: 1000,
      }),
    );

    // Wait for initial connection
    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    expect(result.current.connectionStatus).toBe("connected");

    // Simulate unexpected close (not normal closure)
    await act(async () => {
      getMockWebSocket().close(1006, "Connection lost");
    });

    expect(result.current.connectionStatus).toBe("disconnected");

    // Advance timer to trigger reconnection
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Should attempt to reconnect
    expect(result.current.connectionStatus).toBe("connecting");
  });

  it("should not reconnect on normal close", async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, { enabled: true }),
    );

    // Wait for connection
    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    // Simulate normal close
    await act(async () => {
      getMockWebSocket().close(1000, "Normal closure");
    });

    expect(result.current.connectionStatus).toBe("disconnected");

    // Advance timer - should not reconnect
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.connectionStatus).toBe("disconnected");
  });

  it("should clear logs when clearLogs is called", async () => {
    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, { enabled: true }),
    );

    // Wait for connection and add a log
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      getMockWebSocket().simulateMessage({
        id: "log-1",
        execution_id: mockExecutionId,
        step_name: "Test",
        step_type: "process",
        input_data: {},
        output_data: {},
        duration_ms: 100,
        timestamp: "2023-01-01T00:00:00Z",
        level: "info",
      });
    });

    expect(result.current.logs).toHaveLength(1);

    // Clear logs
    await act(async () => {
      result.current.clearLogs();
    });

    expect(result.current.logs).toHaveLength(0);
  });

  it("should manually reconnect when reconnect is called", async () => {
    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, { enabled: true }),
    );

    // Wait for connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // Close connection
    await act(async () => {
      getMockWebSocket().close(1006, "Connection lost");
    });

    expect(result.current.connectionStatus).toBe("disconnected");

    // Manual reconnect
    await act(async () => {
      result.current.reconnect();
      await new Promise((resolve) => setTimeout(resolve, 120)); // Wait for reconnection
    });

    expect(result.current.connectionStatus).toBe("connected");
  });

  it("should respect buffer size limit", async () => {
    const bufferSize = 3;
    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, {
        enabled: true,
        bufferSize,
      }),
    );

    // Wait for connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // Add more logs than buffer size
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        getMockWebSocket().simulateMessage({
          id: `log-${i}`,
          execution_id: mockExecutionId,
          step_name: `Test ${i}`,
          step_type: "process",
          input_data: {},
          output_data: {},
          duration_ms: 100,
          timestamp: `2023-01-01T00:0${i}:00Z`,
          level: "info",
        });
      });
    }

    // Should only keep the most recent logs within buffer size
    expect(result.current.logs).toHaveLength(bufferSize);
    expect(result.current.logs[0].id).toBe("log-2"); // First log should be log-2 (oldest kept)
    expect(result.current.logs[2].id).toBe("log-4"); // Last log should be log-4 (newest)
  });

  it("should handle malformed JSON messages gracefully", async () => {
    const { result } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, { enabled: true }),
    );

    // Wait for connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // Simulate malformed message
    await act(async () => {
      if (getMockWebSocket().onmessage) {
        const malformedEvent = new MessageEvent("message", {
          data: "invalid json",
        });
        getMockWebSocket().onmessage!(malformedEvent);
      }
    });

    expect(result.current.error).toBe("Failed to parse log message");
    expect(result.current.logs).toHaveLength(0);
  });

  it("should disconnect on unmount", async () => {
    const { result, unmount } = renderHook(() =>
      useWebSocketLogs(mockExecutionId, { enabled: true }),
    );

    // Wait for connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(result.current.connectionStatus).toBe("connected");

    // Unmount component
    unmount();

    // WebSocket should be closed
    expect(getMockWebSocket().readyState).toBe(MockWebSocket.CLOSED);
  });
});


