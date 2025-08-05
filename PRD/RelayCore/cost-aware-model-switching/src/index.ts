/**
 * Cost-Aware Model Switching Service
 * 
 * This service provides cost-aware model selection capabilities for the
 * RelayCore and Auterity integration.
 */

import dotenv from 'dotenv';
import { createLogger } from './utils/logger';
import { connectDatabase } from './database';
import { connectRedis } from './cache';
import app from './app';

// Import integrations
import { initializeIntegrations } from './integration';

// Load environment variables
dotenv.config();

// Create logger
const logger = createLogger();

// Get port from environment
const port = process.env.PORT || 3002;

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Connected to database');

    // Connect to Redis
    await connectRedis();
    logger.info('Connected to Redis');

    // Start listening
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
    
    // Initialize integrations with RelayCore and Auterity
    // This is done after the server starts to ensure the API is available
    if (process.env.ENABLE_INTEGRATIONS === 'true') {
      setTimeout(async () => {
        await initializeIntegrations();
      }, 5000); // Wait 5 seconds to ensure the server is fully started
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

// Start the server
startServer();