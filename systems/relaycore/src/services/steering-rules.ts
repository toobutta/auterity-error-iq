/**
 * Steering Rules Engine
 * Handles AI request routing decisions based on YAML rules
 */

import * as yaml from "js-yaml";
import * as fs from "fs/promises";
import * as path from "path";
import { AIRequest, RoutingDecision } from "../models/request";
import { logger } from "../utils/logger";
import { sanitizeForLog } from "../utils/log-sanitizer";

interface RoutingRule {
  name: string;
  priority: number;
  conditions: RuleCondition[];
  action: RuleAction;
}

interface RuleCondition {
  field: string;
  operator:
    | "equals"
    | "exists"
    | "length_less_than"
    | "length_greater_than"
    | "contains";
  value?: any;
}

interface RuleAction {
  provider: string;
  model: string;
  cost_multiplier: number;
  max_latency: number;
}

interface SteeringConfig {
  routing_rules: RoutingRule[];
  cost_constraints: {
    daily_budget: number;
    per_request_max: number;
    emergency_threshold: number;
  };
  performance_thresholds: {
    max_latency: number;
    min_success_rate: number;
    max_error_rate: number;
  };
}

export class SteeringRulesEngine {
  private config: SteeringConfig | null = null;
  private dailySpend = 0;
  private requestCount = 0;

  async loadSteeringRules(): Promise<void> {
    try {
      const configPath = path.join(__dirname, "../config/steering-rules.yaml");
      const yamlContent = await fs.readFile(configPath, "utf8");
      this.config = yaml.load(yamlContent) as SteeringConfig;

      // Sort rules by priority (highest first)
      this.config.routing_rules.sort((a, b) => b.priority - a.priority);

      logger.info("Steering rules loaded successfully", {
        rulesCount: this.config.routing_rules.length,
      });
    } catch (error) {
      logger.error("Failed to load steering rules:", error);
      throw new Error("Failed to load steering rules configuration");
    }
  }

  async validateRules(): Promise<boolean> {
    if (!this.config) {
      logger.error("No configuration loaded for validation");
      return false;
    }

    try {
      // Validate required fields
      if (
        !this.config.routing_rules ||
        !Array.isArray(this.config.routing_rules)
      ) {
        throw new Error("routing_rules must be an array");
      }

      // Validate each rule
      for (const rule of this.config.routing_rules) {
        if (!rule.name || !rule.action) {
          throw new Error(`Invalid rule: ${JSON.stringify(rule)}`);
        }

        if (!rule.action.provider || !rule.action.model) {
          throw new Error(`Invalid action in rule ${rule.name}`);
        }
      }

      // Validate cost constraints
      if (!this.config.cost_constraints) {
        throw new Error("cost_constraints section is required");
      }

      logger.info("Steering rules validation passed");
      return true;
    } catch (error) {
      logger.error("Steering rules validation failed:", error);
      return false;
    }
  }

  async determineRouting(
    request: AIRequest,
    profileId: string,
  ): Promise<RoutingDecision> {
    if (!this.config) {
      await this.loadSteeringRules();
    }

    try {
      // Check cost constraints first
      if (this.dailySpend >= this.config!.cost_constraints.daily_budget) {
        return this.createFallbackDecision("Daily budget exceeded", [
          "budget_constraint",
        ]);
      }

      // Add profile-specific cost constraints
      const profileCostRules = await this.getProfileCostRules(profileId);
      if (
        profileCostRules &&
        this.dailySpend >= profileCostRules.daily_budget
      ) {
        return this.createFallbackDecision("Profile budget exceeded", [
          "profile_budget",
        ]);
      }

      // Find matching rule with profile awareness
      for (const rule of this.config!.routing_rules) {
        if (
          this.evaluateProfileConditions(rule.conditions, request, profileId)
        ) {
          const decision = await this.createRoutingDecision(
            rule,
            request,
            profileId,
          );

          // Check if decision exceeds per-request budget
          if (
            decision.estimated_cost >
            this.config!.cost_constraints.per_request_max
          ) {
            logger.warn(
              `Request cost ${sanitizeForLog(decision.estimated_cost)} exceeds max ${sanitizeForLog(this.config!.cost_constraints.per_request_max)}`,
            );
            continue; // Try next rule
          }

          return decision;
        }
      }

      // No rules matched, use default
      const defaultRule = this.config!.routing_rules.find(
        (r) => r.name === "default",
      );
      if (defaultRule) {
        return this.createRoutingDecision(defaultRule, request, profileId);
      }

      return this.createFallbackDecision("No matching rules found", [
        "no_match_fallback",
      ]);
    } catch (error) {
      logger.error("Error in steering rules engine:", error);
      return this.createFallbackDecision("Steering engine error", [
        "error_fallback",
      ]);
    }
  }

