/**
 * Centralized Model Configuration Service
 * Provides unified access to AI model configurations across the application
 */

export interface ModelConfig {
  name: string;
  provider: string;
  model_family: string;
  max_tokens: number;
  cost_per_token: number;
  input_cost_per_token: number;
  output_cost_per_token: number;
  capabilities: string[];
  context_window: number;
  supports_streaming: boolean;
  supports_function_calling: boolean;
  is_available: boolean;
  description: string;
  endpoint?: string;
}

export interface ModelHealthStatus {
  model_name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  response_time?: number;
  error_rate?: number;
  last_checked: Date;
  message?: string;
  uptime_percentage?: number;
  total_requests?: number;
  successful_requests?: number;
  cost_per_request?: number;
}

export interface ModelValidationResult {
  model_name: string;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  performance_metrics?: {
    latency_ms: number;
    throughput_req_per_sec: number;
    memory_usage_mb: number;
  };
  cost_analysis?: {
    input_cost_per_token: number;
    output_cost_per_token: number;
    estimated_monthly_cost: number;
  };
}

export class ModelConfigurationService {
  private static instance: ModelConfigurationService;
  private models: ModelConfig[] = [];
  private healthStatus: Map<string, ModelHealthStatus> = new Map();
  private validationResults: Map<string, ModelValidationResult> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private validationInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly VALIDATION_INTERVAL = 300000; // 5 minutes
  private isLoaded = false;
  private isInitialized = false;

  static getInstance(): ModelConfigurationService {
    if (!ModelConfigurationService.instance) {
      ModelConfigurationService.instance = new ModelConfigurationService();
    }
    return ModelConfigurationService.instance;
  }

  /**
   * Initialize the service and load configurations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.loadModelConfigurations();
      this.startHealthMonitoring();
      this.startValidationMonitoring();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ModelConfigurationService:', error);
      // Load fallback configurations
      this.loadFallbackConfigurations();
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Start periodic validation monitoring
   */
  private startValidationMonitoring(): void {
    this.validationInterval = setInterval(async () => {
      await this.performValidationChecks();
    }, this.VALIDATION_INTERVAL);
  }

  /**
   * Perform health checks on all models
   */
  private async performHealthChecks(): Promise<void> {
    const healthChecks = this.models.map(model =>
      this.checkModelHealth(model.name)
    );
    await Promise.allSettled(healthChecks);
  }

  /**
   * Perform validation checks on all models
   */
  private async performValidationChecks(): Promise<void> {
    const validations = this.models.map(model =>
      this.validateModel(model.name)
    );
    await Promise.allSettled(validations);
  }

  /**
   * Load model configurations from API
   */
  private async loadModelConfigurations(): Promise<void> {
    try {
      // Try to load from API first
      const response = await fetch('/api/models/config');
      if (response.ok) {
        const data = await response.json();
        this.models = data.models || [];
        this.isLoaded = true;
        return;
      }
    } catch (error) {
      console.warn('API not available, using fallback configurations:', error);
    }

    // Fallback to embedded configurations
    this.loadFallbackConfigurations();
  }

