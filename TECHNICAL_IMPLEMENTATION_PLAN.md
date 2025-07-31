# Technical Implementation Plan

## Immediate Fixes and Improvements

### 1. TypeScript Interfaces and Types

#### Create comprehensive workflow types:
```typescript
// frontend/src/types/workflow.ts
export interface WorkflowNode {
  id: string;
  type: 'start' | 'end' | 'action' | 'decision' | 'ai' | 'condition';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, any>;
    validation?: ValidationRule[];
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated?: boolean;
  style?: Record<string, any>;
  data?: {
    condition?: string;
    label?: string;
  };
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: {
    version: string;
    created: string;
    modified: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Enhanced Error Handling

#### Global Error Boundary:
```typescript
// frontend/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Send to error reporting service
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Workflow API Client

#### Enhanced API client with proper error handling:
```typescript
// frontend/src/api/workflows.ts
import { apiClient } from './client';
import { Workflow, WorkflowDefinition } from '../types/workflow';

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  definition?: WorkflowDefinition;
  isActive?: boolean;
}

export class WorkflowApi {
  static async createWorkflow(data: CreateWorkflowRequest): Promise<Workflow> {
    return apiClient.post<Workflow>('/api/workflows', data);
  }

  static async getWorkflows(params?: {
    page?: number;
    pageSize?: number;
    nameFilter?: string;
    isActive?: boolean;
  }): Promise<{
    workflows: Workflow[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('page_size', params.pageSize.toString());
    if (params?.nameFilter) searchParams.set('name_filter', params.nameFilter);
    if (params?.isActive !== undefined) searchParams.set('is_active', params.isActive.toString());

    return apiClient.get<any>(`/api/workflows?${searchParams.toString()}`);
  }

  static async getWorkflow(id: string): Promise<Workflow> {
    return apiClient.get<Workflow>(`/api/workflows/${id}`);
  }

  static async updateWorkflow(id: string, data: UpdateWorkflowRequest): Promise<Workflow> {
    return apiClient.put<Workflow>(`/api/workflows/${id}`, data);
  }

  static async deleteWorkflow(id: string): Promise<void> {
    return apiClient.delete(`/api/workflows/${id}`);
  }

  static async duplicateWorkflow(id: string): Promise<Workflow> {
    return apiClient.post<Workflow>(`/api/workflows/${id}/duplicate`);
  }
}
```

### 4. State Management with Zustand

#### Workflow store:
```typescript
// frontend/src/stores/workflowStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { WorkflowNode, WorkflowEdge, Workflow } from '../types/workflow';
import { WorkflowApi } from '../api/workflows';

interface WorkflowState {
  // Current workflow being edited
  currentWorkflow: Workflow | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  
  // Actions
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: WorkflowEdge) => void;
  removeEdge: (id: string) => void;
  
  // API actions
  saveWorkflow: () => Promise<void>;
  loadWorkflow: (id: string) => Promise<void>;
  createWorkflow: (name: string, description?: string) => Promise<void>;
  
  // Validation
  validateWorkflow: () => string[];
  
  // Reset
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set, get) => ({
      currentWorkflow: null,
      nodes: [],
      edges: [],
      isLoading: false,
      error: null,
      isDirty: false,

      setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
      
      setNodes: (nodes) => set({ nodes, isDirty: true }),
      
      setEdges: (edges) => set({ edges, isDirty: true }),
      
      addNode: (node) => set((state) => ({
        nodes: [...state.nodes, node],
        isDirty: true
      })),
      
      updateNode: (id, updates) => set((state) => ({
        nodes: state.nodes.map(node => 
          node.id === id ? { ...node, ...updates } : node
        ),
        isDirty: true
      })),
      
      removeNode: (id) => set((state) => ({
        nodes: state.nodes.filter(node => node.id !== id),
        edges: state.edges.filter(edge => 
          edge.source !== id && edge.target !== id
        ),
        isDirty: true
      })),
      
      addEdge: (edge) => set((state) => ({
        edges: [...state.edges, edge],
        isDirty: true
      })),
      
      removeEdge: (id) => set((state) => ({
        edges: state.edges.filter(edge => edge.id !== id),
        isDirty: true
      })),

      saveWorkflow: async () => {
        const { currentWorkflow, nodes, edges } = get();
        if (!currentWorkflow) return;

        set({ isLoading: true, error: null });
        
        try {
          const definition = { nodes, edges };
          const updatedWorkflow = await WorkflowApi.updateWorkflow(
            currentWorkflow.id,
            { definition }
          );
          
          set({ 
            currentWorkflow: updatedWorkflow,
            isDirty: false,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to save workflow',
            isLoading: false 
          });
        }
      },

      loadWorkflow: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          const workflow = await WorkflowApi.getWorkflow(id);
          set({
            currentWorkflow: workflow,
            nodes: workflow.definition.nodes,
            edges: workflow.definition.edges,
            isDirty: false,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load workflow',
            isLoading: false
          });
        }
      },

      createWorkflow: async (name, description) => {
        set({ isLoading: true, error: null });
        
        try {
          const workflow = await WorkflowApi.createWorkflow({
            name,
            description,
            definition: { nodes: [], edges: [] }
          });
          
          set({
            currentWorkflow: workflow,
            nodes: [],
            edges: [],
            isDirty: false,
            isLoading: false
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create workflow',
            isLoading: false
          });
        }
      },

      validateWorkflow: () => {
        const { nodes, edges } = get();
        const errors: string[] = [];

        // Check for start node
        const startNodes = nodes.filter(node => node.type === 'start');
        if (startNodes.length === 0) {
          errors.push('Workflow must have a start node');
        } else if (startNodes.length > 1) {
          errors.push('Workflow can only have one start node');
        }

        // Check for end node
        const endNodes = nodes.filter(node => node.type === 'end');
        if (endNodes.length === 0) {
          errors.push('Workflow must have at least one end node');
        }

        // Check for disconnected nodes
        const connectedNodeIds = new Set([
          ...edges.map(edge => edge.source),
          ...edges.map(edge => edge.target)
        ]);
        
        const disconnectedNodes = nodes.filter(node => 
          !connectedNodeIds.has(node.id) && node.type !== 'start'
        );
        
        if (disconnectedNodes.length > 0) {
          errors.push(`${disconnectedNodes.length} node(s) are not connected`);
        }

        return errors;
      },

      reset: () => set({
        currentWorkflow: null,
        nodes: [],
        edges: [],
        isLoading: false,
        error: null,
        isDirty: false
      })
    }),
    { name: 'workflow-store' }
  )
);
```

