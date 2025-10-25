/**
 * RelayCore Enhancement Configuration
 * Comprehensive configuration for all performance optimization features
 */

import { RateLimitConfig } from "../middleware/rate-limiter";
import { SemanticCacheConfig } from "../services/semantic-cache";
import { QueueConfig } from "../services/request-queue";

export interface RelayCorePerfConfig {
  rateLimiting: RateLimitConfig;
  semanticCache: SemanticCacheConfig;
  requestQueue: QueueConfig;
  monitoring: MonitoringConfig;
  optimization: OptimizationConfig;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number; // ms
  alertThresholds: {
    errorRate: number; // 0.0 - 1.0
    responseTime: number; // ms
    queueSize: number;
    cacheHitRate: number; // 0.0 - 1.0
  };
  healthChecks: {
    enabled: boolean;
    interval: number; // ms
    timeout: number; // ms
  };
}

export interface OptimizationConfig {
  autoScaling: {
    enabled: boolean;
    minConcurrency: number;
    maxConcurrency: number;
    scaleUpThreshold: number; // queue size
    scaleDownThreshold: number; // queue size
  };
  loadBalancing: {
    strategy: "round-robin" | "least-connections" | "weighted" | "adaptive";
    healthCheckWeight: number; // 0.0 - 1.0
    responseTimeWeight: number; // 0.0 - 1.0
  };
  failover: {
    enabled: boolean;
    retryAttempts: number;
    circuitBreaker: {
      failureThreshold: number;
      recoveryTime: number; // ms
    };
  };
}

/**
 * Development Configuration
 * Optimized for development and testing
 */
export const developmentConfig: RelayCorePerfConfig = {
  rateLimiting: {
    global: {
      requests: 100,
      window: 60000,
      burst: 20,
    },
    perProvider: {
      openai: { requests: 50, window: 60000, burst: 10 },
      anthropic: { requests: 30, window: 60000, burst: 5 },
      neuroweaver: { requests: 20, window: 60000, burst: 3 },
    },
    perUser: {
      requests: 50,
      window: 60000,
    },
    emergency: {
      enabled: true,
      threshold: 0.8,
    },
  },
  semanticCache: {
    enabled: true,
    similarityThreshold: 0.8,
    maxCacheSize: 100,
    ttlSeconds: 1800, // 30 minutes
    embeddingProvider: "openai",
  },
  requestQueue: {
    maxSize: 1000,
    concurrency: {
      openai: 3,
      anthropic: 2,
      neuroweaver: 1,
    },
    processingStrategy: "priority",
    timeoutMs: 30000,
    retryDelayMs: 1000,
    enableMetrics: true,
  },
  monitoring: {
    enabled: true,
    metricsInterval: 5000,
    alertThresholds: {
      errorRate: 0.1, // 10%
      responseTime: 5000, // 5s
      queueSize: 500,
      cacheHitRate: 0.3, // 30%
    },
    healthChecks: {
      enabled: true,
      interval: 10000,
      timeout: 5000,
    },
  },
  optimization: {
    autoScaling: {
      enabled: false, // Disabled in dev
      minConcurrency: 1,
      maxConcurrency: 5,
      scaleUpThreshold: 100,
      scaleDownThreshold: 10,
    },
    loadBalancing: {
      strategy: "round-robin",
      healthCheckWeight: 0.7,
      responseTimeWeight: 0.3,
    },
    failover: {
      enabled: true,
      retryAttempts: 2,
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTime: 30000,
      },
    },
  },
};

/**
 * Production Configuration
 * Optimized for high performance and reliability
 */
export const productionConfig: RelayCorePerfConfig = {
  rateLimiting: {
    global: {
      requests: 10000,
      window: 60000,
      burst: 500,
    },
    perProvider: {
      openai: { requests: 5000, window: 60000, burst: 250 },
      anthropic: { requests: 3000, window: 60000, burst: 150 },
      neuroweaver: { requests: 2000, window: 60000, burst: 100 },
    },
    perUser: {
      requests: 1000,
      window: 60000,
    },
    emergency: {
      enabled: true,
      threshold: 0.9,
    },
  },
  semanticCache: {
    enabled: true,
    similarityThreshold: 0.85,
    maxCacheSize: 10000,
    ttlSeconds: 3600, // 1 hour
    embeddingProvider: "openai",
  },
  requestQueue: {
    maxSize: 50000,
    concurrency: {
      openai: 50,
      anthropic: 30,
      neuroweaver: 20,
    },
    processingStrategy: "least-loaded",
    timeoutMs: 60000,
    retryDelayMs: 2000,
    enableMetrics: true,
  },
  monitoring: {
    enabled: true,
    metricsInterval: 1000,
    alertThresholds: {
      errorRate: 0.05, // 5%
      responseTime: 3000, // 3s
      queueSize: 10000,
      cacheHitRate: 0.5, // 50%
    },
    healthChecks: {
      enabled: true,
      interval: 5000,
      timeout: 3000,
    },
  },
  optimization: {
    autoScaling: {
      enabled: true,
      minConcurrency: 10,
      maxConcurrency: 100,
      scaleUpThreshold: 1000,
      scaleDownThreshold: 100,
    },
    loadBalancing: {
      strategy: "adaptive",
      healthCheckWeight: 0.6,
      responseTimeWeight: 0.4,
    },
    failover: {
      enabled: true,
      retryAttempts: 3,
      circuitBreaker: {
        failureThreshold: 10,
        recoveryTime: 60000,
      },
    },
  },
};

