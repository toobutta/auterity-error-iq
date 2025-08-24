/**
 * Three-System Integration Layer
 * Connects Auterity, RelayCore, and NeuroWeaver systems
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Import integration services
import { AuterityIntegration } from './services/auterity-integration';
import { RelayCoreIntegration } from './services/relaycore-integration';
import { NeuroWeaverIntegration } from './services/neuroweaver-integration';
import { MessageBus } from './services/message-bus';
import { UnifiedAuth } from './services/unified-auth';
import { CrossSystemCache } from './services/cross-system-cache';
import { IntegrationLogger } from './services/integration-logger';
import { HealthMonitor } from './services/health-monitor';

// Import middleware
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { authMiddleware } from './middleware/auth-middleware';

// Import routes
import { integrationRoutes } from './routes/integration';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.INTEGRATION_PORT || 3002;

// Configuration constants
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const ENABLE_ALERTS_DEFAULT = true;
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

// Initialize core services
const messageBus = new MessageBus();
const unifiedAuth = new UnifiedAuth();
const crossSystemCache = new CrossSystemCache();
const integrationLogger = new IntegrationLogger();
const healthMonitor = new HealthMonitor(
  integrationLogger,
  crossSystemCache,
  HEALTH_CHECK_INTERVAL,
  ENABLE_ALERTS_DEFAULT
);

// Initialize system integrations
const auterityIntegration = new AuterityIntegration({
  messageBus,
  unifiedAuth,
  crossSystemCache,
  integrationLogger,
  healthMonitor
});

const relayCoreIntegration = new RelayCoreIntegration({
  messageBus,
  unifiedAuth,
  crossSystemCache,
  integrationLogger,
  healthMonitor
});

const neuroWeaverIntegration = new NeuroWeaverIntegration({
  messageBus,
  unifiedAuth,
  crossSystemCache,
  integrationLogger,
  healthMonitor
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',  // Auterity frontend
    'http://localhost:3001',  // RelayCore admin
    'http://localhost:3003'   // NeuroWeaver UI
  ],
  credentials: true
}));

// Logging middleware
app.use(morgan('combined', {
  stream: { write: (message) => integrationLogger.info('HTTP', 'request', message.trim()) }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', rateLimiter);

// Authentication middleware
app.use('/api', authMiddleware(unifiedAuth));

// Health check routes
app.use('/health', healthRoutes);

// Metrics routes
app.use('/api/v1/metrics', metricsRoutes);

// Integration routes
app.use('/api/v1/integration', integrationRoutes({
  auterityIntegration,
  relayCoreIntegration,
  neuroWeaverIntegration,
  messageBus,
  crossSystemCache
}));

// Error handling middleware
app.use(errorHandler);

// Initialize database connection and start server
const startServer = async () => {
  try {
    // Initialize system integrations in parallel for better performance
    await Promise.all([
      auterityIntegration.initialize(),
      relayCoreIntegration.initialize(),
      neuroWeaverIntegration.initialize(),
      messageBus.initialize()
    ]);

    // Start health monitoring after other services are ready
    await healthMonitor.initialize();

    integrationLogger.info('Integration', 'startup', 'All system integrations initialized successfully');

    const server = createServer(app);

    server.listen(PORT, () => {
      integrationLogger.info('Integration', 'server', `Three-system integration server running on port ${PORT}`);
      integrationLogger.info('Integration', 'server', `Environment: ${process.env.NODE_ENV || 'development'}`);
      integrationLogger.info('Integration', 'server', `Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown with timeout
    process.on('SIGTERM', async () => {
      integrationLogger.info('Integration', 'shutdown', 'SIGTERM received, shutting down gracefully');

      try {
        await auterityIntegration.disconnect();
        await relayCoreIntegration.disconnect();
        await neuroWeaverIntegration.disconnect();
        await messageBus.disconnect();
      } catch (error) {
        integrationLogger.error('Integration', 'shutdown', 'Error during service disconnection:', error);
      }

      const shutdownTimeout = setTimeout(() => {
        integrationLogger.error('Integration', 'shutdown', 'Forced shutdown due to timeout');
        process.exit(1);
      }, SHUTDOWN_TIMEOUT);

      server.close(() => {
        clearTimeout(shutdownTimeout);
        integrationLogger.info('Integration', 'shutdown', 'Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    integrationLogger.error('Integration', 'server', 'Failed to start integration server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  integrationLogger.error('Integration', 'exception', 'Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const error = new Error(String(reason));
  error.name = 'UnhandledRejection';
  integrationLogger.error('Integration', 'Unhandled Rejection', `Unhandled Rejection at: ${String(promise)}, reason: ${String(reason)}`, error);
  process.exit(1);
});

startServer().catch((error) => {
  integrationLogger.error('Integration', 'server', 'Failed to start server:', error);
  process.exit(1);
});

// Export for testing
export {
  app,
  auterityIntegration,
  relayCoreIntegration,
  neuroWeaverIntegration,
  messageBus,
  unifiedAuth,
  crossSystemCache,
  integrationLogger,
  healthMonitor
};
