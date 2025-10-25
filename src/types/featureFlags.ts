/**
 * Feature Flags Types
 * TypeScript definitions for feature flag management and A/B testing
 */

// Feature Flag Interface
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  conditions: FeatureFlagRule[];
  experimentId: string | null;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

// Feature Flag Rule
export interface FeatureFlagRule {
  attribute: string; // e.g., 'user.role', 'user.plan', 'environment'
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';
  value: any;
}

// Feature Flag User
export interface FeatureFlagUser {
  id: string;
  email?: string;
  role?: string;
  plan?: string;
  organization?: string;
  attributes?: Record<string, any>;
}

// Feature Flag Configuration
export interface FeatureFlagConfig {
  enabled?: boolean;
  environment?: 'development' | 'staging' | 'production';
  user?: FeatureFlagUser;
  attributes?: Record<string, any>;
  backendUrl?: string;
  apiKey?: string;
  persistence?: 'memory' | 'localStorage' | 'sessionStorage';
  syncInterval?: number; // in milliseconds
  onFlagChange?: (flagKey: string, flag?: FeatureFlag) => void;
}

// Feature Flag Experiment
export interface FeatureFlagExperiment {
  id: string;
  name: string;
  description: string;
  flagKey: string;
  variants: ExperimentVariant[];
  audience: ExperimentAudience;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  startDate?: number;
  endDate?: number;
  createdAt: number;
  updatedAt: number;
}

// Experiment Variant
export interface ExperimentVariant {
  name: string;
  value: boolean; // true for treatment, false for control
  weight: number; // percentage of traffic (0-100)
  description?: string;
}

// Experiment Audience
export interface ExperimentAudience {
  rules: FeatureFlagRule[];
  percentage: number; // percentage of users (0-100)
  includeUsers?: string[]; // specific user IDs
  excludeUsers?: string[]; // specific user IDs to exclude
}

// Experiment Result
export interface ExperimentResult {
  experimentId: string;
  variant: string;
  metrics: ExperimentMetric[];
  confidence: number;
  significance: number;
  winner?: string;
  timestamp: number;
}

// Experiment Metric
export interface ExperimentMetric {
  name: string;
  controlValue: number;
  variantValue: number;
  improvement: number; // percentage
  pValue: number;
  confidence: number;
}

// Feature Flag Dashboard Data
export interface FeatureFlagDashboardData {
  flags: FeatureFlag[];
  experiments: FeatureFlagExperiment[];
  stats: {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    runningExperiments: number;
    flagsByRollout: Record<string, number>;
    flagsByTag: Record<string, number>;
  };
  recentActivity: FeatureFlagActivity[];
}

// Feature Flag Activity
export interface FeatureFlagActivity {
  id: string;
  type: 'flag_created' | 'flag_updated' | 'flag_deleted' | 'experiment_started' | 'experiment_ended';
  flagKey?: string;
  experimentId?: string;
  userId: string;
  timestamp: number;
  details?: Record<string, any>;
}

// Feature Flag Override
export interface FeatureFlagOverride {
  userId: string;
  flagKey: string;
  value: boolean;
  reason?: string;
  expiresAt?: number;
  createdAt: number;
  createdBy: string;
}

// Feature Flag Template
export interface FeatureFlagTemplate {
  name: string;
  description: string;
  category: string;
  defaultConfig: Partial<FeatureFlag>;
  rules: FeatureFlagRule[];
  tags: string[];
}

// Feature Flag Category
export interface FeatureFlagCategory {
  name: string;
  description: string;
  color: string;
  icon?: string;
}

// Feature Flag Analytics
export interface FeatureFlagAnalytics {
  flagKey: string;
  period: {
    start: number;
    end: number;
  };
  impressions: number;
  conversions: number;
  conversionRate: number;
  uniqueUsers: number;
  topSegments: Array<{
    segment: string;
    impressions: number;
    conversions: number;
    rate: number;
  }>;
}

// Feature Flag Health Check
export interface FeatureFlagHealthCheck {
  service: 'available' | 'degraded' | 'unavailable';
  lastSync: number;
  flagsCount: number;
  experimentsCount: number;
  errors: string[];
  latency: number;
}

// Feature Flag Integration
export interface FeatureFlagIntegration {
  provider: 'growthbook' | 'launchdarkly' | 'split' | 'custom';
  config: Record<string, any>;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: number;
  features: string[];
}

// Export all types
export type {
  FeatureFlag,
  FeatureFlagRule,
  FeatureFlagUser,
  FeatureFlagConfig,
  FeatureFlagExperiment,
  ExperimentVariant,
  ExperimentAudience,
  ExperimentResult,
  ExperimentMetric,
  FeatureFlagDashboardData,
  FeatureFlagActivity,
  FeatureFlagOverride,
  FeatureFlagTemplate,
  FeatureFlagCategory,
  FeatureFlagAnalytics,
  FeatureFlagHealthCheck,
  FeatureFlagIntegration
};
