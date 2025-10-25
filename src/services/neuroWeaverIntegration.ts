/**
 * NeuroWeaver Integration Service
 * 
 * TypeScript integration layer that wraps the existing Python NeuroWeaver system
 * Provides workflow-specific training APIs and integrates with MCP, Triage, and Marketplace
 */

import { z } from 'zod';
import { EventEmitter } from 'events';

// Training Configuration Schemas
const TrainingConfigSchema = z.object({
  model_type: z.enum(['regression', 'classification', 'generative', 'transformer', 'autoencoder']),
  batch_size: z.number().default(32),
  learning_rate: z.number().default(0.001),
  epochs: z.number().default(100),
  validation_split: z.number().min(0).max(1).default(0.2),
  test_split: z.number().min(0).max(1).default(0.1),
  early_stopping_patience: z.number().default(10),
  
  // AI Optimization Settings
  auto_lr_scheduling: z.boolean().default(true),
  auto_architecture_optimization: z.boolean().default(true),
  hyperparameter_tuning: z.boolean().default(true),
  adaptive_batch_size: z.boolean().default(true),
  
  // Workflow-specific settings
  workflow_optimization_target: z.enum(['performance', 'cost', 'reliability', 'user_satisfaction']).default('performance'),
  integration_points: z.array(z.string()).default([]),
  
  // Training data sources
  data_sources: z.object({
    workflow_executions: z.boolean().default(true),
    user_interactions: z.boolean().default(true),
    agent_performance: z.boolean().default(true),
    triage_decisions: z.boolean().default(true),
    marketplace_usage: z.boolean().default(false)
  }).default({})
});

const ModelMetricsSchema = z.object({
  accuracy: z.number().default(0),
  precision: z.number().default(0),
  recall: z.number().default(0),
  f1_score: z.number().default(0),
  loss: z.number().default(0),
  val_loss: z.number().default(0),
  training_time: z.number().default(0),
  inference_time: z.number().default(0),
  model_size_mb: z.number().default(0),
  
  // Workflow-specific metrics
  workflow_improvement: z.number().default(0),
  cost_reduction: z.number().default(0),
  user_satisfaction_improvement: z.number().default(0)
});

const TrainingJobSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  config: TrainingConfigSchema,
  
  // Status tracking
  status: z.enum(['pending', 'preparing', 'training', 'validating', 'testing', 'completed', 'failed', 'cancelled']),
  progress: z.number().min(0).max(1).default(0),
  
  // Results
  metrics: ModelMetricsSchema.optional(),
  model_path: z.string().optional(),
  error_message: z.string().optional(),
  
  // Integration data
  workflow_id: z.string().optional(),
  agent_id: z.string().optional(),
  triage_rule_id: z.string().optional(),
  
  // Timestamps
  created_at: z.date().default(() => new Date()),
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
  
  // Python process info
  python_process_id: z.string().optional(),
  python_job_id: z.string().optional()
});

const WorkflowDataSchema = z.object({
  workflow_id: z.string(),
  execution_data: z.array(z.object({
    execution_id: z.string(),
    duration_ms: z.number(),
    success: z.boolean(),
    node_performance: z.record(z.object({
      execution_time_ms: z.number(),
      memory_usage_mb: z.number(),
      cpu_usage_percent: z.number(),
      error_rate: z.number()
    })),
    user_interactions: z.array(z.object({
      action: z.string(),
      timestamp: z.number(),
      duration_ms: z.number()
    })).default([]),
    resource_utilization: z.object({
      cpu: z.number(),
      memory: z.number(),
      network: z.number(),
      storage: z.number()
    }).optional()
  })),
  metadata: z.record(z.unknown()).default({})
});

// Types
export type TrainingConfig = z.infer<typeof TrainingConfigSchema>;
export type ModelMetrics = z.infer<typeof ModelMetricsSchema>;
export type TrainingJob = z.infer<typeof TrainingJobSchema>;
export type WorkflowData = z.infer<typeof WorkflowDataSchema>;

export interface TrainingDataPreparation {
  source_type: 'workflow' | 'agent' | 'triage' | 'marketplace';
  data_points: number;
  features: string[];
  target_variable: string;
  preprocessing_steps: string[];
  validation_split_info: {
    train_size: number;
    validation_size: number;
    test_size: number;
  };
}

