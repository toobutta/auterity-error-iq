// Performance Monitor - Real-time performance tracking and analytics
import { logger } from '../../../../auterity-error-iq/shared/utils/logger.js';
import type { Workflow, Node } from '@auterity/workflow-contracts';
import type { PerformanceMetrics, OptimizationConfig } from './types.js';

export interface PerformanceSnapshot {
  timestamp: number;
  workflowId: string;
  nodeId?: string;
  metrics: {
    executionTime: number;
    cpuUsage: number;
    memoryUsage: number;
    throughput: number;
    errorRate: number;
    latency: number;
  };
  metadata: {
    version: string;
    environment: string;
    instanceType?: string;
  };
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'threshold_exceeded' | 'anomaly_detected' | 'degradation' | 'failure';
  message: string;
  workflowId: string;
  nodeId?: string;
  metrics: Partial<PerformanceSnapshot['metrics']>;
  recommendations: string[];
}

export interface PerformanceTrend {
  metric: keyof PerformanceSnapshot['metrics'];
  trend: 'improving' | 'degrading' | 'stable';
  changeRate: number;
  timeWindow: number;
  confidence: number;
}

export interface PerformanceBaseline {
  workflowId: string;
  nodeId?: string;
  baselineMetrics: PerformanceSnapshot['metrics'];
  varianceThresholds: PerformanceSnapshot['metrics'];
  sampleSize: number;
  lastUpdated: number;
}

export class PerformanceMonitor {
  private config: OptimizationConfig;
  private snapshots = new Map<string, PerformanceSnapshot[]>();
  private baselines = new Map<string, PerformanceBaseline>();
  private alerts: PerformanceAlert[] = [];
  private activeMonitoring = new Set<string>();

  constructor(config: OptimizationConfig) {
    this.config = config;
    logger.info('PerformanceMonitor initialized');
  }

