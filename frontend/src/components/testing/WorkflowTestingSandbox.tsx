import React, { useCallback, useState } from 'react';
import { WorkflowDefinition } from '../../types/workflow';
import { TestResultsPanel } from './TestResultsPanel';

interface MockData {
  [key: string]: any;
}

interface TestExecutionResult {
  success: boolean;
  executionTime: number;
  logs: string[];
  metrics: {
    nodesExecuted: number;
    errors: number;
    warnings: number;
  };
  output: any;
}

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

interface WorkflowTestingSandboxProps {
  workflow: WorkflowDefinition;
  onTestComplete?: (result: TestExecutionResult) => void;
}

export const WorkflowTestingSandbox: React.FC<WorkflowTestingSandboxProps> = ({
  workflow,
  onTestComplete
}) => {
  const [mockData, setMockData] = useState<MockData>({});
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<TestExecutionResult | null>(null);
  const [isResultsVisible, setIsResultsVisible] = useState(false);

  const handleMockDataChange = useCallback((key: string, value: any) => {
    setMockData(prev => ({ ...prev, [key]: value }));
  }, []);

  const runTest = useCallback(async () => {
    setIsRunning(true);
    setTestResult(null);
    setIsResultsVisible(false);

    try {
      // Simulate workflow execution with mock data
      const startTime = Date.now();

      // Mock execution logic - replace with actual API call
      const result: TestExecutionResult = {
        success: Math.random() > 0.2, // 80% success rate for demo
        executionTime: Date.now() - startTime,
        logs: [
          'Starting workflow execution...',
          'Processing node: Start',
          'Executing AI Process node...',
          'Workflow completed successfully'
        ],
        metrics: {
          nodesExecuted: workflow.steps.length,
          errors: Math.floor(Math.random() * 3),
          warnings: Math.floor(Math.random() * 5)
        },
        output: { result: 'Mock output data', mockData }
      };

      setTestResult(result);
      setIsResultsVisible(true);
      onTestComplete?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResult: TestExecutionResult = {
        success: false,
        executionTime: 0,
        logs: ['Error during execution: ' + errorMessage],
        metrics: { nodesExecuted: 0, errors: 1, warnings: 0 },
        output: null
      };
      setTestResult(errorResult);
      setIsResultsVisible(true);
      onTestComplete?.(errorResult);
    } finally {
      setIsRunning(false);
    }
  }, [workflow, mockData, onTestComplete]);

  // Convert TestExecutionResult to TestExecution for TestResultsPanel
  const convertToTestExecution = (result: TestExecutionResult): TestExecution => {
    const startTime = new Date(Date.now() - result.executionTime);
    const endTime = new Date();

    return {
      id: `test-${Date.now()}`,
      startTime,
      endTime,
      status: result.success ? 'completed' : 'failed',
      results: result.logs.map((log, index) => ({
        nodeId: `node-${index}`,
        stepName: `Step ${index + 1}`,
        status: result.success ? 'success' : 'error' as 'success' | 'error' | 'warning',
        executionTime: result.executionTime / result.logs.length,
        output: result.output,
        error: !result.success ? log : undefined,
        timestamp: new Date(startTime.getTime() + (index * (result.executionTime / result.logs.length)))
      })),
      performance: {
        totalExecutionTime: result.executionTime,
        averageStepTime: result.executionTime / result.logs.length,
        memoryUsage: Math.random() * 100,
        cpuUsage: Math.random() * 100,
        networkRequests: Math.floor(Math.random() * 10)
      }
    };
  };

  return (
    <div className="workflow-testing-sandbox bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Workflow Testing Sandbox</h3>

      {/* Mock Data Input */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-2">Mock Input Data</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input Key
            </label>
            <input
              type="text"
              placeholder="e.g., customerName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleMockDataChange('key', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value
            </label>
            <input
              type="text"
              placeholder="e.g., John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleMockDataChange('value', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Run Test Button */}
      <div className="mb-6">
        <button
          onClick={runTest}
          disabled={isRunning}
          className={`px-4 py-2 rounded-md font-medium ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? 'Running Test...' : 'Run Test'}
        </button>
      </div>

      {/* Test Results */}
      {testResult && (
        <TestResultsPanel
          execution={convertToTestExecution(testResult)}
          isVisible={isResultsVisible}
          onClose={() => setIsResultsVisible(false)}
        />
      )}
    </div>
  );
};


