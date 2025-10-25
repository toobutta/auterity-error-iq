/**
 * Budget Integration Service
 * Integrates budget tracking with AI request processing
 */

import { logger } from "../utils/logger";
import { BudgetTracker } from "./budget-tracker";
import { BudgetRegistry } from "./budget-registry";
import { BudgetConstraintCheck, ScopeType } from "../types/budget";

export class BudgetIntegration {
  private budgetTracker: BudgetTracker;
  private budgetRegistry: BudgetRegistry;

  constructor() {
    this.budgetTracker = new BudgetTracker();
    this.budgetRegistry = new BudgetRegistry();
  }

  /**
   * Check if an AI request can proceed based on budget constraints
   */
  async checkRequestConstraints(
    userId: string,
    teamId?: string,
    projectId?: string,
    estimatedCost: number = 0,
  ): Promise<{
    canProceed: boolean;
    reason?: string;
    budgetChecks: BudgetConstraintCheck[];
  }> {
    try {
      const budgetChecks: BudgetConstraintCheck[] = [];
      let canProceed = true;
      let blockingReason: string | undefined;

      // Check user budget
      const userBudgets = await this.budgetRegistry.listBudgets({
        scopeType: "user",
        scopeId: userId,
      });

      for (const budget of userBudgets) {
        const check = await this.budgetTracker.checkBudgetConstraints(
          budget.id,
          estimatedCost,
        );
        budgetChecks.push(check);

        if (!check.canProceed) {
          canProceed = false;
          blockingReason = check.reason;
          break;
        }
      }

      // Check team budget if provided and user budget allows
      if (canProceed && teamId) {
        const teamBudgets = await this.budgetRegistry.listBudgets({
          scopeType: "team",
          scopeId: teamId,
        });

        for (const budget of teamBudgets) {
          const check = await this.budgetTracker.checkBudgetConstraints(
            budget.id,
            estimatedCost,
          );
          budgetChecks.push(check);

          if (!check.canProceed) {
            canProceed = false;
            blockingReason = check.reason;
            break;
          }
        }
      }

      // Check project budget if provided and previous budgets allow
      if (canProceed && projectId) {
        const projectBudgets = await this.budgetRegistry.listBudgets({
          scopeType: "project",
          scopeId: projectId,
        });

        for (const budget of projectBudgets) {
          const check = await this.budgetTracker.checkBudgetConstraints(
            budget.id,
            estimatedCost,
          );
          budgetChecks.push(check);

          if (!check.canProceed) {
            canProceed = false;
            blockingReason = check.reason;
            break;
          }
        }
      }

      return {
        canProceed,
        reason: blockingReason,
        budgetChecks,
      };
    } catch (error) {
      logger.error("Error checking request constraints:", error);
      // In case of error, allow the request to proceed but log the issue
      return {
        canProceed: true,
        reason: "Budget check failed - allowing request",
        budgetChecks: [],
      };
    }
  }

