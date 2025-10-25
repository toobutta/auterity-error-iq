import React, { useCallback, useRef, useEffect, useState } from "react";
import { useDrop } from "react-dnd";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
  MiniMap,
  Panel,
  ReactFlowProvider,
  ReactFlowInstance,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";

import {
  WorkflowCanvasProps,
  WorkflowNode,
  DragItem,
  NodeTemplate,
} from "../../types/workflow-builder";
import { NodeData as LegacyNodeData } from "../../types/workflow";

// Import Unified AI Service components
import { AIServiceProvider, useAIServiceContext } from "../templates/ai-integration";
import { useUnifiedAIService } from "../templates/ai-integration";

// Import existing node components
import { StartNode } from "../nodes/StartNode";
import { AIProcessNode } from "../nodes/AIProcessNode";
import { EndNode } from "../nodes/EndNode";

// Import automotive node components
import {
  CustomerInquiryNode,
  InventoryUpdateNode,
  ServiceAppointmentNode,
  SendEmailNode,
  UpdateCRMNode,
  ScheduleAppointmentNode,
  GenerateQuoteNode,
  InventoryCheckNode,
  CustomerTypeNode,
  BudgetRangeNode,
  VehiclePreferenceNode,
  GeographicLocationNode,
  LeadQualificationNode,
  PriceOptimizationNode,
  CustomerSentimentNode,
  RecommendationEngineNode,
  CrewAINode,
  LangGraphNode,
} from "./nodes";

// Import Unified AI Service Node (we'll create this)
import UnifiedAINode from "./nodes/UnifiedAINode";

const nodeTypes: NodeTypes = {
  // Legacy nodes
  start: StartNode,
  ai_process: AIProcessNode,
  end: EndNode,

  // Trigger nodes
  customer_inquiry: CustomerInquiryNode,
  inventory_update: InventoryUpdateNode,
  service_appointment: ServiceAppointmentNode,
  lead_generation: StartNode,

  // Action nodes
  send_email: SendEmailNode,
  update_crm: UpdateCRMNode,
  schedule_appointment: ScheduleAppointmentNode,
  generate_quote: GenerateQuoteNode,
  inventory_check: InventoryCheckNode,

  // Condition nodes
  customer_type: CustomerTypeNode,
  budget_range: BudgetRangeNode,
  vehicle_preference: VehiclePreferenceNode,
  geographic_location: GeographicLocationNode,

  // AI-powered nodes
  lead_qualification: LeadQualificationNode,
  price_optimization: PriceOptimizationNode,
  customer_sentiment: CustomerSentimentNode,
  recommendation_engine: RecommendationEngineNode,

  // CrewAI multi-agent collaboration
  crewai: CrewAINode,

  // LangGraph workflow orchestration
  langgraph: LangGraphNode,

  // Unified AI Service integration
  unified_ai: UnifiedAINode,
};

interface WorkflowCanvasInternalProps extends WorkflowCanvasProps {
  selectedNode: WorkflowNode | null;
  onNodeSelect: (node: WorkflowNode | null) => void;
}

