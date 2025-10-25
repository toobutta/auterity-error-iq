/**
 * Enhanced MLflow Service for Auterity Unified AI Platform
 * Extends the existing MLflow integration with advanced features
 */

import axios from 'axios';
import { z } from 'zod';

// Types and interfaces
export interface MLflowConfig {
  baseUrl: string;
  trackingUri: string;
  timeout: number;
  enableAdvancedFeatures: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastUpdated: Date;
  tags: Record<string, string>;
}

export interface Run {
  id: string;
  experimentId: string;
  name: string;
  status: 'RUNNING' | 'FINISHED' | 'FAILED' | 'KILLED';
  startTime: Date;
  endTime?: Date;
  metrics: Record<string, number>;
  parameters: Record<string, string>;
  tags: Record<string, string>;
  artifacts: string[];
}

export interface ModelVersion {
  name: string;
  version: string;
  description?: string;
  createdAt: Date;
  stage: 'None' | 'Staging' | 'Production' | 'Archived';
  source: string;
  runId: string;
  metrics: Record<string, number>;
}

export interface MLflowMetrics {
  totalExperiments: number;
  totalRuns: number;
  activeRuns: number;
  completedRuns: number;
  failedRuns: number;
  totalModels: number;
  productionModels: number;
  averageRunDuration: number;
  timestamp: Date;
}

// Enhanced MLflow service with advanced features
export class EnhancedMLflowService {
  private config: MLflowConfig;
  private axiosInstance: any;
  private metrics: MLflowMetrics;

