/**
 * Memory Profiler for Chrome DevTools Integration - Error-IQ
 * Monitors heap usage, detects memory leaks, and provides profiling tools
 */

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  objects: number;
}

export interface MemoryLeakDetection {
  isLeaking: boolean;
  growthRate: number;
  recommendedAction: string;
  details: string;
}

export interface MemoryMetrics {
  currentUsage: number;
  peakUsage: number;
  averageUsage: number;
  leakDetected: boolean;
  garbageCollections: number;
}

class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];
  private metrics: MemoryMetrics;
  private intervalId: number | null = null;
  private isInitialized = false;
  private gcObserver: PerformanceObserver | null = null;

  constructor() {
    this.metrics = {
      currentUsage: 0,
      peakUsage: 0,
      averageUsage: 0,
      leakDetected: false,
      garbageCollections: 0,
    };
  }

  /**
   * Initialize memory profiling
   */
  public init(): void {
    if (this.isInitialized) return;

    this.setupMemoryMonitoring();
    this.setupGarbageCollectionObserver();
    this.startPeriodicSnapshots();

    this.isInitialized = true;

  }

  /**
   * Set up memory monitoring using Performance.memory API
   */
  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      this.takeSnapshot();

    } else {

    }
  }

  /**
   * Set up garbage collection observer
   */
  private setupGarbageCollectionObserver(): void {
    try {
      this.gcObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'gc') {
            this.metrics.garbageCollections++;
            const gcEntry = entry as any;
            if (gcEntry.usedJSHeapSize) {
            }
          }
        }
      });

      this.gcObserver.observe({ entryTypes: ['gc'] });
    } catch (error) {

    }
  }

  /**
   * Start periodic memory snapshots
   */
  private startPeriodicSnapshots(): void {
    this.intervalId = window.setInterval(() => {
      this.takeSnapshot();
      this.detectMemoryLeaks();
    }, 30000); // Every 30 seconds
  }

  /**
   * Take a memory snapshot
   */
  private takeSnapshot(): void {
    if (!('memory' in performance)) return;

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memory.usedJSHeapSize,
      heapTotal: memory.totalJSHeapSize,
      external: memory.external,
      rss: memory.rss || 0,
      objects: this.estimateObjectCount(),
    };

    this.snapshots.push(snapshot);
    this.updateMetrics(snapshot);

    // Keep only last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }

    // Log to console for DevTools visibility
    const heapUsedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const heapTotalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);

  }

  /**
   * Estimate object count (simplified)
   */
  private estimateObjectCount(): number {
    // This is a simplified estimation
    // In a real implementation, you might use more sophisticated methods
    return Math.floor(Math.random() * 10000) + 5000; // Placeholder
  }

  /**
   * Update memory metrics
   */
  private updateMetrics(snapshot: MemorySnapshot): void {
    this.metrics.currentUsage = snapshot.heapUsed;
    this.metrics.peakUsage = Math.max(this.metrics.peakUsage, snapshot.heapUsed);

    const totalUsage = this.snapshots.reduce((sum, s) => sum + s.heapUsed, 0);
    this.metrics.averageUsage = totalUsage / this.snapshots.length;
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    if (this.snapshots.length < 10) return;

    const recent = this.snapshots.slice(-10);
    const older = this.snapshots.slice(-20, -10);

    if (older.length === 0) return;

    const recentAvg = recent.reduce((sum, s) => sum + s.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.heapUsed, 0) / older.length;

    const growthRate = (recentAvg - olderAvg) / olderAvg;

    if (growthRate > 0.1) { // 10% growth
      this.metrics.leakDetected = true;
      console.warn(`[Memory] Potential memory leak detected. Growth rate: ${(growthRate * 100).toFixed(2)}%`);

      // Trigger garbage collection if available
      if ('gc' in window) {
        (window as any).gc();

      }
    } else {
      this.metrics.leakDetected = false;
    }
  }

  /**
   * Get detailed memory leak analysis
   */
  public analyzeMemoryLeaks(): MemoryLeakDetection {
    if (this.snapshots.length < 20) {
      return {
        isLeaking: false,
        growthRate: 0,
        recommendedAction: 'Need more data for analysis',
        details: 'Insufficient snapshots for leak detection',
      };
    }

    const recent = this.snapshots.slice(-10);
    const older = this.snapshots.slice(-20, -10);

    const recentAvg = recent.reduce((sum, s) => sum + s.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.heapUsed, 0) / older.length;

    const growthRate = (recentAvg - olderAvg) / olderAvg;
    const isLeaking = growthRate > 0.1;

    let recommendedAction = '';
    let details = '';

    if (isLeaking) {
      recommendedAction = 'Investigate object retention and event listeners';
      details = `Memory usage increased by ${(growthRate * 100).toFixed(2)}% over the last 10 snapshots`;
    } else {
      recommendedAction = 'Memory usage is stable';
      details = `Memory usage changed by ${(growthRate * 100).toFixed(2)}% - within normal range`;
    }

    return {
      isLeaking,
      growthRate,
      recommendedAction,
      details,
    };
  }

  /**
   * Force garbage collection (if available)
   */
  public forceGarbageCollection(): void {
    if ('gc' in window) {
      (window as any).gc();

      this.takeSnapshot();
    } else {

    }
  }

  /**
   * Get current memory metrics
   */
  public getMetrics(): MemoryMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent memory snapshots
   */
  public getSnapshots(limit = 50): MemorySnapshot[] {
    return this.snapshots.slice(-limit);
  }

  /**
   * Create a heap snapshot for DevTools
   */
  public createHeapSnapshot(): void {
    if ('memory' in performance) {

      // In a real implementation, this would integrate with DevTools heap snapshot
    }
  }

  /**
   * Clear snapshots and reset metrics
   */
  public clearSnapshots(): void {
    this.snapshots = [];
    this.metrics = {
      currentUsage: 0,
      peakUsage: 0,
      averageUsage: 0,
      leakDetected: false,
      garbageCollections: 0,
    };
  }

  /**
   * Destroy profiler and clean up
   */
  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.gcObserver) {
      this.gcObserver.disconnect();
      this.gcObserver = null;
    }

    this.clearSnapshots();
    this.isInitialized = false;
  }
}

export { MemoryProfiler };


