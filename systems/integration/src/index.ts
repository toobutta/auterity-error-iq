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

interface CoreServices {
  messageBus: MessageBus;
  unifiedAuth: UnifiedAuth;
  crossSystemCache: CrossSystemCache;
  integrationLogger: IntegrationLogger;
  healthMonitor: HealthMonitor;
}

/**
 * Initialize core services with dependency injection
 */
function createCoreServices(): CoreServices {
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

  return {
    messageBus,
    unifiedAuth,
    crossSystemCache,
    integrationLogger,
    healthMonitor
  };
}

// Initialize core services
const coreServices = createCoreServices();
const { messageBus, unifiedAuth, crossSystemCache, integrationLogger, healthMonitor } = coreServices;

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
  stream: { write: (message: string) => integrationLogger.info('HTTP', 'request', message.trim()) }
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
    // Initialize system integrations with proper error handling and timeout
    integrationLogger.info('Integration', 'startup', 'Initializing system integrations...');
    
    // Parallel initialization with timeout to prevent hanging
    const INITIALIZATION_TIMEOUT = 30000; // 30 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Initialization timeout')), INITIALIZATION_TIMEOUT)
    );
    
    const initializationPromises = [
      auterityIntegration.initialize(),
      relayCoreIntegration.initialize(), 
      neuroWeaverIntegration.initialize(),
      messageBus.initialize()
    ];
    
    const initializationResults = await Promise.race([
      Promise.allSettled(initializationPromises),
      timeoutPromise
    ]) as PromiseSettledResult<void>[];

    // Check for initialization failures with detailed recovery options
    const failedServices: string[] = [];
    const criticalServices = ['MessageBus']; // Services that must initialize
    let hasCriticalFailure = false;
    
    initializationResults.forEach((result, index) => {
      const serviceNames = ['Auterity', 'RelayCore', 'NeuroWeaver', 'MessageBus'];
      const serviceName = serviceNames[index];
      
      if (result.status === 'rejected') {
        const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
        integrationLogger.error('Integration', 'startup', `Failed to initialize ${serviceName}:`, error);
        failedServices.push(serviceName);
        
        // Check if this is a critical service
        if (criticalServices.includes(serviceName)) {
          hasCriticalFailure = true;
        }
      } else {
        integrationLogger.info('Integration', 'startup', `Successfully initialized ${serviceName}`);
      }
    });

    // Handle failures based on criticality
    if (hasCriticalFailure) {
      throw new Error(`Critical services failed to initialize: ${failedServices.filter(s => criticalServices.includes(s)).join(', ')}`);
    }
    
    if (failedServices.length > 0) {
      integrationLogger.warn('Integration', 'startup', `Non-critical services failed: ${failedServices.join(', ')}. Continuing with degraded functionality.`);
    }

    // Start health monitoring after other services are ready
    await healthMonitor.initialize().catch((error) => {
      const errorMessage = error instanceof Error ? error : new Error(String(error));
      integrationLogger.error('Integration', 'health-monitor', 'Failed to initialize health monitor:', errorMessage);
      throw errorMessage;
    });

    integrationLogger.info('Integration', 'startup', 'All system integrations initialized successfully');

    const server = createServer(app);

    // Add server error handling
    server.on('error', (error: Error) => {
      integrationLogger.error('Integration', 'server', 'Server error:', error);
      if (error.message.includes('EADDRINUSE')) {
        integrationLogger.error('Integration', 'server', `Port ${PORT} is already in use. Please check for other running instances.`);
        process.exit(1);
      }
    });

    server.listen(PORT, () => {
      integrationLogger.info('Integration', 'server', `Three-system integration server running on port ${PORT}`);
      integrationLogger.info('Integration', 'server', `Environment: ${process.env.NODE_ENV || 'development'}`);
      integrationLogger.info('Integration', 'server', `Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown with timeout
    process.on('SIGTERM', async () => {
      integrationLogger.info('Integration', 'shutdown', 'SIGTERM received, shutting down gracefully');

      try {
        // Disconnect services with individual error handling
        const services = [
          { name: 'Auterity', service: auterityIntegration },
          { name: 'RelayCore', service: relayCoreIntegration },
          { name: 'NeuroWeaver', service: neuroWeaverIntegration },
          { name: 'MessageBus', service: messageBus }
        ];
        
        const disconnectPromises = services.map(({ name, service }) =>
          service.disconnect().catch((err) => {
            const error = err instanceof Error ? err : new Error(String(err));
            integrationLogger.error('Integration', 'shutdown', `Failed to disconnect ${name}:`, error);
          })
        );
        
        await Promise.allSettled(disconnectPromises);
      } catch (error) {
        const errorMessage = error instanceof Error ? error : new Error(String(error));
        integrationLogger.error('Integration', 'shutdown', 'Error during service disconnection:', errorMessage);
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
    const errorMessage = error instanceof Error ? error : new Error(String(error));
    integrationLogger.error('Integration', 'server', 'Failed to start integration server:', errorMessage);
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
  const errorMessage = error instanceof Error ? error : new Error(String(error));
  integrationLogger.error('Integration', 'server', 'Failed to start server:', errorMessage);
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
