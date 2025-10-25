import React, { useState } from 'react';

interface TestResult {
  nodeId: string;
  stepName: string;
  status: 'success' | 'error' | 'warning';
  executionTime: number;
  output?: any;
  error?: string;
  timestamp: Date;
}

interface PerformanceMetrics {
  totalExecutionTime: number;
  averageStepTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
}

interface TestExecution {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentNode?: string;
  results: TestResult[];
  performance: PerformanceMetrics;
}

interface TestResultsPanelProps {
  execution: TestExecution | null;
  isVisible: boolean;
  onClose: () => void;
}

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({
  execution,
  isVisible,
  onClose
}) => {
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'warning'>('all');

  if (!isVisible) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  const filteredResults = execution?.results.filter(result => {
    if (filter === 'all') return true;
    return result.status === filter;
  }) || [];

  const successCount = execution?.results.filter(r => r.status === 'success').length || 0;
  const errorCount = execution?.results.filter(r => r.status === 'error').length || 0;
  const warningCount = execution?.results.filter(r => r.status === 'warning').length || 0;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!execution ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm">No test results available</p>
            <p className="text-xs">Run a test to see results here</p>
          </div>
        </div>
      ) : (
        <>
          {/* Status Overview */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                  execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {execution.status.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600">
                  {execution.results.length} steps
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatTimestamp(execution.startTime)}
              </span>
            </div>

            {/* Status Counts */}
            <div className="flex space-x-4 mb-3">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{successCount} success</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{errorCount} errors</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{warningCount} warnings</span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600">Total Time</div>
                <div className="font-medium">{formatTime(execution.performance.totalExecutionTime)}</div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600">Avg Step Time</div>
                <div className="font-medium">{formatTime(execution.performance.averageStepTime)}</div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              {(['all', 'success', 'error', 'warning'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 text-xs rounded-full ${
                    filter === filterType
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterType === 'all' ? 'All' : filterType}
                  {filterType !== 'all' && (
                    <span className="ml-1">
                      ({execution.results.filter(r => r.status === filterType).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto">
            {filteredResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No results match the current filter</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredResults.map((result, index) => (
                  <div
                    key={`${result.nodeId}-${index}`}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedResult?.nodeId === result.nodeId ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-1 rounded-full ${getStatusColor(result.status)}`}>
                        {getStatusIcon(result.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {result.stepName}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(result.executionTime)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          Node: {result.nodeId}
                        </p>
                        {result.error && (
                          <p className="text-xs text-red-600 mt-1 truncate">
                            {result.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Result View */}
          {selectedResult && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Step Details</h4>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Step Name</label>
                  <p className="text-sm text-gray-900">{selectedResult.stepName}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Node ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedResult.nodeId}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Execution Time</label>
                  <p className="text-sm text-gray-900">{formatTime(selectedResult.executionTime)}</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedResult.status)}`}>
                    {selectedResult.status.toUpperCase()}
                  </span>
                </div>

                {selectedResult.output && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">Output</label>
                    <pre className="text-xs bg-white p-2 rounded border max-h-32 overflow-y-auto font-mono">
                      {typeof selectedResult.output === 'string'
                        ? selectedResult.output
                        : JSON.stringify(selectedResult.output, null, 2)
                      }
                    </pre>
                  </div>
                )}

                {selectedResult.error && (
                  <div>
                    <label className="text-xs font-medium text-gray-600">Error</label>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {selectedResult.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};


