/**
 * Playbook Manager Component
 *
 * Comprehensive interface for creating, managing, and executing remediation playbooks
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  playbookService,
  RemediationPlaybook,
  PlaybookExecution,
  PlaybookStep,
  PlaybookTrigger,
  PlaybookSafetyCheck
} from '../../services/playbookService';
import {
  PlayIcon,
  StopIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BoltIcon,
  ArrowPathIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolidIcon } from '@heroicons/react/24/solid';

interface PlaybookManagerProps {
  tenantId?: string;
  onPlaybookExecute?: (execution: PlaybookExecution) => void;
  onExecutionComplete?: (execution: PlaybookExecution) => void;
  className?: string;
}

export const PlaybookManager: React.FC<PlaybookManagerProps> = ({
  tenantId = 'default_tenant',
  onPlaybookExecute,
  onExecutionComplete,
  className = ''
}) => {
  const [playbooks, setPlaybooks] = useState<RemediationPlaybook[]>([]);
  const [executions, setExecutions] = useState<PlaybookExecution[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PlaybookExecution[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<RemediationPlaybook | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<PlaybookExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'playbooks' | 'executions' | 'approvals'>('playbooks');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [allPlaybooks, allExecutions, approvals] = await Promise.all([
          playbookService.getPlaybooks(),
          playbookService.getExecutions(),
          playbookService.getPendingApprovals()
        ]);

        setPlaybooks(allPlaybooks);
        setExecutions(allExecutions);
        setPendingApprovals(approvals);
      } catch (error) {
        console.error('Failed to load playbook data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Listen for playbook events
  useEffect(() => {
    const handlePlaybookCreated = (playbook: RemediationPlaybook) => {
      setPlaybooks(prev => [playbook, ...prev]);
    };

    const handleExecutionStarted = (execution: PlaybookExecution) => {
      setExecutions(prev => [execution, ...prev]);
      if (onPlaybookExecute) {
        onPlaybookExecute(execution);
      }
    };

    const handleExecutionCompleted = (execution: PlaybookExecution) => {
      setExecutions(prev => prev.map(e => e.id === execution.id ? execution : e));
      if (onExecutionComplete) {
        onExecutionComplete(execution);
      }
    };

    const handleExecutionFailed = (execution: PlaybookExecution) => {
      setExecutions(prev => prev.map(e => e.id === execution.id ? execution : e));
    };

    const handleApprovalRequired = (execution: PlaybookExecution) => {
      setPendingApprovals(prev => [execution, ...prev]);
    };

    playbookService.on('playbook:created', handlePlaybookCreated);
    playbookService.on('execution:started', handleExecutionStarted);
    playbookService.on('execution:completed', handleExecutionCompleted);
    playbookService.on('execution:failed', handleExecutionFailed);
    playbookService.on('execution:pending_approval', handleApprovalRequired);

    return () => {
      playbookService.off('playbook:created', handlePlaybookCreated);
      playbookService.off('execution:started', handleExecutionStarted);
      playbookService.off('execution:completed', handleExecutionCompleted);
      playbookService.off('execution:failed', handleExecutionFailed);
      playbookService.off('execution:pending_approval', handleApprovalRequired);
    };
  }, [onPlaybookExecute, onExecutionComplete]);

  // Filter playbooks
  const filteredPlaybooks = playbooks.filter(playbook =>
    filterCategory === 'all' || playbook.category === filterCategory
  );

  // Execute playbook
  const handleExecutePlaybook = async (playbookId: string) => {
    try {
      const execution = await playbookService.executePlaybook(playbookId);
      // Execution will be handled by event listeners
    } catch (error) {
      console.error('Failed to execute playbook:', error);
      alert(`Failed to execute playbook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Approve execution
  const handleApproveExecution = async (executionId: string) => {
    try {
      await playbookService.approveExecution(executionId, 'current_user');
      setPendingApprovals(prev => prev.filter(e => e.id !== executionId));
    } catch (error) {
      console.error('Failed to approve execution:', error);
      alert(`Failed to approve execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Reject execution
  const handleRejectExecution = async (executionId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await playbookService.rejectExecution(executionId, 'current_user', reason || undefined);
      setPendingApprovals(prev => prev.filter(e => e.id !== executionId));
    } catch (error) {
      console.error('Failed to reject execution:', error);
      alert(`Failed to reject execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Cancel execution
  const handleCancelExecution = async (executionId: string) => {
    if (!confirm('Are you sure you want to cancel this execution?')) return;

    try {
      await playbookService.cancelExecution(executionId);
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      alert(`Failed to cancel execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Create template playbook
  const handleCreateTemplate = async (scenario: string) => {
    try {
      await playbookService.createTemplatePlaybook(scenario);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create template playbook:', error);
      alert(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'running':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      case 'pending':
      case 'approved':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'pending_approval':
        return <UserGroupIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <Cog6ToothIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading playbook manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`playbook-manager ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Playbook Manager</h2>
            <p className="text-gray-600">Create and manage automated remediation workflows</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              New Playbook
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'playbooks', label: 'Playbooks', count: playbooks.length },
            { id: 'executions', label: 'Executions', count: executions.length },
            { id: 'approvals', label: 'Pending Approvals', count: pendingApprovals.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  tab.id === 'approvals' ? 'bg-orange-100 text-orange-800' :
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Playbooks Tab */}
      {activeTab === 'playbooks' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {['incident_response', 'system_maintenance', 'performance_optimization', 'security_remediation'].map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === category
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getCategoryDisplayName(category)}
              </button>
            ))}
          </div>

          {/* Playbooks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaybooks.map(playbook => (
              <div
                key={playbook.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{playbook.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{playbook.description}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(playbook.priority)}`}>
                        {playbook.priority}
                      </span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {getCategoryDisplayName(playbook.category)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedPlaybook(playbook)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleExecutePlaybook(playbook.id)}
                      disabled={!playbook.is_active}
                      className="p-2 text-green-500 hover:text-green-700 transition-colors disabled:opacity-50"
                      title="Execute Playbook"
                    >
                      <PlaySolidIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{playbook.execution_count}</div>
                    <div className="text-xs text-gray-500">Executions</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {playbook.success_rate ? (playbook.success_rate * 100).toFixed(0) : 0}%
                    </div>
                    <div className="text-xs text-gray-500">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {playbook.average_execution_time_minutes?.toFixed(0) || 0}m
                    </div>
                    <div className="text-xs text-gray-500">Avg Time</div>
                  </div>
                </div>

                {/* Tags */}
                {playbook.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {playbook.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        #{tag}
                      </span>
                    ))}
                    {playbook.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{playbook.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{playbook.steps.length} steps</span>
                    <span>{playbook.estimated_duration_minutes}m estimated</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPlaybooks.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No playbooks found</h3>
              <p className="text-gray-600">Create your first playbook to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Executions Tab */}
      {activeTab === 'executions' && (
        <div className="space-y-4">
          {executions.map(execution => {
            const playbook = playbooks.find(p => p.id === execution.playbook_id);
            return (
              <div
                key={execution.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(execution.status)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {playbook?.name || 'Unknown Playbook'}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                        execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                        execution.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {execution.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Execution ID: {execution.id}
                    </p>
                    <div className="text-xs text-gray-500">
                      Started: {execution.started_at?.toLocaleString() || 'Not started'} |
                      Duration: {execution.total_duration_seconds ? `${(execution.total_duration_seconds / 60).toFixed(1)}m` : 'N/A'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedExecution(execution)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </button>
                    {execution.status === 'running' && (
                      <button
                        onClick={() => handleCancelExecution(execution.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {(execution.status === 'running' || execution.status === 'completed') && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{(execution.progress * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          execution.status === 'completed' ? 'bg-green-500' :
                          execution.status === 'running' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`}
                        style={{ width: `${execution.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Trigger Info */}
                <div className="text-sm text-gray-600">
                  <strong>Triggered by:</strong> {execution.triggered_by} |
                  <strong>Approved by:</strong> {execution.approved_by || 'Pending'}
                </div>
              </div>
            );
          })}

          {executions.length === 0 && (
            <div className="text-center py-12">
              <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No executions yet</h3>
              <p className="text-gray-600">Execute a playbook to see execution history</p>
            </div>
          )}
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {pendingApprovals.map(execution => {
            const playbook = playbooks.find(p => p.id === execution.playbook_id);
            return (
              <div
                key={execution.id}
                className="bg-white border border-orange-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <UserGroupIcon className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {playbook?.name || 'Unknown Playbook'}
                      </h3>
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                        Approval Required
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{playbook?.description}</p>
                    <div className="text-sm text-gray-500">
                      Requested by: {execution.triggered_by} |
                      Created: {execution.created_at.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectExecution(execution.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveExecution(execution.id)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>

                {/* Context */}
                {Object.keys(execution.context).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Execution Context</h4>
                    <div className="text-sm text-gray-600">
                      {Object.entries(execution.context).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {pendingApprovals.length === 0 && (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
              <p className="text-gray-600">All playbook executions have been reviewed</p>
            </div>
          )}
        </div>
      )}

      {/* Playbook Details Modal */}
      {selectedPlaybook && (
        <PlaybookDetailsModal
          playbook={selectedPlaybook}
          onClose={() => setSelectedPlaybook(null)}
          onExecute={() => handleExecutePlaybook(selectedPlaybook.id)}
        />
      )}

      {/* Execution Details Modal */}
      {selectedExecution && (
        <ExecutionDetailsModal
          execution={selectedExecution}
          playbook={playbooks.find(p => p.id === selectedExecution.playbook_id)}
          onClose={() => setSelectedExecution(null)}
        />
      )}

      {/* Create Playbook Dialog */}
      {showCreateDialog && (
        <CreatePlaybookDialog
          onClose={() => setShowCreateDialog(false)}
          onCreateTemplate={handleCreateTemplate}
        />
      )}
    </div>
  );
};

// Playbook Details Modal Component
const PlaybookDetailsModal: React.FC<{
  playbook: RemediationPlaybook;
  onClose: () => void;
  onExecute: () => void;
}> = ({ playbook, onClose, onExecute }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{playbook.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">{playbook.description}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{playbook.execution_count}</div>
              <div className="text-sm text-gray-500">Total Executions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {playbook.success_rate ? (playbook.success_rate * 100).toFixed(0) : 0}%
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {playbook.average_execution_time_minutes?.toFixed(0) || 0}
              </div>
              <div className="text-sm text-gray-500">Avg Time (min)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{playbook.steps.length}</div>
              <div className="text-sm text-gray-500">Steps</div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Execution Steps</h3>
            <div className="space-y-3">
              {playbook.steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{step.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Type: {step.type}</span>
                      <span>Timeout: {step.timeout_seconds}s</span>
                      {step.estimated_duration_seconds && (
                        <span>Est: {step.estimated_duration_seconds}s</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Checks */}
          {playbook.safety_checks.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" />
                Safety Checks
              </h3>
              <div className="space-y-2">
                {playbook.safety_checks.map(check => (
                  <div key={check.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-green-900">{check.name}</h4>
                      <p className="text-sm text-green-700">{check.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      check.fail_action === 'block' ? 'bg-red-100 text-red-800' :
                      check.fail_action === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {check.fail_action.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Triggers */}
          {playbook.triggers.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <BoltIcon className="h-5 w-5" />
                Triggers
              </h3>
              <div className="space-y-2">
                {playbook.triggers.map((trigger, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-900 capitalize">{trigger.type.replace('_', ' ')}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        trigger.auto_execute ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {trigger.auto_execute ? 'Auto' : 'Manual'}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Priority: {trigger.priority}/5 |
                      Approval Required: {trigger.require_approval ? 'Yes' : 'No'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onExecute}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlayIcon className="h-4 w-4" />
            Execute Playbook
          </button>
        </div>
      </div>
    </div>
  );
};

// Execution Details Modal Component
const ExecutionDetailsModal: React.FC<{
  execution: PlaybookExecution;
  playbook?: RemediationPlaybook;
  onClose: () => void;
}> = ({ execution, playbook, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Execution: {playbook?.name || execution.playbook_id}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">Execution ID: {execution.id}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Progress */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 capitalize">{execution.status}</div>
              <div className="text-sm text-gray-500">Status</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{(execution.progress * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Progress</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {execution.total_duration_seconds ? (execution.total_duration_seconds / 60).toFixed(1) : 0}
              </div>
              <div className="text-sm text-gray-500">Duration (min)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{execution.current_step || 'N/A'}</div>
              <div className="text-sm text-gray-500">Current Step</div>
            </div>
          </div>

          {/* Step Results */}
          {Object.keys(execution.step_results).length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Step Execution Details</h3>
              <div className="space-y-3">
                {Object.entries(execution.step_results).map(([stepId, result]) => (
                  <div key={stepId} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Step: {stepId}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          result.status === 'completed' ? 'bg-green-100 text-green-800' :
                          result.status === 'failed' ? 'bg-red-100 text-red-800' :
                          result.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.status}
                        </span>
                        {result.retry_count > 0 && (
                          <span className="text-xs text-gray-500">
                            Retry: {result.retry_count}
                          </span>
                        )}
                      </div>
                    </div>
                    {result.start_time && (
                      <div className="text-sm text-gray-600 mb-2">
                        Started: {result.start_time.toLocaleString()} |
                        Duration: {result.duration_seconds ? `${result.duration_seconds.toFixed(1)}s` : 'N/A'}
                      </div>
                    )}
                    {result.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Check Results */}
          {execution.safety_check_results.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Safety Check Results</h3>
              <div className="space-y-2">
                {execution.safety_check_results.map((result, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${result.passed ? 'text-green-900' : 'text-red-900'}`}>
                        {result.message}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Context Data */}
          {Object.keys(execution.context).length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Execution Context</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(execution.context, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Playbook Dialog Component
const CreatePlaybookDialog: React.FC<{
  onClose: () => void;
  onCreateTemplate: (scenario: string) => void;
}> = ({ onClose, onCreateTemplate }) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('');

  const scenarios = [
    {
      id: 'database_connection_issue',
      name: 'Database Connection Remediation',
      description: 'Automated remediation for database connection issues',
      category: 'incident_response'
    },
    {
      id: 'service_restart',
      name: 'Service Restart Automation',
      description: 'Automated service restart with health checks',
      category: 'system_maintenance'
    },
    {
      id: 'log_cleanup',
      name: 'Log File Cleanup',
      description: 'Automated log rotation and cleanup',
      category: 'system_maintenance'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create New Playbook</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">Choose a template to get started quickly</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map(scenario => (
              <div
                key={scenario.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedScenario === scenario.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedScenario(scenario.id)}
              >
                <h3 className="font-medium text-gray-900 mb-2">{scenario.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  {scenario.category.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedScenario) {
                onCreateTemplate(selectedScenario);
              }
            }}
            disabled={!selectedScenario}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Create Playbook
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaybookManager;
