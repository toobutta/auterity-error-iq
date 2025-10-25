/**
 * RelayCore Metrics Endpoints
 * Provides usage metrics and analytics
 */

import { Router, Request, Response } from "express";
import { MetricsCollector } from "../services/metrics-collector";
import { logger } from "../utils/logger";

const router = Router();
const metricsCollector = new MetricsCollector();

/**
 * GET /api/v1/metrics/system
 * Get system-wide metrics
 */
router.get("/system", async (req: Request, res: Response) => {
  try {
    const timeRange =
      req.query.start && req.query.end
        ? {
            start: new Date(req.query.start as string),
            end: new Date(req.query.end as string),
          }
        : undefined;

    const metrics = await metricsCollector.getSystemMetrics(timeRange);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error("Failed to get system metrics:", error);
    res.status(500).json({
      success: false,
      error: { message: "Failed to retrieve system metrics" },
    });
  }
});

/**
 * GET /api/v1/metrics/provider/:provider
 * Get provider-specific metrics
 */
router.get("/provider/:provider", async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider;
    const timeRange =
      req.query.start && req.query.end
        ? {
            start: new Date(req.query.start as string),
            end: new Date(req.query.end as string),
          }
        : undefined;

    const metrics = await metricsCollector.getProviderMetrics(
      provider,
      timeRange,
    );

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error(
      `Failed to get metrics for provider ${req.params.provider}:`,
      error,
    );
    res.status(500).json({
      success: false,
      error: { message: "Failed to retrieve provider metrics" },
    });
  }
});

/**
 * GET /api/v1/metrics/costs
 * Get cost analysis
 */
router.get("/costs", async (req: Request, res: Response) => {
  try {
    const timeRange =
      req.query.start && req.query.end
        ? {
            start: new Date(req.query.start as string),
            end: new Date(req.query.end as string),
          }
        : undefined;

    const costAnalysis = await metricsCollector.getCostAnalysis(timeRange);

    res.json({
      success: true,
      data: costAnalysis,
    });
  } catch (error) {
    logger.error("Failed to get cost analysis:", error);
    res.status(500).json({
      success: false,
      error: { message: "Failed to retrieve cost analysis" },
    });
  }
});

/**
 * GET /api/v1/metrics/usage (legacy endpoint)
 * Get usage metrics - redirects to system metrics
 */
router.get("/usage", async (req: Request, res: Response) => {
  try {
    const metrics = await metricsCollector.getSystemMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error("Failed to get usage metrics:", error);
    res.status(500).json({
      success: false,
      error: { message: "Failed to retrieve usage metrics" },
    });
  }
});

export { router as metricsRoutes };

