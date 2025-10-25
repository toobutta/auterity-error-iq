import { useState, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { NodeData, WorkflowStep } from '../../types/workflow';

interface TestExecution {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentNode?: string;
  results: TestResult[];
  performance: PerformanceMetrics;
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

interface MockData {
  [key: string]: any;
}

interface UseWorkflowTestingProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onTestComplete?: (results: TestExecution) => void;
  onTestError?: (error: string) => void;
}

export const useWorkflowTesting = ({
  nodes,
  edges,
  onTestComplete,
  onTestError
}: UseWorkflowTestingProps) => {
  const [isTesting, setIsTesting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<TestExecution | null>(null);
  const [mockData, setMockData] = useState<MockData>({});
  const [testHistory, setTestHistory] = useState<TestExecution[]>([]);
  const executionRef = useRef<TestExecution | null>(null);

  // Start workflow testing
  const startTesting = useCallback(async () => {
    if (isTesting) return;

    setIsTesting(true);

    const execution: TestExecution = {
      id: `test-${Date.now()}`,
      startTime: new Date(),
      status: 'running',
      results: [],
      performance: {
        totalExecutionTime: 0,
        averageStepTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkRequests: 0
      }
    };

    executionRef.current = execution;
    setCurrentExecution(execution);

    try {
      await executeWorkflowTest(execution);
    } catch (error) {

      onTestError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsTesting(false);
    }
  }, [isTesting, nodes, edges, mockData, onTestComplete, onTestError]);

  // Execute workflow in test mode
  const executeWorkflowTest = useCallback(async (execution: TestExecution) => {
    const startTime = performance.now();
    let currentData = { ...mockData };

    // Find start node
    const startNode = nodes.find(node => node.data.type === 'start');
    if (!startNode) {
      throw new Error('No start node found in workflow');
    }

    // Execute nodes in topological order
    const executedNodes = new Set<string>();
    const nodeQueue = [startNode.id];

    while (nodeQueue.length > 0) {
      const nodeId = nodeQueue.shift()!;
      if (executedNodes.has(nodeId)) continue;

      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      execution.currentNode = nodeId;

      try {
        const stepStartTime = performance.now();

        // Execute node logic
        const result = await executeNodeTest(node, currentData);

        const stepEndTime = performance.now();
        const executionTime = stepEndTime - stepStartTime;

        // Record result
        const testResult: TestResult = {
          nodeId,
          stepName: node.data.label,
          status: result.success ? 'success' : 'error',
          executionTime,
          output: result.output,
          error: result.error,
          timestamp: new Date()
        };

        execution.results.push(testResult);

        // Update current data with output
        if (result.output) {
          currentData = { ...currentData, ...result.output };
        }

        executedNodes.add(nodeId);

        // Add connected nodes to queue
        const outgoingEdges = edges.filter(edge => edge.source === nodeId);
        for (const edge of outgoingEdges) {
          if (!executedNodes.has(edge.target)) {
            nodeQueue.push(edge.target);
          }
        }

      } catch (error) {
        const testResult: TestResult = {
          nodeId,
          stepName: node.data.label,
          status: 'error',
          executionTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        };

        execution.results.push(testResult);
        execution.status = 'failed';
        break;
      }
    }

    // Calculate performance metrics
    const endTime = performance.now();
    execution.endTime = new Date();
    execution.performance.totalExecutionTime = endTime - startTime;
    execution.performance.averageStepTime = execution.results.length > 0
      ? execution.results.reduce((sum, result) => sum + result.executionTime, 0) / execution.results.length
      : 0;

    execution.status = execution.status === 'running' ? 'completed' : execution.status;

    // Add to history
    setTestHistory(prev => [execution, ...prev.slice(0, 9)]); // Keep last 10 tests

    onTestComplete?.(execution);
  }, [nodes, edges, mockData]);

  // Execute individual node in test mode
  const executeNodeTest = useCallback(async (node: Node<NodeData>, inputData: any) => {
    const { type, config } = node.data;

    switch (type) {
      case 'start':
        return {
          success: true,
          output: { ...inputData, workflowStarted: true }
        };

      case 'ai_process':
        // Simulate AI processing with mock response
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        const mockResponse = {
          result: `Mock AI response for: ${config?.prompt || 'No prompt'}`,
          confidence: Math.random(),
          processingTime: Math.random() * 1000
        };

        return {
          success: true,
          output: { ...inputData, aiResult: mockResponse }
        };

      case 'end':
        return {
          success: true,
          output: { ...inputData, workflowCompleted: true }
        };

      default:
        return {
          success: false,
          error: `Unknown node type: ${type}`
        };
    }
  }, []);

  // Stop current test
  const stopTesting = useCallback(() => {
    if (executionRef.current) {
      executionRef.current.status = 'cancelled';
      executionRef.current.endTime = new Date();
      setCurrentExecution({ ...executionRef.current });
    }
    setIsTesting(false);
  }, []);

  // Update mock data
  const updateMockData = useCallback((key: string, value: any) => {
    setMockData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear test history
  const clearHistory = useCallback(() => {
    setTestHistory([]);
  }, []);

  return {
    isTesting,
    currentExecution,
    testHistory,
    mockData,
    startTesting,
    stopTesting,
    updateMockData,
    clearHistory
  };
};


