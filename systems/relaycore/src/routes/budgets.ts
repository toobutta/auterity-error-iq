/**
 * Budget Configuration API Routes
 * RESTful endpoints for managing budget configurations
 */

import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { BudgetRegistry } from "../services/budget-registry";
import { BudgetTracker } from "../services/budget-tracker";
import {
  CreateBudgetRequest,
  UpdateBudgetRequest,
  RecordUsageRequest,
  BudgetListQuery,
} from "../types/budget";

const router = Router();
const budgetRegistry = new BudgetRegistry();
const budgetTracker = new BudgetTracker();

/**
 * Create a new budget
 * POST /api/v1/budgets
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const createRequest: CreateBudgetRequest = req.body;
    const createdBy = req.user?.id || "system"; // Assuming auth middleware sets req.user

    // Validate required fields
    if (
      !createRequest.name ||
      !createRequest.scopeType ||
      !createRequest.scopeId ||
      !createRequest.amount ||
      !createRequest.currency ||
      !createRequest.period ||
      !createRequest.startDate
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "name",
          "scopeType",
          "scopeId",
          "amount",
          "currency",
          "period",
          "startDate",
        ],
      });
    }

    // Validate amount is positive
    if (createRequest.amount <= 0) {
      return res.status(400).json({
        error: "Budget amount must be positive",
      });
    }

    // Validate scope type
    const validScopeTypes = ["organization", "team", "user", "project"];
    if (!validScopeTypes.includes(createRequest.scopeType)) {
      return res.status(400).json({
        error: "Invalid scope type",
        validTypes: validScopeTypes,
      });
    }

    // Validate period
    const validPeriods = [
      "daily",
      "weekly",
      "monthly",
      "quarterly",
      "annual",
      "custom",
    ];
    if (!validPeriods.includes(createRequest.period)) {
      return res.status(400).json({
        error: "Invalid period",
        validPeriods: validPeriods,
      });
    }

    // Validate start date
    const startDate = new Date(createRequest.startDate);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        error: "Invalid start date format",
      });
    }

    // Validate end date if provided
    if (createRequest.endDate) {
      const endDate = new Date(createRequest.endDate);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          error: "Invalid end date format",
        });
      }

      if (endDate <= startDate) {
        return res.status(400).json({
          error: "End date must be after start date",
        });
      }
    }

    const budget = await budgetRegistry.createBudget(createRequest, createdBy);

    res.status(201).json(budget);
  } catch (error) {
    logger.error("Error creating budget:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get a specific budget
 * GET /api/v1/budgets/:id
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.id;

    if (!budgetId) {
      return res.status(400).json({
        error: "Budget ID is required",
      });
    }

    const budget = await budgetRegistry.getBudget(budgetId);

    if (!budget) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    res.json(budget);
  } catch (error) {
    logger.error("Error getting budget:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Update a budget
 * PUT /api/v1/budgets/:id
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.id;
    const updateRequest: UpdateBudgetRequest = req.body;

    if (!budgetId) {
      return res.status(400).json({
        error: "Budget ID is required",
      });
    }

    // Validate amount if provided
    if (updateRequest.amount !== undefined && updateRequest.amount <= 0) {
      return res.status(400).json({
        error: "Budget amount must be positive",
      });
    }

    // Validate dates if provided
    if (updateRequest.startDate) {
      const startDate = new Date(updateRequest.startDate);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          error: "Invalid start date format",
        });
      }
    }

    if (updateRequest.endDate) {
      const endDate = new Date(updateRequest.endDate);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          error: "Invalid end date format",
        });
      }
    }

    const budget = await budgetRegistry.updateBudget(budgetId, updateRequest);

    if (!budget) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    res.json(budget);
  } catch (error) {
    logger.error("Error updating budget:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Delete a budget
 * DELETE /api/v1/budgets/:id
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.id;

    if (!budgetId) {
      return res.status(400).json({
        error: "Budget ID is required",
      });
    }

    const deleted = await budgetRegistry.deleteBudget(budgetId);

    if (!deleted) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    res.status(204).send();
  } catch (error) {
    logger.error("Error deleting budget:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * List budgets for a scope
 * GET /api/v1/budgets/scope/:type/:id
 */
