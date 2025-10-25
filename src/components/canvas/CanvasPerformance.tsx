import { useCallback, useEffect, useRef, useState } from 'react';
import { Application, Ticker } from 'pixi.js';
import { useStudioStore } from '../../hooks/useStudioStore.js';

interface CanvasPerformanceProps {
  app: Application;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  onPerformanceAlert?: (alert: PerformanceAlert) => void;
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  nodeCount: number;
  connectionCount: number;
  viewportSize: { width: number; height: number };
  zoomLevel: number;
  renderTime: number;
  frameTime: number;
  drawCalls: number;
  textureMemory: number;
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  timestamp: number;
}

interface PerformanceThresholds {
  fps: { warning: number; error: number };
  memoryUsage: { warning: number; error: number };
  renderTime: { warning: number; error: number };
  frameTime: { warning: number; error: number };
}

interface PerformanceHistory {
  metrics: PerformanceMetrics[];
  alerts: PerformanceAlert[];
  maxHistorySize: number;
}

export const useCanvasPerformance = ({
  app,
  onPerformanceUpdate,
  onPerformanceAlert
}: CanvasPerformanceProps) => {
  const { state } = useStudioStore();
  const { canvas, nodes, connections } = state;

  // Performance state
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    nodeCount: 0,
    connectionCount: 0,
    viewportSize: { width: 800, height: 600 },
    zoomLevel: 1,
    renderTime: 0,
    frameTime: 16.67,
    drawCalls: 0,
    textureMemory: 0
  });

  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistory>({
    metrics: [],
    alerts: [],
    maxHistorySize: 100
  });

  // Performance monitoring refs
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartTimeRef = useRef(0);
  const frameStartTimeRef = useRef(0);
  const tickerRef = useRef<Ticker | null>(null);

  // Performance thresholds
  const thresholds: PerformanceThresholds = {
    fps: { warning: 30, error: 15 },
    memoryUsage: { warning: 100, error: 200 }, // MB
    renderTime: { warning: 16.67, error: 33.33 }, // ms
    frameTime: { warning: 33.33, error: 66.67 } // ms
  };

  // Get memory usage
  const getMemoryUsage = useCallback((): number => {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }, []);

  // Get texture memory usage
  const getTextureMemory = useCallback((): number => {
    if (!app.renderer) return 0;

    // Estimate texture memory usage (simplified approach)
    // In a real implementation, you'd track this more accurately
    let totalMemory = 0;

    // Simplified estimation based on node count
    // In a real implementation, you'd track texture creation/destruction more carefully
    totalMemory = nodes.size * 50 * 1024; // Rough estimate: 50KB per node

    return Math.round(totalMemory / 1024 / 1024); // Convert to MB
  }, [app, nodes.size]);

  // Calculate FPS
  const calculateFPS = useCallback((): number => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;

    if (deltaTime >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
      return fps;
    }

    return currentMetrics.fps;
  }, [currentMetrics.fps]);

  // Update performance metrics
  const updateMetrics = useCallback(() => {
    frameCountRef.current++;

    const fps = calculateFPS();
    const memoryUsage = getMemoryUsage();
    const textureMemory = getTextureMemory();
    const renderTime = performance.now() - renderStartTimeRef.current;
    const frameTime = performance.now() - frameStartTimeRef.current;

    const newMetrics: PerformanceMetrics = {
      fps,
      memoryUsage,
      nodeCount: nodes.size,
      connectionCount: connections.size,
      viewportSize: {
        width: 800, // Simplified - would need proper canvas sizing
        height: 600
      },
      zoomLevel: canvas.viewport.zoom,
      renderTime,
      frameTime,
      drawCalls: 0, // Simplified - would need renderer instrumentation
      textureMemory
    };

    setCurrentMetrics(newMetrics);
    onPerformanceUpdate?.(newMetrics);

    // Update performance history
    setPerformanceHistory(prev => ({
      ...prev,
      metrics: [...prev.metrics.slice(-prev.maxHistorySize + 1), newMetrics]
    }));

    // Check for performance alerts
    checkPerformanceAlerts(newMetrics);

    // Reset timers
    renderStartTimeRef.current = performance.now();
    frameStartTimeRef.current = performance.now();
  }, [
    calculateFPS,
    getMemoryUsage,
    getTextureMemory,
    nodes.size,
    connections.size,
    app.view,
    app.renderer,
    canvas.viewport.zoom,
    onPerformanceUpdate
  ]);

  // Check for performance alerts
  const checkPerformanceAlerts = useCallback((metrics: PerformanceMetrics) => {
    const alerts: PerformanceAlert[] = [];

    // FPS alerts
    if (metrics.fps <= thresholds.fps.error) {
      alerts.push({
        type: 'error',
        message: `FPS critically low: ${metrics.fps}`,
        metric: 'fps',
        value: metrics.fps,
        threshold: thresholds.fps.error,
        timestamp: Date.now()
      });
    } else if (metrics.fps <= thresholds.fps.warning) {
      alerts.push({
        type: 'warning',
        message: `FPS low: ${metrics.fps}`,
        metric: 'fps',
        value: metrics.fps,
        threshold: thresholds.fps.warning,
        timestamp: Date.now()
      });
    }

    // Memory alerts
    if (metrics.memoryUsage >= thresholds.memoryUsage.error) {
      alerts.push({
        type: 'error',
        message: `Memory usage critically high: ${metrics.memoryUsage}MB`,
        metric: 'memoryUsage',
        value: metrics.memoryUsage,
        threshold: thresholds.memoryUsage.error,
        timestamp: Date.now()
      });
    } else if (metrics.memoryUsage >= thresholds.memoryUsage.warning) {
      alerts.push({
        type: 'warning',
        message: `Memory usage high: ${metrics.memoryUsage}MB`,
        metric: 'memoryUsage',
        value: metrics.memoryUsage,
        threshold: thresholds.memoryUsage.warning,
        timestamp: Date.now()
      });
    }

    // Render time alerts
    if (metrics.renderTime >= thresholds.renderTime.error) {
      alerts.push({
        type: 'error',
        message: `Render time critically high: ${metrics.renderTime.toFixed(2)}ms`,
        metric: 'renderTime',
        value: metrics.renderTime,
        threshold: thresholds.renderTime.error,
        timestamp: Date.now()
      });
    } else if (metrics.renderTime >= thresholds.renderTime.warning) {
      alerts.push({
        type: 'warning',
        message: `Render time high: ${metrics.renderTime.toFixed(2)}ms`,
        metric: 'renderTime',
        value: metrics.renderTime,
        threshold: thresholds.renderTime.warning,
        timestamp: Date.now()
      });
    }

    // Send alerts
    alerts.forEach(alert => {
      onPerformanceAlert?.(alert);
      setPerformanceHistory(prev => ({
        ...prev,
        alerts: [...prev.alerts.slice(-prev.maxHistorySize + 1), alert]
      }));
    });
  }, [thresholds, onPerformanceAlert]);

  // Get performance statistics
  const getPerformanceStats = useCallback(() => {
    const history = performanceHistory.metrics;
    if (history.length === 0) return null;

    const recentMetrics = history.slice(-10); // Last 10 measurements

    return {
      averageFPS: Math.round(recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length),
      averageMemory: Math.round(recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length),
      averageRenderTime: Math.round(recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length),
      peakMemory: Math.max(...recentMetrics.map(m => m.memoryUsage)),
      minFPS: Math.min(...recentMetrics.map(m => m.fps)),
      maxRenderTime: Math.max(...recentMetrics.map(m => m.renderTime)),
      totalAlerts: performanceHistory.alerts.length,
      recentAlerts: performanceHistory.alerts.slice(-5)
    };
  }, [performanceHistory]);

  // Optimize rendering based on performance
  const optimizeRendering = useCallback(() => {
    const stats = getPerformanceStats();
    if (!stats) return;

    // Performance-based optimizations
    if (stats.averageFPS < 30) {
      // Reduce quality for better performance
      if (canvas.config.gridSize > 20) {
        // Reduce grid density
      }

      // Reduce node detail at high zoom levels
      if (canvas.viewport.zoom > 2) {
        // Simplify node rendering
      }
    }

    if (stats.averageMemory > 150) {
      // Memory optimization suggestions
      // In a real implementation, you'd clear unused textures here
      console.warn('High memory usage detected - consider texture cleanup');
    }
  }, [getPerformanceStats, canvas, app.renderer]);

  // Performance monitoring ticker
  const setupPerformanceMonitoring = useCallback(() => {
    if (tickerRef.current) {
      tickerRef.current.destroy();
    }

    const ticker = new Ticker();
    tickerRef.current = ticker;
    ticker.add(updateMetrics);
    ticker.start();

    // Initial measurement
    renderStartTimeRef.current = performance.now();
    frameStartTimeRef.current = performance.now();

    return () => {
      ticker.destroy();
      tickerRef.current = null;
    };
  }, [updateMetrics]);

  // Manual garbage collection (for debugging)
  const forceGarbageCollection = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }, []);

  // Get performance recommendations
  const getPerformanceRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    const stats = getPerformanceStats();

    if (!stats) return recommendations;

    if (stats.averageFPS < 30) {
      recommendations.push('Consider reducing node count or simplifying node designs');
      recommendations.push('Enable viewport culling for better performance');
    }

    if (stats.averageMemory > 100) {
      recommendations.push('Monitor for memory leaks in node creation/destruction');
      recommendations.push('Consider implementing object pooling for frequently created objects');
    }

    if (stats.maxRenderTime > 33) {
      recommendations.push('Optimize rendering pipeline - consider reducing draw calls');
      recommendations.push('Implement level-of-detail rendering for distant objects');
    }

    if (nodes.size > 100) {
      recommendations.push('Large node count detected - consider pagination or virtualization');
    }

    if (connections.size > 200) {
      recommendations.push('High connection count - optimize connection rendering');
    }

    return recommendations;
  }, [getPerformanceStats, nodes.size, connections.size]);

  // Export performance data
  const exportPerformanceData = useCallback(() => {
    const data = {
      currentMetrics,
      performanceHistory,
      recommendations: getPerformanceRecommendations(),
      timestamp: new Date().toISOString(),
      sessionInfo: {
        nodeCount: nodes.size,
        connectionCount: connections.size,
        viewport: canvas.viewport,
        canvasConfig: canvas.config
      }
    };

    return JSON.stringify(data, null, 2);
  }, [currentMetrics, performanceHistory, getPerformanceRecommendations, nodes.size, connections.size, canvas]);

  // Setup performance monitoring on mount
  useEffect(() => {
    const cleanup = setupPerformanceMonitoring();
    return cleanup;
  }, [setupPerformanceMonitoring]);

  // Periodic optimization
  useEffect(() => {
    const optimizationInterval = setInterval(() => {
      optimizeRendering();
    }, 10000); // Every 10 seconds

    return () => clearInterval(optimizationInterval);
  }, [optimizeRendering]);

  return {
    // Current metrics
    currentMetrics,

    // Performance history
    performanceHistory,

    // Utility functions
    getPerformanceStats,
    getPerformanceRecommendations,
    forceGarbageCollection,
    exportPerformanceData,

    // Thresholds
    thresholds,

    // Manual controls
    updateMetrics: () => updateMetrics()
  };
};
