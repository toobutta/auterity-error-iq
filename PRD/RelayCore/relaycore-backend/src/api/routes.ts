import { Application } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticate } from '../core/middleware/authMiddleware';
import { cacheMiddleware } from '../cache/cacheMiddleware';
import { analyticsMiddleware } from '../analytics/analyticsMiddleware';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';
import { notFoundHandler } from '../core/middleware/errorHandler';
import { setupProviderRoutes } from './providerRoutes';
import { setupAdminRoutes } from './adminRoutes';
import { setupBatchRoutes } from './batchRoutes';
import { setupCacheRoutes } from './cacheRoutes';
import { setupAnalyticsRoutes } from './analyticsRoutes';

// Setup all API routes
export function setupRoutes(app: Application): void {
  // Apply global middleware
  app.use(authenticate);
  app.use(analyticsMiddleware);
  
  // Setup provider routes
  setupProviderRoutes(app);
  
  // Setup batch routes
  setupBatchRoutes(app);
  
  // Setup cache routes
  setupCacheRoutes(app);
  
  // Setup analytics routes
  setupAnalyticsRoutes(app);
  
  // Setup admin routes
  setupAdminRoutes(app);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });
  
  // Not found handler
  app.use(notFoundHandler);
}