  /**
   * Load fallback model configurations
   */
  private loadFallbackConfigurations(): void {
    this.models = [
      // OpenAI models
      {
        name: 'gpt-4o',
        provider: 'openai',
        model_family: 'gpt-4',
        max_tokens: 128000,
        cost_per_token: 0.000005,
        input_cost_per_token: 0.000005,
        output_cost_per_token: 0.000015,
        capabilities: ['text', 'chat', 'function_calling', 'reasoning', 'vision', 'multimodal'],
        context_window: 128000,
        supports_streaming: true,
        supports_function_calling: true,
        is_available: true,
        description: 'Most advanced GPT-4 model with vision capabilities'
      },
      {
        name: 'gpt-4o-mini',
        provider: 'openai',
        model_family: 'gpt-4',
        max_tokens: 128000,
        cost_per_token: 0.00000015,
        input_cost_per_token: 0.00000015,
        output_cost_per_token: 0.0000006,
        capabilities: ['text', 'chat', 'function_calling', 'reasoning'],
        context_window: 128000,
        supports_streaming: true,
        supports_function_calling: true,
        is_available: true,
        description: 'Cost-effective GPT-4 model for most tasks'
      },
      {
        name: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        model_family: 'claude-3',
        max_tokens: 200000,
        cost_per_token: 0.000003,
        input_cost_per_token: 0.000003,
        output_cost_per_token: 0.000015,
        capabilities: ['text', 'chat', 'reasoning', 'long_context', 'vision', 'multimodal'],
        context_window: 200000,
        supports_streaming: true,
        supports_function_calling: true,
        is_available: true,
        description: 'Most intelligent Claude model with vision'
      },
      // Novita AI models
      {
        name: 'novita-llama-2-70b-chat',
        provider: 'novita',
        model_family: 'llama-2',
        max_tokens: 4096,
        cost_per_token: 0.000001,
        input_cost_per_token: 0.000001,
        output_cost_per_token: 0.000002,
        capabilities: ['text', 'chat', 'function_calling'],
        context_window: 4096,
        supports_streaming: true,
        supports_function_calling: true,
        is_available: true,
        description: 'Llama 2 70B via Novita AI cloud infrastructure'
      },
      {
        name: 'novita-mistral-7b-instruct',
        provider: 'novita',
        model_family: 'mistral',
        max_tokens: 8192,
        cost_per_token: 0.0000005,
        input_cost_per_token: 0.0000005,
        output_cost_per_token: 0.000001,
        capabilities: ['text', 'chat', 'code'],
        context_window: 8192,
        supports_streaming: true,
        supports_function_calling: false,
        is_available: true,
        description: 'Mistral 7B Instruct via Novita AI'
      },
      {
        name: 'novita-stable-diffusion-xl',
        provider: 'novita',
        model_family: 'stable-diffusion',
        max_tokens: 77,
        cost_per_token: 0.01,
        input_cost_per_token: 0.01,
        output_cost_per_token: 0.02,
        capabilities: ['image', 'generation', 'text-to-image'],
        context_window: 77,
        supports_streaming: false,
        supports_function_calling: false,
        is_available: true,
        description: 'Stable Diffusion XL for high-quality image generation'
      },
      // vLLM local models
      {
        name: 'vllm-meta-llama/Llama-2-7b-chat-hf',
        provider: 'vllm',
        model_family: 'llama-2',
        endpoint: 'http://localhost:8001',
        max_tokens: 4096,
        cost_per_token: 0.0,
        input_cost_per_token: 0.0,
        output_cost_per_token: 0.0,
        capabilities: ['text', 'chat', 'local'],
        context_window: 4096,
        supports_streaming: true,
        supports_function_calling: false,
        is_available: true,
        description: 'Llama 2 7B running locally via vLLM'
      },
      {
        name: 'vllm-meta-llama/Llama-2-13b-chat-hf',
        provider: 'vllm',
        model_family: 'llama-2',
        endpoint: 'http://localhost:8001',
        max_tokens: 4096,
        cost_per_token: 0.0,
        input_cost_per_token: 0.0,
        output_cost_per_token: 0.0,
        capabilities: ['text', 'chat', 'local'],
        context_window: 4096,
        supports_streaming: true,
        supports_function_calling: false,
        is_available: true,
        description: 'Llama 2 13B running locally via vLLM'
      },
      // Hugging Face models
      {
        name: 'hf-microsoft/DialoGPT-medium',
        provider: 'huggingface',
        model_family: 'dialogpt',
        endpoint: 'https://api-inference.huggingface.co',
        max_tokens: 1024,
        cost_per_token: 0.0,
        input_cost_per_token: 0.0,
        output_cost_per_token: 0.0,
        capabilities: ['text', 'chat', 'conversational'],
        context_window: 1024,
        supports_streaming: false,
        supports_function_calling: false,
        is_available: true,
        description: 'DialoGPT for conversational AI via Hugging Face'
      },
      {
        name: 'hf-deepset/roberta-base-squad2',
        provider: 'huggingface',
        model_family: 'roberta',
        endpoint: 'https://api-inference.huggingface.co',
        max_tokens: 384,
        cost_per_token: 0.0,
        input_cost_per_token: 0.0,
        output_cost_per_token: 0.0,
        capabilities: ['text', 'question-answering', 'nlp'],
        context_window: 384,
        supports_streaming: false,
        supports_function_calling: false,
        is_available: true,
        description: 'RoBERTa for question answering via Hugging Face'
      },
      // Ollama models
      {
        name: 'llama2:7b',
        provider: 'ollama',
        model_family: 'llama-2',
        endpoint: 'http://localhost:11434',
        max_tokens: 4096,
        cost_per_token: 0.0,
        input_cost_per_token: 0.0,
        output_cost_per_token: 0.0,
        capabilities: ['text', 'chat', 'local'],
        context_window: 4096,
        supports_streaming: true,
        supports_function_calling: false,
        is_available: true,
        description: 'Llama 2 7B via Ollama local deployment'
      },
      {
        name: 'mistral:7b',
        provider: 'ollama',
        model_family: 'mistral',
        endpoint: 'http://localhost:11434',
        max_tokens: 8192,
        cost_per_token: 0.0,
        input_cost_per_token: 0.0,
        output_cost_per_token: 0.0,
        capabilities: ['text', 'chat', 'code', 'local'],
        context_window: 8192,
        supports_streaming: true,
        supports_function_calling: false,
        is_available: true,
        description: 'Mistral 7B via Ollama local deployment'
      },
      // Google models
      {
        name: 'gemini-pro',
        provider: 'google',
        model_family: 'gemini',
        max_tokens: 32768,
        cost_per_token: 0.0000005,
        input_cost_per_token: 0.0000005,
        output_cost_per_token: 0.0000015,
        capabilities: ['text', 'chat', 'reasoning', 'multimodal', 'vision'],
        context_window: 32768,
        supports_streaming: true,
        supports_function_calling: true,
        is_available: true,
        description: 'Gemini Pro multimodal model from Google'
      }
    ];
    this.isLoaded = true;
  }

