/**
 * Enhanced Dashboard with Gradio/Streamlit Integration
 *
 * Provides unified dashboard capabilities with seamless integration
 * of external visualization tools and real-time analytics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  CpuChipIcon,
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced dashboard types
interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'custom';
  title: string;
  description: string;
  data?: any;
  config?: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'masonry' | 'flex';
  refreshInterval?: number;
}

interface ExternalDashboard {
  id: string;
  name: string;
  type: 'gradio' | 'streamlit' | 'custom';
  url: string;
  status: 'loading' | 'ready' | 'error';
  lastUpdated?: Date;
  config?: Record<string, any>;
}

// Dashboard adapter for external services
class DashboardAdapter {
  private adapters = new Map<string, ExternalDashboard>();

  async createGradioAdapter(name: string, config: any): Promise<ExternalDashboard> {
    const adapter: ExternalDashboard = {
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

  async createStreamlitAdapter(name: string, config: any): Promise<ExternalDashboard> {
    const adapter: ExternalDashboard = {
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

  async exportToGradio(dashboard: DashboardConfig): Promise<string> {
    // Convert dashboard config to Gradio format
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

  async exportToStreamlit(dashboard: DashboardConfig): Promise<string> {
    // Convert dashboard config to Streamlit format
    const streamlitCode = `
import streamlit as st
import pandas as pd
import plotly.express as px

st.title("${dashboard.name}")
st.write("${dashboard.description}")

${dashboard.widgets.map(widget => this.generateStreamlitWidget(widget)).join('\n\n')}
    `.trim();

    return streamlitCode;
  }

  private mapWidgetTypeToGradio(type: string): string {
    switch (type) {
      case 'chart': return 'plotly';
      case 'metric': return 'number';
      case 'table': return 'dataframe';
      default: return 'json';
    }
  }

  private generateStreamlitWidget(widget: DashboardWidget): string {
    switch (widget.type) {
      case 'metric':
        return `
# ${widget.title}
st.metric("${widget.title}", ${widget.data?.value || 0}, ${widget.data?.delta || 0})`;

      case 'chart':
        return `
# ${widget.title}
st.subheader("${widget.title}")
# Chart implementation would go here based on widget.config`;

      case 'table':
        return `
# ${widget.title}
st.subheader("${widget.title}")
st.dataframe(${JSON.stringify(widget.data || [])})`;

      default:
        return `
# ${widget.title}
st.write("${widget.title}: ${widget.description}")`;
    }
  }

  getAdapters(): ExternalDashboard[] {
    return Array.from(this.adapters.values());
  }

  removeAdapter(id: string): void {
    this.adapters.delete(id);
  }
}

// Create singleton adapter instance
const dashboardAdapter = new DashboardAdapter();

export const EnhancedDashboard: React.FC = () => {
  const [activeDashboard, setActiveDashboard] = useState<DashboardConfig | null>(null);
  const [externalDashboards, setExternalDashboards] = useState<ExternalDashboard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedView, setSelectedView] = useState<'native' | 'gradio' | 'streamlit'>('native');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Default dashboard configuration
  const defaultDashboard: DashboardConfig = {
    id: 'default',
    name: 'Workflow Analytics Dashboard',
    description: 'Real-time analytics and insights for workflow performance',
    widgets: [
      {
        id: 'performance_metric',
        type: 'metric',
        title: 'Average Execution Time',
        description: 'Average time to complete workflows',
        data: { value: 2.3, delta: -0.5, unit: 'minutes' },
        position: { x: 0, y: 0, w: 3, h: 2 }
      },
      {
        id: 'error_rate_chart',
        type: 'chart',
        title: 'Error Rate Trends',
        description: 'Workflow error rates over time',
        config: { chartType: 'line', timeRange: '7d' },
        position: { x: 3, y: 0, w: 6, h: 4 }
      },
      {
        id: 'active_workflows_table',
        type: 'table',
        title: 'Active Workflows',
        description: 'Currently running workflow instances',
        position: { x: 0, y: 2, w: 9, h: 3 }
      }
    ],
    theme: 'auto',
    layout: 'grid'
  };

  // Initialize dashboard
  useEffect(() => {
    setActiveDashboard(defaultDashboard);
    setExternalDashboards(dashboardAdapter.getAdapters());
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
      // In real implementation, this would fetch fresh data
      console.log('Dashboard refreshed');
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createExternalAdapter = useCallback(async (type: 'gradio' | 'streamlit', config: any) => {
    try {
      let adapter: ExternalDashboard;

      if (type === 'gradio') {
        adapter = await dashboardAdapter.createGradioAdapter(
          `Gradio Dashboard ${externalDashboards.length + 1}`,
          config
        );
      } else {
        adapter = await dashboardAdapter.createStreamlitAdapter(
          `Streamlit Dashboard ${externalDashboards.length + 1}`,
          config
        );
      }

      setExternalDashboards(prev => [...prev, adapter]);
    } catch (error) {
      console.error('Failed to create external adapter:', error);
    }
  }, [externalDashboards.length]);

  const exportDashboard = useCallback(async (format: 'gradio' | 'streamlit') => {
    if (!activeDashboard) return;

    try {
      let exportData: string;
      let filename: string;
      let mimeType: string;

      if (format === 'gradio') {
        exportData = await dashboardAdapter.exportToGradio(activeDashboard);
        filename = `${activeDashboard.name}_gradio.json`;
        mimeType = 'application/json';
      } else {
        exportData = await dashboardAdapter.exportToStreamlit(activeDashboard);
        filename = `${activeDashboard.name}_streamlit.py`;
        mimeType = 'text/x-python';
      }

      // Create and download file
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
      console.error('Failed to export dashboard:', error);
    }
  }, [activeDashboard]);

  const renderWidget = (widget: DashboardWidget) => {
    return (
      <motion.div
        key={widget.id}
        className="dashboard-widget"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="widget-header">
          <h3>{widget.title}</h3>
          <span className="widget-type">{widget.type}</span>
        </div>

        <div className="widget-content">
          {widget.type === 'metric' && (
            <div className="metric-display">
              <div className="metric-value">
                {widget.data?.value || 0}
                <span className="metric-unit">{widget.data?.unit}</span>
              </div>
              {widget.data?.delta && (
                <div className={`metric-delta ${widget.data.delta > 0 ? 'positive' : 'negative'}`}>
                  {widget.data.delta > 0 ? '+' : ''}{widget.data.delta}
                </div>
              )}
            </div>
          )}

          {widget.type === 'chart' && (
            <div className="chart-placeholder">
              <ChartBarIcon className="w-12 h-12 text-gray-400" />
              <p>Chart visualization would appear here</p>
            </div>
          )}

          {widget.type === 'table' && (
            <div className="table-placeholder">
              <EyeIcon className="w-8 h-8 text-gray-400" />
              <p>Table data would appear here</p>
            </div>
          )}
        </div>

        <div className="widget-description">
          {widget.description}
        </div>
      </motion.div>
    );
  };

  const renderExternalDashboard = (adapter: ExternalDashboard) => {
    return (
      <motion.div
        key={adapter.id}
        className="external-dashboard-item"
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
            onClick={() => dashboardAdapter.removeAdapter(adapter.id)}
            className="adapter-button secondary"
          >
            Remove
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="enhanced-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <ChartBarIcon className="w-8 h-8" />
            <div>
              <h1>{activeDashboard?.name || 'Dashboard'}</h1>
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
                <option value="5000">5 seconds</option>
                <option value="30000">30 seconds</option>
                <option value="60000">1 minute</option>
                <option value="300000">5 minutes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {selectedView === 'native' && activeDashboard && (
          <div className="dashboard-grid">
            {activeDashboard.widgets.map(renderWidget)}
          </div>
        )}

        {(selectedView === 'gradio' || selectedView === 'streamlit') && (
          <div className="external-dashboards">
            <div className="external-header">
              <h2>External Dashboard Adapters</h2>
              <div className="external-actions">
                <button
                  onClick={() => createExternalAdapter(selectedView, {})}
                  className="create-adapter-button"
                >
                  <CloudArrowUpIcon className="w-4 h-4" />
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
                <p>Create an adapter to integrate with external dashboard tools</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedDashboard;
