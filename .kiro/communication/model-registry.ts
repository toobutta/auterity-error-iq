/**
 * Model Registry for BYOM (Bring Your Own Model) Support
 * Enables dynamic registration and management of AI models
 */

export interface ModelRegistration {
  id: string;
  name: string;
  type: "hosted" | "byom" | "external";
  endpoint: string;
  authConfig: AuthConfig;
  capabilities: ModelCapability[];
  costPerToken?: CostConfig;
  rateLimits: RateLimitConfig;
  healthCheck?: HealthCheckConfig;
  metadata?: Record<string, any>;
}

export interface AuthConfig {
  type: "api-key" | "oauth" | "bearer-token" | "custom";
  credentials: Record<string, string>;
  headers?: Record<string, string>;
}

export interface ModelCapability {
  type:
    | "code-generation"
    | "error-analysis"
    | "optimization"
    | "testing"
    | "deployment"
    | "security-audit";
  languages?: string[];
  frameworks?: string[];
  accuracy?: number;
  speed?: "fast" | "medium" | "slow";
}

export interface CostConfig {
  inputCost: number; // per 1K tokens
  outputCost: number; // per 1K tokens
  currency: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  concurrentRequests: number;
}

export interface HealthCheckConfig {
  endpoint: string;
  interval: number; // seconds
  timeout: number; // seconds
  retries: number;
}

export interface ModelHealth {
  modelId: string;
  status: "healthy" | "unhealthy" | "degraded";
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  lastError?: string;
}

export class ModelRegistry {
  private models: Map<string, ModelRegistration> = new Map();
  private healthStatus: Map<string, ModelHealth> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  async registerModel(model: ModelRegistration): Promise<void> {
    // Validate model configuration
    this.validateModelConfig(model);

    // Test model connectivity
    await this.testModelConnection(model);

    // Register the model
    this.models.set(model.id, model);

    // Start health monitoring
    if (model.healthCheck) {
      this.startHealthMonitoring(model.id, model.healthCheck);
    }

    console.log(`Model registered: ${model.name} (${model.id})`);
  }

  async unregisterModel(modelId: string): Promise<void> {
    this.models.delete(modelId);
    this.healthStatus.delete(modelId);

    // Stop health monitoring
    const interval = this.healthCheckIntervals.get(modelId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(modelId);
    }

    console.log(`Model unregistered: ${modelId}`);
  }

  getModel(modelId: string): ModelRegistration | undefined {
    return this.models.get(modelId);
  }

  getAllModels(): ModelRegistration[] {
    return Array.from(this.models.values());
  }

  getModelsByCapability(
    capability: ModelCapability["type"],
  ): ModelRegistration[] {
    return Array.from(this.models.values()).filter((model) =>
      model.capabilities.some((cap) => cap.type === capability),
    );
  }

  getHealthyModels(): ModelRegistration[] {
    return Array.from(this.models.values()).filter((model) => {
      const health = this.healthStatus.get(model.id);
      return !health || health.status === "healthy";
    });
  }

  getModelHealth(modelId: string): ModelHealth | undefined {
    return this.healthStatus.get(modelId);
  }

  async findBestModelForTask(
    capability: ModelCapability["type"],
    requirements?: {
      maxCost?: number;
      minAccuracy?: number;
      preferredSpeed?: "fast" | "medium" | "slow";
    },
  ): Promise<ModelRegistration | null> {
    const capableModels = this.getModelsByCapability(capability);
    const healthyModels = capableModels.filter((model) => {
      const health = this.healthStatus.get(model.id);
      return !health || health.status === "healthy";
    });

    if (healthyModels.length === 0) return null;

    // Score models based on requirements
    const scoredModels = healthyModels.map((model) => {
      const capability = model.capabilities.find((c) => c.type === capability);
      const health = this.healthStatus.get(model.id);

      let score = 0;

      // Accuracy score
      if (capability?.accuracy) {
        score += capability.accuracy * 100;
      }

      // Speed score
      const speedScores = { fast: 100, medium: 75, slow: 50 };
      if (capability?.speed) {
        score += speedScores[capability.speed];
      }

      // Health score
      if (health) {
        score += (1 - health.errorRate) * 100;
      }

      // Cost score (lower is better)
      if (requirements?.maxCost && model.costPerToken) {
        const cost =
          model.costPerToken.inputCost + model.costPerToken.outputCost;
        if (cost <= requirements.maxCost) {
          score += 50;
        } else {
          score -= (cost - requirements.maxCost) * 10;
        }
      }

      return { model, score };
    });

    // Sort by score descending
    scoredModels.sort((a, b) => b.score - a.score);

    return scoredModels[0]?.model || null;
  }

  private validateModelConfig(model: ModelRegistration): void {
    if (!model.id || !model.name || !model.endpoint) {
      throw new Error("Model ID, name, and endpoint are required");
    }

    if (!model.capabilities || model.capabilities.length === 0) {
      throw new Error("At least one capability must be specified");
    }

    if (model.type === "byom" && !model.authConfig) {
      throw new Error("Authentication configuration required for BYOM");
    }
  }

  private async testModelConnection(model: ModelRegistration): Promise<void> {
    // Implement model connectivity test
    // This would typically make a lightweight API call to verify the model is accessible
    console.log(`Testing connection to model: ${model.name}`);
  }

  private startHealthMonitoring(
    modelId: string,
    config: HealthCheckConfig,
  ): void {
    const interval = setInterval(async () => {
      await this.checkModelHealth(modelId, config);
    }, config.interval * 1000);

    this.healthCheckIntervals.set(modelId, interval);
  }

  private async checkModelHealth(
    modelId: string,
    config: HealthCheckConfig,
  ): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) return;

    try {
      const startTime = Date.now();

      // Implement health check logic
      // This would make a lightweight API call to the model's health endpoint

      const responseTime = Date.now() - startTime;

      this.healthStatus.set(modelId, {
        modelId,
        status: "healthy",
        lastCheck: new Date(),
        responseTime,
        errorRate: 0,
      });
    } catch (error) {
      const health = this.healthStatus.get(modelId);
      const errorRate = health ? Math.min(health.errorRate + 0.1, 1) : 0.1;

      this.healthStatus.set(modelId, {
        modelId,
        status: errorRate > 0.5 ? "unhealthy" : "degraded",
        lastCheck: new Date(),
        responseTime: -1,
        errorRate,
        lastError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Global registry instance
export const modelRegistry = new ModelRegistry();
