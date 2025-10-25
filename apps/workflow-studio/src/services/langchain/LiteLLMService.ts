/**
 * LiteLLM Service for Auterity Error-IQ
 * Provides intelligent provider routing and cost optimization
 * Integrates with existing AI SDK and LangChain services
 */

import { z } from "zod";

// Types for LiteLLM integration
export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl?: string;
  models: string[];
  costPerToken: number;
  maxTokens: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  health: 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck: Date;
  responseTime: number; // in milliseconds
}

export interface RoutingDecision {
  provider: string;
  model: string;
  estimatedCost: number;
  reasoning: string;
  fallbackProviders?: string[];
  metadata?: Record<string, any>;
}

export interface CostMetrics {
  totalRequests: number;
  totalCost: number;
  averageCostPerRequest: number;
  costByProvider: Record<string, number>;
  costByModel: Record<string, number>;
  savings: number; // compared to using single provider
}

export class LiteLLMService {
  private providers: Map<string, ProviderConfig> = new Map();
  private routingHistory: RoutingDecision[] = [];
  private costMetrics: CostMetrics = {
    totalRequests: 0,
    totalCost: 0,
    averageCostPerRequest: 0,
    costByProvider: {},
    costByModel: {},
    savings: 0
  };

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize providers from environment variables
   */
  private initializeProviders(): void {
    const providerConfigs = [
      {
        name: 'openai',
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        costPerToken: 0.002,
        maxTokens: 8192,
        rateLimit: { requestsPerMinute: 60, tokensPerMinute: 40000 }
      },
      {
        name: 'anthropic',
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
        models: ['claude-3', 'claude-2'],
        costPerToken: 0.003,
        maxTokens: 4096,
        rateLimit: { requestsPerMinute: 50, tokensPerMinute: 25000 }
      },
      {
        name: 'google',
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
        models: ['gemini-pro', 'gemini-pro-vision'],
        costPerToken: 0.001,
        maxTokens: 30720,
        rateLimit: { requestsPerMinute: 60, tokensPerMinute: 32000 }
      },
      {
        name: 'n8n',
        apiKey: import.meta.env.VITE_N8N_API_KEY || '',
        models: ['n8n-workflow'],
        costPerToken: 0.0005, // Very low cost for workflow orchestration
        maxTokens: 10000,
        rateLimit: { requestsPerMinute: 100, tokensPerMinute: 50000 }
      }
    ];

    providerConfigs.forEach(config => {
      if (config.apiKey) {
        this.providers.set(config.name, {
          ...config,
          health: 'healthy',
          lastHealthCheck: new Date(),
          responseTime: 1000 // Default response time
        });
      }
    });

  }

