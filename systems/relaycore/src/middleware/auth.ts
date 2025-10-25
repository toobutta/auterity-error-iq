/**
 * RelayCore Authentication Middleware
 * JWT token validation for API requests
 */

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

interface LegacyJWTPayload {
  id: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

interface BackendJWTPayload {
  sub: string; // email
  user_id: string;
  name?: string;
  permissions?: string[];
  type?: string;
  target_system?: string;
  iat?: number;
  exp?: number;
}

type AnyJWTPayload = LegacyJWTPayload | BackendJWTPayload;

function deriveRoleFromPermissions(permissions?: string[]): string {
  if (!permissions || permissions.length === 0) return "user";
  const isAdmin = permissions.some((p) => p.endsWith(":admin"));
  if (isAdmin) return "admin";
  const canWrite = permissions.some((p) => p.endsWith(":write"));
  return canWrite ? "manager" : "user";
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: {
          message: "Authorization token required",
          code: "MISSING_TOKEN",
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const secretKey = process.env.SECRET_KEY;

    if (!secretKey) {
      logger.error("SECRET_KEY environment variable not set");
      res.status(500).json({
        success: false,
        error: {
          message: "Server configuration error",
          code: "CONFIG_ERROR",
        },
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, secretKey) as AnyJWTPayload;

      // Normalize user shape across token issuers
      const isBackendFormat = (decoded as BackendJWTPayload).user_id !== undefined;
      if (isBackendFormat) {
        const backend = decoded as BackendJWTPayload;
        req.user = {
          id: backend.user_id,
          username: backend.name || backend.sub,
          role: deriveRoleFromPermissions(backend.permissions),
        } as any;
      } else {
        const legacy = decoded as LegacyJWTPayload;
        req.user = {
          id: legacy.id,
          username: legacy.username,
          role: legacy.role,
        } as any;
      }

      logger.debug(`Authenticated user: ${decoded.username} (${decoded.role})`);
      next();
    } catch (jwtError) {
      logger.warn("Invalid JWT token:", jwtError);

      res.status(401).json({
        success: false,
        error: {
          message: "Invalid or expired token",
          code: "INVALID_TOKEN",
        },
      });
      return;
    }
  } catch (error) {
    logger.error("Authentication middleware error:", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Authentication error",
        code: "AUTH_ERROR",
      },
    });
    return;
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
        role: decoded.role,
      };
    } catch (jwtError) {
      // Invalid token, but continue without authentication
      logger.debug("Optional auth failed, continuing without user context");
    }

    next();
  } catch (error) {
    logger.error("Optional authentication middleware error:", error);
    next();
  }
};

export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Authentication required",
          code: "AUTH_REQUIRED",
        },
      });
      return;
    }

    if (req.user.role !== requiredRole && req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        error: {
          message: `Role '${requiredRole}' required`,
          code: "INSUFFICIENT_PERMISSIONS",
        },
      });
      return;
    }

    next();
  };
};

