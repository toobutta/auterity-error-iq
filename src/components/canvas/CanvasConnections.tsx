import { useCallback, useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useStudioStore } from '../../hooks/useStudioStore.js';
import { Position, StudioNode } from '../../types/studio.js';
import { ConnectionPoint, ConnectionPath, ConnectionStyle, ConnectionType } from '../../types/connections.js';
import { ConnectionRouter } from '../../utils/connectionRouter.js';

interface CanvasConnectionsProps {
  app: Application;
  container: Container;
  connectionLayerRef: React.RefObject<Container | null>;
  onConnectionCreated?: (connection: ConnectionPath) => void;
  onConnectionDeleted?: (connectionId: string) => void;
}

interface ConnectionCreationState {
  isCreating: boolean;
  sourcePoint?: ConnectionPoint;
  previewPath?: ConnectionPath;
  validTargets: ConnectionPoint[];
  invalidTargets: ConnectionPoint[];
}

interface ConnectionEditState {
  selectedConnection?: string;
  isEditing: boolean;
  editMode: 'path' | 'properties';
  waypoints: Position[];
}

export const useCanvasConnections = ({
  app,
  container,
  connectionLayerRef,
  onConnectionCreated,
  onConnectionDeleted
}: CanvasConnectionsProps) => {
  const { state, actions } = useStudioStore();
  const { canvas, nodes, connections, selection } = state;

  // Connection state management
  const [creationState, setCreationState] = useState<ConnectionCreationState>({
    isCreating: false,
    validTargets: [],
    invalidTargets: []
  });

  const [editState, setEditState] = useState<ConnectionEditState>({
    isEditing: false,
    editMode: 'path',
    waypoints: []
  });

  // Connection graphics cache
  const connectionGraphicsRef = useRef<Map<string, Graphics>>(new Map());
  const previewGraphicsRef = useRef<Graphics | null>(null);

  // Get all connection points for all nodes
  const getAllConnectionPoints = useCallback((): ConnectionPoint[] => {
    const points: ConnectionPoint[] = [];

    for (const [nodeId, node] of nodes.entries()) {
      // Add input points (top)
      if (node.type !== 'start') {
        points.push({
          id: `${nodeId}-input-main`,
          x: node.position.x + node.size.width / 2,
          y: node.position.y,
          type: 'input',
          nodeId,
          dataType: 'any'
        });
      }

      // Add output points (bottom)
      if (node.type !== 'end') {
        points.push({
          id: `${nodeId}-output-main`,
          x: node.position.x + node.size.width / 2,
          y: node.position.y + node.size.height,
          type: 'output',
          nodeId,
          dataType: 'any'
        });
      }

      // Add decision-specific points
      if (node.type === 'decision') {
        points.push(
          {
            id: `${nodeId}-output-true`,
            x: node.position.x + node.size.width,
            y: node.position.y + node.size.height / 2,
            type: 'output',
            nodeId,
            dataType: 'boolean',
            label: 'True'
          },
          {
            id: `${nodeId}-output-false`,
            x: node.position.x,
            y: node.position.y + node.size.height / 2,
            type: 'output',
            nodeId,
            dataType: 'boolean',
            label: 'False'
          }
        );
      }
    }

    return points;
  }, [nodes]);

  // Create routing context for pathfinding
  const createRoutingContext = useCallback(() => {
    const obstacles = Array.from(nodes.values()).map(node => ({
      x: node.position.x,
      y: node.position.y,
      width: node.size.width,
      height: node.size.height
    }));

    return {
      nodes: obstacles,
      existingConnections: Array.from(connections.values()),
      viewport: canvas.viewport,
      gridSize: canvas.config.gridSize,
      snapToGrid: canvas.config.snapToGrid
    };
  }, [nodes, connections, canvas]);

  // Start connection creation
  const startConnectionCreation = useCallback((sourcePoint: ConnectionPoint) => {
    const validTargets = getAllConnectionPoints().filter(point =>
      point.nodeId !== sourcePoint.nodeId &&
      point.type !== sourcePoint.type &&
      isCompatibleConnection(sourcePoint, point)
    );

    const invalidTargets = getAllConnectionPoints().filter(point =>
      point.nodeId !== sourcePoint.nodeId &&
      point.type !== sourcePoint.type &&
      !isCompatibleConnection(sourcePoint, point)
    );

    setCreationState({
      isCreating: true,
      sourcePoint,
      validTargets,
      invalidTargets
    });
  }, [getAllConnectionPoints]);

  // Update connection preview
  const updateConnectionPreview = useCallback((mousePosition: Position) => {
    if (!creationState.isCreating || !creationState.sourcePoint) return;

    const source = creationState.sourcePoint;
    const target: ConnectionPoint = {
      id: 'preview-target',
      x: mousePosition.x,
      y: mousePosition.y,
      type: source.type === 'output' ? 'input' : 'output',
      nodeId: 'preview',
      dataType: source.dataType
    };

    const routingContext = createRoutingContext();
    const routingResult = ConnectionRouter.calculatePath(source, target, routingContext);

    const previewPath: ConnectionPath = {
      id: 'preview-connection',
      source,
      target,
      waypoints: routingResult.waypoints,
      style: createPreviewStyle(),
      metadata: {
        type: 'data',
        dataFlow: 'unidirectional',
        validation: { compatibleTypes: [], maxConnections: 1, validationRules: [] }
      }
    };

    setCreationState(prev => ({
      ...prev,
      previewPath
    }));

    // Render preview
    renderConnectionPreview(previewPath);
  }, [creationState, createRoutingContext]);

  // Complete connection creation
  const completeConnectionCreation = useCallback((targetPoint: ConnectionPoint) => {
    if (!creationState.sourcePoint || !creationState.previewPath) return;

    const source = creationState.sourcePoint;
    const routingContext = createRoutingContext();
    const routingResult = ConnectionRouter.calculatePath(source, targetPoint, routingContext);

    const newConnection: ConnectionPath = {
      id: `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source,
      target: targetPoint,
      waypoints: routingResult.waypoints,
      style: createDefaultConnectionStyle(),
      metadata: {
        type: 'data',
        dataFlow: 'unidirectional',
        validation: { compatibleTypes: [], maxConnections: 1, validationRules: [] }
      }
    };

    // Add connection to store
    actions.addConnection?.(newConnection);
    onConnectionCreated?.(newConnection);

    // Reset creation state
    cancelConnectionCreation();
  }, [creationState, createRoutingContext, actions, onConnectionCreated]);

  // Cancel connection creation
  const cancelConnectionCreation = useCallback(() => {
    setCreationState({
      isCreating: false,
      sourcePoint: undefined,
      previewPath: undefined,
      validTargets: [],
      invalidTargets: []
    });

    // Clear preview
    if (previewGraphicsRef.current && connectionLayerRef.current) {
      connectionLayerRef.current.removeChild(previewGraphicsRef.current);
      previewGraphicsRef.current = null;
    }
  }, [connectionLayerRef]);

  // Check if two connection points are compatible
  const isCompatibleConnection = useCallback((source: ConnectionPoint, target: ConnectionPoint): boolean => {
    // Basic type compatibility
    if (source.dataType === 'any' || target.dataType === 'any') return true;
    if (source.dataType === target.dataType) return true;

    // Boolean outputs can connect to any input
    if (source.dataType === 'boolean') return true;

    return false;
  }, []);

  // Create preview connection style
  const createPreviewStyle = useCallback((): ConnectionStyle => ({
    color: 0x10b981, // Green for preview
    width: 2,
    opacity: 0.7,
    animated: false,
    dashed: true,
    arrowSize: 8,
    curveType: 'bezier'
  }), []);

  // Create default connection style
  const createDefaultConnectionStyle = useCallback((): ConnectionStyle => ({
    color: 0x6b7280, // Gray
    width: 2,
    opacity: 1,
    animated: false,
    dashed: false,
    arrowSize: 8,
    curveType: 'bezier'
  }), []);

  // Render connection preview
  const renderConnectionPreview = useCallback((connection: ConnectionPath) => {
    if (!connectionLayerRef.current) return;

    const layer = connectionLayerRef.current;

    // Clear previous preview
    if (previewGraphicsRef.current) {
      layer.removeChild(previewGraphicsRef.current);
    }

    const graphics = renderConnection(connection);
    previewGraphicsRef.current = graphics;
    layer.addChild(graphics);
  }, [connectionLayerRef]);

  // Render a single connection
  const renderConnection = useCallback((connection: ConnectionPath): Graphics => {
    const graphics = new Graphics();
    const style = connection.style;

    graphics.clear();
    graphics.lineStyle(style.width, style.color, style.opacity);

    // Draw connection path
    const points = [connection.source, ...connection.waypoints, connection.target];

    if (points.length >= 2) {
      graphics.moveTo(points[0].x, points[0].y);

      if (style.curveType === 'bezier' && points.length >= 3) {
        // Draw bezier curves between waypoints
        for (let i = 1; i < points.length - 1; i += 2) {
          const cp1 = points[i];
          const cp2 = points[i + 1] || points[i];
          const end = points[i + 1] || points[i];

          graphics.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
        }
      } else {
        // Draw straight lines
        for (let i = 1; i < points.length; i++) {
          graphics.lineTo(points[i].x, points[i].y);
        }
      }

      // Draw arrowhead
      if (style.arrowSize > 0) {
        const lastPoint = points[points.length - 1];
        const secondLastPoint = points[points.length - 2];

        const angle = Math.atan2(
          lastPoint.y - secondLastPoint.y,
          lastPoint.x - secondLastPoint.x
        );

        const arrowLength = style.arrowSize;
        const arrowAngle = Math.PI / 6; // 30 degrees

        const arrowX1 = lastPoint.x - arrowLength * Math.cos(angle - arrowAngle);
        const arrowY1 = lastPoint.y - arrowLength * Math.sin(angle - arrowAngle);
        const arrowX2 = lastPoint.x - arrowLength * Math.cos(angle + arrowAngle);
        const arrowY2 = lastPoint.y - arrowLength * Math.sin(angle + arrowAngle);

        graphics.moveTo(lastPoint.x, lastPoint.y);
        graphics.lineTo(arrowX1, arrowY1);
        graphics.moveTo(lastPoint.x, lastPoint.y);
        graphics.lineTo(arrowX2, arrowY2);
      }
    }

    // Add interactive behavior
    graphics.interactive = true;
    graphics.cursor = 'pointer';

    graphics.on('pointerover', () => {
      graphics.alpha = 0.8;
      graphics.scale.set(1.05);
    });

    graphics.on('pointerout', () => {
      graphics.alpha = 1;
      graphics.scale.set(1);
    });

    graphics.on('pointerdown', (event: any) => {
      event.stopPropagation();
      // Handle connection selection/editing
      setEditState({
        selectedConnection: connection.id,
        isEditing: true,
        editMode: 'path',
        waypoints: connection.waypoints
      });
    });

    return graphics;
  }, []);

  // Render all connections
  const renderConnections = useCallback(() => {
    if (!connectionLayerRef.current) return;

    const layer = connectionLayerRef.current;

    // Remove connections that no longer exist
    for (const [connectionId, graphics] of connectionGraphicsRef.current) {
      if (!connections.has(connectionId)) {
        layer.removeChild(graphics);
        connectionGraphicsRef.current.delete(connectionId);
      }
    }

    // Add or update connections
    for (const [connectionId, connection] of connections) {
      let graphics = connectionGraphicsRef.current.get(connectionId);

      if (!graphics) {
        graphics = renderConnection(connection);
        connectionGraphicsRef.current.set(connectionId, graphics);
        layer.addChild(graphics);
      } else {
        // Update existing connection
        graphics.clear();
        const style = connection.style;

        graphics.lineStyle(style.width, style.color, style.opacity);

        const points = [connection.source, ...connection.waypoints, connection.target];

        if (points.length >= 2) {
          graphics.moveTo(points[0].x, points[0].y);

          if (style.curveType === 'bezier' && points.length >= 3) {
            for (let i = 1; i < points.length - 1; i += 2) {
              const cp1 = points[i];
              const cp2 = points[i + 1] || points[i];
              const end = points[i + 1] || points[i];

              graphics.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
            }
          } else {
            for (let i = 1; i < points.length; i++) {
              graphics.lineTo(points[i].x, points[i].y);
            }
          }
        }
      }
    }
  }, [connectionLayerRef, connections, renderConnection]);

  // Delete connection
  const deleteConnection = useCallback((connectionId: string) => {
    actions.deleteConnection?.(connectionId);
    onConnectionDeleted?.(connectionId);

    // Remove from graphics cache
    const graphics = connectionGraphicsRef.current.get(connectionId);
    if (graphics && connectionLayerRef.current) {
      connectionLayerRef.current.removeChild(graphics);
      connectionGraphicsRef.current.delete(connectionId);
    }
  }, [actions, onConnectionDeleted, connectionLayerRef]);

  // Update connection
  const updateConnection = useCallback((connectionId: string, updates: Partial<ConnectionPath>) => {
    actions.updateConnection?.(connectionId, updates);
  }, [actions]);

  // Handle keyboard shortcuts for connections
  const handleConnectionKeyboard = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (editState.selectedConnection) {
        deleteConnection(editState.selectedConnection);
        setEditState({ selectedConnection: undefined, isEditing: false, editMode: 'path', waypoints: [] });
      }
    }

    if (event.key === 'Escape') {
      if (creationState.isCreating) {
        cancelConnectionCreation();
      }
      if (editState.isEditing) {
        setEditState({ selectedConnection: undefined, isEditing: false, editMode: 'path', waypoints: [] });
      }
    }
  }, [editState, creationState, deleteConnection, cancelConnectionCreation]);

  // Setup keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleConnectionKeyboard);
    return () => window.removeEventListener('keydown', handleConnectionKeyboard);
  }, [handleConnectionKeyboard]);

  // Update connections when connections change
  useEffect(() => {
    renderConnections();
  }, [renderConnections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      connectionGraphicsRef.current.clear();
      if (previewGraphicsRef.current && connectionLayerRef.current) {
        connectionLayerRef.current.removeChild(previewGraphicsRef.current);
      }
    };
  }, [connectionLayerRef]);

  return {
    // Connection creation
    startConnectionCreation,
    updateConnectionPreview,
    completeConnectionCreation,
    cancelConnectionCreation,

    // Connection management
    deleteConnection,
    updateConnection,

    // State
    creationState,
    editState,

    // Utilities
    getAllConnectionPoints,
    isCompatibleConnection
  };
};