/**
 * High-Performance Configuration
 * Maximum performance for enterprise deployments
 */
export const enterpriseConfig: RelayCorePerfConfig = {
  rateLimiting: {
    global: {
      requests: 100000,
      window: 60000,
      burst: 5000,
    },
    perProvider: {
      openai: { requests: 50000, window: 60000, burst: 2500 },
      anthropic: { requests: 30000, window: 60000, burst: 1500 },
      neuroweaver: { requests: 20000, window: 60000, burst: 1000 },
    },
    perUser: {
      requests: 10000,
      window: 60000,
    },
    emergency: {
      enabled: true,
      threshold: 0.95,
    },
  },
  semanticCache: {
    enabled: true,
    similarityThreshold: 0.9,
    maxCacheSize: 100000,
    ttlSeconds: 7200, // 2 hours
    embeddingProvider: "openai",
  },
  requestQueue: {
    maxSize: 500000,
    concurrency: {
      openai: 200,
      anthropic: 150,
      neuroweaver: 100,
    },
    processingStrategy: "adaptive",
    timeoutMs: 120000,
    retryDelayMs: 5000,
    enableMetrics: true,
  },
  monitoring: {
    enabled: true,
    metricsInterval: 500,
    alertThresholds: {
      errorRate: 0.02, // 2%
      responseTime: 2000, // 2s
      queueSize: 50000,
      cacheHitRate: 0.7, // 70%
    },
    healthChecks: {
      enabled: true,
      interval: 2000,
      timeout: 1000,
    },
  },
  optimization: {
    autoScaling: {
      enabled: true,
      minConcurrency: 50,
      maxConcurrency: 500,
      scaleUpThreshold: 5000,
      scaleDownThreshold: 500,
    },
    loadBalancing: {
      strategy: "adaptive",
      healthCheckWeight: 0.5,
      responseTimeWeight: 0.5,
    },
    failover: {
      enabled: true,
      retryAttempts: 5,
      circuitBreaker: {
        failureThreshold: 20,
        recoveryTime: 120000,
      },
    },
  },
};

/**
 * Get configuration based on environment
 */
export function getConfigForEnvironment(
  env: string = "development",
): RelayCorePerfConfig {
  switch (env.toLowerCase()) {
    case "production":
    case "prod":
      return productionConfig;
    case "enterprise":
    case "ent":
      return enterpriseConfig;
    case "development":
    case "dev":
    case "test":
    default:
      return developmentConfig;
  }
}

/**
 * Merge custom configuration with base configuration
 */
export function mergeConfig(
  baseConfig: RelayCorePerfConfig,
  customConfig: Partial<RelayCorePerfConfig>,
): RelayCorePerfConfig {
  return {
    rateLimiting: { ...baseConfig.rateLimiting, ...customConfig.rateLimiting },
    semanticCache: {
      ...baseConfig.semanticCache,
      ...customConfig.semanticCache,
    },
    requestQueue: { ...baseConfig.requestQueue, ...customConfig.requestQueue },
    monitoring: { ...baseConfig.monitoring, ...customConfig.monitoring },
    optimization: { ...baseConfig.optimization, ...customConfig.optimization },
  };
}

/**
 * Validate configuration for common issues
 */
export function validateConfig(config: RelayCorePerfConfig): string[] {
  const issues: string[] = [];

  // Rate limiting validation
  if (config.rateLimiting.global.requests <= 0) {
    issues.push("Global rate limit requests must be positive");
  }

  // Cache validation
  if (
    config.semanticCache.similarityThreshold < 0 ||
    config.semanticCache.similarityThreshold > 1
  ) {
    issues.push("Semantic cache similarity threshold must be between 0 and 1");
  }

  // Queue validation
  if (config.requestQueue.maxSize <= 0) {
    issues.push("Request queue max size must be positive");
  }

  // Monitoring validation
  if (
    config.monitoring.alertThresholds.errorRate < 0 ||
    config.monitoring.alertThresholds.errorRate > 1
  ) {
    issues.push("Error rate threshold must be between 0 and 1");
  }

  // Auto-scaling validation
  if (config.optimization.autoScaling.enabled) {
    if (
      config.optimization.autoScaling.minConcurrency >=
      config.optimization.autoScaling.maxConcurrency
    ) {
      issues.push(
        "Auto-scaling min concurrency must be less than max concurrency",
      );
    }
  }

  return issues;
}

