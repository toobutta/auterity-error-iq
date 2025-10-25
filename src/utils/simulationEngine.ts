import {
  SimulationEngine,
  SimulationState,
  ExecutionStep,
  ExecutionResult,
  ExecutionContext,
  WorkflowDefinition,
  SimulationNode,
  SimulationConnection,
  SimulationError,
  SimulationResult,
  SimulationMetrics,
  Breakpoint
} from '../types/simulation';

export class WorkflowSimulationEngine implements SimulationEngine {
  private workflow: WorkflowDefinition;
  private state: SimulationState;
  private isRunning: boolean = false;
  private executionQueue: string[] = [];
  private executedNodes: Set<string> = new Set();
  private pendingPromises: Map<string, Promise<ExecutionResult>> = new Map();

  constructor(workflow: WorkflowDefinition) {
    this.workflow = workflow;
    this.state = this.createInitialState();
  }

  // Initialize simulation state
  private createInitialState(): SimulationState {
    return {
      isRunning: false,
      isPaused: false,
      currentNodeId: null,
      executionHistory: [],
      breakpoints: new Set(),
      watchVariables: new Map(),
      executionSpeed: 1,
      stepMode: false,
      errorState: null,
      performanceMetrics: {
        totalExecutionTime: 0,
        nodeExecutionTimes: new Map(),
        dataTransferVolume: 0,
        memoryUsage: 0,
        stepCount: 0
      }
    };
  }

  // Main execution methods
  async execute(onStep?: (step: ExecutionStep) => void, onComplete?: (result: SimulationResult) => void, onError?: (error: SimulationError) => void): Promise<SimulationResult> {
    if (this.isRunning) {
      throw new Error('Simulation is already running');
    }

    this.isRunning = true;
    this.state.isRunning = true;
    this.executedNodes.clear();
    this.executionQueue = [this.workflow.startNodeId];

    const startTime = performance.now();
    let executionResult: SimulationResult;

    try {
      // Initialize workflow variables
      this.workflow.variables = new Map();

      // Execute workflow
      const result = await this.executeWorkflow(onStep);

      // Calculate final metrics
      const endTime = performance.now();
      this.state.performanceMetrics.totalExecutionTime = endTime - startTime;

      executionResult = {
        success: result.success,
        totalExecutionTime: this.state.performanceMetrics.totalExecutionTime,
        executedNodes: Array.from(this.executedNodes),
        finalOutput: result.output,
        errors: result.errors,
        metrics: this.state.performanceMetrics
      };

      if (onComplete) {
        onComplete(executionResult);
      }

    } catch (error) {
      const simError: SimulationError = {
        nodeId: this.state.currentNodeId || 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: Date.now()
      };

      this.state.errorState = simError;

      if (onError) {
        onError(simError);
      }

      executionResult = {
        success: false,
        totalExecutionTime: performance.now() - startTime,
        executedNodes: Array.from(this.executedNodes),
        finalOutput: {},
        errors: [simError],
        metrics: this.state.performanceMetrics
      };
    }

    this.isRunning = false;
    this.state.isRunning = false;
    this.state.currentNodeId = null;

    return executionResult;
  }

  // Execute the entire workflow
  private async executeWorkflow(onStep?: (step: ExecutionStep) => void): Promise<{ success: boolean; output: Record<string, any>; errors: SimulationError[] }> {
    const errors: SimulationError[] = [];
    const finalOutput: Record<string, any> = {};
    let success = true;

    while (this.executionQueue.length > 0 && this.isRunning) {
      if (this.state.isPaused) {
        await this.waitForResume();
      }

      const nodeId = this.executionQueue.shift()!;
      this.state.currentNodeId = nodeId;

      // Check for breakpoints
      if (this.state.breakpoints.has(nodeId)) {
        this.state.isPaused = true;
        this.state.currentNodeId = nodeId;

        // Wait for user to continue
        await this.waitForResume();
      }

      try {
        const result = await this.executeNode(nodeId, onStep);

        if (result.success) {
          finalOutput[nodeId] = result.output;

          // Add next nodes to queue based on connections
          const nextNodes = this.getNextNodes(nodeId, result.output);
          for (const nextNodeId of nextNodes) {
            if (!this.executedNodes.has(nextNodeId) && !this.executionQueue.includes(nextNodeId)) {
              this.executionQueue.push(nextNodeId);
            }
          }
        } else {
          success = false;
          errors.push({
            nodeId,
            message: result.error || 'Node execution failed',
            timestamp: Date.now(),
            inputData: result.output // This would be input data in real implementation
          });
        }

        this.executedNodes.add(nodeId);

      } catch (error) {
        success = false;
        errors.push({
          nodeId,
          message: error instanceof Error ? error.message : 'Node execution error',
          timestamp: Date.now()
        });
      }
    }

    return { success, output: finalOutput, errors };
  }

