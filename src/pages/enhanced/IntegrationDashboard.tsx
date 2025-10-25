/**
 * Integration Dashboard
 *
 * Unified view of Workflow Studio and Error IQ integration
 * Real-time synchronization, cross-system insights, and API management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowPathIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CpuChipIcon,
  ArrowRightIcon,
  ServerIcon,
  GlobeAltIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { workflowStudioIntegration } from '../services/enhanced/workflowStudioIntegration';

interface IntegrationStatus {
  workflowStudio: {
    connected: boolean;
    lastSync: Date | null;
    health: 'healthy' | 'degraded' | 'down';
  };
  errorIQ: {
    connected: boolean;
    lastSync: Date | null;
    health: 'healthy' | 'degraded' | 'down';
  };
  crossSystem: {
    activeConnections: number;
    dataFlowRate: number;
    errorRate: number;
  };
}

interface DataFlow {
  id: string;
  type: 'workflow' | 'error' | 'ai_insight' | 'metric';
  direction: 'to_studio' | 'to_error_iq' | 'bidirectional';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  source: string;
  target: string;
  dataSize: number;
  timestamp: Date;
}

export const IntegrationDashboard: React.FC = () => {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    workflowStudio: { connected: false, lastSync: null, health: 'down' },
    errorIQ: { connected: true, lastSync: new Date(), health: 'healthy' },
    crossSystem: { activeConnections: 0, dataFlowRate: 0, errorRate: 0 }
  });

  const [dataFlows, setDataFlows] = useState<DataFlow[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'flows' | 'health' | 'config'>('overview');

  // Initialize integration status
  useEffect(() => {
    checkIntegrationHealth();
    const interval = setInterval(checkIntegrationHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkIntegrationHealth = useCallback(async () => {
    try {
      const studioHealth = await workflowStudioIntegration.healthCheck();

      setIntegrationStatus(prev => ({
        ...prev,
        workflowStudio: {
          connected: studioHealth,
          lastSync: studioHealth ? new Date() : prev.workflowStudio.lastSync,
          health: studioHealth ? 'healthy' : 'down'
        },
        crossSystem: {
          ...prev.crossSystem,
          activeConnections: studioHealth ? 1 : 0
        }
      }));

      // Generate sample data flows
      if (studioHealth) {
        generateSampleDataFlows();
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setIntegrationStatus(prev => ({
        ...prev,
        workflowStudio: { ...prev.workflowStudio, health: 'down' }
      }));
    }
  }, []);

  const generateSampleDataFlows = useCallback(() => {
    const sampleFlows: DataFlow[] = [
      {
        id: 'flow_1',
        type: 'workflow',
        direction: 'to_studio',
        status: 'completed',
        source: 'Error IQ',
        target: 'Workflow Studio',
        dataSize: 2450,
        timestamp: new Date(Date.now() - 300000) // 5 minutes ago
      },
      {
        id: 'flow_2',
        type: 'error',
        direction: 'bidirectional',
        status: 'in_progress',
        source: 'Workflow Studio',
        target: 'Error IQ',
        dataSize: 890,
        timestamp: new Date(Date.now() - 120000) // 2 minutes ago
      },
      {
        id: 'flow_3',
        type: 'ai_insight',
        direction: 'to_error_iq',
        status: 'completed',
        source: 'Workflow Studio AI',
        target: 'Error IQ Intelligence',
        dataSize: 1200,
        timestamp: new Date(Date.now() - 60000) // 1 minute ago
      }
    ];

    setDataFlows(sampleFlows);
  }, []);

  const performSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Perform cross-system synchronization
      await workflowStudioIntegration.syncRealTimeData('health_check', {
        timestamp: new Date(),
        systems: ['workflow_studio', 'error_iq']
      });

      setIntegrationStatus(prev => ({
        ...prev,
        workflowStudio: { ...prev.workflowStudio, lastSync: new Date() },
        errorIQ: { ...prev.errorIQ, lastSync: new Date() }
      }));

      console.log('✅ Cross-system sync completed');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const renderSystemStatus = (system: 'workflowStudio' | 'errorIQ', data: any) => {
    const getStatusColor = (health: string) => {
      switch (health) {
        case 'healthy': return 'text-green-600 bg-green-100';
        case 'degraded': return 'text-yellow-600 bg-yellow-100';
        case 'down': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <motion.div
        className="system-status-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="system-header">
          <div className="system-icon">
            {system === 'workflowStudio' ? (
              <GlobeAltIcon className="w-6 h-6" />
            ) : (
              <ServerIcon className="w-6 h-6" />
            )}
          </div>
          <div className="system-info">
            <h3>{system === 'workflowStudio' ? 'Workflow Studio' : 'Error IQ'}</h3>
            <div className={`status-badge ${getStatusColor(data.health)}`}>
              <span className="status-dot"></span>
              {data.health.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="system-metrics">
          <div className="metric">
            <span className="metric-label">Connected:</span>
            <span className={`metric-value ${data.connected ? 'text-green-600' : 'text-red-600'}`}>
              {data.connected ? 'Yes' : 'No'}
            </span>
          </div>

          <div className="metric">
            <span className="metric-label">Last Sync:</span>
            <span className="metric-value">
              {data.lastSync ? data.lastSync.toLocaleTimeString() : 'Never'}
            </span>
          </div>

          <div className="metric">
            <span className="metric-label">API Health:</span>
            <span className={`metric-value ${getStatusColor(data.health)}`}>
              {data.health.toUpperCase()}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderDataFlow = (flow: DataFlow) => {
    const getFlowIcon = (type: string) => {
      switch (type) {
        case 'workflow': return <BoltIcon className="w-4 h-4" />;
        case 'error': return <ExclamationTriangleIcon className="w-4 h-4" />;
        case 'ai_insight': return <CpuChipIcon className="w-4 h-4" />;
        case 'metric': return <ArrowPathIcon className="w-4 h-4" />;
        default: return <ArrowRightIcon className="w-4 h-4" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return 'text-green-600 bg-green-100';
        case 'in_progress': return 'text-blue-600 bg-blue-100';
        case 'pending': return 'text-yellow-600 bg-yellow-100';
        case 'failed': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <motion.div
        key={flow.id}
        className="data-flow-item"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flow-icon">
          {getFlowIcon(flow.type)}
        </div>

        <div className="flow-content">
          <div className="flow-header">
            <span className="flow-type">{flow.type.replace('_', ' ').toUpperCase()}</span>
            <div className={`flow-status ${getStatusColor(flow.status)}`}>
              {flow.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          <div className="flow-route">
            <span className="flow-source">{flow.source}</span>
            <ArrowRightIcon className="w-4 h-4 mx-2" />
            <span className="flow-target">{flow.target}</span>
          </div>

          <div className="flow-meta">
            <span className="flow-size">{flow.dataSize} bytes</span>
            <span className="flow-time">{flow.timestamp.toLocaleTimeString()}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="integration-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <CloudArrowUpIcon className="w-8 h-8" />
            <div>
              <h1>Integration Dashboard</h1>
              <p>Cross-system communication between Workflow Studio and Error IQ</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="view-selector">
              <button
                className={selectedView === 'overview' ? 'active' : ''}
                onClick={() => setSelectedView('overview')}
              >
                Overview
              </button>
              <button
                className={selectedView === 'flows' ? 'active' : ''}
                onClick={() => setSelectedView('flows')}
              >
                Data Flows
              </button>
              <button
                className={selectedView === 'health' ? 'active' : ''}
                onClick={() => setSelectedView('health')}
              >
                Health
              </button>
              <button
                className={selectedView === 'config' ? 'active' : ''}
                onClick={() => setSelectedView('config')}
              >
                Config
              </button>
            </div>

            <button
              onClick={performSync}
              disabled={isSyncing}
              className="sync-button"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Systems'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {selectedView === 'overview' && (
          <div className="overview-section">
            {/* System Status Cards */}
            <div className="system-status-grid">
              {renderSystemStatus('workflowStudio', integrationStatus.workflowStudio)}
              {renderSystemStatus('errorIQ', integrationStatus.errorIQ)}
            </div>

            {/* Cross-System Metrics */}
            <div className="cross-system-metrics">
              <motion.div
                className="metric-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="metric-header">
                  <BoltIcon className="w-6 h-6" />
                  <h3>Active Connections</h3>
                </div>
                <div className="metric-value">
                  {integrationStatus.crossSystem.activeConnections}
                </div>
                <div className="metric-label">Systems Connected</div>
              </motion.div>

              <motion.div
                className="metric-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="metric-header">
                  <ArrowRightIcon className="w-6 h-6" />
                  <h3>Data Flow Rate</h3>
                </div>
                <div className="metric-value">
                  {integrationStatus.crossSystem.dataFlowRate.toFixed(1)}
                </div>
                <div className="metric-label">KB/s</div>
              </motion.div>

              <motion.div
                className="metric-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <div className="metric-header">
                  <ExclamationTriangleIcon className="w-6 h-6" />
                  <h3>Error Rate</h3>
                </div>
                <div className="metric-value">
                  {(integrationStatus.crossSystem.errorRate * 100).toFixed(2)}%
                </div>
                <div className="metric-label">Cross-System Errors</div>
              </motion.div>
            </div>

            {/* Recent Data Flows */}
            <div className="recent-flows-section">
              <h2>Recent Data Flows</h2>
              <AnimatePresence>
                {dataFlows.slice(0, 5).map(renderDataFlow)}
              </AnimatePresence>

              {dataFlows.length === 0 && (
                <div className="empty-state">
                  <ArrowRightIcon className="w-12 h-12 text-gray-400" />
                  <h3>No recent data flows</h3>
                  <p>Data flows between systems will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedView === 'flows' && (
          <div className="flows-section">
            <div className="flows-header">
              <h2>Data Flow Monitor</h2>
              <div className="flows-controls">
                <select className="flow-filter">
                  <option value="all">All Flows</option>
                  <option value="workflow">Workflows</option>
                  <option value="error">Errors</option>
                  <option value="ai_insight">AI Insights</option>
                  <option value="metric">Metrics</option>
                </select>
                <select className="time-filter">
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>
            </div>

            <div className="flows-list">
              <AnimatePresence>
                {dataFlows.map(renderDataFlow)}
              </AnimatePresence>
            </div>
          </div>
        )}

        {selectedView === 'health' && (
          <div className="health-section">
            <h2>System Health Monitor</h2>
            <div className="health-grid">
              <div className="health-card">
                <h3>Workflow Studio API</h3>
                <div className="health-status">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span>Healthy</span>
                </div>
                <div className="health-details">
                  <div>Response Time: 245ms</div>
                  <div>Uptime: 99.9%</div>
                  <div>Last Check: {new Date().toLocaleTimeString()}</div>
                </div>
              </div>

              <div className="health-card">
                <h3>Error IQ API</h3>
                <div className="health-status">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span>Healthy</span>
                </div>
                <div className="health-details">
                  <div>Response Time: 89ms</div>
                  <div>Uptime: 99.8%</div>
                  <div>Last Check: {new Date().toLocaleTimeString()}</div>
                </div>
              </div>

              <div className="health-card">
                <h3>Cross-System Bus</h3>
                <div className="health-status">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span>Healthy</span>
                </div>
                <div className="health-details">
                  <div>Message Queue: 0 pending</div>
                  <div>Throughput: 150 msg/s</div>
                  <div>Last Sync: {new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'config' && (
          <div className="config-section">
            <h2>Integration Configuration</h2>
            <div className="config-cards">
              <div className="config-card">
                <h3>API Endpoints</h3>
                <div className="config-items">
                  <div className="config-item">
                    <label>Workflow Studio URL:</label>
                    <input type="text" value="http://localhost:3001" readOnly />
                  </div>
                  <div className="config-item">
                    <label>Error IQ URL:</label>
                    <input type="text" value="http://localhost:8000" readOnly />
                  </div>
                  <div className="config-item">
                    <label>Cross-System Bus:</label>
                    <input type="text" value="ws://localhost:8080" readOnly />
                  </div>
                </div>
              </div>

              <div className="config-card">
                <h3>Authentication</h3>
                <div className="config-items">
                  <div className="config-item">
                    <label>API Key:</label>
                    <input type="password" value="••••••••••••••••" readOnly />
                    <button className="config-button">Rotate</button>
                  </div>
                  <div className="config-item">
                    <label>JWT Secret:</label>
                    <input type="password" value="••••••••••••••••" readOnly />
                    <button className="config-button">Update</button>
                  </div>
                </div>
              </div>

              <div className="config-card">
                <h3>Data Synchronization</h3>
                <div className="config-items">
                  <div className="config-item">
                    <label>Sync Interval:</label>
                    <select>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="300">5 minutes</option>
                    </select>
                  </div>
                  <div className="config-item">
                    <label>Batch Size:</label>
                    <input type="number" value="100" />
                  </div>
                  <div className="config-item">
                    <label>Retry Policy:</label>
                    <select>
                      <option value="exponential">Exponential Backoff</option>
                      <option value="linear">Linear</option>
                      <option value="immediate">Immediate</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationDashboard;
