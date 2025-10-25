/**
 * WebSocket utilities for API client integration
 */

export interface WebSocketConfig {
  baseUrl?: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp?: string;
}

export interface LogMessage {
  level: string;
  message: string;
  timestamp: string;
  executionId?: string;
}

export interface StatusUpdate {
  status: string;
  progress?: number;
  message?: string;
  timestamp: string;
  executionId: string;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectCount = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers = new Map<string, Set<(data: unknown) => void>>();
  private statusHandlers = new Set<
    (status: "connecting" | "connected" | "disconnected" | "error") => void
  >();

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      baseUrl:
        config.baseUrl ||
        (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(
          /^http/,
          "ws",
        ),
      reconnectAttempts: config.reconnectAttempts || 5,
      reconnectInterval: config.reconnectInterval || 3000,
      heartbeatInterval: config.heartbeatInterval || 30000,
    };
  }

  /**
   * Connect to a WebSocket endpoint
   */
  connect(endpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = `${this.config.baseUrl}${endpoint}`;
        this.ws = new WebSocket(url);

        this.notifyStatusHandlers("connecting");

        this.ws.onopen = () => {
          this.reconnectCount = 0;
          this.notifyStatusHandlers("connected");
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {

          }
        };

        this.ws.onclose = (event) => {
          this.stopHeartbeat();
          this.notifyStatusHandlers("disconnected");

          // Attempt reconnection for unexpected closures
          if (
            event.code !== 1000 &&
            event.code !== 1001 &&
            this.reconnectCount < this.config.reconnectAttempts
          ) {
            this.scheduleReconnect(endpoint);
          }
        };

        this.ws.onerror = () => {
          this.notifyStatusHandlers("error");
          reject(new Error("WebSocket connection failed"));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {

    }
  }

  /**
   * Subscribe to messages of a specific type
   */
  subscribe(messageType: string, handler: (data: unknown) => void): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }

    this.messageHandlers.get(messageType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(messageType);
        }
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(
    handler: (
      status: "connecting" | "connected" | "disconnected" | "error",
    ) => void,
  ): () => void {
    this.statusHandlers.add(handler);

    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): "connecting" | "connected" | "disconnected" | "error" {
    if (!this.ws) return "disconnected";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
      default:
        return "disconnected";
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {

        }
      });
    }
  }

  private notifyStatusHandlers(
    status: "connecting" | "connected" | "disconnected" | "error",
  ): void {
    this.statusHandlers.forEach((handler) => {
      try {
        handler(status);
      } catch (error) {

      }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: "ping", data: null });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(endpoint: string): void {
    this.clearReconnectTimer();
    this.reconnectCount++;

    this.reconnectTimer = setTimeout(() => {

      this.connect(endpoint).catch((error) => {

      });
    }, this.config.reconnectInterval);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// Global WebSocket client instance
export const wsClient = new WebSocketClient();

// Utility functions for common WebSocket operations
export const connectToExecutionLogs = (executionId: string) => {
  return wsClient.connect(`/ws/executions/${executionId}/logs`);
};

export const connectToExecutionStatus = (executionId: string) => {
  return wsClient.connect(`/ws/executions/${executionId}/status`);
};

export const subscribeToLogs = (handler: (log: LogMessage) => void) => {
  return wsClient.subscribe("log", handler as (data: unknown) => void);
};

export const subscribeToStatusUpdates = (
  handler: (status: StatusUpdate) => void,
) => {
  return wsClient.subscribe(
    "status_update",
    handler as (data: unknown) => void,
  );
};


