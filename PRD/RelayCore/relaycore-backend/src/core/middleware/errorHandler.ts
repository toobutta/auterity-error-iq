import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

// Custom error class
export class ApiError extends Error {
  statusCode: number;
  type: string;
  code?: string;
  param?: string;
  providerError?: any;

  constructor(
    statusCode: number,
    message: string,
    type: string = 'api_error',
    code?: string,
    param?: string,
    providerError?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.code = code;
    this.param = param;
    this.providerError = providerError;
    
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    
    // This clips the constructor invocation from the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // Log the error
  logger.error(`Error: ${err.message}`, {
    error: err,
    path: req.path,
    method: req.method,
    requestId: req.id,
  });

  // Check if it's our custom API error
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        type: err.type,
        message: err.message,
        ...(err.code && { code: err.code }),
        ...(err.param && { param: err.param }),
        ...(err.providerError && { provider_error: err.providerError }),
      },
    });
  }

  // Handle other errors
  return res.status(500).json({
    error: {
      type: 'internal_error',
      message: 'An unexpected error occurred',
    },
  });
};

// Not found error handler
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    error: {
      type: 'not_found_error',
      message: `Route not found: ${req.method} ${req.path}`,
    },
  });
};