/**
 * Budget Registry Service
 * Manages the lifecycle of budget definitions including creation, retrieval, updating, and deletion
 */

import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { DatabaseConnection } from "./database";
import {
  BudgetDefinition,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetListQuery,
  ScopeType,
} from "../types/budget";

export class BudgetRegistry {
  constructor() {
    // No need to store db connection, use static methods
  }

  /**
   * Create a new budget definition
   */
  async createBudget(
    request: CreateBudgetRequest,
    createdBy: string,
  ): Promise<BudgetDefinition> {
    const client = await DatabaseConnection.getClient();

    try {
      await client.query("BEGIN");

      const budgetId = uuidv4();
      const now = new Date().toISOString();

      // Calculate end date if not provided for non-custom periods
      let endDate = request.endDate;
      if (!endDate && request.period !== "custom") {
        endDate = this.calculatePeriodEndDate(
          request.startDate,
          request.period,
        );
      }

      // Validate parent budget if specified
      if (request.parentBudgetId) {
        const parentCheck = await client.query(
          "SELECT id FROM budget_definitions WHERE id = $1 AND active = true",
          [request.parentBudgetId],
        );

        if (parentCheck.rows.length === 0) {
          throw new Error("Parent budget not found or inactive");
        }
      }

      // Insert budget definition
      const insertQuery = `
        INSERT INTO budget_definitions (
          id, name, description, scope_type, scope_id, amount, currency,
          period, start_date, end_date, recurring, alerts, tags,
          parent_budget_id, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;

      const values = [
        budgetId,
        request.name,
        request.description || null,
        request.scopeType,
        request.scopeId,
        request.amount,
        request.currency,
        request.period,
        request.startDate,
        endDate,
        request.recurring,
        JSON.stringify(request.alerts),
        JSON.stringify(request.tags || {}),
        request.parentBudgetId || null,
        createdBy,
        now,
        now,
      ];

      const result = await client.query(insertQuery, values);

      // Initialize budget status cache
      await client.query(
        `
        INSERT INTO budget_status_cache (budget_id, current_amount, percent_used, remaining, status)
        VALUES ($1, 0, 0, $2, 'normal')
      `,
        [budgetId, request.amount],
      );

      await client.query("COMMIT");

      const budget = this.mapRowToBudgetDefinition(result.rows[0]);

      logger.info(
        `Budget created: ${budgetId} for ${request.scopeType}:${request.scopeId}`,
      );

      return budget;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error creating budget:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a budget by ID
   */
  async getBudget(budgetId: string): Promise<BudgetDefinition | null> {
    try {
      const query =
        "SELECT * FROM budget_definitions WHERE id = $1 AND active = true";
      const result = await DatabaseConnection.query(query, [budgetId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToBudgetDefinition(result.rows[0]);
    } catch (error) {
      logger.error("Error getting budget:", error);
      throw error;
    }
  }

  /**
   * Update a budget definition
   */
  async updateBudget(
    budgetId: string,
    updates: UpdateBudgetRequest,
  ): Promise<BudgetDefinition | null> {
    const client = await DatabaseConnection.getClient();

    try {
      await client.query("BEGIN");

      // Check if budget exists
      const existingBudget = await client.query(
        "SELECT * FROM budget_definitions WHERE id = $1 AND active = true",
        [budgetId],
      );

      if (existingBudget.rows.length === 0) {
        return null;
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }

      if (updates.amount !== undefined) {
        updateFields.push(`amount = $${paramIndex++}`);
        values.push(updates.amount);
      }

      if (updates.currency !== undefined) {
        updateFields.push(`currency = $${paramIndex++}`);
        values.push(updates.currency);
      }

      if (updates.period !== undefined) {
        updateFields.push(`period = $${paramIndex++}`);
        values.push(updates.period);
      }

      if (updates.startDate !== undefined) {
        updateFields.push(`start_date = $${paramIndex++}`);
        values.push(updates.startDate);
      }

      if (updates.endDate !== undefined) {
        updateFields.push(`end_date = $${paramIndex++}`);
        values.push(updates.endDate);
      }

      if (updates.recurring !== undefined) {
        updateFields.push(`recurring = $${paramIndex++}`);
        values.push(updates.recurring);
      }

      if (updates.alerts !== undefined) {
        updateFields.push(`alerts = $${paramIndex++}`);
        values.push(JSON.stringify(updates.alerts));
      }

      if (updates.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex++}`);
        values.push(JSON.stringify(updates.tags));
      }

      if (updateFields.length === 0) {
        await client.query("ROLLBACK");
        return this.mapRowToBudgetDefinition(existingBudget.rows[0]);
      }

