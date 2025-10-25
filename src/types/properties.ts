// Advanced Property System Types
export interface PropertySchema {
  id: string;
  type: PropertyType;
  label: string;
  description?: string;
  required: boolean;
  defaultValue: any;
  validation: PropertyValidation[];
  options?: PropertyOption[];
  dependencies?: PropertyDependency[];
  group?: string;
  order?: number;
  advanced?: boolean;
}

export type PropertyType =
  | 'text' | 'number' | 'boolean' | 'select'
  | 'multiselect' | 'textarea' | 'json' | 'file'
  | 'date' | 'time' | 'datetime' | 'color'
  | 'slider' | 'range' | 'tags' | 'url'
  | 'email' | 'password' | 'code';

export interface PropertyValidation {
  type: ValidationType;
  value?: any;
  message: string;
  validator?: (value: any, context?: any) => boolean;
}

export type ValidationType =
  | 'required' | 'min' | 'max' | 'pattern' | 'custom'
  | 'email' | 'url' | 'json' | 'file-type' | 'file-size';

export interface PropertyOption {
  value: any;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface PropertyDependency {
  propertyId: string;
  condition: {
    operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
    value: any;
  };
  action: 'show' | 'hide' | 'enable' | 'disable' | 'set-value';
  actionValue?: any;
}

export interface PropertyGroup {
  id: string;
  label: string;
  description?: string;
  order: number;
  collapsible: boolean;
  collapsedByDefault: boolean;
  icon?: string;
}

export interface PropertyTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  properties: Record<string, any>;
  icon?: string;
  tags?: string[];
}

// Node-specific property schemas
export interface NodePropertySchemas {
  [nodeType: string]: {
    groups: PropertyGroup[];
    properties: PropertySchema[];
    templates: PropertyTemplate[];
  };
}

// Property editor state
export interface PropertyEditorState {
  selectedNodeId: string | null;
  expandedGroups: Set<string>;
  editedValues: Record<string, any>;
  validationErrors: Record<string, string[]>;
  bulkMode: boolean;
  selectedProperties: string[];
  searchTerm: string;
  showAdvanced: boolean;
}

// Bulk editing types
export interface BulkPropertyOperation {
  propertyIds: string[];
  operation: 'set' | 'increment' | 'append' | 'replace';
  value: any;
  condition?: {
    propertyId: string;
    operator: string;
    value: any;
  };
}

// Property history for undo/redo
export interface PropertyChange {
  nodeId: string;
  propertyId: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

// Advanced property components
export interface PropertyComponentProps {
  schema: PropertySchema;
  value: any;
  onChange: (value: any) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  context?: any;
}

export interface PropertyGroupProps {
  group: PropertyGroup;
  properties: PropertySchema[];
  values: Record<string, any>;
  onPropertyChange: (propertyId: string, value: any) => void;
  expanded: boolean;
  onToggle: () => void;
  errors: Record<string, string[]>;
}

// Property validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Advanced property features
export interface AdvancedPropertyFeatures {
  searchAndFilter: boolean;
  bulkEditing: boolean;
  propertyTemplates: boolean;
  validationFeedback: boolean;
  dependencyManagement: boolean;
  undoRedo: boolean;
  importExport: boolean;
  keyboardNavigation: boolean;
  accessibility: boolean;
}
