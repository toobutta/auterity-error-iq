/**
 * Integration Types - Cross-System Analytics & Orchestration
 */

import { UserAnalytics, SystemPerformance, BusinessMetrics } from './analytics.types';
import { MLAnalytics, ModelPerformance, ExperimentResult } from './ml.types';

export interface UnifiedAnalytics {
  // System identification
  tenantId: string;
  timestamp: Date;

  // Individual system data
  auterity: {
    userAnalytics: UserAnalytics;
    systemPerformance: SystemPerformance;
    businessMetrics: BusinessMetrics;
  };

  neuroweaver: MLAnalytics;

  relaycore: {
    workflowAnalytics: WorkflowAnalytics;
    executionMetrics: ExecutionMetrics;
    optimizationInsights: OptimizationInsight[];
  };

  // Cross-system correlations
  correlations: SystemCorrelation[];

  // Unified insights
  insights: UnifiedInsight[];

  // System health overview
  health: SystemHealth;
}

export interface SystemCorrelation {
  id: string;
  title: string;
  description: string;

  // Systems involved
  systems: ('auterity' | 'neuroweaver' | 'relaycore')[];

  // Correlation data
  correlation: number; // -1 to 1 (negative to positive correlation)
  confidence: number; // 0 to 1
  statisticalSignificance: number; // p-value

  // Impact analysis
  impact: 'low' | 'medium' | 'high' | 'critical';
  businessValue: number; // Estimated value in dollars or percentage

  // Visualization
  chartType: 'scatter' | 'correlation_matrix' | 'time_series' | 'heatmap';
  data: any;

  // Recommendations
  recommendations: Array<{
    action: string;
    system: string;
    priority: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    expectedImpact: number;
  }>;

  // Metadata
  lastCalculated: Date;
  calculationMethod: string;
  dataPoints: number;
}

export interface UnifiedInsight {
  id: string;
  title: string;
  type: 'correlation' | 'trend' | 'anomaly' | 'opportunity' | 'risk';
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Insight details
  description: string;
  summary: string;
  detailedAnalysis: string;

  // Systems involved
  affectedSystems: string[];
  primarySystem: string;

  // Metrics and data
  metrics: Array<{
    name: string;
    value: number;
    previousValue?: number;
    change: number;
    unit?: string;
  }>;

  // Evidence and confidence
  confidence: number;
  evidence: Array<{
    type: 'metric' | 'trend' | 'correlation' | 'prediction';
    description: string;
    data: any;
  }>;

  // Recommendations
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    actionType: 'immediate' | 'short_term' | 'long_term';
    priority: 'low' | 'medium' | 'high' | 'critical';
    effort: 'low' | 'medium' | 'high';
    expectedImpact: {
      value: number;
      unit: string;
      timeframe: string;
    };
    responsibleSystem: string;
    dependencies?: string[];
  }>;

  // Timeline
  detectedAt: Date;
  lastUpdated: Date;
  expiresAt?: Date;

  // Status
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100

  // Individual system health
  systems: {
    auterity: SystemHealthScore;
    neuroweaver: SystemHealthScore;
    relaycore: SystemHealthScore;
  };

  // Cross-system health indicators
  integration: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    latency: number;
    errorRate: number;
    lastIncident?: Date;
  };

  // Active issues
  activeIssues: Array<{
    id: string;
    system: string;
    type: 'performance' | 'availability' | 'quality' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    detectedAt: Date;
    acknowledged: boolean;
  }>;

  // Predictions
  predictions: {
    nextMaintenance?: Date;
    potentialIssues: Array<{
      type: string;
      probability: number;
      impact: string;
      mitigation: string;
    }>;
  };

  lastUpdated: Date;
}

export interface SystemHealthScore {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
  activeIssues: number;
  lastIncident?: Date;
}

// Workflow Analytics (RelayCore specific)
export interface WorkflowAnalytics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;

  executionMetrics: {
    avgExecutionTime: number;
    successRate: number;
    throughput: number;
    resourceUtilization: number;
  };

  popularNodes: Array<{
    nodeType: string;
    usage: number;
    successRate: number;
    avgExecutionTime: number;
  }>;

  optimizationOpportunities: Array<{
    workflowId: string;
    optimizationType: string;
    potentialImprovement: number;
    confidence: number;
    description: string;
  }>;
}

