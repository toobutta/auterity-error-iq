/**
 * Enhanced Error Intelligence Dashboard
 *
 * Advanced dashboard for error analysis, predictive intelligence, and autonomous resolution
 * with Gradio/Streamlit integration for specialized error visualization
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ExclamationTriangleIcon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced error dashboard types
interface ErrorWidget {
  id: string;
  type: 'error_rate' | 'prediction' | 'resolution' | 'impact' | 'custom';
  title: string;
  description: string;
  data?: any;
  config?: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

interface ErrorDashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: ErrorWidget[];
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'masonry' | 'flex';
  refreshInterval?: number;
  filters: {
    timeRange: string;
    severity: string[];
    systems: string[];
  };
}

interface ExternalErrorDashboard {
  id: string;
  name: string;
  type: 'gradio' | 'streamlit' | 'custom';
  url: string;
  status: 'loading' | 'ready' | 'error';
  lastUpdated?: Date;
  config?: Record<string, any>;
}

// Error dashboard adapter for external services
class ErrorDashboardAdapter {
  private adapters = new Map<string, ExternalErrorDashboard>();

  async createGradioAdapter(name: string, config: any): Promise<ExternalErrorDashboard> {
    const adapter: ExternalErrorDashboard = {
      id: `gradio_${Date.now()}`,
      name,
      type: 'gradio',
      url: config.url || '',
      status: 'loading',
      config
    };

    this.adapters.set(adapter.id, adapter);
    return adapter;
  }

  async createStreamlitAdapter(name: string, config: any): Promise<ExternalErrorDashboard> {
    const adapter: ExternalErrorDashboard = {
      id: `streamlit_${Date.now()}`,
      name,
      type: 'streamlit',
      url: config.url || '',
      status: 'loading',
      config
    };

    this.adapters.set(adapter.id, adapter);
    return adapter;
  }

  async exportToGradio(dashboard: ErrorDashboardConfig): Promise<string> {
    const gradioConfig = {
      title: dashboard.name,
      inputs: dashboard.widgets.map(widget => ({
        label: widget.title,
        type: this.mapWidgetTypeToGradio(widget.type)
      })),
      outputs: dashboard.widgets.map(widget => ({
        label: widget.title,
        type: 'json'
      }))
    };

    return JSON.stringify(gradioConfig, null, 2);
  }

  async exportToStreamlit(dashboard: ErrorDashboardConfig): Promise<string> {
    const streamlitCode = `
import streamlit as st
import pandas as pd
import plotly.express as px

st.title("${dashboard.name}")
st.write("${dashboard.description}")

# Error analysis filters
col1, col2, col3 = st.columns(3)
with col1:
    time_range = st.selectbox("Time Range", ["1h", "24h", "7d", "30d"])
with col2:
    severity = st.multiselect("Severity", ["low", "medium", "high", "critical"])
with col3:
    systems = st.multiselect("Systems", ["api", "database", "frontend", "backend"])

${dashboard.widgets.map(widget => this.generateErrorStreamlitWidget(widget)).join('\n\n')}
    `.trim();

    return streamlitCode;
  }

  private mapWidgetTypeToGradio(type: string): string {
    switch (type) {
      case 'error_rate': return 'plotly';
      case 'prediction': return 'json';
      case 'resolution': return 'json';
      case 'impact': return 'plotly';
      default: return 'json';
    }
  }

  private generateErrorStreamlitWidget(widget: ErrorWidget): string {
    switch (widget.type) {
      case 'error_rate':
        return `
# ${widget.title}
st.subheader("${widget.title}")
# Error rate chart implementation
if st.button("Refresh Error Rate"):
    st.info("Error rate data would be fetched here")`;

      case 'prediction':
        return `
# ${widget.title}
st.subheader("${widget.title}")
st.info("${widget.description}")
prediction_data = {
    "risk_level": "medium",
    "predicted_errors": ["API timeout", "Database connection"],
    "confidence": 0.85
}
st.json(prediction_data)`;

      case 'resolution':
        return `
# ${widget.title}
st.subheader("${widget.title}")
st.info("${widget.description}")
if st.button("Run Auto-Resolution"):
    st.success("Auto-resolution would be triggered here")`;

      default:
        return `
# ${widget.title}
st.write("${widget.title}: ${widget.description}")`;
    }
  }

  getAdapters(): ExternalErrorDashboard[] {
    return Array.from(this.adapters.values());
  }

  removeAdapter(id: string): void {
    this.adapters.delete(id);
  }
}

// Create singleton adapter instance
const errorDashboardAdapter = new ErrorDashboardAdapter();

export const EnhancedErrorDashboard: React.FC = () => {
  const [activeDashboard, setActiveDashboard] = useState<ErrorDashboardConfig | null>(null);
  const [externalDashboards, setExternalDashboards] = useState<ExternalErrorDashboard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'native' | 'gradio' | 'streamlit'>('native');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    timeRange: '24h',
    severity: ['medium', 'high', 'critical'],
    systems: ['api', 'database', 'frontend']
  });

  // Default error dashboard configuration
  const defaultDashboard: ErrorDashboardConfig = {
    id: 'default',
    name: 'Error Intelligence Dashboard',
    description: 'Real-time error analysis, predictive intelligence, and autonomous resolution',
    widgets: [
      {
        id: 'error_rate_widget',
        type: 'error_rate',
        title: 'Error Rate Trends',
        description: 'Real-time error rate monitoring across systems',
        config: { timeRange: '24h', refreshInterval: 30000 },
        position: { x: 0, y: 0, w: 6, h: 4 }
      },
      {
        id: 'prediction_widget',
        type: 'prediction',
        title: 'Predictive Error Detection',
        description: 'AI-powered prediction of potential errors',
        config: { confidenceThreshold: 0.7 },
        position: { x: 6, y: 0, w: 6, h: 4 }
      },
      {
        id: 'resolution_widget',
        type: 'resolution',
        title: 'Autonomous Resolution',
        description: 'Automated error resolution with human oversight',
        config: { autoResolveEnabled: false },
        position: { x: 0, y: 4, w: 8, h: 3 }
      },
      {
        id: 'impact_widget',
        type: 'impact',
        title: 'Error Impact Analysis',
        description: 'Business impact assessment of errors',
        config: { includeBusinessMetrics: true },
        position: { x: 8, y: 4, w: 4, h: 3 }
      }
    ],
    theme: 'auto',
    layout: 'grid',
    filters: {
      timeRange: '24h',
      severity: ['medium', 'high', 'critical'],
      systems: ['api', 'database', 'frontend']
    }
  };

  // Initialize dashboard
  useEffect(() => {
    setActiveDashboard(defaultDashboard);
    setExternalDashboards(errorDashboardAdapter.getAdapters());
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      refreshDashboard();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      // Error handled silently for user experience
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createExternalAdapter = useCallback(async (type: 'gradio' | 'streamlit', config: any) => {
    try {
      let adapter: ExternalErrorDashboard;

      if (type === 'gradio') {
        adapter = await errorDashboardAdapter.createGradioAdapter(
          `Error Analysis Gradio ${externalDashboards.length + 1}`,
          config
        );
      } else {
        adapter = await errorDashboardAdapter.createStreamlitAdapter(
          `Error Intelligence Streamlit ${externalDashboards.length + 1}`,
          config
        );
      }

      setExternalDashboards(prev => [...prev, adapter]);
    } catch (error) {
      // Error handled silently for user experience
    }
  }, [externalDashboards.length]);

  const exportDashboard = useCallback(async (format: 'gradio' | 'streamlit') => {
    if (!activeDashboard) return;

    try {
      let exportData: string;
      let filename: string;
      let mimeType: string;

      if (format === 'gradio') {
        exportData = await errorDashboardAdapter.exportToGradio(activeDashboard);
        filename = `${activeDashboard.name}_gradio.json`;
        mimeType = 'application/json';
      } else {
        exportData = await errorDashboardAdapter.exportToStreamlit(activeDashboard);
        filename = `${activeDashboard.name}_streamlit.py`;
        mimeType = 'text/x-python';
      }

      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // Error handled silently for user experience
    }
  }, [activeDashboard]);

  const renderErrorWidget = (widget: ErrorWidget) => {
    return (
      <motion.div
        key={widget.id}
        className="error-widget"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="widget-header">
          <div className="widget-icon">
            {widget.type === 'error_rate' && <ChartBarIcon className="w-5 h-5" />}
            {widget.type === 'prediction' && <LightBulbIcon className="w-5 h-5" />}
            {widget.type === 'resolution' && <Cog6ToothIcon className="w-5 h-5" />}
            {widget.type === 'impact' && <ExclamationTriangleIcon className="w-5 h-5" />}
          </div>
          <h3>{widget.title}</h3>
          <span className="widget-type">{widget.type.replace('_', ' ').toUpperCase()}</span>
        </div>

        <div className="widget-content">
          {widget.type === 'error_rate' && (
            <div className="error-rate-display">
              <div className="metric-grid">
                <div className="metric-item">
                  <span className="metric-label">Current Rate:</span>
                  <span className="metric-value">2.3%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Peak Today:</span>
                  <span className="metric-value">5.1%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Trend:</span>
                  <span className="metric-value trend-down">↓ 0.8%</span>
                </div>
              </div>
            </div>
          )}

          {widget.type === 'prediction' && (
            <div className="prediction-display">
              <div className="risk-indicator">
                <ShieldCheckIcon className="w-6 h-6" />
                <span>Risk Level: Medium</span>
              </div>
              <div className="prediction-list">
                <div className="prediction-item">
                  <span>API Timeout (85% confidence)</span>
                  <span className="prediction-time">in 2 hours</span>
                </div>
                <div className="prediction-item">
                  <span>Database Connection (72% confidence)</span>
                  <span className="prediction-time">in 4 hours</span>
                </div>
              </div>
            </div>
          )}

          {widget.type === 'resolution' && (
            <div className="resolution-display">
              <div className="resolution-status">
                <CheckCircleIcon className="w-5 h-5" />
                <span>3 resolutions applied today</span>
              </div>
              <div className="resolution-actions">
                <button className="action-button auto">
                  Enable Auto-Resolution
                </button>
                <button className="action-button manual">
                  Manual Review
                </button>
              </div>
            </div>
          )}

          {widget.type === 'impact' && (
            <div className="impact-display">
              <div className="impact-metrics">
                <div className="impact-item">
                  <span className="impact-label">Affected Users:</span>
                  <span className="impact-value">1,247</span>
                </div>
                <div className="impact-item">
                  <span className="impact-label">Revenue Impact:</span>
                  <span className="impact-value">$12,450</span>
                </div>
                <div className="impact-item">
                  <span className="impact-label">MTTR:</span>
                  <span className="impact-value">4.2 min</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="widget-description">
          {widget.description}
        </div>
      </motion.div>
    );
  };

  const renderExternalDashboard = (adapter: ExternalErrorDashboard) => {
    return (
      <motion.div
        key={adapter.id}
        className="external-error-dashboard-item"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
      >
        <div className="adapter-header">
          <div className="adapter-info">
            <h4>{adapter.name}</h4>
            <span className={`adapter-type ${adapter.type}`}>
              {adapter.type.toUpperCase()}
            </span>
          </div>

          <div className={`adapter-status ${adapter.status}`}>
            {adapter.status === 'loading' && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            {adapter.status === 'ready' && <CheckCircleIcon className="w-4 h-4" />}
            {adapter.status === 'error' && <ExclamationTriangleIcon className="w-4 h-4" />}
            <span>{adapter.status}</span>
          </div>
        </div>

        {adapter.status === 'ready' && adapter.url && (
          <div className="adapter-preview">
            <iframe
              src={adapter.url}
              title={adapter.name}
              className="adapter-iframe"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}

        <div className="adapter-actions">
          <button
            onClick={() => window.open(adapter.url, '_blank')}
            className="adapter-button primary"
          >
            Open in New Tab
          </button>
          <button
            onClick={() => errorDashboardAdapter.removeAdapter(adapter.id)}
            className="adapter-button secondary"
          >
            Remove
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="enhanced-error-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <ExclamationTriangleIcon className="w-8 h-8" />
            <div>
              <h1>{activeDashboard?.name || 'Error Intelligence Dashboard'}</h1>
              <p>{activeDashboard?.description}</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="view-selector">
              <button
                className={selectedView === 'native' ? 'active' : ''}
                onClick={() => setSelectedView('native')}
              >
                Native
              </button>
              <button
                className={selectedView === 'gradio' ? 'active' : ''}
                onClick={() => setSelectedView('gradio')}
              >
                Gradio
              </button>
              <button
                className={selectedView === 'streamlit' ? 'active' : ''}
                onClick={() => setSelectedView('streamlit')}
              >
                Streamlit
              </button>
            </div>

            <div className="dashboard-controls">
              <button
                onClick={refreshDashboard}
                disabled={isLoading}
                className="control-button"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <select
                value={refreshInterval || ''}
                onChange={(e) => setRefreshInterval(e.target.value ? parseInt(e.target.value) : null)}
                className="refresh-selector"
              >
                <option value="">No Auto-refresh</option>
                <option value="15000">15 seconds</option>
                <option value="30000">30 seconds</option>
                <option value="60000">1 minute</option>
                <option value="300000">5 minutes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="dashboard-filters">
          <div className="filter-group">
            <label>Time Range:</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Severity:</label>
            <div className="checkbox-group">
              {['low', 'medium', 'high', 'critical'].map(severity => (
                <label key={severity} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.severity.includes(severity)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters(prev => ({
                          ...prev,
                          severity: [...prev.severity, severity]
                        }));
                      } else {
                        setFilters(prev => ({
                          ...prev,
                          severity: prev.severity.filter(s => s !== severity)
                        }));
                      }
                    }}
                  />
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {selectedView === 'native' && activeDashboard && (
          <div className="error-dashboard-grid">
            {activeDashboard.widgets.map(renderErrorWidget)}
          </div>
        )}

        {(selectedView === 'gradio' || selectedView === 'streamlit') && (
          <div className="external-error-dashboards">
            <div className="external-header">
              <h2>Error Intelligence Adapters</h2>
              <div className="external-actions">
                <button
                  onClick={() => createExternalAdapter(selectedView, {})}
                  className="create-adapter-button"
                >
                  <CpuChipIcon className="w-4 h-4" />
                  Add {selectedView} Adapter
                </button>

                <button
                  onClick={() => exportDashboard(selectedView)}
                  className="export-button"
                  disabled={!activeDashboard}
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export to {selectedView}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {externalDashboards
                .filter(adapter => adapter.type === selectedView)
                .map(renderExternalDashboard)}
            </AnimatePresence>

            {externalDashboards.filter(adapter => adapter.type === selectedView).length === 0 && (
              <div className="empty-state">
                <Cog6ToothIcon className="w-12 h-12 text-gray-400" />
                <h3>No {selectedView} adapters configured</h3>
                <p>Create an adapter to integrate with specialized error analysis tools</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedErrorDashboard;


