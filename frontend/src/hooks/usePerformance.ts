import { useEffect, useCallback, useRef } from 'react';

// Web Vitals types
interface WebVitalsMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
}

type WebVitalsCallback = (metric: WebVitalsMetric) => void;

// Performance observer types
interface PerformanceEntryWithNavigation extends PerformanceEntry {
  type?: string;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
  responseStart?: number;
  requestStart?: number;
  domContentLoadedEventEnd?: number;
  domContentLoadedEventStart?: number;
  loadEventEnd?: number;
  loadEventStart?: number;
  domInteractive?: number;
  fetchStart?: number;
}

interface PerformanceMetrics {
  // Core Web Vitals
  cls: number | null;
  fid: number | null;
  lcp: number | null;
  fcp: number | null;
  ttfb: number | null;

  // Additional metrics
  domContentLoaded: number | null;
  loadComplete: number | null;
  firstByte: number | null;
  domInteractive: number | null;

  // Resource metrics
  totalResources: number;
  totalResourceSize: number;
  cacheHitRatio: number;
}

/**
 * Hook for monitoring Core Web Vitals and performance metrics
 */
export function usePerformanceMonitoring(enabled = true) {
  const reportWebVitals = useCallback((_callback: WebVitalsCallback) => {
    if (!enabled || typeof window === 'undefined') return;

    // Web Vitals library not available - skip for now

  }, [enabled]);

  const getPerformanceMetrics = useCallback((): PerformanceMetrics => {
    if (typeof window === 'undefined' || !window.performance) {
      return {
        cls: null,
        fid: null,
        lcp: null,
        fcp: null,
        ttfb: null,
        domContentLoaded: null,
        loadComplete: null,
        firstByte: null,
        domInteractive: null,
        totalResources: 0,
        totalResourceSize: 0,
        cacheHitRatio: 0,
      };
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceEntryWithNavigation;
    const resources = performance.getEntriesByType('resource') as PerformanceEntryWithNavigation[];

    // Calculate resource metrics
    const totalResources = resources.length;
    const cachedResources = resources.filter(r => (r.transferSize || 0) === 0).length;
    const cacheHitRatio = totalResources > 0 ? cachedResources / totalResources : 0;

    const totalResourceSize = resources.reduce((total, resource) => {
      return total + (resource.transferSize || resource.encodedBodySize || 0);
    }, 0);

    return {
      // Core Web Vitals (will be populated by web-vitals callbacks)
      cls: null,
      fid: null,
      lcp: null,
      fcp: null,
      ttfb: navigation && navigation.responseStart && navigation.requestStart
        ? navigation.responseStart - navigation.requestStart
        : null,

      // Navigation timing
      domContentLoaded: navigation && navigation.domContentLoadedEventEnd && navigation.domContentLoadedEventStart
        ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
        : null,
      loadComplete: navigation && navigation.loadEventEnd && navigation.loadEventStart
        ? navigation.loadEventEnd - navigation.loadEventStart
        : null,
      firstByte: navigation && navigation.responseStart && navigation.requestStart
        ? navigation.responseStart - navigation.requestStart
        : null,
      domInteractive: navigation && navigation.domInteractive && navigation.fetchStart
        ? navigation.domInteractive - navigation.fetchStart
        : null,

      // Resource metrics
      totalResources,
      totalResourceSize,
      cacheHitRatio,
    };
  }, []);

  const logPerformanceMetrics = useCallback((metrics: Partial<PerformanceMetrics>) => {
    if (!enabled) return;

    console.group('🚀 Performance Metrics');

    // Core Web Vitals
    if (metrics.cls !== null && metrics.cls !== undefined) {
    }
    if (metrics.fid !== null && metrics.fid !== undefined) {
    }
    if (metrics.lcp !== null && metrics.lcp !== undefined) {
    }
    if (metrics.fcp !== null && metrics.fcp !== undefined) {
    }
    if (metrics.ttfb !== null && metrics.ttfb !== undefined) {
    }

    // Additional metrics
    if (metrics.domContentLoaded !== null && metrics.domContentLoaded !== undefined) {
    }
    if (metrics.loadComplete !== null && metrics.loadComplete !== undefined) {
    }

    // Resource metrics
    if (metrics.totalResources !== undefined) {

    }
    if (metrics.totalResourceSize !== undefined) {
    }
    if (metrics.cacheHitRatio !== undefined) {
    }

    console.groupEnd();
  }, [enabled]);

  // Auto-log metrics on mount
  useEffect(() => {
    if (!enabled) return;

    const metrics = getPerformanceMetrics();
    logPerformanceMetrics(metrics);

    // Set up web vitals reporting
    reportWebVitals((metric) => {
      const value = metric.name === 'CLS' ? metric.value : metric.value;
      logPerformanceMetrics({ [metric.name.toLowerCase()]: value });
    });
  }, [enabled, getPerformanceMetrics, logPerformanceMetrics, reportWebVitals]);

  return {
    reportWebVitals,
    getPerformanceMetrics,
    logPerformanceMetrics,
  };
}

/**
 * Hook for monitoring React component performance
 */
export function useComponentPerformance(componentName: string, enabled = true) {
  const renderStartTime = useRef<number>();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    renderStartTime.current = performance.now();

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
      }
    };
  });

  const markRenderComplete = useCallback(() => {
    if (!enabled || !renderStartTime.current) return;

    const renderTime = performance.now() - renderStartTime.current;
  }, [componentName, enabled]);

  return { markRenderComplete };
}

/**
 * Hook for monitoring API call performance
 */
export function useApiPerformance(enabled = true) {
  const trackApiCall = useCallback((endpoint: string, method: string, startTime: number, endTime: number, success: boolean) => {
    if (!enabled) return;

    const duration = endTime - startTime;
    const status = success ? '✅' : '❌';


    // Track slow API calls
    if (duration > 1000) {
      console.warn(`🐌 Slow API call detected: ${method} ${endpoint} took ${duration.toFixed(2)}ms`);
    }
  }, [enabled]);

  return { trackApiCall };
}

export default usePerformanceMonitoring;


