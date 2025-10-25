/**
 * AI SDK Integration Service
 *
 * Provides unified AI capabilities using Vercel AI SDK with:
 * - Multi-provider support (OpenAI, Anthropic, Azure, Google, Cohere)
 * - Structured outputs for workflow optimization
 * - Tool calling for CRM and workflow operations
 * - Streaming responses for real-time interaction
 * - Cost tracking and performance metrics
 */

import { generateText, generateObject, streamText, tool, CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { azure } from '@ai-sdk/azure';
import { google } from '@ai-sdk/google';
import { cohere } from '@ai-sdk/cohere';
import { z } from 'zod';

// Import LangChain for integration
import { ChatOpenAI, ChatAnthropic, ChatGoogleGenerativeAI } from "@langchain/core/language_models/chat_models";

// Environment configuration
const AI_CONFIG = {
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    enabled: !!import.meta.env.VITE_OPENAI_API_KEY
  },
  anthropic: {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    enabled: !!import.meta.env.VITE_ANTHROPIC_API_KEY
  },
  google: {
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
    enabled: !!import.meta.env.VITE_GOOGLE_API_KEY
  },
  azure: {
    endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || '',
    apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || '',
    apiVersion: import.meta.env.VITE_AZURE_OPENAI_VERSION || '2024-02-15-preview',
    enabled: !!(import.meta.env.VITE_AZURE_OPENAI_ENDPOINT && import.meta.env.VITE_AZURE_OPENAI_API_KEY)
  },
  cohere: {
    apiKey: import.meta.env.VITE_COHERE_API_KEY || '',
    enabled: !!import.meta.env.VITE_COHERE_API_KEY
  },
  ollama: {
    endpoint: import.meta.env.VITE_OLLAMA_ENDPOINT || 'http://localhost:11434',
    model: import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2:3b',
    enabled: import.meta.env.VITE_ENABLE_AI_ASSISTANT !== 'false'
  },
  features: {
    aiAssistant: import.meta.env.VITE_ENABLE_AI_ASSISTANT !== 'false',
    costTracking: import.meta.env.VITE_ENABLE_COST_TRACKING !== 'false',
    healthCheck: import.meta.env.VITE_ENABLE_PROVIDER_HEALTH_CHECK !== 'false',
    defaultProvider: import.meta.env.VITE_DEFAULT_AI_PROVIDER || 'ollama'
  },
  performance: {
    timeout: parseInt(import.meta.env.VITE_AI_REQUEST_TIMEOUT || '30000'),
    maxRetries: parseInt(import.meta.env.VITE_AI_MAX_RETRIES || '3'),
    batchSize: parseInt(import.meta.env.VITE_AI_BATCH_SIZE || '10')
  }
};

// Dynamic Ollama import for local AI
let ollamaModule: any = null;
try {
  ollamaModule = require('ollama');
} catch (error) {
  console.warn('Ollama not available:', error instanceof Error ? error.message : 'Unknown error');
}

// Enhanced Provider configuration with Ollama support
const PROVIDERS = {
  openai: openai('gpt-4o'),
  anthropic: anthropic('claude-3-5-sonnet-20241022'),
  azure: azure('gpt-4o'),
  google: google('gemini-1.5-pro'),
  cohere: cohere('command-r-plus')
} as const;

// LangChain Provider configuration for unified access
const LANGCHAIN_PROVIDERS = {
  openai: new ChatOpenAI({
    openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
  }),
  anthropic: new ChatAnthropic({
    anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    modelName: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 1000,
  }),
  google: new ChatGoogleGenerativeAI({
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    modelName: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 1000,
  })
} as const;

