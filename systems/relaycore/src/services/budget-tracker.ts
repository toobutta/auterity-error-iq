/**
 * Budget Tracker Service
 * Monitors and records usage against budgets, calculating current status and remaining amounts
 */

import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { DatabaseConnection } from "./database";
import {
  BudgetStatusInfo,
  UsageRecord,
  RecordUsageRequest,
  BudgetConstraintCheck,
  BudgetAction,
} from "../types/budget";

export class BudgetTracker {
  constructor() {
    // No need to store db connection, use static methods
  }

  /**
   * Record usage against a budget
   */
  async recordUsage(
    budgetId: string,
    request: RecordUsageRequest,
  ): Promise<UsageRecord> {
    const client = await DatabaseConnection.getClient();

    try {
      await client.query("BEGIN");

      // Verify budget exists and is active
      const budgetCheck = await client.query(
        "SELECT id, currency FROM budget_definitions WHERE id = $1 AND active = true",
        [budgetId],
      );

      if (budgetCheck.rows.length === 0) {
        throw new Error("Budget not found or inactive");
      }

      const budgetCurrency = budgetCheck.rows[0].currency;

      // Convert currency if needed (for now, we'll require matching currencies)
      if (request.currency !== budgetCurrency) {
        logger.warn(
          `Currency mismatch: budget uses ${budgetCurrency}, usage recorded in ${request.currency}`,
        );
        // In a production system, you'd implement currency conversion here
      }

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

      const usageRecord = this.mapRowToUsageRecord(result.rows[0]);

      logger.info(
        `Usage recorded: ${request.amount} ${request.currency} for budget ${budgetId}`,
      );

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
   * Get current budget status
   */
  async getBudgetStatus(budgetId: string): Promise<BudgetStatusInfo | null> {
    try {
      // First check if budget exists
      const budgetCheck = await DatabaseConnection.query(
        "SELECT * FROM budget_definitions WHERE id = $1 AND active = true",
        [budgetId],
      );

      if (budgetCheck.rows.length === 0) {
        return null;
      }

      const budget = budgetCheck.rows[0];

      // Get status from cache, refresh if needed
      let statusResult = await DatabaseConnection.query(
        "SELECT * FROM budget_status_cache WHERE budget_id = $1",
        [budgetId],
      );

      if (
        statusResult.rows.length === 0 ||
        this.isCacheStale(statusResult.rows[0].last_updated)
      ) {
        // Refresh cache
        await DatabaseConnection.query(
          "SELECT refresh_budget_status_cache($1)",
          [budgetId],
        );

        statusResult = await DatabaseConnection.query(
          "SELECT * FROM budget_status_cache WHERE budget_id = $1",
          [budgetId],
        );
      }

      if (statusResult.rows.length === 0) {
        throw new Error("Failed to calculate budget status");
      }

      const status = statusResult.rows[0];

      // Get active alerts
      const alertsResult = await DatabaseConnection.query(
        `
        SELECT * FROM budget_alert_history
        WHERE budget_id = $1 AND acknowledged = false
        ORDER BY triggered_at DESC
      `,
        [budgetId],
      );

      const activeAlerts = alertsResult.rows.map((row: any) => ({
        threshold: parseFloat(row.threshold),
        triggeredAt: row.triggered_at,
        actions: JSON.parse(row.actions),
        acknowledged: row.acknowledged,
        acknowledgedBy: row.acknowledged_by,
        acknowledgedAt: row.acknowledged_at,
      }));

      return {
        budgetId: budgetId,
        currentAmount: parseFloat(status.current_amount),
        limit: parseFloat(budget.amount),
        currency: budget.currency,
        percentUsed: parseFloat(status.percent_used),
        remaining: parseFloat(status.remaining),
        daysRemaining: status.days_remaining,
        burnRate: parseFloat(status.burn_rate),
        projectedTotal: parseFloat(status.projected_total),
        status: status.status,
        activeAlerts: activeAlerts,
        lastUpdated: status.last_updated,
      };
    } catch (error) {
      logger.error("Error getting budget status:", error);
      throw error;
    }
  }

  /**
   * Calculate budget utilization percentage
   */
  async calculateUtilization(budgetId: string): Promise<number> {
    try {
      const status = await this.getBudgetStatus(budgetId);
      return status ? status.percentUsed : 0;
    } catch (error) {
      logger.error("Error calculating utilization:", error);
      throw error;
    }
  }

  /**
   * Forecast remaining period spending
   */
  async forecastRemainingPeriod(budgetId: string): Promise<number> {
    try {
      const status = await this.getBudgetStatus(budgetId);
      if (!status) {
        return 0;
      }

      // Simple linear projection based on current burn rate
      return status.burnRate * Math.max(0, status.daysRemaining);
    } catch (error) {
      logger.error("Error forecasting remaining period:", error);
      throw error;
    }
  }

  /**
   * Check if a proposed spending would violate budget constraints
   */
  async checkBudgetConstraints(
    budgetId: string,
    estimatedCost: number,
  ): Promise<BudgetConstraintCheck> {
    try {
      const status = await this.getBudgetStatus(budgetId);

      if (!status) {
        return {
          budgetId,
          estimatedCost,
          currency: "USD",
          canProceed: false,
          reason: "Budget not found",
        };
      }

      const projectedAmount = status.currentAmount + estimatedCost;
      const projectedPercent = (projectedAmount / status.limit) * 100;

      // Check against budget alerts to determine actions
      const budget = await DatabaseConnection.query(
        "SELECT alerts FROM budget_definitions WHERE id = $1",
        [budgetId],
      );

      if (budget.rows.length === 0) {
        return {
          budgetId,
          estimatedCost,
          currency: status.currency,
          canProceed: false,
          reason: "Budget configuration not found",
        };
      }

      const alerts = JSON.parse(budget.rows[0].alerts || "[]");
      let suggestedActions: BudgetAction[] = [];
      let canProceed = true;
      let reason = "";

      // Find the highest threshold that would be exceeded
      for (const alert of alerts.sort(
        (a: any, b: any) => b.threshold - a.threshold,
      )) {
        if (projectedPercent >= alert.threshold) {
          suggestedActions = alert.actions;

          // Check if any blocking actions are present
          if (alert.actions.includes("block-all")) {
            canProceed = false;
            reason = `Would exceed ${alert.threshold}% budget threshold (${projectedPercent.toFixed(1)}%)`;
          } else if (alert.actions.includes("require-approval")) {
            canProceed = false;
            reason = `Requires approval - would exceed ${alert.threshold}% budget threshold`;
          }

          break;
        }
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
   * Get usage history for a budget
   */
  async getUsageHistory(
    budgetId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<UsageRecord[]> {
    try {
      const query = `
        SELECT * FROM budget_usage_records
        WHERE budget_id = $1
        ORDER BY timestamp DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await DatabaseConnection.query(query, [
        budgetId,
        limit,
        offset,
      ]);

      return result.rows.map((row: any) => this.mapRowToUsageRecord(row));
    } catch (error) {
      logger.error("Error getting usage history:", error);
      throw error;
    }
  }

  /**
   * Get usage summary for a time period
   */
  async getUsageSummary(
    budgetId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    totalAmount: number;
    currency: string;
    recordCount: number;
    averagePerDay: number;
    bySource: Record<string, number>;
  }> {
    try {
      const summaryQuery = `
        SELECT
          COALESCE(SUM(amount), 0) as total_amount,
          COUNT(*) as record_count,
          source,
          (SELECT currency FROM budget_definitions WHERE id = $1) as currency
        FROM budget_usage_records
        WHERE budget_id = $1
        AND timestamp >= $2
        AND timestamp <= $3
        GROUP BY source
      `;

      const result = await DatabaseConnection.query(summaryQuery, [
        budgetId,
        startDate,
        endDate,
      ]);

      let totalAmount = 0;
      let recordCount = 0;
      const bySource: Record<string, number> = {};
      const currency = result.rows[0]?.currency || "USD";

      for (const row of result.rows) {
        const amount = parseFloat(row.total_amount);
        totalAmount += amount;
        recordCount += parseInt(row.record_count);
        bySource[row.source] = amount;
      }

      const daysDiff = Math.max(
        1,
        Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      return {
        totalAmount,
        currency,
        recordCount,
        averagePerDay: totalAmount / daysDiff,
        bySource,
      };
    } catch (error) {
      logger.error("Error getting usage summary:", error);
      throw error;
    }
  }

  /**
   * Refresh budget status cache for all budgets or a specific budget
   */
  async refreshStatusCache(budgetId?: string): Promise<void> {
    try {
      if (budgetId) {
        await DatabaseConnection.query(
          "SELECT refresh_budget_status_cache($1)",
          [budgetId],
        );
        logger.info(`Budget status cache refreshed for budget: ${budgetId}`);
      } else {
        await DatabaseConnection.query("SELECT refresh_budget_status_cache()");
        logger.info("Budget status cache refreshed for all budgets");
      }
    } catch (error) {
      logger.error("Error refreshing status cache:", error);
      throw error;
    }
  }

  /**
   * Check if cache is stale (older than 5 minutes)
   */
  private isCacheStale(lastUpdated: string): boolean {
    const cacheAge = Date.now() - new Date(lastUpdated).getTime();
    return cacheAge > 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Map database row to UsageRecord object
   */
  private mapRowToUsageRecord(row: any): UsageRecord {
    return {
      id: row.id,
      budgetId: row.budget_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      timestamp: row.timestamp,
      source: row.source,
      description: row.description,
      metadata: JSON.parse(row.metadata || "{}"),
    };
  }
}

