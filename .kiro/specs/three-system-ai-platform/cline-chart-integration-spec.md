# [CLINE-TASK] Chart Integration and Visualization Components

## Task Overview

Create enhanced chart components and visualization utilities for the three-system AI platform monitoring and analytics. Focus on reusable chart components that can display metrics from AutoMatrix, RelayCore, and NeuroWeaver systems.

## Component Specifications

### 1. Enhanced Chart Components

#### Multi-System Line Chart

**File**: `frontend/src/components/charts/MultiSystemLineChart.tsx`

```typescript
interface MultiSystemLineChartProps {
  data: Array<{
    timestamp: Date;
    systems: {
      autmatrix?: number;
      relaycore?: number;
      neuroweaver?: number;
    };
  }>;
  metric: "requests" | "latency" | "errors" | "cpu" | "memory";
  timeRange: "1h" | "6h" | "24h" | "7d";
  showLegend?: boolean;
  height?: number;
  colors?: {
    autmatrix: string;
    relaycore: string;
    neuroweaver: string;
  };
}

export const MultiSystemLineChart: React.FC<MultiSystemLineChartProps> = ({
  data,
  metric,
  timeRange,
  showLegend = true,
  height = 300,
  colors = {
    autmatrix: "#3B82F6",
    relaycore: "#10B981",
    neuroweaver: "#8B5CF6",
  },
}) => {
  // Implementation using recharts
};
```

#### Real-time Metrics Chart

**File**: `frontend/src/components/charts/RealTimeMetricsChart.tsx`

```typescript
interface RealTimeMetricsChartProps {
  endpoint: string;
  refreshInterval: number;
  maxDataPoints: number;
  metric: string;
  unit: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

export const RealTimeMetricsChart: React.FC<RealTimeMetricsChartProps> = ({
  endpoint,
  refreshInterval = 5000,
  maxDataPoints = 100,
  metric,
  unit,
  thresholds,
}) => {
  // Real-time data fetching and chart updates
};
```

#### Cost Analysis Chart

**File**: `frontend/src/components/charts/CostAnalysisChart.tsx`

```typescript
interface CostAnalysisChartProps {
  data: Array<{
    date: string;
    autmatrix: number;
    relaycore: number;
    neuroweaver: number;
    total: number;
  }>;
  breakdown: "daily" | "weekly" | "monthly";
  showProjection?: boolean;
  budget?: number;
}

export const CostAnalysisChart: React.FC<CostAnalysisChartProps> = ({
  data,
  breakdown,
  showProjection = false,
  budget,
}) => {
  // Cost visualization with budget tracking
};
```

### 2. Chart Utility Functions

#### Chart Data Transformer

**File**: `frontend/src/utils/chartUtils.ts`

```typescript
export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  system: string;
  metadata?: Record<string, any>;
}

export interface ChartDataTransformer {
  transformTimeSeriesData: (data: MetricDataPoint[], groupBy: string) => any[];
  aggregateBySystem: (data: MetricDataPoint[]) => Record<string, number>;
  calculateTrends: (data: MetricDataPoint[]) => {
    trend: "up" | "down" | "stable";
    percentage: number;
  };
  formatForRecharts: (data: any[], xKey: string, yKeys: string[]) => any[];
}
```

#### Performance Metrics Calculator

**File**: `frontend/src/utils/performanceMetrics.ts`

```typescript
export interface PerformanceCalculator {
  calculateAverageResponseTime: (data: MetricDataPoint[]) => number;
  calculateErrorRate: (total: number, errors: number) => number;
  calculateUptime: (healthChecks: HealthCheck[]) => number;
  calculateThroughput: (requests: number, timeWindow: number) => number;
  detectAnomalies: (
    data: MetricDataPoint[],
    threshold: number,
  ) => MetricDataPoint[];
}
```

### 3. Dashboard Integration Components

#### System Comparison Dashboard

**File**: `frontend/src/components/dashboards/SystemComparisonDashboard.tsx`

