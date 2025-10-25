/**
 * Retry utilities for error recovery mechanisms
 */

import { ErrorCategory } from "../types/error";
import { logWarn, logError, logInfo } from "./logger";

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  jitter: boolean;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
  onMaxAttemptsReached?: (error: unknown) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export enum CircuitBreakerState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

/**
 * Default retry options for different error categories
 */
export const getDefaultRetryOptions = (
  category: ErrorCategory,
): RetryOptions => {
  const baseOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBackoff: true,
    jitter: true,
  };

  switch (category) {
    case ErrorCategory.NETWORK:
      return {
        ...baseOptions,
        maxAttempts: 5,
        baseDelay: 500,
        retryCondition: (error) => {
          const status = (error as { response?: { status?: number } }).response
            ?.status;
          return !status || status >= 500 || status === 408 || status === 429;
        },
      };

    case ErrorCategory.AI_SERVICE:
      return {
        ...baseOptions,
        maxAttempts: 3,
        baseDelay: 2000,
        maxDelay: 30000,
        retryCondition: (error) => {
          const status = (error as { response?: { status?: number } }).response
            ?.status;
          return status === 503 || status === 502 || status === 429;
        },
      };

    case ErrorCategory.API:
      return {
        ...baseOptions,
        maxAttempts: 3,
        baseDelay: 1000,
        retryCondition: (error) => {
          const status = (error as { response?: { status?: number } }).response
            ?.status;
          return status >= 500 || status === 429;
        },
      };

    case ErrorCategory.DATABASE:
      return {
        ...baseOptions,
        maxAttempts: 2,
        baseDelay: 2000,
        retryCondition: (error) => {
          const status = (error as { response?: { status?: number } }).response
            ?.status;
          return status === 503 || status === 502;
        },
      };

    default:
      return {
        ...baseOptions,
        maxAttempts: 1,
        retryCondition: () => false,
      };
  }
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  exponentialBackoff: boolean,
  jitter: boolean,
): number => {
  let delay = exponentialBackoff
    ? baseDelay * Math.pow(2, attempt - 1)
    : baseDelay;

  // Apply maximum delay limit
  delay = Math.min(delay, maxDelay);

  // Add jitter to prevent thundering herd
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return Math.floor(delay);
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry function with configurable options
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context?: { component?: string; action?: string },
): Promise<T> {
  const config: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialBackoff: true,
    jitter: true,
    retryCondition: () => true,
    ...options,
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();

      if (attempt > 1) {
        logInfo(`Operation succeeded after ${attempt} attempts`, {
          component: context?.component,
          action: context?.action,
          attempt,
          maxAttempts: config.maxAttempts,
        });
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!config.retryCondition!(error)) {
        logWarn("Error not retryable, failing immediately", {
          component: context?.component,
          action: context?.action,
          error: (error as Error).message,
          attempt,
        });
        throw error;
      }

      // If this was the last attempt, don't retry
      if (attempt === config.maxAttempts) {
        logError("Max retry attempts reached", {
          component: context?.component,
          action: context?.action,
          error: (error as Error).message,
          attempt,
          maxAttempts: config.maxAttempts,
        });

        config.onMaxAttemptsReached?.(error);
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        config.baseDelay,
        config.maxDelay,
        config.exponentialBackoff,
        config.jitter,
      );

      logWarn(`Operation failed, retrying in ${delay}ms`, {
        component: context?.component,
        action: context?.action,
        error: (error as Error).message,
        attempt,
        maxAttempts: config.maxAttempts,
        delay,
      });

      config.onRetry?.(attempt, error);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Circuit breaker implementation for preventing cascading failures
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: Date;
  private successCount = 0;

  constructor(
    private options: CircuitBreakerOptions,
    private name = "CircuitBreaker",
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        logInfo(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      } else {
        const error = new Error(`Circuit breaker ${this.name} is OPEN`);
        logWarn(
          `Circuit breaker ${this.name} rejecting request - circuit is OPEN`,
        );
        throw error;
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.options.resetTimeout;
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        // Require 3 successes to fully close
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
        logInfo(`Circuit breaker ${this.name} transitioning to CLOSED`);
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
      this.successCount = 0;
      logWarn(
        `Circuit breaker ${this.name} transitioning to OPEN from HALF_OPEN`,
      );
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      logWarn(
        `Circuit breaker ${this.name} transitioning to OPEN - failure threshold reached`,
      );
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    logInfo(`Circuit breaker ${this.name} manually reset`);
  }
}

/**
 * Automatic retry wrapper for API calls
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: Partial<RetryOptions> = {},
  context?: { component?: string; action?: string },
): T {
  return (async (...args: Parameters<T>) => {
    return retryWithBackoff(() => fn(...args), options, context);
  }) as T;
}

/**
 * Bulk retry utility for multiple operations
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: Partial<RetryOptions> = {},
): Promise<Array<{ success: boolean; result?: T; error?: unknown }>> {
  const results = await Promise.allSettled(
    operations.map((op) => retryWithBackoff(op, options)),
  );

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return { success: true, result: result.value };
    } else {
      return { success: false, error: result.reason };
    }
  });
}

/**
 * Create a circuit breaker for API endpoints
 */
export function createApiCircuitBreaker(
  endpoint: string,
  options: Partial<CircuitBreakerOptions> = {},
): CircuitBreaker {
  const defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 10000, // 10 seconds
    ...options,
  };

  return new CircuitBreaker(defaultOptions, `API-${endpoint}`);
}

/**
 * Global circuit breakers for common services
 */
export const circuitBreakers = {
  api: createApiCircuitBreaker("api", {
    failureThreshold: 5,
    resetTimeout: 30000,
  }),
  workflows: createApiCircuitBreaker("workflows", {
    failureThreshold: 3,
    resetTimeout: 60000,
  }),
  ai: createApiCircuitBreaker("ai", {
    failureThreshold: 2,
    resetTimeout: 120000,
  }),
  templates: createApiCircuitBreaker("templates", {
    failureThreshold: 5,
    resetTimeout: 30000,
  }),
};