  /**
   * Capture performance snapshot
   */
  async captureSnapshot(
    workflowId: string,
    nodeId?: string,
    customMetrics?: Partial<PerformanceSnapshot['metrics']>
  ): Promise<PerformanceSnapshot> {
    try {
      const timestamp = Date.now();
      
      // Collect performance metrics
      const metrics = await this.collectMetrics(workflowId, nodeId, customMetrics);
      
      const snapshot: PerformanceSnapshot = {
        timestamp,
        workflowId,
        nodeId,
        metrics,
        metadata: {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          instanceType: process.env.INSTANCE_TYPE
        }
      };

      // Store snapshot
      const key = nodeId ? `${workflowId}:${nodeId}` : workflowId;
      const existing = this.snapshots.get(key) || [];
      existing.push(snapshot);
      
      // Keep only recent snapshots (last 1000)
      if (existing.length > 1000) {
        existing.splice(0, existing.length - 1000);
      }
      
      this.snapshots.set(key, existing);

      // Check for alerts
      await this.checkAlerts(snapshot);

      logger.debug('Performance snapshot captured', {
        workflowId,
        nodeId,
        timestamp,
        metrics
      });

      return snapshot;

    } catch (error) {
      logger.error('Failed to capture performance snapshot', {
        workflowId,
        nodeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Start monitoring workflow performance
   */
  async startMonitoring(workflowId: string, interval: number = 30000): Promise<void> {
    try {
      if (this.activeMonitoring.has(workflowId)) {
        logger.warn('Monitoring already active for workflow', { workflowId });
        return;
      }

      this.activeMonitoring.add(workflowId);

      // Set up periodic monitoring
      const monitoringTimer = setInterval(async () => {
        try {
          if (!this.activeMonitoring.has(workflowId)) {
            clearInterval(monitoringTimer);
            return;
          }

          await this.captureSnapshot(workflowId);
        } catch (error) {
          logger.error('Error during periodic monitoring', {
            workflowId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }, interval);

      logger.info('Started monitoring workflow', { workflowId, interval });

    } catch (error) {
      logger.error('Failed to start monitoring', {
        workflowId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Stop monitoring workflow performance
   */
  stopMonitoring(workflowId: string): void {
    this.activeMonitoring.delete(workflowId);
    logger.info('Stopped monitoring workflow', { workflowId });
  }

  /**
   * Get performance metrics for analysis
   */
  getPerformanceMetrics(
    workflowId: string,
    nodeId?: string,
    timeRange?: { start: number; end: number }
  ): PerformanceSnapshot[] {
    const key = nodeId ? `${workflowId}:${nodeId}` : workflowId;
    const snapshots = this.snapshots.get(key) || [];

    if (!timeRange) {
      return snapshots;
    }

    return snapshots.filter(snapshot => 
      snapshot.timestamp >= timeRange.start && snapshot.timestamp <= timeRange.end
    );
  }

  /**
   * Detect performance anomalies
   */
  async detectAnomalies(
    workflowId: string,
    nodeId?: string
  ): Promise<PerformanceAlert[]> {
    try {
      const metrics = this.getPerformanceMetrics(workflowId, nodeId);
      if (metrics.length < 10) {
        return []; // Need sufficient data for anomaly detection
      }

      const anomalies: PerformanceAlert[] = [];
      const baseline = await this.getOrCreateBaseline(workflowId, nodeId);

      // Check recent metrics against baseline
      const recentMetrics = metrics.slice(-10);
      
      for (const snapshot of recentMetrics) {
        const anomalyChecks = [
          this.checkExecutionTimeAnomaly(snapshot, baseline),
          this.checkCPUAnomaly(snapshot, baseline),
          this.checkMemoryAnomaly(snapshot, baseline),
          this.checkThroughputAnomaly(snapshot, baseline),
          this.checkErrorRateAnomaly(snapshot, baseline)
        ];

        for (const anomaly of anomalyChecks) {
          if (anomaly) {
            anomalies.push(anomaly);
          }
        }
      }

      logger.info('Anomaly detection completed', {
        workflowId,
        nodeId,
        anomalyCount: anomalies.length
      });

      return anomalies;

    } catch (error) {
      logger.error('Anomaly detection failed', {
        workflowId,
        nodeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Analyze performance trends
   */
  async analyzePerformanceTrends(
    workflowId: string,
    nodeId?: string,
    timeWindow: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<PerformanceTrend[]> {
    try {
      const now = Date.now();
      const metrics = this.getPerformanceMetrics(workflowId, nodeId, {
        start: now - timeWindow,
        end: now
      });

      if (metrics.length < 5) {
        return []; // Need sufficient data for trend analysis
      }

      const trends: PerformanceTrend[] = [];

      // Analyze each metric
      const metricKeys: Array<keyof PerformanceSnapshot['metrics']> = [
        'executionTime', 'cpuUsage', 'memoryUsage', 'throughput', 'errorRate', 'latency'
      ];

      for (const metric of metricKeys) {
        const trend = this.calculateTrend(metrics, metric, timeWindow);
        trends.push(trend);
      }

      logger.info('Performance trend analysis completed', {
        workflowId,
        nodeId,
        timeWindow,
        trendCount: trends.length
      });

      return trends;

    } catch (error) {
      logger.error('Performance trend analysis failed', {
        workflowId,
        nodeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Generate performance reports
   */
  async generatePerformanceReport(
    workflowId: string,
    timeRange: { start: number; end: number }
  ): Promise<{
    summary: {
      totalSnapshots: number;
      avgExecutionTime: number;
      avgCpuUsage: number;
      avgMemoryUsage: number;
      avgThroughput: number;
      totalErrors: number;
      avgLatency: number;
    };
    trends: PerformanceTrend[];
    anomalies: PerformanceAlert[];
    recommendations: string[];
  }> {
    try {
      const metrics = this.getPerformanceMetrics(workflowId, undefined, timeRange);
      
      // Calculate summary statistics
      const summary = this.calculateSummaryStatistics(metrics);
      
      // Get trends and anomalies
      const trends = await this.analyzePerformanceTrends(
        workflowId, 
        undefined, 
        timeRange.end - timeRange.start
      );
      const anomalies = await this.detectAnomalies(workflowId);
      
      // Generate recommendations
      const recommendations = this.generatePerformanceRecommendations(summary, trends, anomalies);

      logger.info('Performance report generated', {
        workflowId,
        timeRange,
        totalSnapshots: summary.totalSnapshots
      });

      return {
        summary,
        trends,
        anomalies,
        recommendations
      };

    } catch (error) {
      logger.error('Performance report generation failed', {
        workflowId,
        timeRange,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(workflowId?: string): PerformanceAlert[] {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours
    
    let alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
    
    if (workflowId) {
      alerts = alerts.filter(alert => alert.workflowId === workflowId);
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Private helper methods
  private async collectMetrics(
    workflowId: string,
    nodeId?: string,
    customMetrics?: Partial<PerformanceSnapshot['metrics']>
  ): Promise<PerformanceSnapshot['metrics']> {
    // Simulate metric collection - in real implementation, these would come from actual monitoring systems
    const baseMetrics = {
      executionTime: Math.random() * 5000 + 1000, // 1-6 seconds
      cpuUsage: Math.random() * 80 + 10, // 10-90%
      memoryUsage: Math.random() * 70 + 20, // 20-90%
      throughput: Math.random() * 1000 + 100, // 100-1100 ops/sec
      errorRate: Math.random() * 5, // 0-5%
      latency: Math.random() * 200 + 50 // 50-250ms
    };

    // Merge with custom metrics if provided
    return { ...baseMetrics, ...customMetrics };
  }

  private async checkAlerts(snapshot: PerformanceSnapshot): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // CPU threshold check
    if (snapshot.metrics.cpuUsage > 90) {
      alerts.push({
        id: `cpu-${Date.now()}`,
        timestamp: snapshot.timestamp,
        severity: 'high',
        type: 'threshold_exceeded',
        message: `High CPU usage detected: ${snapshot.metrics.cpuUsage.toFixed(1)}%`,
        workflowId: snapshot.workflowId,
        nodeId: snapshot.nodeId,
        metrics: { cpuUsage: snapshot.metrics.cpuUsage },
        recommendations: ['Scale up CPU resources', 'Optimize CPU-intensive operations']
      });
    }

    // Memory threshold check
    if (snapshot.metrics.memoryUsage > 85) {
      alerts.push({
        id: `memory-${Date.now()}`,
        timestamp: snapshot.timestamp,
        severity: 'high',
        type: 'threshold_exceeded',
        message: `High memory usage detected: ${snapshot.metrics.memoryUsage.toFixed(1)}%`,
        workflowId: snapshot.workflowId,
        nodeId: snapshot.nodeId,
        metrics: { memoryUsage: snapshot.metrics.memoryUsage },
        recommendations: ['Scale up memory resources', 'Optimize memory usage patterns']
      });
    }

    // Error rate threshold check
    if (snapshot.metrics.errorRate > 5) {
      alerts.push({
        id: `error-${Date.now()}`,
        timestamp: snapshot.timestamp,
        severity: 'critical',
        type: 'threshold_exceeded',
        message: `High error rate detected: ${snapshot.metrics.errorRate.toFixed(1)}%`,
        workflowId: snapshot.workflowId,
        nodeId: snapshot.nodeId,
        metrics: { errorRate: snapshot.metrics.errorRate },
        recommendations: ['Investigate error causes', 'Implement error handling', 'Review code quality']
      });
    }

    // Add alerts to collection
    this.alerts.push(...alerts);

    // Limit alert history
    if (this.alerts.length > 1000) {
      this.alerts.splice(0, this.alerts.length - 1000);
    }
  }

  private async getOrCreateBaseline(
    workflowId: string,
    nodeId?: string
  ): Promise<PerformanceBaseline> {
    const key = nodeId ? `${workflowId}:${nodeId}` : workflowId;
    
    let baseline = this.baselines.get(key);
    
    if (!baseline) {
      const metrics = this.getPerformanceMetrics(workflowId, nodeId);
      if (metrics.length >= 10) {
        baseline = this.calculateBaseline(workflowId, nodeId, metrics);
        this.baselines.set(key, baseline);
      } else {
        // Default baseline for new workflows
        baseline = {
          workflowId,
          nodeId,
          baselineMetrics: {
            executionTime: 3000,
            cpuUsage: 50,
            memoryUsage: 50,
            throughput: 500,
            errorRate: 1,
            latency: 100
          },
          varianceThresholds: {
            executionTime: 1000,
            cpuUsage: 20,
            memoryUsage: 20,
            throughput: 200,
            errorRate: 2,
            latency: 50
          },
          sampleSize: 0,
          lastUpdated: Date.now()
        };
        this.baselines.set(key, baseline);
      }
    }
    
    return baseline;
  }

  private calculateBaseline(
    workflowId: string,
    nodeId: string | undefined,
    metrics: PerformanceSnapshot[]
  ): PerformanceBaseline {
    const recentMetrics = metrics.slice(-50); // Use last 50 snapshots
    
    const averages = {
      executionTime: this.calculateAverage(recentMetrics, 'executionTime'),
      cpuUsage: this.calculateAverage(recentMetrics, 'cpuUsage'),
      memoryUsage: this.calculateAverage(recentMetrics, 'memoryUsage'),
      throughput: this.calculateAverage(recentMetrics, 'throughput'),
      errorRate: this.calculateAverage(recentMetrics, 'errorRate'),
      latency: this.calculateAverage(recentMetrics, 'latency')
    };

    const variances = {
      executionTime: this.calculateStandardDeviation(recentMetrics, 'executionTime') * 2,
      cpuUsage: this.calculateStandardDeviation(recentMetrics, 'cpuUsage') * 2,
      memoryUsage: this.calculateStandardDeviation(recentMetrics, 'memoryUsage') * 2,
      throughput: this.calculateStandardDeviation(recentMetrics, 'throughput') * 2,
      errorRate: this.calculateStandardDeviation(recentMetrics, 'errorRate') * 2,
      latency: this.calculateStandardDeviation(recentMetrics, 'latency') * 2
    };

    return {
      workflowId,
      nodeId,
      baselineMetrics: averages,
      varianceThresholds: variances,
      sampleSize: recentMetrics.length,
      lastUpdated: Date.now()
    };
  }

  private calculateAverage(
    metrics: PerformanceSnapshot[],
    key: keyof PerformanceSnapshot['metrics']
  ): number {
    const sum = metrics.reduce((total, metric) => total + metric.metrics[key], 0);
    return sum / metrics.length;
  }

  private calculateStandardDeviation(
    metrics: PerformanceSnapshot[],
    key: keyof PerformanceSnapshot['metrics']
  ): number {
    const average = this.calculateAverage(metrics, key);
    const squaredDiffs = metrics.map(metric => Math.pow(metric.metrics[key] - average, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / metrics.length;
    return Math.sqrt(variance);
  }

  private checkExecutionTimeAnomaly(
    snapshot: PerformanceSnapshot,
    baseline: PerformanceBaseline
  ): PerformanceAlert | null {
    const deviation = Math.abs(snapshot.metrics.executionTime - baseline.baselineMetrics.executionTime);
    
    if (deviation > baseline.varianceThresholds.executionTime) {
      return {
        id: `exec-anomaly-${Date.now()}`,
        timestamp: snapshot.timestamp,
        severity: deviation > baseline.varianceThresholds.executionTime * 2 ? 'high' : 'medium',
        type: 'anomaly_detected',
        message: `Execution time anomaly: ${snapshot.metrics.executionTime}ms vs baseline ${baseline.baselineMetrics.executionTime}ms`,
        workflowId: snapshot.workflowId,
        nodeId: snapshot.nodeId,
        metrics: { executionTime: snapshot.metrics.executionTime },
        recommendations: ['Check for performance bottlenecks', 'Review recent code changes']
      };
    }
    
    return null;
  }

  private checkCPUAnomaly(
    snapshot: PerformanceSnapshot,
    baseline: PerformanceBaseline
  ): PerformanceAlert | null {
    const deviation = Math.abs(snapshot.metrics.cpuUsage - baseline.baselineMetrics.cpuUsage);
    
    if (deviation > baseline.varianceThresholds.cpuUsage) {
      return {
        id: `cpu-anomaly-${Date.now()}`,
        timestamp: snapshot.timestamp,
        severity: deviation > baseline.varianceThresholds.cpuUsage * 2 ? 'high' : 'medium',
        type: 'anomaly_detected',
        message: `CPU usage anomaly: ${snapshot.metrics.cpuUsage}% vs baseline ${baseline.baselineMetrics.cpuUsage}%`,
        workflowId: snapshot.workflowId,
        nodeId: snapshot.nodeId,
        metrics: { cpuUsage: snapshot.metrics.cpuUsage },
        recommendations: ['Monitor CPU-intensive operations', 'Consider resource scaling']
      };
    }
    
    return null;
  }

  private checkMemoryAnomaly(
    snapshot: PerformanceSnapshot,
    baseline: PerformanceBaseline
  ): PerformanceAlert | null {
    const deviation = Math.abs(snapshot.metrics.memoryUsage - baseline.baselineMetrics.memoryUsage);
    
    if (deviation > baseline.varianceThresholds.memoryUsage) {
      return {
        id: `memory-anomaly-${Date.now()}`,
        timestamp: snapshot.timestamp,
        severity: deviation > baseline.varianceThresholds.memoryUsage * 2 ? 'high' : 'medium',
        type: 'anomaly_detected',
        message: `Memory usage anomaly: ${snapshot.metrics.memoryUsage}% vs baseline ${baseline.baselineMetrics.memoryUsage}%`,
        workflowId: snapshot.workflowId,
        nodeId: snapshot.nodeId,
        metrics: { memoryUsage: snapshot.metrics.memoryUsage },
        recommendations: ['Check for memory leaks', 'Optimize data structures']
      };
    }
    
    return null;
  }

  private checkThroughputAnomaly(
    snapshot: PerformanceSnapshot,
    baseline: PerformanceBaseline
  ): PerformanceAlert | null {
    const deviation = Math.abs(snapshot.metrics.throughput - baseline.baselineMetrics.throughput);
    
    if (deviation > baseline.varianceThresholds.throughput) {
      return {
        id: `throughput-anomaly-${Date.now()}`,
        timestamp: snapshot.timestamp,
        severity: snapshot.metrics.throughput < baseline.baselineMetrics.throughput ? 'high' : 'medium',
        type: 'anomaly_detected',
        message: `Throughput anomaly: ${snapshot.metrics.throughput} ops/sec vs baseline ${baseline.baselineMetrics.throughput} ops/sec`,
        workflowId: snapshot.workflowId,
        nodeId: snapshot.nodeId,
        metrics: { throughput: snapshot.metrics.throughput },
        recommendations: ['Investigate performance bottlenecks', 'Optimize data processing']
      };
    }
    
    return null;
  }

  private checkErrorRateAnomaly(
    snapshot: PerformanceSnapshot,
    baseline: PerformanceBaseline
  ): PerformanceAlert | null {
    const deviation = Math.abs(snapshot.metrics.errorRate - baseline.baselineMetrics.errorRate);
    
    if (deviation > baseline.varianceThresholds.errorRate) {
      return {
        id: `error-anomaly-${Date.now()}`,
        timestamp: snapshot.timestamp,
        severity: 'high',
        type: 'anomaly_detected',
        message: `Error rate anomaly: ${snapshot.metrics.errorRate}% vs baseline ${baseline.baselineMetrics.errorRate}%`,
        workflowId: snapshot.workflowId,
        nodeId: snapshot.nodeId,
        metrics: { errorRate: snapshot.metrics.errorRate },
        recommendations: ['Review error logs', 'Implement additional error handling']
      };
    }
    
    return null;
  }

  private calculateTrend(
    metrics: PerformanceSnapshot[],
    metric: keyof PerformanceSnapshot['metrics'],
    timeWindow: number
  ): PerformanceTrend {
    if (metrics.length < 2) {
      return {
        metric,
        trend: 'stable',
        changeRate: 0,
        timeWindow,
        confidence: 0
      };
    }

    // Calculate linear regression for trend
    const values = metrics.map(m => m.metrics[metric]);
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const confidence = Math.min(n / 10, 1); // Higher confidence with more data points
    
    let trend: 'improving' | 'degrading' | 'stable';
    if (Math.abs(slope) < 0.01) {
      trend = 'stable';
    } else if (metric === 'errorRate' || metric === 'executionTime' || metric === 'latency') {
      // For these metrics, negative slope is improvement
      trend = slope < 0 ? 'improving' : 'degrading';
    } else {
      // For throughput, CPU, memory usage, positive slope could be improvement or degradation
      trend = slope > 0 ? 'improving' : 'degrading';
    }

    return {
      metric,
      trend,
      changeRate: slope,
      timeWindow,
      confidence
    };
  }

  private calculateSummaryStatistics(metrics: PerformanceSnapshot[]): {
    totalSnapshots: number;
    avgExecutionTime: number;
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgThroughput: number;
    totalErrors: number;
    avgLatency: number;
  } {
    if (metrics.length === 0) {
      return {
        totalSnapshots: 0,
        avgExecutionTime: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgThroughput: 0,
        totalErrors: 0,
        avgLatency: 0
      };
    }

    return {
      totalSnapshots: metrics.length,
      avgExecutionTime: this.calculateAverage(metrics, 'executionTime'),
      avgCpuUsage: this.calculateAverage(metrics, 'cpuUsage'),
      avgMemoryUsage: this.calculateAverage(metrics, 'memoryUsage'),
      avgThroughput: this.calculateAverage(metrics, 'throughput'),
      totalErrors: metrics.reduce((sum, m) => sum + m.metrics.errorRate, 0),
      avgLatency: this.calculateAverage(metrics, 'latency')
    };
  }

  private generatePerformanceRecommendations(
    summary: ReturnType<typeof this.calculateSummaryStatistics>,
    trends: PerformanceTrend[],
    anomalies: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // Analyze summary statistics
    if (summary.avgExecutionTime > 5000) {
      recommendations.push('Consider optimizing workflow execution time - average is over 5 seconds');
    }

    if (summary.avgCpuUsage > 80) {
      recommendations.push('High CPU usage detected - consider scaling resources or optimizing algorithms');
    }

    if (summary.avgMemoryUsage > 80) {
      recommendations.push('High memory usage detected - optimize memory allocation and usage patterns');
    }

    if (summary.totalErrors > summary.totalSnapshots * 0.05) {
      recommendations.push('Error rate is above 5% - investigate and implement better error handling');
    }

    // Analyze trends
    const degradingTrends = trends.filter(t => t.trend === 'degrading' && t.confidence > 0.5);
    if (degradingTrends.length > 0) {
      recommendations.push(`Performance degradation detected in: ${degradingTrends.map(t => t.metric).join(', ')}`);
    }

    // Analyze anomalies
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      recommendations.push('Critical performance anomalies detected - immediate investigation required');
    }

    return recommendations;
  }
}
