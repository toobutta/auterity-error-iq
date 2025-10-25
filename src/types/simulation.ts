// Simulation and Debug System Types
export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentNodeId: string | null;
  executionHistory: ExecutionStep[];
  breakpoints: Set<string>;
  watchVariables: Map<string, any>;
  executionSpeed: number;
  stepMode: boolean;
  errorState: SimulationError | null;
  performanceMetrics: SimulationMetrics;
}

export interface ExecutionStep {
  id: string;
  nodeId: string;
  timestamp: number;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  executionTime: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  error?: string;
}

export interface SimulationError {
  nodeId: string;
  message: string;
  stack?: string;
  timestamp: number;
  inputData?: Record<string, any>;
}

export interface SimulationMetrics {
  totalExecutionTime: number;
  nodeExecutionTimes: Map<string, number>;
  dataTransferVolume: number;
  memoryUsage: number;
  stepCount: number;
}

export interface Breakpoint {
  nodeId: string;
  condition?: string;
  enabled: boolean;
  hitCount: number;
}

export interface WatchVariable {
  id: string;
  expression: string;
  value: any;
  lastUpdated: number;
  nodeId?: string;
}

// Visual Debug Types
export interface DebugVisualization {
  nodeHighlights: Map<string, NodeHighlight>;
  connectionHighlights: Map<string, ConnectionHighlight>;
  dataFlowAnimations: DataFlowAnimation[];
  executionPath: ExecutionPath;
}

export interface NodeHighlight {
  nodeId: string;
  type: 'current' | 'completed' | 'error' | 'breakpoint' | 'watching';
  intensity: number;
  color: number;
  pulse: boolean;
  duration?: number;
}

export interface ConnectionHighlight {
  connectionId: string;
  type: 'data-flow' | 'execution-path' | 'error-path';
  progress: number; // 0-1 for animation progress
  color: number;
  width: number;
  animated: boolean;
}

export interface DataFlowAnimation {
  id: string;
  connectionId: string;
  data: any;
  startTime: number;
  duration: number;
  progress: number;
  particleCount: number;
  color: number;
}

export interface ExecutionPath {
  nodes: string[];
  connections: string[];
  startTime: number;
  endTime?: number;
  color: number;
  opacity: number;
}

// Simulation Engine Types
export interface SimulationEngine {
  workflow: WorkflowDefinition;
  state: SimulationState;
  onStep: (step: ExecutionStep) => void;
  onComplete: (result: SimulationResult) => void;
  onError: (error: SimulationError) => void;
}

export interface WorkflowDefinition {
  id: string;
  nodes: Map<string, SimulationNode>;
  connections: Map<string, SimulationConnection>;
  startNodeId: string;
  variables: Map<string, any>;
}

export interface SimulationNode {
  id: string;
  type: string;
  config: Record<string, any>;
  execute: (input: Record<string, any>, context: ExecutionContext) => Promise<ExecutionResult>;
}

export interface SimulationConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceOutput?: string;
  targetInput?: string;
  dataTransformer?: (data: any) => any;
}

export interface ExecutionContext {
  workflow: WorkflowDefinition;
  variables: Map<string, any>;
  previousResults: Map<string, ExecutionResult>;
  breakpoints: Set<string>;
}

export interface ExecutionResult {
  success: boolean;
  output: Record<string, any>;
  executionTime: number;
  error?: string;
  logs?: string[];
}

export interface SimulationResult {
  success: boolean;
  totalExecutionTime: number;
  executedNodes: string[];
  finalOutput: Record<string, any>;
  errors: SimulationError[];
  metrics: SimulationMetrics;
}

// Debug Panel Types
export interface DebugPanelState {
  visible: boolean;
  activeTab: 'variables' | 'execution' | 'breakpoints' | 'performance';
  selectedStep: ExecutionStep | null;
  variableFilter: string;
  executionFilter: 'all' | 'errors' | 'breakpoints';
}

export interface VariableInspector {
  variables: Map<string, VariableInfo>;
  scope: 'global' | 'node' | 'connection';
  history: VariableHistory[];
}

export interface VariableInfo {
  name: string;
  value: any;
  type: string;
  size?: number;
  lastModified: number;
  modifiedBy: string;
}

export interface VariableHistory {
  timestamp: number;
  variableName: string;
  oldValue: any;
  newValue: any;
  nodeId: string;
}

// Control Panel Types
export interface SimulationControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  step: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  toggleBreakpoint: (nodeId: string) => void;
  addWatchVariable: (expression: string) => void;
}

// Advanced Debug Features
export interface DebugFeatures {
  timeTravel: boolean;
  conditionalBreakpoints: boolean;
  variableWatch: boolean;
  performanceProfiling: boolean;
  memoryAnalysis: boolean;
  executionTracing: boolean;
  hotReload: boolean;
}

// Integration with Main Studio
export interface SimulationIntegration {
  canvas: any; // EnhancedCanvas instance
  debugPanel: DebugPanelState;
  controls: SimulationControls;
  visualization: DebugVisualization;
  onSimulationUpdate: (state: SimulationState) => void;
  onVisualizationUpdate: (viz: DebugVisualization) => void;
}
