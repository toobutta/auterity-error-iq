import React, { useState, useMemo } from 'react';
import { useWorkflowAnalytics } from '../../hooks/useWorkflowAnalytics';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../../types/workflow';

interface WorkflowExecution {
  id: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'success' | 'failed' | 'timeout';
  nodeExecutions: any[];
  performance: any;
}

interface WorkflowAnalyticsDashboardProps {
  workflowId: string;
  executions: WorkflowExecution[];
  nodes: Node<NodeData>[];
  edges: Edge[];
}

export const WorkflowAnalyticsDashboard: React.FC<WorkflowAnalyticsDashboardProps> = ({
  workflowId,
  executions,
  nodes,
  edges
}) => {
  const { analytics, isAnalyzing, getInsights } = useWorkflowAnalytics({
    workflowId,
    executions,
    nodes,
    edges
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'errors' | 'bottlenecks' | 'optimizations'>('overview');

  const insights = useMemo(() => getInsights(), [getInsights]);

  // Format time helper
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing workflow performance...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Run some workflow executions to see analytics and insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workflow Analytics</h2>
            <p className="text-gray-600 mt-1">
              {analytics.executionCount} executions analyzed • Last updated: {new Date().toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {analytics.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(analytics.averageExecutionTime)}
              </div>
              <div className="text-sm text-gray-600">Avg Time</div>
            </div>
          </div>
        </div>

        {/* Insights Banner */}
        {insights.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Insights</h4>
            <ul className="space-y-1">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm text-blue-800">• {insight}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { id: 'overview', label: 'Overview', count: null },
            { id: 'performance', label: 'Performance', count: null },
            { id: 'errors', label: 'Errors', count: analytics.mostFrequentErrors.length },
            { id: 'bottlenecks', label: 'Bottlenecks', count: analytics.bottleneckNodes.length },
            { id: 'optimizations', label: 'Optimizations', count: analytics.optimizationOpportunities.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Success Rate Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Success Rate</p>
                  <p className="text-3xl font-bold text-green-900">{analytics.successRate.toFixed(1)}%</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-green-700">
                  {analytics.executionCount - Math.floor(analytics.executionCount * analytics.successRate / 100)} failed executions
                </div>
              </div>
            </div>

            {/* Average Execution Time */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Avg Execution Time</p>
                  <p className="text-3xl font-bold text-blue-900">{formatTime(analytics.averageExecutionTime)}</p>
                </div>
                <div className="text-4xl">⏱️</div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-blue-700">
                  Median: {formatTime(analytics.medianExecutionTime)}
                </div>
              </div>
            </div>

            {/* P95 Execution Time */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">P95 Execution Time</p>
                  <p className="text-3xl font-bold text-purple-900">{formatTime(analytics.p95ExecutionTime)}</p>
                </div>
                <div className="text-4xl">📈</div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-purple-700">
                  95th percentile performance
                </div>
              </div>
            </div>

            {/* Total Executions */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">Total Executions</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.executionCount}</p>
                </div>
                <div className="text-4xl">🔢</div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-gray-700">
                  Across all time periods
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Performance Trends Chart Placeholder */}
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Trends</h3>
              <p className="text-gray-600">Interactive chart showing performance over time</p>
              <div className="mt-4 text-sm text-gray-500">
                {analytics.performanceTrends.length} data points available
              </div>
            </div>

            {/* Performance Metrics Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Success Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Executions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.performanceTrends.slice(0, 10).map((trend, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(trend.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(trend.averageTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trend.successRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trend.executionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-6">
            {analytics.mostFrequentErrors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Errors Found</h3>
                <p className="text-gray-600">Great! All workflow executions completed successfully.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.mostFrequentErrors.map((error, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 mb-2">Error Pattern #{index + 1}</h4>
                        <p className="text-red-800 mb-2">{error.error}</p>
                        <div className="flex items-center space-x-4 text-sm text-red-700">
                          <span>Frequency: {error.count} times</span>
                          <span>Impact: {error.percentage.toFixed(1)}%</span>
                          <span>Affected Nodes: {error.affectedNodes.join(', ')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          {error.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bottlenecks' && (
          <div className="space-y-6">
            {analytics.bottleneckNodes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bottlenecks Detected</h3>
                <p className="text-gray-600">Excellent! All nodes are performing optimally.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.bottleneckNodes.map((bottleneck, index) => (
                  <div key={bottleneck.nodeId} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-900 mb-2">{bottleneck.nodeName}</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm text-yellow-800">
                          <div>
                            <span className="font-medium">Avg Time:</span> {formatTime(bottleneck.averageExecutionTime)}
                          </div>
                          <div>
                            <span className="font-medium">Executions:</span> {bottleneck.executionCount}
                          </div>
                          <div>
                            <span className="font-medium">Impact Score:</span> {bottleneck.impactScore.toFixed(0)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-600">
                          #{index + 1}
                        </div>
                        <div className="text-xs text-yellow-700">bottleneck</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'optimizations' && (
          <div className="space-y-6">
            {analytics.optimizationOpportunities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fully Optimized</h3>
                <p className="text-gray-600">No optimization opportunities identified. Your workflow is performing optimally!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.optimizationOpportunities.map((opportunity, index) => (
                  <div key={`${opportunity.nodeId}-${index}`} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900 mb-2 capitalize">
                          {opportunity.type} Opportunity
                        </h4>
                        <p className="text-green-800 mb-2">{opportunity.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-green-700">
                          <span>Node: {opportunity.nodeId}</span>
                          <span>Confidence: {(opportunity.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          +{formatTime(opportunity.potentialImprovement)}
                        </div>
                        <div className="text-xs text-green-700">potential savings</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