### 5. Enhanced Workflow Builder Component

#### Main workflow builder with full functionality:
```typescript
// frontend/src/components/WorkflowBuilder.tsx
import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../stores/workflowStore';
import { WorkflowNode as WorkflowNodeType } from '../types/workflow';
import { StartNode } from './nodes/StartNode';
import { EndNode } from './nodes/EndNode';
import { ActionNode } from './nodes/ActionNode';
import { DecisionNode } from './nodes/DecisionNode';
import { AINode } from './nodes/AINode';
import { NodePalette } from './NodePalette';
import { WorkflowToolbar } from './WorkflowToolbar';
import { ValidationPanel } from './ValidationPanel';

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  decision: DecisionNode,
  ai: AINode,
};

const WorkflowBuilder: React.FC = () => {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes,
    setEdges,
    addNode,
    addEdge: addStoreEdge,
    validateWorkflow,
    isLoading,
    error,
    isDirty,
  } = useWorkflowStore();

  const [nodes, , onNodesChange] = useNodesState(storeNodes);
  const [edges, , onEdgesChange] = useEdgesState(storeEdges);

  // Sync store state with React Flow state
  useEffect(() => {
    setNodes(nodes as WorkflowNodeType[]);
  }, [nodes, setNodes]);

  useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        animated: true,
      } as Edge;
      
      addStoreEdge(newEdge);
    },
    [addStoreEdge]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = (event.target as Element)
        .closest('.react-flow')
        ?.getBoundingClientRect();
      
      if (!reactFlowBounds) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: WorkflowNodeType = {
        id: `${type}-${Date.now()}`,
        type: type as any,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          description: `A ${type} node`,
        },
      };

      addNode(newNode);
    },
    [addNode]
  );

  const validationErrors = useMemo(() => validateWorkflow(), [validateWorkflow]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Node Palette */}
      <NodePalette />
      
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        <WorkflowToolbar />
        
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            className="bg-gray-50"
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <MiniMap />
          </ReactFlow>
          
          {error && (
            <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {isDirty && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded">
              Unsaved changes
            </div>
          )}
        </div>
      </div>
      
      {/* Validation Panel */}
      <ValidationPanel errors={validationErrors} />
    </div>
  );
};

export default WorkflowBuilder;
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Implement TypeScript interfaces
- [ ] Add error boundary and error handling
- [ ] Create workflow API client
- [ ] Set up Zustand store

### Week 2: Core Features
- [ ] Implement different node types
- [ ] Add drag-and-drop functionality
- [ ] Create node palette
- [ ] Add workflow validation

### Week 3: Polish & Testing
- [ ] Add visual enhancements
- [ ] Implement comprehensive testing
- [ ] Add performance optimizations
- [ ] Improve accessibility

### Week 4: Integration
- [ ] Connect to backend APIs
- [ ] Add save/load functionality
- [ ] Implement workflow execution
- [ ] Add error recovery

This plan provides a solid foundation for optimizing both tasks while maintaining code quality and user experience.