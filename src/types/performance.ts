/**
 * Performance Types
 * TypeScript definitions for performance monitoring and metrics
 */

// Performance Metrics Interface
export interface PerformanceMetrics {
  name: string;
  value: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata: Record<string, any>;
}

// Performance Configuration
export interface PerformanceConfig {
  enabled?: boolean;
  trackCoreWebVitals?: boolean;
  trackNavigationTiming?: boolean;
  trackResourceTiming?: boolean;
  trackPaintTiming?: boolean;
  trackLongTasks?: boolean;
  sampleRate?: number;
  reportUrl?: string;
  webVitalsAttribution?: boolean;
}

// Core Web Vitals
export interface CoreWebVitals {
  cls: number;  // Cumulative Layout Shift
  fid: number;  // First Input Delay
  fcp: number;  // First Contentful Paint
  lcp: number;  // Largest Contentful Paint
  ttfb: number; // Time to First Byte
}

// Performance Report
export interface PerformanceReport {
  period: {
    start: number;
    end: number;
  };
  coreWebVitals: CoreWebVitals | null;
  metrics: {
    total: number;
    byType: Record<string, number>;
    averages: Record<string, number>;
    percentiles: Record<string, Record<string, number>>;
  };
  slowestResources: Array<{
    name: string;
    duration: number;
    type: string;
  }>;
  longTasks: PerformanceMetrics[];
  generatedAt: number;
}

// Web Vitals Metric
export interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  attribution?: {
    element?: string;
    largestShiftTarget?: string;
    largestShiftValue?: number;
    largestShiftTime?: number;
    loadState?: string;
  };
}

// Navigation Timing
export interface NavigationTiming {
  dns: number;
  tcp: number;
  tls: number;
  request: number;
  response: number;
  dom: number;
  load: number;
  total: number;
}

// Resource Timing
export interface ResourceTiming {
  name: string;
  duration: number;
  type: string;
  size: number;
  cached: boolean;
  startTime: number;
  responseEnd: number;
}

// Performance Budget
export interface PerformanceBudget {
  metric: string;
  threshold: number;
  operator: 'lessThan' | 'greaterThan';
  enabled: boolean;
}

// Performance Alert
export interface PerformanceAlert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

// Performance Dashboard Data
export interface PerformanceDashboardData {
  current: {
    coreWebVitals: CoreWebVitals | null;
    navigationTiming: NavigationTiming | null;
    resourceCount: number;
    longTaskCount: number;
  };
  trends: {
    coreWebVitals: Array<{
      timestamp: number;
      metrics: CoreWebVitals;
    }>;
    responseTimes: Array<{
      timestamp: number;
      value: number;
      endpoint: string;
    }>;
  };
  alerts: PerformanceAlert[];
  budgets: PerformanceBudget[];
}

// Performance Test Result
export interface PerformanceTestResult {
  testName: string;
  timestamp: number;
  results: {
    loadTime: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    totalBlockingTime: number;
  };
  lighthouse?: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    pwa: number;
  };
}

// Bundle Analysis
export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    gzippedSize: number;
  }>;
  assets: Array<{
    name: string;
    size: number;
    type: string;
  }>;
  timestamp: number;
}

// Performance Recommendations
export interface PerformanceRecommendation {
  id: string;
  category: 'bundle' | 'rendering' | 'network' | 'runtime' | 'accessibility';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: number; // Estimated improvement in milliseconds or percentage
  effort: 'low' | 'medium' | 'high';
  implementation: string[];
  resources: string[];
}

// Performance Monitoring Status
export interface PerformanceMonitoringStatus {
  coreWebVitals: boolean;
  navigationTiming: boolean;
  resourceTiming: boolean;
  paintTiming: boolean;
  longTasks: boolean;
  vercelSpeedInsights: boolean;
  customReporting: boolean;
  lastReportGenerated: number;
}

// Export all types
export type {
  PerformanceMetrics,
  PerformanceConfig,
  CoreWebVitals,
  PerformanceReport,
  WebVitalsMetric,
  NavigationTiming,
  ResourceTiming,
  PerformanceBudget,
  PerformanceAlert,
  PerformanceDashboardData,
  PerformanceTestResult,
  BundleAnalysis,
  PerformanceRecommendation,
  PerformanceMonitoringStatus
};
