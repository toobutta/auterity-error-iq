/**
 * Budget Manager Service
 * Implements real-time budget management with automatic cost controls
 */

import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { DatabaseConnection } from "./database";
import { BudgetRegistry } from "./budget-registry";
import {
  BudgetStatusInfo,
  BudgetConstraintCheck,
  BudgetAction,
  RecordUsageRequest,
  UsageRecord,
} from "../types/budget";
import { AIRequest } from "../types/ai-request";
import { CostPredictor } from "./cost-predictor";

export interface BudgetAllocation {
  approved: boolean;
  allocatedAmount: number;
  remainingBudget: number;
  recommendedAction: "proceed" | "downgrade" | "queue" | "reject";
}

export interface SpendingAction {
  action: BudgetAction;
  reason: string;
  budgetId: string;
  threshold: number;
}

export interface CostReport {
  totalSpend: number;
  budgetUtilization: number;
  topModels: Array<{ model: string; cost: number; usage: number }>;
  topUsers: Array<{ userId: string; cost: number }>;
  dailySpend: Array<{ date: string; amount: number }>;
  currency: string;
}

export interface TimeRange {
  startDate: string;
  endDate: string;
}

export class BudgetManager {
  private db: Pool;
  private budgetRegistry: BudgetRegistry;
  private costPredictor: CostPredictor;
  private readonly CACHE_TTL = 60 * 5; // 5 minutes cache TTL
  private budgetStatusCache: Map<
    string,
    { status: BudgetStatusInfo; timestamp: number }
  > = new Map();

  constructor() {
    this.db = DatabaseConnection.getPool();
    this.budgetRegistry = new BudgetRegistry();
    this.costPredictor = new CostPredictor();
  }

  /**
   * Check if a user has sufficient budget for an estimated cost
   * Optimized with caching for high-performance budget checks
   */
  async checkBudget(
    userId: string,
    estimatedCost: number,
  ): Promise<BudgetStatusInfo> {
    try {
      // First check user-level budget
      const userBudgets = await this.budgetRegistry.listBudgets({
        scopeType: "user",
        scopeId: userId,
      });

      if (userBudgets.length === 0) {
        // If no user budget, check team budgets
        const userTeams = await this.getUserTeams(userId);

        for (const teamId of userTeams) {
          const teamBudgets = await this.budgetRegistry.listBudgets({
            scopeType: "team",
            scopeId: teamId,
          });

          if (teamBudgets.length > 0) {
            // Use the first active team budget
            return this.getBudgetStatus(teamBudgets[0].id);
          }
        }

        // If no team budget, check organization budget
        const orgId = await this.getUserOrganization(userId);
        if (orgId) {
          const orgBudgets = await this.budgetRegistry.listBudgets({
            scopeType: "organization",
            scopeId: orgId,
          });

          if (orgBudgets.length > 0) {
            // Use the first active organization budget
            return this.getBudgetStatus(orgBudgets[0].id);
          }
        }

        // No budget found at any level
        throw new Error("No budget found for user");
      }

      // Use the first active user budget
      return this.getBudgetStatus(userBudgets[0].id);
    } catch (error) {
      logger.error("Error checking budget:", error);
      throw error;
    }
  }

  /**
   * Allocate budget for an AI request
   * Implements intelligent budget allocation with fallback strategies
   */
  async allocateBudget(request: AIRequest): Promise<BudgetAllocation> {
    try {
      const userId = request.userId;

      // Predict cost for this request
      const costPrediction = await this.costPredictor.predictCost(request);
      const estimatedCost = costPrediction.estimatedCost;

      // Get applicable budget
      const budgetStatus = await this.checkBudget(userId, estimatedCost);

      // Check if budget is sufficient
      if (budgetStatus.status === "exceeded") {
        return {
          approved: false,
          allocatedAmount: 0,
          remainingBudget: budgetStatus.remaining,
          recommendedAction: "reject",
        };
      }

      if (
        budgetStatus.status === "critical" &&
        estimatedCost > budgetStatus.remaining * 0.5
      ) {
        // If critical and request would use more than 50% of remaining budget
        return {
          approved: false,
          allocatedAmount: 0,
          remainingBudget: budgetStatus.remaining,
          recommendedAction: "downgrade",
        };
      }

      if (
        budgetStatus.status === "warning" &&
        estimatedCost > budgetStatus.remaining * 0.3
      ) {
        // If warning and request would use more than 30% of remaining budget
        return {
          approved: true,
          allocatedAmount: estimatedCost,
          remainingBudget: budgetStatus.remaining - estimatedCost,
          recommendedAction: "downgrade",
        };
      }

      // Normal allocation
      return {
        approved: true,
        allocatedAmount: estimatedCost,
        remainingBudget: budgetStatus.remaining - estimatedCost,
        recommendedAction: "proceed",
      };
    } catch (error) {
      logger.error("Error allocating budget:", error);
      throw error;
    }
  }

