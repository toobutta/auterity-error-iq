/**
 * NeuroWeaver-RelayCore Model Performance Monitor
 * Tracks model performance and triggers automatic switching
 */

import { logger } from "../utils/logger";

interface ModelMetrics {
  model_id: string;
  accuracy: number;
  latency: number;
  error_rate: number;
  throughput: number;
  cost_per_request: number;
  last_updated: Date;
}

interface PerformanceThresholds {
  min_accuracy: number;
  max_latency: number;
  max_error_rate: number;
  min_throughput: number;
}

interface AlertConfig {
  accuracy_degradation_threshold: number;
  latency_spike_threshold: number;
  error_rate_spike_threshold: number;
  consecutive_failures_threshold: number;
}

export class ModelPerformanceMonitor {
  private metrics: Map<string, ModelMetrics> = new Map();
  private thresholds: PerformanceThresholds;
  private alertConfig: AlertConfig;
  private consecutiveFailures: Map<string, number> = new Map();

  constructor() {
    this.thresholds = {
      min_accuracy: 0.85,
      max_latency: 5000,
      max_error_rate: 0.05,
      min_throughput: 10,
    };

    this.alertConfig = {
      accuracy_degradation_threshold: 0.1,
      latency_spike_threshold: 2.0,
      error_rate_spike_threshold: 0.02,
      consecutive_failures_threshold: 3,
    };
  }

  async recordModelPerformance(
    modelId: string,
    accuracy: number,
    latency: number,
    success: boolean,
    cost: number,
  ): Promise<void> {
    try {
      const existing = this.metrics.get(modelId);
      const errorRate = success ? 0 : 1;

      if (existing) {
        // Update existing metrics with exponential moving average
        const alpha = 0.3; // Smoothing factor
        existing.accuracy = alpha * accuracy + (1 - alpha) * existing.accuracy;
        existing.latency = alpha * latency + (1 - alpha) * existing.latency;
        existing.error_rate =
          alpha * errorRate + (1 - alpha) * existing.error_rate;
        existing.cost_per_request =
          alpha * cost + (1 - alpha) * existing.cost_per_request;
        existing.last_updated = new Date();
      } else {
        // Create new metrics entry
        this.metrics.set(modelId, {
          model_id: modelId,
          accuracy,
          latency,
          error_rate: errorRate,
          throughput: 1,
          cost_per_request: cost,
          last_updated: new Date(),
        });
      }

      // Track consecutive failures
      if (!success) {
        const failures = this.consecutiveFailures.get(modelId) || 0;
        this.consecutiveFailures.set(modelId, failures + 1);
      } else {
        this.consecutiveFailures.set(modelId, 0);
      }

      // Check for performance degradation
      await this.checkPerformanceDegradation(modelId);
    } catch (error) {
      logger.error("Error recording model performance:", error);
    }
  }

  async checkPerformanceDegradation(modelId: string): Promise<boolean> {
    const metrics = this.metrics.get(modelId);
    if (!metrics) return false;

    const issues: string[] = [];

    // Check accuracy degradation
    if (metrics.accuracy < this.thresholds.min_accuracy) {
      issues.push(
        `Accuracy below threshold: ${metrics.accuracy} < ${this.thresholds.min_accuracy}`,
      );
    }

    // Check latency spikes
    if (metrics.latency > this.thresholds.max_latency) {
      issues.push(
        `Latency above threshold: ${metrics.latency}ms > ${this.thresholds.max_latency}ms`,
      );
    }

    // Check error rate
    if (metrics.error_rate > this.thresholds.max_error_rate) {
      issues.push(
        `Error rate above threshold: ${metrics.error_rate} > ${this.thresholds.max_error_rate}`,
      );
    }

    // Check consecutive failures
    const failures = this.consecutiveFailures.get(modelId) || 0;
    if (failures >= this.alertConfig.consecutive_failures_threshold) {
      issues.push(
        `Consecutive failures: ${failures} >= ${this.alertConfig.consecutive_failures_threshold}`,
      );
    }

    if (issues.length > 0) {
      await this.triggerPerformanceAlert(modelId, issues);
      return true;
    }

    return false;
  }

  async triggerPerformanceAlert(
    modelId: string,
    issues: string[],
  ): Promise<void> {
    const alert = {
      model_id: modelId,
      timestamp: new Date(),
      severity: "HIGH",
      issues,
      metrics: this.metrics.get(modelId),
      recommended_action: this.getRecommendedAction(issues),
    };

    logger.warn("Model performance alert triggered:", alert);

    // Send alert to monitoring system
    await this.sendAlert(alert);

    // Trigger automatic model switching if critical
    if (this.isCriticalPerformanceIssue(issues)) {
      await this.triggerAutomaticModelSwitch(modelId);
    }
  }