  constructor(config: MLflowConfig) {
    this.config = config;
    this.metrics = this.initializeMetrics();

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private initializeMetrics(): MLflowMetrics {
    return {
      totalExperiments: 0,
      totalRuns: 0,
      activeRuns: 0,
      completedRuns: 0,
      failedRuns: 0,
      totalModels: 0,
      productionModels: 0,
      averageRunDuration: 0,
      timestamp: new Date()
    };
  }

  /**
   * Get all experiments
   */
  async getExperiments(): Promise<Experiment[]> {
    try {
      const response = await this.axiosInstance.get('/api/2.0/mlflow/experiments/list');
      const experiments = response.data.experiments || [];

      return experiments.map((exp: any) => ({
        id: exp.experiment_id,
        name: exp.name,
        description: exp.description,
        createdAt: new Date(parseInt(exp.creation_time)),
        lastUpdated: new Date(parseInt(exp.last_update_time)),
        tags: exp.tags || {}
      }));
    } catch (error) {
      console.error('Failed to get experiments:', error);
      throw error;
    }
  }

  /**
   * Create a new experiment
   */
  async createExperiment(
    name: string,
    description?: string,
    tags?: Record<string, string>
  ): Promise<Experiment> {
    try {
      const response = await this.axiosInstance.post('/api/2.0/mlflow/experiments/create', {
        name,
        description,
        tags
      });

      const exp = response.data.experiment;
      return {
        id: exp.experiment_id,
        name: exp.name,
        description: exp.description,
        createdAt: new Date(parseInt(exp.creation_time)),
        lastUpdated: new Date(parseInt(exp.last_update_time)),
        tags: exp.tags || {}
      };
    } catch (error) {
      console.error('Failed to create experiment:', error);
      throw error;
    }
  }

  /**
   * Get runs for an experiment
   */
  async getExperimentRuns(experimentId: string): Promise<Run[]> {
    try {
      const response = await this.axiosInstance.get('/api/2.0/mlflow/runs/search', {
        params: {
          experiment_ids: [experimentId],
          max_results: 1000
        }
      });

      const runs = response.data.runs || [];
      return runs.map((run: any) => ({
        id: run.info.run_id,
        experimentId: run.info.experiment_id,
        name: run.info.run_name || `Run ${run.info.run_id}`,
        status: run.info.status,
        startTime: new Date(parseInt(run.info.start_time)),
        endTime: run.info.end_time ? new Date(parseInt(run.info.end_time)) : undefined,
        metrics: run.data?.metrics?.reduce((acc: any, metric: any) => {
          acc[metric.key] = metric.value;
          return acc;
        }, {}) || {},
        parameters: run.data?.params?.reduce((acc: any, param: any) => {
          acc[param.key] = param.value;
          return acc;
        }, {}) || {},
        tags: run.data?.tags?.reduce((acc: any, tag: any) => {
          acc[tag.key] = tag.value;
          return acc;
        }, {}) || {},
        artifacts: []
      }));
    } catch (error) {
      console.error('Failed to get experiment runs:', error);
      throw error;
    }
  }

  /**
   * Log metrics and parameters to a run
   */
  async logToRun(
    runId: string,
    metrics: Record<string, number>,
    parameters: Record<string, string>,
    tags: Record<string, string>
  ): Promise<void> {
    try {
      // Log metrics
      if (Object.keys(metrics).length > 0) {
        const metricRequests = Object.entries(metrics).map(([key, value]) =>
          this.axiosInstance.post('/api/2.0/mlflow/runs/log-metric', {
            run_id: runId,
            key,
            value
          })
        );
        await Promise.all(metricRequests);
      }

      // Log parameters
      if (Object.keys(parameters).length > 0) {
        const paramRequests = Object.entries(parameters).map(([key, value]) =>
          this.axiosInstance.post('/api/2.0/mlflow/runs/log-parameter', {
            run_id: runId,
            key,
            value
          })
        );
        await Promise.all(paramRequests);
      }

      // Log tags
      if (Object.keys(tags).length > 0) {
        const tagRequests = Object.entries(tags).map(([key, value]) =>
          this.axiosInstance.post('/api/2.0/mlflow/runs/set-tag', {
            run_id: runId,
            key,
            value
          })
        );
        await Promise.all(tagRequests);
      }
    } catch (error) {
      console.error('Failed to log to run:', error);
      throw error;
    }
  }

  /**
   * Get model versions
   */
  async getModelVersions(modelName: string): Promise<ModelVersion[]> {
    try {
      const response = await this.axiosInstance.get(`/api/2.0/mlflow/registered-models/get`, {
        params: { name: modelName }
      });

      const versions = response.data.model_versions || [];
      return versions.map((version: any) => ({
        name: version.name,
        version: version.version,
        description: version.description,
        createdAt: new Date(parseInt(version.creation_timestamp)),
        stage: version.current_stage,
        source: version.source,
        runId: version.run_id,
        metrics: {} // Would need additional API calls to get metrics
      }));
    } catch (error) {
      console.error('Failed to get model versions:', error);
      throw error;
    }
  }

  /**
   * Create a new model version
   */
  async createModelVersion(
    modelName: string,
    source: string,
    runId: string
  ): Promise<ModelVersion> {
    try {
      const response = await this.axiosInstance.post('/api/2.0/mlflow/model-versions/create', {
        name: modelName,
        source,
        run_id: runId
      });

      const version = response.data.model_version;
      return {
        name: version.name,
        version: version.version,
        description: version.description,
        createdAt: new Date(parseInt(version.creation_timestamp)),
        stage: version.current_stage,
        source: version.source,
        runId: version.run_id,
        metrics: {}
      };
    } catch (error) {
      console.error('Failed to create model version:', error);
      throw error;
    }
  }

  /**
   * Transition model version stage
   */
  async transitionModelVersion(
    modelName: string,
    version: string,
    stage: 'Staging' | 'Production' | 'Archived'
  ): Promise<ModelVersion> {
    try {
      const response = await this.axiosInstance.post('/api/2.0/mlflow/model-versions/transition-stage', {
        name: modelName,
        version,
        stage
      });

      const updatedVersion = response.data.model_version;
      return {
        name: updatedVersion.name,
        version: updatedVersion.version,
        description: updatedVersion.description,
        createdAt: new Date(parseInt(updatedVersion.creation_timestamp)),
        stage: updatedVersion.current_stage,
        source: updatedVersion.source,
        runId: updatedVersion.run_id,
        metrics: {}
      };
    } catch (error) {
      console.error('Failed to transition model version:', error);
      throw error;
    }
  }

  /**
   * Log workflow execution metrics
   */
  async logWorkflowExecution(
    workflowId: string,
    executionTime: number,
    nodeCount: number,
    success: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Create or get workflow experiment
      const experimentName = `workflow_${workflowId}`;
      let experiment = await this.getExperimentByName(experimentName);

      if (!experiment) {
        experiment = await this.createExperiment(
          experimentName,
          `Workflow execution metrics for ${workflowId}`,
          { workflow_id: workflowId }
        );
      }

      // Create a run
      const runResponse = await this.axiosInstance.post('/api/2.0/mlflow/runs/create', {
        experiment_id: experiment.id,
        run_name: `execution_${Date.now()}`
      });

      const runId = runResponse.data.run.info.run_id;

      // Log metrics
      await this.logToRun(runId, {
        execution_time_ms: executionTime,
        node_count: nodeCount,
        success_rate: success ? 1 : 0,
        throughput_nodes_per_second: nodeCount / (executionTime / 1000)
      }, {
        workflow_id: workflowId,
        success: success.toString(),
        ...metadata
      }, {
        type: 'workflow_execution',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to log workflow execution:', error);
      throw error;
    }
  }

  /**
   * Get experiment by name
   */
  private async getExperimentByName(name: string): Promise<Experiment | null> {
    try {
      const response = await this.axiosInstance.get('/api/2.0/mlflow/experiments/get-by-name', {
        params: { experiment_name: name }
      });

      const exp = response.data.experiment;
      return {
        id: exp.experiment_id,
        name: exp.name,
        description: exp.description,
        createdAt: new Date(parseInt(exp.creation_time)),
        lastUpdated: new Date(parseInt(exp.last_update_time)),
        tags: exp.tags || {}
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get MLflow metrics
   */
  async getMetrics(): Promise<MLflowMetrics> {
    try {
      const [experiments, runs] = await Promise.all([
        this.getExperiments(),
        this.getAllRuns()
      ]);

      const completedRuns = runs.filter(run => run.status === 'FINISHED');
      const failedRuns = runs.filter(run => run.status === 'FAILED');
      const activeRuns = runs.filter(run => run.status === 'RUNNING');

      const runDurations = completedRuns
        .filter(run => run.endTime)
        .map(run => run.endTime!.getTime() - run.startTime.getTime());

      const averageDuration = runDurations.length > 0
        ? runDurations.reduce((sum, duration) => sum + duration, 0) / runDurations.length
        : 0;

      this.metrics = {
        totalExperiments: experiments.length,
        totalRuns: runs.length,
        activeRuns: activeRuns.length,
        completedRuns: completedRuns.length,
        failedRuns: failedRuns.length,
        totalModels: await this.getTotalModels(),
        productionModels: await this.getProductionModels(),
        averageRunDuration: averageDuration,
        timestamp: new Date()
      };

      return { ...this.metrics };
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return { ...this.metrics };
    }
  }

  /**
   * Get all runs across all experiments
   */
  private async getAllRuns(): Promise<Run[]> {
    try {
      const experiments = await this.getExperiments();
      const runPromises = experiments.map(exp => this.getExperimentRuns(exp.id));
      const runArrays = await Promise.all(runPromises);
      return runArrays.flat();
    } catch (error) {
      console.error('Failed to get all runs:', error);
      return [];
    }
  }

  /**
   * Get total models count
   */
  private async getTotalModels(): Promise<number> {
    try {
      const response = await this.axiosInstance.get('/api/2.0/mlflow/registered-models/list');
      return response.data.registered_models?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get production models count
   */
  private async getProductionModels(): Promise<number> {
    try {
      const response = await this.axiosInstance.get('/api/2.0/mlflow/registered-models/list');
      const models = response.data.registered_models || [];

      let productionCount = 0;
      for (const model of models) {
        const versions = await this.getModelVersions(model.name);
        if (versions.some(v => v.stage === 'Production')) {
          productionCount++;
        }
      }

      return productionCount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Compare model versions
   */
  async compareModelVersions(
    modelName: string,
    version1: string,
    version2: string
  ): Promise<{
    version1: ModelVersion;
    version2: ModelVersion;
    comparison: Record<string, { v1: number; v2: number; difference: number; improvement: number }>;
  }> {
    try {
      const versions = await this.getModelVersions(modelName);
      const v1 = versions.find(v => v.version === version1);
      const v2 = versions.find(v => v.version === version2);

      if (!v1 || !v2) {
        throw new Error('Model versions not found');
      }

      // Get metrics for both versions (would need additional implementation)
      const comparison = this.compareMetrics(v1.metrics, v2.metrics);

      return {
        version1: v1,
        version2: v2,
        comparison
      };
    } catch (error) {
      console.error('Failed to compare model versions:', error);
      throw error;
    }
  }

  /**
   * Compare metrics between two versions
   */
  private compareMetrics(
    metrics1: Record<string, number>,
    metrics2: Record<string, number>
  ): Record<string, { v1: number; v2: number; difference: number; improvement: number }> {
    const allKeys = new Set([...Object.keys(metrics1), ...Object.keys(metrics2)]);
    const comparison: any = {};

    for (const key of allKeys) {
      const v1 = metrics1[key] || 0;
      const v2 = metrics2[key] || 0;
      const difference = v2 - v1;
      const improvement = v1 !== 0 ? (difference / v1) * 100 : 0;

      comparison[key] = {
        v1,
        v2,
        difference,
        improvement
      };
    }

    return comparison;
  }
}

// Default configuration
export const defaultMLflowConfig: MLflowConfig = {
  baseUrl: process.env.MLFLOW_BASE_URL || 'http://mlflow:5000',
  trackingUri: process.env.MLFLOW_TRACKING_URI || 'http://mlflow:5000',
  timeout: 30000,
  enableAdvancedFeatures: true
};

// Export singleton instance
export const enhancedMLflowService = new EnhancedMLflowService(defaultMLflowConfig);