  /**
   * Enforce spending limits for a user
   * Implements automatic cost control actions
   */
  async enforceSpendingLimits(userId: string): Promise<SpendingAction> {
    try {
      // Get user's budget status
      const budgetStatus = await this.checkBudget(userId, 0);

      // Check for active alerts
      if (budgetStatus.activeAlerts.length > 0) {
        // Get the most restrictive action from active alerts
        const alert = budgetStatus.activeAlerts.reduce((prev, current) => {
          // Sort actions by restrictiveness
          const actionPriority: Record<BudgetAction, number> = {
            notify: 1,
            "auto-downgrade": 2,
            "restrict-models": 3,
            "require-approval": 4,
            "block-all": 5,
          };

          const prevMaxPriority = Math.max(
            ...prev.actions.map((a) => actionPriority[a]),
          );
          const currentMaxPriority = Math.max(
            ...current.actions.map((a) => actionPriority[a]),
          );

          return currentMaxPriority > prevMaxPriority ? current : prev;
        });

        // Get the most restrictive action
        const action = alert.actions.reduce((prev, current) => {
          const actionPriority: Record<BudgetAction, number> = {
            notify: 1,
            "auto-downgrade": 2,
            "restrict-models": 3,
            "require-approval": 4,
            "block-all": 5,
          };

          return actionPriority[current] > actionPriority[prev]
            ? current
            : prev;
        });

        return {
          action,
          reason: `Budget ${budgetStatus.percentUsed}% used (threshold: ${alert.threshold}%)`,
          budgetId: budgetStatus.budgetId,
          threshold: alert.threshold,
        };
      }

      // No active alerts, no restrictions
      return {
        action: "notify",
        reason: "No budget restrictions",
        budgetId: budgetStatus.budgetId,
        threshold: 0,
      };
    } catch (error) {
      logger.error("Error enforcing spending limits:", error);
      throw error;
    }
  }

  /**
   * Generate a cost report for a specific timeframe
   * Provides detailed cost analytics for budget management
   */
  async generateCostReport(timeframe: TimeRange): Promise<CostReport> {
    try {
      const { startDate, endDate } = timeframe;

      // Get total spend
      const totalSpendQuery = `
        SELECT SUM(amount) as total, currency
        FROM budget_usage_records
        WHERE timestamp >= $1 AND timestamp <= $2
        GROUP BY currency
      `;

      const totalSpendResult = await this.db.query(totalSpendQuery, [
        startDate,
        endDate,
      ]);
      const totalSpend =
        totalSpendResult.rows.length > 0
          ? parseFloat(totalSpendResult.rows[0].total)
          : 0;
      const currency =
        totalSpendResult.rows.length > 0
          ? totalSpendResult.rows[0].currency
          : "USD";

      // Get budget utilization
      const budgetUtilizationQuery = `
        SELECT
          SUM(bur.amount) / SUM(bd.amount) * 100 as utilization
        FROM
          budget_usage_records bur
        JOIN
          budget_definitions bd ON bur.budget_id = bd.id
        WHERE
          bur.timestamp >= $1 AND bur.timestamp <= $2
      `;

      const utilizationResult = await this.db.query(budgetUtilizationQuery, [
        startDate,
        endDate,
      ]);
      const budgetUtilization =
        utilizationResult.rows.length > 0
          ? parseFloat(utilizationResult.rows[0].utilization)
          : 0;

      // Get top models by cost
      const topModelsQuery = `
        SELECT
          metadata->>'modelId' as model,
          SUM(amount) as cost,
          COUNT(*) as usage
        FROM
          budget_usage_records
        WHERE
          timestamp >= $1 AND timestamp <= $2
          AND metadata->>'modelId' IS NOT NULL
        GROUP BY
          metadata->>'modelId'
        ORDER BY
          cost DESC
        LIMIT 5
      `;

      const topModelsResult = await this.db.query(topModelsQuery, [
        startDate,
        endDate,
      ]);
      const topModels = topModelsResult.rows.map((row) => ({
        model: row.model,
        cost: parseFloat(row.cost),
        usage: parseInt(row.usage),
      }));

      // Get top users by cost
      const topUsersQuery = `
        SELECT
          metadata->>'userId' as userId,
          SUM(amount) as cost
        FROM
          budget_usage_records
        WHERE
          timestamp >= $1 AND timestamp <= $2
          AND metadata->>'userId' IS NOT NULL
        GROUP BY
          metadata->>'userId'
        ORDER BY
          cost DESC
        LIMIT 5
      `;

      const topUsersResult = await this.db.query(topUsersQuery, [
        startDate,
        endDate,
      ]);
      const topUsers = topUsersResult.rows.map((row) => ({
        userId: row.userId,
        cost: parseFloat(row.cost),
      }));

      // Get daily spend
      const dailySpendQuery = `
        SELECT
          DATE_TRUNC('day', timestamp) as date,
          SUM(amount) as amount
        FROM
          budget_usage_records
        WHERE
          timestamp >= $1 AND timestamp <= $2
        GROUP BY
          DATE_TRUNC('day', timestamp)
        ORDER BY
          date
      `;

      const dailySpendResult = await this.db.query(dailySpendQuery, [
        startDate,
        endDate,
      ]);
      const dailySpend = dailySpendResult.rows.map((row) => ({
        date: row.date.toISOString().split("T")[0],
        amount: parseFloat(row.amount),
      }));

      return {
        totalSpend,
        budgetUtilization,
        topModels,
        topUsers,
        dailySpend,
        currency,
      };
    } catch (error) {
      logger.error("Error generating cost report:", error);
      throw error;
    }
  }

