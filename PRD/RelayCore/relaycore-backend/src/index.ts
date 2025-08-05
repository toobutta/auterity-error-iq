import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { createServer } from 'http';
import { setupRoutes } from './api/routes';
import { errorHandler } from './core/middleware/errorHandler';
import { configManager } from './config/configManager';
import { logger } from './utils/logger';
import { connectRedis } from './cache/redisClient';
import { connectDatabase } from './analytics/database';
import { pluginManager } from './plugins/pluginManager';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// Load configuration
const config = configManager.getConfig();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// CORS configuration
if (config.server?.cors?.enabled) {
  app.use(
    cors({
      origin: config.server.cors.origins || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-AIHub-Cache', 'X-AIHub-Optimize'],
    }),
  );
}

// Rate limiting
if (config.server?.rateLimit?.enabled) {
  app.use(
    rateLimit({
      windowMs: config.server.rateLimit.windowMs || 60000, // 1 minute
      max: config.server.rateLimit.max || 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
}

// Setup API routes
setupRoutes(app);

// Error handling middleware
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Start server
async function startServer() {
  try {
    // Connect to Redis if enabled
    if (config.cache?.enabled && config.cache.type === 'redis') {
      await connectRedis();
      logger.info('Connected to Redis');
    }

    // Connect to database if enabled
    if (config.analytics?.enabled && config.analytics.storage?.type === 'postgres') {
      await connectDatabase();
      logger.info('Connected to database');
    }

    // Load plugins
    if (config.plugins?.enabled?.length) {
      const pluginsLoaded = await pluginManager.loadPlugins(app);
      logger.info(`Loaded ${pluginsLoaded} plugins`);
    }

    // Start server
    server.listen(port, host as string, () => {
      logger.info(`RelayCore server listening on http://${host}:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Shutdown plugins
  await pluginManager.shutdownPlugins();
  
  // Close Redis connection
  // Close database connection
  
  process.exit(0);
});

// Start server
startServer();

export default app;