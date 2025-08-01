import React, { useState, useEffect } from 'react';
import { WorkflowExecution } from '../types/workflow';
import { getExecution, getExecutionLogs, executeWorkflow } from '../api/workflows';
import { useError } from '../contexts/ErrorContext';
import { ErrorCategory, ErrorSeverity } from '../types/error';
import { createAppError } from '../utils/errorUtils';

interface WorkflowErrorDisplayProps {
  executionId: string;
  workflowId?: string;
  onRetrySuccess?: (newExecutionId: string) => void;
  onClose?: () => void;
  className?: string;
}

interface ExecutionLog {
  id: string;
  step_name: string;
  step_type: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  duration_ms: number;
  timestamp: string;
  error_message?: string;
}

interface ErrorReport {
  userFeedback: string;
  reproductionSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
}

const WorkflowErrorDisplay: React.FC<WorkflowErrorDisplayProps> = ({
  executionId,
  workflowId,
  onRetrySuccess,
  onClose,
  className = ''
}) => {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRetryForm, setShowRetryForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [retryInputs, setRetryInputs] = useState<Record<string, unknown>>({});
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorReport, setErrorReport] = useState<ErrorReport>({
    userFeedback: '',
    reproductionSteps: '',
    expectedBehavior: '',
    actualBehavior: ''
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const { addError, reportError } = useError();

  useEffect(() => {
    const fetchExecutionData = async () => {
      try {
        setLoading(true);
        const executionData = await getExecution(executionId);
        setExecution(executionData);
        setRetryInputs(executionData.inputData || {});

        // Fetch execution logs for detailed error analysis
        try {
          const logsData = await getExecutionLogs(executionId);
          const transformedLogs: ExecutionLog[] = logsData.map(entry => ({
            id: entry.id,
            step_name: entry.stepName || 'Unknown Step',
            step_type: entry.level || 'info',
            input_data: entry.data || {},
            output_data: entry.data || {},
            duration_ms: entry.duration || 0,
            timestamp: entry.timestamp,
            error_message: entry.level === 'error' ? entry.message : undefined
          }));
          setLogs(transformedLogs);
        } catch (logError) {
          console.warn('Failed to fetch execution logs:', logError);
        }
      } catch (error) {
        addError('Failed to load execution details', {
          executionId,
          component: 'WorkflowErrorDisplay'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExecutionData();
  }, [executionId, addError]);

  const categorizeError = (errorMessage: string, logs: ExecutionLog[]): ErrorCategory => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('validation') || message.includes('invalid input') || message.includes('required field')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('ai service') || message.includes('openai') || message.includes('gpt')) {
      return ErrorCategory.AI_SERVICE;
    }
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('database') || message.includes('sql')) {
      return ErrorCategory.DATABASE;
    }
    if (message.includes('authentication') || message.includes('unauthorized')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }
    
    // Check logs for more context
    const hasAiErrors = logs.some(log => 
      log.error_message?.toLowerCase().includes('ai') || 
      log.step_type === 'ai_process'
    );
    if (hasAiErrors) return ErrorCategory.AI_SERVICE;
    
    return ErrorCategory.WORKFLOW;
  };

  const getErrorSeverity = (category: ErrorCategory, errorMessage: string): ErrorSeverity => {
    if (errorMessage.toLowerCase().includes('critical') || errorMessage.toLowerCase().includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.DATABASE:
        return ErrorSeverity.HIGH;
      case ErrorCategory.AI_SERVICE:
      case ErrorCategory.NETWORK:
      case ErrorCategory.WORKFLOW:
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.LOW;
    }
  };

  const getFailurePoint = (logs: ExecutionLog[]): { stepName: string; stepIndex: number } | null => {
    const errorLog = logs.find(log => log.error_message);
    if (errorLog) {
      const stepIndex = logs.findIndex(log => log.id === errorLog.id);
      return {
        stepName: errorLog.step_name,
        stepIndex: stepIndex + 1
      };
    }
    return null;
  };

  const handleRetry = async () => {
    if (!execution || !workflowId) return;

    setIsRetrying(true);
    try {
      const newExecution = await executeWorkflow(workflowId, retryInputs);
      setShowRetryForm(false);
      if (onRetrySuccess) {
        onRetrySuccess(newExecution.id);
      }
    } catch (error) {
      addError('Failed to retry workflow execution', {
        workflowId,
        executionId,
        component: 'WorkflowErrorDisplay'
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!execution) return;

    setIsSubmittingReport(true);
    try {
      const appError = createAppError(
        'WORKFLOW_EXECUTION_FAILED',
        execution.errorMessage || 'Workflow execution failed',
        {
          workflowId,
          executionId,
          component: 'WorkflowErrorDisplay'
        },
        JSON.stringify({ logs, execution }),
        undefined,
        execution.id
      );

      await reportError({
        error: appError,
        userFeedback: errorReport.userFeedback,
        reproductionSteps: errorReport.reproductionSteps,
        expectedBehavior: errorReport.expectedBehavior,
        actualBehavior: errorReport.actualBehavior
      });

      setShowReportForm(false);
      setErrorReport({
        userFeedback: '',
        reproductionSteps: '',
        expectedBehavior: '',
        actualBehavior: ''
      });

      addError('Error report submitted successfully', {}, false);
    } catch (error) {
      addError('Failed to submit error report', {
        executionId,
        component: 'WorkflowErrorDisplay'
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400 animate-spin mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-gray-600">Loading error details...</span>
        </div>
      </div>
    );
  }

  if (!execution || execution.status !== 'failed') {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-600">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No error information available</p>
        </div>
      </div>
    );
  }

  const errorCategory = categorizeError(execution.errorMessage || '', logs);
  const errorSeverity = getErrorSeverity(errorCategory, execution.errorMessage || '');
  const failurePoint = getFailurePoint(logs);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Workflow Execution Failed</h2>
              <p className="text-sm text-gray-600">Execution ID: {executionId}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          {workflowId && (
            <button
              onClick={() => setShowRetryForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry Execution
            </button>
          )}
          <button
            onClick={() => setShowReportForm(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Report Issue
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Error Overview */}
        <div>
          <button
            onClick={() => toggleSection('overview')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Error Overview
            </h3>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has('overview') ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSections.has('overview') && (
            <div className="mt-4 space-y-4">
              {/* Error Categorization */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800">Category</h4>
                  <p className="text-red-700 capitalize">{errorCategory.replace('_', ' ')}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800">Severity</h4>
                  <p className="text-orange-700 capitalize">{errorSeverity}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800">Failure Point</h4>
                  <p className="text-yellow-700">
                    {failurePoint ? `Step ${failurePoint.stepIndex}: ${failurePoint.stepName}` : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Error Message</h4>
                <p className="text-red-700 font-mono text-sm whitespace-pre-wrap">
                  {execution.errorMessage || 'No error message available'}
                </p>
              </div>

              {/* Execution Timeline */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Execution Timeline</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Started:</strong> {formatTimestamp(execution.startedAt)}</p>
                  {execution.completedAt && (
                    <p><strong>Failed:</strong> {formatTimestamp(execution.completedAt)}</p>
                  )}
                  {execution.duration && (
                    <p><strong>Duration:</strong> {formatDuration(execution.duration)}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Logs */}
        {logs.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('logs')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Execution Logs ({logs.length} steps)
              </h3>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has('logs') ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections.has('logs') && (
              <div className="mt-4 space-y-3">
                {logs.map((log, index) => (
                  <div 
                    key={log.id} 
                    className={`border rounded-lg p-4 ${
                      log.error_message 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3
                          ${log.error_message 
                            ? 'bg-red-200 text-red-800' 
                            : 'bg-blue-200 text-blue-800'
                          }
                        `}>
                          {index + 1}
                        </span>
                        <h4 className="font-medium text-gray-900">{log.step_name}</h4>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(log.timestamp)} • {formatDuration(log.duration_ms)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 capitalize">
                      {log.step_type.replace('_', ' ')}
                    </p>

                    {log.error_message && (
                      <div className="bg-red-100 border border-red-200 rounded p-3 mb-3">
                        <p className="text-red-800 font-medium text-sm">Error:</p>
                        <p className="text-red-700 text-sm font-mono mt-1">{log.error_message}</p>
                      </div>
                    )}

                    {/* Input/Output Data */}
                    {(Object.keys(log.input_data).length > 0 || Object.keys(log.output_data).length > 0) && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                          View Step Data
                        </summary>
                        <div className="mt-2 space-y-2">
                          {Object.keys(log.input_data).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700">Input:</p>
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.input_data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {Object.keys(log.output_data).length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-700">Output:</p>
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.output_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stack Trace */}
        {execution.errorMessage && (
          <div>
            <button
              onClick={() => toggleSection('stack')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Technical Details
              </h3>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has('stack') ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections.has('stack') && (
              <div className="mt-4">
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {execution.errorMessage}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Retry Form Modal */}
      {showRetryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Retry Workflow Execution</h3>
              <button
                onClick={() => setShowRetryForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              You can modify the input parameters before retrying the workflow execution.
            </p>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Input Parameters (JSON)</span>
                <textarea
                  value={JSON.stringify(retryInputs, null, 2)}
                  onChange={(e) => {
                    try {
                      setRetryInputs(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, keep the text as is for user to fix
                    }
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3 font-mono text-sm"
                  rows={10}
                  placeholder="Enter input parameters as JSON..."
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRetryForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isRetrying && (
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {isRetrying ? 'Retrying...' : 'Retry Execution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Report Error</h3>
              <button
                onClick={() => setShowReportForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Help us improve by providing details about this error. Your feedback will be used to prevent similar issues.
            </p>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">What were you trying to do?</span>
                <textarea
                  value={errorReport.userFeedback}
                  onChange={(e) => setErrorReport(prev => ({ ...prev, userFeedback: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                  rows={3}
                  placeholder="Describe what you were trying to accomplish..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Steps to reproduce</span>
                <textarea
                  value={errorReport.reproductionSteps}
                  onChange={(e) => setErrorReport(prev => ({ ...prev, reproductionSteps: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                  rows={3}
                  placeholder="1. First I did...\n2. Then I clicked...\n3. The error occurred when..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">What did you expect to happen?</span>
                <textarea
                  value={errorReport.expectedBehavior}
                  onChange={(e) => setErrorReport(prev => ({ ...prev, expectedBehavior: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                  rows={2}
                  placeholder="I expected the workflow to..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">What actually happened?</span>
                <textarea
                  value={errorReport.actualBehavior}
                  onChange={(e) => setErrorReport(prev => ({ ...prev, actualBehavior: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-lg p-3"
                  rows={2}
                  placeholder="Instead, the workflow..."
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowReportForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isSubmittingReport || !errorReport.userFeedback.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {isSubmittingReport && (
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowErrorDisplay;