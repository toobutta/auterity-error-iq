/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

import { logger } from "../utils/logger";

// Suppress logs during testing
logger.level = "error";

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error";
process.env.SECRET_KEY = "test-secret-key-for-jwt";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:password@localhost:5432/relaycore_test";

// Global test timeout
jest.setTimeout(30000);