router.get("/scope/:type/:id", async (req: Request, res: Response) => {
  try {
    const scopeType = req.params.type;
    const scopeId = req.params.id;
    const includeInactive = req.query.includeInactive === "true";
    const parentBudgetId = req.query.parentBudgetId as string;

    const validScopeTypes = ["organization", "team", "user", "project"];
    if (!validScopeTypes.includes(scopeType)) {
      return res.status(400).json({
        error: "Invalid scope type",
        validTypes: validScopeTypes,
      });
    }

    const query: BudgetListQuery = {
      scopeType: scopeType as any,
      scopeId,
      includeInactive,
      parentBudgetId,
    };

    const budgets = await budgetRegistry.listBudgets(query);

    res.json({
      budgets,
      count: budgets.length,
    });
  } catch (error) {
    logger.error("Error listing budgets:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get budget hierarchy
 * GET /api/v1/budgets/hierarchy/:type/:id
 */
router.get("/hierarchy/:type/:id", async (req: Request, res: Response) => {
  try {
    const scopeType = req.params.type;
    const scopeId = req.params.id;

    const validScopeTypes = ["organization", "team", "user", "project"];
    if (!validScopeTypes.includes(scopeType)) {
      return res.status(400).json({
        error: "Invalid scope type",
        validTypes: validScopeTypes,
      });
    }

    const hierarchy = await budgetRegistry.getBudgetHierarchy(
      scopeType as any,
      scopeId,
    );

    res.json({
      hierarchy,
      count: hierarchy.length,
    });
  } catch (error) {
    logger.error("Error getting budget hierarchy:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get budget status
 * GET /api/v1/budgets/:id/status
 */
router.get("/:id/status", async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.id;

    if (!budgetId) {
      return res.status(400).json({
        error: "Budget ID is required",
      });
    }

    const status = await budgetTracker.getBudgetStatus(budgetId);

    if (!status) {
      return res.status(404).json({
        error: "Budget not found",
      });
    }

    res.json(status);
  } catch (error) {
    logger.error("Error getting budget status:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Record usage against a budget
 * POST /api/v1/budgets/:id/usage
 */
router.post("/:id/usage", async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.id;
    const usageRequest: RecordUsageRequest = req.body;

    if (!budgetId) {
      return res.status(400).json({
        error: "Budget ID is required",
      });
    }

    // Validate required fields
    if (
      !usageRequest.amount ||
      !usageRequest.currency ||
      !usageRequest.source
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["amount", "currency", "source"],
      });
    }

    // Validate amount is positive
    if (usageRequest.amount <= 0) {
      return res.status(400).json({
        error: "Usage amount must be positive",
      });
    }

    // Validate source
    const validSources = ["relaycore", "auterity", "manual"];
    if (!validSources.includes(usageRequest.source)) {
      return res.status(400).json({
        error: "Invalid source",
        validSources: validSources,
      });
    }

    // Validate timestamp if provided
    if (usageRequest.timestamp) {
      const timestamp = new Date(usageRequest.timestamp);
      if (isNaN(timestamp.getTime())) {
        return res.status(400).json({
          error: "Invalid timestamp format",
        });
      }
    }

    const usageRecord = await budgetTracker.recordUsage(budgetId, usageRequest);

    res.status(201).json(usageRecord);
  } catch (error) {
    logger.error("Error recording usage:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Check budget constraints for estimated cost
 * POST /api/v1/budgets/:id/check-constraints
 */
router.post("/:id/check-constraints", async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.id;
    const { estimatedCost } = req.body;

    if (!budgetId) {
      return res.status(400).json({
        error: "Budget ID is required",
      });
    }

    if (typeof estimatedCost !== "number" || estimatedCost < 0) {
      return res.status(400).json({
        error: "Valid estimated cost is required",
      });
    }

    const constraintCheck = await budgetTracker.checkBudgetConstraints(
      budgetId,
      estimatedCost,
    );

    res.json(constraintCheck);
  } catch (error) {
    logger.error("Error checking budget constraints:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get usage history for a budget
 * GET /api/v1/budgets/:id/usage
 */
router.get("/:id/usage", async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!budgetId) {
      return res.status(400).json({
        error: "Budget ID is required",
      });
    }

    if (limit > 1000) {
      return res.status(400).json({
        error: "Limit cannot exceed 1000",
      });
    }

    const usageHistory = await budgetTracker.getUsageHistory(
      budgetId,
      limit,
      offset,
    );

    res.json({
      usage: usageHistory,
      count: usageHistory.length,
      limit,
      offset,
    });
  } catch (error) {
    logger.error("Error getting usage history:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get usage summary for a time period
 * GET /api/v1/budgets/:id/usage/summary
 */
router.get("/:id/usage/summary", async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.id;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!budgetId) {
      return res.status(400).json({
        error: "Budget ID is required",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Start date and end date are required",
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: "Invalid date format",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        error: "End date must be after start date",
      });
    }

    const summary = await budgetTracker.getUsageSummary(
      budgetId,
      startDate,
      endDate,
    );

    res.json(summary);
  } catch (error) {
    logger.error("Error getting usage summary:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Refresh budget status cache
 * POST /api/v1/budgets/:id/refresh-cache
 */
router.post("/:id/refresh-cache", async (req: Request, res: Response) => {
  try {
    const budgetId = req.params.id;

    if (!budgetId) {
      return res.status(400).json({
        error: "Budget ID is required",
      });
    }

    await budgetTracker.refreshStatusCache(budgetId);

    res.json({
      message: "Budget status cache refreshed successfully",
    });
  } catch (error) {
    logger.error("Error refreshing budget cache:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export { router as budgetRoutes };