```typescript
interface SystemComparisonProps {
  systems: ["autmatrix", "relaycore", "neuroweaver"];
  metrics: string[];
  timeRange: string;
  comparisonMode: "side-by-side" | "overlay" | "normalized";
}

export const SystemComparisonDashboard: React.FC<SystemComparisonProps> = ({
  systems,
  metrics,
  timeRange,
  comparisonMode,
}) => {
  // Multi-system comparison interface
};
```

#### Alert Visualization Component

**File**: `frontend/src/components/charts/AlertVisualization.tsx`

```typescript
interface AlertVisualizationProps {
  alerts: Array<{
    id: string;
    system: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
  groupBy: "system" | "severity" | "time";
  showResolved?: boolean;
}
```

## API Integration Details

### Chart Data Endpoints

```typescript
// Enhanced monitoring API for chart data
export const chartDataApi = {
  getTimeSeriesData: (
    systems: string[],
    metrics: string[],
    timeRange: string,
    granularity: "minute" | "hour" | "day",
  ): Promise<TimeSeriesData[]> => {},

  getAggregatedMetrics: (
    systems: string[],
    timeRange: string,
  ): Promise<AggregatedMetrics> => {},

  getCostBreakdown: (
    timeRange: string,
    groupBy: "system" | "user" | "model",
  ): Promise<CostBreakdown[]> => {},

  getPerformanceMetrics: (
    system: string,
    timeRange: string,
  ): Promise<PerformanceMetrics> => {},
};
```

## Styling Requirements

- Consistent color scheme across all charts
- Responsive design that works on mobile and desktop
- Dark/light theme support
- Accessibility compliance (ARIA labels, keyboard navigation)
- Loading states and skeleton screens
- Error states with retry functionality

## Error Handling Requirements

- Network timeout handling for chart data requests
- Graceful degradation when data is unavailable
- Retry logic with exponential backoff
- User-friendly error messages
- Fallback to cached data when possible
- Loading indicators during data fetching

## Performance Requirements

- Efficient data updates for real-time charts
- Memory management for large datasets
- Lazy loading for complex visualizations
- Debounced updates to prevent excessive re-renders
- Virtual scrolling for large data tables
- Chart animation optimization

## Success Criteria

- [ ] All chart components render correctly with sample data
- [ ] Real-time updates work smoothly without performance issues
- [ ] Charts are responsive and accessible
- [ ] Error states are handled gracefully
- [ ] Components are fully typed with TypeScript
- [ ] Integration with existing monitoring APIs works
- [ ] Performance meets requirements (< 100ms render time)

## Technical Context

- Build on existing chart components in `frontend/src/components/charts/`
- Use Recharts library (already in dependencies)
- Follow patterns from `frontend/src/components/UnifiedMonitoringDashboard.tsx`
- Integrate with monitoring APIs from `frontend/src/api/monitoring.ts`
- Use existing utility functions and hooks

## Files to Create/Modify

1. `frontend/src/components/charts/MultiSystemLineChart.tsx`
2. `frontend/src/components/charts/RealTimeMetricsChart.tsx`
3. `frontend/src/components/charts/CostAnalysisChart.tsx`
4. `frontend/src/components/charts/AlertVisualization.tsx`
5. `frontend/src/components/dashboards/SystemComparisonDashboard.tsx`
6. `frontend/src/utils/chartUtils.ts`
7. `frontend/src/utils/performanceMetrics.ts`
8. `frontend/src/types/charts.ts`
9. `frontend/src/hooks/useChartData.ts`

## Testing Requirements

- Unit tests for all chart components
- Integration tests for data fetching
- Visual regression tests for chart rendering
- Performance tests for real-time updates
- Accessibility tests for keyboard navigation

## Priority

Medium-High - Required for comprehensive monitoring and analytics

## Estimated Time

8-10 hours

## Dependencies

- Existing chart components and utilities
- Monitoring API endpoints
- Recharts library
- TypeScript definitions for chart data