// Ollama provider setup (dynamic based on environment)
const initializeOllama = () => {
  if (ollamaModule && AI_CONFIG.ollama.enabled) {
    try {
      const { createOllama } = ollamaModule;
      return createOllama({
        baseURL: AI_CONFIG.ollama.endpoint
      });
    } catch (error) {
      console.warn('Failed to initialize Ollama:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }
  return null;
};

type ProviderKey = keyof typeof PROVIDERS | 'ollama';

// Workflow optimization schema
const WorkflowOptimizationSchema = z.object({
  workflowId: z.string(),
  optimizationType: z.enum(['performance', 'cost', 'reliability', 'comprehensive']),
  improvements: z.object({
    performanceGain: z.number().min(0).max(1),
    costReduction: z.number().min(0).max(1),
    resourceEfficiency: z.number().min(0).max(1),
    qualityScore: z.number().min(0).max(1)
  }),
  confidence: z.number().min(0).max(1),
  estimatedSavings: z.object({
    timeMinutes: z.number(),
    costUSD: z.number(),
    resources: z.object({
      cpu: z.number(),
      memory: z.number(),
      storage: z.number(),
      network: z.number()
    })
  }),
  appliedOptimizations: z.array(z.object({
    type: z.string(),
    description: z.string(),
    impact: z.number(),
    confidence: z.number()
  })),
  nextRecommendations: z.array(z.object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    estimatedImpact: z.number()
  })),
  timestamp: z.number()
});

// Workflow generation schema
const WorkflowGenerationSchema = z.object({
  title: z.string(),
  description: z.string(),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.record(z.string(), z.unknown())
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string().optional()
  })),
  metadata: z.object({
    estimatedDuration: z.number(),
    complexity: z.enum(['simple', 'medium', 'complex']),
    tags: z.array(z.string())
  })
});

// Tool definitions for workflow operations (simplified for now)
const workflowTools = {
  createNode: 'Create a new node in the workflow',
  optimizeWorkflow: 'Apply optimizations to the workflow',
  generateQuery: 'Generate a database query',
  sendNotification: 'Send a notification to users'
};

export class AISDKService {
  private currentProvider: ProviderKey = 'openai';
  private costTracker = new Map<string, number>();
  private ollamaProvider: any = null;
  private availableProviders: Record<string, any> = {};
  private langChainProviders: Record<string, any> = {};
  private frameworkMappings: Map<string, string> = new Map();

  constructor() {
    // Initialize providers
    this.initializeProviders();
    this.initializeLangChainProviders();
    this.initializeFrameworkMappings();
    // Set default provider
    this.setProvider('openai');
  }

  private initializeProviders(): void {
    // Copy base providers
    this.availableProviders = { ...PROVIDERS };

    // Initialize Ollama if available
    this.ollamaProvider = initializeOllama();
    if (this.ollamaProvider) {
      this.availableProviders.ollama = this.ollamaProvider('llama3.1:8b');
    }
  }

  private initializeLangChainProviders(): void {
    // Initialize LangChain providers that are available
    if (AI_CONFIG.openai.enabled) {
      this.langChainProviders.openai = LANGCHAIN_PROVIDERS.openai;
    }
    if (AI_CONFIG.anthropic.enabled) {
      this.langChainProviders.anthropic = LANGCHAIN_PROVIDERS.anthropic;
    }
    if (AI_CONFIG.google.enabled) {
      this.langChainProviders.google = LANGCHAIN_PROVIDERS.google;
    }
  }

  private initializeFrameworkMappings(): void {
    // Map AI SDK providers to LangChain equivalents
    this.frameworkMappings.set('ai-sdk-openai', 'langchain-openai');
    this.frameworkMappings.set('ai-sdk-anthropic', 'langchain-anthropic');
    this.frameworkMappings.set('ai-sdk-google', 'langchain-google');

    // Map provider aliases
    this.frameworkMappings.set('gpt-4', 'openai');
    this.frameworkMappings.set('claude-3', 'anthropic');
    this.frameworkMappings.set('gemini', 'google');
    this.frameworkMappings.set('ollama', 'ollama');
  }

