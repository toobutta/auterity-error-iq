import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StartNode } from './nodes/StartNode';
import { AIProcessNode } from './nodes/AIProcessNode';
import { EndNode } from './nodes/EndNode';
import {
  WorkflowDefinition,
  WorkflowValidationError,
  NodeData,
  WorkflowStep,
} from '../types/workflow';
import { validateWorkflow, validateStep } from '../utils/workflowValidation';
import { createWorkflow, updateWorkflow, getWorkflow } from '../api/workflows';
import { useWebSocket } from '../hooks/useWebSocket';
import { UserPresenceIndicator } from './collaboration/UserPresenceIndicator';
import { CollaborationToolbar } from './collaboration/CollaborationToolbar';
import { ConflictResolutionModal } from './collaboration/ConflictResolutionModal';
import { CommentPanel } from './collaboration/CommentPanel';

const nodeTypes: NodeTypes = {
  start: StartNode,
  ai_process: AIProcessNode,
  end: EndNode,
};

interface CollaborativeWorkflowBuilderProps {
  workflowId?: string;
  onSave?: (workflow: WorkflowDefinition) => void;
  onValidationChange?: (
    isValid: boolean,
    errors: WorkflowValidationError[],
  ) => void;
}

interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  cursor: { x: number; y: number };
  color: string;
  lastActivity: Date;
}

interface CollaborationSession {
  sessionId: string;
  participants: UserPresence[];
  isActive: boolean;
}

