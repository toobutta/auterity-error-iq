/**
 * Weights & Biases Service for Auterity Error-IQ
 * Provides comprehensive MLOps monitoring, experiment tracking, and model management
 * Integrates with existing AI services for production ML lifecycle management
 */

import { z } from "zod";

// Types for Weights & Biases integration
export interface Experiment {
  id: string;
  name: string;
  description?: string;
  project: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  tags: string[];
  config: Record<string, any>;
  metrics: Record<string, number>;
  parameters: Record<string, any>;
  artifacts: string[];
  notes?: string;
  user: string;
}

export interface ModelVersion {
  id: string;
  name: string;
  version: string;
  description?: string;
  framework: string;
  inputSchema: any;
  outputSchema: any;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    loss?: number;
    custom?: Record<string, number>;
  };
  createdAt: Date;
  trainedAt: Date;
  deployedAt?: Date;
  status: 'training' | 'completed' | 'deployed' | 'archived' | 'failed';
  artifacts: {
    model: string;
    weights: string;
    config: string;
    logs: string;
  };
  metadata?: Record<string, any>;
}

export interface RunMetrics {
  runId: string;
  timestamp: Date;
  step: number;
  metrics: Record<string, number>;
  systemMetrics?: {
    cpu: number;
    memory: number;
    gpu?: number;
    disk: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner: string;
  collaborators: string[];
  experiments: number;
  models: number;
  createdAt: Date;
  lastActivity: Date;
  settings: {
    visibility: 'private' | 'public' | 'team';
    allowGuests: boolean;
    retentionDays: number;
  };
}

export interface MonitoringAlert {
  id: string;
  type: 'performance' | 'drift' | 'anomaly' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  project: string;
  experiment?: string;
  model?: string;
  triggeredAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  metadata?: Record<string, any>;
}

export class WeightsAndBiasesService {
  private experiments: Map<string, Experiment> = new Map();
  private models: Map<string, ModelVersion> = new Map();
  private projects: Map<string, Project> = new Map();
  private runMetrics: Map<string, RunMetrics[]> = new Map();
  private alerts: Map<string, MonitoringAlert> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize W&B service
   */
  private async initializeService(): Promise<void> {
    try {
      // Create default project
      await this.createProject({
        name: 'auterity-error-iq',
        description: 'Main project for Auterity Error-IQ AI operations',
        owner: 'system',
        settings: {
          visibility: 'private',
          allowGuests: false,
          retentionDays: 365
        }
      });

      this.isInitialized = true;

    } catch (error) {

    }
  }

