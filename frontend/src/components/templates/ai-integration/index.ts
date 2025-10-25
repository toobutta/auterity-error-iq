// Frontend AI Integration Templates - Export File
// Pre-development templates for Week 2 implementation

// Core types and interfaces
export * from './types';

// Custom hooks
export { useUnifiedAIService } from './useUnifiedAIService';
export { useAIServiceWithRetry } from './useUnifiedAIService';
export { useAIServiceWithCache } from './useUnifiedAIService';
export { useStreamingAIService } from './useUnifiedAIService';

// Components
export { default as RoutingPolicySelector } from './RoutingPolicySelector';
export { default as AIServiceWrapper, AIServiceProvider } from './AIServiceWrapper';

// Re-export commonly used types for convenience
export type {
  AIServiceRequest,
  AIServiceResponse,
  UnifiedAIServiceConfig,
  RoutingPolicy,
  ProviderConfig,
  AIServiceHookResult,
  RoutingPolicyHookResult
} from './types';
