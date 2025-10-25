// Performance Monitoring and Optimization Utilities
import { useRef } from 'react';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  frameTime: number;
  nodeCount: number;
  connectionCount: number;
  timestamp: number;
}

export interface PerformanceSnapshot {
  timestamp: number;
  metrics: PerformanceMetrics;
  memorySnapshots: number[];
  renderTimings: number[];
}

export interface PerformanceThresholds {
  targetFPS: number;
  maxMemoryUsage: number;
  maxRenderTime: number;
  warningThreshold: number;
  criticalThreshold: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 100;
  private frameCount = 0;
  private lastTime = 0;
  private renderTimings: number[] = [];
  private memorySnapshots: number[] = [];
  private isMonitoring = false;
  private thresholds: PerformanceThresholds;

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      targetFPS: 60,
      maxMemoryUsage: 100, // MB
      maxRenderTime: 16.67, // ms (60fps)
      warningThreshold: 0.8,
      criticalThreshold: 0.5,
      ...thresholds
    };
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.renderTimings = [];
    this.memorySnapshots = [];
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  recordFrame(renderTime: number, nodeCount: number, connectionCount: number): void {
    if (!this.isMonitoring) return;

    this.frameCount++;
    this.renderTimings.push(renderTime);

    // Keep only recent render timings
    if (this.renderTimings.length > 60) {
      this.renderTimings.shift();
    }

    const currentTime = performance.now();

    // Calculate FPS every second
    if (currentTime - this.lastTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      const avgRenderTime = this.renderTimings.reduce((a, b) => a + b, 0) / this.renderTimings.length;
      const memoryUsage = this.getMemoryUsage();

      const metrics: PerformanceMetrics = {
        fps,
        memoryUsage,
        renderTime: avgRenderTime,
        frameTime: 1000 / fps,
        nodeCount,
        connectionCount,
        timestamp: currentTime
      };

      this.metrics.push(metrics);

      // Keep history limited
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics.shift();
      }

      // Store memory snapshot for leak detection
      this.memorySnapshots.push(memoryUsage);
      if (this.memorySnapshots.length > 20) {
        this.memorySnapshots.shift();
      }

      // Reset counters
      this.frameCount = 0;
      this.lastTime = currentTime;
      this.renderTimings = [];
    }
  }

  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getMetricsHistory(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  getAverageMetrics(samples: number = 10): PerformanceMetrics | null {
    const recent = this.metrics.slice(-samples);
    if (recent.length === 0) return null;

    return {
      fps: Math.round(recent.reduce((sum, m) => sum + m.fps, 0) / recent.length),
      memoryUsage: Math.round(recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length),
      renderTime: recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length,
      frameTime: recent.reduce((sum, m) => sum + m.frameTime, 0) / recent.length,
      nodeCount: Math.round(recent.reduce((sum, m) => sum + m.nodeCount, 0) / recent.length),
      connectionCount: Math.round(recent.reduce((sum, m) => sum + m.connectionCount, 0) / recent.length),
      timestamp: recent[recent.length - 1].timestamp
    };
  }

  getPerformanceSnapshot(): PerformanceSnapshot {
    return {
      timestamp: performance.now(),
      metrics: this.getCurrentMetrics() || this.getDefaultMetrics(),
      memorySnapshots: [...this.memorySnapshots],
      renderTimings: [...this.renderTimings]
    };
  }

  detectMemoryLeak(): { isLeaking: boolean; severity: 'low' | 'medium' | 'high' | 'critical' } {
    if (this.memorySnapshots.length < 10) {
      return { isLeaking: false, severity: 'low' };
    }

    const recent = this.memorySnapshots.slice(-5);
    const older = this.memorySnapshots.slice(-10, -5);

    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b) / older.length;

    const increaseRatio = recentAvg / olderAvg;

    if (increaseRatio > 1.5) {
      return { isLeaking: true, severity: 'critical' };
    } else if (increaseRatio > 1.3) {
      return { isLeaking: true, severity: 'high' };
    } else if (increaseRatio > 1.2) {
      return { isLeaking: true, severity: 'medium' };
    } else if (increaseRatio > 1.1) {
      return { isLeaking: true, severity: 'low' };
    }

    return { isLeaking: false, severity: 'low' };
  }

  getPerformanceHealth(): {
    status: 'excellent' | 'good' | 'warning' | 'critical';
    score: number;
    issues: string[];
  } {
    const current = this.getCurrentMetrics();
    if (!current) {
      return { status: 'good', score: 100, issues: [] };
    }

    const issues: string[] = [];
    let score = 100;

    // FPS check
    if (current.fps < this.thresholds.targetFPS * this.thresholds.criticalThreshold) {
      issues.push(`Critical: FPS is ${current.fps}, target is ${this.thresholds.targetFPS}`);
      score -= 40;
    } else if (current.fps < this.thresholds.targetFPS * this.thresholds.warningThreshold) {
      issues.push(`Warning: FPS is ${current.fps}, target is ${this.thresholds.targetFPS}`);
      score -= 20;
    }

    // Memory check
    if (current.memoryUsage > this.thresholds.maxMemoryUsage) {
      issues.push(`Memory usage is ${current.memoryUsage}MB, limit is ${this.thresholds.maxMemoryUsage}MB`);
      score -= 25;
    }

    // Render time check
    if (current.renderTime > this.thresholds.maxRenderTime) {
      issues.push(`Render time is ${current.renderTime.toFixed(2)}ms, target is ${this.thresholds.maxRenderTime}ms`);
      score -= 15;
    }

    // Memory leak detection
    const leakDetection = this.detectMemoryLeak();
    if (leakDetection.isLeaking) {
      issues.push(`Potential memory leak detected (severity: ${leakDetection.severity})`);
      score -= 20;
    }

    let status: 'excellent' | 'good' | 'warning' | 'critical';
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 60) status = 'warning';
    else status = 'critical';

    return { status, score, issues };
  }

  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const current = this.getCurrentMetrics();
    const health = this.getPerformanceHealth();

    if (!current) return recommendations;

    // FPS recommendations
    if (current.fps < 30) {
      recommendations.push('Enable Level of Detail (LOD) rendering for distant objects');
      recommendations.push('Implement frustum culling to reduce rendering load');
      recommendations.push('Consider reducing canvas resolution on low-end devices');
    }

    // Memory recommendations
    if (current.memoryUsage > 50) {
      recommendations.push('Implement object pooling for frequently created objects');
      recommendations.push('Use texture atlases instead of individual textures');
      recommendations.push('Enable texture compression for better memory usage');
    }

    // Node/connection count recommendations
    if (current.nodeCount > 100) {
      recommendations.push('Implement spatial partitioning for collision detection');
      recommendations.push('Use instanced rendering for similar node types');
    }

    if (current.connectionCount > 200) {
      recommendations.push('Implement connection batching for better performance');
      recommendations.push('Use simplified connection rendering at low zoom levels');
    }

    // General recommendations
    if (health.score < 75) {
      recommendations.push('Consider using WebGL2 for better performance');
      recommendations.push('Implement progressive loading for large workflows');
      recommendations.push('Add performance monitoring to identify bottlenecks');
    }

    return recommendations;
  }

  exportMetrics(): string {
    const metrics = this.getMetricsHistory();
    const snapshot = this.getPerformanceSnapshot();
    const health = this.getPerformanceHealth();

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      health,
      snapshot,
      history: metrics,
      recommendations: this.getOptimizationRecommendations()
    }, null, 2);
  }

  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      memoryUsage: 0,
      renderTime: 16.67,
      frameTime: 16.67,
      nodeCount: 0,
      connectionCount: 0,
      timestamp: performance.now()
    };
  }
}

