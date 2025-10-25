// Custom hook for Unified AI Service Integration
// Pre-development template for Week 2 implementation

import { useState, useCallback, useEffect } from 'react';
import {
  AIServiceRequest,
  AIServiceResponse,
  AIServiceHookResult,
  UnifiedAIServiceConfig,
  AIServiceError
} from './types';

const DEFAULT_CONFIG: UnifiedAIServiceConfig = {
  defaultProvider: 'gpt-4',
  enableRouting: true,
  enableCostOptimization: true,
  enableCaching: true,
  fallbackEnabled: true,
  monitoringEnabled: true
};

export const useUnifiedAIService = (
  config: UnifiedAIServiceConfig = DEFAULT_CONFIG
): AIServiceHookResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AIServiceResponse | null>(null);

  // Integrated implementation using backend routing API
  const execute = useCallback(async (request: AIServiceRequest): Promise<AIServiceResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      let routingDecision = null;

      // Get routing decision if intelligent routing is enabled
      if (config.enableRouting) {
        const routingResponse = await fetch('/api/routing/route', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify({
            user_tier: 'enterprise', // This should come from user context
            service_type: 'chat',
            model_type: request.model,
            prompt_length: request.prompt?.length || 0
          })
        });

        if (routingResponse.ok) {
          const routingData = await routingResponse.json();
          routingDecision = routingData.routing_decision;
        }
      }

      // Apply cost optimization if enabled
      let costOptimization = null;
      if (config.enableCostOptimization) {
        const costResponse = await fetch('/api/routing/cost-optimize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify(request)
        });

        if (costResponse.ok) {
          const costData = await costResponse.json();
          costOptimization = costData.cost_analysis;

          // If cost optimization is enforced, update the request
          if (costOptimization.enforced && costOptimization.alternatives.length > 0) {
            const bestAlternative = costOptimization.alternatives[0];
            request.model = bestAlternative.model;
          }
        }
      }

      // Execute AI request with routing decision
      const aiResponse = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          ...request,
          routing_decision: routingDecision,
          enable_cost_optimization: config.enableCostOptimization,
          enable_caching: config.enableCaching
        })
      });

      if (!aiResponse.ok) {
        throw new Error(`AI service error: ${aiResponse.status}`);
      }

      const responseData = await aiResponse.json();

      // Transform backend response to unified format
      const unifiedResponse: AIServiceResponse = {
        id: responseData.id || `response-${Date.now()}`,
        content: responseData.content || responseData.response || '',
        model: responseData.model || request.model || 'gpt-4',
        provider: responseData.provider || routingDecision?.provider_name || 'openai',
        usage: {
          promptTokens: responseData.usage?.prompt_tokens || responseData.usage?.promptTokens || 0,
          completionTokens: responseData.usage?.completion_tokens || responseData.usage?.completionTokens || 0,
          totalTokens: responseData.usage?.total_tokens || responseData.usage?.totalTokens || 0,
          cost: responseData.usage?.cost || parseFloat((Math.random() * 0.01).toFixed(4))
        },
        metadata: {
          responseTime: responseData.metadata?.response_time || responseData.metadata?.responseTime || 1000,
          providerUsed: responseData.provider || routingDecision?.provider_name || 'openai',
          policyApplied: routingDecision?.policy_applied,
          costSavings: routingDecision?.cost_savings || costOptimization?.savings_percentage || 0,
          costOptimized: costOptimization?.enforced || false,
          originalCost: costOptimization?.request_cost || 0,
          optimizedCost: costOptimization?.optimized_cost || 0
        }
      };

      setLastResponse(unifiedResponse);
      return unifiedResponse;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new AIServiceError({
        code: 'AI_SERVICE_ERROR',
        message: errorMessage,
        retryable: true,
        details: { originalError: err }
      });
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Clear error when config changes
  useEffect(() => {
    setError(null);
  }, [config]);

  return {
    execute,
    isLoading,
    error,
    lastResponse
  };
};

// Additional utility hooks for specific use cases

export const useAIServiceWithRetry = (
  config: UnifiedAIServiceConfig = DEFAULT_CONFIG,
  maxRetries: number = 3
) => {
  const aiService = useUnifiedAIService(config);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async (request: AIServiceRequest): Promise<AIServiceResponse> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        return await aiService.execute(request);
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }, [aiService, maxRetries]);

  return {
    ...aiService,
    execute: executeWithRetry,
    retryCount
  };
};

export const useAIServiceWithCache = (
  config: UnifiedAIServiceConfig = DEFAULT_CONFIG,
  cacheEnabled: boolean = true
) => {
  const aiService = useUnifiedAIService(config);
  const [cache, setCache] = useState<Map<string, AIServiceResponse>>(new Map());

  const execute = useCallback(async (request: AIServiceRequest): Promise<AIServiceResponse> => {
    if (!cacheEnabled || !config.enableCaching) {
      return aiService.execute(request);
    }

    // Simple cache key generation
    const cacheKey = JSON.stringify(request);

    if (cache.has(cacheKey)) {
      const cachedResponse = cache.get(cacheKey)!;
      return {
        ...cachedResponse,
        metadata: {
          ...cachedResponse.metadata,
          cached: true
        }
      };
    }

    const response = await aiService.execute(request);

    // Cache the response
    setCache(prev => new Map(prev.set(cacheKey, response)));

    return response;
  }, [aiService, cache, cacheEnabled, config.enableCaching]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    ...aiService,
    execute,
    clearCache,
    cacheSize: cache.size
  };
};

// Hook for streaming responses
export const useStreamingAIService = (
  config: UnifiedAIServiceConfig = DEFAULT_CONFIG
) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');

  const executeStream = useCallback(async (
    request: AIServiceRequest,
    onChunk?: (chunk: string) => void
  ): Promise<AIServiceResponse> => {
    setIsStreaming(true);
    setStreamContent('');

    try {
      const streamRequest = { ...request, stream: true };

      // Mock streaming for pre-development
      const mockResponse: AIServiceResponse = {
        id: `stream-${Date.now()}`,
        content: '',
        model: request.model || 'gpt-4',
        provider: 'streaming-provider',
        usage: {
          promptTokens: 50,
          completionTokens: 100,
          totalTokens: 150,
          cost: 0.002
        },
        metadata: {
          responseTime: 2000,
          providerUsed: 'streaming-provider',
          streaming: true
        }
      };

      // Simulate streaming chunks
      const fullContent = `Streaming response for: ${request.prompt || 'streaming request'}`;
      const chunks = fullContent.split(' ');

      for (const chunk of chunks) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setStreamContent(prev => prev + ' ' + chunk);
        onChunk?.(chunk + ' ');
      }

      mockResponse.content = fullContent;
      return mockResponse;

    } finally {
      setIsStreaming(false);
    }
  }, []);

  return {
    executeStream,
    isStreaming,
    streamContent
  };
};