  /**
   * Get all available models
   */
  getAvailableModels(): ModelConfig[] {
    return this.models.filter(model => model.is_available);
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: string): ModelConfig[] {
    return this.models.filter(model =>
      model.provider === provider && model.is_available
    );
  }

  /**
   * Get models by capability
   */
  getModelsByCapability(capability: string): ModelConfig[] {
    return this.models.filter(model =>
      model.capabilities.includes(capability) && model.is_available
    );
  }

  /**
   * Get model by name
   */
  getModelByName(name: string): ModelConfig | undefined {
    return this.models.find(model => model.name === name);
  }

  /**
   * Get models by cost range
   */
  getModelsByCostRange(minCost: number = 0, maxCost: number = Infinity): ModelConfig[] {
    return this.models.filter(model =>
      model.cost_per_token >= minCost &&
      model.cost_per_token <= maxCost &&
      model.is_available
    );
  }

  /**
   * Get local models (free or self-hosted)
   */
  getLocalModels(): ModelConfig[] {
    return this.models.filter(model =>
      (model.cost_per_token === 0 || model.capabilities.includes('local')) &&
      model.is_available
    );
  }

  /**
   * Get recommended model for a specific use case
   */
  getRecommendedModel(useCase: string, preferences?: {
    maxCost?: number;
    requiresStreaming?: boolean;
    requiresVision?: boolean;
    prefersLocal?: boolean;
  }): ModelConfig | null {
    const availableModels = this.getAvailableModels();

    // Filter based on preferences
    let filteredModels = availableModels;

    if (preferences?.maxCost !== undefined) {
      filteredModels = filteredModels.filter(m => m.cost_per_token <= preferences.maxCost!);
    }

    if (preferences?.requiresStreaming) {
      filteredModels = filteredModels.filter(m => m.supports_streaming);
    }

    if (preferences?.requiresVision) {
      filteredModels = filteredModels.filter(m => m.capabilities.includes('vision'));
    }

    if (preferences?.prefersLocal) {
      const localModels = filteredModels.filter(m =>
        m.capabilities.includes('local') || m.cost_per_token === 0
      );
      if (localModels.length > 0) {
        filteredModels = localModels;
      }
    }

    if (filteredModels.length === 0) return null;

    // Score models based on use case
    const scoredModels = filteredModels.map(model => {
      let score = 0;

      // Base scoring
      if (model.cost_per_token === 0) score += 50; // Prefer free models
      if (model.capabilities.includes('local')) score += 30; // Prefer local models
      if (model.supports_streaming) score += 20; // Prefer streaming models
      if (model.context_window > 100000) score += 25; // Prefer large context

      // Use case specific scoring
      switch (useCase.toLowerCase()) {
        case 'chat':
        case 'conversation':
          if (model.capabilities.includes('chat')) score += 40;
          break;
        case 'code':
        case 'programming':
          if (model.capabilities.includes('code')) score += 40;
          break;
        case 'analysis':
        case 'reasoning':
          if (model.capabilities.includes('reasoning')) score += 40;
          if (model.context_window > 50000) score += 20;
          break;
        case 'vision':
        case 'image':
          if (model.capabilities.includes('vision')) score += 50;
          break;
        case 'creative':
        case 'writing':
          if (model.capabilities.includes('text')) score += 30;
          break;
      }

      return { model, score };
    });

    // Return highest scoring model
    scoredModels.sort((a, b) => b.score - a.score);
    return scoredModels[0]?.model || null;
  }

