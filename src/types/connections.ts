// Advanced Connection System Types
export interface ConnectionPoint {
  id: string;
  x: number;
  y: number;
  type: 'input' | 'output';
  nodeId: string;
  label?: string;
  dataType?: string;
  required?: boolean;
  connected?: boolean;
}

export interface ConnectionPath {
  id: string;
  source: ConnectionPoint;
  target: ConnectionPoint;
  waypoints: Position[];
  style: ConnectionStyle;
  metadata: ConnectionMetadata;
}

export interface ConnectionStyle {
  color: number;
  width: number;
  opacity: number;
  animated: boolean;
  dashed: boolean;
  arrowSize: number;
  curveType: 'straight' | 'bezier' | 'orthogonal';
  label?: {
    text: string;
    position: 'start' | 'middle' | 'end';
    backgroundColor: number;
    textColor: number;
  };
}

export interface ConnectionMetadata {
  type: ConnectionType;
  dataFlow: DataFlowDirection;
  validation: ConnectionValidation;
  conditional?: ConditionalLogic;
  transformation?: DataTransformation;
}

export type ConnectionType =
  | 'data' | 'control' | 'event' | 'error'
  | 'conditional' | 'loop' | 'parallel' | 'merge';

export type DataFlowDirection =
  | 'unidirectional' | 'bidirectional' | 'conditional';

export interface ConnectionValidation {
  compatibleTypes: string[];
  maxConnections: number;
  validationRules: ValidationRule[];
  errorMessage?: string;
}

export interface ConditionalLogic {
  expression: string;
  truePath: ConnectionPath;
  falsePath: ConnectionPath;
  defaultPath?: ConnectionPath;
}

export interface DataTransformation {
  inputType: string;
  outputType: string;
  transformation: string;
  validation: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'type' | 'range' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

// Connection Creation and Editing
export interface ConnectionCreationState {
  isCreating: boolean;
  sourcePoint?: ConnectionPoint;
  previewPath?: ConnectionPath;
  validTargets: ConnectionPoint[];
  invalidTargets: ConnectionPoint[];
}

export interface ConnectionEditorState {
  selectedConnection?: ConnectionPath;
  isEditing: boolean;
  editMode: 'path' | 'style' | 'properties';
  waypoints: Position[];
}

// Smart Routing System
export interface RoutingContext {
  nodes: Rectangle[];
  existingConnections: ConnectionPath[];
  viewport: Viewport;
  gridSize: number;
  snapToGrid: boolean;
}

export interface RoutingResult {
  path: Position[];
  waypoints: Position[];
  obstacles: Rectangle[];
  cost: number;
  valid: boolean;
  alternativePaths?: Position[][];
}

// Connection UI State
export interface ConnectionUIState {
  creation: ConnectionCreationState;
  editor: ConnectionEditorState;
  hover: {
    connection?: ConnectionPath;
    point?: ConnectionPoint;
  };
  selection: {
    connections: string[];
    multiSelect: boolean;
  };
}

// Connection Events
export type ConnectionEvent =
  | { type: 'start-creation'; point: ConnectionPoint }
  | { type: 'update-preview'; path: ConnectionPath }
  | { type: 'complete-creation'; path: ConnectionPath }
  | { type: 'cancel-creation' }
  | { type: 'select-connection'; connectionId: string }
  | { type: 'edit-connection'; connectionId: string; mode: string }
  | { type: 'delete-connection'; connectionId: string }
  | { type: 'update-connection'; connectionId: string; updates: Partial<ConnectionPath> };

// Connection Tools
export interface ConnectionTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'basic' | 'advanced' | 'custom';
  defaultStyle: ConnectionStyle;
  validation: ConnectionValidation;
  createPath: (source: ConnectionPoint, target: ConnectionPoint, context: RoutingContext) => RoutingResult;
}

// Bulk Connection Operations
export interface BulkConnectionOperation {
  operation: 'create' | 'delete' | 'update' | 'align' | 'distribute';
  connections: string[];
  parameters?: Record<string, any>;
  undoData?: any;
}

// Connection Templates
export interface ConnectionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  style: ConnectionStyle;
  validation: ConnectionValidation;
  icon?: string;
  tags?: string[];
}

// Connection Analytics
export interface ConnectionAnalytics {
  totalConnections: number;
  connectionTypes: Record<ConnectionType, number>;
  averagePathLength: number;
  mostConnectedNodes: Array<{ nodeId: string; connections: number }>;
  dataFlowPatterns: DataFlowPattern[];
  performanceMetrics: ConnectionPerformance;
}

export interface DataFlowPattern {
  pattern: string;
  frequency: number;
  efficiency: number;
  recommendations: string[];
}

export interface ConnectionPerformance {
  renderTime: number;
  interactionLatency: number;
  pathCalculationTime: number;
  memoryUsage: number;
}

// Helper Types
export interface Position {
  x: number;
  y: number;
}

export interface Rectangle extends Position {
  width: number;
  height: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
