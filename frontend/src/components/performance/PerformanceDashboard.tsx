import React, { useState, useEffect } from 'react';
import { cn } from '../../design-system/utils/cn';
import { COLORS } from '../../design-system/tokens/colors';
import { Button } from '../../design-system/components/Button';
import { Card } from '../../design-system/components/ui/card';
import { ProgressIndicator } from '../../design-system/components/Feedback';
import {
  usePerformanceMonitor,
  PerformanceMetrics,
  performanceThresholds,
  getPerformanceRecommendations
} from '../../utils/performance/PerformanceMonitor';

// Performance dashboard props
export interface PerformanceDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showRecommendations?: boolean;
}

// Performance metric card component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  status?: 'good' | 'warning' | 'poor';
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}> = ({
  title,
  value,
  unit = '',
  status = 'good',
  description,
  trend,
  className = ''
}) => {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200'
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    stable: '→'
  };

  return (
    <Card className={cn('p-4', statusColors[status], className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <span className="text-2xl font-semibold">{value}</span>
            {unit && <span className="ml-1 text-sm">{unit}</span>}
            {trend && (
              <span className="ml-2 text-lg" title={`Trend: ${trend}`}>
                {trendIcons[trend]}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-gray-600">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

// Core Web Vitals section
const CoreWebVitals: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => {
  const getCLSStatus = (cls: number) => {
    if (cls <= performanceThresholds.cls.good) return 'good';
    if (cls <= performanceThresholds.cls.needsImprovement) return 'warning';
    return 'poor';
  };

  const getFIDStatus = (fid: number) => {
    if (fid <= performanceThresholds.fid.good) return 'good';
    if (fid <= performanceThresholds.fid.needsImprovement) return 'warning';
    return 'poor';
  };

  const getLCPStatus = (lcp: number) => {
    if (lcp <= performanceThresholds.lcp.good) return 'good';
    if (lcp <= performanceThresholds.lcp.needsImprovement) return 'warning';
    return 'poor';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Core Web Vitals</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Cumulative Layout Shift"
          value={metrics.cls.toFixed(3)}
          status={getCLSStatus(metrics.cls)}
          description="Measures visual stability"
        />
        <MetricCard
          title="First Input Delay"
          value={`${Math.round(metrics.fid)}ms`}
          status={getFIDStatus(metrics.fid)}
          description="Measures input responsiveness"
        />
        <MetricCard
          title="Largest Contentful Paint"
          value={`${Math.round(metrics.lcp)}ms`}
          status={getLCPStatus(metrics.lcp)}
          description="Measures loading performance"
        />
      </div>
    </div>
  );
};

// Navigation timing section
const NavigationTiming: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-gray-900">Navigation Timing</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MetricCard
        title="DOM Content Loaded"
        value={`${Math.round(metrics.navigationTiming.domContentLoaded)}ms`}
        description="Time to parse and render DOM"
      />
      <MetricCard
        title="Page Load Complete"
        value={`${Math.round(metrics.navigationTiming.loadComplete)}ms`}
        description="Total page load time"
      />
      <MetricCard
        title="First Paint"
        value={`${Math.round(metrics.navigationTiming.firstPaint)}ms`}
        description="Time to first visual change"
      />
      <MetricCard
        title="First Contentful Paint"
        value={`${Math.round(metrics.navigationTiming.firstContentfulPaint)}ms`}
        description="Time to first meaningful content"
      />
    </div>
  </div>
);

// Memory usage section
const MemoryUsage: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => {
  const usedMB = (metrics.memoryUsage.used / (1024 * 1024)).toFixed(1);
  const totalMB = (metrics.memoryUsage.total / (1024 * 1024)).toFixed(1);
  const limitMB = (metrics.memoryUsage.limit / (1024 * 1024)).toFixed(1);

  const usagePercentage = (metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100;
  const status = usagePercentage > 80 ? 'poor' : usagePercentage > 60 ? 'warning' : 'good';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Memory Usage</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Memory Usage"
          value={`${usedMB}MB / ${totalMB}MB`}
          status={status}
          description={`Limit: ${limitMB}MB`}
        />
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Memory Usage Chart</h3>
          <ProgressIndicator
            variant="linear"
            value={usagePercentage}
            max={100}
            showValue
            className="w-full"
          />
        </Card>
      </div>
    </div>
  );
};

// Network requests section
const NetworkRequests: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => {
  const avgResponseTime = Math.round(metrics.networkRequests.averageResponseTime);
  const status = avgResponseTime > 2000 ? 'poor' : avgResponseTime > 500 ? 'warning' : 'good';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Network Requests</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Requests"
          value={metrics.networkRequests.total}
          description="All network requests"
        />
        <MetricCard
          title="Failed Requests"
          value={metrics.networkRequests.failed}
          status={metrics.networkRequests.failed > 0 ? 'poor' : 'good'}
          description="Requests that failed"
        />
        <MetricCard
          title="Average Response Time"
          value={`${avgResponseTime}ms`}
          status={status}
          description="Average API response time"
        />
      </div>
    </div>
  );
};

// JavaScript performance section
const JSPerformance: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-gray-900">JavaScript Performance</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Script Execution Time"
        value={`${Math.round(metrics.jsPerformance.scriptExecutionTime)}ms`}
        description="Total JavaScript execution time"
      />
      <MetricCard
        title="Garbage Collection Time"
        value={`${Math.round(metrics.jsPerformance.garbageCollectionTime)}ms`}
        description="Time spent on garbage collection"
      />
      <MetricCard
        title="Event Loop Lag"
        value={`${Math.round(metrics.jsPerformance.eventLoopLag)}ms`}
        description="UI thread blocking time"
      />
    </div>
  </div>
);

// Recommendations section
const Recommendations: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => {
  const recommendations = getPerformanceRecommendations(metrics);

  if (recommendations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center">
            <span className="text-green-600 text-lg mr-2">✓</span>
            <span className="text-green-800">All performance metrics are within acceptable ranges!</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Performance Recommendations</h2>
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <ul className="space-y-2">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start">
              <span className="text-yellow-600 text-lg mr-2 mt-1">⚠</span>
              <span className="text-yellow-800 text-sm">{recommendation}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

// Main performance dashboard component
const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 5000,
  showRecommendations = true
}) => {
  const { getMetrics, startMonitoring } = usePerformanceMonitor();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Start monitoring
  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  // Refresh metrics
  const refreshMetrics = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setMetrics(getMetrics());
      setIsRefreshing(false);
    }, 1000);
  };

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setMetrics(getMetrics());
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, getMetrics]);

  // Initial load
  useEffect(() => {
    setMetrics(getMetrics());
  }, [getMetrics]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('performance-dashboard space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time application performance monitoring</p>
        </div>
        <Button
          onClick={refreshMetrics}
          loading={isRefreshing}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Core Web Vitals */}
      <CoreWebVitals metrics={metrics} />

      {/* Navigation Timing */}
      <NavigationTiming metrics={metrics} />

      {/* Memory Usage */}
      <MemoryUsage metrics={metrics} />

      {/* Network Requests */}
      <NetworkRequests metrics={metrics} />

      {/* JavaScript Performance */}
      <JSPerformance metrics={metrics} />

      {/* Recommendations */}
      {showRecommendations && <Recommendations metrics={metrics} />}
    </div>
  );
};

export default PerformanceDashboard;
