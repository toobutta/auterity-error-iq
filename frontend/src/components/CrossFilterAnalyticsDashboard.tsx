/**
 * CROSS-FILTER ANALYTICS DASHBOARD
 *
 * Advanced analytics dashboard with brush/zoom linking, compare ranges, and anomaly detection
 * Implements 2025 UX trends: cross-filter analytics, real-time data visualization, anomaly callouts
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CpuChipIcon,
  CloudArrowUpIcon,
  AdjustmentsHorizontalIcon
} from "@heroicons/react/24/outline";
import { PerformanceMetrics } from "../types/performance";

interface CrossFilterAnalyticsDashboardProps {
  workflowId?: string;
  className?: string;
  initialTimeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
  enableRealTime?: boolean;
}

interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

interface FilterState {
  timeRange: TimeRange;
  brushedRange?: { start: Date; end: Date };
  selectedMetrics: string[];
  anomalyThreshold: number;
  compareMode: boolean;
  compareRange?: TimeRange;
}

interface AnomalyDetection {
  timestamp: Date;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export const CrossFilterAnalyticsDashboard: React.FC<CrossFilterAnalyticsDashboardProps> = ({
  workflowId,
  className = "",
  initialTimeRange = '24h',
  enableRealTime = true
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);

  // Enhanced filter state
  const [filterState, setFilterState] = useState<FilterState>({
    timeRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
      label: 'Last 24 Hours'
    },
    selectedMetrics: ['executionTime', 'successRate', 'cpu', 'memory'],
    anomalyThreshold: 2.0, // Standard deviations
    compareMode: false
  });

  // Time range presets
  const timeRangePresets = useMemo(() => ({
    '1h': { label: 'Last Hour', hours: 1 },
    '6h': { label: 'Last 6 Hours', hours: 6 },
    '24h': { label: 'Last 24 Hours', hours: 24 },
    '7d': { label: 'Last 7 Days', hours: 168 },
    '30d': { label: 'Last 30 Days', hours: 720 }
  }), []);

  // Generate enhanced mock data with anomalies
  const generateMockData = useCallback((timeRange: TimeRange): PerformanceMetrics[] => {
    const data: PerformanceMetrics[] = [];
    const hours = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60));

    for (let i = hours - 1; i >= 0; i--) {
      const timestamp = new Date(timeRange.end.getTime() - i * 60 * 60 * 1000);

      // Add some realistic anomalies (spikes and drops)
      const anomalyMultiplier = Math.random() > 0.9 ? (Math.random() > 0.5 ? 3 : 0.3) : 1;

      data.push({
        executionTime: (Math.random() * 5000 + 1000) * anomalyMultiplier,
        resourceUsage: {
          cpu: Math.min(100, (Math.random() * 80 + 10) * anomalyMultiplier),
          memory: Math.min(100, (Math.random() * 70 + 20) * anomalyMultiplier),
        },
        workflowId: workflowId || "system",
        timestamp,
        stepCount: Math.floor(Math.random() * 10) + 3,
        successRate: Math.max(0, Math.min(1, (Math.random() * 0.3 + 0.7) * (anomalyMultiplier > 2 ? 0.5 : 1))),
      });
    }

    return data;
  }, [workflowId]);

  // Detect anomalies using statistical analysis
  const detectAnomalies = useCallback((data: PerformanceMetrics[]): AnomalyDetection[] => {
    const anomalies: AnomalyDetection[] = [];

    filterState.selectedMetrics.forEach(metric => {
      const values = data.map(d => {
        if (metric === 'executionTime') return d.executionTime;
        if (metric === 'successRate') return (d.successRate || 0) * 100;
        if (metric === 'cpu') return d.resourceUsage.cpu;
        if (metric === 'memory') return d.resourceUsage.memory;
        return 0;
      });

      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

      values.forEach((value, index) => {
        const deviation = Math.abs(value - mean) / stdDev;
        if (deviation > filterState.anomalyThreshold) {
          anomalies.push({
            timestamp: data[index].timestamp,
            metric,
            value,
            expectedValue: mean,
            deviation,
            severity: deviation > 3 ? 'high' : deviation > 2 ? 'medium' : 'low',
            description: `${metric} ${deviation > 0 ? 'spike' : 'drop'} detected`
          });
        }
      });
    });

    return anomalies.sort((a, b) => b.deviation - a.deviation);
  }, [filterState.selectedMetrics, filterState.anomalyThreshold]);

  // Filter data based on current brush range
  const filteredData = useMemo(() => {
    let data = metrics;

    if (filterState.brushedRange) {
      data = data.filter(d =>
        d.timestamp >= filterState.brushedRange!.start &&
        d.timestamp <= filterState.brushedRange!.end
      );
    }

    return data;
  }, [metrics, filterState.brushedRange]);

  // Handle brush selection for cross-filtering
  const handleBrushSelection = useCallback((start: Date, end: Date) => {
    setFilterState(prev => ({
      ...prev,
      brushedRange: { start, end }
    }));
  }, []);

  // Handle time range change
  const handleTimeRangeChange = useCallback((range: keyof typeof timeRangePresets) => {
    const preset = timeRangePresets[range];
    const end = new Date();
    const start = new Date(end.getTime() - preset.hours * 60 * 60 * 1000);

    setFilterState(prev => ({
      ...prev,
      timeRange: { start, end, label: preset.label },
      brushedRange: undefined // Clear brush when changing time range
    }));
  }, [timeRangePresets]);

  // Toggle compare mode
  const toggleCompareMode = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      compareMode: !prev.compareMode,
      compareRange: !prev.compareMode ? {
        start: new Date(prev.timeRange.start.getTime() - (prev.timeRange.end.getTime() - prev.timeRange.start.getTime())),
        end: prev.timeRange.start,
        label: 'Previous Period'
      } : undefined
    }));
  }, []);

  // Fetch and update data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // In real implementation, this would fetch from API
      const data = generateMockData(filterState.timeRange);
      setMetrics(data);

      // Detect anomalies
      const detectedAnomalies = detectAnomalies(data);
      setAnomalies(detectedAnomalies);

    } catch (err) {
      setError("Failed to load analytics data");

    } finally {
      setLoading(false);
    }
  }, [filterState.timeRange, generateMockData, detectAnomalies]);

  // Real-time updates
  useEffect(() => {
    fetchData();

    if (enableRealTime) {
      const interval = setInterval(fetchData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchData, enableRealTime]);

  // Loading state
  if (loading && metrics.length === 0) {
    return (
      <div className={`cross-filter-dashboard ${className}`}>
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-chart"></div>
          <div className="skeleton-controls"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cross-filter-dashboard ${className}`}>
      {/* Enhanced Header with Controls */}
      <div className="dashboard-header">
        <div className="header-info">
          <h2 className="dashboard-title">
            <ChartBarIcon className="title-icon" />
            Cross-Filter Analytics
          </h2>
          <p className="dashboard-subtitle">
            Interactive analytics with real-time anomaly detection
          </p>
        </div>

        <div className="header-controls">
          {/* Time Range Selector */}
          <div className="time-range-selector">
            <CalendarDaysIcon className="control-icon" />
            <select
              value={Object.keys(timeRangePresets).find(key =>
                timeRangePresets[key as keyof typeof timeRangePresets].label === filterState.timeRange.label
              )}
              onChange={(e) => handleTimeRangeChange(e.target.value as keyof typeof timeRangePresets)}
              className="time-range-select"
            >
              {Object.entries(timeRangePresets).map(([key, preset]) => (
                <option key={key} value={key}>{preset.label}</option>
              ))}
            </select>
          </div>

          {/* Compare Toggle */}
          <button
            onClick={toggleCompareMode}
            className={`compare-toggle ${filterState.compareMode ? 'active' : ''}`}
            title="Compare with previous period"
          >
            <AdjustmentsHorizontalIcon className="control-icon" />
            Compare
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="refresh-button"
            title="Refresh data"
          >
            <ArrowPathIcon className={`control-icon ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <div className="anomaly-alerts">
          <div className="alerts-header">
            <ExclamationTriangleIcon className="alert-icon" />
            <span className="alert-title">Anomalies Detected ({anomalies.length})</span>
          </div>
          <div className="alerts-list">
            {anomalies.slice(0, 3).map((anomaly, index) => (
              <div key={index} className={`anomaly-alert severity-${anomaly.severity}`}>
                <div className="anomaly-info">
                  <span className="anomaly-metric">{anomaly.metric}</span>
                  <span className="anomaly-value">{anomaly.value.toFixed(2)}</span>
                  <span className="anomaly-deviation">
                    {anomaly.deviation.toFixed(1)}σ deviation
                  </span>
                </div>
                <div className="anomaly-description">{anomaly.description}</div>
                <div className="anomaly-time">
                  {anomaly.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brush Selection Indicator */}
      {filterState.brushedRange && (
        <div className="brush-indicator">
          <ClockIcon className="indicator-icon" />
          <span>Filtered: {filterState.brushedRange.start.toLocaleString()} - {filterState.brushedRange.end.toLocaleString()}</span>
          <button
            onClick={() => setFilterState(prev => ({ ...prev, brushedRange: undefined }))}
            className="clear-brush"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Charts Grid with Cross-Filtering */}
      <div className="charts-grid">
        {/* Main Performance Chart */}
        <div className="chart-container main-chart">
          <div className="chart-header">
            <h3>Performance Trends</h3>
            <div className="chart-controls">
              {filterState.selectedMetrics.map(metric => (
                <button
                  key={metric}
                  className="metric-toggle active"
                  onClick={() => {/* Toggle metric visibility */}}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-content">
            {/* Placeholder for interactive chart with brush selection */}
            <div className="chart-placeholder">
              <div className="placeholder-content">
                <ChartBarIcon className="placeholder-icon" />
                <p>Interactive chart with brush/zoom capabilities</p>
                <small>Click and drag to filter other charts</small>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Chart (when compare mode is enabled) */}
        {filterState.compareMode && filterState.compareRange && (
          <div className="chart-container comparison-chart">
            <div className="chart-header">
              <h3>Period Comparison</h3>
              <span className="comparison-label">
                {filterState.timeRange.label} vs {filterState.compareRange.label}
              </span>
            </div>
            <div className="chart-content">
              <div className="chart-placeholder">
                <div className="placeholder-content">
                  <ChartBarIcon className="placeholder-icon" />
                  <p>Comparative analysis chart</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resource Usage Chart */}
        <div className="chart-container resource-chart">
          <div className="chart-header">
            <h3>Resource Utilization</h3>
            <div className="resource-indicators">
              <div className="indicator cpu">
                <CpuChipIcon className="indicator-icon" />
                <span>CPU</span>
              </div>
              <div className="indicator memory">
                <CloudArrowUpIcon className="indicator-icon" />
                <span>Memory</span>
              </div>
            </div>
          </div>
          <div className="chart-content">
            <div className="chart-placeholder">
              <div className="placeholder-content">
                <ChartBarIcon className="placeholder-icon" />
                <p>Resource usage visualization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly Details Chart */}
        <div className="chart-container anomaly-chart">
          <div className="chart-header">
            <h3>Anomaly Analysis</h3>
            <span className="anomaly-count">
              {anomalies.length} anomalies detected
            </span>
          </div>
          <div className="chart-content">
            <div className="chart-placeholder">
              <div className="placeholder-content">
                <ExclamationTriangleIcon className="placeholder-icon" />
                <p>Anomaly detection and analysis</p>
                <small>Statistical analysis with configurable thresholds</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics with Cross-Filtered Data */}
      <div className="summary-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Data Points</span>
              <span className="stat-filtered">
                {filterState.brushedRange ? `${filteredData.length} filtered` : `${metrics.length} total`}
              </span>
            </div>
            <div className="stat-value">{filteredData.length}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Avg Execution Time</span>
              <span className="stat-unit">ms</span>
            </div>
            <div className="stat-value">
              {filteredData.length > 0
                ? Math.round(filteredData.reduce((sum, d) => sum + d.executionTime, 0) / filteredData.length)
                : 0
              }
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Success Rate</span>
              <span className="stat-unit">%</span>
            </div>
            <div className="stat-value">
              {filteredData.length > 0
                ? Math.round((filteredData.reduce((sum, d) => sum + (d.successRate || 0), 0) / filteredData.length) * 100)
                : 0
              }
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Anomalies</span>
              <span className="stat-severity">in filtered data</span>
            </div>
            <div className="stat-value">
              {anomalies.filter(a =>
                !filterState.brushedRange ||
                (a.timestamp >= filterState.brushedRange.start && a.timestamp <= filterState.brushedRange.end)
              ).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossFilterAnalyticsDashboard;


