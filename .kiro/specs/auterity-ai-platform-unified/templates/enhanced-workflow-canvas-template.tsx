// Enhanced Interactive Workflow Canvas Template
// This template extends the existing ModernWorkflowBuilder with data generation and content design capabilities

import {
    AlertCircle,
    BarChart3,
    CheckCircle,
    Database,
    Eye,
    FileText,
    Loader,
    Pause,
    Play,
    Settings,
    Zap
} from 'lucide-react';
import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useDrop } from 'react-dnd';
import {
    Background,
    Connection,
    Controls,
    Edge,
    MiniMap,
    Node,
    Panel,
    ReactFlow,
    addEdge,
    useEdgesState,
    useNodesState
} from 'reactflow';

// Lazy load heavy visualization libraries
const PlotlyChart = lazy(() => import('./PlotlyChart'));
const D3Visualization = lazy(() => import('./D3Visualization'));

// Enhanced Node Types
export enum NodeType {
  DATA_SOURCE = 'dataSource',
  TRANSFORM = 'transform',
  VISUALIZATION = 'visualization',
  CONTENT = 'content',
  AI_AGENT = 'aiAgent',
  COMPLIANCE_CHECK = 'complianceCheck'
}

export enum DataSourceType {
  DATABASE = 'database',
  API = 'api',
  FILE_UPLOAD = 'fileUpload',
  REAL_TIME_STREAM = 'realTimeStream',
  INDUSTRY_CONNECTOR = 'industryConnector'
}

export enum VisualizationType {
  BAR_CHART = 'barChart',
  LINE_CHART = 'lineChart',
  PIE_CHART = 'pieChart',
  SCATTER_PLOT = 'scatterPlot',
  HEATMAP = 'heatmap',
  DASHBOARD = 'dashboard',
  TABLE = 'table',
  KPI_CARD = 'kpiCard'
}

export enum ContentType {
  REPORT = 'report',
  PRESENTATION = 'presentation',
  EMAIL = 'email',
  DOCUMENT = 'document',
  NOTIFICATION = 'notification'
}

// Enhanced Node Data Interfaces
export interface BaseNodeData {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  config: Record<string, any>;
  previewCache?: PreviewResult;
  isPreviewLoading?: boolean;
  previewError?: string;
  industryContext?: string;
  complianceRequirements?: string[];
  lastUpdated?: Date;
}

export interface DataSourceNodeData extends BaseNodeData {
  type: NodeType.DATA_SOURCE;
  dataSourceType: DataSourceType;
  connectionConfig: {
    url?: string;
    credentials?: Record<string, string>;
    query?: string;
    schema?: Record<string, any>;
    refreshInterval?: number;
  };
  outputSchema: Record<string, any>;
  sampleData?: any[];
}

