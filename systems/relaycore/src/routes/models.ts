/**
 * RelayCore Models Endpoints
 * Manages available AI models and their configurations
 */

import { Router, Request, Response } from "express";
import { ProviderManager } from "../services/provider-manager";
import { logger } from "../utils/logger";

const router = Router();
const providerManager = new ProviderManager();

/**
 * GET /api/v1/models
 * List all available models
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const providers = await providerManager.getAvailableProviders();

    const models = providers.flatMap((provider) =>
      provider.models.map((model) => ({
        id: `${provider.name.toLowerCase()}-${model}`,
        name: model,
        provider: provider.name.toLowerCase(),
        available: provider.available,
        cost_per_token: provider.costPerToken,
        max_tokens: provider.maxTokens,
      })),
    );

    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    logger.error("Failed to list models:", error);
    res.status(500).json({
      success: false,
      error: { message: "Failed to retrieve models" },
    });
  }
});

export { router as modelsRoutes };

