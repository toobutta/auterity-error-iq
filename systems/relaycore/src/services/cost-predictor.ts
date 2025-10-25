/**
 * Cost Predictor Service
 * Machine learning model for predicting and optimizing costs across all AI requests
 */

import { Pool } from "pg";
import { logger } from "../utils/logger";
import { DatabaseConnection } from "./database";
import { AIRequest } from "../types/ai-request";
import { Budget } from "../types/budget";

export interface CostPrediction {
  estimatedCost: number;
  confidence: number;
  recommendedModel: string;
  alternativeModels: ModelOption[];
}

export interface ModelOption {
  modelId: string;
  estimatedCost: number;
  estimatedLatency: number;
  performanceScore: number;
}

export interface ModelSelection {
  selectedModel: string;
  estimatedCost: number;
  reason: string;
}

export class CostPredictor {
  private db: Pool;
  private modelCache: Map<string, { cost: number; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 60 * 60; // 1 hour cache TTL
  private readonly MODEL_COST_MAPPING: Record<string, number> = {
    "gpt-4": 0.03,
    "gpt-4-turbo": 0.01,
    "gpt-3.5-turbo": 0.0015,
    "claude-3-opus": 0.03,
    "claude-3-sonnet": 0.015,
    "claude-3-haiku": 0.0025,
    "llama-3-70b": 0.0015,
    "llama-3-8b": 0.0004,
    "mistral-large": 0.008,
    "mistral-small": 0.002,
    "gemini-pro": 0.0035,
    "gemini-flash": 0.0015,
  };

  constructor() {
    this.db = DatabaseConnection.getPool();
    this.initializeModel();
  }

  /**
   * Initialize the cost prediction model
   * Loads historical data for model training
   */
  private async initializeModel(): Promise<void> {
    try {
      // In a real implementation, this would load and initialize an ML model
      // For now, we'll use a rule-based approach with historical data

      logger.info("Initializing cost prediction model");

      // Load recent usage data for model calibration
      const query = `
        SELECT
          metadata->>'modelId' as model_id,
          AVG(amount) as avg_cost,
          COUNT(*) as usage_count
        FROM
          budget_usage_records
        WHERE
          timestamp > NOW() - INTERVAL '7 days'
          AND metadata->>'modelId' IS NOT NULL
        GROUP BY
          metadata->>'modelId'
      `;

      const result = await this.db.query(query);

      // Update model cost mapping with actual data where available
      for (const row of result.rows) {
        const modelId = row.model_id;
        const avgCost = parseFloat(row.avg_cost);

        if (modelId && avgCost > 0 && row.usage_count > 10) {
          // Only update if we have significant data
          this.modelCache.set(modelId, {
            cost: avgCost,
            timestamp: Date.now(),
          });
        }
      }

      logger.info(
        `Cost prediction model initialized with ${this.modelCache.size} model entries`,
      );
    } catch (error) {
      logger.error("Error initializing cost prediction model:", error);
    }
  }

  /**
   * Predict the cost of an AI request
   * Uses lightweight ML model for fast prediction
   */
  async predictCost(request: AIRequest): Promise<CostPrediction> {
    try {
      const modelId = request.model;
      const inputTokens = this.estimateTokenCount(request.messages);
      const outputTokens = this.estimateOutputTokens(request);

      // Get cost per token for the model
      const costPerToken = await this.getModelCostPerToken(modelId);

      // Calculate estimated cost
      // Most models charge differently for input vs output tokens
      const inputCost = inputTokens * costPerToken.input;
      const outputCost = outputTokens * costPerToken.output;
      const estimatedCost = inputCost + outputCost;

      // Get alternative models
      const alternativeModels = await this.getAlternativeModels(
        modelId,
        request,
      );

      // Determine confidence based on historical accuracy
      const confidence = await this.getPredictionConfidence(modelId);

      return {
        estimatedCost,
        confidence,
        recommendedModel: modelId,
        alternativeModels,
      };
    } catch (error) {
      logger.error("Error predicting cost:", error);

      // Fallback to a conservative estimate
      return {
        estimatedCost: this.getFallbackCostEstimate(request.model),
        confidence: 0.7,
        recommendedModel: request.model,
        alternativeModels: [],
      };
    }
  }

  /**
   * Optimize model selection based on budget constraints
   * Balances cost, performance, and budget limits
   */
  async optimizeModelSelection(
    request: AIRequest,
    budget: Budget,
  ): Promise<ModelSelection> {
    try {
      // Get cost prediction for requested model
      const prediction = await this.predictCost(request);

      // Check if the predicted cost exceeds the budget
      const remainingBudget = budget.amount - budget.used;

      if (prediction.estimatedCost <= remainingBudget * 0.1) {
        // Cost is less than 10% of remaining budget, use requested model
        return {
          selectedModel: request.model,
          estimatedCost: prediction.estimatedCost,
          reason: "Requested model is within budget constraints",
        };
      }

      // Need to find a cheaper alternative
      const alternatives = prediction.alternativeModels
        .filter((model) => model.estimatedCost <= remainingBudget * 0.1)
        .sort((a, b) => b.performanceScore - a.performanceScore);

      if (alternatives.length > 0) {
        // Use the highest performing model within budget
        return {
          selectedModel: alternatives[0].modelId,
          estimatedCost: alternatives[0].estimatedCost,
          reason:
            "Selected alternative model to stay within budget constraints",
        };
      }

      // If no good alternatives, use the cheapest model
      const cheapestModel = prediction.alternativeModels.sort(
        (a, b) => a.estimatedCost - b.estimatedCost,
      )[0];

      return {
        selectedModel: cheapestModel.modelId,
        estimatedCost: cheapestModel.estimatedCost,
        reason: "Selected cheapest model due to budget constraints",
      };
    } catch (error) {
      logger.error("Error optimizing model selection:", error);

      // Fallback to the requested model
      return {
        selectedModel: request.model,
        estimatedCost: this.getFallbackCostEstimate(request.model),
        reason: "Using requested model due to optimization error",
      };
    }
  }

  /**
   * Update the cost prediction model with actual cost data
   * Implements continuous learning for improved accuracy
   */
  async updateModel(actualCost: number, prediction: CostPrediction): void {
    try {
      const modelId = prediction.recommendedModel;
      const predictionError =
        Math.abs(actualCost - prediction.estimatedCost) / actualCost;

      // Log prediction accuracy for monitoring
      logger.info(
        `Cost prediction accuracy: ${(1 - predictionError) * 100}% for model ${modelId}`,
      );

      // Store prediction accuracy for model tuning
      const query = `
        INSERT INTO cost_prediction_accuracy (
          model_id, predicted_cost, actual_cost, prediction_error, timestamp
        ) VALUES ($1, $2, $3, $4, NOW())
      `;

      await this.db.query(query, [
        modelId,
        prediction.estimatedCost,
        actualCost,
        predictionError,
      ]);

      // Update model cache with new data
      const cachedModel = this.modelCache.get(modelId);

      if (cachedModel) {
        // Exponential moving average to update the cached cost
        const alpha = 0.2; // Weight for new observation
        const newCost = alpha * actualCost + (1 - alpha) * cachedModel.cost;

        this.modelCache.set(modelId, {
          cost: newCost,
          timestamp: Date.now(),
        });
      } else {
        this.modelCache.set(modelId, {
          cost: actualCost,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logger.error("Error updating cost prediction model:", error);
    }
  }

  /**
   * Estimate token count for messages
   * Uses character-based heuristic for fast estimation
   */
  private estimateTokenCount(messages: any[]): number {
    try {
      let totalChars = 0;

      for (const message of messages) {
        if (typeof message.content === "string") {
          totalChars += message.content.length;
        } else if (Array.isArray(message.content)) {
          // Handle content arrays (multimodal)
          for (const part of message.content) {
            if (typeof part === "object" && part.type === "text") {
              totalChars += part.text.length;
            }
            // Image tokens would be handled differently
          }
        }
      }

      // Approximate tokens based on characters (rough estimate)
      // Most tokenizers average 4 characters per token
      return Math.ceil(totalChars / 4);
    } catch (error) {
      logger.error("Error estimating token count:", error);
      // Fallback to a conservative estimate
      return 500;
    }
  }

  /**
   * Estimate output tokens based on request parameters
   */
  private estimateOutputTokens(request: AIRequest): number {
    try {
      // Base estimate on max_tokens if provided
      if (request.max_tokens) {
        return request.max_tokens;
      }

      // Otherwise estimate based on input length and model
      const inputTokens = this.estimateTokenCount(request.messages);

      // Different models have different input/output ratios
      const outputRatio = this.getModelOutputRatio(request.model);

      return Math.ceil(inputTokens * outputRatio);
    } catch (error) {
      logger.error("Error estimating output tokens:", error);
      // Fallback to a conservative estimate
      return 500;
    }
  }

  /**
   * Get model output ratio based on historical data
   */
  private getModelOutputRatio(modelId: string): number {
    // Default ratios based on model families
    if (modelId.includes("gpt-4")) return 1.2;
    if (modelId.includes("gpt-3.5")) return 1.5;
    if (modelId.includes("claude")) return 1.3;
    if (modelId.includes("llama")) return 1.4;
    if (modelId.includes("mistral")) return 1.3;
    if (modelId.includes("gemini")) return 1.2;

    // Default fallback
    return 1.0;
  }

  /**
   * Get model cost per token
   * Uses cached data when available for performance
   */
  private async getModelCostPerToken(
    modelId: string,
  ): Promise<{ input: number; output: number }> {
    try {
      // Check cache first
      const cachedModel = this.modelCache.get(modelId);
      const now = Date.now();

      if (cachedModel && now - cachedModel.timestamp < this.CACHE_TTL * 1000) {
        // Use cached cost as base and derive input/output costs
        const baseCost = cachedModel.cost / 1000; // Per token cost

        // Most models charge more for output than input
        return {
          input: baseCost * 0.5,
          output: baseCost * 1.5,
        };
      }

      // Cache miss or expired, use default mapping
      const defaultCost = this.MODEL_COST_MAPPING[modelId] || 0.01;

      // Default cost is per 1K tokens, convert to per token
      const baseCost = defaultCost / 1000;

      return {
        input: baseCost * 0.5,
        output: baseCost * 1.5,
      };
    } catch (error) {
      logger.error("Error getting model cost per token:", error);

      // Fallback to a conservative estimate
      return {
        input: 0.00001,
        output: 0.00003,
      };
    }
  }

  /**
   * Get alternative models for a given model
   * Provides cost-performance tradeoff options
   */
  private async getAlternativeModels(
    modelId: string,
    request: AIRequest,
  ): Promise<ModelOption[]> {
    try {
      // Define model families and alternatives
      const modelFamilies: Record<string, string[]> = {
        "gpt-4": ["gpt-4-turbo", "gpt-3.5-turbo"],
        "gpt-4-turbo": ["gpt-4", "gpt-3.5-turbo"],
        "gpt-3.5-turbo": ["gpt-4-turbo", "llama-3-70b", "mistral-small"],
        "claude-3-opus": ["claude-3-sonnet", "claude-3-haiku"],
        "claude-3-sonnet": ["claude-3-opus", "claude-3-haiku", "gpt-4-turbo"],
        "claude-3-haiku": ["claude-3-sonnet", "mistral-small", "gpt-3.5-turbo"],
        "llama-3-70b": ["llama-3-8b", "mistral-large", "gpt-3.5-turbo"],
        "llama-3-8b": ["llama-3-70b", "mistral-small"],
        "mistral-large": ["mistral-small", "gpt-4-turbo"],
        "mistral-small": ["mistral-large", "gpt-3.5-turbo"],
        "gemini-pro": ["gemini-flash", "gpt-4-turbo"],
        "gemini-flash": ["gemini-pro", "gpt-3.5-turbo"],
      };

      // Get alternatives for the requested model
      const alternatives = modelFamilies[modelId] || [
        "gpt-3.5-turbo",
        "mistral-small",
        "llama-3-8b",
      ];

      // Calculate estimated costs for alternatives
      const result: ModelOption[] = [];

      for (const altModel of alternatives) {
        // Estimate tokens for this model
        const inputTokens = this.estimateTokenCount(request.messages);
        const outputTokens = this.estimateOutputTokens({
          ...request,
          model: altModel,
        });

        // Get cost per token
        const costPerToken = await this.getModelCostPerToken(altModel);

        // Calculate cost
        const inputCost = inputTokens * costPerToken.input;
        const outputCost = outputTokens * costPerToken.output;
        const estimatedCost = inputCost + outputCost;

        // Get performance score and latency estimates
        const { performanceScore, estimatedLatency } =
          await this.getModelPerformanceMetrics(altModel);

        result.push({
          modelId: altModel,
          estimatedCost,
          estimatedLatency,
          performanceScore,
        });
      }

      return result;
    } catch (error) {
      logger.error("Error getting alternative models:", error);
      return [];
    }
  }

  /**
   * Get model performance metrics
   * Uses cached data for fast retrieval
   */
  private async getModelPerformanceMetrics(
    modelId: string,
  ): Promise<{ performanceScore: number; estimatedLatency: number }> {
    try {
      // In a real implementation, this would query a performance metrics database
      // For now, we'll use hardcoded values

      const performanceScores: Record<string, number> = {
        "gpt-4": 0.95,
        "gpt-4-turbo": 0.92,
        "gpt-3.5-turbo": 0.85,
        "claude-3-opus": 0.94,
        "claude-3-sonnet": 0.9,
        "claude-3-haiku": 0.82,
        "llama-3-70b": 0.88,
        "llama-3-8b": 0.78,
        "mistral-large": 0.89,
        "mistral-small": 0.8,
        "gemini-pro": 0.91,
        "gemini-flash": 0.83,
      };

      const latencyEstimates: Record<string, number> = {
        "gpt-4": 2500,
        "gpt-4-turbo": 1800,
        "gpt-3.5-turbo": 800,
        "claude-3-opus": 3000,
        "claude-3-sonnet": 1500,
        "claude-3-haiku": 700,
        "llama-3-70b": 1200,
        "llama-3-8b": 500,
        "mistral-large": 1400,
        "mistral-small": 600,
        "gemini-pro": 1600,
        "gemini-flash": 700,
      };

      return {
        performanceScore: performanceScores[modelId] || 0.8,
        estimatedLatency: latencyEstimates[modelId] || 1000,
      };
    } catch (error) {
      logger.error("Error getting model performance metrics:", error);

      return {
        performanceScore: 0.8,
        estimatedLatency: 1000,
      };
    }
  }

  /**
   * Get prediction confidence based on historical accuracy
   */
  private async getPredictionConfidence(modelId: string): Promise<number> {
    try {
      // Query historical prediction accuracy
      const query = `
        SELECT
          AVG(1 - prediction_error) as accuracy
        FROM
          cost_prediction_accuracy
        WHERE
          model_id = $1
          AND timestamp > NOW() - INTERVAL '7 days'
      `;

      const result = await this.db.query(query, [modelId]);

      if (result.rows.length > 0 && result.rows[0].accuracy) {
        return parseFloat(result.rows[0].accuracy);
      }

      // Default confidence if no historical data
      return 0.85;
    } catch (error) {
      logger.error("Error getting prediction confidence:", error);
      return 0.85;
    }
  }

  /**
   * Get fallback cost estimate when prediction fails
   */
  private getFallbackCostEstimate(modelId: string): number {
    // Conservative estimates based on model
    if (modelId.includes("gpt-4")) return 0.1;
    if (modelId.includes("gpt-3.5")) return 0.02;
    if (modelId.includes("claude-3-opus")) return 0.12;
    if (modelId.includes("claude-3-sonnet")) return 0.06;
    if (modelId.includes("claude-3-haiku")) return 0.02;

    // Default fallback
    return 0.05;
  }
}