  /**
   * Create a new project
   */
  async createProject(projectData: Omit<Project, 'id' | 'experiments' | 'models' | 'createdAt' | 'lastActivity'>): Promise<string> {
    try {
      const projectId = `prj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const project: Project = {
        id: projectId,
        ...projectData,
        experiments: 0,
        models: 0,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      this.projects.set(projectId, project);

      return projectId;
    } catch (error) {

      throw new Error(`Project creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Start a new experiment
   */
  async startExperiment(
    name: string,
    projectId: string,
    config: {
      description?: string;
      tags?: string[];
      parameters?: Record<string, any>;
      user?: string;
    } = {}
  ): Promise<string> {
    try {
      const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const project = this.projects.get(projectId);

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      const experiment: Experiment = {
        id: experimentId,
        name,
        description: config.description,
        project: projectId,
        status: 'running',
        createdAt: new Date(),
        startedAt: new Date(),
        tags: config.tags || [],
        config: {},
        metrics: {},
        parameters: config.parameters || {},
        artifacts: [],
        user: config.user || 'system'
      };

      this.experiments.set(experimentId, experiment);
      project.experiments++;
      project.lastActivity = new Date();

      return experimentId;

    } catch (error) {

      throw new Error(`Experiment start failed: ${(error as Error).message}`);
    }
  }

  /**
   * Log metrics for an experiment run
   */
  async logMetrics(
    experimentId: string,
    metrics: Record<string, number>,
    step?: number,
    systemMetrics?: RunMetrics['systemMetrics']
  ): Promise<void> {
    try {
      const experiment = this.experiments.get(experimentId);
      if (!experiment) {
        throw new Error(`Experiment ${experimentId} not found`);
      }

      const runMetrics: RunMetrics = {
        runId: experimentId,
        timestamp: new Date(),
        step: step || 0,
        metrics,
        systemMetrics
      };

      // Store metrics
      if (!this.runMetrics.has(experimentId)) {
        this.runMetrics.set(experimentId, []);
      }
      this.runMetrics.get(experimentId)!.push(runMetrics);

      // Update experiment metrics (keep latest values)
      Object.assign(experiment.metrics, metrics);

      // Update project activity
      const project = this.projects.get(experiment.project);
      if (project) {
        project.lastActivity = new Date();
      }



    } catch (error) {

      throw new Error(`Metrics logging failed: ${(error as Error).message}`);
    }
  }

  /**
   * Complete an experiment
   */
  async completeExperiment(experimentId: string, result?: any): Promise<void> {
    try {
      const experiment = this.experiments.get(experimentId);
      if (!experiment) {
        throw new Error(`Experiment ${experimentId} not found`);
      }

      experiment.status = 'completed';
      experiment.completedAt = new Date();

      if (result) {
        experiment.config.result = result;
      }



    } catch (error) {

      throw new Error(`Experiment completion failed: ${(error as Error).message}`);
    }
  }

  /**
   * Register a new model version
   */
  async registerModel(modelData: Omit<ModelVersion, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const modelId = `mdl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const model: ModelVersion = {
        id: modelId,
        ...modelData,
        createdAt: new Date(),
        status: 'training'
      };

      this.models.set(modelId, model);

      return modelId;

    } catch (error) {

      throw new Error(`Model registration failed: ${(error as Error).message}`);
    }
  }

  /**
   * Update model status and metrics
   */
  async updateModel(modelId: string, updates: Partial<ModelVersion>): Promise<void> {
    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      Object.assign(model, updates);


    } catch (error) {

      throw new Error(`Model update failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create monitoring alert
   */
  async createAlert(alertData: Omit<MonitoringAlert, 'id' | 'triggeredAt' | 'status'>): Promise<string> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const alert: MonitoringAlert = {
        id: alertId,
        ...alertData,
        triggeredAt: new Date(),
        status: 'active'
      };

      this.alerts.set(alertId, alert);

      return alertId;

    } catch (error) {

      throw new Error(`Alert creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get experiment metrics history
   */
  async getExperimentMetrics(experimentId: string): Promise<RunMetrics[]> {
    try {
      return this.runMetrics.get(experimentId) || [];
    } catch (error) {

      return [];
    }
  }

  /**
   * Get experiment details
   */
  async getExperiment(experimentId: string): Promise<Experiment | null> {
    try {
      return this.experiments.get(experimentId) || null;
    } catch (error) {

      return null;
    }
  }

  /**
   * Get all experiments for a project
   */
  async getProjectExperiments(projectId: string): Promise<Experiment[]> {
    try {
      return Array.from(this.experiments.values())
        .filter(exp => exp.project === projectId);
    } catch (error) {

      return [];
    }
  }

  /**
   * Get model details
   */
  async getModel(modelId: string): Promise<ModelVersion | null> {
    try {
      return this.models.get(modelId) || null;
    } catch (error) {

      return null;
    }
  }

  /**
   * Get all models
   */
  async getAllModels(): Promise<ModelVersion[]> {
    try {
      return Array.from(this.models.values());
    } catch (error) {

      return [];
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<MonitoringAlert[]> {
    try {
      return Array.from(this.alerts.values())
        .filter(alert => alert.status === 'active')
        .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
    } catch (error) {

      return [];
    }
  }

  /**
   * Get project dashboard data
   */
  async getProjectDashboard(projectId: string): Promise<{
    project: Project;
    recentExperiments: Experiment[];
    activeModels: ModelVersion[];
    recentAlerts: MonitoringAlert[];
    metrics: {
      totalExperiments: number;
      activeExperiments: number;
      deployedModels: number;
      alertsThisWeek: number;
    };
  }> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      const experiments = await this.getProjectExperiments(projectId);
      const allModels = await this.getAllModels();
      const allAlerts = Array.from(this.alerts.values());

      // Get recent data (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const recentExperiments = experiments
        .filter(exp => exp.createdAt > sevenDaysAgo)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      const activeModels = allModels
        .filter(model => model.status === 'deployed' || model.status === 'training')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);

      const recentAlerts = allAlerts
        .filter(alert => alert.triggeredAt > sevenDaysAgo)
        .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
        .slice(0, 10);

      const metrics = {
        totalExperiments: experiments.length,
        activeExperiments: experiments.filter(exp => exp.status === 'running').length,
        deployedModels: allModels.filter(model => model.status === 'deployed').length,
        alertsThisWeek: recentAlerts.length
      };

      return {
        project,
        recentExperiments,
        activeModels,
        recentAlerts,
        metrics
      };

    } catch (error) {

      throw new Error(`Dashboard retrieval failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(projectId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      const experiments = await this.getProjectExperiments(projectId);
      const models = await this.getAllModels();

      // Calculate time range
      const now = new Date();
      const startTime = new Date();

      switch (timeframe) {
        case 'day':
          startTime.setDate(now.getDate() - 1);
          break;
        case 'week':
          startTime.setDate(now.getDate() - 7);
          break;
        case 'month':
          startTime.setMonth(now.getMonth() - 1);
          break;
      }

      // Filter data by timeframe
      const timeframeExperiments = experiments.filter(exp => exp.createdAt >= startTime);
      const timeframeModels = models.filter(model => model.createdAt >= startTime);

      // Calculate metrics
      const report = {
        projectId,
        timeframe,
        generatedAt: now,
        summary: {
          totalExperiments: timeframeExperiments.length,
          completedExperiments: timeframeExperiments.filter(exp => exp.status === 'completed').length,
          activeModels: timeframeModels.filter(model => model.status === 'deployed').length,
          averageMetrics: this.calculateAverageMetrics(timeframeExperiments)
        },
        experiments: timeframeExperiments,
        models: timeframeModels,
        trends: this.calculateTrends(timeframeExperiments, startTime, now)
      };

      return report;

    } catch (error) {

      throw new Error(`Performance report generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate average metrics across experiments
   */
  private calculateAverageMetrics(experiments: Experiment[]): Record<string, number> {
    const averages: Record<string, number> = {};

    if (experiments.length === 0) return averages;

    // Get all metric keys
    const metricKeys = new Set<string>();
    experiments.forEach(exp => {
      Object.keys(exp.metrics).forEach(key => metricKeys.add(key));
    });

    // Calculate averages
    metricKeys.forEach(key => {
      const values = experiments
        .map(exp => exp.metrics[key])
        .filter(val => val !== undefined);

      if (values.length > 0) {
        averages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    });

    return averages;
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(experiments: Experiment[], startTime: Date, endTime: Date): any {
    const days = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));
    const dailyStats: any[] = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startTime.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayExperiments = experiments.filter(exp =>
        exp.createdAt >= dayStart && exp.createdAt < dayEnd
      );

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        experiments: dayExperiments.length,
        completed: dayExperiments.filter(exp => exp.status === 'completed').length,
        averageMetrics: this.calculateAverageMetrics(dayExperiments)
      });
    }

    return dailyStats;
  }

  /**
   * Clean up old data
   */
  cleanup(olderThanDays = 30): number {
    const cutoffTime = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
    let cleanedCount = 0;

    // Clean up old experiment metrics
    for (const [experimentId, metrics] of this.runMetrics.entries()) {
      const filteredMetrics = metrics.filter(metric => metric.timestamp > cutoffTime);
      if (filteredMetrics.length !== metrics.length) {
        this.runMetrics.set(experimentId, filteredMetrics);
        cleanedCount += (metrics.length - filteredMetrics.length);
      }
    }

    // Clean up resolved alerts older than 7 days
    const alertCutoffTime = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.status !== 'active' && alert.triggeredAt < alertCutoffTime) {
        this.alerts.delete(alertId);
        cleanedCount++;
      }
    }


    return cleanedCount;
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    initialized: boolean;
    projects: number;
    experiments: number;
    models: number;
    alerts: number;
    storageUsage: string;
  } {
    return {
      initialized: this.isInitialized,
      projects: this.projects.size,
      experiments: this.experiments.size,
      models: this.models.size,
      alerts: this.alerts.size,
      storageUsage: this.calculateStorageUsage()
    };
  }

  /**
   * Calculate storage usage estimate
   */
  private calculateStorageUsage(): string {
    // Rough estimate based on number of records
    const totalRecords = this.experiments.size + this.models.size + this.alerts.size;
    const metricsCount = Array.from(this.runMetrics.values())
      .reduce((sum, metrics) => sum + metrics.length, 0);

    const estimatedMB = (totalRecords * 2 + metricsCount * 0.5) / 1024; // Rough calculation
    return `${estimatedMB.toFixed(1)} MB`;
  }
}

// Export singleton instance
export const weightsAndBiasesService = new WeightsAndBiasesService();

