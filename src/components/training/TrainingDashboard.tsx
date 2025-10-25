/**
 * Training Dashboard Component
 * 
 * UI for managing NeuroWeaver training jobs and monitoring progress
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  neuroWeaverIntegration,
  TrainingJob,
  TrainingConfig,
  ModelMetrics,
  TrainingPipelineOrchestration
} from '../../services/neuroWeaverIntegration';
import {
  PlayIcon,
  StopIcon,
  EyeIcon,
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentChartBarIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

interface TrainingDashboardProps {
  workflowId?: string;
  agentId?: string;
  onJobComplete?: (job: TrainingJob) => void;
  className?: string;
}

export const TrainingDashboard: React.FC<TrainingDashboardProps> = ({
  workflowId,
  agentId,
  onJobComplete,
  className = ''
}) => {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<TrainingPipelineOrchestration | null>(null);

  // Load training jobs
  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      try {
        const filter = workflowId ? { workflow_id: workflowId } : agentId ? { agent_id: agentId } : {};
        const allJobs = await neuroWeaverIntegration.getTrainingJobs(filter);
        setJobs(allJobs);
      } catch (error) {
        console.error('Failed to load training jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [workflowId, agentId]);

  // Listen for job updates
  useEffect(() => {
    const handleJobProgress = ({ jobId, progress, status }: any) => {
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, progress, status } : job
      ));
    };

    const handleJobCompleted = (job: TrainingJob) => {
      setJobs(prev => prev.map(j => j.id === job.id ? job : j));
      if (onJobComplete) {
        onJobComplete(job);
      }
    };

    const handleJobFailed = ({ job }: any) => {
      setJobs(prev => prev.map(j => j.id === job.id ? job : j));
    };

    neuroWeaverIntegration.on('job:progress', handleJobProgress);
    neuroWeaverIntegration.on('job:completed', handleJobCompleted);
    neuroWeaverIntegration.on('job:failed', handleJobFailed);

    return () => {
      neuroWeaverIntegration.off('job:progress', handleJobProgress);
      neuroWeaverIntegration.off('job:completed', handleJobCompleted);
      neuroWeaverIntegration.off('job:failed', handleJobFailed);
    };
  }, [onJobComplete]);

  // Load pipeline status for selected job
  useEffect(() => {
    if (selectedJob && selectedJob.status === 'training') {
      const loadPipelineStatus = async () => {
        try {
          const status = await neuroWeaverIntegration.getPipelineOrchestration(selectedJob.id);
          setPipelineStatus(status);
        } catch (error) {
          console.error('Failed to load pipeline status:', error);
        }
      };

      loadPipelineStatus();
      const interval = setInterval(loadPipelineStatus, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    } else {
      setPipelineStatus(null);
    }
  }, [selectedJob]);

  // Create new training job
  const handleCreateJob = async (config: {
    name: string;
    description: string;
    type: 'workflow' | 'agent' | 'triage';
    optimizationTarget: 'performance' | 'cost' | 'reliability' | 'user_satisfaction';
  }) => {
    try {
      let job: TrainingJob;

      switch (config.type) {
        case 'workflow':
          if (!workflowId) throw new Error('Workflow ID required for workflow optimization');
          job = await neuroWeaverIntegration.trainWorkflowOptimizationModel(workflowId, config.optimizationTarget);
          break;

        case 'agent':
          if (!agentId) throw new Error('Agent ID required for agent optimization');
          job = await neuroWeaverIntegration.trainAgentOptimizationModel(agentId);
          break;

        case 'triage':
          // For demo purposes, use a default tenant ID
          job = await neuroWeaverIntegration.trainTriageOptimizationModel('tenant_demo');
          break;

        default:
          throw new Error('Invalid training type');
      }

      // Start the training job
      await neuroWeaverIntegration.startTraining(job.id);
      
      setJobs(prev => [job, ...prev]);
      setShowCreateDialog(false);

    } catch (error) {
      console.error('Failed to create training job:', error);
      alert(`Failed to create training job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Start training job
  const handleStartJob = async (jobId: string) => {
    try {
      await neuroWeaverIntegration.startTraining(jobId);
    } catch (error) {
      console.error('Failed to start training job:', error);
      alert(`Failed to start training job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Cancel training job
  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this training job?')) return;

    try {
      await neuroWeaverIntegration.cancelTrainingJob(jobId);
    } catch (error) {
      console.error('Failed to cancel training job:', error);
      alert(`Failed to cancel training job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Deploy model
  const handleDeployModel = async (job: TrainingJob) => {
    try {
      const deployment = await neuroWeaverIntegration.deployModel(job.id);
      alert(`Model deployed successfully!\nDeployment ID: ${deployment.deployment_id}\nEndpoint: ${deployment.endpoint_url}`);
    } catch (error) {
      console.error('Failed to deploy model:', error);
      alert(`Failed to deploy model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'training':
      case 'preparing':
      case 'validating':
      case 'testing':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <CpuChipIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'training':
      case 'preparing':
      case 'validating':
      case 'testing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Format duration
  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const duration = end.getTime() - startTime.getTime();
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  // Render metrics
  const renderMetrics = (metrics: ModelMetrics) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{(metrics.accuracy * 100).toFixed(1)}%</div>
        <div className="text-sm text-gray-500">Accuracy</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{(metrics.f1_score * 100).toFixed(1)}%</div>
        <div className="text-sm text-gray-500">F1 Score</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{metrics.training_time.toFixed(1)}s</div>
        <div className="text-sm text-gray-500">Training Time</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{metrics.model_size_mb.toFixed(1)}MB</div>
        <div className="text-sm text-gray-500">Model Size</div>
      </div>
    </div>
  );

  // Render pipeline status
  const renderPipelineStatus = (pipeline: TrainingPipelineOrchestration) => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Training Pipeline Progress</h4>
      
      {Object.entries(pipeline.stages).map(([stageName, stage]) => (
        <div key={stageName} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {stageName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stage.status)}`}>
              {stage.status}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                stage.status === 'completed' ? 'bg-green-500' :
                stage.status === 'running' ? 'bg-blue-500' :
                stage.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
              }`}
              style={{ width: `${stage.progress * 100}%` }}
            />
          </div>

          {stageName === 'model_training' && 'current_epoch' in stage && (
            <div className="text-xs text-gray-500">
              Epoch {stage.current_epoch} / {stage.total_epochs} | Loss: {stage.current_loss?.toFixed(4)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading training jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`training-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">NeuroWeaver Training</h2>
            <p className="text-gray-600">Manage AI model training and optimization</p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CpuChipIcon className="h-5 w-5" />
            New Training Job
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
                <div className="text-sm text-gray-500">Total Jobs</div>
              </div>
              <DocumentChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {jobs.filter(j => j.status === 'training' || j.status === 'preparing').length}
                </div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <ArrowPathIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {jobs.filter(j => j.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {jobs.filter(j => j.metrics?.accuracy).length > 0 
                    ? (jobs.filter(j => j.metrics?.accuracy).reduce((acc, j) => acc + j.metrics!.accuracy, 0) / jobs.filter(j => j.metrics?.accuracy).length * 100).toFixed(1) + '%'
                    : 'N/A'
                  }
                </div>
                <div className="text-sm text-gray-500">Avg Accuracy</div>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Training Jobs</h3>
          
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CpuChipIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No training jobs yet</p>
              <p className="text-sm">Create a new training job to get started</p>
            </div>
          ) : (
            jobs.map(job => (
              <div
                key={job.id}
                className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedJob?.id === job.id ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{job.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {(job.status === 'training' || job.status === 'preparing') && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{(job.progress * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Metrics Preview */}
                {job.metrics && (
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
                    <div>Accuracy: {(job.metrics.accuracy * 100).toFixed(1)}%</div>
                    <div>F1: {(job.metrics.f1_score * 100).toFixed(1)}%</div>
                    <div>Size: {job.metrics.model_size_mb.toFixed(1)}MB</div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {job.started_at ? formatDuration(job.started_at, job.completed_at) : 'Not started'}
                  </div>
                  <div className="flex gap-2">
                    {job.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartJob(job.id);
                        }}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        Start
                      </button>
                    )}
                    {(job.status === 'training' || job.status === 'preparing') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelJob(job.id);
                        }}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {job.status === 'completed' && job.model_path && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeployModel(job);
                        }}
                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                      >
                        <RocketLaunchIcon className="h-3 w-3" />
                        Deploy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Job Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
          
          {selectedJob ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">{selectedJob.name}</h4>
                <p className="text-gray-600 mb-4">{selectedJob.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedJob.status)}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Model Type:</span>
                    <span className="ml-2 text-gray-600">{selectedJob.config.model_type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-600">{selectedJob.created_at.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Progress:</span>
                    <span className="ml-2 text-gray-600">{(selectedJob.progress * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Pipeline Status */}
              {pipelineStatus && (
                <div className="mb-6">
                  {renderPipelineStatus(pipelineStatus)}
                </div>
              )}

              {/* Metrics */}
              {selectedJob.metrics && (
                <div className="mb-6">
                  <h5 className="font-medium text-gray-900 mb-4">Model Metrics</h5>
                  {renderMetrics(selectedJob.metrics)}
                </div>
              )}

              {/* Configuration */}
              <div>
                <h5 className="font-medium text-gray-900 mb-4">Configuration</h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(selectedJob.config, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Error Message */}
              {selectedJob.error_message && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h5 className="font-medium text-red-900 mb-2">Error</h5>
                  <p className="text-red-700 text-sm">{selectedJob.error_message}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              <EyeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a training job to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Job Dialog */}
      {showCreateDialog && (
        <CreateTrainingJobDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateJob}
          workflowId={workflowId}
          agentId={agentId}
        />
      )}
    </div>
  );
};

// Create Training Job Dialog Component
const CreateTrainingJobDialog: React.FC<{
  onClose: () => void;
  onCreate: (config: {
    name: string;
    description: string;
    type: 'workflow' | 'agent' | 'triage';
    optimizationTarget: 'performance' | 'cost' | 'reliability' | 'user_satisfaction';
  }) => void;
  workflowId?: string;
  agentId?: string;
}> = ({ onClose, onCreate, workflowId, agentId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'workflow' | 'agent' | 'triage'>('workflow');
  const [optimizationTarget, setOptimizationTarget] = useState<'performance' | 'cost' | 'reliability' | 'user_satisfaction'>('performance');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    onCreate({ name, description, type, optimizationTarget });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Training Job</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter job name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter job description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Training Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {workflowId && <option value="workflow">Workflow Optimization</option>}
              {agentId && <option value="agent">Agent Optimization</option>}
              <option value="triage">Triage Optimization</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Optimization Target</label>
            <select
              value={optimizationTarget}
              onChange={(e) => setOptimizationTarget(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="performance">Performance</option>
              <option value="cost">Cost</option>
              <option value="reliability">Reliability</option>
              <option value="user_satisfaction">User Satisfaction</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainingDashboard;