  /**
   * Record usage for an AI request across all applicable budgets
   */
  async recordRequestUsage(
    requestId: string,
    userId: string,
    teamId: string | undefined,
    projectId: string | undefined,
    modelId: string,
    cost: number,
    currency: string = "USD",
    timestamp?: string,
  ): Promise<void> {
    try {
      const usageMetadata = {
        requestId,
        modelId,
        userId,
        teamId,
        projectId,
        tags: {
          source: "ai-request",
          model: modelId,
        },
      };

      const usageRequest = {
        amount: cost,
        currency,
        timestamp,
        source: "relaycore" as const,
        description: `AI request using ${modelId}`,
        metadata: usageMetadata,
      };

      // Record usage against user budgets
      const userBudgets = await this.budgetRegistry.listBudgets({
        scopeType: "user",
        scopeId: userId,
      });

      for (const budget of userBudgets) {
        try {
          await this.budgetTracker.recordUsage(budget.id, usageRequest);
          logger.debug(`Recorded usage for user budget: ${budget.id}`);
        } catch (error) {
          logger.error(
            `Failed to record usage for user budget ${budget.id}:`,
            error,
          );
        }
      }

      // Record usage against team budgets
      if (teamId) {
        const teamBudgets = await this.budgetRegistry.listBudgets({
          scopeType: "team",
          scopeId: teamId,
        });

        for (const budget of teamBudgets) {
          try {
            await this.budgetTracker.recordUsage(budget.id, usageRequest);
            logger.debug(`Recorded usage for team budget: ${budget.id}`);
          } catch (error) {
            logger.error(
              `Failed to record usage for team budget ${budget.id}:`,
              error,
            );
          }
        }
      }

      // Record usage against project budgets
      if (projectId) {
        const projectBudgets = await this.budgetRegistry.listBudgets({
          scopeType: "project",
          scopeId: projectId,
        });

        for (const budget of projectBudgets) {
          try {
            await this.budgetTracker.recordUsage(budget.id, usageRequest);
            logger.debug(`Recorded usage for project budget: ${budget.id}`);
          } catch (error) {
            logger.error(
              `Failed to record usage for project budget ${budget.id}:`,
              error,
            );
          }
        }
      }

      logger.info(
        `Usage recorded for request ${requestId}: ${cost} ${currency}`,
      );
    } catch (error) {
      logger.error("Error recording request usage:", error);
      // Don't throw error to avoid breaking the AI request flow
    }
  }

  /**
   * Get budget summary for a user/team/project
   */
  async getBudgetSummary(
    scopeType: ScopeType,
    scopeId: string,
  ): Promise<{
    budgets: Array<{
      id: string;
      name: string;
      status: any;
      utilization: number;
    }>;
    totalBudgets: number;
    totalSpent: number;
    totalLimit: number;
    currency: string;
  }> {
    try {
      const budgets = await this.budgetRegistry.listBudgets({
        scopeType,
        scopeId,
      });

      let totalSpent = 0;
      let totalLimit = 0;
      let currency = "USD";

      const budgetSummaries = [];

      for (const budget of budgets) {
        const status = await this.budgetTracker.getBudgetStatus(budget.id);
        const utilization = await this.budgetTracker.calculateUtilization(
          budget.id,
        );

        if (status) {
          totalSpent += status.currentAmount;
          totalLimit += status.limit;
          currency = status.currency; // Assume all budgets use same currency

          budgetSummaries.push({
            id: budget.id,
            name: budget.name,
            status,
            utilization,
          });
        }
      }

      return {
        budgets: budgetSummaries,
        totalBudgets: budgets.length,
        totalSpent,
        totalLimit,
        currency,
      };
    } catch (error) {
      logger.error("Error getting budget summary:", error);
      throw error;
    }
  }

  /**
   * Check if any budgets need alerts to be triggered
   */
  async checkAndTriggerAlerts(): Promise<void> {
    try {
      // This would be called periodically to check for budget threshold violations
      // For now, we'll implement a basic version that logs alerts

      const allBudgets = await this.budgetRegistry.listBudgets({});

      for (const budget of allBudgets) {
        const status = await this.budgetTracker.getBudgetStatus(budget.id);

        if (!status) continue;

        // Check each alert threshold
        for (const alert of budget.alerts) {
          if (status.percentUsed >= alert.threshold) {
            // Check if this alert was already triggered recently
            const existingAlert = status.activeAlerts.find(
              (a) => a.threshold === alert.threshold && !a.acknowledged,
            );

            if (!existingAlert) {
              logger.warn(
                `Budget alert triggered for ${budget.name}: ${status.percentUsed}% used (threshold: ${alert.threshold}%)`,
              );

              // In a full implementation, you would:
              // 1. Insert into budget_alert_history
              // 2. Send notifications via configured channels
              // 3. Apply any automatic actions (restrict-models, auto-downgrade, etc.)
            }
          }
        }
      }
    } catch (error) {
      logger.error("Error checking and triggering alerts:", error);
    }
  }
}

