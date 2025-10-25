import React, { useEffect, useState, useCallback } from 'react';
import { humanLayerService, HumanApprovalRequest, HumanApprovalResponse } from '../../../src/services/humanLayerService';
import { enhancedMLflowService, Experiment, Run, ModelVersion } from '../../../src/services/enhancedMLflowService';

// Types
interface DashboardProps {
  className?: string;
}

interface ApprovalRequest {
  id: string;
  type: string;
  title: string;
  description: string;
  urgency: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  responseTime?: number;
}

interface MLflowStats {
  totalExperiments: number;
  totalRuns: number;
  activeRuns: number;
  productionModels: number;
  averageRunDuration: number;
}

export const HumanLayerMLflowDashboard: React.FC<DashboardProps> = ({
  className = ""
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'mlflow' | 'analytics'>('overview');
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [mlflowStats, setMLflowStats] = useState<MLflowStats>({
    totalExperiments: 0,
    totalRuns: 0,
    activeRuns: 0,
    productionModels: 0,
    averageRunDuration: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load MLflow data
      const [experimentsData, runsData, metrics] = await Promise.all([
        enhancedMLflowService.getExperiments(),
        enhancedMLflowService.getAllRuns(),
        enhancedMLflowService.getMetrics()
      ]);

      setExperiments(experimentsData);
      setRuns(runsData);
      setMLflowStats(metrics);

      // Load mock approval requests (would come from HumanLayer API)
      setApprovalRequests([
        {
          id: '1',
          type: 'workflow_approval',
          title: 'Critical Workflow Deployment',
          description: 'Deploying new fraud detection workflow to production',
          urgency: 'high',
          status: 'pending',
          createdAt: new Date(Date.now() - 1000 * 60 * 30)
        },
        {
          id: '2',
          type: 'code_execution',
          title: 'Database Schema Change',
          description: 'Executing database migration for user data partitioning',
          urgency: 'critical',
          status: 'approved',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          responseTime: 450
        }
      ]);

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApprovalAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      // Update local state
      setApprovalRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' }
            : req
        )
      );

      // In a real implementation, this would call the HumanLayer API
      console.log(`${action}d request ${requestId}`);

    } catch (err) {
      console.error('Failed to process approval:', err);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-8 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-8 ${className}`}>
        <div className="text-center py-12">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              HumanLayer + MLflow Dashboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Human-in-the-Loop AI Operations & ML Experiment Tracking
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview' as const, label: 'Overview', icon: '📊' },
              { id: 'approvals' as const, label: 'Human Approvals', icon: '👥', badge: approvalRequests.filter(r => r.status === 'pending').length },
              { id: 'mlflow' as const, label: 'ML Experiments', icon: '🧪' },
              { id: 'analytics' as const, label: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            approvalRequests={approvalRequests}
            mlflowStats={mlflowStats}
            recentRuns={runs.slice(0, 5)}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalsTab
            approvalRequests={approvalRequests}
            onApprovalAction={handleApprovalAction}
          />
        )}

        {activeTab === 'mlflow' && (
          <MLflowTab
            experiments={experiments}
            runs={runs}
            models={models}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            approvalRequests={approvalRequests}
            runs={runs}
            mlflowStats={mlflowStats}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{
  approvalRequests: ApprovalRequest[];
  mlflowStats: MLflowStats;
  recentRuns: Run[];
}> = ({ approvalRequests, mlflowStats, recentRuns }) => (
  <div className="space-y-6">
    {/* Key Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="text-sm font-medium text-blue-900">Pending Approvals</div>
        <div className="text-2xl font-bold text-blue-600">
          {approvalRequests.filter(r => r.status === 'pending').length}
        </div>
        <div className="text-xs text-blue-700 mt-1">Require attention</div>
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <div className="text-sm font-medium text-green-900">Active ML Runs</div>
        <div className="text-2xl font-bold text-green-600">
          {mlflowStats.activeRuns}
        </div>
        <div className="text-xs text-green-700 mt-1">Currently running</div>
      </div>

      <div className="bg-purple-50 rounded-lg p-4">
        <div className="text-sm font-medium text-purple-900">ML Experiments</div>
        <div className="text-2xl font-bold text-purple-600">
          {mlflowStats.totalExperiments}
        </div>
        <div className="text-xs text-purple-700 mt-1">Total experiments</div>
      </div>

      <div className="bg-orange-50 rounded-lg p-4">
        <div className="text-sm font-medium text-orange-900">Production Models</div>
        <div className="text-2xl font-bold text-orange-600">
          {mlflowStats.productionModels}
        </div>
        <div className="text-xs text-orange-700 mt-1">In production</div>
      </div>
    </div>

    {/* Recent Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Approvals */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Human Approvals</h3>
        <div className="space-y-2">
          {approvalRequests.slice(0, 5).map((request) => (
            <div key={request.id} className={`p-3 rounded border-l-4 ${getUrgencyColor(request.urgency)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{request.title}</div>
                  <div className="text-xs text-gray-500">{request.createdAt.toLocaleTimeString()}</div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent ML Runs */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Recent ML Runs</h3>
        <div className="space-y-2">
          {recentRuns.map((run) => (
            <div key={run.id} className="flex items-center justify-between p-3 bg-white rounded border">
              <div>
                <div className="text-sm font-medium text-gray-900">{run.name}</div>
                <div className="text-xs text-gray-500">{run.startTime.toLocaleTimeString()}</div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  run.status === 'FINISHED' ? 'bg-green-100 text-green-800' :
                  run.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                  run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {run.status}
                </div>
                {run.endTime && (
                  <div className="text-xs text-gray-500 mt-1">
                    Duration: {formatDuration(run.endTime.getTime() - run.startTime.getTime())}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Approvals Tab Component
const ApprovalsTab: React.FC<{
  approvalRequests: ApprovalRequest[];
  onApprovalAction: (requestId: string, action: 'approve' | 'reject') => void;
}> = ({ approvalRequests, onApprovalAction }) => (
  <div className="space-y-4">
    {approvalRequests.map((request) => (
      <div key={request.id} className={`p-4 rounded-lg border-l-4 ${getUrgencyColor(request.urgency)}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-sm font-medium text-gray-900">{request.title}</h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                {request.status}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                request.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {request.urgency}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{request.description}</p>
            <div className="text-xs text-gray-500">
              Created: {request.createdAt.toLocaleString()}
              {request.responseTime && ` • Response time: ${formatDuration(request.responseTime * 1000)}`}
            </div>
          </div>
          {request.status === 'pending' && (
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => onApprovalAction(request.id, 'approve')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Approve
              </button>
              <button
                onClick={() => onApprovalAction(request.id, 'reject')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

// MLflow Tab Component
const MLflowTab: React.FC<{
  experiments: Experiment[];
  runs: Run[];
  models: ModelVersion[];
}> = ({ experiments, runs, models }) => (
  <div className="space-y-6">
    {/* Experiments */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Experiments ({experiments.length})</h3>
      <div className="space-y-2">
        {experiments.slice(0, 10).map((experiment) => (
          <div key={experiment.id} className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <div className="text-sm font-medium text-gray-900">{experiment.name}</div>
              <div className="text-xs text-gray-500">
                Created: {experiment.createdAt.toLocaleDateString()}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {runs.filter(r => r.experimentId === experiment.id).length} runs
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Recent Runs */}
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Runs</h3>
      <div className="space-y-2">
        {runs.slice(0, 10).map((run) => (
          <div key={run.id} className="flex items-center justify-between p-3 bg-white rounded border">
            <div>
              <div className="text-sm font-medium text-gray-900">{run.name}</div>
              <div className="text-xs text-gray-500">
                Started: {run.startTime.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                run.status === 'FINISHED' ? 'bg-green-100 text-green-800' :
                run.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {run.status}
              </span>
              {Object.keys(run.metrics).length > 0 && (
                <div className="text-xs text-gray-500">
                  {Object.entries(run.metrics).slice(0, 2).map(([key, value]) =>
                    `${key}: ${value.toFixed(3)}`
                  ).join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Analytics Tab Component
const AnalyticsTab: React.FC<{
  approvalRequests: ApprovalRequest[];
  runs: Run[];
  mlflowStats: MLflowStats;
}> = ({ approvalRequests, runs, mlflowStats }) => {
  const approvalStats = {
    total: approvalRequests.length,
    approved: approvalRequests.filter(r => r.status === 'approved').length,
    rejected: approvalRequests.filter(r => r.status === 'rejected').length,
    pending: approvalRequests.filter(r => r.status === 'pending').length,
    averageResponseTime: approvalRequests
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + (r.responseTime || 0), 0) /
      approvalRequests.filter(r => r.responseTime).length || 0
  };

  const runStats = {
    success: runs.filter(r => r.status === 'FINISHED').length,
    failed: runs.filter(r => r.status === 'FAILED').length,
    running: runs.filter(r => r.status === 'RUNNING').length,
    successRate: runs.length > 0 ? (runs.filter(r => r.status === 'FINISHED').length / runs.length) * 100 : 0
  };

  return (
    <div className="space-y-6">
      {/* Approval Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Human Approval Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Requests</span>
              <span className="text-sm font-medium">{approvalStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Approval Rate</span>
              <span className="text-sm font-medium text-green-600">
                {approvalStats.total > 0 ? ((approvalStats.approved / approvalStats.total) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Response Time</span>
              <span className="text-sm font-medium">
                {formatDuration(approvalStats.averageResponseTime * 1000)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-sm font-medium text-yellow-600">{approvalStats.pending}</span>
            </div>
          </div>
        </div>

        {/* ML Experiment Analytics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">ML Experiment Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Runs</span>
              <span className="text-sm font-medium">{runs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-sm font-medium text-green-600">
                {runStats.successRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Runs</span>
              <span className="text-sm font-medium text-blue-600">{runStats.running}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Duration</span>
              <span className="text-sm font-medium">
                {formatDuration(mlflowStats.averageRunDuration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts would go here - using simple text representation for now */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Performance Trends</h3>
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p>Interactive charts would be displayed here showing:</p>
          <ul className="text-sm mt-2 space-y-1">
            <li>• Approval response times over time</li>
            <li>• ML experiment success rates</li>
            <li>• Human-AI collaboration efficiency metrics</li>
            <li>• Model performance comparisons</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Utility function
const formatDuration = (ms: number) => {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'text-green-600 bg-green-100';
    case 'rejected': return 'text-red-600 bg-red-100';
    case 'pending': return 'text-yellow-600 bg-yellow-100';
    case 'expired': return 'text-gray-600 bg-gray-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'critical': return 'border-l-red-500 bg-red-50';
    case 'high': return 'border-l-orange-500 bg-orange-50';
    case 'medium': return 'border-l-yellow-500 bg-yellow-50';
    default: return 'border-l-gray-500 bg-gray-50';
  }
};

