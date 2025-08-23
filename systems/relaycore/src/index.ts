/**
 * RelayCore - AI Routing Hub Entry Point
 * Handles AI request routing, cost optimization, and provider management
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

import { aiRoutes } from './routes/ai';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';
import { modelsRoutes } from './routes/models';
import { budgetRoutes } from './routes/budgets';
import { adminRoutes } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { prometheusMiddleware } from './middleware/prometheus';
import { initializeTracing } from './middleware/tracing';
import { logger } from './utils/logger';
import { DatabaseConnection } from './services/database';
import { initializeDatabase, checkDatabaseHealth } from './database/init';
import { WebSocketService } from './services/websocket';
import { MetricsCollector } from './services/metrics-collector';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize metrics collector
const metricsCollector = new MetricsCollector();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Logging middleware
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Monitoring middleware
app.use(prometheusMiddleware);

// Initialize tracing
initializeTracing();

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/ai', authMiddleware, aiRoutes);
app.use('/api/v1/metrics', authMiddleware, metricsRoutes);
app.use('/api/v1/models', authMiddleware, modelsRoutes);
app.use('/api/v1/budgets', authMiddleware, budgetRoutes);
app.use('/admin', adminRoutes);

// Error handling middleware
app.use(errorHandler);

// Initialize database connection and schema
const initializeDatabaseConnection = async () => {
  try {
    await DatabaseConnection.initialize();
    logger.info('Database connection established');
    
    // Initialize schema if needed
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      logger.info('Database schema missing, initializing...');
      await initializeDatabase();
    }
    
    logger.info('Database initialization complete');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await initializeDatabaseConnection();
  
  const server = createServer(app);
  
  // Initialize WebSocket service
  const webSocketService = new WebSocketService(server, metricsCollector);
  
  server.listen(PORT, () => {
    logger.info(`RelayCore server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`WebSocket service initialized`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;