/**
 * RelayCore Health Check Endpoints
 * Provides health status for the service and its dependencies
 */

import { Router, Request, Response } from "express";
import { DatabaseConnection } from "../services/database";
import { logger } from "../utils/logger";

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "relaycore",
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    };

    res.json(healthStatus);
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
});

/**
 * GET /health/detailed
 * Detailed health check including dependencies
 */
router.get("/detailed", async (req: Request, res: Response) => {
  const checks = {
    service: { status: "healthy", message: "RelayCore service is running" },
    database: { status: "unknown", message: "Not checked" },
    memory: { status: "unknown", message: "Not checked" },
    disk: { status: "unknown", message: "Not checked" },
  };

  try {
    // Check database connection
    try {
      await DatabaseConnection.checkConnection();
      checks.database = {
        status: "healthy",
        message: "Database connection successful",
      };
    } catch (error) {
      checks.database = {
        status: "unhealthy",
        message: `Database connection failed: ${(error as Error).message}`,
      };
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };

    if (memUsageMB.heapUsed > 500) {
      // 500MB threshold
      checks.memory = {
        status: "warning",
        message: `High memory usage: ${memUsageMB.heapUsed}MB`,
      };
    } else {
      checks.memory = {
        status: "healthy",
        message: `Memory usage: ${memUsageMB.heapUsed}MB`,
      };
    }

    // Overall health status
    const overallStatus = Object.values(checks).every(
      (check) => check.status === "healthy",
    )
      ? "healthy"
      : Object.values(checks).some((check) => check.status === "unhealthy")
        ? "unhealthy"
        : "warning";

    const healthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: "relaycore",
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      checks,
      memory: memUsageMB,
    };

    const statusCode =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "warning"
          ? 200
          : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error("Detailed health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Detailed health check failed",
      checks,
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe for Kubernetes/Docker
 */
router.get("/ready", async (req: Request, res: Response) => {
  try {
    // Check if service is ready to accept requests
    await DatabaseConnection.checkConnection();

    res.json({
      status: "ready",
      timestamp: new Date().toISOString(),
      message: "Service is ready to accept requests",
    });
  } catch (error) {
    logger.error("Readiness check failed:", error);
    res.status(503).json({
      status: "not_ready",
      timestamp: new Date().toISOString(),
      error: "Service is not ready to accept requests",
    });
  }
});

/**
 * GET /health/live
 * Liveness probe for Kubernetes/Docker
 */
router.get("/live", (req: Request, res: Response) => {
  res.json({
    status: "alive",
    timestamp: new Date().toISOString(),
    message: "Service is alive",
  });
});

export { router as healthRoutes };

