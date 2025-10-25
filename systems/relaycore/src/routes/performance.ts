/**
 * RelayCore Performance Routes
 * Endpoints for performance monitoring integration
 */

import { Router, Request, Response } from "express";
import { NeuroWeaverConnector } from "../services/neuroweaver-connector";
import { logger } from "../utils/logger";

// CSRF protection middleware
const csrfProtection = (req: Request, res: Response, next: any): void => {
  const token = req.headers["x-csrf-token"] || req.body._csrf;
  const sessionToken = (req as any).session?.csrfToken;
  if (!token || token !== sessionToken) {
    res.status(403).json({ error: "Invalid CSRF token" });
    return;
  }
  next();
};

const router = Router();
const neuroweaver = new NeuroWeaverConnector();

/**
 * POST /api/v1/performance/feedback
 * Send performance feedback to NeuroWeaver
 */
router.post(
  "/feedback",
  csrfProtection,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        modelId,
        requestId,
        accuracy,
        latency,
        userSatisfaction,
        contextMatch,
      } = req.body;

      if (!modelId || !requestId || accuracy === undefined || !latency) {
        res.status(400).json({
          success: false,
          error: {
            message:
              "Missing required fields: modelId, requestId, accuracy, latency",
          },
        });
        return;
      }

      await neuroweaver.sendPerformanceFeedback({
        modelId,
        requestId,
        accuracy,
        latency,
        userSatisfaction,
        contextMatch: contextMatch || 1.0,
      });

      res.json({
        success: true,
        message: "Performance feedback sent",
      });
    } catch (error) {
      logger.error("Failed to send performance feedback:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to send performance feedback" },
      });
    }
  },
);

/**
 * POST /api/v1/performance/switch
 * Request model switch due to performance issues
 */
router.post(
  "/switch",
  csrfProtection,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        currentModel,
        targetModel,
        reason,
        switchType = "immediate",
      } = req.body;

      if (!currentModel || !reason) {
        res.status(400).json({
          success: false,
          error: { message: "Missing required fields: currentModel, reason" },
        });
        return;
      }

      const success = await neuroweaver.requestModelSwitch({
        currentModel,
        targetModel,
        reason,
        switchType,
      });

      res.json({
        success,
        message: success
          ? "Model switch requested"
          : "Model switch request failed",
      });
    } catch (error) {
      logger.error("Failed to request model switch:", error);
      res.status(500).json({
        success: false,
        error: { message: "Failed to request model switch" },
      });
    }
  },
);

/**
 * GET /api/v1/performance/models/:modelId/health
 * Get model health status from NeuroWeaver
 */
router.get(
  "/models/:modelId/health",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { modelId } = req.params;

      const health = await neuroweaver.getModelHealth(modelId);

      if (!health) {
        res.status(404).json({
          success: false,
          error: { message: "Model health data not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      logger.error(
        `Failed to get model health for ${req.params.modelId}:`,
        error,
      );
      res.status(500).json({
        success: false,
        error: { message: "Failed to retrieve model health" },
      });
    }
  },
);

/**
 * PUT /api/v1/performance/models/:modelId/thresholds
 * Update performance thresholds for a model
 */
router.put(
  "/models/:modelId/thresholds",
  csrfProtection,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { modelId } = req.params;
      const {
        min_accuracy,
        max_latency_ms,
        min_throughput_rps,
        max_cost_per_request,
      } = req.body;

      const success = await neuroweaver.updateModelThresholds(modelId, {
        min_accuracy: min_accuracy || 0.85,
        max_latency_ms: max_latency_ms || 2000,
        min_throughput_rps: min_throughput_rps || 10.0,
        max_cost_per_request: max_cost_per_request || 0.01,
      });

      res.json({
        success,
        message: success ? "Thresholds updated" : "Failed to update thresholds",
      });
    } catch (error) {
      logger.error(
        `Failed to update thresholds for ${req.params.modelId}:`,
        error,
      );
      res.status(500).json({
        success: false,
        error: { message: "Failed to update thresholds" },
      });
    }
  },
);

export { router as performanceRoutes };

