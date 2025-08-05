import { Application, Request, Response } from 'express';
import { getUsageStats, getRequestHistory } from '../analytics/database';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';
import { ApiError } from '../core/middleware/errorHandler';

// Setup analytics routes
export function setupAnalyticsRoutes(app: Application): void {
  const config = configManager.getConfig();
  
  // Check if analytics is enabled
  if (!config.analytics?.enabled) {
    logger.info('Analytics is disabled, skipping analytics routes');
    return;
  }
  
  logger.info('Setting up analytics routes');
  
  // Get usage statistics
  app.get('/v1/analytics/usage', async (req: Request, res: Response) => {
    try {
      // Parse query parameters
      const userId = req.query.user_id as string;
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
      
      // Check if user has permission to view other users' data
      if (userId && userId !== req.user?.id) {
        // Check if user has admin role (simplified check)
        const isAdmin = req.user?.role === 'admin';
        
        if (!isAdmin) {
          throw new ApiError(403, 'You do not have permission to view other users\' data', 'permission_denied_error');
        }
      }
      
      // Get usage statistics
      const stats = await getUsageStats(userId || req.user?.id, startDate, endDate);
      
      // Calculate totals
      const totals = {
        request_count: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_cost: 0,
      };
      
      for (const stat of stats) {
        totals.request_count += parseInt(stat.request_count);
        totals.total_input_tokens += parseInt(stat.total_input_tokens);
        totals.total_output_tokens += parseInt(stat.total_output_tokens);
        totals.total_cost += parseFloat(stat.total_cost);
      }
      
      res.status(200).json({
        stats,
        totals,
        period: {
          start_date: startDate?.toISOString() || 'all',
          end_date: endDate?.toISOString() || 'all',
        },
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
        logger.error('Error getting usage statistics:', error);
        
        res.status(500).json({
          error: {
            type: 'internal_error',
            message: 'Failed to get usage statistics',
          },
        });
      }
    }
  });
  
  // Get request history
  app.get('/v1/analytics/requests', async (req: Request, res: Response) => {
    try {
      // Parse query parameters
      const userId = req.query.user_id as string;
      const limit = parseInt(req.query.limit as string || '100');
      const offset = parseInt(req.query.offset as string || '0');
      
      // Check if user has permission to view other users' data
      if (userId && userId !== req.user?.id) {
        // Check if user has admin role (simplified check)
        const isAdmin = req.user?.role === 'admin';
        
        if (!isAdmin) {
          throw new ApiError(403, 'You do not have permission to view other users\' data', 'permission_denied_error');
        }
      }
      
      // Get request history
      const requests = await getRequestHistory(userId || req.user?.id, limit, offset);
      
      res.status(200).json({
        requests,
        pagination: {
          limit,
          offset,
          total: requests.length, // This should be the total count, not just the returned count
        },
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
        logger.error('Error getting request history:', error);
        
        res.status(500).json({
          error: {
            type: 'internal_error',
            message: 'Failed to get request history',
          },
        });
      }
    }
  });
  
  // Get cost statistics
  app.get('/v1/analytics/costs', async (req: Request, res: Response) => {
    try {
      // Parse query parameters
      const userId = req.query.user_id as string;
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
      const groupBy = req.query.group_by as string || 'provider'; // provider, model, day, month
      
      // Check if user has permission to view other users' data
      if (userId && userId !== req.user?.id) {
        // Check if user has admin role (simplified check)
        const isAdmin = req.user?.role === 'admin';
        
        if (!isAdmin) {
          throw new ApiError(403, 'You do not have permission to view other users\' data', 'permission_denied_error');
        }
      }
      
      // Get usage statistics (reusing the same function for now)
      const stats = await getUsageStats(userId || req.user?.id, startDate, endDate);
      
      // Calculate totals
      const totalCost = stats.reduce((sum, stat) => sum + parseFloat(stat.total_cost), 0);
      
      res.status(200).json({
        costs: stats,
        total_cost: totalCost,
        period: {
          start_date: startDate?.toISOString() || 'all',
          end_date: endDate?.toISOString() || 'all',
        },
        group_by: groupBy,
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
        logger.error('Error getting cost statistics:', error);
        
        res.status(500).json({
          error: {
            type: 'internal_error',
            message: 'Failed to get cost statistics',
          },
        });
      }
    }
  });
  
  // Get optimization statistics
  app.get('/v1/analytics/optimizations', async (req: Request, res: Response) => {
    try {
      // This is a placeholder implementation
      // In a real implementation, this would query the database for optimization statistics
      
      res.status(200).json({
        optimizations: {
          cache_hits: 0,
          token_savings: 0,
          cost_savings: 0,
          optimizations_applied: {
            tokenOptimization: 0,
            promptCompression: 0,
            contextPruning: 0,
          },
        },
        message: 'Optimization statistics not implemented yet',
      });
    } catch (error) {
      logger.error('Error getting optimization statistics:', error);
      
      res.status(500).json({
        error: {
          type: 'internal_error',
          message: 'Failed to get optimization statistics',
        },
      });
    }
  });
  
  logger.info('Analytics routes configured');
}