import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Square,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Copy,
  Trash2,
  Settings,
  Grid,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  Database,
  Mail,
  MessageSquare,
  Bot,
} from "lucide-react";

interface WorkflowNode {
  id: string;
  type:
    | "start"
    | "end"
    | "ai_process"
    | "decision"
    | "action"
    | "data"
    | "webhook"
    | "email"
    | "notification";
  label: string;
  position: { x: number; y: number };
  data: any;
  connections: string[]; // IDs of connected nodes
  status: "idle" | "running" | "completed" | "error";
  config: {
    timeout?: number;
    retries?: number;
    conditions?: any[];
    parameters?: Record<string, any>;
  };
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  variables: Record<string, any>;
  triggers: any[];
  settings: {
    maxExecutionTime?: number;
    retryPolicy?: any;
    notifications?: any;
  };
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface NodeType {
  type: WorkflowNode["type"];
  label: string;
  icon: any;
  color: string;
  description: string;
  category: "logic" | "ai" | "communication" | "data" | "action";
}

const nodeTypes: NodeType[] = [
  {
    type: "start",
    label: "Start",
    icon: Play,
    color: "bg-green-500",
    description: "Workflow entry point",
    category: "logic",
  },
  {
    type: "end",
    label: "End",
    icon: Square,
    color: "bg-red-500",
    description: "Workflow exit point",
    category: "logic",
  },
  {
    type: "ai_process",
    label: "AI Process",
    icon: Bot,
    color: "bg-purple-500",
    description: "AI model processing",
    category: "ai",
  },
  {
    type: "decision",
    label: "Decision",
    icon: ArrowRight,
    color: "bg-yellow-500",
    description: "Conditional logic",
    category: "logic",
  },
  {
    type: "action",
    label: "Action",
    icon: Zap,
    color: "bg-blue-500",
    description: "Execute operation",
    category: "action",
  },
  {
    type: "data",
    label: "Data",
    icon: Database,
    color: "bg-indigo-500",
    description: "Data processing",
    category: "data",
  },
  {
    type: "email",
    label: "Email",
    icon: Mail,
    color: "bg-pink-500",
    description: "Send email",
    category: "communication",
  },
  {
    type: "notification",
    label: "Notification",
    icon: MessageSquare,
    color: "bg-teal-500",
    description: "Send notification",
    category: "communication",
  },
];

const AdvancedWorkflowBuilder: React.FC = () => {
  const [workflow, setWorkflow] = useState<Workflow>({
    id: "new-workflow",
    name: "New Workflow",
    description: "A new automated workflow",
    nodes: [],
    variables: {},
    triggers: [],
    settings: {},
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<NodeType | null>(null);
  const [connectingNodes, setConnectingNodes] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [activeTab, setActiveTab] = useState<"design" | "config" | "test">(
    "design",
  );

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize with start and end nodes
  useEffect(() => {
    if (workflow.nodes.length === 0) {
      const startNode: WorkflowNode = {
        id: "start",
        type: "start",
        label: "Start",
        position: { x: 100, y: 100 },
        data: {},
        connections: [],
        status: "idle",
        config: {},
      };

      const endNode: WorkflowNode = {
        id: "end",
        type: "end",
        label: "End",
        position: { x: 500, y: 100 },
        data: {},
        connections: [],
        status: "idle",
        config: {},
      };

      setWorkflow((prev) => ({
        ...prev,
        nodes: [startNode, endNode],
      }));
    }
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (draggedNode) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = (e.clientX - rect.left - panOffset.x) / zoom;
          const y = (e.clientY - rect.top - panOffset.y) / zoom;

          const newNode: WorkflowNode = {
            id: `${draggedNode.type}-${Date.now()}`,
            type: draggedNode.type,
            label: draggedNode.label,
            position: { x, y },
            data: {},
            connections: [],
            status: "idle",
            config: {},
          };

          setWorkflow((prev) => ({
            ...prev,
            nodes: [...prev.nodes, newNode],
            updatedAt: new Date().toISOString(),
          }));
        }
        setDraggedNode(null);
      } else {
        setSelectedNode(null);
      }
    },
    [draggedNode, panOffset, zoom],
  );

  const handleNodeClick = useCallback(
    (node: WorkflowNode, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedNode(node);
    },
    [],
  );

  const handleNodeDrag = useCallback(
    (nodeId: string, newPosition: { x: number; y: number }) => {
      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === nodeId ? { ...node, position: newPosition } : node,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  const handleConnectionStart = useCallback((nodeId: string) => {
    setConnectingNodes({ from: nodeId, to: "" });
  }, []);

  const handleConnectionEnd = useCallback(
    (nodeId: string) => {
      if (connectingNodes && connectingNodes.from !== nodeId) {
        setWorkflow((prev) => ({
          ...prev,
          nodes: prev.nodes.map((node) =>
            node.id === connectingNodes.from
              ? { ...node, connections: [...node.connections, nodeId] }
              : node,
          ),
          updatedAt: new Date().toISOString(),
        }));
      }
      setConnectingNodes(null);
    },
    [connectingNodes],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes
          .filter((node) => node.id !== nodeId)
          .map((node) => ({
            ...node,
            connections: node.connections.filter((id) => id !== nodeId),
          })),
        updatedAt: new Date().toISOString(),
      }));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [selectedNode],
  );