  // Execute a single node
  private async executeNode(nodeId: string, onStep?: (step: ExecutionStep) => void): Promise<ExecutionResult> {
    const node = this.workflow.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const startTime = performance.now();
    const step: ExecutionStep = {
      id: `step_${Date.now()}_${Math.random()}`,
      nodeId,
      timestamp: startTime,
      inputData: this.getNodeInput(nodeId),
      outputData: {},
      executionTime: 0,
      status: 'running'
    };

    // Add to history
    this.state.executionHistory.push(step);

    if (onStep) {
      onStep(step);
    }

    try {
      // Create execution context
      const context: ExecutionContext = {
        workflow: this.workflow,
        variables: this.workflow.variables,
        previousResults: new Map(),
        breakpoints: this.state.breakpoints
      };

      // Get previous results for input
      for (const connection of this.workflow.connections.values()) {
        if (connection.targetId === nodeId) {
          const sourceResult = this.getNodeResult(connection.sourceId);
          if (sourceResult) {
            context.previousResults.set(connection.sourceId, sourceResult);
          }
        }
      }

      // Execute node
      const result = await node.execute(step.inputData, context);

      const endTime = performance.now();
      step.outputData = result.output;
      step.executionTime = endTime - startTime;
      step.status = result.success ? 'completed' : 'failed';

      if (!result.success && result.error) {
        step.error = result.error;
      }

      // Update metrics
      this.state.performanceMetrics.nodeExecutionTimes.set(nodeId, step.executionTime);
      this.state.performanceMetrics.stepCount++;

      // Update step in history
      const historyIndex = this.state.executionHistory.length - 1;
      this.state.executionHistory[historyIndex] = step;

      if (onStep) {
        onStep(step);
      }

      return result;

    } catch (error) {
      const endTime = performance.now();
      step.executionTime = endTime - startTime;
      step.status = 'failed';
      step.error = error instanceof Error ? error.message : 'Unknown error';

      // Update step in history
      const historyIndex = this.state.executionHistory.length - 1;
      this.state.executionHistory[historyIndex] = step;

      if (onStep) {
        onStep(step);
      }

      return {
        success: false,
        output: {},
        executionTime: step.executionTime,
        error: step.error
      };
    }
  }

  // Control methods
  pause(): void {
    this.state.isPaused = true;
  }

  resume(): void {
    this.state.isPaused = false;
  }

  stop(): void {
    this.isRunning = false;
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.state.currentNodeId = null;
  }

  reset(): void {
    this.stop();
    this.state = this.createInitialState();
    this.executionQueue = [];
    this.executedNodes.clear();
    this.pendingPromises.clear();
  }

  // Step execution (for debugging)
  async step(onStep?: (step: ExecutionStep) => void): Promise<void> {
    if (!this.state.isPaused && this.executionQueue.length === 0) {
      return;
    }

    if (this.executionQueue.length === 0) {
      // Find next node if not already queued
      const nextNode = this.findNextExecutableNode();
      if (nextNode) {
        this.executionQueue.push(nextNode);
      } else {
        return;
      }
    }

    const nodeId = this.executionQueue.shift()!;
    await this.executeNode(nodeId, onStep);

    this.executedNodes.add(nodeId);
  }

  // Breakpoint management
  addBreakpoint(nodeId: string): void {
    this.state.breakpoints.add(nodeId);
  }

  removeBreakpoint(nodeId: string): void {
    this.state.breakpoints.delete(nodeId);
  }

  // Variable watching
  addWatchVariable(variableName: string): void {
    this.state.watchVariables.set(variableName, undefined);
  }

  removeWatchVariable(variableName: string): void {
    this.state.watchVariables.delete(variableName);
  }

  // Getters
  getState(): SimulationState {
    return { ...this.state };
  }

  getExecutionHistory(): ExecutionStep[] {
    return [...this.state.executionHistory];
  }

  getCurrentNodeId(): string | null {
    return this.state.currentNodeId;
  }

