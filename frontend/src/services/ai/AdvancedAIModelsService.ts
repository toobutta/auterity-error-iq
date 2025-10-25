/**
 * Advanced AI Models Service
 * Multi-provider AI integration with intelligent routing and model selection
 */

import { ContinueDevService, GeneratedCode, CompletionItem, CodeAnalysis, CodeContext } from '../continueDevService';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  version: string;
  contextLength: number;
  capabilities: AICapability[];
  costPerToken: number;
  performance: ModelPerformance;
  supportedLanguages: string[];
  isAvailable: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyRequired: boolean;
  rateLimits: RateLimit;
  models: AIModel[];
  status: ProviderStatus;
}

export interface AICapability {
  type: 'completion' | 'generation' | 'analysis' | 'chat' | 'embedding' | 'vision';
  quality: 'low' | 'medium' | 'high';
  speed: 'slow' | 'medium' | 'fast';
  cost: 'low' | 'medium' | 'high';
}

export interface ModelPerformance {
  latency: number; // milliseconds
  throughput: number; // tokens per second
  accuracy: number; // 0-1
  reliability: number; // 0-1
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  tokensPerMinute: number;
  tokensPerHour: number;
}

export interface ProviderStatus {
  operational: boolean;
  lastChecked: Date;
  responseTime: number;
  errorRate: number;
}

export interface AIRequest {
  type: 'completion' | 'generation' | 'analysis' | 'chat';
  prompt: string;
  context?: CodeContext;
  language?: string;
  preferences?: AIRequestPreferences;
  timeout?: number;
}

export interface AIRequestPreferences {
  model?: string;
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  quality?: 'speed' | 'balanced' | 'quality';
  cost?: 'low' | 'medium' | 'high';
}

export interface AIResponse {
  content: string;
  model: AIModel;
  provider: AIProvider;
  usage: TokenUsage;
  metadata: ResponseMetadata;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface ResponseMetadata {
  latency: number;
  timestamp: Date;
  requestId: string;
  cached: boolean;
}

export class AdvancedAIModelsService extends ContinueDevService {
  private providers: Map<string, AIProvider> = new Map();
  private models: Map<string, AIModel> = new Map();
  private activeModel: AIModel | null = null;
  private requestHistory: AIResponse[] = [];
  private performanceMetrics: Map<string, ModelPerformance> = new Map();

  constructor() {
    super();
    this.initializeProviders();
    this.initializeModels();
    this.startHealthMonitoring();
  }

  // Provider Management
  private async initializeProviders(): Promise<void> {
    const providers: AIProvider[] = [
      {
        id: 'anthropic',
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com',
        apiKeyRequired: true,
        rateLimits: {
          requestsPerMinute: 50,
          requestsPerHour: 1000,
          tokensPerMinute: 40000,
          tokensPerHour: 200000
        },
        models: [],
        status: {
          operational: true,
          lastChecked: new Date(),
          responseTime: 0,
          errorRate: 0
        }
      },
      {
        id: 'openai',
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com',
        apiKeyRequired: true,
        rateLimits: {
          requestsPerMinute: 3500,
          requestsPerHour: 60000,
          tokensPerMinute: 90000,
          tokensPerHour: 150000
        },
        models: [],
        status: {
          operational: true,
          lastChecked: new Date(),
          responseTime: 0,
          errorRate: 0
        }
      },
      {
        id: 'google',
        name: 'Google AI',
        baseUrl: 'https://generativelanguage.googleapis.com',
        apiKeyRequired: true,
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 1000,
          tokensPerMinute: 30000,
          tokensPerHour: 100000
        },
        models: [],
        status: {
          operational: true,
          lastChecked: new Date(),
          responseTime: 0,
          errorRate: 0
        }
      },
      {
        id: 'cohere',
        name: 'Cohere',
        baseUrl: 'https://api.cohere.ai',
        apiKeyRequired: true,
        rateLimits: {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          tokensPerMinute: 20000,
          tokensPerHour: 100000
        },
        models: [],
        status: {
          operational: true,
          lastChecked: new Date(),
          responseTime: 0,
          errorRate: 0
        }
      },
      {
        id: 'ollama',
        name: 'Ollama (Local)',
        baseUrl: 'http://localhost:11434',
        apiKeyRequired: false,
        rateLimits: {
          requestsPerMinute: 1000,
          requestsPerHour: 10000,
          tokensPerMinute: 100000,
          tokensPerHour: 1000000
        },
        models: [],
        status: {
          operational: false,
          lastChecked: new Date(),
          responseTime: 0,
          errorRate: 0
        }
      }
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  private async initializeModels(): Promise<void> {
    const models: AIModel[] = [
      // Anthropic Models
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: this.providers.get('anthropic')!,
        version: '20240229',
        contextLength: 200000,
        capabilities: [
          { type: 'completion', quality: 'high', speed: 'medium', cost: 'high' },
          { type: 'generation', quality: 'high', speed: 'medium', cost: 'high' },
          { type: 'analysis', quality: 'high', speed: 'medium', cost: 'high' },
          { type: 'chat', quality: 'high', speed: 'medium', cost: 'high' }
        ],
        costPerToken: 0.000015,
        performance: { latency: 2000, throughput: 50, accuracy: 0.95, reliability: 0.99 },
        supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'php', 'ruby', 'swift'],
        isAvailable: true
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: this.providers.get('anthropic')!,
        version: '20240229',
        contextLength: 200000,
        capabilities: [
          { type: 'completion', quality: 'high', speed: 'fast', cost: 'medium' },
          { type: 'generation', quality: 'high', speed: 'fast', cost: 'medium' },
          { type: 'analysis', quality: 'high', speed: 'fast', cost: 'medium' },
          { type: 'chat', quality: 'high', speed: 'fast', cost: 'medium' }
        ],
        costPerToken: 0.000003,
        performance: { latency: 1000, throughput: 80, accuracy: 0.93, reliability: 0.98 },
        supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'php', 'ruby', 'swift'],
        isAvailable: true
      },

