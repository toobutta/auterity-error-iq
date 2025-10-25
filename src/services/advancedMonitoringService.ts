/**
 * Advanced Monitoring Service for Auterity Unified AI Platform
 * Integrates New Relic (APM), Sentry (Error Tracking), and Elastic (ELK) stack
 * Provides comprehensive observability across all AI services and applications
 */

import axios from 'axios';
import * as winston from 'winston';
import * as Sentry from '@sentry/node';
import { createLogger, format, transports } from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import * as newrelic from 'newrelic';

// Types and interfaces
export interface MonitoringConfig {
  newrelic: {
    enabled: boolean;
    licenseKey?: string;
    appName: string;
    labels?: Record<string, string>;
  };
  sentry: {
    enabled: boolean;
    dsn?: string;
    environment: string;
    release?: string;
    sampleRate?: number;
    tracesSampleRate?: number;
  };
  elastic: {
    enabled: boolean;
    node: string;
    indexPrefix: string;
    auth?: {
      username: string;
      password: string;
    };
  };
  custom: {
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    retentionDays: number;
    batchSize: number;
  };
}

export interface MonitoringEvent {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  service: string;
  component: string;
  operation: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  status?: 'success' | 'failure' | 'partial';
  error?: {
    message: string;
    stack?: string;
    code?: string;
    context?: Record<string, any>;
  };
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  service: string;
  component: string;
}

export interface APMTransaction {
  name: string;
  duration: number;
  status: 'success' | 'error' | 'timeout';
  service: string;
  operation: string;
  userId?: string;
  requestId?: string;
  customAttributes?: Record<string, any>;
  timestamp: Date;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
  lastChecked: Date;
  metadata?: Record<string, any>;
}

