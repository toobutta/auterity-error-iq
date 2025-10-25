/**
 * Enterprise Integration Bus (EIB)
 * Implements enterprise integration patterns for the Auterity Unified AI Platform
 * Inspired by Apache Camel and Spring Integration patterns
 */

import { EventEmitter } from 'events';
import { z } from 'zod';

// Types and interfaces
export interface Message {
  id: string;
  correlationId?: string;
  timestamp: Date;
  headers: Record<string, any>;
  body: any;
  source: string;
  destination?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  ttl?: number; // Time to live in milliseconds
  retryCount: number;
  maxRetries: number;
  deadLetter?: boolean;
}

export interface IntegrationEndpoint {
  id: string;
  type: 'source' | 'sink' | 'processor' | 'router';
  name: string;
  uri: string;
  config: Record<string, any>;
  enabled: boolean;
  errorHandler?: (error: Error, message: Message) => Promise<void>;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  from: string; // Source endpoint URI
  to: string[]; // Destination endpoint URIs
  processors: Processor[];
  errorHandler?: string; // Error handler route ID
  enabled: boolean;
  metrics: RouteMetrics;
}

export interface Processor {
  id: string;
  type: 'transformer' | 'filter' | 'enricher' | 'splitter' | 'aggregator' | 'validator' | 'custom';
  name: string;
  config: Record<string, any>;
  process: (message: Message) => Promise<Message | Message[] | null>;
}

export interface RouteMetrics {
  messagesProcessed: number;
  messagesFailed: number;
  averageProcessingTime: number;
  throughput: number;
  lastProcessed?: Date;
  errorRate: number;
}

export interface SagaDefinition {
  id: string;
  name: string;
  steps: SagaStep[];
  compensationSteps: Record<string, SagaStep>;
  timeout?: number;
  retries?: number;
}

export interface SagaStep {
  id: string;
  action: (context: SagaContext) => Promise<any>;
  compensation?: (context: SagaContext) => Promise<any>;
  timeout?: number;
}

