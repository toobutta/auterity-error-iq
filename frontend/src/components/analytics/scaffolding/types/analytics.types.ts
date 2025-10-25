/**
 * Analytics Types - Business Intelligence & User Analytics
 */

export interface DateRange {
  from: Date;
  to: Date;
}

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface MetricData {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  trend: 'up' | 'down' | 'neutral';
  unit?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  sessionDuration: number;
  pageViews: number;
  bounceRate: number;
  conversionRate?: number;
  userJourney: UserJourneyStep[];
  deviceBreakdown: DeviceMetrics[];
  geographicData: GeographicMetrics[];
}

export interface UserJourneyStep {
  step: string;
  users: number;
  dropoff: number;
  conversion: number;
  avgTime: number;
}

export interface DeviceMetrics {
  device: 'desktop' | 'mobile' | 'tablet';
  users: number;
  percentage: number;
  sessions: number;
  avgSessionTime: number;
}

export interface GeographicMetrics {
  country: string;
  region?: string;
  users: number;
  percentage: number;
  avgSessionTime: number;
}

export interface SystemPerformance {
  responseTime: number;
  errorRate: number;
  throughput: number;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkTraffic: number;
}

export interface BusinessMetrics {
  revenue: number;
  transactions: number;
  conversionRate: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  churnRate: number;
  retentionRate: number;
  growthRate: number;
}

export interface AnalyticsFilters {
  dateRange?: DateRange;
  userSegment?: string[];
  deviceType?: string[];
  geographicRegion?: string[];
  eventType?: string[];
  customFilters?: Record<string, any>;
}

export interface AnalyticsConfig {
  refreshInterval: number;
  enableRealtime: boolean;
  showTrends: boolean;
  showPredictions: boolean;
  aggregationLevel: 'hour' | 'day' | 'week' | 'month';
  maxDataPoints: number;
  enableCaching: boolean;
  cacheTimeout: number;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'heatmap' | 'timeline';
  title: string;
  description?: string;
  data: any;
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  permissions?: string[];
  refreshInterval?: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'user_analytics' | 'performance' | 'business' | 'custom';
  config: {
    metrics: string[];
    dimensions: string[];
    filters: AnalyticsFilters;
    visualization: 'table' | 'chart' | 'dashboard';
    schedule?: 'daily' | 'weekly' | 'monthly';
  };
  createdBy: string;
  createdAt: Date;
  lastRun?: Date;
  isPublic: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
    value: number;
    duration?: number; // minutes
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: ('email' | 'slack' | 'webhook' | 'dashboard')[];
  enabled: boolean;
  lastTriggered?: Date;
  cooldown: number; // minutes
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  properties: Record<string, any>;
  context: Record<string, any>;
}

// Real-time analytics types
export interface RealtimeMetrics {
  activeUsers: number;
  currentSessions: number;
  eventsPerSecond: number;
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
  timestamp: Date;
}

export interface LiveUpdate {
  type: 'metric_update' | 'event' | 'alert' | 'prediction';
  data: any;
  timestamp: Date;
  source: string;
}

// Integration types
export interface CrossSystemMetrics {
  auterity: UserAnalytics & SystemPerformance;
  neuroweaver: MLAnalytics;
  relaycore: WorkflowAnalytics;
  correlations: SystemCorrelation[];
}

export interface SystemCorrelation {
  systems: string[];
  correlation: number;
  insight: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

// Forward declarations for cross-system types
export interface MLAnalytics {
  modelPerformance: any;
  promptAnalytics: any;
  costMetrics: any;
}

export interface WorkflowAnalytics {
  executionMetrics: any;
  optimizationInsights: any;
  collaborationStats: any;
}

// Error handling
export interface AnalyticsError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}

export interface AnalyticsState {
  data: any;
  loading: boolean;
  error?: AnalyticsError;
  lastUpdated: Date;
  filters: AnalyticsFilters;
  config: AnalyticsConfig;
}

// Hook return types
export interface UseAnalyticsReturn {
  data: any;
  loading: boolean;
  error?: AnalyticsError;
  refresh: () => Promise<void>;
  updateFilters: (filters: Partial<AnalyticsFilters>) => void;
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<Blob>;
}

export interface UseRealtimeAnalyticsReturn extends UseAnalyticsReturn {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  subscribeToUpdates: (callback: (update: LiveUpdate) => void) => () => void;
  sendFeedback: (feedback: any) => void;
}
