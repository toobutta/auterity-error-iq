/**
 * RelayCore Database Initialization
 * Sets up database schema and initial data
 */

import { readFileSync } from "fs";
import { join } from "path";
import { DatabaseConnection } from "../services/database";
import { logger } from "../utils/logger";

export async function initializeDatabase(): Promise<void> {
  try {
    logger.info("Initializing RelayCore database...");

    // Read main schema file
    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf8");

    // Read budget schema file
    const budgetSchemaPath = join(__dirname, "budget-schema.sql");
    const budgetSchema = readFileSync(budgetSchemaPath, "utf8");

    // Execute schemas
    await DatabaseConnection.query(schema);
    await DatabaseConnection.query(budgetSchema);

    logger.info("Database schema initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize database:", error);
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Check if required tables exist
    const tables = [
      "ai_request_metrics",
      "steering_rules",
      "provider_status",
      "budget_definitions",
      "budget_usage_records",
      "budget_alert_history",
      "budget_status_cache",
      "cost_history",
    ];

    for (const table of tables) {
      const result = await DatabaseConnection.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [table],
      );

      if (!result.rows[0].exists) {
        logger.error(`Required table '${table}' does not exist`);
        return false;
      }
    }

    logger.info("Database health check passed");
    return true;
  } catch (error) {
    logger.error("Database health check failed:", error);
    return false;
  }
}

// CLI script for manual database initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      logger.info("Database initialization completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Database initialization failed:", error);
      process.exit(1);
    });
}

