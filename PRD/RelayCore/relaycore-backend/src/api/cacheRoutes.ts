import { Application, Request, Response } from 'express';
import { getCache, deleteCache, clearCache, getCacheStats } from '../cache/redisClient';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';
import { ApiError } from '../core/middleware/errorHandler';

// Setup cache routes
export function setupCacheRoutes(app: Application): void {
  const config = configManager.getConfig();
  
  // Check if cache is enabled
  if (!config.cache?.enabled) {
    logger.info('Cache is disabled, skipping cache routes');
    return;
  }
  
  logger.info('Setting up cache routes');
  
  // Get cache statistics
  app.get('/v1/cache/stats', async (req: Request, res: Response) => {
    try {
      const stats = await getCacheStats();
      
      res.status(200).json({
        stats,
        config: {
          enabled: config.cache.enabled,
          type: config.cache.type,
          ttl: config.cache.ttl,
          similarityCache: config.cache.similarityCache,
        },
      });
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      
      res.status(500).json({
        error: {
          type: 'internal_error',
          message: 'Failed to get cache statistics',
        },
      });
    }
  });
  
  // Clear cache
  app.post('/v1/cache/clear', async (req: Request, res: Response) => {
    try {
      await clearCache();
      
      res.status(200).json({
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      logger.error('Error clearing cache:', error);
      
      res.status(500).json({
        error: {
          type: 'internal_error',
          message: 'Failed to clear cache',
        },
      });
    }
  });
  
  // Get cache entry
  app.get('/v1/cache/:cacheKey', async (req: Request, res: Response) => {
    try {
      const { cacheKey } = req.params;
      
      // Get cache entry
      const cacheEntry = await getCache(`relaycore:cache:${cacheKey}`);
      
      if (!cacheEntry) {
        throw new ApiError(404, 'Cache entry not found', 'not_found_error');
      }
      
      res.status(200).json({
        key: cacheKey,
        data: cacheEntry,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          error: {
            type: error.type,
            message: error.message,
          },
        });
      } else {
        logger.error('Error getting cache entry:', error);
        
        res.status(500).json({
          error: {
            type: 'internal_error',
            message: 'Failed to get cache entry',
          },
        });
      }
    }
  });
  
  // Delete cache entry
  app.delete('/v1/cache/:cacheKey', async (req: Request, res: Response) => {
    try {
      const { cacheKey } = req.params;
      
      // Delete cache entry
      await deleteCache(`relaycore:cache:${cacheKey}`);
      
      res.status(200).json({
        message: 'Cache entry deleted successfully',
        key: cacheKey,
      });
    } catch (error) {
      logger.error('Error deleting cache entry:', error);
      
      res.status(500).json({
        error: {
          type: 'internal_error',
          message: 'Failed to delete cache entry',
        },
      });
    }
  });
  
  logger.info('Cache routes configured');
}