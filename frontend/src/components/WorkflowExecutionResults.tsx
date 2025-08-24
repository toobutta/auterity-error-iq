import React, { useState, useEffect } from 'react';
import { WorkflowExecution } from '../types/workflow';
import { getExecution } from '../api/workflows';
import WorkflowErrorDisplay from './WorkflowErrorDisplay';
import LazyCodeHighlighter from './LazyCodeHighlighter';

interface WorkflowExecutionResultsProps {
  executionId: string;
  workflowId?: string;
  onRetrySuccess?: (newExecutionId: string) => void;
  className?: string;
}

const WorkflowExecutionResults: React.FC<WorkflowExecutionResultsProps> = ({
  executionId,
  workflowId,
  onRetrySuccess,
  className = '',
}) => {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExecution = async () => {
      try {
        setLoading(true);
        setError(null);
        const executionData = await getExecution(executionId);
        setExecution(executionData);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        const errorContext = {
          operation: 'fetchExecution',
          executionId,
          timestamp: new Date().toISOString(),
          errorType: err instanceof Error ? err.constructor.name : 'UnknownError',
          errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
        };
        console.error('Execution fetch failed:', errorContext);
        setError(`Failed to fetch execution results: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (executionId) {
      fetchExecution();
    }
  }, [executionId]);
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      return String(value);
    }
    return JSON.stringify(value, null, 2);
  };

  const getValueType = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const copyToClipboard = async () => {
    if (!execution?.outputData) return;

    try {
      await navigator.clipboard.writeText(formatValue(execution.outputData));
      console.log('Clipboard operation successful', {
        operation: 'copyToClipboard',
        timestamp: new Date().toISOString(),
        dataLength: formatValue(execution.outputData).length,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown clipboard error';
      const errorContext = {
        operation: 'copyToClipboard',
        timestamp: new Date().toISOString(),
        hasOutputData: !!execution?.outputData,
        errorMessage,
        errorType: err instanceof Error ? err.constructor.name : 'UnknownError',
      };
      console.error('Clipboard operation failed:', errorContext);
      // Could add user notification here if needed
    }
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <svg
            className="w-6 h-6 text-gray-400 animate-spin mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="text-gray-600">Loading execution results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-red-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-red-800 font-medium">Error Loading Results</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-600">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>No execution found</p>
        </div>
      </div>
    );
  }

  const hasOutputData = execution.outputData && Object.keys(execution.outputData).length > 0;
  const hasInputData = execution.inputData && Object.keys(execution.inputData).length > 0;

  // Show comprehensive error display for failed executions
  if (execution.status === 'failed') {
    return (
      <WorkflowErrorDisplay
        executionId={executionId}
        workflowId={workflowId}
        onRetrySuccess={onRetrySuccess}
        className={className}
      />
    );
  }

  // Handle pending and running states
  if (execution.status === 'pending' || execution.status === 'running') {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Execution Results</h3>
            <span
              className={`
              px-3 py-1 rounded-full text-sm font-medium capitalize
              ${
                execution.status === 'running'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            `}
            >
              {execution.status}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Execution ID:</span>
              <p className="font-mono text-gray-900 break-all">{execution.id}</p>
            </div>
            <div>
              <span className="text-gray-500">Started:</span>
              <p className="text-gray-900">{formatDateTime(execution.startedAt)}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>
              {execution.status === 'pending' || execution.status === 'running'
                ? 'Output data will appear here when execution completes'
                : 'No output data available'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header with Execution Metadata */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Execution Results</h3>
          <span
            className={`
            px-3 py-1 rounded-full text-sm font-medium capitalize
            ${
              execution.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }
          `}
          >
            {execution.status}
          </span>
        </div>

        {/* Execution Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Execution ID:</span>
            <p className="font-mono text-gray-900 break-all">{execution.id}</p>
          </div>
          <div>
            <span className="text-gray-500">Started:</span>
            <p className="text-gray-900">{formatDateTime(execution.startedAt)}</p>
          </div>
          {execution.completedAt && (
            <div>
              <span className="text-gray-500">Completed:</span>
              <p className="text-gray-900">{formatDateTime(execution.completedAt)}</p>
            </div>
          )}
          {execution.duration && (
            <div>
              <span className="text-gray-500">Duration:</span>
              <p className="text-gray-900">{formatDuration(execution.duration)}</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {execution.errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-red-800 font-medium">Execution Failed</p>
                <p className="text-red-700 mt-1">{execution.errorMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Content */}
      <div className="p-6 space-y-6">
        {/* Output Data Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Output Data
            </h4>
            {hasOutputData && (
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M16 18h2a2 2 0 002-2v-2m-2 0v-2m-2 0V7m-2 5v2m-2 0v2"
                  />
                </svg>
                Copy Output
              </button>
            )}
          </div>

          {hasOutputData ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="overflow-x-auto">
                <LazyCodeHighlighter
                  language={getValueType(execution.outputData) === 'string' ? 'text' : 'json'}
                  className="rounded"
                >
                  {formatValue(execution.outputData)}
                </LazyCodeHighlighter>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>No output data available</p>
            </div>
          )}
        </div>

        {/* Input Data Section */}
        {hasInputData && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              Input Data
            </h4>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="overflow-x-auto">
                <LazyCodeHighlighter language="json" className="rounded">
                  {formatValue(execution.inputData)}
                </LazyCodeHighlighter>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowExecutionResults;