export interface ModelValidationResult {
  validation_metrics: ModelMetrics;
  cross_validation_scores: number[];
  feature_importance: Record<string, number>;
  model_complexity: {
    parameters: number;
    layers: number;
    flops: number;
  };
  performance_benchmarks: {
    inference_latency_ms: number;
    memory_footprint_mb: number;
    throughput_requests_per_second: number;
  };
}

export interface TrainingPipelineOrchestration {
  pipeline_id: string;
  stages: {
    data_preparation: {
      status: 'pending' | 'running' | 'completed' | 'failed';
      progress: number;
      estimated_time_remaining_ms: number;
    };
    model_training: {
      status: 'pending' | 'running' | 'completed' | 'failed';
      progress: number;
      current_epoch: number;
      total_epochs: number;
      current_loss: number;
      best_validation_score: number;
    };
    model_validation: {
      status: 'pending' | 'running' | 'completed' | 'failed';
      progress: number;
      validation_results?: ModelValidationResult;
    };
    deployment_preparation: {
      status: 'pending' | 'running' | 'completed' | 'failed';
      progress: number;
      deployment_artifacts: string[];
    };
  };
}

export class NeuroWeaverIntegrationService extends EventEmitter {
  private trainingJobs: Map<string, TrainingJob> = new Map();
  private pythonServiceUrl: string;
  private activeJobs: Set<string> = new Set();
  
  constructor(pythonServiceUrl: string = 'http://localhost:8000') {
    super();
    this.pythonServiceUrl = pythonServiceUrl;
  }

  // ===== TRAINING PIPELINE ORCHESTRATION =====

  /**
   * Create and start a new training job
   */
  async createTrainingJob(
    name: string,
    description: string,
    config: TrainingConfig,
    workflowData?: WorkflowData
  ): Promise<TrainingJob> {
    const job: TrainingJob = {
      id: this.generateId('train'),
      name,
      description,
      config: TrainingConfigSchema.parse(config),
      status: 'pending',
      progress: 0,
      created_at: new Date()
    };

    // Validate and store job
    const validatedJob = TrainingJobSchema.parse(job);
    this.trainingJobs.set(validatedJob.id, validatedJob);

    // Prepare training data if workflow data provided
    if (workflowData) {
      await this.prepareWorkflowTrainingData(validatedJob.id, workflowData);
    }

    this.emit('job:created', validatedJob);
    return validatedJob;
  }

  /**
   * Start training job execution
   */
  async startTraining(jobId: string): Promise<boolean> {
    const job = this.trainingJobs.get(jobId);
    if (!job || job.status !== 'pending') {
      return false;
    }

    try {
      // Update job status
      job.status = 'preparing';
      job.started_at = new Date();
      this.trainingJobs.set(jobId, job);
      this.activeJobs.add(jobId);

      // Call Python NeuroWeaver service
      const pythonJobResponse = await this.callPythonService('/training/start', {
        job_id: jobId,
        config: job.config,
        name: job.name,
        description: job.description
      });

      // Update job with Python process info
      job.python_job_id = pythonJobResponse.python_job_id;
      job.python_process_id = pythonJobResponse.process_id;
      job.status = 'training';
      this.trainingJobs.set(jobId, job);

      // Start monitoring job progress
      this.monitorTrainingJob(jobId);

      this.emit('job:started', job);
      return true;

    } catch (error) {
      job.status = 'failed';
      job.error_message = error instanceof Error ? error.message : 'Unknown error';
      job.completed_at = new Date();
      this.trainingJobs.set(jobId, job);
      this.activeJobs.delete(jobId);

      this.emit('job:failed', { job, error });
      return false;
    }
  }

