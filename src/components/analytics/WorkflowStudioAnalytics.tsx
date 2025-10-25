/**
 * WORKFLOW STUDIO ANALYTICS DASHBOARD
 * 
 * Integrates Auterity's existing analytics capabilities with workflow-specific
 * metrics, performance monitoring, and predictive insights.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from '../../../auterity-error-iq/frontend/src/contexts/AuthContext';
import { useNotifications } from '../../../auterity-error-iq/frontend/src/components/notifications/NotificationSystem';

// Enhanced interfaces for workflow analytics
interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  totalNodes: number;
  totalConnections: number;
  collaborativeEdits: number;
  templateUsage: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  nodeExecutions: NodeExecution[];
  errorMessage?: string;
  userId: string;
  userName: string;
}

interface NodeExecution {
  nodeId: string;
  nodeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  inputData?: any;
  outputData?: any;
  errorMessage?: string;
}

interface PerformanceInsight {
  id: string;
  type: 'bottleneck' | 'optimization' | 'error_pattern' | 'usage_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  confidence: number;
  affectedWorkflows: string[];
  estimatedImprovement?: string;
}

interface WorkflowStudioAnalyticsProps {
  workflowId?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d' | '90d';
  className?: string;
}

export const WorkflowStudioAnalytics: React.FC<WorkflowStudioAnalyticsProps> = ({
  workflowId,
  timeRange = '24h',
  className = ''
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // State management
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'insights' | 'executions'>('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [workflowId, selectedTimeRange]);

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data loading - in real implementation, this would call analytics API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock metrics
      const mockMetrics: WorkflowMetrics = {
        totalWorkflows: 45,
        activeWorkflows: 12,
        completedExecutions: 1847,
        failedExecutions: 23,
        averageExecutionTime: 4200, // ms
        successRate: 98.8,
        totalNodes: 234,
        totalConnections: 189,
        collaborativeEdits: 156,
        templateUsage: 78
      };

      // Mock executions
      const mockExecutions: WorkflowExecution[] = Array.from({ length: 20 }, (_, i) => ({
        id: `exec_${i + 1}`,
        workflowId: workflowId || `workflow_${Math.floor(Math.random() * 10) + 1}`,
        workflowName: `Customer Process ${i + 1}`,
        status: ['completed', 'running', 'failed'][Math.floor(Math.random() * 3)] as any,
        startTime: new Date(Date.now() - Math.random() * 86400000), // Last 24h
        endTime: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 43200000) : undefined,
        duration: Math.random() > 0.3 ? Math.floor(Math.random() * 30000) + 1000 : undefined,
        nodeExecutions: [],
        userId: user?.id || 'user_1',
        userName: user?.name || 'John Doe'
      }));

      // Mock insights
      const mockInsights: PerformanceInsight[] = [
        {
          id: 'insight_1',
          type: 'bottleneck',
          severity: 'high',
          title: 'Database Query Bottleneck',
          description: 'Multiple workflows experiencing delays in database query nodes',
          impact: 'Average execution time increased by 40%',
          recommendation: 'Optimize queries by adding indexes and using query batching',
          confidence: 0.92,
          affectedWorkflows: ['workflow_1', 'workflow_3', 'workflow_7'],
          estimatedImprovement: '60% faster execution'
        },
        {
          id: 'insight_2',
          type: 'optimization',
          severity: 'medium',
          title: 'Parallel Execution Opportunity',
          description: 'Independent nodes running sequentially instead of in parallel',
          impact: 'Suboptimal resource utilization',
          recommendation: 'Enable parallel execution for independent workflow branches',
          confidence: 0.87,
          affectedWorkflows: ['workflow_2', 'workflow_5'],
          estimatedImprovement: '30% time reduction'
        },
        {
          id: 'insight_3',
          type: 'usage_pattern',
          severity: 'low',
          title: 'Template Adoption Opportunity',
          description: 'Custom workflows showing similar patterns to existing templates',
          impact: 'Increased development time',
          recommendation: 'Promote relevant templates to reduce custom development',
          confidence: 0.75,
          affectedWorkflows: ['workflow_4', 'workflow_6', 'workflow_8'],
          estimatedImprovement: '50% faster workflow creation'
        }
      ];

      setMetrics(mockMetrics);
      setExecutions(mockExecutions);
      setInsights(mockInsights);

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Analytics Load Failed',
        message: 'Failed to load analytics data. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [workflowId, selectedTimeRange, addNotification, user]);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!metrics || !executions.length) return null;

    const recentExecutions = executions.filter(exec => 
      exec.startTime > new Date(Date.now() - 86400000) // Last 24h
    );

    const avgExecutionTime = recentExecutions
      .filter(exec => exec.duration)
      .reduce((sum, exec) => sum + (exec.duration || 0), 0) / 
      recentExecutions.filter(exec => exec.duration).length;

    const successfulExecutions = recentExecutions.filter(exec => exec.status === 'completed').length;
    const currentSuccessRate = (successfulExecutions / recentExecutions.length) * 100;

    return {
      recentExecutions: recentExecutions.length,
      avgExecutionTime: avgExecutionTime || 0,
      successRate: currentSuccessRate || 0,
      runningExecutions: executions.filter(exec => exec.status === 'running').length,
      failedExecutions: executions.filter(exec => exec.status === 'failed').length
    };
  }, [metrics, executions]);

  // Format time helper
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  // Format percentage helper
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className={`workflow-analytics-loading ${className}`}>
        <div className="loading-content">
          <div className="spinner large"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`workflow-studio-analytics ${className}`}>
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h2>📊 Workflow Analytics</h2>
          <p>Performance insights and metrics for your workflows</p>
        </div>
        <div className="header-controls">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="time-range-selector"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="analytics-tabs">
        {[
          { id: 'overview', label: '📈 Overview', count: null },
          { id: 'performance', label: '⚡ Performance', count: null },
          { id: 'insights', label: '💡 Insights', count: insights.length },
          { id: 'executions', label: '🔄 Executions', count: executions.length }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
            {tab.count !== null && <span className="count">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="analytics-content">
        {activeTab === 'overview' && metrics && (
          <div className="overview-panel">
            {/* Key Metrics */}
            <div className="metrics-grid">
              <div className="metric-card primary">
                <div className="metric-value">{metrics.totalWorkflows}</div>
                <div className="metric-label">Total Workflows</div>
                <div className="metric-change positive">+{metrics.activeWorkflows} active</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{formatPercentage(derivedMetrics?.successRate || metrics.successRate)}</div>
                <div className="metric-label">Success Rate</div>
                <div className="metric-change positive">+2.3% this week</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{formatDuration(derivedMetrics?.avgExecutionTime || metrics.averageExecutionTime)}</div>
                <div className="metric-label">Avg Execution Time</div>
                <div className="metric-change negative">+0.5s slower</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{metrics.completedExecutions.toLocaleString()}</div>
                <div className="metric-label">Total Executions</div>
                <div className="metric-change positive">+{derivedMetrics?.recentExecutions || 0} today</div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="secondary-metrics">
              <div className="metric-row">
                <span className="metric-name">Collaborative Edits</span>
                <span className="metric-value">{metrics.collaborativeEdits}</span>
              </div>
              <div className="metric-row">
                <span className="metric-name">Template Usage</span>
                <span className="metric-value">{metrics.templateUsage}%</span>
              </div>
              <div className="metric-row">
                <span className="metric-name">Total Nodes</span>
                <span className="metric-value">{metrics.totalNodes}</span>
              </div>
              <div className="metric-row">
                <span className="metric-name">Active Connections</span>
                <span className="metric-value">{metrics.totalConnections}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-panel">
            <h3>⚡ Performance Analysis</h3>
            
            {/* Performance Summary */}
            <div className="performance-summary">
              <div className="summary-card">
                <h4>🚀 Fastest Workflows</h4>
                <div className="workflow-list">
                  <div className="workflow-item">
                    <span className="workflow-name">Email Notification</span>
                    <span className="workflow-time">0.8s</span>
                  </div>
                  <div className="workflow-item">
                    <span className="workflow-name">Data Validation</span>
                    <span className="workflow-time">1.2s</span>
                  </div>
                  <div className="workflow-item">
                    <span className="workflow-name">User Registration</span>
                    <span className="workflow-time">2.1s</span>
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <h4>🐌 Slowest Workflows</h4>
                <div className="workflow-list">
                  <div className="workflow-item">
                    <span className="workflow-name">Data Migration</span>
                    <span className="workflow-time">45.2s</span>
                  </div>
                  <div className="workflow-item">
                    <span className="workflow-name">Report Generation</span>
                    <span className="workflow-time">23.8s</span>
                  </div>
                  <div className="workflow-item">
                    <span className="workflow-name">Batch Processing</span>
                    <span className="workflow-time">18.5s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottleneck Analysis */}
            <div className="bottleneck-analysis">
              <h4>🔍 Bottleneck Analysis</h4>
              <div className="bottleneck-chart">
                <div className="chart-placeholder">
                  <p>📊 Performance visualization would be displayed here</p>
                  <p>• Node execution times</p>
                  <p>• Bottleneck identification</p>
                  <p>• Resource utilization patterns</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="insights-panel">
            <h3>💡 Performance Insights</h3>
            
            {insights.length === 0 ? (
              <div className="empty-state">
                <p>No insights available yet. Execute some workflows to generate performance insights.</p>
              </div>
            ) : (
              <div className="insights-list">
                {insights.map(insight => (
                  <div key={insight.id} className={`insight-card ${insight.type}`}>
                    <div className="insight-header">
                      <div className="insight-title">
                        <h4>{insight.title}</h4>
                        <span className={`severity-badge ${getSeverityColor(insight.severity)}`}>
                          {insight.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="insight-confidence">
                        {Math.round(insight.confidence * 100)}% confidence
                      </div>
                    </div>
                    
                    <div className="insight-content">
                      <p className="insight-description">{insight.description}</p>
                      
                      <div className="insight-impact">
                        <strong>Impact:</strong> {insight.impact}
                      </div>
                      
                      <div className="insight-recommendation">
                        <strong>Recommendation:</strong> {insight.recommendation}
                      </div>
                      
                      {insight.estimatedImprovement && (
                        <div className="insight-improvement">
                          <strong>Expected Improvement:</strong> {insight.estimatedImprovement}
                        </div>
                      )}
                      
                      <div className="insight-workflows">
                        <strong>Affected Workflows:</strong>
                        <div className="workflow-tags">
                          {insight.affectedWorkflows.map(workflowId => (
                            <span key={workflowId} className="workflow-tag">
                              {workflowId}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="insight-actions">
                      <button className="btn btn-primary btn-small">
                        Apply Optimization
                      </button>
                      <button className="btn btn-secondary btn-small">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'executions' && (
          <div className="executions-panel">
            <h3>🔄 Recent Executions</h3>
            
            <div className="executions-table">
              <div className="table-header">
                <div className="col-workflow">Workflow</div>
                <div className="col-status">Status</div>
                <div className="col-duration">Duration</div>
                <div className="col-user">User</div>
                <div className="col-time">Started</div>
                <div className="col-actions">Actions</div>
              </div>
              
              {executions.slice(0, 10).map(execution => (
                <div key={execution.id} className="table-row">
                  <div className="col-workflow">
                    <span className="workflow-name">{execution.workflowName}</span>
                  </div>
                  <div className="col-status">
                    <span className={`status-badge ${execution.status}`}>
                      {execution.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="col-duration">
                    {execution.duration ? formatDuration(execution.duration) : '-'}
                  </div>
                  <div className="col-user">{execution.userName}</div>
                  <div className="col-time">
                    {execution.startTime.toLocaleTimeString()}
                  </div>
                  <div className="col-actions">
                    <button className="btn btn-small">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowStudioAnalytics;