  /**
   * Determine optimal routing based on request characteristics
   */
  async determineRouting(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      costPriority?: 'low' | 'medium' | 'high';
      speedPriority?: 'low' | 'medium' | 'high';
      capabilities?: string[];
      userId?: string;
    } = {}
  ): Promise<RoutingDecision> {
    try {
      const availableProviders = Array.from(this.providers.values())
        .filter(p => p.health === 'healthy');

      if (availableProviders.length === 0) {
        throw new Error('No healthy providers available');
      }

      let bestProvider: ProviderConfig | null = null;
      let bestModel = '';
      let bestCost = Infinity;
      let reasoning = '';

      // If specific model is requested, try to find it
      if (options.model) {
        for (const provider of availableProviders) {
          if (provider.models.includes(options.model)) {
            bestProvider = provider;
            bestModel = options.model;
            reasoning = `Using requested model ${options.model} from ${provider.name}`;
            break;
          }
        }
      }

      // If no specific model or model not found, use intelligent routing
      if (!bestProvider) {
        const routingResult = this.intelligentRouting(prompt, options, availableProviders);
        bestProvider = routingResult.provider;
        bestModel = routingResult.model;
        reasoning = routingResult.reasoning;
      }

      if (!bestProvider) {
        throw new Error('No suitable provider found for the request');
      }

      // Estimate cost
      const estimatedCost = this.estimateCost(bestProvider, prompt.length, options.maxTokens || 1000);

      const decision: RoutingDecision = {
        provider: bestProvider.name,
        model: bestModel,
        estimatedCost,
        reasoning,
        fallbackProviders: availableProviders
          .filter(p => p.name !== bestProvider.name)
          .map(p => p.name),
        metadata: {
          promptLength: prompt.length,
          requestedModel: options.model,
          costPriority: options.costPriority,
          speedPriority: options.speedPriority,
          capabilities: options.capabilities
        }
      };

      // Record routing decision
      this.routingHistory.push(decision);


      return decision;

    } catch (error) {

      throw new Error(`Routing determination failed: ${(error as Error).message}`);
    }
  }

  /**
   * Intelligent routing algorithm
   */
  private intelligentRouting(
    prompt: string,
    options: any,
    providers: ProviderConfig[]
  ): { provider: ProviderConfig; model: string; reasoning: string } {
    let bestScore = -1;
    let bestProvider: ProviderConfig = providers[0];
    let bestModel = providers[0].models[0];
    let reasoning = '';

    for (const provider of providers) {
      for (const model of provider.models) {
        let score = 0;

        // Cost scoring (lower cost = higher score)
        const costScore = Math.max(0, 100 - (provider.costPerToken * 1000));
        score += costScore * (options.costPriority === 'high' ? 2 : options.costPriority === 'low' ? 0.5 : 1);

        // Speed scoring (lower response time = higher score)
        const speedScore = Math.max(0, 100 - (provider.responseTime / 10));
        score += speedScore * (options.speedPriority === 'high' ? 2 : options.speedPriority === 'low' ? 0.5 : 1);

        // Capability matching
        if (options.capabilities) {
          const capabilityMatch = options.capabilities.some((cap: string) =>
            model.toLowerCase().includes(cap.toLowerCase())
          );
          if (capabilityMatch) score += 50;
        }

        // Prompt analysis
        if (prompt.length > 1000 && provider.maxTokens > 4000) {
          score += 30; // Prefer providers that can handle long prompts
        }

        if (score > bestScore) {
          bestScore = score;
          bestProvider = provider;
          bestModel = model;
          reasoning = `Selected ${provider.name} with model ${model} (score: ${score.toFixed(0)})`;
        }
      }
    }

    return { provider: bestProvider, model: bestModel, reasoning };
  }

  /**
   * Estimate cost for a request
   */
  private estimateCost(provider: ProviderConfig, promptLength: number, maxTokens: number): number {
    const estimatedTokens = Math.min(promptLength + maxTokens, provider.maxTokens);
    return estimatedTokens * provider.costPerToken;
  }

  /**
   * Record actual cost and update metrics
   */
  recordActualCost(providerName: string, model: string, actualCost: number, tokensUsed: number): void {
    // Update cost metrics
    this.costMetrics.totalRequests += 1;
    this.costMetrics.totalCost += actualCost;
    this.costMetrics.averageCostPerRequest = this.costMetrics.totalCost / this.costMetrics.totalRequests;

    // Update provider costs
    this.costMetrics.costByProvider[providerName] = (this.costMetrics.costByProvider[providerName] || 0) + actualCost;
    this.costMetrics.costByModel[model] = (this.costMetrics.costByModel[model] || 0) + actualCost;

    // Calculate potential savings (compared to using most expensive provider)
    const mostExpensiveRate = Math.max(...Array.from(this.providers.values()).map(p => p.costPerToken));
    const cheapestRate = Math.min(...Array.from(this.providers.values()).map(p => p.costPerToken));
    this.costMetrics.savings = this.costMetrics.totalCost * ((mostExpensiveRate - cheapestRate) / mostExpensiveRate);
  }

  /**
   * Health check for providers
   */
  async healthCheck(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) return false;

    try {
      const startTime = Date.now();

      // Simple health check - try to get models list
      // In a real implementation, this would make an actual API call
      const responseTime = Date.now() - startTime;

      provider.health = responseTime < 5000 ? 'healthy' : 'degraded';
      provider.lastHealthCheck = new Date();
      provider.responseTime = responseTime;

      return provider.health === 'healthy';
    } catch (error) {
      provider.health = 'unhealthy';
      provider.lastHealthCheck = new Date();

      return false;
    }
  }

  /**
   * Get cost metrics and analytics
   */
  getCostMetrics(): CostMetrics {
    return { ...this.costMetrics };
  }

  /**
   * Get routing analytics
   */
  getRoutingAnalytics(hours = 24): {
    totalRequests: number;
    providerUsage: Record<string, number>;
    averageResponseTime: number;
    topModels: string[];
  } {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const recentDecisions = this.routingHistory.filter(d => new Date(d.metadata?.timestamp || 0) > cutoffTime);

    const providerUsage: Record<string, number> = {};
    recentDecisions.forEach(decision => {
      providerUsage[decision.provider] = (providerUsage[decision.provider] || 0) + 1;
    });

    const modelUsage: Record<string, number> = {};
    recentDecisions.forEach(decision => {
      modelUsage[decision.model] = (modelUsage[decision.model] || 0) + 1;
    });

    const topModels = Object.entries(modelUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([model]) => model);

    return {
      totalRequests: recentDecisions.length,
      providerUsage,
      averageResponseTime: Array.from(this.providers.values())
        .reduce((sum, p) => sum + p.responseTime, 0) / this.providers.size,
      topModels
    };
  }

  /**
   * Get available providers and their status
   */
  getAvailableProviders(): Array<{
    name: string;
    models: string[];
    health: string;
    costPerToken: number;
    responseTime: number;
  }> {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.name,
      models: provider.models,
      health: provider.health,
      costPerToken: provider.costPerToken,
      responseTime: provider.responseTime
    }));
  }

  /**
   * Add or update a provider
   */
  addProvider(config: Omit<ProviderConfig, 'health' | 'lastHealthCheck' | 'responseTime'>): void {
    this.providers.set(config.name, {
      ...config,
      health: 'healthy',
      lastHealthCheck: new Date(),
      responseTime: 1000
    });


  }

  /**
   * Remove a provider
   */
  removeProvider(providerName: string): boolean {
    const deleted = this.providers.delete(providerName);
    if (deleted) {

    }
    return deleted;
  }
}

// Export singleton instance
export const liteLLMService = new LiteLLMService();

