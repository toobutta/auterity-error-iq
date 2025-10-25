/**
 * RelayCore Database Connection
 * PostgreSQL connection management
 */

import { Pool, PoolClient } from "pg";
import { logger } from "../utils/logger";

export class DatabaseConnection {
  private static pool: Pool;

  static getInstance(): DatabaseConnection {
    return new DatabaseConnection();
  }

  static async initialize(): Promise<void> {
    if (!this.pool) {
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is required");
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      await this.checkConnection();
      logger.info("Database connection pool initialized");
    }
  }

  static async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      await this.initialize();
    }
    return this.pool.connect();
  }

  static async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      await this.initialize();
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug("Executed query", { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error("Database query error:", { text, error });
      throw error;
    }
  }

  static async checkConnection(): Promise<void> {
    try {
      await this.query("SELECT 1");
      logger.debug("Database connection check successful");
    } catch (error) {
      logger.error("Database connection check failed:", error);
      throw error;
    }
  }

  static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      logger.info("Database connection pool closed");
    }
  }
}