  const duplicateNode = useCallback((node: WorkflowNode) => {
    const newNode: WorkflowNode = {
      ...node,
      id: `${node.type}-${Date.now()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      connections: [],
    };

    setWorkflow((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];
    const nodes = workflow.nodes;

    // Check for start node
    const hasStart = nodes.some((node) => node.type === "start");
    if (!hasStart) {
      errors.push("Workflow must have a start node");
    }

    // Check for end node
    const hasEnd = nodes.some((node) => node.type === "end");
    if (!hasEnd) {
      errors.push("Workflow must have an end node");
    }

    // Check for disconnected nodes
    const connectedNodes = new Set<string>();
    nodes.forEach((node) => {
      node.connections.forEach((conn) => connectedNodes.add(conn));
    });

    const disconnectedNodes = nodes.filter(
      (node) =>
        node.type !== "start" &&
        node.type !== "end" &&
        !connectedNodes.has(node.id) &&
        node.connections.length === 0,
    );

    if (disconnectedNodes.length > 0) {
      errors.push(
        `${disconnectedNodes.length} nodes are not connected to the workflow`,
      );
    }

    return errors;
  }, [workflow.nodes]);

  const renderNode = useCallback(
    (node: WorkflowNode) => {
      const nodeType = nodeTypes.find((type) => type.type === node.type);
      if (!nodeType) return null;

      const Icon = nodeType.icon;
      const isSelected = selectedNode?.id === node.id;

      return (
        <div
          key={node.id}
          className={`absolute cursor-move transition-all duration-200 ${
            isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
          }`}
          style={{
            left: node.position.x * zoom + panOffset.x,
            top: node.position.y * zoom + panOffset.y,
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          onClick={(e) => handleNodeClick(node, e)}
        >
          <div className="relative">
            {/* Node Body */}
            <div
              className={`w-24 h-16 ${nodeType.color} rounded-lg shadow-lg flex flex-col items-center justify-center text-white p-2`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs text-center font-medium">
                {node.label}
              </span>
            </div>

            {/* Connection Points */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <div
                className="w-4 h-4 bg-blue-500 rounded-full cursor-crosshair hover:bg-blue-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnectionStart(node.id);
                }}
              />
            </div>

            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div
                className="w-4 h-4 bg-green-500 rounded-full cursor-crosshair hover:bg-green-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnectionEnd(node.id);
                }}
              />
            </div>

            {/* Status Indicator */}
            <div className="absolute -top-1 -right-1">
              {node.status === "running" && (
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              )}
              {node.status === "completed" && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
              {node.status === "error" && (
                <AlertTriangle className="h-3 w-3 text-red-500" />
              )}
            </div>
          </div>
        </div>
      );
    },
    [
      selectedNode,
      zoom,
      panOffset,
      handleNodeClick,
      handleConnectionStart,
      handleConnectionEnd,
    ],
  );

  const renderConnections = useCallback(() => {
    const connections: JSX.Element[] = [];

    workflow.nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        const targetNode = workflow.nodes.find((n) => n.id === targetId);
        if (!targetNode) return;

        const startX = (node.position.x + 48) * zoom + panOffset.x;
        const startY = (node.position.y + 64) * zoom + panOffset.y;
        const endX = (targetNode.position.x + 48) * zoom + panOffset.x;
        const endY = targetNode.position.y * zoom + panOffset.y;

        // Calculate control points for curved connection
        const midX = (startX + endX) / 2;
        const offset = Math.abs(endX - startX) * 0.3;

        const pathData = `M ${startX} ${startY} C ${midX + offset} ${startY}, ${midX - offset} ${endY}, ${endX} ${endY}`;

        connections.push(
          <svg
            key={`${node.id}-${targetId}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <path
              d={pathData}
              stroke="#6B7280"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          </svg>,
        );
      });
    });

    return (
      <div className="absolute inset-0">
        <svg className="w-full h-full">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
            </marker>
          </defs>
          {connections}
        </svg>
      </div>
    );
  }, [workflow.nodes, zoom, panOffset]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Toolbar */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={() => setActiveTab("design")}
          className={`p-2 rounded-lg transition-colors ${
            activeTab === "design"
              ? "bg-blue-100 text-blue-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Move className="h-5 w-5" />
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`p-2 rounded-lg transition-colors ${
            activeTab === "config"
              ? "bg-blue-100 text-blue-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          onClick={() => setActiveTab("test")}
          className={`p-2 rounded-lg transition-colors ${
            activeTab === "test"
              ? "bg-blue-100 text-blue-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Play className="h-5 w-5" />
        </button>

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <button
            onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom * 0.8, 0.3))}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${
              showGrid
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Node Palette */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Node Palette</h3>
        <div className="space-y-3">
          {nodeTypes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <div
                key={nodeType.type}
                draggable
                onDragStart={() => setDraggedNode(nodeType)}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors border-2 border-dashed border-gray-300 hover:border-blue-400"
              >
                <div
                  className={`w-8 h-8 ${nodeType.color} rounded-lg flex items-center justify-center text-white`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {nodeType.label}
                  </div>
                  <div className="text-xs text-gray-600">
                    {nodeType.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {workflow.name}
            </h1>
            <p className="text-sm text-gray-600">{workflow.description}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => {
                const errors = validateWorkflow();
                if (errors.length === 0) {
                  alert("Workflow is valid and ready to run!");
                } else {
                  alert(`Validation errors:\n${errors.join("\n")}`);
                }
              }}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
            >
              <Play className="h-4 w-4" />
              <span>Run</span>
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full relative cursor-grab"
            onClick={handleCanvasClick}
            style={{
              backgroundImage: showGrid
                ? `radial-gradient(circle at 20px 20px, #e5e7eb 1px, transparent 0)`
                : "none",
              backgroundSize: "40px 40px",
            }}
          >
            {renderConnections()}
            {workflow.nodes.map(renderNode)}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Node Properties</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label
              </label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => {
                  setWorkflow((prev) => ({
                    ...prev,
                    nodes: prev.nodes.map((node) =>
                      node.id === selectedNode.id
                        ? { ...node, label: e.target.value }
                        : node,
                    ),
                    updatedAt: new Date().toISOString(),
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="X"
                  value={Math.round(selectedNode.position.x)}
                  onChange={(e) => {
                    handleNodeDrag(selectedNode.id, {
                      ...selectedNode.position,
                      x: parseInt(e.target.value) || 0,
                    });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Y"
                  value={Math.round(selectedNode.position.y)}
                  onChange={(e) => {
                    handleNodeDrag(selectedNode.id, {
                      ...selectedNode.position,
                      y: parseInt(e.target.value) || 0,
                    });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <button
                onClick={() => duplicateNode(selectedNode)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => deleteNode(selectedNode.id)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedWorkflowBuilder;


