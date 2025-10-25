/**
 * Circuit Breaker Service for AI Provider Reliability
 * Implements circuit breaker pattern for 99.99% availability with intelligent failover
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger";

export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Circuit is open, requests fail fast
  HALF_OPEN = "HALF_OPEN", // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures to trigger open
  recoveryTimeout: number; // Time to wait before attempting recovery
  monitoringPeriod: number; // Period to monitor for failures
  successThreshold: number; // Successes needed to close circuit
  timeout: number; // Request timeout
  maxRetries: number; // Maximum retry attempts
}

export interface CircuitMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  requestsInPeriod: number;
  failuresInPeriod: number;
}

export interface FailoverProvider {
  id: string;
  priority: number;
  healthScore: number;
  isAvailable: boolean;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private requestsInCurrentPeriod: number = 0;
  private failuresInCurrentPeriod: number = 0;
  private periodStartTime: number = Date.now();
  private recoveryTimer: NodeJS.Timeout | null = null;
  private config: CircuitBreakerConfig;
  private providerName: string;

  constructor(providerName: string, config: CircuitBreakerConfig) {
    super();
    this.providerName = providerName;
    this.config = config;

    // Start monitoring period reset
    this.startMonitoringPeriod();

    logger.info(`Circuit breaker initialized for ${providerName}`, {
      failureThreshold: config.failureThreshold,
      recoveryTimeout: config.recoveryTimeout,
    });
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;
    this.requestsInCurrentPeriod++;

    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      const error = new Error(
        `Circuit breaker is OPEN for ${this.providerName}`,
      );
      this.emit("circuit-open-rejection", {
        provider: this.providerName,
        error,
      });
      throw error;
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(operation);

      // Record success
      this.onSuccess();

      return result;
    } catch (error) {
      // Record failure
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Execute operation with failover to backup providers
   */
  async executeWithFailover<T>(
    primaryOperation: () => Promise<T>,
    failoverProviders: FailoverProvider[],
    failoverOperations: Map<string, () => Promise<T>>,
  ): Promise<T> {
    try {
      // Try primary provider
      return await this.execute(primaryOperation);
    } catch (primaryError) {
      logger.warn(
        `Primary provider ${this.providerName} failed, attempting failover`,
        {
          error: primaryError,
          availableFailovers: failoverProviders.length,
        },
      );

      // Sort failover providers by priority and health
      const sortedProviders = failoverProviders
        .filter((p) => p.isAvailable)
        .sort((a, b) => {
          // Sort by priority first, then by health score
          if (a.priority !== b.priority) {
            return a.priority - b.priority; // Lower number = higher priority
          }
          return b.healthScore - a.healthScore; // Higher health score = better
        });

      // Try each failover provider
      for (const provider of sortedProviders) {
        const failoverOp = failoverOperations.get(provider.id);

        if (!failoverOp) {
          logger.warn(
            `No failover operation defined for provider ${provider.id}`,
          );
          continue;
        }

        try {
          logger.info(`Attempting failover to provider ${provider.id}`, {
            priority: provider.priority,
            healthScore: provider.healthScore,
          });

          const result = await this.executeWithTimeout(failoverOp);

          this.emit("failover-success", {
            originalProvider: this.providerName,
            failoverProvider: provider.id,
            priority: provider.priority,
          });

          return result;
        } catch (failoverError) {
          logger.warn(`Failover provider ${provider.id} also failed`, {
            error: failoverError,
          });

          this.emit("failover-failed", {
            originalProvider: this.providerName,
            failoverProvider: provider.id,
            error: failoverError,
          });
        }
      }

      // All providers failed
      const allFailedError = new Error(
        `All providers failed. Primary: ${this.providerName}, Attempted failovers: ${sortedProviders.map((p) => p.id).join(", ")}`,
      );

      this.emit("all-providers-failed", {
        originalProvider: this.providerName,
        attemptedFailovers: sortedProviders.map((p) => p.id),
        originalError: primaryError,
      });

      throw allFailedError;
    }
  }

  /**
   * Force circuit to open state
   */
  forceOpen(): void {
    this.setState(CircuitState.OPEN);
    this.startRecoveryTimer();

    logger.warn(
      `Circuit breaker for ${this.providerName} forced to OPEN state`,
    );
    this.emit("circuit-forced-open", { provider: this.providerName });
  }

  /**
   * Force circuit to close state
   */
  forceClose(): void {
    this.setState(CircuitState.CLOSED);
    this.resetCounters();

    logger.info(
      `Circuit breaker for ${this.providerName} forced to CLOSED state`,
    );
    this.emit("circuit-forced-closed", { provider: this.providerName });
  }

  /**
   * Get current circuit metrics
   */
  getMetrics(): CircuitMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      requestsInPeriod: this.requestsInCurrentPeriod,
      failuresInPeriod: this.failuresInCurrentPeriod,
    };
  }

  /**
   * Check if circuit is healthy
   */
  isHealthy(): boolean {
    if (this.state === CircuitState.OPEN) {
      return false;
    }

    // Check failure rate in current period
    if (this.requestsInCurrentPeriod > 0) {
      const failureRate =
        this.failuresInCurrentPeriod / this.requestsInCurrentPeriod;
      return failureRate < 0.5; // Consider healthy if failure rate < 50%
    }

    return true;
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.totalSuccesses++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      // Check if we should close the circuit
      if (this.successCount >= this.config.successThreshold) {
        this.setState(CircuitState.CLOSED);
        this.resetCounters();

        logger.info(
          `Circuit breaker for ${this.providerName} moved to CLOSED state after successful recovery`,
        );
        this.emit("circuit-closed", { provider: this.providerName });
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: Error): void {
    this.lastFailureTime = Date.now();
    this.totalFailures++;
    this.failuresInCurrentPeriod++;

    if (
      this.state === CircuitState.CLOSED ||
      this.state === CircuitState.HALF_OPEN
    ) {
      this.failureCount++;

      // Check if we should open the circuit
      if (this.failureCount >= this.config.failureThreshold) {
        this.setState(CircuitState.OPEN);
        this.startRecoveryTimer();

        logger.error(
          `Circuit breaker for ${this.providerName} moved to OPEN state after ${this.failureCount} failures`,
          {
            error: error.message,
            failureThreshold: this.config.failureThreshold,
          },
        );

        this.emit("circuit-opened", {
          provider: this.providerName,
          failureCount: this.failureCount,
          lastError: error.message,
        });
      }
    }
  }

  /**
   * Start recovery timer for half-open state
   */
  private startRecoveryTimer(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }

    this.recoveryTimer = setTimeout(() => {
      this.setState(CircuitState.HALF_OPEN);
      this.successCount = 0;

      logger.info(
        `Circuit breaker for ${this.providerName} moved to HALF_OPEN state for recovery testing`,
      );
      this.emit("circuit-half-open", { provider: this.providerName });
    }, this.config.recoveryTimeout);
  }

  /**
   * Set circuit state
   */
  private setState(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    this.emit("state-change", {
      provider: this.providerName,
      oldState,
      newState,
    });
  }

  /**
   * Reset counters
   */
  private resetCounters(): void {
    this.failureCount = 0;
    this.successCount = 0;
  }

  /**
   * Start monitoring period reset timer
   */
  private startMonitoringPeriod(): void {
    setInterval(() => {
      this.requestsInCurrentPeriod = 0;
      this.failuresInCurrentPeriod = 0;
      this.periodStartTime = Date.now();
    }, this.config.monitoringPeriod);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }

    this.removeAllListeners();
    logger.info(`Circuit breaker for ${this.providerName} destroyed`);
  }
}

