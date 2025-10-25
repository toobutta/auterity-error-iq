/**
 * Network Monitor for Chrome DevTools Integration
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
    console.log('[NetworkMonitor] Network monitoring initialized');
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
      console.warn('[NetworkMonitor] Resource timing not supported:', error);
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

    // Log to console for DevTools visibility
    console.log(`[Network] ${request.method} ${request.url} - ${request.status} (${request.duration.toFixed(2)}ms)`);
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

        console.log(`[Network] FETCH ${method} ${url} - ${response.status} (${duration.toFixed(2)}ms)`);

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

        console.error(`[Network] FETCH ${method} ${url} - Failed (${duration.toFixed(2)}ms):`, error);

        throw error;
      }
    };
  }

  /**
   * Set up XMLHttpRequest interception
   */
  private setupXMLHttpRequestInterception(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const self = this; // Capture this reference

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
      (this as any)._networkMonitorData = {
        method: method.toUpperCase(),
        url: typeof url === 'string' ? url : url.href,
        startTime: performance.now(),
      };
      return originalOpen.call(this, method, url, async, username, password);
    };

    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      const monitor = (this as any)._networkMonitorData;
      if (!monitor) return originalSend.call(this, body);

      const xhr = this;

      this.addEventListener('loadend', () => {
        const duration = performance.now() - monitor.startTime;

        const request: NetworkRequest = {
          id: self.generateId(),
          url: monitor.url,
          method: monitor.method,
          status: xhr.status,
          duration,
          size: 0, // XHR doesn't provide size info easily
          type: 'xhr',
          timestamp: Date.now(),
        };

        self.requests.push(request);
        self.updateMetrics(request);

        console.log(`[Network] XHR ${monitor.method} ${monitor.url} - ${xhr.status} (${duration.toFixed(2)}ms)`);
      });

      return originalSend.call(this, body);
    };
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
