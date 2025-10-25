/**
 * Three-System Integration Layer
 * Connects Auterity, RelayCore, and NeuroWeaver systems
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer, Server } from "http";

// Import integration services
import { AuterityIntegration } from "./services/auterity-integration";
import { RelayCoreIntegration } from "./services/relaycore-integration";
import { NeuroWeaverIntegration } from "./services/neuroweaver-integration";
import { MessageBus } from "./services/message-bus";
import { UnifiedAuth } from "./services/unified-auth";
import { CrossSystemCache } from "./services/cross-system-cache";
import { IntegrationLogger } from "./services/integration-logger";
import { HealthMonitor } from "./services/health-monitor";

// Import middleware
import { errorHandler } from "./middleware/error-handler";
import { rateLimiter } from "./middleware/rate-limiter";
import { authMiddleware } from "./middleware/auth-middleware";

// Import routes
import { integrationRoutes } from "./routes/integration";
import { healthRoutes } from "./routes/health";
import { metricsRoutes } from "./routes/metrics";

// Load environment variables
dotenv.config();

interface CoreServices {
  messageBus: MessageBus;
  unifiedAuth: UnifiedAuth;
  crossSystemCache: CrossSystemCache;
  integrationLogger: IntegrationLogger;
  healthMonitor: HealthMonitor;
}

interface SystemIntegrations {
  auterity: AuterityIntegration;
  relayCore: RelayCoreIntegration;
  neuroWeaver: NeuroWeaverIntegration;
}

interface ServerConfig {
  port: number;
  healthCheckInterval: number;
  enableAlerts: boolean;
  shutdownTimeout: number;
  initializationTimeout: number;
  allowedOrigins: string[];
}

const DEFAULT_CONFIG: ServerConfig = {
  port: parseInt(process.env.INTEGRATION_PORT || "3002", 10),
  healthCheckInterval: 30000,
  enableAlerts: true,
  shutdownTimeout: 10000,
  initializationTimeout: 30000,
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3003",
  ],
};

function createCoreServices(
  config: ServerConfig = DEFAULT_CONFIG,
): CoreServices {
  const logger = new IntegrationLogger();
  const cache = new CrossSystemCache();

  return {
    messageBus: new MessageBus(),
    unifiedAuth: new UnifiedAuth(),
    crossSystemCache: cache,
    integrationLogger: logger,
    healthMonitor: new HealthMonitor(
      logger,
      cache,
      config.healthCheckInterval,
      config.enableAlerts,
    ),
  };
}

function createSystemIntegrations(services: CoreServices): SystemIntegrations {
  const config = {
    messageBus: services.messageBus,
    unifiedAuth: services.unifiedAuth,
    crossSystemCache: services.crossSystemCache,
    integrationLogger: services.integrationLogger,
    healthMonitor: services.healthMonitor,
  };

  return {
    auterity: new AuterityIntegration(config),
    relayCore: new RelayCoreIntegration(config),
    neuroWeaver: new NeuroWeaverIntegration(config),
  };
}

function configureApp(
  services: CoreServices,
  integrations: SystemIntegrations,
  config: ServerConfig = DEFAULT_CONFIG,
): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.allowedOrigins,
      credentials: true,
    }),
  );

  // Logging middleware
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) =>
          services.integrationLogger.info("HTTP", "request", message.trim()),
      },
    }),
  );

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting and authentication
  app.use("/api", rateLimiter);
  app.use("/api", authMiddleware(services.unifiedAuth));

  // Routes
  app.use("/health", healthRoutes);
  app.use("/api/v1/metrics", metricsRoutes);
  app.use(
    "/api/v1/integration",
    integrationRoutes({
      auterityIntegration: integrations.auterity,
      relayCoreIntegration: integrations.relayCore,
      neuroWeaverIntegration: integrations.neuroWeaver,
      messageBus: services.messageBus,
      crossSystemCache: services.crossSystemCache,
    }),
  );

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

async function initializeServices(
  services: CoreServices,
  integrations: SystemIntegrations,
  config: ServerConfig = DEFAULT_CONFIG,
): Promise<void> {
  const { integrationLogger } = services;

  integrationLogger.info(
    "Integration",
    "startup",
    "Initializing system integrations...",
  );

  const initPromises = [
    integrations.auterity.initialize(),
    integrations.relayCore.initialize(),
    integrations.neuroWeaver.initialize(),
    services.messageBus.initialize(),
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, config.initializationTimeout);

  try {
    const results = await Promise.allSettled(initPromises);
    clearTimeout(timeoutId);

    const serviceNames = ["Auterity", "RelayCore", "NeuroWeaver", "MessageBus"];
    const criticalServices = ["MessageBus"];
    const failedServices: string[] = [];
    let hasCriticalFailure = false;

    results.forEach((result, index) => {
      const serviceName = serviceNames[index];

      if (result.status === "rejected") {
        const error =
          result.reason instanceof Error
            ? result.reason
            : new Error(String(result.reason));
        integrationLogger.error(
          "Integration",
          "startup",
          `Failed to initialize ${serviceName}:`,
          error,
        );
        failedServices.push(serviceName);

        if (criticalServices.includes(serviceName)) {
          hasCriticalFailure = true;
        }
      } else {
        integrationLogger.info(
          "Integration",
          "startup",
          `Successfully initialized ${serviceName}`,
        );
      }
    });

    if (hasCriticalFailure) {
      const criticalFailures = failedServices.filter((s) =>
        criticalServices.includes(s),
      );
      throw new Error(
        `Critical services failed: ${criticalFailures.join(", ")}`,
      );
    }

    if (failedServices.length > 0) {
      integrationLogger.warn(
        "Integration",
        "startup",
        `Non-critical services failed: ${failedServices.join(", ")}`,
      );
    }

    await services.healthMonitor.initialize();
    integrationLogger.info(
      "Integration",
      "startup",
      "All system integrations initialized successfully",
    );
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const errorMessage =
      error instanceof Error ? error : new Error(String(error));
    integrationLogger.error(
      "Integration",
      "startup",
      "Failed to initialize services:",
      errorMessage,
    );
    throw errorMessage;
  }
}

function setupServer(
  app: express.Application,
  logger: IntegrationLogger,
  config: ServerConfig = DEFAULT_CONFIG,
): Server {
  const server = createServer(app);

  server.on("error", (error: Error) => {
    logger.error("Integration", "server", "Server error:", error);
    if (error.message.includes("EADDRINUSE")) {
      logger.error(
        "Integration",
        "server",
        `Port ${config.port} is already in use`,
      );
      process.exit(1);
    }
  });

  server.listen(config.port, () => {
    logger.info(
      "Integration",
      "server",
      `Integration server running on port ${config.port}`,
    );
    logger.info(
      "Integration",
      "server",
      `Environment: ${process.env.NODE_ENV || "development"}`,
    );
    logger.info(
      "Integration",
      "server",
      `Health check: http://localhost:${config.port}/health`,
    );
  });

  return server;
}

function setupGracefulShutdown(
  server: Server,
  services: CoreServices,
  integrations: SystemIntegrations,
  config: ServerConfig = DEFAULT_CONFIG,
): void {
  const { integrationLogger } = services;

  const gracefulShutdown = async (signal: string) => {
    integrationLogger.info(
      "Integration",
      "shutdown",
      `${signal} received, shutting down gracefully`,
    );

    const shutdownServices = [
      { name: "Auterity", service: integrations.auterity },
      { name: "RelayCore", service: integrations.relayCore },
      { name: "NeuroWeaver", service: integrations.neuroWeaver },
      { name: "MessageBus", service: services.messageBus },
    ];

    try {
      const disconnectPromises = shutdownServices.map(({ name, service }) =>
        service.disconnect().catch((err: unknown) => {
          const error = err instanceof Error ? err : new Error(String(err));
          integrationLogger.error(
            "Integration",
            "shutdown",
            `Failed to disconnect ${name}:`,
            error,
          );
        }),
      );

      await Promise.allSettled(disconnectPromises);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error : new Error(String(error));
      integrationLogger.error(
        "Integration",
        "shutdown",
        "Error during service disconnection:",
        errorMessage,
      );
    }

    const shutdownTimeout = setTimeout(() => {
      integrationLogger.error(
        "Integration",
        "shutdown",
        "Forced shutdown due to timeout",
      );
      process.exit(1);
    }, config.shutdownTimeout);

    server.close(() => {
      clearTimeout(shutdownTimeout);
      integrationLogger.info("Integration", "shutdown", "Process terminated");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

async function startServer(
  config: ServerConfig = DEFAULT_CONFIG,
): Promise<void> {
  try {
    const services = createCoreServices(config);
    const integrations = createSystemIntegrations(services);

    await initializeServices(services, integrations, config);

    const app = configureApp(services, integrations, config);
    const server = setupServer(app, services.integrationLogger, config);

    setupGracefulShutdown(server, services, integrations, config);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error : new Error(String(error));

    process.exit(1);
  }
}

// Global error handlers
process.on("uncaughtException", (error: Error) => {

  process.exit(1);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    const error = new Error(String(reason));
    error.name = "UnhandledRejection";
    console.error(
      "Unhandled Rejection:",
      `Promise: ${String(promise)}, Reason: ${String(reason)}`,
    );
    process.exit(1);
  },
);

// Export factory functions for testing and module usage
export {
  createCoreServices,
  createSystemIntegrations,
  configureApp,
  initializeServices,
  setupServer,
  setupGracefulShutdown,
  DEFAULT_CONFIG,
};

// Export types for external use
export type { CoreServices, SystemIntegrations, ServerConfig };

// Main entry point - only run if this file is executed directly
if (require.main === module) {
  startServer().catch((error: unknown) => {
    const errorMessage =
      error instanceof Error ? error : new Error(String(error));

    process.exit(1);
  });
}

