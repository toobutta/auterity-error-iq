/**
 * Web Vitals Integration for Chrome DevTools
 * Provides real-time Web Vitals monitoring and integration with DevTools Performance tab
 */

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender';
}

export interface WebVitalsConfig {
  reportAllChanges?: boolean;
  reportCallback?: (metric: WebVitalsMetric) => void;
}

class WebVitalsMonitor {
  private observers: PerformanceObserver[] = [];
  private config: WebVitalsConfig;

  constructor(config: WebVitalsConfig = {}) {
    this.config = {
      reportAllChanges: false,
      ...config,
    };
  }

  /**
   * Initialize Web Vitals monitoring
   */
  public async init(callback?: (metric: WebVitalsMetric) => void): Promise<void> {
    const reportCallback = callback || this.config.reportCallback;

    if (!reportCallback) {

      return;
    }

    try {
      // CLS (Cumulative Layout Shift)
      this.observeCLS(reportCallback);

      // FID (First Input Delay)
      this.observeFID(reportCallback);

      // FCP (First Contentful Paint)
      this.observeFCP(reportCallback);

      // LCP (Largest Contentful Paint)
      this.observeLCP(reportCallback);

      // TTFB (Time to First Byte)
      this.observeTTFB(reportCallback);

    } catch (error) {

    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   */
  private observeCLS(callback: (metric: WebVitalsMetric) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            const metric: WebVitalsMetric = {
              name: 'CLS',
              value: (entry as any).value,
              rating: this.getRating('CLS', (entry as any).value),
              delta: (entry as any).value,
              entries: [entry],
              id: 'cls',
              navigationType: 'navigate',
            };
            callback(metric);
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (error) {

    }
  }

  /**
   * Observe First Input Delay (FID)
   */
  private observeFID(callback: (metric: WebVitalsMetric) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const metric: WebVitalsMetric = {
            name: 'FID',
            value: (entry as any).processingStart - entry.startTime,
            rating: this.getRating('FID', (entry as any).processingStart - entry.startTime),
            delta: (entry as any).processingStart - entry.startTime,
            entries: [entry],
            id: 'fid',
            navigationType: 'navigate',
          };
          callback(metric);
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.push(observer);
    } catch (error) {

    }
  }

  /**
   * Observe First Contentful Paint (FCP)
   */
  private observeFCP(callback: (metric: WebVitalsMetric) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const metric: WebVitalsMetric = {
            name: 'FCP',
            value: entry.startTime,
            rating: this.getRating('FCP', entry.startTime),
            delta: entry.startTime,
            entries: [entry],
            id: 'fcp',
            navigationType: 'navigate',
          };
          callback(metric);
        }
      });

      observer.observe({ type: 'paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {

    }
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   */
  private observeLCP(callback: (metric: WebVitalsMetric) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        if (lastEntry) {
          const metric: WebVitalsMetric = {
            name: 'LCP',
            value: lastEntry.startTime,
            rating: this.getRating('LCP', lastEntry.startTime),
            delta: lastEntry.startTime,
            entries: [lastEntry],
            id: 'lcp',
            navigationType: 'navigate',
          };
          callback(metric);
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(observer);
    } catch (error) {

    }
  }

  /**
   * Observe Time to First Byte (TTFB)
   */
  private observeTTFB(callback: (metric: WebVitalsMetric) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const metric: WebVitalsMetric = {
            name: 'TTFB',
            value: (entry as any).responseStart,
            rating: this.getRating('TTFB', (entry as any).responseStart),
            delta: (entry as any).responseStart,
            entries: [entry],
            id: 'ttfb',
            navigationType: 'navigate',
          };
          callback(metric);
        }
      });

      observer.observe({ type: 'navigation', buffered: true });
      this.observers.push(observer);
    } catch (error) {

    }
  }

  /**
   * Get performance rating for a metric
   */
  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get current Web Vitals values
   */
  public getCurrentVitals(): Partial<WebVitalsMetric>[] {
    const vitals: Partial<WebVitalsMetric>[] = [];

    // Get navigation timing for TTFB
    if (performance.timing) {
      const navigation = performance.timing;
      const ttfb = navigation.responseStart - navigation.requestStart;
      if (ttfb > 0) {
        vitals.push({
          name: 'TTFB',
          value: ttfb,
          rating: this.getRating('TTFB', ttfb),
        });
      }
    }

    // Get paint timing for FCP and LCP
    if (performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          vitals.push({
            name: 'FCP',
            value: entry.startTime,
            rating: this.getRating('FCP', entry.startTime),
          });
        }
      });

      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        const lastLCP = lcpEntries[lcpEntries.length - 1];
        vitals.push({
          name: 'LCP',
          value: lastLCP.startTime,
          rating: this.getRating('LCP', lastLCP.startTime),
        });
      }
    }

    return vitals;
  }

  /**
   * Export Web Vitals data for analysis
   */
  public exportVitals(): string {
    const currentVitals = this.getCurrentVitals();
    const exportData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      vitals: currentVitals,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clean up observers
   */
  public destroy(): void {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];

  }
}

// Global instance
let webVitalsInstance: WebVitalsMonitor | null = null;

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(callback?: (metric: WebVitalsMetric) => void): WebVitalsMonitor {
  if (!webVitalsInstance) {
    webVitalsInstance = new WebVitalsMonitor();
  }

  if (callback) {
    webVitalsInstance.init(callback);
  }

  return webVitalsInstance;
}

/**
 * Get current Web Vitals monitor instance
 */
export function getWebVitals(): WebVitalsMonitor | null {
  return webVitalsInstance;
}

/**
 * Get current Web Vitals values
 */
export function getCurrentWebVitals(): Partial<WebVitalsMetric>[] {
  if (!webVitalsInstance) {
    webVitalsInstance = new WebVitalsMonitor();
  }
  return webVitalsInstance.getCurrentVitals();
}

export { WebVitalsMonitor };
export default WebVitalsMonitor;