  /**
   * Set the AI provider to use
   */
  setProvider(provider: ProviderKey): void {
    if (!this.availableProviders[provider]) {
      throw new Error(`Provider ${provider} not supported or not available`);
    }
    this.currentProvider = provider;
  }

  /**
   * Get available providers
   */
  getProviders(): ProviderKey[] {
    return Object.keys(this.availableProviders) as ProviderKey[];
  }

  /**
   * Get available LangChain providers
   */
  getLangChainProviders(): string[] {
    return Object.keys(this.langChainProviders);
  }

  /**
   * Get a LangChain provider
   */
  getLangChainProvider(provider: string): any {
    const mappedProvider = this.frameworkMappings.get(provider) || provider;
    return this.langChainProviders[mappedProvider];
  }

  /**
   * Check for framework conflicts
   */
  checkFrameworkConflicts(): { conflicts: string[], warnings: string[] } {
    const conflicts: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate provider configurations
    const aiSdkProviders = new Set(Object.keys(this.availableProviders));
    const langChainProviders = new Set(Object.keys(this.langChainProviders));

    // Find providers that exist in both frameworks
    const commonProviders = [...aiSdkProviders].filter(provider =>
      langChainProviders.has(provider) || langChainProviders.has(this.frameworkMappings.get(provider) || '')
    );

    if (commonProviders.length > 0) {
      warnings.push(`Providers configured in both AI SDK and LangChain: ${commonProviders.join(', ')}`);
    }

    // Check for missing API keys
    const providersWithoutKeys = [];
    if (AI_CONFIG.openai.enabled && !AI_CONFIG.openai.apiKey) {
      providersWithoutKeys.push('openai');
    }
    if (AI_CONFIG.anthropic.enabled && !AI_CONFIG.anthropic.apiKey) {
      providersWithoutKeys.push('anthropic');
    }
    if (AI_CONFIG.google.enabled && !AI_CONFIG.google.apiKey) {
      providersWithoutKeys.push('google');
    }

    if (providersWithoutKeys.length > 0) {
      conflicts.push(`Providers enabled but missing API keys: ${providersWithoutKeys.join(', ')}`);
    }

    return { conflicts, warnings };
  }

  /**
   * Get unified provider status
   */
  getUnifiedProviderStatus(): Record<string, { aiSdk: boolean, langChain: boolean, conflicts: string[] }> {
    const status: Record<string, { aiSdk: boolean, langChain: boolean, conflicts: string[] }> = {};

    // Check all possible providers
    const allProviders = ['openai', 'anthropic', 'google', 'azure', 'cohere', 'ollama'];

    for (const provider of allProviders) {
      const aiSdkAvailable = !!this.availableProviders[provider];
      const langChainAvailable = !!this.langChainProviders[provider];
      const conflicts: string[] = [];

      // Check for configuration conflicts
      if (aiSdkAvailable && langChainAvailable) {
        conflicts.push('Duplicate configuration');
      }

      // Check for API key availability
      const config = AI_CONFIG[provider as keyof typeof AI_CONFIG];
      if (config && config.enabled && !config.apiKey) {
        conflicts.push('Missing API key');
      }

      status[provider] = {
        aiSdk: aiSdkAvailable,
        langChain: langChainAvailable,
        conflicts
      };
    }

    return status;
  }

  /**
   * Get current provider model
   */
  private getCurrentModel(): any {
    return this.availableProviders[this.currentProvider];
  }

  /**
   * Check if Ollama is available
   */
  isOllamaAvailable(): boolean {
    return this.ollamaProvider !== null;
  }

