import React, { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  totalExecutionTime: number;
  averageStepTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  peakMemoryUsage: number;
  gcCollections: number;
  threadCount: number;
}

interface PerformanceSnapshot {
  timestamp: Date;
  metrics: PerformanceMetrics;
}

interface PerformanceMonitorProps {
  isActive: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  refreshInterval?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isActive,
  onMetricsUpdate,
  refreshInterval = 1000
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>({
    totalExecutionTime: 0,
    averageStepTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkRequests: 0,
    peakMemoryUsage: 0,
    gcCollections: 0,
    threadCount: 0
  });

  const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Performance monitoring functions
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        peak: Math.max(currentMetrics.peakMemoryUsage, memory.usedJSHeapSize)
      };
    }
    return null;
  }, [currentMetrics.peakMemoryUsage]);

  const measureCPUUsage = useCallback(() => {
    // Simplified CPU measurement - in a real implementation,
    // you might use the Performance API or Web Workers
    return Math.random() * 100; // Mock CPU usage
  }, []);

  const measureNetworkRequests = useCallback(() => {
    // Count network requests from Performance API
    if ('getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('resource');
      return entries.length;
    }
    return 0;
  }, []);

  const collectMetrics = useCallback(() => {
    const memory = measureMemoryUsage();
    const cpu = measureCPUUsage();
    const network = measureNetworkRequests();

    const newMetrics: PerformanceMetrics = {
      ...currentMetrics,
      memoryUsage: memory?.used || 0,
      peakMemoryUsage: memory?.peak || currentMetrics.peakMemoryUsage,
      cpuUsage: cpu,
      networkRequests: network,
      gcCollections: currentMetrics.gcCollections,
      threadCount: navigator.hardwareConcurrency || 1
    };

    setCurrentMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);

    if (isRecording) {
      setSnapshots(prev => [...prev, {
        timestamp: new Date(),
        metrics: newMetrics
      }]);
    }
  }, [currentMetrics, measureMemoryUsage, measureCPUUsage, measureNetworkRequests, onMetricsUpdate, isRecording]);

  // Start/stop recording
  const toggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
    if (!isRecording) {
      setSnapshots([]);
    }
  }, [isRecording]);

  const clearSnapshots = useCallback(() => {
    setSnapshots([]);
  }, []);

  // Update metrics periodically when active
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(collectMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [isActive, collectMetrics, refreshInterval]);

  // Format bytes to human readable
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Get performance status color
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleRecording}
            className={`px-3 py-1 text-sm rounded ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isRecording ? '⏹️ Stop' : '⏺️ Record'}
          </button>
          {snapshots.length > 0 && (
            <button
              onClick={clearSnapshots}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!isActive ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">Performance monitoring inactive</p>
          <p className="text-xs">Start a test to begin monitoring</p>
        </div>
      ) : (
        <>
          {/* Current Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600 mb-1">Memory Usage</div>
              <div className={`text-lg font-semibold ${getStatusColor(currentMetrics.memoryUsage / (1024 * 1024), { good: 50, warning: 100 })}`}>
                {formatBytes(currentMetrics.memoryUsage)}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600 mb-1">CPU Usage</div>
              <div className={`text-lg font-semibold ${getStatusColor(currentMetrics.cpuUsage, { good: 50, warning: 80 })}`}>
                {currentMetrics.cpuUsage.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600 mb-1">Execution Time</div>
              <div className="text-lg font-semibold text-blue-600">
                {formatTime(currentMetrics.totalExecutionTime)}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600 mb-1">Avg Step Time</div>
              <div className="text-lg font-semibold text-purple-600">
                {formatTime(currentMetrics.averageStepTime)}
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Memory Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Peak Usage:</span>
                  <span className="font-medium">{formatBytes(currentMetrics.peakMemoryUsage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GC Collections:</span>
                  <span className="font-medium">{currentMetrics.gcCollections}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">System Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Requests:</span>
                  <span className="font-medium">{currentMetrics.networkRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thread Count:</span>
                  <span className="font-medium">{currentMetrics.threadCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-800">Recording Performance Data</span>
                <span className="text-sm text-red-600">({snapshots.length} snapshots)</span>
              </div>
            </div>
          )}

          {/* Performance History */}
          {snapshots.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Performance History</h4>
              <div className="max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {snapshots.slice(-10).map((snapshot, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <span className="text-gray-600">
                        {snapshot.timestamp.toLocaleTimeString()}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="text-gray-900">
                          {formatBytes(snapshot.metrics.memoryUsage)}
                        </span>
                        <span className="text-gray-900">
                          {snapshot.metrics.cpuUsage.toFixed(1)}%
                        </span>
                        <span className="text-gray-900">
                          {formatTime(snapshot.metrics.totalExecutionTime)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Showing last 10 snapshots ({snapshots.length} total)
              </div>
            </div>
          )}

          {/* Performance Tips */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Performance Tips</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>Memory:</strong> Keep usage under 100MB for optimal performance</p>
              <p>• <strong>CPU:</strong> Monitor for spikes that may indicate bottlenecks</p>
              <p>• <strong>Network:</strong> Minimize API calls during workflow execution</p>
              <p>• <strong>Execution Time:</strong> Aim for sub-2 second total execution</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


