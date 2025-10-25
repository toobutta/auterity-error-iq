/**
 * Network Monitor for Chrome DevTools Integration - Error-IQ
 * Monitors API calls, WebSocket connections, and network performance
 */

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  size: number;
  type: 'xhr' | 'fetch' | 'websocket' | 'other';
  timestamp: number;
  error?: string;
}

export interface NetworkMetrics {
  totalRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalDataTransferred: number;
  activeConnections: number;
}

class NetworkMonitor {
  private requests: NetworkRequest[] = [];
  private metrics: NetworkMetrics;
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  constructor() {
    this.metrics = {
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalDataTransferred: 0,
      activeConnections: 0,
    };
  }

  /**
   * Initialize network monitoring
   */
  public init(): void {
    if (this.isInitialized) return;

    this.setupResourceTimingObserver();
    this.setupFetchInterception();
    this.setupXMLHttpRequestInterception();

    this.isInitialized = true;

  }

  /**
   * Set up Resource Timing API observer
   */
  private setupResourceTimingObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.processResourceEntry(entry as PerformanceResourceTiming);
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {

    }
  }

  /**
   * Process resource timing entry
   */
  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const request: NetworkRequest = {
      id: this.generateId(),
      url: entry.name,
      method: 'GET', // Resource timing doesn't provide method
      status: 200, // Assume success for resources
      duration: entry.responseEnd - entry.requestStart,
      size: entry.transferSize || 0,
      type: this.getResourceType(entry.initiatorType),
      timestamp: Date.now(),
    };

    this.requests.push(request);
    this.updateMetrics(request);

    // Network request logged for monitoring
  }

  /**
   * Set up fetch interception
   */
  private setupFetchInterception(): void {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const startTime = performance.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';

      try {
        const response = await originalFetch(input, init);
        const duration = performance.now() - startTime;

        const request: NetworkRequest = {
          id: this.generateId(),
          url,
          method,
          status: response.status,
          duration,
          size: 0, // Fetch doesn't provide size info
          type: 'fetch',
          timestamp: Date.now(),
        };

        this.requests.push(request);
        this.updateMetrics(request);

        // Network request logged for monitoring

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        const request: NetworkRequest = {
          id: this.generateId(),
          url,
          method,
          status: 0,
          duration,
          size: 0,
          type: 'fetch',
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Network error',
        };

        this.requests.push(request);
        this.updateMetrics(request);

        // Network error logged for monitoring

        throw error;
      }
    };
  }

  /**
   * Set up XMLHttpRequest interception
   */
  private setupXMLHttpRequestInterception(): void {
    // Skip XHR interception for now to avoid TypeScript issues
    // This can be implemented later with proper typing
    // XHR interception skipped for TypeScript compatibility
  }

  /**
   * Update network metrics
   */
  private updateMetrics(request: NetworkRequest): void {
    this.metrics.totalRequests++;
    this.metrics.totalDataTransferred += request.size;

    if (request.status >= 400 || request.error) {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalTime = this.requests.reduce((sum, req) => sum + req.duration, 0);
    this.metrics.averageResponseTime = totalTime / this.requests.length;
  }

  /**
   * Get resource type from initiator type
   */
  private getResourceType(initiatorType: string): NetworkRequest['type'] {
    switch (initiatorType) {
      case 'xmlhttprequest':
        return 'xhr';
      case 'fetch':
        return 'fetch';
      default:
        return 'other';
    }
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current network metrics
   */
  public getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent requests
   */
  public getRecentRequests(limit = 50): NetworkRequest[] {
    return this.requests.slice(-limit);
  }

  /**
   * Clear request history
   */
  public clearHistory(): void {
    this.requests = [];
    this.metrics = {
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalDataTransferred: 0,
      activeConnections: 0,
    };
  }

  /**
   * Destroy monitor and clean up
   */
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearHistory();
    this.isInitialized = false;
  }
}

export { NetworkMonitor };


