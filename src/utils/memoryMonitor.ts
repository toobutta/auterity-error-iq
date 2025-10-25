/**
 * Memory Leak Detection and Monitoring using Auterity's Infrastructure
 */

import { unifiedApiClient } from '../../../auterity-error-iq/shared/services/unified-api-client/index.js';
import { logger } from '../../../auterity-error-iq/shared/utils/logger.js';

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  componentName?: string;
  operation?: string;
}

export interface LeakReport {
  componentName: string;
  hasLeak: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  memoryDelta: number;
  objectCountDelta: number;
  recommendations: string[];
  auterityMetrics?: any;
  timestamp: number;
}

export interface PerformanceResult {
  operation: string;
  duration: number;
  memoryDelta: number;
  fps: number;
  auterityMetrics?: any;
  timestamp: number;
}

/**
 * Memory Metrics Collector with Auterity Integration
 */
export class MemoryMetricsCollector {
  private collectionInterval: NodeJS.Timeout | null = null;
  private metricsHistory: MemorySnapshot[] = [];

  constructor() {
    this.startCollection();

    logger.info('MemoryMetricsCollector initialized', {
      component: 'memory-monitor',
      action: 'initialization'
    });
  }

  private startCollection() {
    // Collect metrics every 5 seconds
    this.collectionInterval = setInterval(() => {
      try {
        const memUsage = process.memoryUsage();
        const snapshot: MemorySnapshot = {
          timestamp: Date.now(),
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        };

        this.metricsHistory.push(snapshot);

        // Keep only last 100 entries
        if (this.metricsHistory.length > 100) {
          this.metricsHistory = this.metricsHistory.slice(-100);
        }

        // Log significant memory changes
        this.logMemoryChanges(snapshot);

      } catch (error) {
        logger.error('Failed to collect memory metrics', {
          component: 'memory-monitor',
          action: 'metrics-collection',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 5000);
  }

  private logMemoryChanges(current: MemorySnapshot) {
    if (this.metricsHistory.length < 2) return;

    const previous = this.metricsHistory[this.metricsHistory.length - 2];
    const heapDelta = current.heapUsed - previous.heapUsed;

    // Log significant changes (>5MB)
    if (Math.abs(heapDelta) > 5 * 1024 * 1024) {
      logger.info('Significant memory change detected', {
        component: 'memory-monitor',
        action: 'memory-change',
        heapDelta,
        currentHeap: current.heapUsed,
        previousHeap: previous.heapUsed
      });
    }
  }

  public getCurrentMetrics(): MemorySnapshot {
    const memUsage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss
    };
  }

  public getMetricsHistory(): MemorySnapshot[] {
    return [...this.metricsHistory];
  }

  public async getAuterityMetrics(timeRange: string = '1h') {
    try {
      return await unifiedApiClient.relaycore.getCostAnalytics({
        timeRange,
        metrics: ['memory', 'performance']
      });
    } catch (error) {
      logger.warn('Failed to get Auterity metrics', {
        component: 'memory-monitor',
        action: 'auterity-metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  public dispose() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.metricsHistory = [];
    logger.info('MemoryMetricsCollector disposed', {
      component: 'memory-monitor',
      action: 'disposal'
    });
  }
}

/**
 * Heap Snapshot Collector for Memory Leak Detection
 */
export class HeapSnapshotCollector {
  private snapshots: Map<string, MemorySnapshot> = new Map();
  private auterityLogger = logger;

  public async takeSnapshot(label: string, componentName?: string, operation?: string): Promise<MemorySnapshot> {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      ...process.memoryUsage(),
      componentName,
      operation
    };

    this.snapshots.set(label, snapshot);

    // Log to Auterity
    this.auterityLogger.info('Heap snapshot captured', {
      component: 'memory-monitor',
      action: 'heap-snapshot',
      label,
      componentName,
      operation,
      memoryUsage: {
        heapUsed: snapshot.heapUsed,
        heapTotal: snapshot.heapTotal,
        external: snapshot.external
      }
    });

    return snapshot;
  }

  public getSnapshot(label: string): MemorySnapshot | undefined {
    return this.snapshots.get(label);
  }

  public compareSnapshots(beforeLabel: string, afterLabel: string): {
    memoryDelta: number;
    duration: number;
    memoryGrowthRate: number;
  } | null {
    const before = this.snapshots.get(beforeLabel);
    const after = this.snapshots.get(afterLabel);

    if (!before || !after) {
      return null;
    }

    const memoryDelta = after.heapUsed - before.heapUsed;
    const duration = after.timestamp - before.timestamp;
    const memoryGrowthRate = duration > 0 ? memoryDelta / duration : 0;

    return {
      memoryDelta,
      duration,
      memoryGrowthRate
    };
  }

  public clearSnapshots() {
    this.snapshots.clear();
  }

  public getAllSnapshots(): MemorySnapshot[] {
    return Array.from(this.snapshots.values());
  }
}

/**
 * Leak Detector using Auterity's monitoring infrastructure
 */
export class LeakDetector {
  private heapCollector: HeapSnapshotCollector;
  private metricsCollector: MemoryMetricsCollector;
  private thresholdConfig = {
    memoryGrowthThreshold: 10 * 1024 * 1024, // 10MB
    memoryGrowthRateThreshold: 1024, // 1KB per second
    leakDetectionInterval: 30000, // 30 seconds
    criticalMemoryThreshold: 100 * 1024 * 1024 // 100MB
  };

  constructor() {
    this.heapCollector = new HeapSnapshotCollector();
    this.metricsCollector = new MemoryMetricsCollector();
  }

  public async detectLeaks(componentName: string, operation?: string): Promise<LeakReport> {
    const startTime = Date.now();

    // Take before snapshot
    const beforeSnapshot = await this.heapCollector.takeSnapshot(
      `${componentName}-before-${startTime}`,
      componentName,
      operation
    );

    // Wait for operation to complete
    await new Promise(resolve => setTimeout(resolve, this.thresholdConfig.leakDetectionInterval));

    // Take after snapshot
    const afterSnapshot = await this.heapCollector.takeSnapshot(
      `${componentName}-after-${startTime}`,
      componentName,
      operation
    );

    // Compare snapshots
    const comparison = this.heapCollector.compareSnapshots(
      `${componentName}-before-${startTime}`,
      `${componentName}-after-${startTime}`
    );

    if (!comparison) {
      throw new Error('Failed to compare snapshots');
    }

    // Get Auterity metrics
    const auterityMetrics = await this.metricsCollector.getAuterityMetrics();

    // Analyze for leaks
    const hasLeak = this.isLeakDetected(comparison);
    const severity = this.calculateSeverity(comparison, afterSnapshot);

    const report: LeakReport = {
      componentName,
      hasLeak,
      severity,
      memoryDelta: comparison.memoryDelta,
      objectCountDelta: 0, // Would need additional instrumentation
      recommendations: this.generateRecommendations(comparison, severity),
      auterityMetrics,
      timestamp: Date.now()
    };

    // Log leak detection results
    this.auterityLogger.info('Memory leak analysis completed', {
      component: 'memory-monitor',
      action: 'leak-detection',
      componentName,
      hasLeak,
      severity,
      memoryDelta: comparison.memoryDelta,
      recommendations: report.recommendations
    });

    return report;
  }

  private isLeakDetected(comparison: { memoryDelta: number; memoryGrowthRate: number }): boolean {
    return comparison.memoryDelta > this.thresholdConfig.memoryGrowthThreshold ||
           comparison.memoryGrowthRate > this.thresholdConfig.memoryGrowthRateThreshold;
  }

  private calculateSeverity(
    comparison: { memoryDelta: number; memoryGrowthRate: number },
    afterSnapshot: MemorySnapshot
  ): 'low' | 'medium' | 'high' | 'critical' {
    const memoryDelta = comparison.memoryDelta;
    const growthRate = comparison.memoryGrowthRate;

    if (afterSnapshot.heapUsed > this.thresholdConfig.criticalMemoryThreshold) {
      return 'critical';
    }

    if (memoryDelta > 50 * 1024 * 1024 || growthRate > 10 * 1024) { // 50MB or 10KB/s
      return 'high';
    }

    if (memoryDelta > 25 * 1024 * 1024 || growthRate > 5 * 1024) { // 25MB or 5KB/s
      return 'medium';
    }

    if (memoryDelta > this.thresholdConfig.memoryGrowthThreshold || growthRate > this.thresholdConfig.memoryGrowthRateThreshold) {
      return 'low';
    }

    return 'low';
  }

  private generateRecommendations(
    comparison: { memoryDelta: number; memoryGrowthRate: number },
    severity: string
  ): string[] {
    const recommendations: string[] = [];

    if (comparison.memoryDelta > 50 * 1024 * 1024) {
      recommendations.push('High memory usage detected. Consider implementing object pooling.');
      recommendations.push('Review component unmounting and cleanup procedures.');
    }

    if (comparison.memoryGrowthRate > 10 * 1024) {
      recommendations.push('Memory leak suspected. Check for event listener cleanup.');
      recommendations.push('Verify proper disposal of resources (timers, subscriptions).');
    }

    if (severity === 'critical') {
      recommendations.push('CRITICAL: Immediate memory optimization required.');
      recommendations.push('Consider force garbage collection and resource cleanup.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory usage appears normal. Continue monitoring.');
    }

    return recommendations;
  }

  public dispose() {
    this.metricsCollector.dispose();
    this.heapCollector.clearSnapshots();
  }

  private get auterityLogger() {
    return logger;
  }
}

/**
 * Performance Monitor with Auterity Integration
 */
export class PerformanceMonitor {
  private metricsCollector: MemoryMetricsCollector;
  private performanceMarks = new Map<string, { startTime: number; memoryStart: MemorySnapshot }>();

  constructor() {
    this.metricsCollector = new MemoryMetricsCollector();
  }

  public async measurePerformance<T>(
    operation: string,
    callback: () => Promise<T>
  ): Promise<{ result: T } & PerformanceResult> {
    const startTime = performance.now();
    const memoryStart = this.metricsCollector.getCurrentMetrics();

    this.performanceMarks.set(operation, { startTime, memoryStart });

    try {
      const result = await callback();

      const endTime = performance.now();
      const memoryEnd = this.metricsCollector.getCurrentMetrics();
      const auterityMetrics = await this.metricsCollector.getAuterityMetrics();

      const performanceResult: PerformanceResult = {
        operation,
        duration: endTime - startTime,
        memoryDelta: memoryEnd.heapUsed - memoryStart.heapUsed,
        fps: this.calculateFPS(),
        auterityMetrics,
        timestamp: Date.now()
      };

      // Log performance metrics
      logger.info('Performance measurement completed', {
        component: 'performance-monitor',
        action: 'measurement',
        operation,
        duration: performanceResult.duration,
        memoryDelta: performanceResult.memoryDelta,
        fps: performanceResult.fps
      });

      return { result, ...performanceResult };

    } finally {
      this.performanceMarks.delete(operation);
    }
  }

  private calculateFPS(): number {
    // Simple FPS calculation - would need more sophisticated implementation
    // for accurate measurements
    return 60; // Placeholder
  }

  public dispose() {
    this.metricsCollector.dispose();
    this.performanceMarks.clear();
  }
}

// Singleton instances for easy access
export const memoryMetricsCollector = new MemoryMetricsCollector();
export const heapSnapshotCollector = new HeapSnapshotCollector();
export const leakDetector = new LeakDetector();
export const performanceMonitor = new PerformanceMonitor();

// Cleanup on process exit
process.on('exit', () => {
  memoryMetricsCollector.dispose();
  leakDetector.dispose();
  performanceMonitor.dispose();
});

process.on('SIGINT', () => {
  memoryMetricsCollector.dispose();
  leakDetector.dispose();
  performanceMonitor.dispose();
  process.exit();
});

process.on('SIGTERM', () => {
  memoryMetricsCollector.dispose();
  leakDetector.dispose();
  performanceMonitor.dispose();
  process.exit();
});
