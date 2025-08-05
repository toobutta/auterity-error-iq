import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { configManager } from '../../config/configManager';
import { ApiError } from './errorHandler';
import { logger } from '../../utils/logger';

// Extend Express Request interface to include user and id properties
declare global {
  namespace Express {
    interface Request {
      user?: any;
      id: string;
    }
  }
}

// API Key authentication middleware
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = configManager.getConfig();
    
    // Check if API key authentication is enabled
    if (!config.auth?.apiKey?.enabled) {
      return next();
    }
    
    // Get API key header name from config
    const headerName = config.auth.apiKey.headerName || 'X-API-Key';
    
    // Get API key from header
    const apiKey = req.header(headerName);
    
    if (!apiKey) {
      throw new ApiError(401, 'API key is required', 'authentication_error');
    }
    
    // Validate API key
    // In a real implementation, this would check against a database
    // For now, we'll use a simple check against environment variables for demo purposes
    const isValid = validateApiKey(apiKey);
    
    if (!isValid) {
      throw new ApiError(401, 'Invalid API key', 'authentication_error');
    }
    
    // Set user information on request
    req.user = {
      id: 'user_' + apiKey.substring(0, 8), // Simple user ID based on API key
      apiKey: apiKey,
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// JWT authentication middleware
export const jwtAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = configManager.getConfig();
    
    // Check if JWT authentication is enabled
    if (!config.auth?.jwt?.enabled) {
      return next();
    }
    
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'JWT token is required', 'authentication_error');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    try {
      const decoded = jwt.verify(token, config.auth.jwt.secret || process.env.JWT_SECRET || '');
      
      // Set user information on request
      req.user = decoded;
      
      next();
    } catch (error) {
      throw new ApiError(401, 'Invalid JWT token', 'authentication_error');
    }
  } catch (error) {
    next(error);
  }
};

// Combined authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = configManager.getConfig();
    
    // Generate request ID
    req.id = generateRequestId();
    
    // Try API key authentication first
    if (config.auth?.apiKey?.enabled) {
      const apiKey = req.header(config.auth.apiKey.headerName || 'X-API-Key');
      
      if (apiKey) {
        const isValid = validateApiKey(apiKey);
        
        if (isValid) {
          req.user = {
            id: 'user_' + apiKey.substring(0, 8),
            apiKey: apiKey,
          };
          
          return next();
        }
      }
    }
    
    // Try JWT authentication next
    if (config.auth?.jwt?.enabled) {
      const authHeader = req.header('Authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        try {
          const decoded = jwt.verify(token, config.auth.jwt.secret || process.env.JWT_SECRET || '');
          req.user = decoded;
          
          return next();
        } catch (error) {
          logger.debug('JWT verification failed', { error });
        }
      }
    }
    
    // If we get here, no valid authentication was provided
    throw new ApiError(401, 'Authentication required', 'authentication_error');
  } catch (error) {
    next(error);
  }
};

// Helper function to validate API key
// In a real implementation, this would check against a database
function validateApiKey(apiKey: string): boolean {
  // For demo purposes, accept any non-empty API key
  // In production, this would validate against a database of API keys
  return apiKey.length > 0;
}

// Helper function to generate a request ID
function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}