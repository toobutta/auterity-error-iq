# [CLINE-TASK] Advanced Workflow Builder Enhancement - Detailed Specification

**Priority**: 🟡 HIGH - USER EXPERIENCE IMPROVEMENT
**Assigned Tool**: Cline
**Status**: Ready after TASK-004 completion
**Dependencies**: RelayCore admin interface foundation patterns
**Estimated Effort**: 12-16 hours (comprehensive enhancement)

## EXECUTIVE SUMMARY
Transform the existing basic workflow builder into a professional-grade workflow design tool with multiple node types, visual rule builder, real-time validation, versioning, and template composition capabilities.

## BUSINESS CONTEXT
The workflow builder is the core user interface for creating AI-powered automation workflows in AutoMatrix. This enhancement elevates it from a basic drag-and-drop interface to an enterprise-grade workflow design platform comparable to tools like Zapier, Microsoft Power Automate, or n8n.

## CURRENT STATE ANALYSIS REQUIRED

### Pre-Development Assessment Tasks for Cline

#### 1. Existing Workflow Builder Analysis (30 minutes)
```bash
# Find existing workflow builder components
find frontend/src/ -name "*workflow*" -o -name "*builder*" -o -name "*flow*" | grep -i component

# Analyze React Flow integration
grep -r "react-flow" frontend/src/ --include="*.tsx" --include="*.ts"
grep -r "ReactFlow\|useReactFlow\|useNodes\|useEdges" frontend/src/ --include="*.tsx"

# Check existing node types
find frontend/src/ -name "*node*" | grep -v node_modules
grep -r "nodeTypes\|Node.*Component" frontend/src/ --include="*.tsx"

# Analyze current workflow data structure
grep -r "workflow.*type\|Workflow.*interface" frontend/src/ --include="*.ts" --include="*.tsx"
```

#### 2. React Flow Version and Capabilities (15 minutes)
```bash
# Check React Flow version and features
npm list @reactflow/core @reactflow/node-toolbar @reactflow/minimap @reactflow/controls

# Verify React Flow plugins
npm list @reactflow/background @reactflow/node-resizer

# Check for custom node implementations
find frontend/src/ -name "*node*" -exec grep -l "Handle\|Position" {} \;
```

#### 3. State Management Analysis (15 minutes)
```bash
# Check current state management approach
grep -r "useState\|useReducer\|zustand\|redux" frontend/src/components/*workflow* --include="*.tsx"

# Analyze workflow data persistence
grep -r "save.*workflow\|load.*workflow" frontend/src/ --include="*.ts" --include="*.tsx"

# Check for existing validation systems
grep -r "validate\|validation" frontend/src/ --include="*.tsx" --include="*.ts" | grep -i workflow
```

#### 4. Template and Versioning Systems (15 minutes)
```bash
# Look for existing template systems
grep -r "template" frontend/src/ --include="*.tsx" --include="*.ts" | grep -i workflow

# Check for version control patterns
grep -r "version\|history" frontend/src/ --include="*.tsx" --include="*.ts"

# Analyze undo/redo implementations
grep -r "undo\|redo\|history" frontend/src/ --include="*.tsx"
```

## ENHANCED WORKFLOW BUILDER SPECIFICATIONS

### 1. Multiple Node Types System

#### Node Type Architecture
```typescript
// Base node interface
interface BaseWorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: NodeData;
  style?: React.CSSProperties;
  selected?: boolean;
  dragging?: boolean;
}

// Comprehensive node types
type WorkflowNodeType = 
  | 'start' 
  | 'end' 
  | 'action' 
  | 'decision' 
  | 'ai' 
  | 'condition' 
  | 'loop' 
  | 'parallel' 
  | 'delay' 
  | 'webhook' 
  | 'email' 
  | 'database';

// Node data structure
interface NodeData {
  label: string;
  description?: string;
  config: NodeConfiguration;
  validation?: ValidationResult;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  metadata?: NodeMetadata;
}

// Node configuration (type-specific)
interface NodeConfiguration {
  // Common properties
  timeout?: number;
  retryAttempts?: number;
  
  // Type-specific configurations
  [key: string]: any;
}

// AI Node specific configuration
interface AINodeConfiguration extends NodeConfiguration {
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  systemMessage?: string;
  functions?: AIFunction[];
}

// Decision Node specific configuration
interface DecisionNodeConfiguration extends NodeConfiguration {
  conditions: DecisionCondition[];
  defaultPath?: string;
}

// Action Node specific configuration
interface ActionNodeConfiguration extends NodeConfiguration {
  actionType: 'api_call' | 'data_transform' | 'file_operation' | 'notification';
  parameters: Record<string, any>;
}
```

