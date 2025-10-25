/**
 * RelayCore AI Routing Endpoints
 * Handles AI request routing, model selection, and cost optimization
 */

import { Router, Request, Response } from "express";
import { ProviderManager } from "../services/provider-manager";
import { SteeringRulesEngine } from "../services/steering-rules";
import { CostOptimizer } from "../services/cost-optimizer";
import { MetricsCollector } from "../services/metrics-collector";
import { logger } from "../utils/logger";
import { AIRequest, AIResponse, RoutingDecision } from "../models/request";

const router = Router();
const providerManager = new ProviderManager();
const steeringEngine = new SteeringRulesEngine();
const costOptimizer = new CostOptimizer();
const metricsCollector = new MetricsCollector();

/**
 * POST /api/v1/ai/chat
 * Route AI chat requests through optimal provider
 */
router.post("/chat", async (req: Request, res: Response) => {
  const startTime = Date.now();
  let requestId: string | undefined;

  try {
    const aiRequest: AIRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prompt: req.body.prompt,
      context: req.body.context || {},
      routing_preferences: req.body.routing_preferences || {},
      cost_constraints: req.body.cost_constraints || { max_cost: 1.0 },
      user_id: req.user?.id,
      system_source: req.body.system_source || "unknown",
    };

    requestId = aiRequest.id;
    logger.info(
      `Processing AI request ${requestId} from ${aiRequest.system_source}`,
    );

    // Apply steering rules for routing decision
    const routingDecision: RoutingDecision =
      await steeringEngine.determineRouting(aiRequest);
    logger.info(`Routing decision for ${requestId}:`, routingDecision);

    // Apply cost optimization
    const optimizedDecision = await costOptimizer.optimizeRouting(
      routingDecision,
      aiRequest.cost_constraints,
    );

    // Route request to selected provider
    const aiResponse: AIResponse = await providerManager.routeRequest(
      aiRequest,
      optimizedDecision,
    );

    // Calculate metrics
    const latency = Date.now() - startTime;
    aiResponse.latency = latency;

    // Collect metrics
    await metricsCollector.recordRequest(
      aiRequest,
      aiResponse,
      optimizedDecision,
    );

    logger.info(
      `AI request ${requestId} completed in ${latency}ms using ${aiResponse.model_used}`,
    );

    res.json({
      success: true,
      data: aiResponse,
      routing_info: {
        selected_provider: optimizedDecision.provider,
        selected_model: optimizedDecision.model,
        cost_estimate: optimizedDecision.estimated_cost,
        reasoning: optimizedDecision.reasoning,
      },
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    logger.error(`AI request ${requestId} failed after ${latency}ms:`, error);

    // Record failed request metrics
    if (requestId) {
      await metricsCollector.recordError(requestId, error as Error, latency);
    }

    res.status(500).json({
      success: false,
      error: {
        message: "AI request processing failed",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
        request_id: requestId,
      },
    });
  }
});

/**
 * POST /api/v1/ai/batch
 * Process multiple AI requests in batch
 */
router.post("/batch", async (req: Request, res: Response) => {
  try {
    const requests: AIRequest[] = req.body.requests || [];
    const results: (AIResponse | { error: string })[] = [];

    logger.info(`Processing batch of ${requests.length} AI requests`);

    // Process requests concurrently with limit
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(async (request) => {
        try {
          const routingDecision =
            await steeringEngine.determineRouting(request);
          const optimizedDecision = await costOptimizer.optimizeRouting(
            routingDecision,
            request.cost_constraints,
          );
          const response = await providerManager.routeRequest(
            request,
            optimizedDecision,
          );
          await metricsCollector.recordRequest(
            request,
            response,
            optimizedDecision,
          );
          return response;
        } catch (error) {
          logger.error(`Batch request ${request.id} failed:`, error);
          return { error: (error as Error).message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    res.json({
      success: true,
      data: {
        results,
        total_processed: requests.length,
        successful: results.filter((r) => !("error" in r)).length,
        failed: results.filter((r) => "error" in r).length,
      },
    });
  } catch (error) {
    logger.error("Batch processing failed:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Batch processing failed",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
    });
  }
});

/**
 * GET /api/v1/ai/providers
 * Get available AI providers and their status
 */
router.get("/providers", async (req: Request, res: Response) => {
  try {
    const providers = await providerManager.getAvailableProviders();
    res.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    logger.error("Failed to get providers:", error);
    res.status(500).json({
      success: false,
      error: { message: "Failed to retrieve providers" },
    });
  }
});

export { router as aiRoutes };