  /**
   * Generate workflow optimization with structured output
   */
  async optimizeWorkflow(workflowData: any): Promise<z.infer<typeof WorkflowOptimizationSchema>> {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `You are an expert workflow optimization AI. Analyze the provided workflow data and generate comprehensive optimization recommendations with structured output.`
      },
      {
        role: 'user',
        content: `Analyze this workflow and provide optimization recommendations:

Workflow Data: ${JSON.stringify(workflowData, null, 2)}

Provide detailed optimization analysis including performance gains, cost reductions, and specific recommendations.`
      }
    ];

    const result = await generateObject({
      model: this.getCurrentModel(),
      schema: WorkflowOptimizationSchema,
      messages,
      temperature: 0.3
    });

    // Track cost (mock implementation)
    this.trackCost('optimizeWorkflow', 0.05);

    return result.object;
  }

  /**
   * Generate a complete workflow from natural language description
   */
  async generateWorkflow(description: string): Promise<z.infer<typeof WorkflowGenerationSchema>> {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `You are an expert workflow designer. Generate complete workflow definitions from natural language descriptions. Include nodes, edges, and metadata.`
      },
      {
        role: 'user',
        content: `Create a complete workflow based on this description: "${description}"

Generate a detailed workflow with appropriate nodes, connections, and metadata.`
      }
    ];

    const result = await generateObject({
      model: this.getCurrentModel(),
      schema: WorkflowGenerationSchema,
      messages,
      temperature: 0.7
    });

    this.trackCost('generateWorkflow', 0.08);

    return result.object;
  }

  /**
   * Generate streaming text response for chat interactions
   */
  async *generateChatResponse(
    messages: CoreMessage[],
    context?: any
  ): AsyncGenerator<string, void, unknown> {
    const systemMessage: CoreMessage = {
      role: 'system',
      content: `You are an expert workflow assistant. Help users build, optimize, and manage workflows.
      You have access to workflow operations and can suggest improvements.

      Available tools:
      - createNode: Create a new node in the workflow
      - optimizeWorkflow: Apply optimizations to the workflow
      - generateQuery: Generate a database query
      - sendNotification: Send a notification to users

      Context: ${context ? JSON.stringify(context) : 'No specific context provided'}`
    };

    const allMessages = [systemMessage, ...messages];

    const result = await streamText({
      model: this.getCurrentModel(),
      messages: allMessages,
      temperature: 0.7
    });

    this.trackCost('chatResponse', 0.03);

    for await (const delta of result.textStream) {
      yield delta;
    }
  }

  /**
   * Generate text response without streaming
   */
  async generateTextResponse(prompt: string, context?: any): Promise<string> {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `You are an expert workflow assistant. ${context ? `Context: ${JSON.stringify(context)}` : ''}`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const result = await generateText({
      model: this.getCurrentModel(),
      messages,
      temperature: 0.7
    });

    this.trackCost('textResponse', 0.02);

    return result.text;
  }

  /**
   * Get cost tracking information with provider breakdown
   */
  getCostSummary(): { 
    total: number; 
    byOperation: Record<string, number>;
    byProvider: Record<string, number>;
    savings: { ollama: number; total: number };
  } {
    const byOperation = Object.fromEntries(this.costTracker);
    const total = Array.from(this.costTracker.values()).reduce((sum, cost) => sum + cost, 0);
    
    // Calculate provider-specific costs
    const byProvider: Record<string, number> = {};
    const savings = { ollama: 0, total: 0 };
    
    // Estimate savings from Ollama usage (requests that would have cost money)
    const ollamaRequests = Array.from(this.costTracker.entries())
      .filter(([key]) => key.includes('ollama'))
      .reduce((sum, [, cost]) => sum + cost, 0);
    
    // If we're using Ollama, calculate potential savings
    if (this.currentProvider === 'ollama' || this.isOllamaAvailable()) {
      savings.ollama = ollamaRequests * 0.02; // Estimate $0.02 per request saved
      savings.total = savings.ollama;
    }

    return { total, byOperation, byProvider, savings };
  }

  /**
   * Reset cost tracking
   */
  resetCostTracking(): void {
    this.costTracker.clear();
  }

  /**
   * Check if AI features are enabled in configuration
   */
  isAIFeaturesEnabled(): boolean {
    return AI_CONFIG.features.aiAssistant;
  }

  /**
   * Check if cost tracking is enabled
   */
  isCostTrackingEnabled(): boolean {
    return AI_CONFIG.features.costTracking;
  }

  /**
   * Check if health checking is enabled
   */
  isHealthCheckEnabled(): boolean {
    return AI_CONFIG.features.healthCheck;
  }

  /**
   * Get the default AI provider from configuration
   */
  getDefaultProvider(): string {
    return AI_CONFIG.features.defaultProvider;
  }

  /**
   * Get available providers based on configuration
   */
  getAvailableProviders(): string[] {
    const providers: string[] = [];

    if (AI_CONFIG.openai.enabled) providers.push('openai');
    if (AI_CONFIG.anthropic.enabled) providers.push('anthropic');
    if (AI_CONFIG.google.enabled) providers.push('google');
    if (AI_CONFIG.azure.enabled) providers.push('azure');
    if (AI_CONFIG.cohere.enabled) providers.push('cohere');
    if (AI_CONFIG.ollama.enabled && this.isOllamaAvailable()) providers.push('ollama');

    return providers;
  }

  /**
   * Get comprehensive AI framework status
   */
  getAIFrameworkStatus(): {
    aiSdk: { providers: string[], status: string, conflicts: string[] },
    langChain: { providers: string[], status: string, conflicts: string[] },
    unified: { recommendations: string[], warnings: string[], critical: string[] }
  } {
    const aiSdkProviders = this.getProviders();
    const langChainProviders = this.getLangChainProviders();
    const frameworkConflicts = this.checkFrameworkConflicts();
    const unifiedStatus = this.getUnifiedProviderStatus();

    // Determine overall status
    const aiSdkStatus = aiSdkProviders.length > 0 ? 'operational' : 'no_providers';
    const langChainStatus = langChainProviders.length > 0 ? 'operational' : 'no_providers';

    // Generate recommendations
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const critical: string[] = [];

    // Check for critical issues
    if (aiSdkProviders.length === 0 && langChainProviders.length === 0) {
      critical.push('No AI providers configured - system will not function');
    }

    // Check for provider conflicts
    Object.entries(unifiedStatus).forEach(([provider, status]) => {
      if (status.conflicts.includes('Missing API key')) {
        critical.push(`Missing API key for ${provider}`);
      }
      if (status.conflicts.includes('Duplicate configuration')) {
        warnings.push(`Duplicate configuration for ${provider} in both frameworks`);
      }
    });

    // Recommendations
    if (aiSdkProviders.length > 0 && langChainProviders.length === 0) {
      recommendations.push('Consider adding LangChain providers for advanced workflow orchestration');
    }
    if (langChainProviders.length > 0 && aiSdkProviders.length === 0) {
      recommendations.push('Consider adding AI SDK providers for unified streaming and cost tracking');
    }
    if (aiSdkProviders.length > 0 && langChainProviders.length > 0) {
      recommendations.push('Both frameworks operational - use AI SDK for simple tasks, LangChain for complex workflows');
    }

    return {
      aiSdk: {
        providers: aiSdkProviders,
        status: aiSdkStatus,
        conflicts: frameworkConflicts.conflicts.filter(c => c.includes('AI SDK') || c.includes('Missing API key'))
      },
      langChain: {
        providers: langChainProviders,
        status: langChainStatus,
        conflicts: frameworkConflicts.conflicts.filter(c => c.includes('LangChain'))
      },
      unified: {
        recommendations,
        warnings: frameworkConflicts.warnings,
        critical
      }
    };
  }

  private trackCost(operation: string, cost: number): void {
    if (!this.isCostTrackingEnabled()) return;
    
    // Ollama is free, so track as 0 cost but still count usage
    const actualCost = this.currentProvider === 'ollama' ? 0 : cost;
    const key = `${operation}_${this.currentProvider}`;
    const current = this.costTracker.get(key) || 0;
    this.costTracker.set(key, current + actualCost);
  }
}

// Export singleton instance
export const aiSDKService = new AISDKService();