      updateFields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date().toISOString());

      values.push(budgetId);

      const updateQuery = `
        UPDATE budget_definitions
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex} AND active = true
        RETURNING *
      `;

      const result = await client.query(updateQuery, values);

      // Update budget status cache if amount changed
      if (updates.amount !== undefined) {
        await client.query("SELECT refresh_budget_status_cache($1)", [
          budgetId,
        ]);
      }

      await client.query("COMMIT");

      const budget = this.mapRowToBudgetDefinition(result.rows[0]);

      logger.info(`Budget updated: ${budgetId}`);

      return budget;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error updating budget:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a budget (soft delete by setting active = false)
   */
  async deleteBudget(budgetId: string): Promise<boolean> {
    const client = await DatabaseConnection.getClient();

    try {
      await client.query("BEGIN");

      // Check if budget has child budgets
      const childCheck = await client.query(
        "SELECT COUNT(*) as count FROM budget_definitions WHERE parent_budget_id = $1 AND active = true",
        [budgetId],
      );

      if (parseInt(childCheck.rows[0].count) > 0) {
        throw new Error("Cannot delete budget with active child budgets");
      }

      // Soft delete the budget
      const result = await client.query(
        "UPDATE budget_definitions SET active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND active = true",
        [budgetId],
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      // Remove from status cache
      await client.query(
        "DELETE FROM budget_status_cache WHERE budget_id = $1",
        [budgetId],
      );

      await client.query("COMMIT");

      logger.info(`Budget deleted: ${budgetId}`);

      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error deleting budget:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * List budgets based on query parameters
   */
  async listBudgets(query: BudgetListQuery): Promise<BudgetDefinition[]> {
    try {
      let sql = "SELECT * FROM budget_definitions WHERE active = true";
      const values: any[] = [];
      let paramIndex = 1;

      if (query.scopeType) {
        sql += ` AND scope_type = $${paramIndex++}`;
        values.push(query.scopeType);
      }

      if (query.scopeId) {
        sql += ` AND scope_id = $${paramIndex++}`;
        values.push(query.scopeId);
      }

      if (query.parentBudgetId) {
        sql += ` AND parent_budget_id = $${paramIndex++}`;
        values.push(query.parentBudgetId);
      }

      if (!query.includeInactive) {
        sql += " AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP)";
      }

      sql += " ORDER BY created_at DESC";

      const result = await DatabaseConnection.query(sql, values);

      return result.rows.map((row: any) => this.mapRowToBudgetDefinition(row));
    } catch (error) {
      logger.error("Error listing budgets:", error);
      throw error;
    }
  }

  /**
   * Get budget hierarchy for a scope
   */
  async getBudgetHierarchy(
    scopeType: ScopeType,
    scopeId: string,
  ): Promise<BudgetDefinition[]> {
    try {
      // Get all budgets for the scope and build hierarchy
      const query = `
        WITH RECURSIVE budget_hierarchy AS (
          -- Base case: root budgets (no parent)
          SELECT *, 0 as level
          FROM budget_definitions
          WHERE scope_type = $1 AND scope_id = $2 AND parent_budget_id IS NULL AND active = true

          UNION ALL

          -- Recursive case: child budgets
          SELECT bd.*, bh.level + 1
          FROM budget_definitions bd
          INNER JOIN budget_hierarchy bh ON bd.parent_budget_id = bh.id
          WHERE bd.active = true
        )
        SELECT * FROM budget_hierarchy ORDER BY level, created_at
      `;

      const result = await DatabaseConnection.query(query, [
        scopeType,
        scopeId,
      ]);

      return result.rows.map((row: any) => this.mapRowToBudgetDefinition(row));
    } catch (error) {
      logger.error("Error getting budget hierarchy:", error);
      throw error;
    }
  }

  /**
   * Calculate period end date based on start date and period type
   */
  private calculatePeriodEndDate(startDate: string, period: string): string {
    const start = new Date(startDate);
    let end: Date;

    switch (period) {
      case "daily":
        end = new Date(start);
        end.setDate(start.getDate() + 1);
        break;
      case "weekly":
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        break;
      case "monthly":
        end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        break;
      case "quarterly":
        end = new Date(start);
        end.setMonth(start.getMonth() + 3);
        break;
      case "annual":
        end = new Date(start);
        end.setFullYear(start.getFullYear() + 1);
        break;
      default:
        throw new Error(`Unsupported period type: ${period}`);
    }

    // Set to end of day
    end.setHours(23, 59, 59, 999);

    return end.toISOString();
  }

  /**
   * Map database row to BudgetDefinition object
   */
  private mapRowToBudgetDefinition(row: any): BudgetDefinition {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      scopeType: row.scope_type,
      scopeId: row.scope_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      period: row.period,
      startDate: row.start_date,
      endDate: row.end_date,
      recurring: row.recurring,
      alerts: JSON.parse(row.alerts || "[]"),
      tags: JSON.parse(row.tags || "{}"),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      parentBudgetId: row.parent_budget_id,
    };
  }
}

