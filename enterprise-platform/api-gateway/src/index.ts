/**
 * API Gateway Entry Point
 */

import dotenv from "dotenv";
import { EnterpriseAPIGateway, defaultGatewayConfig } from "./gateway";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

async function startGateway() {
  try {
    const gateway = new EnterpriseAPIGateway(defaultGatewayConfig);
    gateway.start();

    logger.info("Enterprise API Gateway initialized successfully");

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("Received SIGTERM, shutting down gracefully");
      process.exit(0);
    });

    process.on("SIGINT", () => {
      logger.info("Received SIGINT, shutting down gracefully");
      process.exit(0);
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to start API Gateway", { error: errorMessage });
    process.exit(1);
  }
}

startGateway();