      // OpenAI Models
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: this.providers.get('openai')!,
        version: '0125-preview',
        contextLength: 128000,
        capabilities: [
          { type: 'completion', quality: 'high', speed: 'medium', cost: 'high' },
          { type: 'generation', quality: 'high', speed: 'medium', cost: 'high' },
          { type: 'analysis', quality: 'high', speed: 'medium', cost: 'high' },
          { type: 'chat', quality: 'high', speed: 'medium', cost: 'high' }
        ],
        costPerToken: 0.00001,
        performance: { latency: 2500, throughput: 40, accuracy: 0.94, reliability: 0.97 },
        supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala'],
        isAvailable: true
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: this.providers.get('openai')!,
        version: '0125',
        contextLength: 16385,
        capabilities: [
          { type: 'completion', quality: 'medium', speed: 'fast', cost: 'low' },
          { type: 'generation', quality: 'medium', speed: 'fast', cost: 'low' },
          { type: 'analysis', quality: 'medium', speed: 'fast', cost: 'low' },
          { type: 'chat', quality: 'medium', speed: 'fast', cost: 'low' }
        ],
        costPerToken: 0.000002,
        performance: { latency: 800, throughput: 100, accuracy: 0.88, reliability: 0.95 },
        supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala'],
        isAvailable: true
      },

