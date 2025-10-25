import { useEffect, useState, useRef, useCallback } from "react";
import { ExecutionLog } from "../components/ExecutionLogViewer";

export type WebSocketConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface InputData {
  [key: string]: string | number | boolean | null;
}

interface OutputData {
  [key: string]: string | number | boolean | null;
}

export interface WebSocketLogMessage {
  id: string;
  execution_id: string;
  step_name: string;
  step_type: string;
  input_data: InputData;
  output_data: OutputData;
  duration_ms: number;
  timestamp: string;
  error_message?: string;
  level: "info" | "warning" | "error";
}

export interface UseWebSocketLogsOptions {
  enabled?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  bufferSize?: number;
}

export interface UseWebSocketLogsReturn {
  logs: ExecutionLog[];
  connectionStatus: WebSocketConnectionStatus;
  error: string | null;
  reconnect: () => void;
  clearLogs: () => void;
  disconnect: () => void;
}

const DEFAULT_OPTIONS: Required<UseWebSocketLogsOptions> = {
  enabled: true,
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  bufferSize: 1000,
};

export const useWebSocketLogs = (
  executionId: string,
  options: UseWebSocketLogsOptions = {},
): UseWebSocketLogsReturn => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<WebSocketConnectionStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  // Get WebSocket URL from environment or default to localhost
  const getWebSocketUrl = useCallback(() => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const wsUrl = baseUrl.replace(/^http/, "ws");
    return `${wsUrl}/ws/executions/${executionId}/logs`;
  }, [executionId]);

  // Transform WebSocket message to ExecutionLog format
  const transformLogMessage = useCallback(
    (message: WebSocketLogMessage): ExecutionLog => {
      return {
        id: message.id,
        execution_id: message.execution_id,
        step_name: message.step_name,
        step_type: message.step_type,
        input_data: message.input_data as InputData,
        output_data: message.output_data as OutputData,
        duration_ms: message.duration_ms,
        timestamp: message.timestamp,
        error_message: message.error_message,
        level: message.level,
      };
    },
    [],
  );

  // Add new log with buffer management
  const addLog = useCallback(
    (newLog: ExecutionLog) => {
      if (!mountedRef.current) return;

      setLogs((prevLogs) => {
        const updatedLogs = [...prevLogs, newLog];
        // Keep only the most recent logs within buffer size
        if (updatedLogs.length > opts.bufferSize) {
          return updatedLogs.slice(-opts.bufferSize);
        }
        return updatedLogs;
      });
    },
    [opts.bufferSize],
  );

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!opts.enabled || !executionId || !mountedRef.current) return;

    try {
      setConnectionStatus("connecting");
      setError(null);

      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;

        setConnectionStatus("connected");
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const message: WebSocketLogMessage = JSON.parse(event.data);
          const transformedLog = transformLogMessage(message);
          addLog(transformedLog);
        } catch (parseError) {

          setError("Failed to parse log message");
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;

        setConnectionStatus("disconnected");
        wsRef.current = null;

        // Attempt reconnection if not a normal closure and we haven't exceeded attempts
        if (
          event.code !== 1000 && // Normal closure
          event.code !== 1001 && // Going away
          reconnectAttemptsRef.current < opts.reconnectAttempts
        ) {
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              connect();
            }
          }, opts.reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        if (!mountedRef.current) return;

        setConnectionStatus("error");
        setError("WebSocket connection error");
      };
    } catch (connectionError) {

      setConnectionStatus("error");
      setError("Failed to establish WebSocket connection");
    }
  }, [
    executionId,
    opts.enabled,
    opts.reconnectAttempts,
    opts.reconnectInterval,
    getWebSocketUrl,
    transformLogMessage,
    addLog,
  ]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Component unmounting");
      wsRef.current = null;
    }

    setConnectionStatus("disconnected");
  }, []);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    if (mountedRef.current) {
      setTimeout(connect, 100);
    }
  }, [disconnect, connect]);

  // Initialize connection
  useEffect(() => {
    if (opts.enabled && executionId) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [executionId, opts.enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    logs,
    connectionStatus,
    error,
    reconnect,
    clearLogs,
    disconnect,
  };
};