#### Node Component Implementation
```tsx
// Base Node Component
interface BaseNodeProps {
  id: string;
  data: NodeData;
  selected: boolean;
  onUpdate: (id: string, data: Partial<NodeData>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const BaseNode: React.FC<BaseNodeProps> = ({ id, data, selected, onUpdate, onDelete, onDuplicate }) => {
  return (
    <div className={`
      relative bg-white border-2 rounded-lg shadow-sm min-w-[200px] min-h-[80px]
      ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
      ${data.errors?.length ? 'border-red-500' : ''}
      ${data.warnings?.length ? 'border-yellow-500' : ''}
    `}>
      {/* Node Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <NodeIcon type={data.config.type} />
          <span className="font-medium text-sm">{data.label}</span>
        </div>
        
        {/* Node Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onDuplicate(id)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Duplicate"
          >
            <CopyIcon size={14} />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Delete"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>
      
      {/* Node Content */}
      <div className="p-3">
        {data.description && (
          <p className="text-xs text-gray-600 mb-2">{data.description}</p>
        )}
        
        {/* Type-specific content */}
        <NodeContent type={data.config.type} config={data.config} />
      </div>
      
      {/* Validation Indicators */}
      {(data.errors?.length || data.warnings?.length) && (
        <div className="px-3 pb-2">
          {data.errors?.map((error, index) => (
            <div key={index} className="text-xs text-red-600 flex items-center space-x-1">
              <AlertCircleIcon size={12} />
              <span>{error.message}</span>
            </div>
          ))}
          {data.warnings?.map((warning, index) => (
            <div key={index} className="text-xs text-yellow-600 flex items-center space-x-1">
              <AlertTriangleIcon size={12} />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};
```

### 2. Visual Rule Builder Integration

#### Rule Builder Component
```tsx
interface RuleBuilderProps {
  nodeId: string;
  nodeType: WorkflowNodeType;
  existingRules: WorkflowRule[];
  onRulesUpdate: (rules: WorkflowRule[]) => void;
  availableFields: FieldDefinition[];
}

interface WorkflowRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  isActive: boolean;
}

interface RuleCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

type ConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'greater_than' 
  | 'less_than' 
  | 'between' 
  | 'in' 
  | 'not_in' 
  | 'exists' 
  | 'not_exists' 
  | 'regex_match';

const RuleBuilder: React.FC<RuleBuilderProps> = ({ 
  nodeId, 
  nodeType, 
  existingRules, 
  onRulesUpdate, 
  availableFields 
}) => {
  const [activeRule, setActiveRule] = useState<WorkflowRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Rule List */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Rules</h3>
          <button
            onClick={() => createNewRule()}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Add Rule
          </button>
        </div>
        
        <div className="space-y-2">
          {existingRules.map((rule) => (
            <div
              key={rule.id}
              className={`
                p-3 border rounded cursor-pointer transition-colors
                ${activeRule?.id === rule.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
              `}
              onClick={() => setActiveRule(rule)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{rule.name}</span>
                  <span className={`
                    px-2 py-1 text-xs rounded
                    ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRuleActive(rule.id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <ToggleIcon size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRule(rule.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-600">
                {rule.conditions.length} condition(s), {rule.actions.length} action(s)
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Rule Editor */}
      {activeRule && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Edit Rule: {activeRule.name}</h4>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {isEditing ? (
            <RuleEditor
              rule={activeRule}
              availableFields={availableFields}
              onSave={saveRule}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <RuleViewer rule={activeRule} />
          )}
        </div>
      )}
    </div>
  );
};
```

### 3. Real-Time Validation System

#### Validation Engine
```typescript
interface ValidationEngine {
  validateNode: (node: BaseWorkflowNode, context: ValidationContext) => ValidationResult;
  validateWorkflow: (workflow: Workflow) => WorkflowValidationResult;
  validateConnections: (connections: Connection[]) => ConnectionValidationResult;
  validateRules: (rules: WorkflowRule[]) => RuleValidationResult;
}

