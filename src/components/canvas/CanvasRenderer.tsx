import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Application, Graphics, Container, Text, TextStyle, Ticker, Rectangle } from 'pixi.js';
import { useStudioStore } from '../../hooks/useStudioStore';
import { StudioNode, Connection, Position } from '../../types/studio';
import { createNode as createNodeUtil } from '../../utils/nodeFactory';

interface CanvasRendererProps {
  width?: number;
  height?: number;
  className?: string;
  onNodeClick?: (nodeId: string, event: any) => void;
  onNodeDoubleClick?: (nodeId: string, event: any) => void;
  onCanvasClick?: (position: Position, event: any) => void;
  onCanvasDoubleClick?: (position: Position, event: any) => void;
}

// Object pooling for Graphics objects to reduce GC pressure
class GraphicsPool {
  private pool: Graphics[] = [];
  private maxPoolSize = 50;

  get(): Graphics {
    return this.pool.pop() || new Graphics();
  }

  release(graphics: Graphics): void {
    if (this.pool.length < this.maxPoolSize) {
      graphics.clear();
      this.pool.push(graphics);
    } else {
      graphics.destroy();
    }
  }

  clear(): void {
    this.pool.forEach(g => g.destroy());
    this.pool = [];
  }
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  width = 800,
  height = 600,
  className = '',
  onNodeClick,
  onNodeDoubleClick,
  onCanvasClick,
  onCanvasDoubleClick
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const mainContainerRef = useRef<Container | null>(null);
  const nodeLayerRef = useRef<Container | null>(null);
  const connectionLayerRef = useRef<Container | null>(null);
  const gridRef = useRef<Graphics | null>(null);

  const graphicsPoolRef = useRef(new GraphicsPool());
  const nodesGraphicsRef = useRef<Map<string, Graphics>>(new Map());
  const connectionsGraphicsRef = useRef<Map<string, Graphics>>(new Map());

  const [performanceStats, setPerformanceStats] = useState({ fps: 60, memory: 0 });
  const [isReady, setIsReady] = useState(false);

  const { state } = useStudioStore();
  const { nodes, connections, canvas: canvasState } = state;

  // Memoized node rendering data
  const nodeRenderData = useMemo(() => {
    return Array.from(nodes.values()).map(node => ({
      id: node.id,
      position: node.position,
      size: node.size || { width: 120, height: 48 },
      type: node.type,
      label: node.data?.properties?.label || node.type,
      selected: state.selection.selectedNodes.includes(node.id)
    }));
  }, [nodes, state.selection.selectedNodes]);

  // Memoized connection rendering data
  const connectionRenderData = useMemo(() => {
    return Array.from(connections.values()).map(connection => ({
      id: connection.id,
      sourceId: connection.sourceId,
      targetId: connection.targetId,
      sourcePos: nodes.get(connection.sourceId)?.position,
      targetPos: nodes.get(connection.targetId)?.position,
      selected: state.selection.selectedConnections.includes(connection.id)
    })).filter(conn => conn.sourcePos && conn.targetPos);
  }, [connections, nodes, state.selection.selectedConnections]);

  // Initialize PixiJS Application
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new Application({
      width,
      height,
      backgroundColor: canvasState.config.backgroundColor,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      clearBeforeRender: true,
    });

    appRef.current = app;
    canvasRef.current.appendChild(app.view as HTMLCanvasElement);

    // Create main container
    const mainContainer = new Container();
    mainContainerRef.current = mainContainer;
    app.stage.addChild(mainContainer);

    // Create layers
    const grid = new Graphics();
    gridRef.current = grid;
    mainContainer.addChild(grid);

    const nodeLayer = new Container();
    nodeLayer.name = 'nodeLayer';
    nodeLayerRef.current = nodeLayer;
    mainContainer.addChild(nodeLayer);

    const connectionLayer = new Container();
    connectionLayer.name = 'connectionLayer';
    connectionLayerRef.current = connectionLayer;
    mainContainer.addChild(connectionLayer);

    // Setup performance monitoring
    setupPerformanceMonitoring(app);

    // Setup interactions
    setupCanvasInteractions(app, mainContainer);

    setIsReady(true);