  /**
   * Get budget status with caching for performance
   * Uses in-memory cache with TTL to reduce database load
   */
  async getBudgetStatus(budgetId: string): Promise<BudgetStatusInfo> {
    try {
      // Check cache first
      const now = Date.now();
      const cachedStatus = this.budgetStatusCache.get(budgetId);

      if (
        cachedStatus &&
        now - cachedStatus.timestamp < this.CACHE_TTL * 1000
      ) {
        return cachedStatus.status;
      }

      // Cache miss or expired, fetch from database
      const query = `
        SELECT
          budget_id, current_amount, bd.amount as limit, bd.currency,
          percent_used, remaining, days_remaining, burn_rate,
          projected_total, status, last_updated
        FROM
          budget_status_cache bsc
        JOIN
          budget_definitions bd ON bsc.budget_id = bd.id
        WHERE
          budget_id = $1
      `;

      const result = await this.db.query(query, [budgetId]);

      if (result.rows.length === 0) {
        // If no cached status exists, refresh it
        await this.db.query("SELECT refresh_budget_status_cache($1)", [
          budgetId,
        ]);

        // Try again
        const retryResult = await this.db.query(query, [budgetId]);

        if (retryResult.rows.length === 0) {
          throw new Error(`Budget status not found for budget: ${budgetId}`);
        }

        const status = this.mapRowToBudgetStatus(retryResult.rows[0]);

        // Cache the result
        this.budgetStatusCache.set(budgetId, {
          status,
          timestamp: now,
        });

        return status;
      }

      const status = this.mapRowToBudgetStatus(result.rows[0]);

      // Cache the result
      this.budgetStatusCache.set(budgetId, {
        status,
        timestamp: now,
      });

      return status;
    } catch (error) {
      logger.error("Error getting budget status:", error);
      throw error;
    }
  }

