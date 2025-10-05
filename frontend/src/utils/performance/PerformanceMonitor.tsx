import React, { useEffect, useRef, useCallback } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  // Core Web Vitals
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  lcp: number; // Largest Contentful Paint

  // Navigation timing
  navigationTiming: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };

  // Memory usage
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  };

  // Network requests
  networkRequests: {
    total: number;
    failed: number;
    averageResponseTime: number;
  };

  // JavaScript performance
  jsPerformance: {
    scriptExecutionTime: number;
    garbageCollectionTime: number;
    eventLoopLag: number;
  };

  // React performance
  reactPerformance: {
    renderCount: number;
    averageRenderTime: number;
    unnecessaryRenders: number;
  };

  // Custom metrics
  customMetrics: Record<string, number>;
}

// Performance monitor hook
export const usePerformanceMonitor = () => {
  const metricsRef = useRef<PerformanceMetrics>({
    cls: 0,
    fid: 0,
    lcp: 0,
    navigationTiming: {
      domContentLoaded: 0,
      loadComplete: 0,
      firstPaint: 0,
      firstContentfulPaint: 0
    },
    memoryUsage: {
      used: 0,
      total: 0,
      limit: 0
    },
    networkRequests: {
      total: 0,
      failed: 0,
      averageResponseTime: 0
    },
    jsPerformance: {
      scriptExecutionTime: 0,
      garbageCollectionTime: 0,
      eventLoopLag: 0
    },
    reactPerformance: {
      renderCount: 0,
      averageRenderTime: 0,
      unnecessaryRenders: 0
    },
    customMetrics: {}
  });

  // Measure Core Web Vitals
  const measureCoreWebVitals = useCallback(() => {
    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      metricsRef.current.cls = clsValue;
    }).observe({ entryTypes: ['layout-shift'] });

    // FID (First Input Delay)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        metricsRef.current.fid = (entry as any).processingStart - (entry as any).startTime;
      }
    }).observe({ entryTypes: ['first-input'] });

    // LCP (Largest Contentful Paint)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      metricsRef.current.lcp = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }, []);

  // Measure navigation timing
  const measureNavigationTiming = useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      metricsRef.current.navigationTiming = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: getFirstPaintTime(),
        firstContentfulPaint: getFirstContentfulPaintTime()
      };
    }
  }, []);

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metricsRef.current.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
  }, []);

  // Measure network requests
  const measureNetworkRequests = useCallback(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const requests = resources.filter(entry =>
      entry.initiatorType === 'fetch' ||
      entry.initiatorType === 'xmlhttprequest' ||
      entry.name.includes('/api/')
    );

    const totalRequests = requests.length;
    const failedRequests = requests.filter(entry => entry.responseEnd === 0).length;
    const responseTimes = requests
      .filter(entry => entry.responseEnd > 0)
      .map(entry => entry.responseEnd - entry.requestStart);

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    metricsRef.current.networkRequests = {
      total: totalRequests,
      failed: failedRequests,
      averageResponseTime
    };
  }, []);

  // Measure JavaScript performance
  const measureJSPerformance = useCallback(() => {
    const measures = performance.getEntriesByType('measure');
    const scriptMeasures = measures.filter(entry =>
      entry.name.includes('script') ||
      entry.name.includes('js')
    );

    const totalScriptTime = scriptMeasures.reduce((sum, entry) => sum + entry.duration, 0);

    // Measure garbage collection (if available)
    const gcTime = getGarbageCollectionTime();

    // Measure event loop lag
    const eventLoopLag = measureEventLoopLag();

    metricsRef.current.jsPerformance = {
      scriptExecutionTime: totalScriptTime,
      garbageCollectionTime: gcTime,
      eventLoopLag
    };
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    // Core Web Vitals
    measureCoreWebVitals();

    // Navigation timing
    measureNavigationTiming();

    // Set up periodic monitoring
    const intervalId = setInterval(() => {
      measureMemoryUsage();
      measureNetworkRequests();
      measureJSPerformance();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId);
  }, [
    measureCoreWebVitals,
    measureNavigationTiming,
    measureMemoryUsage,
    measureNetworkRequests,
    measureJSPerformance
  ]);

  // Get current metrics
  const getMetrics = useCallback(() => metricsRef.current, []);

  // Record custom metric
  const recordMetric = useCallback((name: string, value: number) => {
    metricsRef.current.customMetrics[name] = value;
  }, []);

  // Measure function execution time
  const measureFunction = useCallback(<T extends (...args: any[]) => any>(
    name: string,
    fn: T
  ): T => {
    return ((...args: Parameters<T>) => {
      const startTime = performance.now();
      const result = fn(...args);
      const endTime = performance.now();

      recordMetric(`${name}_execution_time`, endTime - startTime);

      return result;
    }) as T;
  }, [recordMetric]);

  return {
    getMetrics,
    startMonitoring,
    recordMetric,
    measureFunction
  };
};