    // Cleanup
    return () => {
      graphicsPoolRef.current.clear();
      nodesGraphicsRef.current.clear();
      connectionsGraphicsRef.current.clear();

      if (app) {
        app.destroy(true, true);
      }
    };
  }, [width, height, canvasState.config.backgroundColor]);

  // Performance monitoring
  const setupPerformanceMonitoring = useCallback((app: Application) => {
    let frameCount = 0;
    let lastTime = performance.now();
    let memorySnapshots: number[] = [];

    app.ticker.add(() => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        // Memory monitoring
        let memory = 0;
        if ((performance as any).memory) {
          memory = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
          memorySnapshots.push(memory);

          // Keep only last 10 snapshots for leak detection
          if (memorySnapshots.length > 10) {
            memorySnapshots.shift();
          }

          // Simple leak detection
          if (memorySnapshots.length >= 5) {
            const recentAvg = memorySnapshots.slice(-3).reduce((a, b) => a + b) / 3;
            const olderAvg = memorySnapshots.slice(0, 3).reduce((a, b) => a + b) / 3;

            if (recentAvg > olderAvg * 1.2) {
              console.warn('Potential memory leak detected');
            }
          }
        }

        setPerformanceStats({ fps, memory });
        frameCount = 0;
        lastTime = currentTime;
      }
    });
  }, []);

  // Canvas interactions
  const setupCanvasInteractions = useCallback((app: Application, container: Container) => {
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let lastClickTime = 0;

    const handlePointerDown = (event: any) => {
      isDragging = true;
      dragStart = { x: event.data.global.x, y: event.data.global.y };
    };

    const handlePointerUp = (event: any) => {
      if (!isDragging) return;

      isDragging = false;
      const currentTime = Date.now();
      const clickDuration = currentTime - lastClickTime;

      // Handle clicks vs drags
      if (clickDuration < 300) { // Double click threshold
        const position = getCanvasPosition(event);
        if (onCanvasDoubleClick) {
          onCanvasDoubleClick(position, event);
        }
      } else {
        const position = getCanvasPosition(event);
        if (onCanvasClick) {
          onCanvasClick(position, event);
        }
      }

      lastClickTime = currentTime;
    };

    const handlePointerMove = (event: any) => {
      if (!isDragging) return;

      const deltaX = event.data.global.x - dragStart.x;
      const deltaY = event.data.global.y - dragStart.y;

      // Pan the canvas
      container.position.x += deltaX;
      container.position.y += deltaY;

      dragStart = { x: event.data.global.x, y: event.data.global.y };
    };

    // Add event listeners
    app.stage.interactive = true;
    app.stage.on('pointerdown', handlePointerDown);
    app.stage.on('pointerup', handlePointerUp);
    app.stage.on('pointerupoutside', handlePointerUp);
    app.stage.on('pointermove', handlePointerMove);

    return () => {
      app.stage.off('pointerdown', handlePointerDown);
      app.stage.off('pointerup', handlePointerUp);
      app.stage.off('pointerupoutside', handlePointerUp);
      app.stage.off('pointermove', handlePointerMove);
    };
  }, [onCanvasClick, onCanvasDoubleClick]);

  // Get position relative to canvas
  const getCanvasPosition = useCallback((event: any): Position => {
    if (!mainContainerRef.current) return { x: 0, y: 0 };

    const container = mainContainerRef.current;
    return {
      x: (event.data.global.x - container.position.x) / container.scale.x,
      y: (event.data.global.y - container.position.y) / container.scale.y
    };
  }, []);

  // Render nodes with object pooling
  const renderNodes = useCallback(() => {
    if (!nodeLayerRef.current) return;

    const nodeLayer = nodeLayerRef.current;

    // Remove graphics for deleted nodes
    const currentNodeIds = new Set(nodeRenderData.map(n => n.id));
    for (const [nodeId, graphics] of nodesGraphicsRef.current) {
      if (!currentNodeIds.has(nodeId)) {
        nodeLayer.removeChild(graphics);
        graphicsPoolRef.current.release(graphics);
        nodesGraphicsRef.current.delete(nodeId);
      }
    }

    // Render or update existing nodes
    nodeRenderData.forEach(nodeData => {
      let nodeGraphics = nodesGraphicsRef.current.get(nodeData.id);

      if (!nodeGraphics) {
        nodeGraphics = graphicsPoolRef.current.get();
        nodesGraphicsRef.current.set(nodeData.id, nodeGraphics);
        nodeLayer.addChild(nodeGraphics);

        // Setup node interactions
        setupNodeInteractions(nodeGraphics, nodeData.id);
      }

      // Update node appearance
      renderNodeGraphics(nodeGraphics, nodeData);
    });
  }, [nodeRenderData]);

  // Setup node interactions
  const setupNodeInteractions = useCallback((graphics: Graphics, nodeId: string) => {
    graphics.interactive = true;
    graphics.cursor = 'pointer';

    graphics.on('pointerdown', (event: any) => {
      event.stopPropagation();
      // Handle node selection/dragging
    });

    graphics.on('pointerup', (event: any) => {
      event.stopPropagation();
      if (onNodeClick) {
        onNodeClick(nodeId, event);
      }
    });

    graphics.on('pointerupoutside', (event: any) => {
      event.stopPropagation();
    });

    // Double click detection
    let lastClickTime = 0;
    graphics.on('pointertap', (event: any) => {
      const currentTime = Date.now();
      if (currentTime - lastClickTime < 300) {
        if (onNodeDoubleClick) {
          onNodeDoubleClick(nodeId, event);
        }
      }
      lastClickTime = currentTime;
    });
  }, [onNodeClick, onNodeDoubleClick]);

  // Render individual node graphics
  const renderNodeGraphics = useCallback((graphics: Graphics, nodeData: any) => {
    graphics.clear();

    const { position, size, selected, type, label } = nodeData;

    // Node background
    graphics.beginFill(selected ? 0x3b82f6 : 0x3498db);
    graphics.drawRoundedRect(position.x, position.y, size.width, size.height, 6);
    graphics.endFill();

    // Node border
    graphics.lineStyle(2, selected ? 0x1e40af : 0x2980b9);
    graphics.drawRoundedRect(position.x, position.y, size.width, size.height, 6);

    // Node type indicator
    graphics.beginFill(getNodeTypeColor(type));
    graphics.drawCircle(position.x + 20, position.y + 20, 8);
    graphics.endFill();

    // Position the graphics
    graphics.position.set(0, 0);
  }, []);

  // Render connections
  const renderConnections = useCallback(() => {
    if (!connectionLayerRef.current) return;

    const connectionLayer = connectionLayerRef.current;

    // Remove graphics for deleted connections
    const currentConnectionIds = new Set(connectionRenderData.map(c => c.id));
    for (const [connectionId, graphics] of connectionsGraphicsRef.current) {
      if (!currentConnectionIds.has(connectionId)) {
        connectionLayer.removeChild(graphics);
        graphicsPoolRef.current.release(graphics);
        connectionsGraphicsRef.current.delete(connectionId);
      }
    }

    // Render connections
    connectionRenderData.forEach(connectionData => {
      let connectionGraphics = connectionsGraphicsRef.current.get(connectionData.id);

      if (!connectionGraphics) {
        connectionGraphics = graphicsPoolRef.current.get();
        connectionsGraphicsRef.current.set(connectionData.id, connectionGraphics);
        connectionLayer.addChild(connectionGraphics);
      }

      renderConnectionGraphics(connectionGraphics, connectionData);
    });
  }, [connectionRenderData]);

  // Render connection graphics
  const renderConnectionGraphics = useCallback((graphics: Graphics, connectionData: any) => {
    graphics.clear();

    const { sourcePos, targetPos, selected } = connectionData;

    if (!sourcePos || !targetPos) return;

    // Connection line
    graphics.lineStyle(selected ? 4 : 2, selected ? 0x3b82f6 : 0x7f8c8d);
    graphics.moveTo(sourcePos.x + 60, sourcePos.y + 24); // Node center-right
    graphics.lineTo(targetPos.x, targetPos.y + 24); // Node center-left

    // Arrow head
    const angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
    const arrowLength = 10;
    graphics.lineStyle(2, selected ? 0x3b82f6 : 0x7f8c8d);
    graphics.moveTo(targetPos.x, targetPos.y + 24);
    graphics.lineTo(
      targetPos.x - arrowLength * Math.cos(angle - Math.PI / 6),
      targetPos.y + 24 - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    graphics.moveTo(targetPos.x, targetPos.y + 24);
    graphics.lineTo(
      targetPos.x - arrowLength * Math.cos(angle + Math.PI / 6),
      targetPos.y + 24 - arrowLength * Math.sin(angle + Math.PI / 6)
    );
  }, []);

  // Render grid with LOD
  const renderGrid = useCallback(() => {
    if (!gridRef.current || !mainContainerRef.current) return;

    const grid = gridRef.current;
    const container = mainContainerRef.current;
    const zoom = container.scale.x;

    grid.clear();

    if (!canvasState.config.gridEnabled) return;

    const gridSize = canvasState.config.gridSize;
    const viewportBounds = getViewportBounds();

    // Level of Detail based on zoom
    let lodFactor = 1;
    let lineAlpha = 0.3;
    let lineWidth = 1;

    if (zoom < 0.3) {
      lodFactor = 4;
      lineAlpha = 0.15;
    } else if (zoom < 0.6) {
      lodFactor = 2;
      lineAlpha = 0.2;
    } else if (zoom > 3) {
      lineWidth = 0.5;
      lineAlpha = 0.4;
    }

    grid.lineStyle(lineWidth, 0xe2e8f0, lineAlpha);

    const startX = Math.floor(viewportBounds.left / (gridSize * lodFactor)) * (gridSize * lodFactor);
    const endX = Math.ceil(viewportBounds.right / (gridSize * lodFactor)) * (gridSize * lodFactor);
    const startY = Math.floor(viewportBounds.top / (gridSize * lodFactor)) * (gridSize * lodFactor);
    const endY = Math.ceil(viewportBounds.bottom / (gridSize * lodFactor)) * (gridSize * lodFactor);

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize * lodFactor) {
      grid.moveTo(x, startY);
      grid.lineTo(x, endY);
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize * lodFactor) {
      grid.moveTo(startX, y);
      grid.lineTo(endX, y);
    }

    // Origin crosshair
    grid.lineStyle(2, 0xef4444, 0.6);
    const crosshairSize = 20;
    grid.moveTo(-crosshairSize, 0);
    grid.lineTo(crosshairSize, 0);
    grid.moveTo(0, -crosshairSize);
    grid.lineTo(0, crosshairSize);
  }, [canvasState.config]);

  // Get viewport bounds for culling
  const getViewportBounds = useCallback(() => {
    if (!mainContainerRef.current) {
      return { left: 0, top: 0, right: width, bottom: height };
    }

    const container = mainContainerRef.current;
    const zoom = container.scale.x;

    return {
      left: (-container.position.x) / zoom,
      top: (-container.position.y) / zoom,
      right: (-container.position.x + width) / zoom,
      bottom: (-container.position.y + height) / zoom
    };
  }, [width, height]);

  // Get node type color
  const getNodeTypeColor = useCallback((type: string): number => {
    const colors: Record<string, number> = {
      start: 0x10b981,    // green
      end: 0xef4444,      // red
      action: 0x3b82f6,   // blue
      decision: 0xf59e0b, // amber
      condition: 0x8b5cf6, // violet
      loop: 0x06b6d4,     // cyan
      parallel: 0x84cc16, // lime
      merge: 0xf97316,    // orange
      wait: 0x64748b,     // slate
      delay: 0x64748b     // slate
    };
    return colors[type] || 0x6b7280; // gray
  }, []);

  // Main render loop
  useEffect(() => {
    if (!isReady) return;

    renderGrid();
    renderConnections();
    renderNodes();
  }, [isReady, nodeRenderData, connectionRenderData, canvasState.config, renderGrid, renderConnections, renderNodes]);

  // Resize handler
  useEffect(() => {
    if (!appRef.current) return;

    const app = appRef.current;
    app.renderer.resize(width, height);

    // Ensure viewport stays within bounds
    const maxViewport = 50000;
    const clampedX = Math.max(-maxViewport, Math.min(maxViewport, canvasState.viewport.x));
    const clampedY = Math.max(-maxViewport, Math.min(maxViewport, canvasState.viewport.y));

    if (mainContainerRef.current) {
      mainContainerRef.current.position.set(clampedX, clampedY);
    }
  }, [width, height, canvasState.viewport]);

  return (
    <div className={`canvas-renderer ${className}`}>
      <div ref={canvasRef} className="canvas-container" />

      {/* Performance Overlay */}
      {canvasState.config.showPerformance && (
        <div className="performance-overlay">
          <div>FPS: {performanceStats.fps}</div>
          <div>Memory: {performanceStats.memory}MB</div>
          <div>Nodes: {nodeRenderData.length}</div>
          <div>Connections: {connectionRenderData.length}</div>
        </div>
      )}
    </div>
  );
};
