import { useState, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../../types/workflow';

interface SandboxConfig {
  isolationLevel: 'full' | 'partial' | 'minimal';
  timeout: number;
  maxMemory: number;
  allowNetwork: boolean;
  allowFileSystem: boolean;
  mockServices: string[];
}

interface SandboxExecution {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  config: SandboxConfig;
  logs: SandboxLog[];
  resources: ResourceUsage;
}

interface SandboxLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  data?: any;
}

interface ResourceUsage {
  memoryPeak: number;
  cpuTime: number;
  networkRequests: number;
  fileOperations: number;
}

interface UseSandboxEnvironmentProps {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onExecutionComplete?: (execution: SandboxExecution) => void;
  onExecutionError?: (error: string) => void;
}

export const useSandboxEnvironment = ({
  nodes,
  edges,
  onExecutionComplete,
  onExecutionError
}: UseSandboxEnvironmentProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<SandboxExecution | null>(null);
  const [config, setConfig] = useState<SandboxConfig>({
    isolationLevel: 'full',
    timeout: 30000, // 30 seconds
    maxMemory: 100 * 1024 * 1024, // 100MB
    allowNetwork: false,
    allowFileSystem: false,
    mockServices: ['database', 'api', 'email']
  });

  const executionRef = useRef<SandboxExecution | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start sandbox execution
  const startSandboxExecution = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);

    const execution: SandboxExecution = {
      id: `sandbox-${Date.now()}`,
      startTime: new Date(),
      status: 'running',
      config: { ...config },
      logs: [],
      resources: {
        memoryPeak: 0,
        cpuTime: 0,
        networkRequests: 0,
        fileOperations: 0
      }
    };

    executionRef.current = execution;
    setCurrentExecution(execution);

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (executionRef.current?.status === 'running') {
        executionRef.current.status = 'timeout';
        executionRef.current.endTime = new Date();
        setCurrentExecution({ ...executionRef.current });
        setIsRunning(false);
        addLog('error', 'Execution timeout', 'sandbox');
      }
    }, config.timeout);

    try {
      await executeInSandbox(execution);
    } catch (error) {

      onExecutionError?.(error instanceof Error ? error.message : 'Unknown sandbox error');
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsRunning(false);
    }
  }, [isRunning, config, nodes, edges, onExecutionComplete, onExecutionError]);

  // Execute workflow in sandbox
  const executeInSandbox = useCallback(async (execution: SandboxExecution) => {
    addLog('info', 'Starting sandbox execution', 'sandbox');
    addLog('info', `Isolation level: ${execution.config.isolationLevel}`, 'sandbox');
    addLog('info', `Timeout: ${execution.config.timeout}ms`, 'sandbox');

    // Initialize sandbox environment
    const sandboxContext = createSandboxContext(execution.config);

    // Execute nodes in topological order
    const executedNodes = new Set<string>();
    const nodeQueue = findStartNodes();

    while (nodeQueue.length > 0 && execution.status === 'running') {
      const nodeId = nodeQueue.shift()!;
      if (executedNodes.has(nodeId)) continue;

      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      try {
        addLog('info', `Executing node: ${node.data.label}`, nodeId);

        // Check resource limits
        if (!checkResourceLimits(execution)) {
          execution.status = 'failed';
          addLog('error', 'Resource limit exceeded', nodeId);
          break;
        }

        // Execute node in sandbox
        const result = await executeNodeInSandbox(node, sandboxContext);

        if (result.success) {
          addLog('info', `Node execution successful`, nodeId);
          if (result.output) {
            addLog('debug', `Output: ${JSON.stringify(result.output)}`, nodeId);
          }
        } else {
          addLog('error', `Node execution failed: ${result.error}`, nodeId);
          execution.status = 'failed';
          break;
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
        addLog('error', `Node execution error: ${error}`, nodeId);
        execution.status = 'failed';
        break;
      }
    }

    // Finalize execution
    execution.endTime = new Date();
    if (execution.status === 'running') {
      execution.status = 'completed';
      addLog('info', 'Sandbox execution completed successfully', 'sandbox');
    }

    setCurrentExecution({ ...execution });
    onExecutionComplete?.(execution);
  }, [nodes, edges]);

  // Create sandbox context
  const createSandboxContext = useCallback((config: SandboxConfig) => {
    const context = {
      config,
      mocks: new Map(),
      resources: {
        memory: 0,
        network: 0,
        filesystem: 0
      }
    };

    // Initialize mocks based on configuration
    config.mockServices.forEach(service => {
      switch (service) {
        case 'database':
          context.mocks.set('database', {
            query: (sql: string) => {
              addLog('debug', `Mock DB query: ${sql}`, 'database');
              return { rows: [], rowCount: 0 };
            },
            connect: () => addLog('debug', 'Mock DB connection established', 'database')
          });
          break;
        case 'api':
          context.mocks.set('api', {
            get: (url: string) => {
              if (!config.allowNetwork) {
                addLog('warn', `Network request blocked: ${url}`, 'api');
                throw new Error('Network access not allowed in sandbox');
              }
              addLog('debug', `Mock API GET: ${url}`, 'api');
              return { status: 200, data: {} };
            }
          });
          break;
        case 'email':
          context.mocks.set('email', {
            send: (to: string, subject: string) => {
              addLog('debug', `Mock email sent to ${to}: ${subject}`, 'email');
              return true;
            }
          });
          break;
      }
    });

    return context;
  }, []);

  // Find start nodes
  const findStartNodes = useCallback(() => {
    return nodes
      .filter(node => node.data.type === 'start')
      .map(node => node.id);
  }, [nodes]);

  // Execute individual node in sandbox
  const executeNodeInSandbox = useCallback(async (node: Node<NodeData>, context: any) => {
    const { type, config: nodeConfig } = node.data;

    // Simulate execution time
    const executionTime = 100 + Math.random() * 900;
    await new Promise(resolve => setTimeout(resolve, executionTime));

    switch (type) {
      case 'start':
        return {
          success: true,
          output: { workflowStarted: true, timestamp: new Date() }
        };

      case 'ai_process':
        // Check if AI service is mocked
        if (context.mocks.has('api')) {
          const apiMock = context.mocks.get('api');
          try {
            // Simulate AI processing
            const response = await apiMock.get('/ai/process');
            return {
              success: true,
              output: {
                result: `Mock AI response for: ${nodeConfig?.prompt || 'No prompt'}`,
                confidence: Math.random(),
                processingTime: executionTime
              }
            };
          } catch (error) {
            return {
              success: false,
              error: 'AI service access blocked by sandbox'
            };
          }
        }
        return {
          success: false,
          error: 'AI service not available in sandbox'
        };

      case 'end':
        return {
          success: true,
          output: { workflowCompleted: true, timestamp: new Date() }
        };

      default:
        return {
          success: false,
          error: `Unknown node type: ${type}`
        };
    }
  }, []);

  // Check resource limits
  const checkResourceLimits = useCallback((execution: SandboxExecution) => {
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

    if (memoryUsage > execution.config.maxMemory) {
      addLog('error', `Memory limit exceeded: ${memoryUsage} > ${execution.config.maxMemory}`, 'sandbox');
      return false;
    }

    return true;
  }, []);

  // Add log entry
  const addLog = useCallback((level: SandboxLog['level'], message: string, source: string, data?: any) => {
    if (!executionRef.current) return;

    const log: SandboxLog = {
      timestamp: new Date(),
      level,
      message,
      source,
      data
    };

    executionRef.current.logs.push(log);
    setCurrentExecution({ ...executionRef.current });
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<SandboxConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Stop execution
  const stopExecution = useCallback(() => {
    if (executionRef.current && executionRef.current.status === 'running') {
      executionRef.current.status = 'failed';
      executionRef.current.endTime = new Date();
      setCurrentExecution({ ...executionRef.current });
      addLog('warn', 'Execution stopped by user', 'sandbox');
    }
    setIsRunning(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    isRunning,
    currentExecution,
    config,
    startSandboxExecution,
    stopExecution,
    updateConfig,
    formatBytes
  };
};


