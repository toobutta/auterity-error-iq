/**
 * ML/AI Analytics Types - Model Performance & Optimization
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'cohere' | 'azure' | 'custom';
  version: string;
  modelType: 'text' | 'vision' | 'multimodal' | 'embedding';
  capabilities: string[];
  supportedTasks: string[];
  maxTokens: number;
  contextWindow: number;
  costPer1kTokens: number;
  avgLatency: number;
  status: 'active' | 'deprecated' | 'experimental' | 'maintenance';
  metadata: Record<string, any>;
}

export interface ModelPerformance {
  modelId: string;
  modelVersion: string;
  timeRange: {
    from: Date;
    to: Date;
  };

  // Usage metrics
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;

  // Performance metrics
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;

  // Token metrics
  totalTokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  avgTokensPerRequest: number;

  // Cost metrics
  totalCost: number;
  avgCostPerRequest: number;
  costPer1kTokens: number;

  // Quality metrics
  avgConfidenceScore: number;
  avgUserRating: number;
  acceptanceRate: number;

  // Error analysis
  errorRate: number;
  topErrors: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;

  // Time-series data
  hourlyMetrics: Array<{
    hour: string;
    requests: number;
    successRate: number;
    avgResponseTime: number;
    cost: number;
  }>;

  lastUpdated: Date;
}

export interface PromptOutputEntry {
  id: string;
  prompt: string;
  promptHash: string; // For duplicate detection
  output: string;
  modelId: string;
  modelVersion: string;
  modelProvider: string;

  // Performance data
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  responseTimeMs: number;
  confidenceScore?: number;

  // User feedback
  userRating?: number; // 1-5 scale
  userFeedback?: string;
  status: 'generated' | 'reviewed' | 'accepted' | 'rejected';

  // Metadata
  tags: string[];
  category?: string;
  source: 'portal' | 'api' | 'workflow' | 'agent';
  workflowId?: string;
  agentId?: string;
  sessionId?: string;

  // Timestamps
  createdAt: Date;
  reviewedAt?: Date;
  acceptedAt?: Date;

  // Context
  context?: Record<string, any>;
  parameters?: Record<string, any>;
  environment?: Record<string, any>;
}

export interface PromptAnalytics {
  totalPrompts: number;
  uniquePrompts: number;
  avgPromptLength: number;
  avgOutputLength: number;

  // Performance by category
  categoryPerformance: Array<{
    category: string;
    count: number;
    avgRating: number;
    acceptanceRate: number;
    avgResponseTime: number;
  }>;

  // Pattern analysis
  patterns: Array<{
    id: string;
    pattern: string;
    frequency: number;
    successRate: number;
    avgRating: number;
    similarPrompts: string[];
  }>;

  // Quality metrics
  qualityMetrics: {
    avgRating: number;
    acceptanceRate: number;
    rejectionRate: number;
    improvementSuggestions: Array<{
      suggestion: string;
      impact: 'low' | 'medium' | 'high';
      confidence: number;
    }>;
  };

  // Trending topics
  trendingTopics: Array<{
    topic: string;
    frequency: number;
    growth: number;
    sentiment: number;
  }>;
}

export interface ExperimentResult {
  id: string;
  name: string;
  type: 'model_comparison' | 'parameter_tuning' | 'prompt_optimization' | 'routing_strategy';
  status: 'running' | 'completed' | 'failed' | 'stopped';

  // Configuration
  variants: Array<{
    id: string;
    name: string;
    config: Record<string, any>;
    trafficAllocation: number;
  }>;

  // Results
  winner?: string;
  confidence: number;
  statisticalSignificance: number;
  improvement: number;

  // Metrics
  primaryMetric: string;
  metricResults: Array<{
    variantId: string;
    value: number;
    confidence: number;
    sampleSize: number;
  }>;

  // Time tracking
  startedAt: Date;
  completedAt?: Date;
  duration: number;

  // Analysis
  insights: string[];
  recommendations: Array<{
    action: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  }>;
}

export interface CostOptimization {
  totalCost: number;
  projectedSavings: number;
  optimizationOpportunities: Array<{
    type: 'model_selection' | 'caching' | 'batching' | 'routing';
    description: string;
    potentialSavings: number;
    implementationEffort: 'low' | 'medium' | 'high';
    confidence: number;
  }>;

  // Cost breakdown
  costByModel: Array<{
    modelId: string;
    cost: number;
    percentage: number;
    requests: number;
  }>;

  costByTime: Array<{
    period: string;
    cost: number;
    trend: 'up' | 'down' | 'stable';
  }>;

  // Recommendations
  recommendations: Array<{
    action: string;
    expectedSavings: number;
    timeline: string;
    risks: string[];
  }>;
}

export interface ModelHealth {
  modelId: string;
  overallHealth: 'healthy' | 'warning' | 'critical';
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
  driftScore?: number; // Model performance drift

  // Health indicators
  indicators: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    value: number;
    threshold: number;
    trend: 'improving' | 'degrading' | 'stable';
  }>;

  // Issues
  activeIssues: Array<{
    id: string;
    type: 'performance' | 'quality' | 'availability' | 'cost';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detectedAt: Date;
    resolvedAt?: Date;
  }>;

  // Predictions
  predictions: {
    nextMaintenance?: Date;
    performanceDecline?: number;
    costIncrease?: number;
  };

  lastUpdated: Date;
}

export interface MLAnalytics {
  models: ModelInfo[];
  performance: ModelPerformance[];
  prompts: PromptOutputEntry[];
  promptAnalytics: PromptAnalytics;
  experiments: ExperimentResult[];
  costOptimization: CostOptimization;
  modelHealth: ModelHealth[];
  summary: {
    totalModels: number;
    activeModels: number;
    totalRequests: number;
    avgResponseTime: number;
    totalCost: number;
    avgRating: number;
    acceptanceRate: number;
  };
}

// Real-time ML types
export interface RealtimeMLMetrics {
  activeModels: number;
  requestsPerSecond: number;
  avgResponseTime: number;
  errorRate: number;
  totalTokensPerMinute: number;
  costPerMinute: number;
  timestamp: Date;
}

export interface MLAlert {
  id: string;
  type: 'performance' | 'quality' | 'cost' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  modelId?: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

// Integration with experiments
export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  type: ExperimentResult['type'];
  variants: Array<{
    id: string;
    name: string;
    config: Record<string, any>;
    trafficAllocation: number;
  }>;
  primaryMetric: string;
  secondaryMetrics?: string[];
  targetImprovement: number;
  maxDuration: number; // days
  minSampleSize: number;
  confidenceThreshold: number;
}

// Hook return types
export interface UseMLAnalyticsReturn {
  data: MLAnalytics;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  updateFilters: (filters: Record<string, any>) => void;
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<Blob>;
}

export interface UseRealtimeMLReturn extends UseMLAnalyticsReturn {
  isConnected: boolean;
  alerts: MLAlert[];
  metrics: RealtimeMLMetrics;
  subscribeToAlerts: (callback: (alert: MLAlert) => void) => () => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
}
