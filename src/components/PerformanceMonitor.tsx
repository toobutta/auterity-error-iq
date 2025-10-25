import React, { useState, useEffect } from 'react';
import { useStudioStore } from '../hooks/useStudioStore.js';
import './PerformanceMonitor.css';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  bundleSize: number;
  loadTime: number;
}

export const PerformanceMonitor: React.FC = () => {
  const { state } = useStudioStore();
  const { nodes, connections } = state;
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    bundleSize: 0,
    loadTime: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Calculate FPS
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({ ...prev, fps: Math.round(frameCount) }));
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    // Measure memory usage (if available)
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        }));
      }
    };

    // Measure page load time
    const measureLoadTime = () => {
      const loadTime = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (loadTime) {
        setMetrics(prev => ({
          ...prev,
          loadTime: Math.round(loadTime.loadEventEnd - loadTime.fetchStart)
        }));
      }
    };

    measureFPS();
    measureMemory();
    measureLoadTime();

    const memoryInterval = setInterval(measureMemory, 5000);
    return () => clearInterval(memoryInterval);
  }, []);

  // Calculate bundle size from performance entries
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalSize = 0;

      entries.forEach((entry) => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          totalSize += (entry as any).transferSize || 0;
        }
      });

      setMetrics(prev => ({
        ...prev,
        bundleSize: Math.round(totalSize / 1024) // KB
      }));
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      // Fallback for browsers that don't support resource timing
    }

    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return (
      <div className="performance-monitor-toggle" onClick={() => setIsVisible(true)}>
        📊
      </div>
    );
  }

  return (
    <div className="performance-monitor">
      <div className="performance-monitor-header">
        <h3>Performance Monitor</h3>
        <button onClick={() => setIsVisible(false)}>×</button>
      </div>

      <div className="performance-metrics">
        <div className="metric-group">
          <h4>Real-time Metrics</h4>
          <div className="metric">
            <span className="metric-label">FPS:</span>
            <span className={`metric-value ${metrics.fps < 30 ? 'warning' : metrics.fps < 60 ? 'caution' : 'good'}`}>
              {metrics.fps}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Memory:</span>
            <span className="metric-value">
              {metrics.memoryUsage} MB
            </span>
          </div>
        </div>

        <div className="metric-group">
          <h4>Bundle Metrics</h4>
          <div className="metric">
            <span className="metric-label">Bundle Size:</span>
            <span className="metric-value">
              {metrics.bundleSize} KB
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Load Time:</span>
            <span className="metric-value">
              {metrics.loadTime} ms
            </span>
          </div>
        </div>

        <div className="metric-group">
          <h4>Canvas Stats</h4>
          <div className="metric">
            <span className="metric-label">Nodes:</span>
            <span className="metric-value">
              {nodes.size}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Connections:</span>
            <span className="metric-value">
              {connections.size}
            </span>
          </div>
        </div>
      </div>

      <div className="performance-actions">
        <button onClick={() => window.location.reload()}>
          🔄 Reload
        </button>
        <button onClick={() => {
          if ('memory' in performance) {
            (performance as any).memory.gc?.();
          }
        }}>
          🗑️ GC
        </button>
      </div>
    </div>
  );
};