  // Helper methods
  private getNodeInput(nodeId: string): Record<string, any> {
    const input: Record<string, any> = {};

    // Get data from incoming connections
    for (const connection of this.workflow.connections.values()) {
      if (connection.targetId === nodeId) {
        const sourceResult = this.getNodeResult(connection.sourceId);
        if (sourceResult && sourceResult.success) {
          const dataKey = connection.sourceOutput || 'output';
          input[dataKey] = sourceResult.output;
        }
      }
    }

    return input;
  }

  private getNodeResult(nodeId: string): ExecutionResult | null {
    const step = this.state.executionHistory
      .filter(s => s.nodeId === nodeId && s.status === 'completed')
      .pop();

    return step ? {
      success: true,
      output: step.outputData,
      executionTime: step.executionTime
    } : null;
  }

  private getNextNodes(nodeId: string, output: Record<string, any>): string[] {
    const nextNodes: string[] = [];

    for (const connection of this.workflow.connections.values()) {
      if (connection.sourceId === nodeId) {
        // Check if connection condition is met (simplified)
        nextNodes.push(connection.targetId);
      }
    }

    return nextNodes;
  }

  private findNextExecutableNode(): string | null {
    for (const node of this.workflow.nodes.values()) {
      if (!this.executedNodes.has(node.id)) {
        // Check if all dependencies are satisfied
        const dependencies = this.getNodeDependencies(node.id);
        const allDepsSatisfied = dependencies.every(depId => this.executedNodes.has(depId));

        if (allDepsSatisfied) {
          return node.id;
        }
      }
    }
    return null;
  }

  private getNodeDependencies(nodeId: string): string[] {
    const dependencies: string[] = [];

    for (const connection of this.workflow.connections.values()) {
      if (connection.targetId === nodeId) {
        dependencies.push(connection.sourceId);
      }
    }

    return dependencies;
  }

  private waitForResume(): Promise<void> {
    return new Promise(resolve => {
      const checkResume = () => {
        if (!this.state.isPaused) {
          resolve();
        } else {
          setTimeout(checkResume, 100);
        }
      };
      checkResume();
    });
  }
}

// Factory function to create simulation engine from studio state
export function createSimulationEngine(nodes: Map<string, any>, connections: Map<string, any>): WorkflowSimulationEngine {
  const simulationNodes = new Map<string, SimulationNode>();
  const simulationConnections = new Map<string, SimulationConnection>();

  // Convert studio nodes to simulation nodes
  for (const [id, node] of nodes) {
    simulationNodes.set(id, {
      id,
      type: node.type,
      config: node.data.properties || {},
      execute: createNodeExecutor(node.type)
    });
  }

  // Convert studio connections to simulation connections
  for (const [id, connection] of connections) {
    simulationConnections.set(id, {
      id,
      sourceId: connection.sourceId,
      targetId: connection.targetId,
      sourceOutput: connection.sourceHandle,
      targetInput: connection.targetHandle
    });
  }

  const workflow: WorkflowDefinition = {
    id: 'workflow_' + Date.now(),
    nodes: simulationNodes,
    connections: simulationConnections,
    startNodeId: findStartNode(nodes),
    variables: new Map()
  };

  return new WorkflowSimulationEngine(workflow);
}

// Helper function to create node executors
function createNodeExecutor(nodeType: string): (input: Record<string, any>, context: ExecutionContext) => Promise<ExecutionResult> {
  return async (input: Record<string, any>, context: ExecutionContext): Promise<ExecutionResult> => {
    const startTime = performance.now();

    try {
      // Simulate different node types
      switch (nodeType) {
        case 'start':
          return {
            success: true,
            output: { message: 'Workflow started', timestamp: Date.now() },
            executionTime: performance.now() - startTime
          };

        case 'action':
          // Simulate async action
          await new Promise(resolve => setTimeout(resolve, 100));
          return {
            success: true,
            output: { result: 'Action completed', input },
            executionTime: performance.now() - startTime
          };

        case 'decision':
          const condition = input.value > 0;
          return {
            success: true,
            output: { decision: condition, input },
            executionTime: performance.now() - startTime
          };

        case 'end':
          return {
            success: true,
            output: { message: 'Workflow completed', finalInput: input },
            executionTime: performance.now() - startTime
          };

        default:
          return {
            success: true,
            output: { message: `${nodeType} executed`, input },
            executionTime: performance.now() - startTime
          };
      }
    } catch (error) {
      return {
        success: false,
        output: {},
        executionTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  };
}

// Helper function to find start node
function findStartNode(nodes: Map<string, any>): string {
  for (const [id, node] of nodes) {
    if (node.type === 'start') {
      return id;
    }
  }
  // Return first node if no start node found
  return nodes.keys().next().value || '';
}
