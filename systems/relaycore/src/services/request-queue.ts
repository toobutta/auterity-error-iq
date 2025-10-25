/**
 * Priority Request Queue Service
 * Implements intelligent request queuing with priority levels and processing strategies
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger";
import { CacheManager } from "./cache-manager";

export enum Priority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
  BACKGROUND = 5,
}

export interface QueuedRequest {
  id: string;
  priority: Priority;
  provider: string;
  payload: any;
  callback: (error: Error | null, result?: any) => void;
  metadata: {
    userId?: string;
    timestamp: number;
    timeoutMs: number;
    retryCount: number;
    maxRetries: number;
  };
}

export interface QueueConfig {
  maxSize: number;
  concurrency: Record<string, number>; // Per-provider concurrency limits
  processingStrategy: "priority" | "round-robin" | "least-loaded" | "adaptive";
  timeoutMs: number;
  retryDelayMs: number;
  enableMetrics: boolean;
  executionHandler?: (provider: string, payload: any) => Promise<any>;
}

export interface QueueMetrics {
  totalQueued: number;
  totalProcessed: number;
  totalFailed: number;
  averageWaitTime: number;
  queueSizeByPriority: Record<Priority, number>;
  activeByProvider: Record<string, number>;
}

export class PriorityRequestQueue extends EventEmitter {
  private queue: QueuedRequest[] = [];
  private activeRequests: Map<string, Set<string>> = new Map(); // provider -> set of request IDs
  private config: QueueConfig;
  private cacheManager: CacheManager;
  private metrics: QueueMetrics;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: QueueConfig, cacheManager: CacheManager) {
    super();
    this.config = config;
    this.cacheManager = cacheManager;
    this.metrics = this.initializeMetrics();

    // Initialize active requests tracking for each provider
    Object.keys(this.config.concurrency).forEach((provider) => {
      this.activeRequests.set(provider, new Set());
    });

    this.startProcessing();
    logger.info(
      `Priority request queue initialized with max size: ${this.config.maxSize}`,
    );
  }

  /**
   * Add a request to the queue
   */
  async enqueue(
    provider: string,
    payload: any,
    priority: Priority = Priority.NORMAL,
    options: {
      userId?: string;
      timeoutMs?: number;
      maxRetries?: number;
    } = {},
  ): Promise<any> {
    if (this.queue.length >= this.config.maxSize) {
      throw new Error("Queue is full, request rejected");
    }

    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: this.generateRequestId(),
        priority,
        provider,
        payload,
        callback: (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
        metadata: {
          userId: options.userId,
          timestamp: Date.now(),
          timeoutMs: options.timeoutMs || this.config.timeoutMs,
          retryCount: 0,
          maxRetries: options.maxRetries || 3,
        },
      };

      this.addToQueue(request);
      this.emit("request-queued", request);

      logger.debug(
        `Request ${request.id} queued for ${provider} with priority ${priority}`,
      );
    });
  }

  /**
   * Add request to queue with proper priority ordering
   */
  private addToQueue(request: QueuedRequest): void {
    // Insert request based on priority (lower number = higher priority)
    let insertIndex = 0;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority > request.priority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    this.queue.splice(insertIndex, 0, request);
    this.updateMetrics();
  }

  /**
   * Process queued requests
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100); // Check every 100ms
  }

  /**
   * Main queue processing logic
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    // Get next request based on processing strategy
    const request = this.getNextRequest();
    if (!request) {
      return;
    }

    // Check if provider has available capacity
    const activeCount = this.activeRequests.get(request.provider)?.size || 0;
    const maxConcurrency = this.config.concurrency[request.provider] || 1;

    if (activeCount >= maxConcurrency) {
      return; // Provider at capacity, try again later
    }

    // Remove from queue and start processing
    const queueIndex = this.queue.findIndex((r) => r.id === request.id);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      this.processRequest(request);
    }
  }

  /**
   * Get next request based on processing strategy
   */
  private getNextRequest(): QueuedRequest | null {
    if (this.queue.length === 0) {
      return null;
    }

    switch (this.config.processingStrategy) {
      case "priority":
        return this.getHighestPriorityRequest();

      case "round-robin":
        return this.getRoundRobinRequest();

      case "least-loaded":
        return this.getLeastLoadedRequest();

      case "adaptive":
        return this.getAdaptiveRequest();

      default:
        return this.queue[0];
    }
  }

  /**
   * Get highest priority request that can be processed
   */
  private getHighestPriorityRequest(): QueuedRequest | null {
    for (const request of this.queue) {
      const activeCount = this.activeRequests.get(request.provider)?.size || 0;
      const maxConcurrency = this.config.concurrency[request.provider] || 1;

      if (activeCount < maxConcurrency) {
        return request;
      }
    }
    return null;
  }

  /**
   * Get next request using round-robin strategy
   */
  private getRoundRobinRequest(): QueuedRequest | null {
    // Simple round-robin: find provider with least recent processing
    const providerLastUsed = new Map<string, number>();

    // Track when each provider was last used
    this.activeRequests.forEach((activeSet, provider) => {
      providerLastUsed.set(provider, activeSet.size > 0 ? Date.now() : 0);
    });

    let selectedRequest: QueuedRequest | null = null;
    let oldestProviderTime = Date.now();

    for (const request of this.queue) {
      const activeCount = this.activeRequests.get(request.provider)?.size || 0;
      const maxConcurrency = this.config.concurrency[request.provider] || 1;
      const lastUsed = providerLastUsed.get(request.provider) || 0;

      if (activeCount < maxConcurrency && lastUsed < oldestProviderTime) {
        selectedRequest = request;
        oldestProviderTime = lastUsed;
      }
    }

    return selectedRequest;
  }

  /**
   * Get request for least loaded provider
   */
  private getLeastLoadedRequest(): QueuedRequest | null {
    let selectedRequest: QueuedRequest | null = null;
    let lowestLoad = Number.MAX_SAFE_INTEGER;

    for (const request of this.queue) {
      const activeCount = this.activeRequests.get(request.provider)?.size || 0;
      const maxConcurrency = this.config.concurrency[request.provider] || 1;

      if (activeCount < maxConcurrency && activeCount < lowestLoad) {
        selectedRequest = request;
        lowestLoad = activeCount;
      }
    }

    return selectedRequest;
  }

  /**
   * Get request using adaptive strategy (combines priority and load balancing)
   */
  private getAdaptiveRequest(): QueuedRequest | null {
    let bestRequest: QueuedRequest | null = null;
    let bestScore = -1;

    for (const request of this.queue) {
      const activeCount = this.activeRequests.get(request.provider)?.size || 0;
      const maxConcurrency = this.config.concurrency[request.provider] || 1;

      if (activeCount >= maxConcurrency) {
        continue; // Provider at capacity
      }

      // Calculate composite score
      const priorityScore = (6 - request.priority) / 5; // Higher priority = higher score
      const loadScore = 1 - activeCount / maxConcurrency; // Lower load = higher score
      const waitScore = Math.min(
        (Date.now() - request.metadata.timestamp) / 10000,
        1,
      ); // Longer wait = higher score

      const compositeScore =
        priorityScore * 0.5 + loadScore * 0.3 + waitScore * 0.2;

      if (compositeScore > bestScore) {
        bestScore = compositeScore;
        bestRequest = request;
      }
    }

    return bestRequest;
  }

  /**
   * Process individual request
   */
  private async processRequest(request: QueuedRequest): Promise<void> {
    const startTime = Date.now();

    // Track active request
    if (!this.activeRequests.has(request.provider)) {
      this.activeRequests.set(request.provider, new Set());
    }
    this.activeRequests.get(request.provider)!.add(request.id);

    // Set timeout
    const timeoutHandle = setTimeout(() => {
      this.handleRequestTimeout(request);
    }, request.metadata.timeoutMs);

    try {
      this.emit("request-processing", request);

      // Process the actual request (this would integrate with your AI providers)
      const result = await this.executeRequest(request);

      clearTimeout(timeoutHandle);

      // Calculate wait time
      const waitTime = startTime - request.metadata.timestamp;
      this.updateWaitTimeMetrics(waitTime);

      request.callback(null, result);
      this.metrics.totalProcessed++;

      this.emit("request-completed", request, result);
      logger.debug(
        `Request ${request.id} completed in ${Date.now() - startTime}ms`,
      );
    } catch (error) {
      clearTimeout(timeoutHandle);
      await this.handleRequestError(request, error as Error);
    } finally {
      // Remove from active tracking
      this.activeRequests.get(request.provider)?.delete(request.id);
      this.updateMetrics();
    }
  }

  /**
   * Execute the actual request (placeholder for integration with AI providers)
   */
  private async executeRequest(request: QueuedRequest): Promise<any> {
    if (this.config.executionHandler) {
      return await this.config.executionHandler(
        request.provider,
        request.payload,
      );
    }

    // Default simulation (for testing)
    const processingTime = Math.random() * 1000 + 500; // 500-1500ms

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          // 90% success rate
          resolve({
            provider: request.provider,
            result: `Processed request ${request.id}`,
            processingTime,
          });
        } else {
          reject(new Error("Simulated provider error"));
        }
      }, processingTime);
    });
  }

  /**
   * Handle request timeout
   */
  private handleRequestTimeout(request: QueuedRequest): void {
    logger.warn(
      `Request ${request.id} timed out after ${request.metadata.timeoutMs}ms`,
    );

    this.activeRequests.get(request.provider)?.delete(request.id);

    if (request.metadata.retryCount < request.metadata.maxRetries) {
      this.retryRequest(request);
    } else {
      request.callback(new Error("Request timeout"));
      this.metrics.totalFailed++;
    }

    this.updateMetrics();
  }

  /**
   * Handle request errors with retry logic
   */
  private async handleRequestError(
    request: QueuedRequest,
    error: Error,
  ): Promise<void> {
    logger.error(`Request ${request.id} failed:`, error.message);

    this.activeRequests.get(request.provider)?.delete(request.id);

    if (request.metadata.retryCount < request.metadata.maxRetries) {
      this.retryRequest(request);
    } else {
      request.callback(error);
      this.metrics.totalFailed++;
    }

    this.updateMetrics();
  }

  /**
   * Retry a failed request
   */
  private retryRequest(request: QueuedRequest): void {
    request.metadata.retryCount++;
    request.metadata.timestamp = Date.now() + this.config.retryDelayMs;

    // Add back to queue with exponential backoff delay
    setTimeout(
      () => {
        this.addToQueue(request);
        this.emit("request-retried", request);
      },
      this.config.retryDelayMs * Math.pow(2, request.metadata.retryCount - 1),
    );

    logger.debug(
      `Request ${request.id} scheduled for retry ${request.metadata.retryCount}`,
    );
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): QueueMetrics {
    return {
      totalQueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      averageWaitTime: 0,
      queueSizeByPriority: {
        [Priority.CRITICAL]: 0,
        [Priority.HIGH]: 0,
        [Priority.NORMAL]: 0,
        [Priority.LOW]: 0,
        [Priority.BACKGROUND]: 0,
      },
      activeByProvider: {},
    };
  }

  /**
   * Update queue metrics
   */
  private updateMetrics(): void {
    this.metrics.totalQueued = this.queue.length;

    // Reset priority counts
    Object.values(Priority).forEach((priority) => {
      if (typeof priority === "number") {
        this.metrics.queueSizeByPriority[priority] = 0;
      }
    });

    // Count by priority
    this.queue.forEach((request) => {
      this.metrics.queueSizeByPriority[request.priority]++;
    });

    // Count active by provider
    this.activeRequests.forEach((activeSet, provider) => {
      this.metrics.activeByProvider[provider] = activeSet.size;
    });
  }

  /**
   * Update wait time metrics
   */
  private updateWaitTimeMetrics(waitTime: number): void {
    // Simple moving average
    const alpha = 0.1;
    this.metrics.averageWaitTime =
      (1 - alpha) * this.metrics.averageWaitTime + alpha * waitTime;
  }

  /**
   * Get current queue metrics
   */
  getMetrics(): QueueMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueSize: number;
    activeRequests: number;
    availableCapacity: Record<string, number>;
  } {
    const activeRequests = Array.from(this.activeRequests.values()).reduce(
      (sum, set) => sum + set.size,
      0,
    );

    const availableCapacity: Record<string, number> = {};
    Object.entries(this.config.concurrency).forEach(([provider, max]) => {
      const active = this.activeRequests.get(provider)?.size || 0;
      availableCapacity[provider] = Math.max(0, max - active);
    });

    return {
      queueSize: this.queue.length,
      activeRequests,
      availableCapacity,
    };
  }

  /**
   * Pause queue processing
   */
  pause(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info("Queue processing paused");
    }
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    if (!this.processingInterval) {
      this.startProcessing();
      logger.info("Queue processing resumed");
    }
  }

  /**
   * Clear all queued requests
   */
  clear(): void {
    const clearedCount = this.queue.length;
    this.queue.forEach((request) => {
      request.callback(new Error("Queue cleared"));
    });
    this.queue = [];
    this.updateMetrics();
    logger.info(`Cleared ${clearedCount} queued requests`);
  }

  /**
   * Shutdown the queue
   */
  shutdown(): void {
    this.pause();
    this.clear();
    logger.info("Priority request queue shutdown");
  }
}

/**
 * Default queue configuration
 */
export const defaultQueueConfig: QueueConfig = {
  maxSize: 10000,
  concurrency: {
    openai: 10,
    anthropic: 5,
    neuroweaver: 3,
  },
  processingStrategy: "priority",
  timeoutMs: 30000, // 30 seconds
  retryDelayMs: 1000, // 1 second
  enableMetrics: true,
};