// Monitoring service class
export class AdvancedMonitoringService {
  private config: MonitoringConfig;
  private logger: winston.Logger;
  private isInitialized = false;
  private healthCache = new Map<string, ServiceHealth>();
  private metricsBuffer: PerformanceMetric[] = [];
  private eventsBuffer: MonitoringEvent[] = [];

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.logger = this.createLogger();
    this.initializeServices();
  }

  /**
   * Initialize all monitoring services
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize Sentry
      if (this.config.sentry.enabled && this.config.sentry.dsn) {
        Sentry.init({
          dsn: this.config.sentry.dsn,
          environment: this.config.sentry.environment,
          release: this.config.sentry.release,
          sampleRate: this.config.sentry.sampleRate || 1.0,
          tracesSampleRate: this.config.sentry.tracesSampleRate || 0.1,
          integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Console(),
          ],
        });

        // Add context for better error tracking
        Sentry.setContext('service', {
          name: 'auterity-unified-ai',
          version: process.env.npm_package_version || '1.0.0',
          environment: this.config.sentry.environment
        });
      }

      // Initialize New Relic (if available)
      if (this.config.newrelic.enabled && this.config.newrelic.licenseKey) {
        // New Relic is typically initialized via environment variables
        // or agent configuration
        this.logger.info('New Relic APM initialized');
      }

      // Start periodic tasks
      this.startPeriodicTasks();

      this.isInitialized = true;
      this.logger.info('Advanced Monitoring Service initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize monitoring services:', error);
      throw error;
    }
  }

  /**
   * Create Winston logger with Elastic integration
   */
  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [
      new transports.Console({
        level: this.config.custom.logLevel,
        format: format.combine(
          format.timestamp(),
          format.errors({ stack: true }),
          format.json()
        )
      })
    ];

    // Add Elastic transport if enabled
    if (this.config.elastic.enabled) {
      const elasticTransport = new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: this.config.elastic.node,
          auth: this.config.elastic.auth,
          maxRetries: 3,
          requestTimeout: 10000,
        },
        indexPrefix: this.config.elastic.indexPrefix,
        buffering: true,
        bufferLimit: this.config.custom.batchSize,
      });

      transports.push(elasticTransport);
    }

    return createLogger({
      level: this.config.custom.logLevel,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: {
        service: 'auterity-unified-ai',
        environment: this.config.sentry.environment
      },
      transports
    });
  }

  /**
   * Start periodic monitoring tasks
   */
  private startPeriodicTasks(): void {
    // Flush buffers every 30 seconds
    setInterval(() => {
      this.flushBuffers();
    }, 30000);

    // Health checks every 60 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 60000);

    // Send metrics every 15 seconds
    setInterval(() => {
      this.sendMetrics();
    }, 15000);
  }

  /**
   * Record an event (log, error, or custom event)
   */
  async recordEvent(event: MonitoringEvent): Promise<void> {
    try {
      // Add to buffer for batch processing
      this.eventsBuffer.push(event);

      // Send to Sentry for errors
      if (event.level === 'error' && this.config.sentry.enabled && event.error) {
        Sentry.withScope((scope) => {
          scope.setTag('service', event.service);
          scope.setTag('component', event.component);
          scope.setTag('operation', event.operation);
          scope.setTag('level', event.level);

          if (event.userId) scope.setUser({ id: event.userId });
          if (event.tags) {
            event.tags.forEach(tag => scope.setTag('custom_tag', tag));
          }

          if (event.metadata) {
            Object.entries(event.metadata).forEach(([key, value]) => {
              scope.setContext(key, { value });
            });
          }

          Sentry.captureException(new Error(event.error.message), {
            contexts: {
              error_context: event.error.context || {},
              event_metadata: event.metadata || {}
            }
          });
        });
      }

      // Log with Winston (includes Elastic if configured)
      const logData = {
        level: event.level,
        message: event.error?.message || `${event.service}:${event.operation}`,
        service: event.service,
        component: event.component,
        operation: event.operation,
        userId: event.userId,
        sessionId: event.sessionId,
        requestId: event.requestId,
        duration: event.duration,
        status: event.status,
        metadata: event.metadata,
        tags: event.tags,
        timestamp: event.timestamp
      };

      this.logger.log(event.level, logData.message, logData);

      // Immediate flush for errors
      if (event.level === 'error') {
        await this.flushBuffers();
      }

    } catch (error) {
      console.error('Failed to record monitoring event:', error);
    }
  }

  /**
   * Record a performance metric
   */
  async recordMetric(metric: PerformanceMetric): Promise<void> {
    this.metricsBuffer.push(metric);

    // Send to New Relic if available
    if (this.config.newrelic.enabled && global.newrelic) {
      try {
        global.newrelic.recordMetric(metric.name, metric.value, {
          units: metric.unit,
          tags: metric.tags
        });
      } catch (error) {
        this.logger.warn('Failed to send metric to New Relic:', error);
      }
    }
  }

  /**
   * Start an APM transaction
   */
  startTransaction(transaction: Omit<APMTransaction, 'duration' | 'timestamp'>): APMTransaction {
    const startTime = Date.now();

    // New Relic transaction if available
    if (this.config.newrelic.enabled && global.newrelic) {
      const nrTransaction = global.newrelic.startWebTransaction(transaction.name, () => {
        // Transaction logic will be handled by the caller
      });

      if (nrTransaction) {
        nrTransaction.addCustomAttributes({
          service: transaction.service,
          operation: transaction.operation,
          userId: transaction.userId,
          requestId: transaction.requestId,
          ...transaction.customAttributes
        });
      }
    }

    return {
      ...transaction,
      duration: 0,
      timestamp: new Date()
    };
  }

  /**
   * End an APM transaction
   */
  async endTransaction(transaction: APMTransaction, finalStatus?: APMTransaction['status']): Promise<void> {
    const endTime = Date.now();
    transaction.duration = endTime - transaction.timestamp.getTime();
    transaction.status = finalStatus || transaction.status;

    // Complete New Relic transaction
    if (this.config.newrelic.enabled && global.newrelic) {
      try {
        const nrTransaction = global.newrelic.getTransaction();
        if (nrTransaction) {
          nrTransaction.end();
        }
      } catch (error) {
        this.logger.warn('Failed to end New Relic transaction:', error);
      }
    }

    // Record as metric
    await this.recordMetric({
      name: `transaction.duration`,
      value: transaction.duration,
      unit: 'ms',
      timestamp: new Date(),
      tags: {
        service: transaction.service,
        operation: transaction.operation,
        status: transaction.status,
        userId: transaction.userId || '',
        requestId: transaction.requestId || ''
      },
      service: transaction.service,
      component: 'apm'
    });

    // Record as event for detailed tracking
    await this.recordEvent({
      id: `txn_${transaction.requestId || Date.now()}`,
      timestamp: new Date(),
      level: transaction.status === 'error' ? 'error' : 'info',
      service: transaction.service,
      component: 'apm',
      operation: transaction.operation,
      userId: transaction.userId,
      requestId: transaction.requestId,
      duration: transaction.duration,
      status: transaction.status,
      metadata: {
        transactionName: transaction.name,
        ...transaction.customAttributes
      }
    });
  }

  /**
   * Record service health
   */
  async recordServiceHealth(health: ServiceHealth): Promise<void> {
    this.healthCache.set(health.service, health);

    // Record as metrics
    await Promise.all([
      this.recordMetric({
        name: 'service.response_time',
        value: health.responseTime,
        unit: 'ms',
        timestamp: health.lastChecked,
        tags: { service: health.service, status: health.status },
        service: health.service,
        component: 'health'
      }),
      this.recordMetric({
        name: 'service.uptime',
        value: health.uptime,
        unit: 'percent',
        timestamp: health.lastChecked,
        tags: { service: health.service },
        service: health.service,
        component: 'health'
      }),
      this.recordMetric({
        name: 'service.error_rate',
        value: health.errorRate,
        unit: 'percent',
        timestamp: health.lastChecked,
        tags: { service: health.service },
        service: health.service,
        component: 'health'
      })
    ]);
  }

  /**
   * Get current service health
   */
  getServiceHealth(): ServiceHealth[] {
    return Array.from(this.healthCache.values());
  }

  /**
   * Flush buffered data to external services
   */
  private async flushBuffers(): Promise<void> {
    try {
      // Send metrics batch to external monitoring
      if (this.metricsBuffer.length > 0) {
        await this.sendMetricsBatch(this.metricsBuffer.splice(0));
      }

      // Send events batch to external monitoring
      if (this.eventsBuffer.length > 0) {
        await this.sendEventsBatch(this.eventsBuffer.splice(0));
      }

    } catch (error) {
      this.logger.error('Failed to flush monitoring buffers:', error);
    }
  }

  /**
   * Send metrics batch to external services
   */
  private async sendMetricsBatch(metrics: PerformanceMetric[]): Promise<void> {
    // Send to custom metrics endpoint or third-party service
    if (process.env.METRICS_ENDPOINT) {
      try {
        await axios.post(process.env.METRICS_ENDPOINT, {
          metrics,
          timestamp: new Date(),
          source: 'auterity-unified-ai'
        });
      } catch (error) {
        this.logger.warn('Failed to send metrics to external endpoint:', error);
      }
    }
  }

  /**
   * Send events batch to external services
   */
  private async sendEventsBatch(events: MonitoringEvent[]): Promise<void> {
    // Additional processing if needed
    // Events are already sent to Winston/Elastic and Sentry
  }

  /**
   * Send accumulated metrics
   */
  private async sendMetrics(): Promise<void> {
    // Send any pending metrics
    if (this.metricsBuffer.length > 0) {
      await this.sendMetricsBatch([...this.metricsBuffer]);
    }
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    const services = [
      { name: 'vllm', url: process.env.VLLM_BASE_URL },
      { name: 'langgraph', url: process.env.LANGGRAPH_BASE_URL },
      { name: 'crewai', url: process.env.CREWAI_BASE_URL },
      { name: 'temporal', url: process.env.TEMPORAL_BASE_URL },
      { name: 'n8n', url: process.env.N8N_BASE_URL },
    ];

    for (const service of services) {
      if (service.url) {
        try {
          const startTime = Date.now();
          const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
          const responseTime = Date.now() - startTime;

          const existingHealth = this.healthCache.get(service.name);
          const uptime = existingHealth ? existingHealth.uptime : 100;
          const errorRate = existingHealth ? existingHealth.errorRate : 0;

          await this.recordServiceHealth({
            service: service.name,
            status: response.status === 200 ? 'healthy' : 'degraded',
            responseTime,
            uptime: response.status === 200 ? Math.min(uptime + 1, 100) : Math.max(uptime - 5, 0),
            errorRate: response.status !== 200 ? Math.min(errorRate + 1, 100) : Math.max(errorRate - 1, 0),
            throughput: 0, // Would need to track actual throughput
            lastChecked: new Date(),
            metadata: {
              statusCode: response.status,
              url: service.url
            }
          });

        } catch (error) {
          await this.recordServiceHealth({
            service: service.name,
            status: 'unhealthy',
            responseTime: 0,
            uptime: Math.max((this.healthCache.get(service.name)?.uptime || 100) - 10, 0),
            errorRate: Math.min((this.healthCache.get(service.name)?.errorRate || 0) + 5, 100),
            throughput: 0,
            lastChecked: new Date(),
            metadata: {
              error: error.message,
              url: service.url
            }
          });
        }
      }
    }
  }

  /**
   * Create a monitoring context for tracking operations
   */
  createMonitoringContext(service: string, component: string, operation: string, userId?: string, sessionId?: string) {
    return {
      service,
      component,
      operation,
      userId,
      sessionId,
      startTime: Date.now(),

      async recordSuccess(metadata?: Record<string, any>): Promise<void> {
        const duration = Date.now() - this.startTime;
        await advancedMonitoringService.recordEvent({
          id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          level: 'info',
          service: this.service,
          component: this.component,
          operation: this.operation,
          userId: this.userId,
          sessionId: this.sessionId,
          duration,
          status: 'success',
          metadata
        });
      },

      async recordError(error: Error, metadata?: Record<string, any>): Promise<void> {
        const duration = Date.now() - this.startTime;
        await advancedMonitoringService.recordEvent({
          id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          level: 'error',
          service: this.service,
          component: this.component,
          operation: this.operation,
          userId: this.userId,
          sessionId: this.sessionId,
          duration,
          status: 'failure',
          error: {
            message: error.message,
            stack: error.stack,
            context: metadata
          },
          metadata
        });
      }
    };
  }

  /**
   * Get monitoring statistics
   */
  getStatistics(): {
    totalEvents: number;
    totalMetrics: number;
    serviceHealth: ServiceHealth[];
    bufferSizes: { events: number; metrics: number };
    uptime: number;
  } {
    return {
      totalEvents: this.eventsBuffer.length,
      totalMetrics: this.metricsBuffer.length,
      serviceHealth: this.getServiceHealth(),
      bufferSizes: {
        events: this.eventsBuffer.length,
        metrics: this.metricsBuffer.length
      },
      uptime: process.uptime()
    };
  }
}

