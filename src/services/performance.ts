/**
 * Performance Monitoring Service
 * Core Web Vitals and performance tracking with Vercel Speed Insights
 */

import { PerformanceMetrics, PerformanceConfig, CoreWebVitals, PerformanceReport } from '../types/performance';

class PerformanceService {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isInitialized = false;

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      trackCoreWebVitals: config.trackCoreWebVitals ?? true,
      trackNavigationTiming: config.trackNavigationTiming ?? true,
      trackResourceTiming: config.trackResourceTiming ?? true,
      trackPaintTiming: config.trackPaintTiming ?? true,
      trackLongTasks: config.trackLongTasks ?? true,
      sampleRate: config.sampleRate ?? 1.0,
      reportUrl: config.reportUrl,
      ...config
    };

    this.initialize();
  }

  // Initialize performance monitoring
  private initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Set up Core Web Vitals tracking
      if (this.config.trackCoreWebVitals) {
        this.setupCoreWebVitals();
      }

      // Set up navigation timing
      if (this.config.trackNavigationTiming) {
        this.setupNavigationTiming();
      }

      // Set up resource timing
      if (this.config.trackResourceTiming) {
        this.setupResourceTiming();
      }

      // Set up paint timing
      if (this.config.trackPaintTiming) {
        this.setupPaintTiming();
      }

      // Set up long task monitoring
      if (this.config.trackLongTasks) {
        this.setupLongTaskMonitoring();
      }

      // Set up Vercel Speed Insights if available
      this.setupVercelSpeedInsights();

      this.isInitialized = true;
      console.log('Performance monitoring initialized');
    } catch (error) {
      console.warn('Failed to initialize performance monitoring:', error);
    }
  }

  // Set up Core Web Vitals tracking
  private setupCoreWebVitals(): void {
    // Check if web-vitals is available
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => this.recordMetric('CLS', metric.value, metric));
        getFID((metric) => this.recordMetric('FID', metric.value, metric));
        getFCP((metric) => this.recordMetric('FCP', metric.value, metric));
        getLCP((metric) => this.recordMetric('LCP', metric.value, metric));
        getTTFB((metric) => this.recordMetric('TTFB', metric.value, metric));
      });
    } else {
      // Fallback implementation
      this.setupFallbackCoreWebVitals();
    }
  }

  // Fallback Core Web Vitals implementation
  private setupFallbackCoreWebVitals(): void {
    // FCP (First Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric('FCP', entry.startTime, { entryType: entry.entryType });
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('fcp', fcpObserver);
      } catch (error) {
        console.warn('Failed to set up FCP observer:', error);
      }
    }
  }

  // Set up navigation timing
  private setupNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const timing = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            tls: navigation.secureConnectionStart ? navigation.connectEnd - navigation.secureConnectionStart : 0,
            request: navigation.requestStart - navigation.connectEnd,
            response: navigation.responseEnd - navigation.requestStart,
            dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            load: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
            total: navigation.loadEventEnd - navigation.fetchStart
          };

          this.recordMetric('navigation_timing', timing.total, timing);
        }
      }, 0);
    });
  }

  // Set up resource timing
  private setupResourceTiming(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const resource = entry as PerformanceResourceTiming;
          this.recordMetric('resource_timing', resource.responseEnd - resource.fetchStart, {
            name: resource.name,
            type: resource.initiatorType,
            size: resource.transferSize,
            cached: resource.transferSize === 0
          });
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      console.warn('Failed to set up resource timing observer:', error);
    }
  }

  // Set up paint timing
  private setupPaintTiming(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric(`${entry.name}_paint`, entry.startTime, {
            entryType: entry.entryType
          });
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', paintObserver);
    } catch (error) {
      console.warn('Failed to set up paint timing observer:', error);
    }
  }

  // Set up long task monitoring
  private setupLongTaskMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('long_task', entry.duration, {
            startTime: entry.startTime,
            entryType: entry.entryType
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', longTaskObserver);
    } catch (error) {
      console.warn('Failed to set up long task observer:', error);
    }
  }

  // Set up Vercel Speed Insights
  private setupVercelSpeedInsights(): void {
    // Check if Vercel Speed Insights is available
    if (typeof window !== 'undefined' && (window as any).speedInsights) {
      console.log('Performance: Vercel Speed Insights detected');
    }
  }

  // Record performance metric
  recordMetric(name: string, value: number, metadata: Record<string, any> = {}): void {
    if (!this.config.enabled || !this.shouldRecord()) return;

    const metric: PerformanceMetrics = {
      name,
      value,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      metadata: {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        ...metadata
      }
    };

    this.metrics.push(metric);

    // Send to Vercel Speed Insights if available
    if (typeof window !== 'undefined' && (window as any).speedInsights) {
      try {
        (window as any).speedInsights.track(name, value, metadata);
      } catch (error) {
        console.warn('Performance: Failed to send to Vercel Speed Insights', error);
      }
    }

    // Send to custom backend if configured
    if (this.config.reportUrl) {
      this.reportMetric(metric);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric);
    }
  }

  // Get current Core Web Vitals
  getCoreWebVitals(): CoreWebVitals | null {
    const metrics = this.metrics.filter(m =>
      ['CLS', 'FID', 'FCP', 'LCP', 'TTFB'].includes(m.name)
    );

    if (metrics.length === 0) return null;

    const vitals: Partial<CoreWebVitals> = {};
    metrics.forEach(metric => {
      switch (metric.name) {
        case 'CLS':
          vitals.cls = metric.value;
          break;
        case 'FID':
          vitals.fid = metric.value;
          break;
        case 'FCP':
          vitals.fcp = metric.value;
          break;
        case 'LCP':
          vitals.lcp = metric.value;
          break;
        case 'TTFB':
          vitals.ttfb = metric.value;
          break;
      }
    });

    return vitals as CoreWebVitals;
  }

  // Generate performance report
  generateReport(timeRange: number = 24 * 60 * 60 * 1000): PerformanceReport {
    const now = Date.now();
    const startTime = now - timeRange;

    const recentMetrics = this.metrics.filter(m => m.timestamp >= startTime);

    return {
      period: { start: startTime, end: now },
      coreWebVitals: this.getCoreWebVitals(),
      metrics: {
        total: recentMetrics.length,
        byType: this.groupMetricsByType(recentMetrics),
        averages: this.calculateAverages(recentMetrics),
        percentiles: this.calculatePercentiles(recentMetrics)
      },
      slowestResources: this.getSlowestResources(recentMetrics),
      longTasks: this.getLongTasks(recentMetrics),
      generatedAt: now
    };
  }

  // Group metrics by type
  private groupMetricsByType(metrics: PerformanceMetrics[]): Record<string, number> {
    const groups: Record<string, number> = {};
    metrics.forEach(metric => {
      groups[metric.name] = (groups[metric.name] || 0) + 1;
    });
    return groups;
  }

  // Calculate averages
  private calculateAverages(metrics: PerformanceMetrics[]): Record<string, number> {
    const sums: Record<string, { sum: number; count: number }> = {};
    metrics.forEach(metric => {
      if (!sums[metric.name]) {
        sums[metric.name] = { sum: 0, count: 0 };
      }
      sums[metric.name].sum += metric.value;
      sums[metric.name].count += 1;
    });

    const averages: Record<string, number> = {};
    Object.entries(sums).forEach(([name, { sum, count }]) => {
      averages[name] = sum / count;
    });
    return averages;
  }

  // Calculate percentiles
  private calculatePercentiles(metrics: PerformanceMetrics[]): Record<string, Record<string, number>> {
    const percentiles: Record<string, Record<string, number>> = {};

    const metricGroups = this.groupBy(metrics, 'name');
    Object.entries(metricGroups).forEach(([name, group]) => {
      const values = group.map(m => m.value).sort((a, b) => a - b);
      percentiles[name] = {
        p50: this.getPercentile(values, 50),
        p75: this.getPercentile(values, 75),
        p90: this.getPercentile(values, 90),
        p95: this.getPercentile(values, 95),
        p99: this.getPercentile(values, 99)
      };
    });

    return percentiles;
  }

  // Get slowest resources
  private getSlowestResources(metrics: PerformanceMetrics[]): Array<{ name: string; duration: number; type: string }> {
    return metrics
      .filter(m => m.name === 'resource_timing' && m.metadata.name)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map(m => ({
        name: m.metadata.name,
        duration: m.value,
        type: m.metadata.type || 'unknown'
      }));
  }

  // Get long tasks
  private getLongTasks(metrics: PerformanceMetrics[]): PerformanceMetrics[] {
    return metrics
      .filter(m => m.name === 'long_task')
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  // Utility functions
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  private getPercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedValues.length) return sortedValues[sortedValues.length - 1];
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  private shouldRecord(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private getSessionId(): string {
    // This would typically come from a session management service
    return 'session_' + Date.now();
  }

  private getUserId(): string | undefined {
    // This would typically come from an auth service
    return undefined;
  }

  // Report metric to backend
  private async reportMetric(metric: PerformanceMetrics): Promise<void> {
    if (!this.config.reportUrl) return;

    try {
      await fetch(this.config.reportUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric)
      });
    } catch (error) {
      console.warn('Performance: Failed to report metric', error);
    }
  }

  // Cleanup observers
  destroy(): void {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();

// Export class for custom instances
export { PerformanceService };
export default performanceService;