export interface ExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTime: number;
  p95ExecutionTime: number;
  throughput: number;

  // Performance by time
  hourlyMetrics: Array<{
    hour: string;
    executions: number;
    successRate: number;
    avgTime: number;
  }>;

  // Error analysis
  topErrors: Array<{
    error: string;
    count: number;
    percentage: number;
    affectedWorkflows: string[];
  }>;

  // Resource usage
  resourceMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    networkTraffic: number;
    diskUsage: number;
  };
}

export interface OptimizationInsight {
  id: string;
  workflowId: string;
  type: 'performance' | 'cost' | 'reliability' | 'efficiency';
  title: string;
  description: string;

  // Current state
  currentMetrics: Record<string, number>;

  // Proposed improvements
  proposedChanges: Array<{
    change: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
  }>;

  // Expected outcomes
  expectedOutcomes: {
    performance: number; // percentage improvement
    cost: number; // percentage savings
    reliability: number; // percentage improvement
    timeline: string; // implementation timeline
  };

  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Implementation
  status: 'identified' | 'planned' | 'implementing' | 'completed' | 'failed';
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
}

// Real-time integration types
export interface CrossSystemEvent {
  id: string;
  type: 'metric_update' | 'alert' | 'insight' | 'prediction';
  source: 'auterity' | 'neuroweaver' | 'relaycore' | 'integration';
  timestamp: Date;
  data: any;

  // Cross-system impact
  affectedSystems: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Propagation tracking
  propagatedTo: string[];
  propagationStatus: Record<string, 'pending' | 'delivered' | 'failed'>;
}

export interface UnifiedAlert {
  id: string;
  title: string;
  description: string;
  type: 'system' | 'performance' | 'security' | 'business';
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Source information
  sourceSystem: string;
  sourceComponent: string;
  sourceId?: string;

  // Affected systems
  affectedSystems: string[];
  impact: {
    users: number;
    revenue: number;
    performance: number;
  };

  // Resolution
  status: 'active' | 'acknowledged' | 'investigating' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;

  // Timeline
  createdAt: Date;
  updatedAt: Date;
  escalatedAt?: Date;

  // Actions
  recommendedActions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    system: string;
    description: string;
  }>;

  // Related events
  relatedEvents: string[];
  relatedAlerts: string[];
}

// API Integration types
export interface UnifiedAPIConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;

  // Authentication
  auth: {
    type: 'bearer' | 'api_key' | 'oauth2';
    token?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
  };

  // Rate limiting
  rateLimit: {
    requests: number;
    period: number; // seconds
    strategy: 'fixed_window' | 'sliding_window' | 'token_bucket';
  };

  // Caching
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
}

export interface APIEndpoint {
  system: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  response: {
    type: string;
    description: string;
  };
  cacheable: boolean;
  requiresAuth: boolean;
}

// Navigation and UI integration
export interface UnifiedNavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  system: 'auterity' | 'neuroweaver' | 'relaycore' | 'unified';
  category: 'analytics' | 'workflows' | 'models' | 'settings' | 'admin';

  // Permissions
  permissions: string[];
  featureFlag?: string;

  // State
  badge?: number;
  isActive?: boolean;
  isDisabled?: boolean;

  // Sub-navigation
  children?: UnifiedNavigationItem[];

  // Analytics
  usageCount?: number;
  lastAccessed?: Date;
}

export interface UnifiedDashboardConfig {
  id: string;
  name: string;
  description: string;

  // Layout
  layout: 'grid' | 'masonry' | 'flex' | 'custom';
  columns: number;
  gap: number;

  // Widgets
  widgets: Array<{
    id: string;
    type: string;
    system: string;
    config: Record<string, any>;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;

  // Settings
  refreshInterval: number;
  enableRealtime: boolean;
  showPredictions: boolean;
  theme: 'light' | 'dark' | 'auto';

  // Permissions
  isPublic: boolean;
  allowedUsers: string[];
  allowedRoles: string[];
}

// Hook return types
export interface UseUnifiedAnalyticsReturn {
  data: UnifiedAnalytics;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  updateFilters: (filters: Record<string, any>) => void;
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<Blob>;
}

export interface UseCrossSystemInsightsReturn {
  insights: UnifiedInsight[];
  correlations: SystemCorrelation[];
  alerts: UnifiedAlert[];
  recommendations: Array<any>;

  // Actions
  acknowledgeInsight: (insightId: string) => Promise<void>;
  dismissInsight: (insightId: string, reason?: string) => Promise<void>;
  implementRecommendation: (recommendationId: string) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
}
