// Types and interfaces for Unified AI Service Integration
// Pre-development templates for Week 2 implementation

export interface AIServiceRequest {
  prompt?: string;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  context?: Record<string, any>;
}

export interface AIServiceResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata: {
    responseTime: number;
    providerUsed: string;
    policyApplied?: string;
    costSavings?: number;
  };
}

export interface RoutingPolicy {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: {
    userTier?: 'enterprise' | 'professional' | 'standard';
    serviceType?: 'chat' | 'completion' | 'embedding';
    modelType?: string;
    costThreshold?: number;
    performanceRequirement?: 'high' | 'medium' | 'low';
    geographicRegion?: string;
  };
  actions: {
    primaryProvider: string;
    fallbackProviders: string[];
    costOptimization: boolean;
    cachingEnabled: boolean;
  };
  status: 'active' | 'inactive' | 'draft';
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom';
  costPerToken: number;
  avgResponseTime: number;
  capacity: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  region?: string;
  models: string[];
}

export interface UnifiedAIServiceConfig {
  defaultProvider?: string;
  enableRouting?: boolean;
  enableCostOptimization?: boolean;
  enableCaching?: boolean;
  fallbackEnabled?: boolean;
  monitoringEnabled?: boolean;
}

export interface AIServiceHookResult {
  execute: (request: AIServiceRequest) => Promise<AIServiceResponse>;
  isLoading: boolean;
  error: string | null;
  lastResponse: AIServiceResponse | null;
}

export interface RoutingPolicyHookResult {
  policies: RoutingPolicy[];
  activePolicy: RoutingPolicy | null;
  providers: ProviderConfig[];
  selectPolicy: (policyId: string) => void;
  isLoading: boolean;
  error: string | null;
}

export interface AIIntegrationProps {
  config?: UnifiedAIServiceConfig;
  onResponse?: (response: AIServiceResponse) => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
}

// Template interfaces for future extension
export interface AICacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size
}

export interface AIMonitoringConfig {
  enabled: boolean;
  metrics: string[]; // Types of metrics to track
  alerting: {
    enabled: boolean;
    thresholds: Record<string, number>;
  };
}

export interface AIFallbackConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  providerFallbacks: Record<string, string[]>;
}

// Union types for flexible configurations
export type AIServiceConfig = UnifiedAIServiceConfig & {
  cache?: AICacheConfig;
  monitoring?: AIMonitoringConfig;
  fallback?: AIFallbackConfig;
};

// Error types
export interface AIServiceError {
  code: string;
  message: string;
  provider?: string;
  retryable: boolean;
  details?: Record<string, any>;
}

// Analytics types
export interface AIServiceAnalytics {
  totalRequests: number;
  totalCost: number;
  avgResponseTime: number;
  successRate: number;
  providerUsage: Record<string, number>;
  costSavings: number;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

// Template for future AI service integrations
export interface AIServiceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'chat' | 'completion' | 'embedding' | 'image' | 'audio';
  providers: string[];
  defaultConfig: AIServiceConfig;
  exampleRequest: AIServiceRequest;
  exampleResponse: AIServiceResponse;
}
