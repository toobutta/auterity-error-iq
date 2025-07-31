import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { StartNode } from './nodes/StartNode';
import { AIProcessNode } from './nodes/AIProcessNode';
import { EndNode } from './nodes/EndNode';
import { WorkflowDefinition, WorkflowValidationError, NodeData, WorkflowStep } from '../types/workflow';
import { validateWorkflow, validateStep } from '../utils/workflowValidation';
import { createWorkflow, updateWorkflow, getWorkflow } from '../api/workflows';

const nodeTypes: NodeTypes = {
  start: StartNode,
  ai_process: AIProcessNode,
  end: EndNode,
};

interface WorkflowBuilderProps {
  workflowId?: string;
  onSave?: (workflow: WorkflowDefinition) => void;
  onValidationChange?: (isValid: boolean, errors: WorkflowValidationError[]) => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflowId: propWorkflowId,
  onSave,
  onValidationChange
}) => {
  const { id: routeWorkflowId } = useParams<{ id: string }>();
  const workflowId = propWorkflowId || routeWorkflowId;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState<WorkflowValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showNodePanel, setShowNodePanel] = useState(false);

  // Load existing workflow if workflowId is provided
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    } else {
      // Initialize with default start and end nodes
      initializeDefaultWorkflow();
    }
  }, [workflowId, initializeDefaultWorkflow, loadWorkflow]);

  const loadWorkflow = async (id: string) => {
    setIsLoading(true);
    try {
      const workflow = await getWorkflow(id);
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');

      // Convert workflow steps to React Flow nodes
      const flowNodes: Node<NodeData>[] = workflow.steps.map(step => ({
        id: step.id,
        type: step.type,
        position: step.position,
        data: {
          label: step.name,
          description: step.description,
          type: step.type,
          config: step.config,
          validationErrors: validateStep(step),
        },
      }));

      // Convert workflow connections to React Flow edges
      const flowEdges: Edge[] = workflow.connections.map(conn => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        label: conn.label,
        animated: true,
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error: unknown) {
      console.error('Failed to load workflow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultWorkflow = () => {
    const startNode: Node<NodeData> = {
      id: 'start-1',
      type: 'start',
      position: { x: 250, y: 50 },
      data: {
        label: 'Start',
        description: 'Workflow entry point',
        type: 'start',
        config: {},
      },
    };

    const endNode: Node<NodeData> = {
      id: 'end-1',
      type: 'end',
      position: { x: 250, y: 300 },
      data: {
        label: 'End',
        description: 'Workflow completion',
        type: 'end',
        config: {},
      },
    };

    setNodes([startNode, endNode]);
    setEdges([]);
  };

  // Validate workflow whenever nodes or edges change
  useEffect(() => {
    const workflow: WorkflowDefinition = {
      name: workflowName,
      description: workflowDescription,
      steps: nodes.map(node => ({
        id: node.id,
        type: node.data.type,
        name: node.data.label,
        description: node.data.description,
        config: node.data.config,
        position: node.position,
      })),
      connections: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label as string | undefined,
      })),
    };

    const errors = validateWorkflow(workflow);
    setValidationErrors(errors);

    // Update node validation errors
    const updatedNodes = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        validationErrors: validateStep({
          id: node.id,
          type: node.data.type,
          name: node.data.label,
          description: node.data.description,
          config: node.data.config,
          position: node.position,
        }),
      },
    }));

    if (JSON.stringify(updatedNodes) !== JSON.stringify(nodes)) {
      setNodes(updatedNodes);
    }

    onValidationChange?.(errors.length === 0, errors);
  }, [nodes, edges, workflowName, workflowDescription, onValidationChange, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}`,
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addNode = (type: WorkflowStep['type']) => {
    const nodeId = `${type}-${Date.now()}`;
    const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };

    let label = '';
    let description = '';
    let config = {};

    switch (type) {
      case 'start':
        label = 'Start';
        description = 'Workflow entry point';
        break;
      case 'ai_process':
        label = 'AI Process';
        description = 'AI-powered processing step';
        config = { prompt: '' };
        break;
      case 'end':
        label = 'End';
        description = 'Workflow completion';
        break;
    }

    const newNode: Node<NodeData> = {
      id: nodeId,
      type,
      position,
      data: {
        label,
        description,
        type,
        config,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const updateNodeData = (nodeId: string, updates: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  };

  const saveWorkflow = async () => {
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before saving');
      return;
    }

    setIsSaving(true);
    try {
      const workflow: WorkflowDefinition = {
        name: workflowName,
        description: workflowDescription,
        steps: nodes.map(node => ({
          id: node.id,
          type: node.data.type,
          name: node.data.label,
          description: node.data.description,
          config: node.data.config,
          position: node.position,
        })),
        connections: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: typeof edge.label === 'string' ? edge.label : undefined,
        })),
      };

      let savedWorkflow: WorkflowDefinition;
      if (workflowId) {
        savedWorkflow = await updateWorkflow(workflowId, workflow);
      } else {
        savedWorkflow = await createWorkflow(workflow);
      }

      onSave?.(savedWorkflow);
      alert('Workflow saved successfully!');
    } catch (error: unknown) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setShowNodePanel(true);
  }, []);

  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-xl font-bold bg-transparent border-none outline-none"
            placeholder="Workflow Name"
          />
          <input
            type="text"
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            className="text-sm text-gray-600 bg-transparent border-none outline-none block mt-1"
            placeholder="Workflow Description"
          />
        </div>
        <div className="flex items-center space-x-2">
          {validationErrors.length > 0 && (
            <span className="text-red-500 text-sm">
              {validationErrors.length} error{validationErrors.length > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={saveWorkflow}
            disabled={isSaving || validationErrors.length > 0}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Node palette */}
        <div className="w-64 bg-gray-50 border-r p-4">
          <h3 className="font-bold mb-4">Add Nodes</h3>
          <div className="space-y-2">
            <button
              onClick={() => addNode('start')}
              className="w-full p-2 bg-green-100 border border-green-300 rounded hover:bg-green-200 text-left"
            >
              <div className="font-medium">Start Node</div>
              <div className="text-xs text-gray-600">Workflow entry point</div>
            </button>
            <button
              onClick={() => addNode('ai_process')}
              className="w-full p-2 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 text-left"
            >
              <div className="font-medium">AI Process</div>
              <div className="text-xs text-gray-600">AI-powered processing</div>
            </button>
            <button
              onClick={() => addNode('end')}
              className="w-full p-2 bg-red-100 border border-red-300 rounded hover:bg-red-200 text-left"
            >
              <div className="font-medium">End Node</div>
              <div className="text-xs text-gray-600">Workflow completion</div>
            </button>
          </div>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-red-600 mb-2">Validation Errors</h4>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* React Flow canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <MiniMap />

            <Panel position="top-right">
              <div className="bg-white p-2 rounded shadow text-sm">
                <div>Nodes: {nodes.length}</div>
                <div>Connections: {edges.length}</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Node properties panel */}
        {showNodePanel && selectedNode && (
          <div className="w-80 bg-white border-l p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Node Properties</h3>
              <button
                onClick={() => setShowNodePanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={selectedNode.data.description || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={2}
                />
              </div>

              {selectedNode.data.type === 'ai_process' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Prompt
                  </label>
                  <textarea
                    value={selectedNode.data.config.prompt || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, {
                      config: { ...selectedNode.data.config, prompt: e.target.value }
                    })}
                    className="w-full p-2 border border-gray-300 rounded"
                    rows={4}
                    placeholder="Enter the AI prompt for this step..."
                  />
                </div>
              )}

              {selectedNode.data.validationErrors && selectedNode.data.validationErrors.length > 0 && (
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-sm font-medium text-red-600 mb-1">Validation Errors:</div>
                  {selectedNode.data.validationErrors.map((error: string, index: number) => (
                    <div key={index} className="text-xs text-red-600">{error}</div>
                  ))}
                </div>
              )}

              <button
                onClick={() => deleteNode(selectedNode.id)}
                className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Node
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;
