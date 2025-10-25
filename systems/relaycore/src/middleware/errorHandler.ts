/**
 * RelayCore Error Handler Middleware
 * Centralized error handling for all routes
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { sanitizeForLog, sanitizeObject } from "../utils/log-sanitizer";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(
    "Unhandled error:",
    sanitizeObject({
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    }),
  );

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
      details: isDevelopment ? sanitizeForLog(error.message) : undefined,
      timestamp: new Date().toISOString(),
      request_id: sanitizeForLog(req.headers["x-request-id"] || "unknown"),
    },
  });
};