  /**
   * Monitor training job progress
   */
  private async monitorTrainingJob(jobId: string): Promise<void> {
    const job = this.trainingJobs.get(jobId);
    if (!job || !job.python_job_id) return;

    const checkProgress = async () => {
      try {
        const progressResponse = await this.callPythonService('/training/progress', {
          python_job_id: job.python_job_id
        });

        // Update job progress
        job.progress = progressResponse.progress;
        job.status = progressResponse.status;

        if (progressResponse.metrics) {
          job.metrics = ModelMetricsSchema.parse(progressResponse.metrics);
        }

        if (progressResponse.model_path) {
          job.model_path = progressResponse.model_path;
        }

        this.trainingJobs.set(jobId, job);
        this.emit('job:progress', { jobId, progress: job.progress, status: job.status });

        // Check if job is completed
        if (job.status === 'completed') {
          job.completed_at = new Date();
          this.activeJobs.delete(jobId);
          this.emit('job:completed', job);
          return;
        }

        if (job.status === 'failed') {
          job.error_message = progressResponse.error_message;
          job.completed_at = new Date();
          this.activeJobs.delete(jobId);
          this.emit('job:failed', { job, error: progressResponse.error_message });
          return;
        }

        // Continue monitoring if still active
        if (this.activeJobs.has(jobId)) {
          setTimeout(checkProgress, 5000); // Check every 5 seconds
        }

      } catch (error) {
        console.error(`Failed to monitor job ${jobId}:`, error);
        // Retry after longer delay
        if (this.activeJobs.has(jobId)) {
          setTimeout(checkProgress, 15000);
        }
      }
    };

    // Start monitoring
    setTimeout(checkProgress, 2000); // Initial delay
  }

  // ===== TRAINING DATA PREPARATION =====