// Performance utilities
export const createPerformanceTimer = () => {
  let startTime: number;

  return {
    start: () => {
      startTime = performance.now();
    },
    end: () => {
      return performance.now() - startTime;
    },
    measure: <T>(fn: () => T): { result: T; time: number } => {
      const start = performance.now();
      const result = fn();
      const time = performance.now() - start;
      return { result, time };
    }
  };
};

export const debouncePerformanceCheck = <T extends any[]>(
  fn: (...args: T) => void,
  delay: number
) => {
  let timeoutId: number;
  let lastExecution = 0;

  return (...args: T) => {
    const currentTime = performance.now();

    if (currentTime - lastExecution > delay) {
      fn(...args);
      lastExecution = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn(...args);
        lastExecution = performance.now();
      }, delay - (currentTime - lastExecution));
    }
  };
};

export const throttlePerformanceCheck = <T extends any[]>(
  fn: (...args: T) => void,
  limit: number
) => {
  let inThrottle: boolean;

  return (...args: T) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Performance monitoring hooks
export const usePerformanceMonitor = (thresholds?: Partial<PerformanceThresholds>) => {
  const monitorRef = useRef<PerformanceMonitor>();

  if (!monitorRef.current) {
    monitorRef.current = new PerformanceMonitor(thresholds);
  }

  return monitorRef.current;
};

export const usePerformanceTimer = () => {
  const timerRef = useRef(createPerformanceTimer());

  return timerRef.current;
};

// Performance optimization utilities
export const optimizeCanvasSettings = (devicePixelRatio: number, isLowEnd: boolean) => {
  return {
    resolution: Math.min(devicePixelRatio, isLowEnd ? 1 : 2),
    antialias: !isLowEnd,
    powerPreference: isLowEnd ? 'low-power' : 'high-performance',
    clearBeforeRender: true,
    preserveDrawingBuffer: false
  };
};

export const detectLowEndDevice = (): boolean => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) return true;

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) return false;

  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

  // Simple heuristics for detecting low-end devices
  const lowEndPatterns = [
    /intel.*integrated/i,
    /intel.*hd.*graphics/i,
    /microsoft.*basic/i,
    /vmware/i,
    /virtualbox/i
  ];

  return lowEndPatterns.some(pattern =>
    pattern.test(renderer) || pattern.test(vendor)
  );
};

export { PerformanceMonitor };
