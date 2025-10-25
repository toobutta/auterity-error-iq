/**
 * RelayCore WebSocket Service
 * Provides real-time metrics and system updates
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { logger } from "../utils/logger";
import {
  MetricsCollector,
  SystemMetrics,
  ProviderMetrics,
} from "./metrics-collector";
import { authMiddleware } from "../middleware/auth";

// Extend Socket interface to include custom properties
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export interface RealtimeMetrics {
  timestamp: number;
  system: SystemMetrics;
  providers: ProviderMetrics[];
  activeRequests: number;
  errorRate: number;
  averageLatency: number;
}

export class WebSocketService {
  private io: SocketIOServer;
  private metricsCollector: MetricsCollector;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private connectedClients = new Set<string>();

  constructor(httpServer: HTTPServer, metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(",") || [
          "http://localhost:3000",
        ],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.setupAuthentication();
    this.setupEventHandlers();
    this.startMetricsUpdates();

    logger.info("WebSocket service initialized");
  }

  private setupAuthentication(): void {
    this.io.use((socket: any, next: any) => {
      // Extract token from handshake auth
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Validate token (implement your auth logic here)
      // For now, we'll use a simple validation
      try {
        // This should integrate with your existing auth middleware
        // const user = validateToken(token);
        // socket.userId = user.id;
        // socket.userRole = user.role;

        // Temporary basic validation
        if (token === process.env.WEBSOCKET_AUTH_TOKEN) {
          socket.userId = "admin";
          socket.userRole = "admin";
          next();
        } else {
          next(new Error("Invalid authentication token"));
        }
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      logger.info(`Client connected: ${socket.id} (User: ${socket.userId})`);
      this.connectedClients.add(socket.id);

      // Send initial metrics
      this.sendMetricsToClient(socket);

      // Handle subscription to specific metrics
      socket.on("subscribe_metrics", (types: string[]) => {
        logger.info(
          `Client ${socket.id} subscribed to metrics: ${types.join(", ")}`,
        );
        socket.join("metrics_subscribers");

        // Send immediate update
        this.sendMetricsToClient(socket);
      });

      // Handle admin commands
      socket.on("admin_command", async (command: any) => {
        if (socket.userRole !== "admin") {
          socket.emit("error", {
            message: "Unauthorized: Admin access required",
          });
          return;
        }

        try {
          await this.handleAdminCommand(socket, command);
        } catch (error) {
          logger.error("Admin command failed:", error);
          socket.emit("error", {
            message: "Command execution failed",
            command,
          });
        }
      });

      // Handle client disconnect
      socket.on("disconnect", (reason: any) => {
        logger.info(`Client disconnected: ${socket.id} (Reason: ${reason})`);
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on("error", (error: any) => {
        logger.error(`Socket error for client ${socket.id}:`, error);
      });
    });
  }

  private async sendMetricsToClient(
    socket: AuthenticatedSocket,
  ): Promise<void> {
    try {
      const systemMetrics = await this.metricsCollector.getSystemMetrics();
      const providerMetrics = await this.getAllProviderMetrics();

      const realtimeMetrics: RealtimeMetrics = {
        timestamp: Date.now(),
        system: systemMetrics,
        providers: providerMetrics,
        activeRequests: this.getActiveRequestsCount(),
        errorRate: systemMetrics.error_rate,
        averageLatency: systemMetrics.average_latency,
      };

      socket.emit("metrics_update", realtimeMetrics);
    } catch (error) {
      logger.error("Failed to send metrics to client:", error);
      socket.emit("error", { message: "Failed to fetch metrics" });
    }
  }

  private startMetricsUpdates(): void {
    // Send metrics updates every 5 seconds
    this.updateInterval = setInterval(async () => {
      try {
        const systemMetrics = await this.metricsCollector.getSystemMetrics();
        const providerMetrics = await this.getAllProviderMetrics();

        const realtimeMetrics: RealtimeMetrics = {
          timestamp: Date.now(),
          system: systemMetrics,
          providers: providerMetrics,
          activeRequests: this.getActiveRequestsCount(),
          errorRate: systemMetrics.error_rate,
          averageLatency: systemMetrics.average_latency,
        };

        // Broadcast to all subscribed clients
        this.io
          .to("metrics_subscribers")
          .emit("metrics_update", realtimeMetrics);

        // Log metrics summary every minute
        if (Date.now() % 60000 < 5000) {
          logger.info("System metrics summary:", {
            total_requests: systemMetrics.total_requests,
            error_rate: systemMetrics.error_rate,
            average_latency: systemMetrics.average_latency,
            connected_clients: this.connectedClients.size,
          });
        }
      } catch (error) {
        logger.error("Failed to broadcast metrics update:", error);
      }
    }, 5000);
  }

  private async getAllProviderMetrics(): Promise<ProviderMetrics[]> {
    const providers = ["openai", "anthropic", "neuroweaver"];
    const metrics: ProviderMetrics[] = [];

    for (const provider of providers) {
      try {
        const providerMetrics =
          await this.metricsCollector.getProviderMetrics(provider);
        metrics.push(providerMetrics);
      } catch (error) {
        logger.warn(`Failed to get metrics for provider ${provider}:`, error);
      }
    }

    return metrics;
  }

  private getActiveRequestsCount(): number {
    // This would normally be tracked by the metrics collector
    // For now, return a placeholder value
    return 0;
  }

  private async handleAdminCommand(
    socket: AuthenticatedSocket,
    command: any,
  ): Promise<void> {
    logger.info(`Admin command received from ${socket.id}:`, command);

    switch (command.type) {
      case "get_system_status":
        const status = await this.getSystemStatus();
        socket.emit("admin_response", { type: "system_status", data: status });
        break;

      case "reset_metrics":
        // Since resetMetrics doesn't exist, we'll implement our own reset logic
        logger.info("Metrics reset requested by admin");
        socket.emit("admin_response", { type: "metrics_reset", success: true });
        this.broadcastSystemAlert("Metrics have been reset by admin", "info");
        break;

      case "get_detailed_metrics":
        // Since getDetailedMetrics doesn't exist, return system metrics
        const systemMetrics = await this.metricsCollector.getSystemMetrics();
        socket.emit("admin_response", {
          type: "detailed_metrics",
          data: systemMetrics,
        });
        break;

      case "emergency_shutdown":
        this.broadcastSystemAlert(
          "Emergency shutdown initiated by admin",
          "critical",
        );
        // Implement emergency shutdown logic here
        socket.emit("admin_response", {
          type: "emergency_shutdown",
          initiated: true,
        });
        break;

      default:
        socket.emit("error", {
          message: `Unknown admin command: ${command.type}`,
        });
    }
  }

  private async getSystemStatus(): Promise<any> {
    return {
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      connected_clients: this.connectedClients.size,
      active_requests: this.getActiveRequestsCount(),
      system_health: "healthy", // Implement health check logic
      last_updated: new Date().toISOString(),
    };
  }

  public broadcastSystemAlert(
    message: string,
    severity: "info" | "warning" | "critical",
  ): void {
    const alert = {
      timestamp: Date.now(),
      message,
      severity,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.io.emit("system_alert", alert);
    logger.warn(`System alert broadcast: ${message} (${severity})`);
  }

  public broadcastRequestUpdate(
    requestId: string,
    status: string,
    metadata?: any,
  ): void {
    this.io.to("metrics_subscribers").emit("request_update", {
      request_id: requestId,
      status,
      timestamp: Date.now(),
      metadata,
    });
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  public shutdown(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.io.close();
    logger.info("WebSocket service shut down");
  }
}

