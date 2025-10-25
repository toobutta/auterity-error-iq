/**
 * Console Enhancer for Chrome DevTools Integration
 * Provides structured logging, performance metrics, and debugging utilities
 */

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  stack?: string;
  context?: Record<string, any>;
  performanceMetrics?: {
    memoryUsage?: number;
    renderTime?: number;
    networkRequests?: number;
  };
}

export interface ConsoleMetrics {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  performanceLogs: number;
}

class ConsoleEnhancer {
  private logs: LogEntry[] = [];
  private metrics: ConsoleMetrics;
  private originalConsole: Record<string, any> = {};
  private isInitialized = false;
  private correlationId: string;

  constructor() {
    this.metrics = {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      performanceLogs: 0,
    };
    this.correlationId = this.generateCorrelationId();
  }

  /**
   * Initialize console enhancement
   */
  public init(): void {
    if (this.isInitialized) return;

    this.setupConsoleInterception();
    this.setupPerformanceLogging();
    this.setupErrorHandling();

    this.isInitialized = true;
    console.log('[ConsoleEnhancer] Console enhancement initialized');
  }

  /**
   * Set up console method interception
   */
  private setupConsoleInterception(): void {
    const methods = ['log', 'info', 'warn', 'error', 'debug'];

    methods.forEach(method => {
      this.originalConsole[method] = (console as any)[method];
      (console as any)[method] = (...args: any[]) => {
        this.interceptLog(method as LogEntry['level'], args);
        this.originalConsole[method](...args);
      };
    });
  }

  /**
   * Intercept and enhance log messages
   */
  private interceptLog(level: LogEntry['level'], args: any[]): void {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');

    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      message,
      data: args.length > 1 ? args : undefined,
      context: {
        correlationId: this.correlationId,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    // Add performance metrics for performance-related logs
    if (message.includes('performance') || message.includes('render') || message.includes('memory')) {
      logEntry.performanceMetrics = this.getPerformanceMetrics();
      this.metrics.performanceLogs++;
    }

    // Add stack trace for errors
    if (level === 'error' && args[0] instanceof Error) {
      logEntry.stack = args[0].stack;
    }

    this.logs.push(logEntry);
    this.updateMetrics(logEntry);

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    // Enhanced console output with grouping
    this.enhancedConsoleOutput(logEntry);
  }

  /**
   * Set up performance logging
   */
  private setupPerformanceLogging(): void {
    // Log performance marks and measures
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure') {
          console.log(`[Performance] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ['measure', 'mark'] });

    // Log long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);
      }
    });

    longTaskObserver.observe({ entryTypes: ['longtask'] });
  }

  /**
   * Set up global error handling
   */
  private setupErrorHandling(): void {
    window.addEventListener('error', (event) => {
      console.error('[Global Error]', event.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('[Unhandled Promise Rejection]', event.reason, {
        stack: event.reason?.stack,
      });
    });
  }

  /**
   * Get current performance metrics
   */
  private getPerformanceMetrics() {
    const metrics: LogEntry['performanceMetrics'] = {};

    if ('memory' in performance) {
      metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.renderTime = navigation.loadEventEnd - navigation.fetchStart;
    }

    // Count network requests
    const resources = performance.getEntriesByType('resource');
    metrics.networkRequests = resources.length;

    return metrics;
  }

  /**
   * Enhanced console output with grouping and styling
   */
  private enhancedConsoleOutput(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    // Use console.group for structured output
    console.group(`${prefix} ${entry.message.substring(0, 50)}${entry.message.length > 50 ? '...' : ''}`);

    if (entry.context) {
      console.log('Context:', entry.context);
    }

    if (entry.performanceMetrics) {
      console.log('Performance:', entry.performanceMetrics);
    }

    if (entry.data && entry.data.length > 1) {
      console.log('Data:', ...entry.data.slice(1));
    }

    if (entry.stack) {
      console.log('Stack:', entry.stack);
    }

    console.groupEnd();
  }

  /**
   * Update console metrics
   */
  private updateMetrics(entry: LogEntry): void {
    this.metrics.totalLogs++;

    switch (entry.level) {
      case 'error':
        this.metrics.errorCount++;
        break;
      case 'warn':
        this.metrics.warningCount++;
        break;
    }
  }

  /**
   * Generate unique log ID
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate correlation ID for session
   */
  private generateCorrelationId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current console metrics
   */
  public getMetrics(): ConsoleMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent logs
   */
  public getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Search logs by message content
   */
  public searchLogs(query: string): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log =>
      log.message.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(log.data).toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Create performance mark
   */
  public mark(name: string): void {
    performance.mark(name);
    console.log(`[Performance] Mark created: ${name}`);
  }

  /**
   * Measure performance between marks
   */
  public measure(name: string, startMark: string, endMark: string): void {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
    } catch (error) {
      console.warn(`[Performance] Failed to measure ${name}:`, error);
    }
  }

  /**
   * Clear all performance marks and measures
   */
  public clearPerformanceMarks(): void {
    performance.clearMarks();
    performance.clearMeasures();
    console.log('[Performance] All marks and measures cleared');
  }

  /**
   * Export logs for debugging
   */
  public exportLogs(): string {
    return JSON.stringify({
      correlationId: this.correlationId,
      timestamp: Date.now(),
      logs: this.logs,
      metrics: this.metrics,
    }, null, 2);
  }

  /**
   * Clear logs and reset metrics
   */
  public clearLogs(): void {
    this.logs = [];
    this.metrics = {
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      performanceLogs: 0,
    };
  }

  /**
   * Destroy enhancer and restore original console
   */
  public destroy(): void {
    // Restore original console methods
    Object.keys(this.originalConsole).forEach(method => {
      console[method as keyof Console] = this.originalConsole[method];
    });

    this.clearLogs();
    this.isInitialized = false;
  }
}

export { ConsoleEnhancer };