export const CollaborativeWorkflowBuilder: React.FC<CollaborativeWorkflowBuilderProps> = ({
  workflowId: propWorkflowId,
  onSave,
  onValidationChange,
}) => {
  const { id: routeWorkflowId } = useParams<{ id: string }>();
  const workflowId = propWorkflowId || routeWorkflowId;

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState<WorkflowValidationError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Collaboration state
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [userPresence, setUserPresence] = useState<UserPresence[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingConflict, setPendingConflict] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const lastOperationRef = useRef<string>('');

  // WebSocket connection for real-time collaboration
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(
    workflowId ? `/ws/workflow/${workflowId}` : null
  );

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const { type, payload } = lastMessage;

    switch (type) {
      case 'user_joined':
        setUserPresence(prev => [...prev, payload.user]);
        break;

      case 'user_left':
        setUserPresence(prev => prev.filter(user => user.userId !== payload.userId));
        break;

      case 'cursor_update':
        setUserPresence(prev =>
          prev.map(user =>
            user.userId === payload.userId
              ? { ...user, cursor: payload.cursor, lastActivity: new Date() }
              : user
          )
        );
        break;

      case 'operation_broadcast':
        handleRemoteOperation(payload.operation);
        break;

      case 'conflict_detected':
        setPendingConflict(payload.conflict);
        setShowConflictModal(true);
        break;

      case 'comment_added':
        setComments(prev => [...prev, payload.comment]);
        break;

      default:
        break;
    }
  }, [lastMessage]);

  // Handle remote operations with operational transformation
  const handleRemoteOperation = useCallback((operation: any) => {
    if (operation.userId === 'current-user') return; // Ignore our own operations

    // Apply operational transformation if needed
    const transformedOperation = transformOperation(operation);

    // Apply the operation to local state
    applyOperation(transformedOperation);
  }, []);

  // Operational transformation (simplified version)
  const transformOperation = useCallback((operation: any) => {
    // In a full implementation, this would handle complex OT algorithms
    // For now, we'll use a simple approach
    return operation;
  }, []);

  // Apply operation to local state
  const applyOperation = useCallback((operation: any) => {
    switch (operation.type) {
      case 'node_add':
        setNodes(prev => [...prev, operation.data]);
        break;
      case 'node_update':
        setNodes(prev =>
          prev.map(node =>
            node.id === operation.nodeId
              ? { ...node, ...operation.data }
              : node
          )
        );
        break;
      case 'node_delete':
        setNodes(prev => prev.filter(node => node.id !== operation.nodeId));
        break;
      case 'edge_add':
        setEdges(prev => addEdge(operation.data, prev));
        break;
      case 'edge_delete':
        setEdges(prev => prev.filter(edge => edge.id !== operation.edgeId));
        break;
      default:
        break;
    }
  }, [setNodes, setEdges]);

  // Broadcast local operations
  const broadcastOperation = useCallback((operation: any) => {
    if (connectionStatus === 'connected') {
      sendMessage({
        type: 'operation_broadcast',
        payload: { ...operation, userId: 'current-user' }
      });
    }
  }, [sendMessage, connectionStatus]);

  // Enhanced node operations with collaboration
  const addNode = useCallback((type: WorkflowStep['type']) => {
    const nodeId = `${type}-${Date.now()}`;
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };

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

    // Apply locally
    setNodes(prev => [...prev, newNode]);

    // Broadcast to other users
    broadcastOperation({
      type: 'node_add',
      nodeId,
      data: newNode
    });
  }, [setNodes, broadcastOperation]);

  // Enhanced connection with collaboration
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `${params.source}-${params.target}`,
        animated: true,
      };

      // Apply locally
      setEdges((eds) => addEdge(newEdge, eds));

      // Broadcast to other users
      broadcastOperation({
        type: 'edge_add',
        data: newEdge
      });
    },
    [setEdges, broadcastOperation]
  );

  // Cursor tracking
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (connectionStatus === 'connected' && reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const cursor = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      sendMessage({
        type: 'cursor_update',
        payload: { cursor }
      });
    }
  }, [sendMessage, connectionStatus]);

  // Comment system
  const addComment = useCallback((nodeId: string, content: string) => {
    const comment = {
      id: `comment-${Date.now()}`,
      nodeId,
      content,
      author: 'current-user',
      timestamp: new Date(),
      position: { x: 0, y: 0 } // Would be calculated based on node position
    };

    setComments(prev => [...prev, comment]);

    if (connectionStatus === 'connected') {
      sendMessage({
        type: 'comment_add',
        payload: { comment }
      });
    }
  }, [sendMessage, connectionStatus]);

  // Conflict resolution
  const resolveConflict = useCallback((resolution: 'accept' | 'reject' | 'merge') => {
    if (!pendingConflict) return;

    // Handle conflict resolution logic
    setShowConflictModal(false);
    setPendingConflict(null);

    if (connectionStatus === 'connected') {
      sendMessage({
        type: 'conflict_resolved',
        payload: {
          conflictId: pendingConflict.id,
          resolution
        }
      });
    }
  }, [pendingConflict, sendMessage, connectionStatus]);

  // Load workflow (same as original)
  const loadWorkflow = useCallback(
    async (id: string) => {
      setIsLoading(true);
      try {
        const workflow = await getWorkflow(id);
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || '');

        const flowNodes: Node<NodeData>[] = workflow.steps.map((step) => ({
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

        const flowEdges: Edge[] = workflow.connections.map((conn) => ({
          id: conn.id,
          source: conn.source,
          target: conn.target,
          label: conn.label,
          animated: true,
        }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (error: unknown) {

      } finally {
        setIsLoading(false);
      }
    },
    [setNodes, setEdges]
  );

  // Initialize workflow
  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    } else {
      setNodes([
        {
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 50 },
          data: {
            label: 'Start',
            description: 'Workflow entry point',
            type: 'start',
            config: {},
          },
        },
        {
          id: 'end-1',
          type: 'end',
          position: { x: 250, y: 300 },
          data: {
            label: 'End',
            description: 'Workflow completion',
            type: 'end',
            config: {},
          },
        }
      ]);
      setEdges([]);
    }
  }, [workflowId, loadWorkflow, setNodes, setEdges]);

  // Validation (same as original)
  useEffect(() => {
    const workflow: WorkflowDefinition = {
      name: workflowName,
      description: workflowDescription,
      steps: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        name: node.data.label,
        description: node.data.description,
        config: node.data.config,
        position: node.position,
      })),
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label as string | undefined,
      })),
    };

    const errors = validateWorkflow(workflow);
    setValidationErrors(errors);

    const updatedNodes = nodes.map((node) => ({
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

  // Save workflow (same as original)
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
        steps: nodes.map((node) => ({
          id: node.id,
          type: node.data.type,
          name: node.data.label,
          description: node.data.description,
          config: node.data.config,
          position: node.position,
        })),
        connections: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label as string | undefined,
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

      alert('Failed to save workflow. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading collaborative workflow...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Collaboration Header */}
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

        <div className="flex items-center space-x-4">
          {/* User Presence Indicator */}
          <UserPresenceIndicator
            users={userPresence}
            connectionStatus={connectionStatus}
          />

          {/* Collaboration Toolbar */}
          <CollaborationToolbar
            onAddComment={addComment}
            selectedNodeId={selectedNodeId}
            comments={comments}
          />

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

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Node Palette */}
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

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-red-600 mb-2">Validation Errors</h4>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className="text-xs text-red-600 bg-red-50 p-2 rounded"
                  >
                    {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* React Flow Canvas with Collaboration */}
        <div
          className="flex-1 relative"
          ref={reactFlowWrapper}
          onMouseMove={handleMouseMove}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <MiniMap />

            {/* User Cursors */}
            {userPresence.map((user) => (
              <div
                key={user.userId}
                className="absolute pointer-events-none z-50"
                style={{
                  left: user.cursor.x,
                  top: user.cursor.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: user.color }}
                />
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {user.username}
                </div>
              </div>
            ))}

            <Panel position="top-right">
              <div className="bg-white p-2 rounded shadow text-sm">
                <div>Nodes: {nodes.length}</div>
                <div>Connections: {edges.length}</div>
                <div className="mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Comments Panel */}
        <CommentPanel
          comments={comments.filter(comment => comment.nodeId === selectedNodeId)}
          onAddComment={addComment}
          selectedNodeId={selectedNodeId}
        />
      </div>

      {/* Conflict Resolution Modal */}
      {showConflictModal && pendingConflict && (
        <ConflictResolutionModal
          conflict={pendingConflict}
          onResolve={resolveConflict}
          onClose={() => setShowConflictModal(false)}
        />
      )}
    </div>
  );
};

export default CollaborativeWorkflowBuilder;


