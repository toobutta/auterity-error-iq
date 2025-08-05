/**
 * RelayCore Authentication Middleware
 * JWT token validation for API requests
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface JWTPayload {
  id: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authorization token required',
          code: 'MISSING_TOKEN'
        }
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const secretKey = process.env.SECRET_KEY;

    if (!secretKey) {
      logger.error('SECRET_KEY environment variable not set');
      res.status(500).json({
        success: false,
        error: {
          message: 'Server configuration error',
          code: 'CONFIG_ERROR'
        }
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, secretKey) as JWTPayload;
      
      // Add user info to request object
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };

      logger.debug(`Authenticated user: ${decoded.username} (${decoded.role})`);
      next();

    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError);
      
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }
      });
      return;
    }

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR'
      }
    });
    return;
  }
};

export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);
    const secretKey = process.env.SECRET_KEY;

    if (!secretKey) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, secretKey) as JWTPayload;
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };
    } catch (jwtError) {
      // Invalid token, but continue without authentication
      logger.debug('Optional auth failed, continuing without user context');
    }

    next();

  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
};

export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }
      });
      return;
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          message: `Role '${requiredRole}' required`,
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
      return;
    }

    next();
  };
};