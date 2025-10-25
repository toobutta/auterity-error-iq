/**
 * RelayCore Cost Optimizer
 * Implements cost-aware model selection and budget management
 */

import { logger } from "../utils/logger";
import {
  RoutingDecision,
  CostConstraints,
  CostOptimizationResult,
} from "../models/request";

export class CostOptimizer {
  private costHistory: Map<string, number[]> = new Map();
  private budgetTracking: Map<string, { used: number; limit: number }> =
    new Map();

  constructor() {
    logger.info("Cost Optimizer initialized");
  }

  async optimizeRouting(
    originalDecision: RoutingDecision,
    constraints: CostConstraints,
  ): Promise<RoutingDecision> {
    try {
      // Check if original decision fits within cost constraints
      if (originalDecision.estimated_cost <= constraints.max_cost) {
        return originalDecision;
      }

      logger.info(
        `Optimizing routing: original cost ${originalDecision.estimated_cost} exceeds limit ${constraints.max_cost}`,
      );

      // Apply cost optimization strategy
      const optimizedDecision = await this.applyCostOptimization(
        originalDecision,
        constraints,
      );

      // Log optimization result
      const savings =
        originalDecision.estimated_cost - optimizedDecision.estimated_cost;
      logger.info(`Cost optimization applied: saved $${savings.toFixed(4)}`);

      return optimizedDecision;
    } catch (error) {
      logger.error("Cost optimization failed:", error);
      // Return original decision if optimization fails
      return originalDecision;
    }
  }

  private async applyCostOptimization(
    decision: RoutingDecision,
    constraints: CostConstraints,
  ): Promise<RoutingDecision> {
    const strategy = constraints.cost_optimization || "balanced";

    switch (strategy) {
      case "aggressive":
        return this.applyAggressiveOptimization(decision, constraints);
      case "balanced":
        return this.applyBalancedOptimization(decision, constraints);
      case "quality_first":
        return this.applyQualityFirstOptimization(decision, constraints);
      default:
        return this.applyBalancedOptimization(decision, constraints);
    }
  }

  private async applyAggressiveOptimization(
    decision: RoutingDecision,
    constraints: CostConstraints,
  ): Promise<RoutingDecision> {
    // Aggressive: Always choose cheapest available option
    const cheapestOptions = this.getCheapestModelOptions();

    for (const option of cheapestOptions) {
      if (option.cost <= constraints.max_cost) {
        return {
          ...decision,
          provider: option.provider,
          model: option.model,
          estimated_cost: option.cost,
          reasoning: `Cost optimization: switched to cheapest option (${option.provider}/${option.model})`,
          routing_rules_applied: [
            ...decision.routing_rules_applied,
            "aggressive_cost_optimization",
          ],
        };
      }
    }

    // If no option fits, return original with warning
    logger.warn("No cost-optimized option found within budget");
    return decision;
  }

  private async applyBalancedOptimization(
    decision: RoutingDecision,
    constraints: CostConstraints,
  ): Promise<RoutingDecision> {
    // Balanced: Consider cost vs quality trade-off
    const alternatives = this.getBalancedAlternatives(decision);

    for (const alt of alternatives) {
      if (alt.cost <= constraints.max_cost && alt.quality_score >= 0.7) {
        return {
          ...decision,
          provider: alt.provider,
          model: alt.model,
          estimated_cost: alt.cost,
          confidence_score: Math.min(
            decision.confidence_score,
            alt.quality_score,
          ),
          reasoning: `Balanced optimization: ${alt.provider}/${alt.model} (cost: $${alt.cost.toFixed(4)}, quality: ${alt.quality_score})`,
          routing_rules_applied: [
            ...decision.routing_rules_applied,
            "balanced_cost_optimization",
          ],
        };
      }
    }

    return decision;
  }

  private async applyQualityFirstOptimization(
    decision: RoutingDecision,
    constraints: CostConstraints,
  ): Promise<RoutingDecision> {
    // Quality first: Only switch if quality is maintained
    const qualityAlternatives = this.getQualityAlternatives(decision);

    for (const alt of qualityAlternatives) {
      if (
        alt.cost <= constraints.max_cost &&
        alt.quality_score >= decision.confidence_score * 0.95
      ) {
        return {
          ...decision,
          provider: alt.provider,
          model: alt.model,
          estimated_cost: alt.cost,
          reasoning: `Quality-first optimization: maintained quality while reducing cost`,
          routing_rules_applied: [
            ...decision.routing_rules_applied,
            "quality_first_optimization",
          ],
        };
      }
    }

    return decision;
  }