  /**
   * Prepare workflow data for training
   */
  async prepareWorkflowTrainingData(jobId: string, workflowData: WorkflowData): Promise<TrainingDataPreparation> {
    const validatedData = WorkflowDataSchema.parse(workflowData);

    try {
      const preparationResponse = await this.callPythonService('/data/prepare', {
        job_id: jobId,
        workflow_data: validatedData,
        preparation_config: {
          feature_extraction: true,
          normalization: true,
          outlier_detection: true,
          feature_selection: true
        }
      });

      const preparation: TrainingDataPreparation = {
        source_type: 'workflow',
        data_points: preparationResponse.data_points,
        features: preparationResponse.features,
        target_variable: preparationResponse.target_variable,
        preprocessing_steps: preparationResponse.preprocessing_steps,
        validation_split_info: preparationResponse.validation_split_info
      };

      this.emit('data:prepared', { jobId, preparation });
      return preparation;

    } catch (error) {
      console.error(`Failed to prepare workflow data for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Prepare agent performance data for training
   */
  async prepareAgentTrainingData(jobId: string, agentId: string): Promise<TrainingDataPreparation> {
    try {
      const preparationResponse = await this.callPythonService('/data/prepare-agent', {
        job_id: jobId,
        agent_id: agentId,
        include_metrics: ['response_time', 'success_rate', 'resource_usage', 'user_satisfaction']
      });

      const preparation: TrainingDataPreparation = {
        source_type: 'agent',
        data_points: preparationResponse.data_points,
        features: preparationResponse.features,
        target_variable: preparationResponse.target_variable,
        preprocessing_steps: preparationResponse.preprocessing_steps,
        validation_split_info: preparationResponse.validation_split_info
      };

      this.emit('data:prepared', { jobId, preparation });
      return preparation;

    } catch (error) {
      console.error(`Failed to prepare agent data for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Prepare triage decision data for training
   */
  async prepareTriageTrainingData(jobId: string, tenantId: string): Promise<TrainingDataPreparation> {
    try {
      const preparationResponse = await this.callPythonService('/data/prepare-triage', {
        job_id: jobId,
        tenant_id: tenantId,
        include_features: ['content_analysis', 'user_attributes', 'historical_patterns', 'workload_metrics']
      });

      const preparation: TrainingDataPreparation = {
        source_type: 'triage',
        data_points: preparationResponse.data_points,
        features: preparationResponse.features,
        target_variable: preparationResponse.target_variable,
        preprocessing_steps: preparationResponse.preprocessing_steps,
        validation_split_info: preparationResponse.validation_split_info
      };

      this.emit('data:prepared', { jobId, preparation });
      return preparation;

    } catch (error) {
      console.error(`Failed to prepare triage data for job ${jobId}:`, error);
      throw error;
    }
  }

  // ===== MODEL VALIDATION LOGIC =====

  /**
   * Validate trained model
   */
  async validateModel(jobId: string): Promise<ModelValidationResult> {
    const job = this.trainingJobs.get(jobId);
    if (!job || !job.python_job_id) {
      throw new Error(`Job ${jobId} not found or not started`);
    }

    try {
      const validationResponse = await this.callPythonService('/model/validate', {
        python_job_id: job.python_job_id,
        validation_config: {
          cross_validation_folds: 5,
          test_size: 0.2,
          metrics: ['accuracy', 'precision', 'recall', 'f1', 'auc'],
          benchmark_tests: true,
          feature_importance: true
        }
      });

      const result: ModelValidationResult = {
        validation_metrics: ModelMetricsSchema.parse(validationResponse.metrics),
        cross_validation_scores: validationResponse.cv_scores,
        feature_importance: validationResponse.feature_importance,
        model_complexity: validationResponse.model_complexity,
        performance_benchmarks: validationResponse.performance_benchmarks
      };

      this.emit('model:validated', { jobId, result });
      return result;

    } catch (error) {
      console.error(`Failed to validate model for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Compare model performance against baseline
   */
  async compareWithBaseline(jobId: string, baselineModelPath?: string): Promise<{
    improvement: number;
    metrics_comparison: Record<string, { current: number; baseline: number; improvement: number }>;
    recommendation: 'deploy' | 'retrain' | 'reject';
    reasoning: string;
  }> {
    try {
      const comparisonResponse = await this.callPythonService('/model/compare', {
        job_id: jobId,
        baseline_model_path: baselineModelPath,
        comparison_metrics: ['accuracy', 'latency', 'memory_usage', 'throughput']
      });

      return {
        improvement: comparisonResponse.overall_improvement,
        metrics_comparison: comparisonResponse.metrics_comparison,
        recommendation: comparisonResponse.recommendation,
        reasoning: comparisonResponse.reasoning
      };

    } catch (error) {
      console.error(`Failed to compare model for job ${jobId}:`, error);
      throw error;
    }
  }

  // ===== INTEGRATION WITH OTHER SYSTEMS =====

  /**
   * Create training job for workflow optimization
   */
  async trainWorkflowOptimizationModel(
    workflowId: string,
    optimizationTarget: 'performance' | 'cost' | 'reliability' | 'user_satisfaction' = 'performance'
  ): Promise<TrainingJob> {
    const config: TrainingConfig = {
      model_type: 'regression',
      workflow_optimization_target: optimizationTarget,
      auto_architecture_optimization: true,
      hyperparameter_tuning: true,
      data_sources: {
        workflow_executions: true,
        user_interactions: true,
        agent_performance: false,
        triage_decisions: false,
        marketplace_usage: false
      }
    };

    const job = await this.createTrainingJob(
      `Workflow Optimization - ${workflowId}`,
      `Optimize workflow ${workflowId} for ${optimizationTarget}`,
      config
    );

    job.workflow_id = workflowId;
    this.trainingJobs.set(job.id, job);

    return job;
  }

  /**
   * Create training job for agent performance optimization
   */
  async trainAgentOptimizationModel(agentId: string): Promise<TrainingJob> {
    const config: TrainingConfig = {
      model_type: 'classification',
      workflow_optimization_target: 'performance',
      auto_lr_scheduling: true,
      adaptive_batch_size: true,
      data_sources: {
        workflow_executions: false,
        user_interactions: true,
        agent_performance: true,
        triage_decisions: false,
        marketplace_usage: true
      }
    };

    const job = await this.createTrainingJob(
      `Agent Optimization - ${agentId}`,
      `Optimize agent ${agentId} performance and resource usage`,
      config
    );

    job.agent_id = agentId;
    this.trainingJobs.set(job.id, job);

    return job;
  }

  /**
   * Create training job for triage rule optimization
   */
  async trainTriageOptimizationModel(tenantId: string, ruleId?: string): Promise<TrainingJob> {
    const config: TrainingConfig = {
      model_type: 'classification',
      workflow_optimization_target: 'reliability',
      hyperparameter_tuning: true,
      data_sources: {
        workflow_executions: true,
        user_interactions: true,
        agent_performance: false,
        triage_decisions: true,
        marketplace_usage: false
      }
    };

    const job = await this.createTrainingJob(
      `Triage Optimization - ${tenantId}`,
      `Optimize triage rules for tenant ${tenantId}`,
      config
    );

    job.triage_rule_id = ruleId;
    this.trainingJobs.set(job.id, job);

    return job;
  }

  // ===== JOB MANAGEMENT =====

  /**
   * Get training job by ID
   */
  async getTrainingJob(jobId: string): Promise<TrainingJob | null> {
    return this.trainingJobs.get(jobId) || null;
  }

  /**
   * Get all training jobs
   */
  async getTrainingJobs(filter?: {
    status?: TrainingJob['status'];
    workflow_id?: string;
    agent_id?: string;
    created_after?: Date;
  }): Promise<TrainingJob[]> {
    let jobs = Array.from(this.trainingJobs.values());

    if (filter) {
      if (filter.status) {
        jobs = jobs.filter(job => job.status === filter.status);
      }
      if (filter.workflow_id) {
        jobs = jobs.filter(job => job.workflow_id === filter.workflow_id);
      }
      if (filter.agent_id) {
        jobs = jobs.filter(job => job.agent_id === filter.agent_id);
      }
      if (filter.created_after) {
        jobs = jobs.filter(job => job.created_at >= filter.created_after!);
      }
    }

    return jobs.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  /**
   * Cancel training job
   */
  async cancelTrainingJob(jobId: string): Promise<boolean> {
    const job = this.trainingJobs.get(jobId);
    if (!job) return false;

    try {
      // Cancel Python job if running
      if (job.python_job_id && this.activeJobs.has(jobId)) {
        await this.callPythonService('/training/cancel', {
          python_job_id: job.python_job_id
        });
      }

      // Update job status
      job.status = 'cancelled';
      job.completed_at = new Date();
      this.trainingJobs.set(jobId, job);
      this.activeJobs.delete(jobId);

      this.emit('job:cancelled', job);
      return true;

    } catch (error) {
      console.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Call Python NeuroWeaver service
   */
  private async callPythonService(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${this.pythonServiceUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Python service error: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error(`Failed to call Python service ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get training pipeline orchestration status
   */
  async getPipelineOrchestration(jobId: string): Promise<TrainingPipelineOrchestration | null> {
    const job = this.trainingJobs.get(jobId);
    if (!job || !job.python_job_id) return null;

    try {
      const orchestrationResponse = await this.callPythonService('/pipeline/status', {
        python_job_id: job.python_job_id
      });

      return {
        pipeline_id: job.python_job_id,
        stages: orchestrationResponse.stages
      };

    } catch (error) {
      console.error(`Failed to get pipeline orchestration for job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Deploy trained model
   */
  async deployModel(jobId: string, deploymentConfig?: {
    environment: 'staging' | 'production';
    scaling: { min_instances: number; max_instances: number };
    monitoring: boolean;
  }): Promise<{
    deployment_id: string;
    endpoint_url: string;
    status: string;
  }> {
    const job = this.trainingJobs.get(jobId);
    if (!job || job.status !== 'completed' || !job.model_path) {
      throw new Error(`Job ${jobId} is not ready for deployment`);
    }

    try {
      const deploymentResponse = await this.callPythonService('/model/deploy', {
        job_id: jobId,
        model_path: job.model_path,
        deployment_config: deploymentConfig || {
          environment: 'staging',
          scaling: { min_instances: 1, max_instances: 3 },
          monitoring: true
        }
      });

      this.emit('model:deployed', { jobId, deployment: deploymentResponse });
      return deploymentResponse;

    } catch (error) {
      console.error(`Failed to deploy model for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup completed jobs
   */
  async cleanupCompletedJobs(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let cleanedCount = 0;
    for (const [jobId, job] of this.trainingJobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.completed_at &&
        job.completed_at < cutoffDate
      ) {
        this.trainingJobs.delete(jobId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

// Export singleton instance
export const neuroWeaverIntegration = new NeuroWeaverIntegrationService();