// Default configuration
const defaultConfig: MonitoringConfig = {
  newrelic: {
    enabled: !!process.env.NEW_RELIC_LICENSE_KEY,
    licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
    appName: 'Auterity-Unified-AI',
    labels: {
      environment: process.env.NODE_ENV || 'development',
      service: 'unified-ai'
    }
  },
  sentry: {
    enabled: !!process.env.SENTRY_DSN,
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version,
    sampleRate: 1.0,
    tracesSampleRate: 0.1
  },
  elastic: {
    enabled: !!process.env.ELASTICSEARCH_NODE,
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    indexPrefix: 'auterity-ai',
    auth: process.env.ELASTICSEARCH_USERNAME ? {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD || ''
    } : undefined
  },
  custom: {
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
    batchSize: parseInt(process.env.LOG_BATCH_SIZE || '100')
  }
};

// Export singleton instance
export const advancedMonitoringService = new AdvancedMonitoringService(defaultConfig);

// Export types
export type { MonitoringConfig, MonitoringEvent, PerformanceMetric, APMTransaction, ServiceHealth };

// Convenience functions for easy usage
export const recordError = (error: Error, context?: {
  service?: string;
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}) => {
  return advancedMonitoringService.recordEvent({
    id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    level: 'error',
    service: context?.service || 'unknown',
    component: context?.component || 'unknown',
    operation: context?.operation || 'unknown',
    userId: context?.userId,
    sessionId: context?.sessionId,
    status: 'failure',
    error: {
      message: error.message,
      stack: error.stack,
      context: context?.metadata
    },
    metadata: context?.metadata
  });
};

export const recordMetric = (name: string, value: number, tags?: Record<string, string>, service?: string, component?: string) => {
  return advancedMonitoringService.recordMetric({
    name,
    value,
    unit: 'count',
    timestamp: new Date(),
    tags: tags || {},
    service: service || 'unknown',
    component: component || 'unknown'
  });
};

export const createMonitoringContext = advancedMonitoringService.createMonitoringContext.bind(advancedMonitoringService);