/**
 * Circuit Breaker Manager for multiple providers
 */
export class CircuitBreakerManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private globalConfig: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.globalConfig = config;
    logger.info("Circuit breaker manager initialized");
  }

  /**
   * Get or create circuit breaker for provider
   */
  getCircuitBreaker(
    providerName: string,
    config?: Partial<CircuitBreakerConfig>,
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(providerName)) {
      const breaker = new CircuitBreaker(providerName, {
        ...this.globalConfig,
        ...config,
      });

      // Forward events
      breaker.on("circuit-opened", (data) => this.emit("circuit-opened", data));
      breaker.on("circuit-closed", (data) => this.emit("circuit-closed", data));
      breaker.on("failover-success", (data) =>
        this.emit("failover-success", data),
      );
      breaker.on("all-providers-failed", (data) =>
        this.emit("all-providers-failed", data),
      );

      this.circuitBreakers.set(providerName, breaker);
    }

    return this.circuitBreakers.get(providerName)!;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    providerName: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>,
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(providerName, config);
    return breaker.execute(operation);
  }

  /**
   * Get health status of all providers
   */
  getHealthStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};

    for (const [provider, breaker] of this.circuitBreakers) {
      status[provider] = breaker.isHealthy();
    }

    return status;
  }

  /**
   * Get metrics for all circuit breakers
   */
  getAllMetrics(): Record<string, CircuitMetrics> {
    const metrics: Record<string, CircuitMetrics> = {};

    for (const [provider, breaker] of this.circuitBreakers) {
      metrics[provider] = breaker.getMetrics();
    }

    return metrics;
  }

  /**
   * Force all circuits to close (emergency recovery)
   */
  forceAllClose(): void {
    for (const [provider, breaker] of this.circuitBreakers) {
      breaker.forceClose();
    }

    logger.warn("All circuit breakers forced to CLOSED state");
  }

  /**
   * Cleanup all circuit breakers
   */
  destroy(): void {
    for (const [provider, breaker] of this.circuitBreakers) {
      breaker.destroy();
    }

    this.circuitBreakers.clear();
    logger.info("Circuit breaker manager destroyed");
  }

  private emit(event: string, data: any): void {
    // This would integrate with the main event system
    logger.info(`Circuit breaker event: ${event}`, data);
  }
}

/**
 * Default circuit breaker configuration
 */
export const defaultCircuitBreakerConfig: CircuitBreakerConfig = {
  failureThreshold: 5, // Open after 5 failures
  recoveryTimeout: 30000, // 30 seconds recovery timeout
  monitoringPeriod: 60000, // 1 minute monitoring period
  successThreshold: 3, // 3 successes to close
  timeout: 30000, // 30 second operation timeout
  maxRetries: 3, // Maximum 3 retries
};