const WorkflowCanvasInternal: React.FC<WorkflowCanvasInternalProps> = ({
  workflowId,
  onSave,
  onTest,
  selectedNode,
  onNodeSelect,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Drop zone for dragging nodes from palette
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "workflow-node",
    drop: (item: DragItem, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = (reactFlowInstance as ReactFlowInstance).screenToFlowPosition({
        x: clientOffset.x - reactFlowBounds.left,
        y: clientOffset.y - reactFlowBounds.top,
      });

      addNodeFromTemplate(item.template, position);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const addNodeFromTemplate = useCallback(
    (
      template: NodeTemplate,
      position: { x: number; y: number },
    ) => {
      const nodeId = uuidv4();

      // Convert template to ReactFlow node format
      const newNode: Node<LegacyNodeData> = {
        id: nodeId,
        type: template.type,
        position,
        data: {
          label: template.label,
          description: template.description,
          type: template.type,
          config: template.config || {},
          validationErrors: [],
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: uuidv4(),
        animated: true,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as LegacyNodeData;
      // Convert ReactFlow node to WorkflowNode format
      const workflowNode: WorkflowNode = {
        id: node.id,
        type:
          nodeData.type === "start"
            ? "trigger"
            : nodeData.type === "end"
              ? "action"
              : nodeData.type.includes("condition")
                ? "condition"
                : nodeData.type.includes("ai")
                  ? "ai_step"
                  : "action",
        position: node.position,
        data: {
          label: nodeData.label,
          description: nodeData.description,
          type: nodeData.type,
          config: nodeData.config,
          validation: [],
          validationErrors: nodeData.validationErrors,
        },
        connections: [], // We'll populate this from edges if needed
      };

      onNodeSelect(workflowNode);
    },
    [onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== selectedNode.id && edge.target !== selectedNode.id,
        ),
      );
      onNodeSelect(null);
    }
  }, [selectedNode, setNodes, setEdges, onNodeSelect]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedNode && document.activeElement?.tagName !== "INPUT") {
          event.preventDefault();
          deleteSelectedNode();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return (): void => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, deleteSelectedNode]);

  // Combine refs for drop functionality
  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        reactFlowWrapper.current = node;
        drop(node);
      }
    },
    [drop],
  );

  const handleSave = useCallback(() => {
    const workflow = {
      id: workflowId || uuidv4(),
      name: "Automotive Workflow",
      description: "Auto-generated workflow",
      category: "sales" as const,
      steps: nodes.map((node) => {
        const nodeData = node.data as LegacyNodeData;
        return {
          id: node.id,
          type: nodeData.type,
          name: nodeData.label,
          description: nodeData.description,
          config: nodeData.config,
          position: node.position,
        };
      }),
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label as string | undefined,
      })),
      triggers: [],
      variables: [],
      version: 1,
      status: "draft" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onSave(workflow);
  }, [workflowId, nodes, edges, onSave]);

  const handleTest = useCallback(() => {
    const workflow = {
      id: workflowId || uuidv4(),
      name: "Automotive Workflow",
      description: "Auto-generated workflow",
      category: "sales" as const,
      steps: nodes.map((node) => {
        const nodeData = node.data as LegacyNodeData;
        return {
          id: node.id,
          type: nodeData.type,
          name: nodeData.label,
          description: nodeData.description,
          config: nodeData.config,
          position: node.position,
        };
      }),
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label as string | undefined,
      })),
      triggers: [],
      variables: [],
      version: 1,
      status: "draft" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onTest(workflow);
  }, [workflowId, nodes, edges, onTest]);

  return (
    <div className="flex-1 relative" ref={combinedRef}>
      {/* Drop overlay */}
      {isOver && canDrop && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-dashed border-blue-400 z-10 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="text-blue-600 text-lg font-medium">
              Drop node here
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
        connectionLineStyle={{ stroke: "#3b82f6", strokeWidth: 2 }}
        defaultEdgeOptions={{
          style: { stroke: "#3b82f6", strokeWidth: 2 },
          animated: true,
        }}
      >
        <Background color="#e5e7eb" gap={20} size={1} />
        <Controls className="bg-white border border-gray-200 rounded-lg shadow-sm" />
        <MiniMap
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
          nodeColor={(node) => {
            switch (node.data?.type) {
              case "start":
              case "customer_inquiry":
              case "inventory_update":
              case "service_appointment":
              case "lead_generation":
                return "#fbbf24"; // Yellow for triggers
              case "send_email":
              case "update_crm":
              case "schedule_appointment":
              case "generate_quote":
              case "inventory_check":
                return "#3b82f6"; // Blue for actions
              case "customer_type":
              case "budget_range":
              case "vehicle_preference":
              case "geographic_location":
                return "#8b5cf6"; // Purple for conditions
              case "lead_qualification":
              case "price_optimization":
              case "customer_sentiment":
              case "recommendation_engine":
              case "ai_process":
                return "#10b981"; // Green for AI
              case "end":
                return "#ef4444"; // Red for end
              default:
                return "#6b7280"; // Gray for unknown
            }
          }}
        />

        {/* Toolbar Panel */}
        <Panel position="top-right">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 space-y-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span>Save</span>
              </button>
              <button
                onClick={handleTest}
                disabled={nodes.length === 0}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Test</span>
              </button>
            </div>

            {selectedNode && (
              <button
                onClick={deleteSelectedNode}
                className="w-full px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Delete Node</span>
              </button>
            )}
          </div>
        </Panel>

        {/* Stats Panel */}
        <Panel position="top-left">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Nodes: {nodes.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Connections: {edges.length}</span>
              </div>
              {selectedNode && (
                <div className="flex items-center space-x-2 pt-1 border-t border-gray-200">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span className="font-medium">
                    Selected: {selectedNode.data.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrapper component with ReactFlowProvider and AI Service Provider
const WorkflowCanvas: React.FC<
  WorkflowCanvasProps & {
    selectedNode: WorkflowNode | null;
    onNodeSelect: (node: WorkflowNode | null) => void;
  }
> = (props) => {
  return (
    <AIServiceProvider initialConfig={{
      defaultProvider: 'gpt-4',
      enableRouting: true,
      enableCostOptimization: true,
      enableCaching: true,
      fallbackEnabled: true,
      monitoringEnabled: true
    }}>
      <ReactFlowProvider>
        <WorkflowCanvasInternal {...props} />
      </ReactFlowProvider>
    </AIServiceProvider>
  );
};

export default WorkflowCanvas;


