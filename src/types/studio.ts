// Enhanced Workflow Studio Type Definitions
import { User, Workspace, Project, AuthState } from './auth';
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle extends Position, Size {}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// Canvas Types
export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: number;
  gridEnabled: boolean;
  gridSize: number;
  gridColor: number;
  snapToGrid: boolean;
  showRulers: boolean;
}

// Node Types - Expanded to 25+ professional node types
export type NodeType =
  // Flow Control (8 types)
  | 'start' | 'end'
  | 'decision' | 'condition' | 'switch'
  | 'loop' | 'parallel' | 'merge'
  | 'wait' | 'delay' | 'timer' | 'split'

  // Data Processing (6 types)
  | 'data-transform' | 'filter' | 'sort' | 'aggregate'
  | 'join' | 'split-data' | 'data-validation'

  // Integration & API (5 types)
  | 'api-call' | 'webhook' | 'http-request' | 'graphql'
  | 'websocket' | 'rest-api'

  // Communication (4 types)
  | 'email' | 'sms' | 'notification'
  | 'slack' | 'teams' | 'webhook-response'

  // AI/ML (4 types)
  | 'ai-model' | 'text-generation' | 'image-processing'
  | 'classification' | 'sentiment-analysis'

  // Database & Storage (4 types)
  | 'database' | 'file-system' | 's3-storage' | 'redis'
  | 'mongodb' | 'postgresql'

  // Business Logic (3 types)
  | 'action' | 'script' | 'function-call'
  | 'business-rule' | 'validation-rule'

  // Custom & Advanced
  | 'custom' | 'sub-workflow' | 'error-handler' | 'tool-execution';

export interface NodeStyle {
  backgroundColor: number;
  borderColor: number;
  borderWidth: number;
  borderRadius: number;
  textColor: number;
  fontSize: number;
  fontWeight: string;
  shadow: boolean;
  opacity: number;
}

// Property Type System
export type PropertyType =
  | 'text' | 'number' | 'boolean' | 'select'
  | 'textarea' | 'json' | 'code' | 'file'
  | 'multiselect' | 'date' | 'time' | 'datetime'
  | 'color' | 'range' | 'password' | 'url';

export interface PropertyDefinition {
  key: string;
  label: string;
  type: PropertyType;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  description?: string;
  validation?: PropertyValidation;
  options?: PropertyOption[];
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  fileTypes?: string[];
  language?: string; // for code editor
}

export interface PropertyValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: (value: any) => boolean | string;
}

export interface PropertyOption {
  value: any;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface NodeData {
  label: string;
  description?: string;
  icon?: string;
  properties: Record<string, any>;
  category: string;
  propertyDefinitions?: PropertyDefinition[];
  validationErrors?: Record<string, string>;
}

export interface StudioNode {
  id: string;
  type: NodeType;
  position: Position;
  size: Size;
  data: NodeData;
  style: NodeStyle;
  selected: boolean;
  dragging: boolean;
  resizing: boolean;
}

// Connection Types
export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  style: ConnectionStyle;
  selected: boolean;
}

export interface ConnectionStyle {
  color: number;
  width: number;
  opacity: number;
  animated: boolean;
  dashed: boolean;
  arrowSize: number;
}

// Selection Types
export interface SelectionState {
  selectedNodes: string[];
  selectedConnections: string[];
  selectionBounds?: Rectangle;
  isSelecting: boolean;
}

// Tool Types
export type CanvasTool = 
  | 'select'
  | 'pan' 
  | 'zoom'
  | 'node-create'
  | 'connection-create'
  | 'lasso-select'
  | 'rectangle-select';

// Panel Types
export interface PanelState {
  nodePalette: {
    visible: boolean;
    width: number;
    collapsed: boolean;
  };
  properties: {
    visible: boolean;
    width: number;
    collapsed: boolean;
  };
  minimap: {
    visible: boolean;
    width: number;
    height: number;
  };
  toolbar: {
    visible: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  debug: {
    visible: boolean;
    width: number;
    collapsed: boolean;
  };
  aiDashboard: {
    visible: boolean;
    width: number;
    collapsed: boolean;
    position: 'right' | 'bottom';
  };
}

// Theme Types
export interface StudioTheme {
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    border: string;
    grid: string;
    selection: string;
    error: string;
    warning: string;
    success: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Studio State
export interface StudioState {
  canvas: {
    viewport: Viewport;
    config: CanvasConfig;
    activeTool: CanvasTool;
  };
  nodes: Map<string, StudioNode>;
  connections: Map<string, Connection>;
  selection: SelectionState;
  panels: PanelState;
  theme: StudioTheme;
  auth: AuthState;
  workspace: {
    currentWorkspace?: Workspace;
    currentProject?: Project;
  };
  history: {
    canUndo: boolean;
    canRedo: boolean;
    currentIndex: number;
  };
}
export interface NodeTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  tags: string[];
  nodes: Omit<StudioNode, 'id' | 'selected' | 'dragging' | 'resizing'>[];
  connections: Omit<Connection, 'id' | 'selected'>[];
  viewport?: Viewport;
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  version: string;
}

export type TemplateCategory =
  | 'business-process'
  | 'data-pipeline'
  | 'ai-workflow'
  | 'integration'
  | 'automation'
  | 'custom'
  | 'advanced-ai'
  | 'devops'
  | 'iot'
  | 'analytics'
  | 'security'
  | 'communication';

export interface TemplateLibrary {
  categories: TemplateCategory[];
  templates: NodeTemplate[];
  searchIndex: Record<string, string[]>;
}