  private evaluateProfileConditions(
    conditions: RuleCondition[],
    request: AIRequest,
    profileId: string,
  ): boolean {
    if (conditions.length === 0) return true; // Default rule

    return conditions.every((condition) => {
      const fieldValue = this.getFieldValue(condition.field, request);

      // Check for profile-specific conditions
      if (condition.field === "profile") {
        return profileId === condition.value;
      }

      switch (condition.operator) {
        case "equals":
          return fieldValue === condition.value;
        case "exists":
          return fieldValue !== undefined && fieldValue !== null;
        case "length_less_than":
          return (
            typeof fieldValue === "string" &&
            fieldValue.length < condition.value
          );
        case "length_greater_than":
          return (
            typeof fieldValue === "string" &&
            fieldValue.length > condition.value
          );
        case "contains":
          return (
            typeof fieldValue === "string" &&
            fieldValue.includes(condition.value)
          );
        default:
          logger.warn(
            `Unknown operator: ${sanitizeForLog(condition.operator)}`,
          );
          return false;
      }
    });
  }

  private getFieldValue(field: string, request: AIRequest): any {
    const parts = field.split(".");
    let value: any = request;

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async createRoutingDecision(
    rule: any,
    request: AIRequest,
    profileId: string,
  ): Promise<RoutingDecision> {
    const baseCost = this.calculateBaseCost(
      rule.action.model,
      request.prompt.length,
      profileId,
    );
    const estimatedCost = baseCost * (rule.action.cost_multiplier || 1.0);

    return {
      provider: rule.action.provider,
      model: rule.action.model,
      estimated_cost: estimatedCost,
      expected_latency: rule.action.max_latency || 2000,
      confidence_score: this.calculateConfidenceScore(rule, request, profileId),
      reasoning: `Matched rule: ${sanitizeForLog(rule.name || "unknown")}`,
      routing_rules_applied: [rule.name || "unknown"],
    };
  }

  private createFallbackDecision(
    reason: string,
    rulesApplied: string[],
  ): RoutingDecision {
    return {
      provider: "openai",
      model: "gpt-3.5-turbo",
      estimated_cost: 0.002,
      expected_latency: 2000,
      confidence_score: 0.7,
      reasoning: reason,
      routing_rules_applied: rulesApplied,
    };
  }

  private calculateBaseCost(
    model: string,
    promptLength: number,
    profileId: string,
  ): number {
    const costPerToken: Record<string, number> = {
      "gpt-4": 0.03,
      "gpt-3.5-turbo": 0.0015,
      "claude-3-opus": 0.015,
      "automotive-specialist-v1": 0.001,
    };

    // Apply profile-specific cost adjustments
    if (profileId === "automotive") {
      return (((costPerToken[model] || 0.002) * promptLength) / 1000) * 0.9; // 10% discount
    }

    return ((costPerToken[model] || 0.002) * promptLength) / 1000;
  }

  private calculateConfidenceScore(
    rule: any,
    request: AIRequest,
    profileId: string,
  ): number {
    let score = 0.8; // Base confidence

    // Adjust based on model capability
    if (rule.model.includes("gpt-4")) score += 0.1;
    if (rule.model.includes("specialist")) score += 0.05;

    // Adjust based on profile-specific confidence
    if (profileId === "healthcare") {
      score += 0.05; // Higher confidence for healthcare rules
    }

    // Adjust based on request complexity
    if (request.prompt.length > 1000) score -= 0.05;

    return Math.min(0.95, Math.max(0.5, score));
  }

  // Cost tracking methods
  recordRequestCost(cost: number): void {
    this.dailySpend += cost;
    this.requestCount++;
  }

  getDailySpend(): number {
    return this.dailySpend;
  }

  resetDailyTracking(): void {
    this.dailySpend = 0;
    this.requestCount = 0;
  }

  private async getProfileCostRules(
    profileId: string,
  ): Promise<{ daily_budget: number } | null> {
    // Implementation to fetch profile-specific cost rules
    const profileCosts: Record<string, { daily_budget: number }> = {
      automotive: { daily_budget: 500 },
      healthcare: { daily_budget: 300 },
      finance: { daily_budget: 400 },
      retail: { daily_budget: 250 },
      general: { daily_budget: 200 },
    };

    return profileCosts[profileId] || null;
  }
}