  private getCheapestModelOptions(): Array<{
    provider: string;
    model: string;
    cost: number;
  }> {
    // Static cost data - in production this would come from provider configs
    return [
      { provider: "openai", model: "gpt-3.5-turbo", cost: 0.0015 },
      {
        provider: "anthropic",
        model: "claude-3-haiku-20240307",
        cost: 0.00125,
      },
      {
        provider: "neuroweaver",
        model: "automotive-specialist-v1",
        cost: 0.001,
      },
    ].sort((a, b) => a.cost - b.cost);
  }

  private getBalancedAlternatives(decision: RoutingDecision): Array<{
    provider: string;
    model: string;
    cost: number;
    quality_score: number;
  }> {
    // Balanced alternatives with cost/quality scores
    const alternatives = [
      {
        provider: "openai",
        model: "gpt-3.5-turbo",
        cost: 0.0015,
        quality_score: 0.85,
      },
      { provider: "openai", model: "gpt-4", cost: 0.03, quality_score: 0.95 },
      {
        provider: "anthropic",
        model: "claude-3-haiku-20240307",
        cost: 0.00125,
        quality_score: 0.8,
      },
      {
        provider: "anthropic",
        model: "claude-3-sonnet-20240229",
        cost: 0.015,
        quality_score: 0.9,
      },
      {
        provider: "neuroweaver",
        model: "automotive-specialist-v1",
        cost: 0.001,
        quality_score: 0.88,
      },
    ];

    // Filter out the current selection and sort by value (quality/cost ratio)
    return alternatives
      .filter(
        (alt) =>
          !(alt.provider === decision.provider && alt.model === decision.model),
      )
      .sort((a, b) => b.quality_score / b.cost - a.quality_score / a.cost);
  }

  private getQualityAlternatives(decision: RoutingDecision): Array<{
    provider: string;
    model: string;
    cost: number;
    quality_score: number;
  }> {
    return this.getBalancedAlternatives(decision).sort(
      (a, b) => b.quality_score - a.quality_score,
    );
  }

  async trackBudgetUsage(
    userId: string,
    cost: number,
    budgetLimit?: number,
  ): Promise<void> {
    try {
      const currentBudget = this.budgetTracking.get(userId) || {
        used: 0,
        limit: budgetLimit || 100,
      };
      currentBudget.used += cost;

      this.budgetTracking.set(userId, currentBudget);

      // Log budget warnings
      const usagePercent = (currentBudget.used / currentBudget.limit) * 100;
      if (usagePercent >= 90) {
        logger.warn(
          `User ${userId} has used ${usagePercent.toFixed(1)}% of budget`,
        );
      }
    } catch (error) {
      logger.error("Failed to track budget usage:", error);
    }
  }

  async getBudgetStatus(
    userId: string,
  ): Promise<{ used: number; limit: number; remaining: number }> {
    const budget = this.budgetTracking.get(userId) || { used: 0, limit: 100 };
    return {
      used: budget.used,
      limit: budget.limit,
      remaining: Math.max(0, budget.limit - budget.used),
    };
  }

  async resetBudget(userId: string, newLimit?: number): Promise<void> {
    const currentBudget = this.budgetTracking.get(userId) || {
      used: 0,
      limit: 100,
    };
    this.budgetTracking.set(userId, {
      used: 0,
      limit: newLimit || currentBudget.limit,
    });

    logger.info(
      `Budget reset for user ${userId}, new limit: $${newLimit || currentBudget.limit}`,
    );
  }

  async getCostHistory(provider: string, model: string): Promise<number[]> {
    const key = `${provider}:${model}`;
    return this.costHistory.get(key) || [];
  }

  async recordCost(
    provider: string,
    model: string,
    cost: number,
  ): Promise<void> {
    const key = `${provider}:${model}`;
    const history = this.costHistory.get(key) || [];

    history.push(cost);

    // Keep only last 100 records
    if (history.length > 100) {
      history.shift();
    }

    this.costHistory.set(key, history);
  }

  async getAverageCost(provider: string, model: string): Promise<number> {
    const history = await this.getCostHistory(provider, model);
    if (history.length === 0) return 0;

    return history.reduce((sum, cost) => sum + cost, 0) / history.length;
  }
}