      // Local Models (Ollama)
      {
        id: 'codellama-34b',
        name: 'CodeLlama 34B',
        provider: this.providers.get('ollama')!,
        version: 'latest',
        contextLength: 16000,
        capabilities: [
          { type: 'completion', quality: 'high', speed: 'medium', cost: 'low' },
          { type: 'generation', quality: 'high', speed: 'medium', cost: 'low' },
          { type: 'analysis', quality: 'high', speed: 'medium', cost: 'low' }
        ],
        costPerToken: 0,
        performance: { latency: 1500, throughput: 30, accuracy: 0.90, reliability: 0.95 },
        supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust', 'php', 'ruby'],
        isAvailable: false
      }
    ];

    models.forEach(model => {
      this.models.set(model.id, model);
      // Add model to provider
      const provider = this.providers.get(model.provider.id);
      if (provider) {
        provider.models.push(model);
      }
    });
  }

  // Intelligent Model Selection
  async selectBestModel(request: AIRequest): Promise<AIModel> {
    const availableModels = Array.from(this.models.values())
      .filter(model => model.isAvailable);

    if (availableModels.length === 0) {
      throw new Error('No AI models available');
    }

    // If specific model requested
    if (request.preferences?.model) {
      const requestedModel = this.models.get(request.preferences.model);
      if (requestedModel && requestedModel.isAvailable) {
        return requestedModel;
      }
    }

    // Intelligent selection based on request type and preferences
    const scoredModels = availableModels.map(model => ({
      model,
      score: this.calculateModelScore(model, request)
    }));

    scoredModels.sort((a, b) => b.score - a.score);
    return scoredModels[0].model;
  }

  private calculateModelScore(model: AIModel, request: AIRequest): number {
    let score = 0;

    // Language support
    if (request.language && model.supportedLanguages.includes(request.language)) {
      score += 20;
    }

    // Capability match
    const capability = model.capabilities.find(cap => cap.type === request.type);
    if (capability) {
      // Quality preference
      if (request.preferences?.quality) {
        if (request.preferences.quality === 'speed' && capability.speed === 'fast') score += 15;
        if (request.preferences.quality === 'balanced' && capability.quality === 'high' && capability.speed === 'medium') score += 15;
        if (request.preferences.quality === 'quality' && capability.quality === 'high') score += 15;
      }

      // Cost preference
      if (request.preferences?.cost) {
        if (request.preferences.cost === 'low' && capability.cost === 'low') score += 10;
        if (request.preferences.cost === 'medium' && capability.cost === 'medium') score += 10;
        if (request.preferences.cost === 'high' && capability.cost === 'high') score += 10;
      }
    }

    // Performance metrics
    score += model.performance.accuracy * 10;
    score += model.performance.reliability * 5;
    score += (model.performance.latency < 2000 ? 10 : 5);

    // Context length
    if (request.context && request.context.files) {
      const totalContent = request.context.files.reduce((sum, file) => sum + file.content.length, 0);
      if (totalContent < model.contextLength * 0.8) {
        score += 15;
      }
    }

    // Provider preference
    if (request.preferences?.provider && model.provider.id === request.preferences.provider) {
      score += 25;
    }

    return score;
  }

  // Enhanced Code Generation
  async generateCode(prompt: string, context?: CodeContext): Promise<GeneratedCode> {
    const request: AIRequest = {
      type: 'generation',
      prompt,
      context,
      language: context?.files[0]?.language
    };

    const model = await this.selectBestModel(request);
    const startTime = Date.now();

    try {
      const response = await this.callModel(model, request);
      const latency = Date.now() - startTime;

      // Update performance metrics
      this.updatePerformanceMetrics(model.id, latency, true);

      // Store in history
      this.requestHistory.push({
        content: response.content,
        model,
        provider: model.provider,
        usage: response.usage,
        metadata: response.metadata
      });

      return {
        code: response.content,
        explanation: `Generated by ${model.name} (${model.provider.name})`,
        suggestions: ['Review generated code', 'Run tests', 'Check for edge cases'],
        confidence: 0.9
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updatePerformanceMetrics(model.id, latency, false);
      throw error;
    }
  }

  async getCompletions(context: {
    code: string;
    position: { lineNumber: number; column: number };
    language: string;
  }): Promise<CompletionItem[]> {
    const request: AIRequest = {
      type: 'completion',
      prompt: context.code,
      language: context.language,
      preferences: { quality: 'speed' }
    };

    const model = await this.selectBestModel(request);

    try {
      const response = await this.callModel(model, request);
      return this.parseCompletions(response.content);
    } catch (error) {
      console.error('Completion error:', error);
      return [];
    }
  }

  async analyzeCode(code: string, language?: string): Promise<CodeAnalysis> {
    const request: AIRequest = {
      type: 'analysis',
      prompt: `Analyze this ${language || 'code'} for issues, improvements, and best practices:\n\n${code}`,
      language
    };

    const model = await this.selectBestModel(request);

    try {
      const response = await this.callModel(model, request);
      return this.parseAnalysis(response.content);
    } catch (error) {
      console.error('Analysis error:', error);
      return {
        issues: [],
        suggestions: [],
        metrics: { complexity: 0, maintainability: 0, performance: 0 }
      };
    }
  }

  // Model Communication
  private async callModel(model: AIModel, request: AIRequest): Promise<AIResponse> {
    const provider = model.provider;
    const startTime = Date.now();

    try {
      let response: any;

      switch (provider.id) {
        case 'anthropic':
          response = await this.callAnthropic(model, request);
          break;
        case 'openai':
          response = await this.callOpenAI(model, request);
          break;
        case 'google':
          response = await this.callGoogle(model, request);
          break;
        case 'cohere':
          response = await this.callCohere(model, request);
          break;
        case 'ollama':
          response = await this.callOllama(model, request);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider.id}`);
      }

      const latency = Date.now() - startTime;

      return {
        content: response.content,
        model,
        provider,
        usage: response.usage,
        metadata: {
          latency,
          timestamp: new Date(),
          requestId: this.generateRequestId(),
          cached: false
        }
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updatePerformanceMetrics(model.id, latency, false);
      throw error;
    }
  }

  private async callAnthropic(model: AIModel, request: AIRequest): Promise<any> {
    // Implementation for Anthropic API
    const response = await fetch(`${model.provider.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: request.preferences?.maxTokens || 4096,
        temperature: request.preferences?.temperature || 0.3,
        messages: [{
          role: 'user',
          content: request.prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        cost: (data.usage.input_tokens + data.usage.output_tokens) * model.costPerToken
      }
    };
  }

  private async callOpenAI(model: AIModel, request: AIRequest): Promise<any> {
    // Implementation for OpenAI API
    const response = await fetch(`${model.provider.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: model.id,
        messages: [{
          role: 'user',
          content: request.prompt
        }],
        max_tokens: request.preferences?.maxTokens || 4096,
        temperature: request.preferences?.temperature || 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    return {
      content: choice.message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        cost: data.usage.total_tokens * model.costPerToken
      }
    };
  }

  private async callGoogle(model: AIModel, request: AIRequest): Promise<any> {
    // Implementation for Google AI API
    const response = await fetch(`${model.provider.baseUrl}/v1beta/models/${model.id}:generateContent?key=${process.env.REACT_APP_GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: request.prompt
          }]
        }],
        generationConfig: {
          temperature: request.preferences?.temperature || 0.3,
          maxOutputTokens: request.preferences?.maxTokens || 4096
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text,
      usage: {
        promptTokens: Math.ceil(request.prompt.length / 4),
        completionTokens: Math.ceil(data.candidates[0].content.parts[0].text.length / 4),
        totalTokens: Math.ceil((request.prompt.length + data.candidates[0].content.parts[0].text.length) / 4),
        cost: Math.ceil((request.prompt.length + data.candidates[0].content.parts[0].text.length) / 4) * model.costPerToken
      }
    };
  }

  private async callCohere(model: AIModel, request: AIRequest): Promise<any> {
    // Implementation for Cohere API
    const response = await fetch(`${model.provider.baseUrl}/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_COHERE_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: model.id,
        prompt: request.prompt,
        max_tokens: request.preferences?.maxTokens || 4096,
        temperature: request.preferences?.temperature || 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.generations[0].text,
      usage: {
        promptTokens: Math.ceil(request.prompt.length / 4),
        completionTokens: data.meta.billed_units.output_tokens,
        totalTokens: Math.ceil(request.prompt.length / 4) + data.meta.billed_units.output_tokens,
        cost: (Math.ceil(request.prompt.length / 4) + data.meta.billed_units.output_tokens) * model.costPerToken
      }
    };
  }

  private async callOllama(model: AIModel, request: AIRequest): Promise<any> {
    // Implementation for Ollama API
    const response = await fetch(`${model.provider.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.id,
        prompt: request.prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response,
      usage: {
        promptTokens: Math.ceil(request.prompt.length / 4),
        completionTokens: Math.ceil(data.response.length / 4),
        totalTokens: Math.ceil((request.prompt.length + data.response.length) / 4),
        cost: 0 // Local model, no cost
      }
    };
  }

  // Utility Methods
  private parseCompletions(content: string): CompletionItem[] {
    // Parse completion suggestions from AI response
    const lines = content.split('\n').filter(line => line.trim());
    return lines.slice(0, 10).map((line, index) => ({
      label: line.trim(),
      kind: 'snippet',
      detail: `Suggestion ${index + 1}`,
      insertText: line.trim(),
      range: undefined
    }));
  }

  private parseAnalysis(content: string): CodeAnalysis {
    // Parse analysis results from AI response
    // This would be more sophisticated in a real implementation
    return {
      issues: [],
      suggestions: [{
        type: 'refactor',
        description: 'Consider using more descriptive variable names',
        range: undefined,
        newText: undefined
      }],
      metrics: {
        complexity: 5,
        maintainability: 85,
        performance: 90
      }
    };
  }

  private updatePerformanceMetrics(modelId: string, latency: number, success: boolean): void {
    const currentMetrics = this.performanceMetrics.get(modelId) || {
      latency: 0,
      throughput: 0,
      accuracy: 0,
      reliability: 0
    };

    // Update metrics (simplified implementation)
    currentMetrics.latency = (currentMetrics.latency + latency) / 2;
    currentMetrics.reliability = success ?
      Math.min(1, currentMetrics.reliability + 0.01) :
      Math.max(0, currentMetrics.reliability - 0.01);

    this.performanceMetrics.set(modelId, currentMetrics);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startHealthMonitoring(): void {
    // Monitor provider health every 5 minutes
    setInterval(async () => {
      for (const [providerId, provider] of this.providers) {
        try {
          const startTime = Date.now();
          // Simple health check
          const response = await fetch(`${provider.baseUrl}/health`, {
            timeout: 5000
          });
          const responseTime = Date.now() - startTime;

          provider.status = {
            operational: response.ok,
            lastChecked: new Date(),
            responseTime,
            errorRate: response.ok ? 0 : 1
          };
        } catch (error) {
          provider.status = {
            operational: false,
            lastChecked: new Date(),
            responseTime: 0,
            errorRate: 1
          };
        }
      }
    }, 5 * 60 * 1000);
  }

  // Public API
  getAvailableModels(): AIModel[] {
    return Array.from(this.models.values()).filter(model => model.isAvailable);
  }

  getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getActiveModel(): AIModel | null {
    return this.activeModel;
  }

  async setActiveModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (model && model.isAvailable) {
      this.activeModel = model;
    } else {
      throw new Error(`Model ${modelId} not available`);
    }
  }

  getRequestHistory(): AIResponse[] {
    return [...this.requestHistory];
  }

  getPerformanceMetrics(): Map<string, ModelPerformance> {
    return new Map(this.performanceMetrics);
  }
}