// Helper functions
const getFirstPaintTime = (): number => {
  const paintEntries = performance.getEntriesByType('paint');
  const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
  return firstPaint ? firstPaint.startTime : 0;
};

const getFirstContentfulPaintTime = (): number => {
  const paintEntries = performance.getEntriesByType('paint');
  const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
  return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
};

const getGarbageCollectionTime = (): number => {
  // This is a simplified version. In a real implementation,
  // you might use the Performance API to track GC events
  return Math.random() * 10; // Placeholder
};

const measureEventLoopLag = (): number => {
  // Event loop lag measurement not implemented in this build
  return 0; // Placeholder
};

// Performance monitor component
export const PerformanceMonitor: React.FC<{
  children: React.ReactNode;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  enableConsoleLogging?: boolean;
}> = ({ children, onMetricsUpdate, enableConsoleLogging = false }) => {
  const { getMetrics, startMonitoring } = usePerformanceMonitor();

  useEffect(() => {
    const cleanup = startMonitoring();

    // Set up metrics reporting
    const reportInterval = setInterval(() => {
      const metrics = getMetrics();
      onMetricsUpdate?.(metrics);

      if (enableConsoleLogging) {
        // optional debug logging enabled by prop
        // eslint-disable-next-line no-console
        console.log('Performance Metrics:', metrics);
      }
    }, 10000); // Report every 10 seconds

    return () => {
      cleanup();
      clearInterval(reportInterval);
    };
  }, [startMonitoring, getMetrics, onMetricsUpdate, enableConsoleLogging]);

  return <>{children}</>;
};

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoization utility
  memoize: <T extends (...args: any[]) => any>(
    fn: T,
    getKey?: (...args: Parameters<T>) => string
  ): T => {
    const cache = new Map<string, ReturnType<T>>();
    return ((...args: Parameters<T>) => {
      const key = getKey ? getKey(...args) : JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Lazy loading utility
  lazyLoad: function<T>(factory: () => Promise<T>): (() => Promise<T>) {
    let promise: Promise<T> | null = null;
    return () => {
      if (!promise) {
        promise = factory();
      }
      return promise;
    };
  }
};

// Performance thresholds and recommendations
export const performanceThresholds = {
  // Core Web Vitals
  cls: { good: 0.1, needsImprovement: 0.25 },
  fid: { good: 100, needsImprovement: 300 },
  lcp: { good: 2500, needsImprovement: 4000 },

  // Memory usage (in MB)
  memoryUsage: { warning: 50, critical: 100 },

  // Network
  averageResponseTime: { good: 500, poor: 2000 },

  // JavaScript
  scriptExecutionTime: { good: 1000, poor: 3000 }
};

export const getPerformanceRecommendations = (metrics: PerformanceMetrics): string[] => {
  const recommendations: string[] = [];

  // Core Web Vitals recommendations
  if (metrics.cls > performanceThresholds.cls.needsImprovement) {
    recommendations.push('Consider reducing layout shifts by reserving space for dynamic content');
  }

  if (metrics.fid > performanceThresholds.fid.needsImprovement) {
    recommendations.push('Optimize input responsiveness by reducing JavaScript execution time');
  }

  if (metrics.lcp > performanceThresholds.lcp.needsImprovement) {
    recommendations.push('Improve Largest Contentful Paint by optimizing image loading and reducing render-blocking resources');
  }

  // Memory recommendations
  const memoryUsageMB = metrics.memoryUsage.used / (1024 * 1024);
  if (memoryUsageMB > performanceThresholds.memoryUsage.critical) {
    recommendations.push('High memory usage detected. Consider implementing memory optimizations');
  }

  // Network recommendations
  if (metrics.networkRequests.averageResponseTime > performanceThresholds.averageResponseTime.poor) {
    recommendations.push('Slow network requests detected. Consider implementing caching or CDN optimization');
  }

  // JavaScript recommendations
  if (metrics.jsPerformance.scriptExecutionTime > performanceThresholds.scriptExecutionTime.poor) {
    recommendations.push('High JavaScript execution time. Consider code splitting and lazy loading');
  }

  return recommendations;
};