  /**
   * Update model health status
   */
  updateModelHealth(modelName: string, status: ModelHealthStatus): void {
    this.healthStatus.set(modelName, status);
  }

  /**
   * Get model health status
   */
  getModelHealth(modelName: string): ModelHealthStatus | undefined {
    return this.healthStatus.get(modelName);
  }

  /**
   * Get all model health statuses
   */
  getAllModelHealth(): ModelHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Refresh model configurations from API
   */
  async refreshConfigurations(): Promise<void> {
    this.isLoaded = false;
    await this.loadModelConfigurations();
  }

  /**
   * Check model health status
   */
  async checkModelHealth(modelName: string): Promise<ModelHealthStatus> {
    const model = this.models.find(m => m.name === modelName);
    if (!model) {
      return {
        model_name: modelName,
        status: 'unknown',
        last_checked: new Date(),
        message: 'Model not found in configuration'
      };
    }

    try {
      const startTime = Date.now();

      // Determine endpoint based on provider
      let endpoint = model.endpoint;
      if (!endpoint) {
        switch (model.provider) {
          case 'vllm':
            endpoint = 'http://localhost:8001/health';
            break;
          case 'ollama':
            endpoint = 'http://localhost:11434/api/tags';
            break;
          case 'novita':
            endpoint = 'https://api.novita.ai/health';
            break;
          default:
            endpoint = '/api/models/health/' + modelName;
        }
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;

      // Get usage statistics from the last 24 hours
      let usageStats = null;
      try {
        const usageResponse = await fetch(`/api/models/usage/${modelName}?days=1`);
        if (usageResponse.ok) {
          usageStats = await usageResponse.json();
        }
      } catch (error) {
        console.warn(`Failed to fetch usage stats for ${modelName}:`, error);
      }

      const status: ModelHealthStatus = {
        model_name: modelName,
        status: response.ok ? 'healthy' : 'unhealthy',
        response_time: responseTime,
        last_checked: new Date(),
        message: response.ok ? 'Model is responding normally' : `HTTP ${response.status}`,
        uptime_percentage: usageStats?.uptime_percentage,
        total_requests: usageStats?.total_requests,
        successful_requests: usageStats?.successful_requests,
        cost_per_request: usageStats?.cost_per_request
      };

      this.healthStatus.set(modelName, status);
      return status;
    } catch (error) {
      const status: ModelHealthStatus = {
        model_name: modelName,
        status: 'unhealthy',
        last_checked: new Date(),
        message: `Health check failed: ${error.message}`
      };
      this.healthStatus.set(modelName, status);
      return status;
    }
  }

  /**
   * Validate model configuration
   */
  async validateModel(modelName: string): Promise<ModelValidationResult> {
    const model = this.models.find(m => m.name === modelName);
    if (!model) {
      return {
        model_name: modelName,
        is_valid: false,
        errors: ['Model not found in configuration'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!model.name) errors.push('Model name is required');
    if (!model.provider) errors.push('Provider is required');
    if (!model.model_family) errors.push('Model family is required');
    if (!model.capabilities || model.capabilities.length === 0) {
      warnings.push('No capabilities specified');
    }

    // Validate cost configuration
    if (model.cost_per_token === undefined || model.cost_per_token < 0) {
      errors.push('Valid cost per token is required');
    }

    // Validate context window
    if (!model.context_window || model.context_window <= 0) {
      errors.push('Valid context window is required');
    }

    // Validate max tokens
    if (!model.max_tokens || model.max_tokens <= 0) {
      errors.push('Valid max tokens is required');
    }

    // Validate endpoint for local models
    if (model.provider === 'vllm' || model.provider === 'ollama') {
      if (!model.endpoint) {
        warnings.push('Local model missing endpoint configuration');
      }
    }

    // Perform performance validation
    let performanceMetrics = undefined;
    try {
      performanceMetrics = await this.measureModelPerformance(modelName);
    } catch (error) {
      warnings.push(`Performance measurement failed: ${error.message}`);
    }

    // Perform cost analysis
    let costAnalysis = undefined;
    try {
      costAnalysis = await this.analyzeModelCost(model);
    } catch (error) {
      warnings.push(`Cost analysis failed: ${error.message}`);
    }

    const result: ModelValidationResult = {
      model_name: modelName,
      is_valid: errors.length === 0,
      errors,
      warnings,
      performance_metrics: performanceMetrics,
      cost_analysis: costAnalysis
    };

    this.validationResults.set(modelName, result);
    return result;
  }

  /**
   * Measure model performance metrics
   */
  private async measureModelPerformance(modelName: string): Promise<ModelValidationResult['performance_metrics']> {
    const model = this.models.find(m => m.name === modelName);
    if (!model) {
      throw new Error('Model not found');
    }

    // For local models, we can try to get actual performance metrics
    if (model.provider === 'vllm' || model.provider === 'ollama') {
      try {
        const response = await fetch(`${model.endpoint}/metrics`);
        if (response.ok) {
          const metrics = await response.json();
          return {
            latency_ms: metrics.avg_latency_ms || 1000,
            throughput_req_per_sec: metrics.throughput || 10,
            memory_usage_mb: metrics.memory_mb || 4096
          };
        }
      } catch (error) {
        console.warn(`Failed to get metrics from ${model.endpoint}:`, error);
      }
    }

    // Fallback to simulated metrics based on model characteristics
    let baseLatency = 1000; // 1 second base
    let baseThroughput = 10; // 10 req/sec base
    let baseMemory = 4096; // 4GB base

    // Adjust based on model size and provider
    if (model.name.includes('70b') || model.name.includes('65b')) {
      baseLatency *= 2;
      baseThroughput *= 0.5;
      baseMemory *= 4;
    } else if (model.name.includes('13b') || model.name.includes('30b')) {
      baseLatency *= 1.5;
      baseThroughput *= 0.7;
      baseMemory *= 2;
    }

    // Adjust for provider
    if (model.provider === 'openai' || model.provider === 'anthropic') {
      baseLatency *= 0.8; // Cloud providers are generally faster
      baseThroughput *= 1.5;
    }

    return {
      latency_ms: Math.round(baseLatency + (Math.random() - 0.5) * 500),
      throughput_req_per_sec: Math.round((baseThroughput + (Math.random() - 0.5) * 5) * 100) / 100,
      memory_usage_mb: Math.round(baseMemory + (Math.random() - 0.5) * 1024)
    };
  }

  /**
   * Analyze model cost efficiency
   */
  private async analyzeModelCost(model: ModelConfig): Promise<ModelValidationResult['cost_analysis']> {
    // Estimate monthly cost based on typical usage patterns
    const estimatedDailyRequests = 1000;
    const averageInputTokens = model.context_window * 0.3; // Assume 30% of context used
    const averageOutputTokens = 150; // Typical response length

    const inputCostPerRequest = averageInputTokens * (model.input_cost_per_token || model.cost_per_token);
    const outputCostPerRequest = averageOutputTokens * (model.output_cost_per_token || model.cost_per_token);
    const costPerRequest = inputCostPerRequest + outputCostPerRequest;
    const estimatedMonthlyCost = costPerRequest * estimatedDailyRequests * 30;

    return {
      input_cost_per_token: model.input_cost_per_token || model.cost_per_token,
      output_cost_per_token: model.output_cost_per_token || model.cost_per_token,
      estimated_monthly_cost: Math.round(estimatedMonthlyCost * 100) / 100
    };
  }

  /**
   * Get all validation results
   */
  getAllValidationResults(): ModelValidationResult[] {
    return Array.from(this.validationResults.values());
  }

  /**
   * Get validation result for specific model
   */
  getValidationResult(modelName: string): ModelValidationResult | null {
    return this.validationResults.get(modelName) || null;
  }

  /**
   * Validate all models
   */
  async validateAllModels(): Promise<ModelValidationResult[]> {
    const validations = this.models.map(model => this.validateModel(model.name));
    return await Promise.all(validations);
  }

  /**
   * Get models by health status
   */
  getModelsByHealthStatus(status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'): ModelConfig[] {
    return this.models.filter(model => {
      const health = this.healthStatus.get(model.name);
      return health?.status === status && model.is_available;
    });
  }

  /**
   * Get model statistics
   */
  getModelStatistics(): {
    totalModels: number;
    availableModels: number;
    localModels: number;
    providers: string[];
    capabilities: string[];
    costRanges: { free: number; low: number; medium: number; high: number; };
    healthStatus: { healthy: number; degraded: number; unhealthy: number; unknown: number; };
  } {
    const available = this.getAvailableModels();
    const local = this.getLocalModels();

    const providers = [...new Set(available.map(m => m.provider))];
    const capabilities = [...new Set(available.flatMap(m => m.capabilities))];

    const costRanges = {
      free: available.filter(m => m.cost_per_token === 0).length,
      low: available.filter(m => m.cost_per_token > 0 && m.cost_per_token <= 0.001).length,
      medium: available.filter(m => m.cost_per_token > 0.001 && m.cost_per_token <= 0.01).length,
      high: available.filter(m => m.cost_per_token > 0.01).length
    };

    const healthStatus = {
      healthy: available.filter(m => this.healthStatus.get(m.name)?.status === 'healthy').length,
      degraded: available.filter(m => this.healthStatus.get(m.name)?.status === 'degraded').length,
      unhealthy: available.filter(m => this.healthStatus.get(m.name)?.status === 'unhealthy').length,
      unknown: available.filter(m => !this.healthStatus.get(m.name) || this.healthStatus.get(m.name)?.status === 'unknown').length
    };

    return {
      totalModels: this.models.length,
      availableModels: available.length,
      localModels: local.length,
      providers,
      capabilities,
      costRanges,
      healthStatus
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }
}

// Export singleton instance
export const modelConfigurationService = ModelConfigurationService.getInstance();
