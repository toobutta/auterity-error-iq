// Shared types for AI optimization system
import type { Workflow, Node, Edge } from '@auterity/workflow-contracts';

export interface OptimizationConfig {
  strategy: 'performance' | 'cost' | 'balanced' | 'quality';
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  riskTolerance: 'low' | 'medium' | 'high';
  targetMetrics: string[];
}

export interface OptimizationResult {
  type: string;
  confidence: number;
  improvements: {
    performanceGain: number;
    costReduction: number;
    resourceEfficiency: number;
    qualityScore: number;
  };
  estimatedSavings: {
    timeMinutes: number;
    costUSD: number;
    resources: ResourceSavings;
  };
  appliedOptimizations: AppliedOptimization[];
}

export interface PerformanceMetrics {
  executionTime: number;
  cpuUsage: number;
  memoryUsage: number;
  throughput: number;
  latency: number;
  errorRate: number;
}

export interface CostMetrics {
  totalCost: number;
  modelCosts: Record<string, number>;
  resourceCosts: Record<string, number>;
  optimizationSavings: number;
  projectedMonthlyCost: number;
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  gpu?: number;
}

export interface RecommendationMetrics {
  relevanceScore: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  expectedImpact: number;
  userAcceptanceRate: number;
}

export interface ResourceSavings {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

export interface AppliedOptimization {
  type: string;
  description: string;
  impact: number;
  confidence: number;
}

export interface MLModelConfig {
  modelType: string;
  hyperparameters: Record<string, any>;
  trainingConfig: TrainingConfig;
  validationConfig: ValidationConfig;
}

export interface TrainingConfig {
  batchSize: number;
  epochs: number;
  learningRate: number;
  validationSplit: number;
}

export interface ValidationConfig {
  testSize: number;
  crossValidationFolds: number;
  metrics: string[];
}

export interface PredictionResult {
  prediction: any;
  confidence: number;
  uncertainty: number;
  features: Record<string, any>;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mse?: number;
  mae?: number;
}

export interface OptimizationContext {
  workflow: Workflow;
  historicalData: any[];
  userPreferences: Record<string, any>;
  constraints: Record<string, any>;
  environment: 'development' | 'staging' | 'production';
}