interface ValidationContext {
  availableVariables: Variable[];
  connectedNodes: BaseWorkflowNode[];
  workflowSettings: WorkflowSettings;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

interface ValidationError {
  id: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  fixSuggestion?: string;
}

// Real-time validation hook
const useWorkflowValidation = (workflow: Workflow) => {
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map());
  const [isValidating, setIsValidating] = useState(false);

  const validateWorkflow = useCallback(async () => {
    setIsValidating(true);
    
    try {
      const results = new Map<string, ValidationResult>();
      
      // Validate each node
      for (const node of workflow.nodes) {
        const context: ValidationContext = {
          availableVariables: getAvailableVariables(workflow, node.id),
          connectedNodes: getConnectedNodes(workflow, node.id),
          workflowSettings: workflow.settings
        };
        
        const result = await validateNode(node, context);
        results.set(node.id, result);
      }
      
      // Validate connections
      const connectionResult = await validateConnections(workflow.edges);
      results.set('connections', connectionResult);
      
      // Validate overall workflow
      const workflowResult = await validateWorkflowStructure(workflow);
      results.set('workflow', workflowResult);
      
      setValidationResults(results);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [workflow]);

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(validateWorkflow, 500);
    return () => clearTimeout(timer);
  }, [validateWorkflow]);

  return {
    validationResults,
    isValidating,
    revalidate: validateWorkflow
  };
};
```

### 4. Workflow Versioning and Rollback

#### Version Control System
```typescript
interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: string;
  timestamp: Date;
  author: string;
  message: string;
  changes: ChangeLog[];
  snapshot: WorkflowSnapshot;
  parentVersion?: string;
  tags: string[];
}

interface ChangeLog {
  id: string;
  type: 'node_added' | 'node_removed' | 'node_modified' | 'connection_added' | 'connection_removed' | 'settings_changed';
  target: string;
  before?: any;
  after?: any;
  timestamp: Date;
}

interface WorkflowSnapshot {
  nodes: BaseWorkflowNode[];
  edges: Connection[];
  settings: WorkflowSettings;
  metadata: WorkflowMetadata;
}

