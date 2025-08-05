import { Application, Request, Response, NextFunction } from 'express';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';
import { ApiError } from '../core/middleware/errorHandler';
import { SteeringService, createSteeringRoutes } from '../steering';
import path from 'path';

// Admin middleware to check if user is an admin
const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is an admin (simplified check)
    const isAdmin = req.user?.role === 'admin';
    
    if (!isAdmin) {
      throw new ApiError(403, 'Admin access required', 'permission_denied_error');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Setup admin routes
export function setupAdminRoutes(app: Application): void {
  logger.info('Setting up admin routes');
  
  // Apply admin middleware to all admin routes
  app.use('/admin', adminMiddleware);
  
  // Get configuration
  app.get('/admin/config', (req: Request, res: Response) => {
    try {
      const config = configManager.getConfig();
      
      // Remove sensitive information
      const sanitizedConfig = sanitizeConfig(config);
      
      res.status(200).json(sanitizedConfig);
    } catch (error) {
      logger.error('Error getting configuration:', error);
      
      res.status(500).json({
        error: {
          type: 'internal_error',
          message: 'Failed to get configuration',
        },
      });
    }
  });
  
  // Update configuration
  app.put('/admin/config', (req: Request, res: Response) => {
    try {
      const newConfig = req.body;
      
      // Validate configuration
      // This is a simplified validation
      if (!newConfig || typeof newConfig !== 'object') {
        throw new ApiError(400, 'Invalid configuration', 'invalid_request_error');
      }
      
      // Save configuration
      const success = configManager.saveConfig(newConfig);
      
      if (!success) {
        throw new ApiError(500, 'Failed to save configuration', 'internal_error');
      }
      
      res.status(200).json({
        message: 'Configuration updated successfully',
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
        logger.error('Error updating configuration:', error);
        
        res.status(500).json({
          error: {
            type: 'internal_error',
            message: 'Failed to update configuration',
          },
        });
      }
    }
  });
  
  // Get provider configurations
  app.get('/admin/config/providers', (req: Request, res: Response) => {
    try {
      const config = configManager.getConfig();
      
      // Get providers
      const providers = config.providers || {};
      
      // Remove sensitive information
      const sanitizedProviders: Record<string, any> = {};
      
      for (const [provider, providerConfig] of Object.entries(providers)) {
        sanitizedProviders[provider] = {
          ...(providerConfig as any),
          apiKey: '********', // Mask API key
        };
      }
      
      res.status(200).json(sanitizedProviders);
    } catch (error) {
      logger.error('Error getting provider configurations:', error);
      
      res.status(500).json({
        error: {
          type: 'internal_error',
          message: 'Failed to get provider configurations',
        },
      });
    }
  });
  
  // Update provider configuration
  app.put('/admin/config/providers/:provider', (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const providerConfig = req.body;
      
      // Validate provider configuration
      if (!providerConfig || typeof providerConfig !== 'object') {
        throw new ApiError(400, 'Invalid provider configuration', 'invalid_request_error');
      }
      
      // Get current configuration
      const config = configManager.getConfig();
      
      // Update provider configuration
      if (!config.providers) {
        config.providers = {};
      }
      
      config.providers[provider] = providerConfig;
      
      // Save configuration
      const success = configManager.saveConfig(config);
      
      if (!success) {
        throw new ApiError(500, 'Failed to save configuration', 'internal_error');
      }
      
      res.status(200).json({
        message: `Provider ${provider} configuration updated successfully`,
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
        logger.error('Error updating provider configuration:', error);
        
        res.status(500).json({
          error: {
            type: 'internal_error',
            message: 'Failed to update provider configuration',
          },
        });
      }
    }
  });
  
  // Setup steering rules routes
  const rulesFilePath = path.join(process.cwd(), 'config', 'steering-rules.yaml');
  const steeringService = new SteeringService(rulesFilePath, logger, true);
  app.use('/admin/steering', createSteeringRoutes(steeringService));
  
  // User management endpoints (placeholder)
  app.get('/admin/users', (req: Request, res: Response) => {
    // This is a placeholder implementation
    res.status(200).json({
      users: [],
      message: 'User management not implemented yet',
    });
  });
  
  // API key management endpoints (placeholder)
  app.get('/admin/api-keys', (req: Request, res: Response) => {
    // This is a placeholder implementation
    res.status(200).json({
      api_keys: [],
      message: 'API key management not implemented yet',
    });
  });
  
  // Plugin management endpoints (placeholder)
  app.get('/admin/plugins', (req: Request, res: Response) => {
    // This is a placeholder implementation
    res.status(200).json({
      plugins: [],
      message: 'Plugin management not implemented yet',
    });
  });
  
  logger.info('Admin routes configured');
}

// Helper function to sanitize configuration
function sanitizeConfig(config: any): any {
  // Deep clone the config
  const sanitizedConfig = JSON.parse(JSON.stringify(config));
  
  // Remove sensitive information
  if (sanitizedConfig.providers) {
    for (const provider of Object.values(sanitizedConfig.providers)) {
      if ((provider as any).apiKey) {
        (provider as any).apiKey = '********';
      }
    }
  }
  
  if (sanitizedConfig.auth?.jwt?.secret) {
    sanitizedConfig.auth.jwt.secret = '********';
  }
  
  if (sanitizedConfig.dashboard?.auth?.users) {
    for (const user of sanitizedConfig.dashboard.auth.users) {
      if (user.password) {
        user.password = '********';
      }
    }
  }
  
  return sanitizedConfig;
}