  /**
   * Record usage against a budget
   * Optimized for high-throughput usage recording
   */
  async recordUsage(
    budgetId: string,
    request: RecordUsageRequest,
  ): Promise<UsageRecord> {
    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      const usageId = uuidv4();
      const timestamp = request.timestamp || new Date().toISOString();

      // Insert usage record
      const insertQuery = `
        INSERT INTO budget_usage_records (
          id, budget_id, amount, currency, timestamp, source, description, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        usageId,
        budgetId,
        request.amount,
        request.currency,
        timestamp,
        request.source,
        request.description || null,
        JSON.stringify(request.metadata),
      ];

      const result = await client.query(insertQuery, values);

      // The trigger will automatically update the budget status cache

      await client.query("COMMIT");

      // Invalidate the cache for this budget
      this.budgetStatusCache.delete(budgetId);

      const usageRecord: UsageRecord = {
        id: result.rows[0].id,
        budgetId: result.rows[0].budget_id,
        amount: parseFloat(result.rows[0].amount),
        currency: result.rows[0].currency,
        timestamp: result.rows[0].timestamp,
        source: result.rows[0].source,
        description: result.rows[0].description,
        metadata: JSON.parse(result.rows[0].metadata),
      };

      return usageRecord;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error recording usage:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if a budget can accommodate an estimated cost
   * Used for pre-flight checks before processing requests
   */
  async checkBudgetConstraints(
    budgetId: string,
    estimatedCost: number,
  ): Promise<BudgetConstraintCheck> {
    try {
      const status = await this.getBudgetStatus(budgetId);

      // Basic constraint check
      const canProceed = status.remaining >= estimatedCost;

      // Get budget definition to check alerts
      const budget = await this.budgetRegistry.getBudget(budgetId);

      if (!budget) {
        throw new Error(`Budget not found: ${budgetId}`);
      }

      // Calculate what the new utilization would be
      const newUtilization =
        ((status.currentAmount + estimatedCost) / status.limit) * 100;

      // Check if this would trigger any alerts
      const triggeredAlerts = budget.alerts.filter(
        (alert) =>
          newUtilization >= alert.threshold &&
          status.percentUsed < alert.threshold,
      );

      // Determine suggested actions based on triggered alerts
      const suggestedActions: BudgetAction[] = [];
      let reason = "";

      if (!canProceed) {
        reason = `Insufficient budget: ${status.remaining} remaining, ${estimatedCost} required`;
        suggestedActions.push("block-all");
      } else if (triggeredAlerts.length > 0) {
        // Get the most restrictive actions from triggered alerts
        const allActions = triggeredAlerts.flatMap((alert) => alert.actions);
        const uniqueActions = [...new Set(allActions)];

        // Sort by restrictiveness
        const actionPriority: Record<BudgetAction, number> = {
          notify: 1,
          "auto-downgrade": 2,
          "restrict-models": 3,
          "require-approval": 4,
          "block-all": 5,
        };

        uniqueActions.sort((a, b) => actionPriority[b] - actionPriority[a]);

        // Take the top 2 most restrictive actions
        suggestedActions.push(...uniqueActions.slice(0, 2));

        const highestThreshold = Math.max(
          ...triggeredAlerts.map((a) => a.threshold),
        );
        reason = `Would exceed ${highestThreshold}% budget threshold`;
      }

      return {
        budgetId,
        estimatedCost,
        currency: status.currency,
        canProceed,
        reason: reason || undefined,
        suggestedActions:
          suggestedActions.length > 0 ? suggestedActions : undefined,
      };
    } catch (error) {
      logger.error("Error checking budget constraints:", error);
      throw error;
    }
  }

  /**
   * Helper method to get a user's teams
   */
  private async getUserTeams(userId: string): Promise<string[]> {
    try {
      // This would typically query your user/team relationship table
      // For now, we'll use a placeholder implementation
      const query = `
        SELECT team_id
        FROM user_teams
        WHERE user_id = $1
      `;

      const result = await this.db.query(query, [userId]);
      return result.rows.map((row) => row.team_id);
    } catch (error) {
      logger.error("Error getting user teams:", error);
      return [];
    }
  }

  /**
   * Helper method to get a user's organization
   */
  private async getUserOrganization(userId: string): Promise<string | null> {
    try {
      // This would typically query your user/organization relationship table
      // For now, we'll use a placeholder implementation
      const query = `
        SELECT organization_id
        FROM users
        WHERE id = $1
      `;

      const result = await this.db.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0].organization_id : null;
    } catch (error) {
      logger.error("Error getting user organization:", error);
      return null;
    }
  }

  /**
   * Map database row to BudgetStatusInfo object
   */
  private mapRowToBudgetStatus(row: any): BudgetStatusInfo {
    return {
      budgetId: row.budget_id,
      currentAmount: parseFloat(row.current_amount),
      limit: parseFloat(row.limit),
      currency: row.currency,
      percentUsed: parseFloat(row.percent_used),
      remaining: parseFloat(row.remaining),
      daysRemaining: row.days_remaining || 0,
      burnRate: parseFloat(row.burn_rate || 0),
      projectedTotal: parseFloat(row.projected_total || 0),
      status: row.status,
      activeAlerts: [], // Would need to fetch from alert history table
      lastUpdated: row.last_updated,
    };
  }
}