// Version control hook
const useWorkflowVersioning = (workflowId: string) => {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<WorkflowVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const saveVersion = useCallback(async (
    workflow: Workflow, 
    message: string, 
    tags: string[] = []
  ): Promise<WorkflowVersion> => {
    setIsLoading(true);
    
    try {
      const changes = calculateChanges(currentVersion?.snapshot, workflow);
      
      const newVersion: WorkflowVersion = {
        id: generateId(),
        workflowId,
        version: generateVersionNumber(versions),
        timestamp: new Date(),
        author: getCurrentUser().id,
        message,
        changes,
        snapshot: {
          nodes: workflow.nodes,
          edges: workflow.edges,
          settings: workflow.settings,
          metadata: workflow.metadata
        },
        parentVersion: currentVersion?.id,
        tags
      };
      
      const savedVersion = await api.saveWorkflowVersion(newVersion);
      setVersions(prev => [savedVersion, ...prev]);
      setCurrentVersion(savedVersion);
      
      return savedVersion;
    } finally {
      setIsLoading(false);
    }
  }, [workflowId, currentVersion, versions]);

  const loadVersion = useCallback(async (versionId: string): Promise<Workflow> => {
    setIsLoading(true);
    
    try {
      const version = await api.getWorkflowVersion(versionId);
      setCurrentVersion(version);
      
      return {
        id: workflowId,
        nodes: version.snapshot.nodes,
        edges: version.snapshot.edges,
        settings: version.snapshot.settings,
        metadata: version.snapshot.metadata
      };
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  const compareVersions = useCallback(async (
    version1Id: string, 
    version2Id: string
  ): Promise<VersionDiff> => {
    const [v1, v2] = await Promise.all([
      api.getWorkflowVersion(version1Id),
      api.getWorkflowVersion(version2Id)
    ]);
    
    return calculateVersionDiff(v1.snapshot, v2.snapshot);
  }, []);

  return {
    versions,
    currentVersion,
    isLoading,
    saveVersion,
    loadVersion,
    compareVersions
  };
};
```

### 5. Template Composition System

#### Template Architecture
```typescript
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  version: string;
  nodes: BaseWorkflowNode[];
  connections: Connection[];
  parameters: TemplateParameter[];
  metadata: TemplateMetadata;
  thumbnail?: string;
  documentation?: string;
}

interface TemplateParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json';
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: ParameterOption[];
  validation?: ParameterValidation;
}

interface TemplateMetadata {
  createdAt: Date;
  updatedAt: Date;
  downloads: number;
  rating: number;
  reviews: number;
  compatibility: string[];
  requirements: string[];
}

// Template composer component
const TemplateComposer: React.FC = () => {
  const [selectedTemplates, setSelectedTemplates] = useState<WorkflowTemplate[]>([]);
  const [compositionMode, setCompositionMode] = useState<'merge' | 'sequence' | 'parallel'>('merge');
  const [parameterMappings, setParameterMappings] = useState<ParameterMapping[]>([]);

  const composeTemplates = useCallback(async (): Promise<Workflow> => {
    const composer = new WorkflowTemplateComposer();
    
    switch (compositionMode) {
      case 'merge':
        return composer.mergeTemplates(selectedTemplates, parameterMappings);
      case 'sequence':
        return composer.sequenceTemplates(selectedTemplates, parameterMappings);
      case 'parallel':
        return composer.parallelizeTemplates(selectedTemplates, parameterMappings);
      default:
        throw new Error('Invalid composition mode');
    }
  }, [selectedTemplates, compositionMode, parameterMappings]);

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Template Selection */}
      <div className="p-4 border-b">
        <h3 className="font-medium mb-4">Template Composition</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedTemplates.some(t => t.id === template.id)}
              onSelect={(template) => toggleTemplateSelection(template)}
            />
          ))}
        </div>
      </div>
      
      {/* Composition Configuration */}
      {selectedTemplates.length > 1 && (
        <div className="p-4 border-b">
          <h4 className="font-medium mb-3">Composition Mode</h4>
          
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="merge"
                checked={compositionMode === 'merge'}
                onChange={(e) => setCompositionMode(e.target.value as any)}
              />
              <span>Merge (Combine nodes)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="sequence"
                checked={compositionMode === 'sequence'}
                onChange={(e) => setCompositionMode(e.target.value as any)}
              />
              <span>Sequence (Chain templates)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="parallel"
                checked={compositionMode === 'parallel'}
                onChange={(e) => setCompositionMode(e.target.value as any)}
              />
              <span>Parallel (Run simultaneously)</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Parameter Mapping */}
      {selectedTemplates.length > 0 && (
        <div className="p-4">
          <h4 className="font-medium mb-3">Parameter Configuration</h4>
          
          <ParameterMappingEditor
            templates={selectedTemplates}
            mappings={parameterMappings}
            onMappingsChange={setParameterMappings}
          />
          
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setSelectedTemplates([])}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={composeTemplates}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Compose Workflow
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

## IMPLEMENTATION STRATEGY

### Phase 1: Enhanced Foundation (Week 1 - 40 hours)

#### Days 1-2: Core Architecture Enhancement (16 hours)
1. **Enhanced WorkflowBuilder Component** (4 hours)
   - Upgrade existing builder with new architecture
   - Implement advanced state management with Zustand
   - Add keyboard shortcuts and accessibility features

2. **Multiple Node Types System** (8 hours)
   - Create BaseNode component with extensible architecture
   - Implement all 12 node types with configurations
   - Add node palette with drag-and-drop functionality
   - Create node-specific configuration panels

3. **Enhanced Canvas and Controls** (4 hours)
   - Upgrade React Flow integration with latest features
   - Add custom controls, minimap, and background
   - Implement zoom, pan, fit-to-screen, and selection tools

#### Days 3-4: Validation and Rules (16 hours)
1. **Real-Time Validation Engine** (8 hours)
   - Build comprehensive validation framework
   - Implement node-level and workflow-level validation
   - Add visual validation feedback with error highlighting
   - Create validation context and dependency tracking

2. **Visual Rule Builder** (8 hours)
   - Create drag-and-drop rule builder interface
   - Implement condition and action configuration
   - Add rule testing and preview functionality
   - Integrate with node configuration panels

#### Day 5: Testing and Integration (8 hours)
1. **Unit Testing** (4 hours)
   - Write comprehensive tests for all components
   - Mock React Flow and external dependencies
   - Test validation logic and rule builder functionality

2. **Integration Testing** (4 hours)
   - Test node interactions and workflow execution
   - Validate keyboard shortcuts and accessibility
   - Performance testing with large workflows (100+ nodes)

### Phase 2: Advanced Features (Week 2 - 40 hours)

#### Days 6-7: Versioning System (16 hours)
1. **Version Control Implementation** (8 hours)
   - Build version management system with Git-like features
   - Implement change tracking and snapshots
   - Add automatic versioning on significant changes

2. **Version History Interface** (8 hours)
   - Create version history browser with timeline
   - Implement version comparison and diff visualization
   - Add rollback functionality with conflict resolution

#### Days 8-9: Template System (16 hours)
1. **Template Management** (8 hours)
   - Build template library interface with categories
   - Implement template CRUD operations
   - Add template search, filtering, and rating system

2. **Template Composition Engine** (8 hours)
   - Create template composition with merge/sequence/parallel modes
   - Implement parameter resolution and mapping system
   - Add template instantiation with customization wizard

#### Day 10: Final Integration and Polish (8 hours)
1. **Feature Integration** (4 hours)
   - Integrate all features into main workflow builder
   - Test cross-feature interactions and edge cases
   - Optimize performance and bundle size

2. **Documentation and Handoff** (4 hours)
   - Create comprehensive component documentation
   - Write usage guides and examples
   - Prepare handoff documentation with API specifications

## SUCCESS CRITERIA CHECKLIST
- [ ] 12 node types implemented with full configuration panels
- [ ] Drag-and-drop from node palette to canvas with snap-to-grid
- [ ] Real-time validation with visual feedback and suggestions
- [ ] Visual rule builder with drag-and-drop conditions and actions
- [ ] Version control system with Git-like features and rollback
- [ ] Template library with composition capabilities (merge/sequence/parallel)
- [ ] Keyboard shortcuts for all major operations (copy, paste, undo, redo)
- [ ] Undo/redo functionality with 50-step history
- [ ] Real-time collaboration support with conflict resolution
- [ ] Mobile-responsive design with touch gestures
- [ ] <3 second load time for workflows with 100+ nodes
- [ ] 95%+ test coverage with comprehensive integration tests
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Bundle size optimization (<500KB additional for workflow features)

## QUALITY GATES
- **Performance**: <3s load time, <100ms interaction response, 60fps animations
- **Accessibility**: Full keyboard navigation, screen reader support, high contrast mode
- **Testing**: 95%+ coverage with unit, integration, and E2E tests
- **TypeScript**: Strict typing with comprehensive interfaces, zero 'any' types
- **Bundle Size**: Workflow builder features <500KB additional
- **Memory**: <100MB memory usage for large workflows (500+ nodes)

## DEPENDENCIES & INTEGRATION
- **Blocking**: TASK-004 (RelayCore admin interface) for shared patterns and components
- **React Flow**: Latest version (11.x) with advanced features and plugins
- **State Management**: Zustand for complex workflow state with persistence
- **Validation**: Yup or Zod for comprehensive schema validation
- **Testing**: React Testing Library with React Flow mocks and custom render utils
- **Performance**: React.memo, useMemo, useCallback for optimization

## CONTEXT FILES TO REFERENCE
- `frontend/src/components/` - Existing workflow components and patterns
- `frontend/src/types/` - Current workflow type definitions
- `shared/components/` - Shared UI components for consistency
- `frontend/package.json` - Current React Flow version and dependencies
- `.kiro/tasks/cline-task-004-relaycore-admin-interface-detailed.md` - Shared patterns

## HANDBACK CRITERIA
Task is complete when:
1. All 12 node types implemented with comprehensive configuration panels
2. Visual rule builder functional with drag-and-drop interface
3. Real-time validation working with contextual feedback
4. Version control system operational with rollback and comparison
5. Template system allows composition with multiple modes
6. Keyboard shortcuts and accessibility fully implemented
7. All tests pass with 95%+ coverage including E2E scenarios
8. Performance metrics meet <3s load time for complex workflows
9. Mobile responsive design validated across devices
10. Documentation complete with usage examples and API integration guide
11. Bundle size optimized and within 500KB limit
12. Memory usage optimized for large workflows

---

**READY FOR CLINE EXECUTION** after TASK-004 completion provides shared component patterns.