export interface SagaContext {
  sagaId: string;
  correlationId: string;
  variables: Record<string, any>;
  completedSteps: string[];
  failedSteps: string[];
  startTime: Date;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  name: string;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

// Validation schemas
const MessageSchema = z.object({
  id: z.string().min(1),
  correlationId: z.string().optional(),
  timestamp: z.date(),
  headers: z.record(z.any()),
  body: z.any(),
  source: z.string().min(1),
  destination: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']),
  ttl: z.number().optional(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  deadLetter: z.boolean().default(false)
});

// Enterprise Integration Bus
export class EnterpriseIntegrationBus extends EventEmitter {
  private endpoints = new Map<string, IntegrationEndpoint>();
  private routes = new Map<string, Route>();
  private processors = new Map<string, Processor>();
  private sagas = new Map<string, SagaDefinition>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private messageQueue: Message[] = [];
  private deadLetterQueue: Message[] = [];
  private isProcessing = false;

  constructor() {
    super();
    this.initializeBuiltInProcessors();
    this.startMessageProcessing();
  }

  /**
   * Register an integration endpoint
   */
  async registerEndpoint(endpoint: IntegrationEndpoint): Promise<void> {
    this.endpoints.set(endpoint.id, endpoint);
    this.emit('endpointRegistered', endpoint);
  }

  /**
   * Create and register a route
   */
  async createRoute(route: Omit<Route, 'metrics'>): Promise<string> {
    const routeWithMetrics: Route = {
      ...route,
      metrics: {
        messagesProcessed: 0,
        messagesFailed: 0,
        averageProcessingTime: 0,
        throughput: 0,
        errorRate: 0
      }
    };

    this.routes.set(route.id, routeWithMetrics);
    this.emit('routeCreated', routeWithMetrics);

    return route.id;
  }

  /**
   * Register a custom processor
   */
  async registerProcessor(processor: Processor): Promise<void> {
    this.processors.set(processor.id, processor);
    this.emit('processorRegistered', processor);
  }

  /**
   * Send a message through the integration bus
   */
  async sendMessage(message: Message): Promise<void> {
    try {
      const validatedMessage = MessageSchema.parse(message);

      // Check TTL
      if (validatedMessage.ttl && Date.now() - validatedMessage.timestamp.getTime() > validatedMessage.ttl) {
        await this.sendToDeadLetterQueue(validatedMessage, new Error('Message TTL expired'));
        return;
      }

      // Add to processing queue
      this.messageQueue.push(validatedMessage);

      // Trigger processing if not already running
      if (!this.isProcessing) {
        this.processMessages();
      }

      this.emit('messageSent', validatedMessage);

    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Create a saga definition
   */
  async createSaga(saga: SagaDefinition): Promise<string> {
    this.sagas.set(saga.id, saga);
    this.emit('sagaCreated', saga);
    return saga.id;
  }

  /**
   * Execute a saga
   */
  async executeSaga(sagaId: string, initialContext: Omit<SagaContext, 'sagaId' | 'startTime' | 'completedSteps' | 'failedSteps'>): Promise<any> {
    const saga = this.sagas.get(sagaId);
    if (!saga) {
      throw new Error(`Saga ${sagaId} not found`);
    }

    const context: SagaContext = {
      ...initialContext,
      sagaId,
      startTime: new Date(),
      completedSteps: [],
      failedSteps: []
    };

    try {
      // Execute saga steps
      for (const step of saga.steps) {
        await this.executeSagaStep(step, context);
        context.completedSteps.push(step.id);
      }

      this.emit('sagaCompleted', { sagaId, context });
      return context.variables;

    } catch (error) {
      // Execute compensation steps
      await this.compensateSaga(saga, context);
      this.emit('sagaFailed', { sagaId, context, error });
      throw error;
    }
  }

  /**
   * Register a circuit breaker
   */
  async registerCircuitBreaker(config: CircuitBreakerConfig): Promise<void> {
    this.circuitBreakers.set(config.name, {
      state: 'closed',
      failures: 0
    });

    // Start monitoring
    this.monitorCircuitBreaker(config);
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    breakerName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(breakerName);
    if (!breaker) {
      return await operation();
    }

    if (breaker.state === 'open') {
      if (breaker.nextAttemptTime && Date.now() < breaker.nextAttemptTime.getTime()) {
        throw new Error(`Circuit breaker ${breakerName} is OPEN`);
      }
      // Move to half-open
      breaker.state = 'half-open';
    }

    try {
      const result = await operation();
      this.handleCircuitBreakerSuccess(breakerName);
      return result;

    } catch (error) {
      this.handleCircuitBreakerFailure(breakerName);
      throw error;
    }
  }

  // Private methods

  private async processMessages(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (!message) continue;

        try {
          await this.processMessage(message);
        } catch (error) {
          await this.handleMessageError(message, error as Error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processMessage(message: Message): Promise<void> {
    // Find matching routes
    const matchingRoutes = Array.from(this.routes.values())
      .filter(route => route.enabled && this.matchesRoute(route, message));

    if (matchingRoutes.length === 0) {
      throw new Error(`No matching route found for message from ${message.source}`);
    }

    // Process through each matching route
    for (const route of matchingRoutes) {
      try {
        const startTime = Date.now();
        let processedMessage = message;

        // Apply processors
        for (const processor of route.processors) {
          const processorFn = this.processors.get(processor.id);
          if (!processorFn) {
            throw new Error(`Processor ${processor.id} not found`);
          }

          const result = await processorFn.process(processedMessage);
          if (result === null) {
            // Message filtered out
            return;
          }
          if (Array.isArray(result)) {
            // Message split - process each part
            for (const splitMessage of result) {
              await this.sendToDestinations(route, splitMessage);
            }
            return;
          }
          processedMessage = result;
        }

        // Send to destinations
        await this.sendToDestinations(route, processedMessage);

        // Update metrics
        this.updateRouteMetrics(route, Date.now() - startTime);

      } catch (error) {
        await this.handleRouteError(route, message, error as Error);
      }
    }
  }

  private matchesRoute(route: Route, message: Message): boolean {
    // Simple URI matching - can be enhanced with pattern matching
    return route.from === message.source || route.from === '*' ||
           message.destination === route.from;
  }

  private async sendToDestinations(route: Route, message: Message): Promise<void> {
    for (const destinationUri of route.to) {
      const destinationEndpoint = Array.from(this.endpoints.values())
        .find(endpoint => endpoint.uri === destinationUri);

      if (destinationEndpoint) {
        try {
          await this.sendToEndpoint(destinationEndpoint, message);
        } catch (error) {
          console.error(`Failed to send to endpoint ${destinationUri}:`, error);
        }
      }
    }
  }

  private async sendToEndpoint(endpoint: IntegrationEndpoint, message: Message): Promise<void> {
    // This would be implemented based on endpoint type
    // For now, just emit an event
    this.emit('messageDelivered', { endpoint, message });
  }

  private async handleMessageError(message: Message, error: Error): Promise<void> {
    message.retryCount++;

    if (message.retryCount < message.maxRetries) {
      // Retry with exponential backoff
      const delay = Math.pow(2, message.retryCount) * 1000;
      setTimeout(() => {
        this.messageQueue.push(message);
      }, delay);
    } else {
      // Send to dead letter queue
      await this.sendToDeadLetterQueue(message, error);
    }
  }

  private async handleRouteError(route: Route, message: Message, error: Error): Promise<void> {
    route.metrics.messagesFailed++;

    if (route.errorHandler) {
      const errorRoute = this.routes.get(route.errorHandler);
      if (errorRoute) {
        const errorMessage: Message = {
          ...message,
          id: `error_${message.id}`,
          body: { originalMessage: message, error: error.message },
          headers: { ...message.headers, error: true }
        };
        await this.processMessage(errorMessage);
      }
    }

    await this.handleMessageError(message, error);
  }

  private async sendToDeadLetterQueue(message: Message, error: Error): Promise<void> {
    const deadLetterMessage: Message = {
      ...message,
      deadLetter: true,
      headers: {
        ...message.headers,
        deadLetterReason: error.message,
        deadLetterTime: new Date().toISOString()
      }
    };

    this.deadLetterQueue.push(deadLetterMessage);
    this.emit('messageDeadLettered', { message: deadLetterMessage, error });
  }

  private updateRouteMetrics(route: Route, processingTime: number): void {
    route.metrics.messagesProcessed++;
    route.metrics.averageProcessingTime =
      (route.metrics.averageProcessingTime + processingTime) / 2;
    route.metrics.lastProcessed = new Date();
    route.metrics.errorRate = route.metrics.messagesFailed /
      (route.metrics.messagesProcessed + route.metrics.messagesFailed);
    route.metrics.throughput = route.metrics.messagesProcessed /
      ((Date.now() - route.metrics.lastProcessed.getTime()) / 1000);
  }

  private async executeSagaStep(step: SagaStep, context: SagaContext): Promise<void> {
    try {
      const result = await step.action(context);
      context.variables[step.id] = result;
    } catch (error) {
      context.failedSteps.push(step.id);
      throw error;
    }
  }

  private async compensateSaga(saga: SagaDefinition, context: SagaContext): Promise<void> {
    // Execute compensation steps in reverse order
    const failedSteps = context.failedSteps.reverse();

    for (const stepId of failedSteps) {
      const compensationStep = saga.compensationSteps[stepId];
      if (compensationStep) {
        try {
          await compensationStep.compensation?.(context);
        } catch (compensationError) {
          console.error(`Compensation failed for step ${stepId}:`, compensationError);
        }
      }
    }
  }

  private monitorCircuitBreaker(config: CircuitBreakerConfig): void {
    setInterval(() => {
      const breaker = this.circuitBreakers.get(config.name);
      if (!breaker) return;

      if (breaker.state === 'open' &&
          breaker.nextAttemptTime &&
          Date.now() >= breaker.nextAttemptTime.getTime()) {
        breaker.state = 'half-open';
      }
    }, config.monitoringPeriod);
  }

  private handleCircuitBreakerSuccess(breakerName: string): void {
    const breaker = this.circuitBreakers.get(breakerName);
    if (!breaker) return;

    breaker.failures = 0;
    breaker.state = 'closed';
  }

  private handleCircuitBreakerFailure(breakerName: string): void {
    const breaker = this.circuitBreakers.get(breakerName);
    if (!breaker) return;

    breaker.failures++;
    breaker.lastFailureTime = new Date();

    // Check if should open circuit
    const config = this.getCircuitBreakerConfig(breakerName);
    if (breaker.failures >= config.failureThreshold) {
      breaker.state = 'open';
      breaker.nextAttemptTime = new Date(Date.now() + config.recoveryTimeout);
    }
  }

  private getCircuitBreakerConfig(breakerName: string): CircuitBreakerConfig {
    // This would be stored in a config map
    return {
      name: breakerName,
      failureThreshold: 5,
      recoveryTimeout: 60000,
      monitoringPeriod: 10000
    };
  }

  private initializeBuiltInProcessors(): void {
    // JSON transformer
    this.registerProcessor({
      id: 'json-transformer',
      type: 'transformer',
      name: 'JSON Transformer',
      config: {},
      process: async (message: Message) => {
        if (typeof message.body === 'string') {
          message.body = JSON.parse(message.body);
        }
        return message;
      }
    });

    // Header filter
    this.registerProcessor({
      id: 'header-filter',
      type: 'filter',
      name: 'Header Filter',
      config: { headerName: 'priority', headerValue: 'high' },
      process: async (message: Message) => {
        return message.headers[this.config.headerName] === this.config.headerValue
          ? message
          : null;
      }
    });

    // Content enricher
    this.registerProcessor({
      id: 'content-enricher',
      type: 'enricher',
      name: 'Content Enricher',
      config: { enrichField: 'processedAt', enrichValue: () => new Date() },
      process: async (message: Message) => {
        message.body[this.config.enrichField] = this.config.enrichValue();
        return message;
      }
    });

    // Message validator
    this.registerProcessor({
      id: 'message-validator',
      type: 'validator',
      name: 'Message Validator',
      config: { requiredFields: ['id', 'body'] },
      process: async (message: Message) => {
        for (const field of this.config.requiredFields) {
          if (!message[field]) {
            throw new Error(`Required field '${field}' is missing`);
          }
        }
        return message;
      }
    });
  }

  private startMessageProcessing(): void {
    // Process messages every 100ms
    setInterval(() => {
      if (this.messageQueue.length > 0 && !this.isProcessing) {
        this.processMessages();
      }
    }, 100);
  }

  // Public getters
  getEndpoints(): IntegrationEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  getRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  getProcessors(): Processor[] {
    return Array.from(this.processors.values());
  }

  getDeadLetterQueue(): Message[] {
    return [...this.deadLetterQueue];
  }

  getQueueLength(): number {
    return this.messageQueue.length;
  }

  getCircuitBreakerStates(): Record<string, CircuitBreakerState> {
    return Object.fromEntries(this.circuitBreakers.entries());
  }

  // Cleanup dead letter queue
  clearDeadLetterQueue(olderThanHours: number = 24): number {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const initialLength = this.deadLetterQueue.length;

    this.deadLetterQueue = this.deadLetterQueue.filter(
      message => message.timestamp.getTime() > cutoffTime
    );

    return initialLength - this.deadLetterQueue.length;
  }
}

// Export singleton instance
export const enterpriseIntegrationBus = new EnterpriseIntegrationBus();

// Export types
export type { Message, IntegrationEndpoint, Route, Processor, SagaDefinition, SagaStep, SagaContext, CircuitBreakerConfig, CircuitBreakerState };

// Convenience functions
export const createRoute = enterpriseIntegrationBus.createRoute.bind(enterpriseIntegrationBus);
export const registerEndpoint = enterpriseIntegrationBus.registerEndpoint.bind(enterpriseIntegrationBus);
export const registerProcessor = enterpriseIntegrationBus.registerProcessor.bind(enterpriseIntegrationBus);
export const sendMessage = enterpriseIntegrationBus.sendMessage.bind(enterpriseIntegrationBus);
export const createSaga = enterpriseIntegrationBus.createSaga.bind(enterpriseIntegrationBus);
export const executeSaga = enterpriseIntegrationBus.executeSaga.bind(enterpriseIntegrationBus);
export const registerCircuitBreaker = enterpriseIntegrationBus.registerCircuitBreaker.bind(enterpriseIntegrationBus);
export const executeWithCircuitBreaker = enterpriseIntegrationBus.executeWithCircuitBreaker.bind(enterpriseIntegrationBus);

