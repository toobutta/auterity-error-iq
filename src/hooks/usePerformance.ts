/**
 * Performance Hook
 * React hook for performance monitoring and metrics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceService } from '../services/performance';
import { CoreWebVitals, PerformanceReport } from '../types/performance';

export interface UsePerformanceReturn {
  coreWebVitals: CoreWebVitals | null;
  isSupported: boolean;
  report: PerformanceReport | null;
  generateReport: (timeRange?: number) => PerformanceReport;
  recordMetric: (name: string, value: number, metadata?: Record<string, any>) => void;
  getMetrics: () => any[];
  clearMetrics: () => void;
}

/**
 * Main performance hook
 * Provides access to performance metrics and monitoring
 */
export const usePerformance = (): UsePerformanceReturn => {
  const [coreWebVitals, setCoreWebVitals] = useState<CoreWebVitals | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [report, setReport] = useState<PerformanceReport | null>(null);

  // Check if performance APIs are supported
  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
                     'performance' in window &&
                     'PerformanceObserver' in window;

    setIsSupported(supported);

    if (supported) {
      // Get initial Core Web Vitals
      const vitals = performanceService.getCoreWebVitals();
      setCoreWebVitals(vitals);
    }
  }, []);

  // Generate performance report
  const generateReport = useCallback((timeRange: number = 24 * 60 * 60 * 1000): PerformanceReport => {
    const newReport = performanceService.generateReport(timeRange);
    setReport(newReport);
    return newReport;
  }, []);

  // Record custom performance metric
  const recordMetric = useCallback((name: string, value: number, metadata?: Record<string, any>) => {
    performanceService.recordMetric(name, value, metadata);
  }, []);

  // Get all recorded metrics
  const getMetrics = useCallback(() => {
    // This would typically come from the performance service
    return [];
  }, []);

  // Clear all metrics
  const clearMetrics = useCallback(() => {
    // This would typically call the performance service
  }, []);

  return {
    coreWebVitals,
    isSupported,
    report,
    generateReport,
    recordMetric,
    getMetrics,
    clearMetrics
  };
};

/**
 * Hook for tracking component performance
 * Measures render time and other component-specific metrics
 */
export const useComponentPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const { recordMetric } = usePerformance();

  // Track render time
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    recordMetric('component_render', renderTime, {
      component: componentName,
      timestamp: Date.now()
    });
  });

  return {
    recordMetric: useCallback((name: string, value: number, metadata?: Record<string, any>) => {
      recordMetric(`${componentName}_${name}`, value, metadata);
    }, [componentName, recordMetric])
  };
};

/**
 * Hook for tracking API call performance
 */
export const useAPIPerformance = () => {
  const { recordMetric } = usePerformance();

  const trackAPICall = useCallback((
    url: string,
    method: string,
    startTime: number,
    endTime: number,
    status: number,
    size?: number
  ) => {
    const duration = endTime - startTime;
    const success = status >= 200 && status < 300;

    recordMetric('api_call', duration, {
      url,
      method,
      status,
      success,
      size,
      timestamp: Date.now()
    });

    // Also track by endpoint for aggregation
    const endpoint = url.split('?')[0]; // Remove query params
    recordMetric(`api_endpoint_${endpoint}`, duration, {
      method,
      status,
      success
    });
  }, [recordMetric]);

  return {
    trackAPICall
  };
};

/**
 * Hook for tracking user interaction performance
 */
export const useInteractionPerformance = () => {
  const { recordMetric } = usePerformance();
  const interactionStartTime = useRef<number>(0);

  const startInteraction = useCallback(() => {
    interactionStartTime.current = performance.now();
  }, []);

  const endInteraction = useCallback((interactionType: string, metadata?: Record<string, any>) => {
    if (interactionStartTime.current > 0) {
      const duration = performance.now() - interactionStartTime.current;
      recordMetric('user_interaction', duration, {
        type: interactionType,
        ...metadata,
        timestamp: Date.now()
      });
      interactionStartTime.current = 0;
    }
  }, [recordMetric]);

  return {
    startInteraction,
    endInteraction
  };
};

/**
 * Hook for tracking navigation performance
 */
export const useNavigationPerformance = () => {
  const { recordMetric } = usePerformance();

  useEffect(() => {
    const handleNavigation = () => {
      // Track navigation timing when available
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

          recordMetric('navigation_timing', timing.total, timing);
        }
      }, 0);
    };

    // Listen for navigation events
    window.addEventListener('load', handleNavigation);

    return () => {
      window.removeEventListener('load', handleNavigation);
    };
  }, [recordMetric]);

  return {};
};

/**
 * Hook for tracking resource loading performance
 */
export const useResourcePerformance = () => {
  const { recordMetric } = usePerformance();

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const resource = entry as PerformanceResourceTiming;

        // Only track resources that take longer than 100ms
        if (resource.responseEnd - resource.fetchStart > 100) {
          recordMetric('resource_timing', resource.responseEnd - resource.fetchStart, {
            name: resource.name,
            type: resource.initiatorType,
            size: resource.transferSize,
            cached: resource.transferSize === 0,
            protocol: resource.nextHopProtocol
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => {
      observer.disconnect();
    };
  }, [recordMetric]);

  return {};
};

/**
 * Hook for tracking long tasks (tasks that block the main thread)
 */
export const useLongTaskPerformance = () => {
  const { recordMetric } = usePerformance();

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        recordMetric('long_task', entry.duration, {
          startTime: entry.startTime,
          entryType: entry.entryType
        });
      });
    });

    // Observe long tasks (>50ms)
    observer.observe({ entryTypes: ['longtask'] });

    return () => {
      observer.disconnect();
    };
  }, [recordMetric]);

  return {};
};

/**
 * Hook for performance budgets and alerting
 */
export const usePerformanceBudget = (budgets: Array<{
  metric: string;
  threshold: number;
  operator: 'lessThan' | 'greaterThan';
}>) => {
  const { recordMetric } = usePerformance();
  const [violations, setViolations] = useState<Array<{
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
  }>>([]);

  const checkBudget = useCallback((metric: string, value: number) => {
    const budget = budgets.find(b => b.metric === metric);
    if (!budget) return;

    const isViolation =
      (budget.operator === 'lessThan' && value > budget.threshold) ||
      (budget.operator === 'greaterThan' && value < budget.threshold);

    if (isViolation) {
      const violation = {
        metric,
        value,
        threshold: budget.threshold,
        timestamp: Date.now()
      };

      setViolations(prev => [...prev, violation]);

      // Record the budget violation
      recordMetric('budget_violation', value, {
        metric,
        threshold: budget.threshold,
        operator: budget.operator
      });
    }
  }, [budgets, recordMetric]);

  return {
    violations,
    checkBudget,
    clearViolations: useCallback(() => setViolations([]), [])
  };
};