  private getRecommendedAction(issues: string[]): string {
    if (issues.some((issue) => issue.includes("Consecutive failures"))) {
      return "IMMEDIATE_SWITCH";
    }
    if (issues.some((issue) => issue.includes("Error rate"))) {
      return "INVESTIGATE_AND_SWITCH";
    }
    if (issues.some((issue) => issue.includes("Latency"))) {
      return "SCALE_RESOURCES";
    }
    if (issues.some((issue) => issue.includes("Accuracy"))) {
      return "RETRAIN_MODEL";
    }
    return "MONITOR_CLOSELY";
  }

  private isCriticalPerformanceIssue(issues: string[]): boolean {
    return issues.some(
      (issue) =>
        issue.includes("Consecutive failures") ||
        issue.includes("Error rate above threshold"),
    );
  }

  async triggerAutomaticModelSwitch(
    failingModelId: string,
  ): Promise<string | null> {
    try {
      // Find best alternative model
      const alternatives = this.findAlternativeModels(failingModelId);
      const bestAlternative = this.selectBestAlternative(alternatives);

      if (bestAlternative) {
        logger.info(
          `Automatically switching from ${failingModelId} to ${bestAlternative}`,
        );

        // Update routing rules to use alternative model
        await this.updateRoutingRules(failingModelId, bestAlternative);

        // Notify NeuroWeaver of the switch
        await this.notifyNeuroWeaver(failingModelId, bestAlternative);

        return bestAlternative;
      }

      logger.warn(
        `No suitable alternative found for failing model: ${failingModelId}`,
      );
      return null;
    } catch (error) {
      logger.error("Error during automatic model switch:", error);
      return null;
    }
  }

  private findAlternativeModels(failingModelId: string): ModelMetrics[] {
    const alternatives: ModelMetrics[] = [];

    for (const [modelId, metrics] of this.metrics.entries()) {
      if (modelId !== failingModelId && this.isModelHealthy(metrics)) {
        alternatives.push(metrics);
      }
    }

    return alternatives;
  }

  private isModelHealthy(metrics: ModelMetrics): boolean {
    return (
      metrics.accuracy >= this.thresholds.min_accuracy &&
      metrics.latency <= this.thresholds.max_latency &&
      metrics.error_rate <= this.thresholds.max_error_rate
    );
  }

  private selectBestAlternative(alternatives: ModelMetrics[]): string | null {
    if (alternatives.length === 0) return null;

    // Score models based on performance metrics
    const scored = alternatives.map((model) => ({
      model_id: model.model_id,
      score: this.calculatePerformanceScore(model),
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    return scored[0].model_id;
  }

  private calculatePerformanceScore(metrics: ModelMetrics): number {
    // Weighted scoring: accuracy (40%), latency (30%), error_rate (20%), cost (10%)
    const accuracyScore = metrics.accuracy * 0.4;
    const latencyScore = (1 - Math.min(metrics.latency / 10000, 1)) * 0.3;
    const errorScore = (1 - metrics.error_rate) * 0.2;
    const costScore = (1 - Math.min(metrics.cost_per_request / 0.1, 1)) * 0.1;

    return accuracyScore + latencyScore + errorScore + costScore;
  }

  private async updateRoutingRules(
    failingModelId: string,
    replacementModelId: string,
  ): Promise<void> {
    // This would integrate with the steering rules engine
    logger.info(
      `Updating routing rules: ${failingModelId} -> ${replacementModelId}`,
    );
    // Implementation would update the YAML config or database rules
  }

  private async notifyNeuroWeaver(
    failingModelId: string,
    replacementModelId: string,
  ): Promise<void> {
    try {
      // Send notification to NeuroWeaver about model switch
      const notification = {
        event: "model_switch",
        failing_model: failingModelId,
        replacement_model: replacementModelId,
        timestamp: new Date(),
        reason: "performance_degradation",
      };

      logger.info("Notifying NeuroWeaver of model switch:", notification);
      // Implementation would send HTTP request to NeuroWeaver API
    } catch (error) {
      logger.error("Error notifying NeuroWeaver:", error);
    }
  }

  private async sendAlert(alert: any): Promise<void> {
    try {
      // Send to monitoring system (Prometheus, Grafana, etc.)
      logger.info("Sending performance alert to monitoring system:", alert);
      // Implementation would send to actual alerting system
    } catch (error) {
      logger.error("Error sending alert:", error);
    }
  }

  // Public API methods
  getModelMetrics(modelId: string): ModelMetrics | undefined {
    return this.metrics.get(modelId);
  }

  getAllModelMetrics(): ModelMetrics[] {
    return Array.from(this.metrics.values());
  }

  getHealthyModels(): ModelMetrics[] {
    return Array.from(this.metrics.values()).filter(
      this.isModelHealthy.bind(this),
    );
  }

  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info("Performance thresholds updated:", this.thresholds);
  }

  updateAlertConfig(newConfig: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...newConfig };
    logger.info("Alert configuration updated:", this.alertConfig);
  }
}

