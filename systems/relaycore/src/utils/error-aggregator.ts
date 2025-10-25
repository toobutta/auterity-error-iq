/**
 * RelayCore Error Aggregation Client
 * Sends errors to the cross-system correlation service
 */

import axios, { AxiosInstance } from "axios";
import { logger } from "./logger";

export interface ErrorData {
  timestamp?: string;
  message: string;
  code: string;
  category: string;
  severity: string;
  context?: Record<string, any>;
  stack_trace?: string;
  correlation_id?: string;
  request_id?: string;
  user_id?: string;
}

export interface AIServiceErrorContext {
  provider: string;
  model_id: string;
  request_type: string;
  cost?: number;
  latency?: number;
  error_type?: string;
}

export class ErrorAggregator {
  private client: AxiosInstance;
  private correlationServiceUrl: string;

  constructor(correlationServiceUrl: string = "http://localhost:8000") {
    this.correlationServiceUrl = correlationServiceUrl;
    this.client = axios.create({
      baseURL: this.correlationServiceUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Aggregate a structured error to the correlation service
   */
  async aggregateError(errorData: ErrorData): Promise<boolean> {
    try {
      // Add timestamp if not present
      if (!errorData.timestamp) {
        errorData.timestamp = new Date().toISOString();
      }

      const response = await this.client.post(
        "/api/v1/error-correlation/aggregate",
        errorData,
      );

      if (response.status === 200) {
        logger.debug(`Successfully aggregated error: ${errorData.code}`);
        return true;
      } else {
        logger.error(
          `Failed to aggregate error: ${response.status} - ${response.data}`,
        );
        return false;
      }
    } catch (error) {
      logger.error(`Failed to aggregate error: ${error}`);
      return false;
    }
  }

  /**
   * Aggregate an AI service error specific to RelayCore
   */
  async aggregateAIServiceError(
    error: Error,
    context: AIServiceErrorContext,
    requestId?: string,
    userId?: string,
    correlationId?: string,
  ): Promise<boolean> {
    try {
      const errorData: ErrorData = {
        timestamp: new Date().toISOString(),
        message: error.message,
        code: this.getErrorCode(error),
        category: "ai_service",
        severity: this.getErrorSeverity(error),
        context: {
          ...context,
          error_type: error.constructor.name,
        },
        stack_trace: error.stack,
        correlation_id: correlationId,
        request_id: requestId,
        user_id: userId,
      };

      return await this.aggregateError(errorData);
    } catch (err) {
      logger.error(`Failed to aggregate AI service error: ${err}`);
      return false;
    }
  }

  /**
   * Aggregate a provider-specific error
   */
  async aggregateProviderError(
    provider: string,
    modelId: string,
    error: Error,
    requestType: string = "completion",
    cost?: number,
    latency?: number,
    requestId?: string,
    userId?: string,
  ): Promise<boolean> {
    return await this.aggregateAIServiceError(
      error,
      {
        provider,
        model_id: modelId,
        request_type: requestType,
        cost,
        latency,
      },
      requestId,
      userId,
    );
  }

  /**
   * Aggregate a routing error
   */
  async aggregateRoutingError(
    error: Error,
    routingContext: {
      original_provider?: string;
      fallback_provider?: string;
      routing_rules?: string[];
      cost_threshold?: number;
    },
    requestId?: string,
    userId?: string,
  ): Promise<boolean> {
    try {
      const errorData: ErrorData = {
        timestamp: new Date().toISOString(),
        message: error.message,
        code: this.getErrorCode(error),
        category: "routing",
        severity: this.getErrorSeverity(error),
        context: {
          ...routingContext,
          error_type: error.constructor.name,
        },
        stack_trace: error.stack,
        request_id: requestId,
        user_id: userId,
      };

      return await this.aggregateError(errorData);
    } catch (err) {
      logger.error(`Failed to aggregate routing error: ${err}`);
      return false;
    }
  }

  /**
   * Aggregate a cost optimization error
   */
  async aggregateCostError(
    error: Error,
    costContext: {
      current_cost?: number;
      budget_limit?: number;
      cost_threshold?: number;
      optimization_strategy?: string;
    },
    requestId?: string,
    userId?: string,
  ): Promise<boolean> {
    try {
      const errorData: ErrorData = {
        timestamp: new Date().toISOString(),
        message: error.message,
        code: this.getErrorCode(error),
        category: "cost_optimization",
        severity: this.getErrorSeverity(error),
        context: {
          ...costContext,
          error_type: error.constructor.name,
        },
        stack_trace: error.stack,
        request_id: requestId,
        user_id: userId,
      };

      return await this.aggregateError(errorData);
    } catch (err) {
      logger.error(`Failed to aggregate cost error: ${err}`);
      return false;
    }
  }

  /**
   * Aggregate multiple errors in batch
   */
  async aggregateBatchErrors(errors: ErrorData[]): Promise<boolean> {
    try {
      // Add timestamps to errors that don't have them
      const processedErrors = errors.map((error) => ({
        ...error,
        timestamp: error.timestamp || new Date().toISOString(),
      }));

      const response = await this.client.post(
        "/api/v1/error-correlation/aggregate/batch",
        processedErrors,
      );

      if (response.status === 200) {
        logger.info(`Successfully aggregated batch of ${errors.length} errors`);
        return true;
      } else {
        logger.error(
          `Failed to aggregate batch errors: ${response.status} - ${response.data}`,
        );
        return false;
      }
    } catch (error) {
      logger.error(`Failed to aggregate batch errors: ${error}`);
      return false;
    }
  }

  /**
   * Get error code from error object
   */
  private getErrorCode(error: Error): string {
    // Check if error has a code property
    if ("code" in error && typeof error.code === "string") {
      return error.code;
    }

    // Generate code based on error type and message
    const errorType = error.constructor.name;
    if (errorType === "Error") {
      return "RELAYCORE_ERROR";
    }

    return `RELAYCORE_${errorType.toUpperCase()}`;
  }

  /**
   * Determine error severity based on error type and message
   */
  private getErrorSeverity(error: Error): string {
    const message = error.message.toLowerCase();

    // Critical errors
    if (
      message.includes("timeout") ||
      message.includes("connection") ||
      message.includes("network") ||
      message.includes("unavailable")
    ) {
      return "high";
    }

    // Medium severity errors
    if (
      message.includes("rate limit") ||
      message.includes("quota") ||
      message.includes("authentication") ||
      message.includes("authorization")
    ) {
      return "medium";
    }

    // Default to medium
    return "medium";
  }

  /**
   * Create correlation ID for tracking related errors
   */
  generateCorrelationId(): string {
    const crypto = require("crypto");
    return `relaycore_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").substring(0, 9)}`;
  }
}

// Global instance
let globalAggregator: ErrorAggregator | null = null;

/**
 * Get or create global error aggregator instance
 */
export function getErrorAggregator(): ErrorAggregator {
  if (!globalAggregator) {
    globalAggregator = new ErrorAggregator();
  }
  return globalAggregator;
}

/**
 * Convenience function for aggregating AI service errors
 */
export async function aggregateAIError(
  error: Error,
  provider: string,
  modelId: string,
  requestType: string = "completion",
  cost?: number,
  latency?: number,
  requestId?: string,
  userId?: string,
): Promise<boolean> {
  const aggregator = getErrorAggregator();
  return await aggregator.aggregateProviderError(
    provider,
    modelId,
    error,
    requestType,
    cost,
    latency,
    requestId,
    userId,
  );
}

/**
 * Convenience function for aggregating routing errors
 */
export async function aggregateRoutingError(
  error: Error,
  routingContext: {
    original_provider?: string;
    fallback_provider?: string;
    routing_rules?: string[];
    cost_threshold?: number;
  },
  requestId?: string,
  userId?: string,
): Promise<boolean> {
  const aggregator = getErrorAggregator();
  return await aggregator.aggregateRoutingError(
    error,
    routingContext,
    requestId,
    userId,
  );
}

/**
 * Decorator for automatic error aggregation
 */
export function autoAggregateErrors(
  contextExtractor?: (args: any[]) => Partial<AIServiceErrorContext>,
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        // Extract context if extractor provided
        let context: Partial<AIServiceErrorContext> = {};
        if (contextExtractor) {
          try {
            context = contextExtractor(args);
          } catch (extractorError) {
            logger.error(`Context extractor failed: ${extractorError}`);
          }
        }

        // Aggregate error
        const aggregator = getErrorAggregator();
        await aggregator.aggregateAIServiceError(error as Error, {
          provider: context.provider || "unknown",
          model_id: context.model_id || "unknown",
          request_type: context.request_type || "unknown",
          cost: context.cost,
          latency: context.latency,
        });

        // Re-throw the original error
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Middleware for Express.js to automatically aggregate request errors
 */
export function errorAggregationMiddleware() {
  return (error: Error, req: any, res: any, next: any) => {
    // Extract request context
    const requestId = req.headers["x-request-id"] || req.id;
    const userId = req.user?.id;
    const correlationId = req.headers["x-correlation-id"];

    // Aggregate error asynchronously
    const aggregator = getErrorAggregator();
    aggregator
      .aggregateError({
        message: error.message,
        code: "HTTP_REQUEST_ERROR",
        category: "api",
        severity: "medium",
        context: {
          method: req.method,
          url: req.url,
          status_code: res.statusCode,
          user_agent: req.headers["user-agent"],
          ip: req.ip,
        },
        stack_trace: error.stack,
        correlation_id: correlationId,
        request_id: requestId,
        user_id: userId,
      })
      .catch((aggregationError) => {
        logger.error(`Failed to aggregate request error: ${aggregationError}`);
      });

    // Continue with normal error handling
    next(error);
  };
}

