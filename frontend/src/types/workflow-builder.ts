import { WorkflowStep, WorkflowDefinition } from "./workflow";

// Enhanced workflow interfaces for automotive dealership workflows
export interface Workflow extends WorkflowDefinition {
  category: "sales" | "service" | "marketing" | "inventory";
  triggers: TriggerConfig[];
  variables: WorkflowVariable[];
  version: number;
  status: "draft" | "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface WorkflowVariable {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  defaultValue?: string | number | boolean | Record<string, unknown>;
  description: string;
}

export interface TriggerConfig {
  id: string;
  type:
    | "customer_inquiry"
    | "inventory_update"
    | "service_appointment"
    | "lead_generation";
  config: Record<string, unknown>;
}

// Node system interfaces
export interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition" | "ai_step";
  position: { x: number; y: number };
  data: NodeData;
  connections: Connection[];
}

export interface Connection {
  sourceId: string;
  targetId: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface NodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  type: WorkflowStep["type"];
  config: NodeConfig;
  validation: ValidationRule[];
  isValid?: boolean;
  validationErrors?: string[];
}

// Node templates and categories
export interface NodeCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  nodes: NodeTemplate[];
}

export interface NodeTemplate {
  type: string;
  label: string;
  icon: string;
  description: string;
  category: string;
  inputs: InputPort[];
  outputs: OutputPort[];
  config: NodeConfig;
  defaultData: Partial<NodeData>;
}

export interface InputPort {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "unknown";
  required: boolean;
  description?: string;
}

export interface OutputPort {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "unknown";
  description?: string;
}

// Node configurations for different types
export interface NodeConfig extends Record<string, unknown> {
  // Email Node
  emailTemplate?: {
    subject: string;
    body: string;
    recipients: string[];
    attachments?: string[];
  };

  // CRM Update Node
  crmFields?: {
    leadScore?: number;
    status?: string;
    notes?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
  };

  // AI Node
  aiPrompt?: {
    model: "gpt-4" | "gpt-3.5-turbo";
    prompt: string;
    temperature: number;
    maxTokens?: number;
    systemMessage?: string;
  };

  // Condition Node
  conditions?: {
    field: string;
    operator:
      | "equals"
      | "contains"
      | "greater_than"
      | "less_than"
      | "in"
      | "not_in";
    value: unknown;
    logicalOperator?: "and" | "or";
  }[];

  // Trigger Nodes
  customerInquiry?: {
    sources: ("email" | "phone" | "web_form" | "chat")[];
    filters?: Record<string, unknown>;
  };

  inventoryUpdate?: {
    eventTypes: ("new_arrival" | "price_change" | "status_change")[];
    vehicleFilters?: {
      make?: string[];
      model?: string[];
      year?: number[];
      priceRange?: { min: number; max: number };
    };
  };

  serviceAppointment?: {
    serviceTypes: ("maintenance" | "repair" | "inspection")[];
    reminderSettings?: {
      enabled: boolean;
      daysBefore: number;
    };
  };

  // Action Nodes
  scheduleAppointment?: {
    appointmentType: "service" | "sales" | "test_drive";
    duration: number;
    location?: string;
    autoConfirm: boolean;
  };

  inventoryCheck?: {
    searchCriteria: {
      make?: string;
      model?: string;
      year?: number;
      features?: string[];
    };
    includeNearbyDealerships: boolean;
  };

  generateQuote?: {
    includeFinancing: boolean;
    includeTradeIn: boolean;
    validityDays: number;
    discountRules?: Record<string, unknown>;
  };
}

export interface ValidationRule {
  field: string;
  type: "required" | "min_length" | "max_length" | "pattern" | "custom";
  value?: string | number | boolean | RegExp | Record<string, unknown>;
  message: string;
}

// Drag and drop interfaces
export interface DragItem {
  type: string;
  nodeType: string;
  template: NodeTemplate;
}

export interface DropResult {
  position: { x: number; y: number };
  canDrop: boolean;
}

// Workflow builder props
export interface WorkflowCanvasProps {
  workflowId?: string;
  onSave: (workflow: Workflow) => void;
  onTest: (workflow: Workflow) => void;
  onNodeSelect?: (node: WorkflowNode | null) => void;
}

export interface NodePaletteProps {
  categories: NodeCategory[];
  onNodeDrag: (nodeType: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export interface NodeEditorProps {
  node: WorkflowNode | null;
  onUpdate: (nodeId: string, data: NodeData) => void;
  onDelete: (nodeId: string) => void;
  onClose?: () => void;
}

export interface WorkflowTesterProps {
  workflow: Workflow;
  onExecute: (inputData: Record<string, unknown>) => Promise<string>; // Returns executionId
  isExecuting?: boolean;
}

// Automotive-specific types
export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferences?: {
    make?: string[];
    model?: string[];
    priceRange?: { min: number; max: number };
    features?: string[];
  };
  leadScore?: number;
  status: "new" | "contacted" | "qualified" | "negotiating" | "closed" | "lost";
}

export interface VehicleData {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: "available" | "sold" | "reserved" | "maintenance";
  features: string[];
  images?: string[];
  specifications?: Record<string, unknown>;
}

export interface ServiceAppointmentData {
  id: string;
  customerId: string;
  vehicleId?: string;
  serviceType: "maintenance" | "repair" | "inspection";
  scheduledDate: string;
  duration: number;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

// Template categories for automotive workflows
export const AUTOMOTIVE_NODE_CATEGORIES: NodeCategory[] = [
  {
    id: "triggers",
    name: "Triggers",
    icon: "⚡",
    color: "yellow",
    nodes: [],
  },
  {
    id: "actions",
    name: "Actions",
    icon: "🔄",
    color: "blue",
    nodes: [],
  },
  {
    id: "conditions",
    name: "Conditions",
    icon: "❓",
    color: "purple",
    nodes: [],
  },
  {
    id: "ai_powered",
    name: "AI Powered",
    icon: "🤖",
    color: "green",
    nodes: [],
  },
  {
    id: "integrations",
    name: "Integrations",
    icon: "🔌",
    color: "orange",
    nodes: [],
  },
];