export interface TransformNodeData extends BaseNodeData {
  type: NodeType.TRANSFORM;
  transformType: 'filter' | 'aggregate' | 'join' | 'calculate' | 'ai_enhance';
  transformConfig: {
    operations: TransformOperation[];
    aiModel?: string;
    complianceRules?: string[];
  };
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface VisualizationNodeData extends BaseNodeData {
  type: NodeType.VISUALIZATION;
  visualizationType: VisualizationType;
  visualizationConfig: {
    chartType: string;
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
    filters?: Record<string, any>;
    styling?: Record<string, any>;
    interactivity?: boolean;
  };
  inputSchema: Record<string, any>;
}

export interface ContentNodeData extends BaseNodeData {
  type: NodeType.CONTENT;
  contentType: ContentType;
  contentConfig: {
    template?: string;
    variables?: Record<string, any>;
    formatting?: Record<string, any>;
    distribution?: {
      channels: string[];
      schedule?: string;
      recipients?: string[];
    };
  };
  inputSchema: Record<string, any>;
}

export interface TransformOperation {
  id: string;
  type: 'filter' | 'aggregate' | 'calculate' | 'join';
  config: Record<string, any>;
  aiAssisted?: boolean;
}

// Preview System Interfaces
export interface PreviewRequest {
  nodeId: string;
  nodeType: NodeType;
  config: Record<string, any>;
  inputData?: any[];
  industryContext?: string;
  complianceLevel?: string;
  maxRows?: number;
  timeout?: number;
}

export interface PreviewResult {
  nodeId: string;
  success: boolean;
  data?: any[];
  visualization?: {
    type: string;
    config: Record<string, any>;
    chartData: any;
  };
  content?: {
    type: string;
    rendered: string;
    metadata: Record<string, any>;
  };
  metadata: {
    rowCount: number;
    processingTime: number;
    cost?: number;
    cacheKey: string;
    expiresAt: Date;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  complianceInfo?: {
    piiDetected: boolean;
    redactedFields: string[];
    complianceLevel: string;
  };
}

export interface StreamingPreviewUpdate {
  nodeId: string;
  type: 'progress' | 'partial_result' | 'complete' | 'error';
  data?: any;
  progress?: {
    current: number;
    total: number;
    message: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// Enhanced Workflow Canvas Component
interface EnhancedWorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  industryContext?: string;
  complianceLevel?: string;
  onWorkflowChange?: (nodes: Node[], edges: Edge[]) => void;
  onPreviewRequest?: (request: PreviewRequest) => Promise<PreviewResult>;
  onStreamingPreview?: (nodeId: string) => AsyncIterable<StreamingPreviewUpdate>;
  readOnly?: boolean;
}

const EnhancedWorkflowCanvas: React.FC<EnhancedWorkflowCanvasProps> = ({
  initialNodes = [],
  initialEdges = [],
  industryContext,
  complianceLevel = 'standard',
  onWorkflowChange,
  onPreviewRequest,
  onStreamingPreview,
  readOnly = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [previewPanelOpen, setPreviewPanelOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [streamingUpdates, setStreamingUpdates] = useState<Map<string, StreamingPreviewUpdate>>(new Map());

  // Preview API integration
  const requestPreview = useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !onPreviewRequest) return;

    // Update node to show loading state
    setNodes(prevNodes => 
      prevNodes.map(n => 
        n.id === nodeId 
          ? { ...n, data: { ...n.data, isPreviewLoading: true, previewError: undefined } }
          : n
      )
    );

    try {
      const previewRequest: PreviewRequest = {
        nodeId,
        nodeType: node.data.type,
        config: node.data.config,
        industryContext,
        complianceLevel,
        maxRows: 1000,
        timeout: 30000
      };

      const result = await onPreviewRequest(previewRequest);

      // Update node with preview result
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === nodeId 
            ? { 
                ...n, 
                data: { 
                  ...n.data, 
                  isPreviewLoading: false,
                  previewCache: result,
                  previewError: result.success ? undefined : result.error?.message
                }
              }
            : n
        )
      );

    } catch (error) {
      // Update node with error state
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === nodeId 
            ? { 
                ...n, 
                data: { 
                  ...n.data, 
                  isPreviewLoading: false,
                  previewError: error instanceof Error ? error.message : 'Preview failed'
                }
              }
            : n
        )
      );
    }
  }, [nodes, onPreviewRequest, industryContext, complianceLevel, setNodes]);

  // Streaming preview integration
  const startStreamingPreview = useCallback(async (nodeId: string) => {
    if (!onStreamingPreview) return;

    try {
      const stream = onStreamingPreview(nodeId);
      
      for await (const update of stream) {
        setStreamingUpdates(prev => new Map(prev.set(nodeId, update)));
        
        if (update.type === 'complete' || update.type === 'error') {
          // Update node with final result
          setNodes(prevNodes => 
            prevNodes.map(n => 
              n.id === nodeId 
                ? { 
                    ...n, 
                    data: { 
                      ...n.data, 
                      isPreviewLoading: false,
                      previewCache: update.type === 'complete' ? update.data : undefined,
                      previewError: update.type === 'error' ? update.error?.message : undefined
                    }
                  }
                : n
            )
          );
          break;
        }
      }
    } catch (error) {
      console.error('Streaming preview error:', error);
    }
  }, [onStreamingPreview, setNodes]);

  // Drop zone for new nodes
  const [{ isOver }, drop] = useDrop({
    accept: ['dataSource', 'transform', 'visualization', 'content'],
    drop: (item: { type: NodeType; subType?: string }, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset) {
        const canvasRect = document.querySelector('.react-flow')?.getBoundingClientRect();
        if (canvasRect) {
          const position = {
            x: offset.x - canvasRect.left,
            y: offset.y - canvasRect.top
          };
          
          addNodeToCanvas(item.type, item.subType, position);
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  const addNodeToCanvas = useCallback((
    nodeType: NodeType, 
    subType?: string, 
    position = { x: 100, y: 100 }
  ) => {
    const nodeId = `${nodeType}_${Date.now()}`;
    
    let nodeData: BaseNodeData;
    
    switch (nodeType) {
      case NodeType.DATA_SOURCE:
        nodeData = {
          id: nodeId,
          type: NodeType.DATA_SOURCE,
          label: 'Data Source',
          config: {},
          dataSourceType: (subType as DataSourceType) || DataSourceType.DATABASE,
          connectionConfig: {},
          outputSchema: {}
        } as DataSourceNodeData;
        break;
        
      case NodeType.VISUALIZATION:
        nodeData = {
          id: nodeId,
          type: NodeType.VISUALIZATION,
          label: 'Visualization',
          config: {},
          visualizationType: (subType as VisualizationType) || VisualizationType.BAR_CHART,
          visualizationConfig: {
            chartType: subType || 'bar'
          },
          inputSchema: {}
        } as VisualizationNodeData;
        break;
        
      default:
        nodeData = {
          id: nodeId,
          type: nodeType,
          label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
          config: {}
        };
    }

    const newNode: Node = {
      id: nodeId,
      type: 'custom',
      position,
      data: nodeData
    };

    setNodes(prevNodes => [...prevNodes, newNode]);
  }, [setNodes]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setPreviewPanelOpen(true);
  }, []);

  // Handle connection creation
  const onConnect = useCallback((connection: Connection) => {
    setEdges(prevEdges => addEdge(connection, prevEdges));
  }, [setEdges]);

  // Workflow change notification
  useEffect(() => {
    onWorkflowChange?.(nodes, edges);
  }, [nodes, edges, onWorkflowChange]);

  // Custom node component
  const CustomNode = ({ data, selected }: { data: BaseNodeData; selected: boolean }) => {
    const getNodeIcon = () => {
      switch (data.type) {
        case NodeType.DATA_SOURCE: return <Database className="w-4 h-4" />;
        case NodeType.VISUALIZATION: return <BarChart3 className="w-4 h-4" />;
        case NodeType.CONTENT: return <FileText className="w-4 h-4" />;
        case NodeType.AI_AGENT: return <Zap className="w-4 h-4" />;
        default: return <Settings className="w-4 h-4" />;
      }
    };

    const getStatusIcon = () => {
      if (data.isPreviewLoading) {
        return <Loader className="w-3 h-3 animate-spin text-blue-500" />;
      }
      if (data.previewError) {
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      }
      if (data.previewCache) {
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      }
      return null;
    };

    return (
      <div className={`
        px-4 py-2 shadow-md rounded-md bg-white border-2 min-w-[150px]
        ${selected ? 'border-blue-500' : 'border-gray-200'}
        ${data.previewError ? 'border-red-300' : ''}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getNodeIcon()}
            <span className="text-sm font-medium">{data.label}</span>
          </div>
          {getStatusIcon()}
        </div>
        
        {data.description && (
          <div className="text-xs text-gray-500 mt-1">{data.description}</div>
        )}
        
        {data.previewError && (
          <div className="text-xs text-red-500 mt-1">{data.previewError}</div>
        )}
        
        <div className="flex gap-1 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              requestPreview(data.id);
            }}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            disabled={data.isPreviewLoading}
          >
            <Eye className="w-3 h-3" />
          </button>
          
          {data.type === NodeType.DATA_SOURCE && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startStreamingPreview(data.id);
              }}
              className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              <Play className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const nodeTypes = useMemo(() => ({
    custom: CustomNode
  }), []);

  return (
    <div className="h-full w-full relative" ref={drop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className={isOver ? 'bg-blue-50' : ''}
      >
        <Background />
        <Controls />
        <MiniMap />
        
        {/* Workflow Controls Panel */}
        <Panel position="top-right" className="bg-white p-2 rounded shadow">
          <div className="flex gap-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-3 py-1 rounded text-sm ${
                isSimulating 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isSimulating ? 'Stop' : 'Simulate'}
            </button>
            
            <button
              onClick={() => setPreviewPanelOpen(!previewPanelOpen)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </Panel>
      </ReactFlow>

      {/* Preview Panel */}
      {previewPanelOpen && (
        <PreviewPanel
          selectedNode={selectedNode}
          onClose={() => setPreviewPanelOpen(false)}
          streamingUpdate={selectedNode ? streamingUpdates.get(selectedNode.id) : undefined}
        />
      )}
    </div>
  );
};

// Preview Panel Component
interface PreviewPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  streamingUpdate?: StreamingPreviewUpdate;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  selectedNode, 
  onClose, 
  streamingUpdate 
}) => {
  if (!selectedNode) return null;

  const { data } = selectedNode;
  const previewResult = data.previewCache as PreviewResult | undefined;

  const renderPreviewContent = () => {
    if (data.isPreviewLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Generating preview...</p>
            {streamingUpdate?.progress && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(streamingUpdate.progress.current / streamingUpdate.progress.total) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {streamingUpdate.progress.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (data.previewError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Preview Error</p>
            <p className="text-sm text-gray-600 mt-1">{data.previewError}</p>
          </div>
        </div>
      );
    }

    if (!previewResult) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No preview available</p>
            <p className="text-sm text-gray-500">Click the preview button to generate</p>
          </div>
        </div>
      );
    }

    // Render based on node type
    switch (data.type) {
      case NodeType.VISUALIZATION:
        return (
          <Suspense fallback={<div>Loading visualization...</div>}>
            {previewResult.visualization && (
              <div className="h-64">
                {previewResult.visualization.type === 'plotly' ? (
                  <PlotlyChart data={previewResult.visualization.chartData} />
                ) : (
                  <D3Visualization 
                    type={previewResult.visualization.type}
                    data={previewResult.visualization.chartData}
                    config={previewResult.visualization.config}
                  />
                )}
              </div>
            )}
          </Suspense>
        );

      case NodeType.CONTENT:
        return (
          <div className="h-64 overflow-auto">
            {previewResult.content && (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewResult.content.rendered }}
              />
            )}
          </div>
        );

      case NodeType.DATA_SOURCE:
      case NodeType.TRANSFORM:
      default:
        return (
          <div className="h-64 overflow-auto">
            {previewResult.data && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {Object.keys(previewResult.data[0] || {}).map(key => (
                      <th key={key} className="text-left p-2 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewResult.data.slice(0, 100).map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="p-2">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
    }
  };

  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-white shadow-lg border-l z-10">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Preview: {data.label}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {renderPreviewContent()}
        
        {previewResult && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Rows: {previewResult.metadata.rowCount}</div>
              <div>Processing: {previewResult.metadata.processingTime}ms</div>
              {previewResult.metadata.cost && (
                <div>Cost: ${previewResult.metadata.cost.toFixed(4)}</div>
              )}
              {previewResult.complianceInfo && (
                <div className={previewResult.complianceInfo.piiDetected ? 'text-yellow-600' : 'text-green-600'}>
                  {previewResult.complianceInfo.piiDetected ? 'PII Detected & Redacted' : 'No PII Detected'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedWorkflowCanvas;
export type {
    BaseNodeData, ContentNodeData, DataSourceNodeData, PreviewRequest,
    PreviewResult,
    StreamingPreviewUpdate, TransformNodeData,
    VisualizationNodeData
};
