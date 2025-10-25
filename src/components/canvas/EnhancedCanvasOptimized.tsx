import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js';
import { useStudioStore } from '../../hooks/useStudioStore.js';
import { StudioNode, Connection, Position, NodeType } from '../../types/studio.js';
import { createNode as createNodeUtil } from '../../utils/nodeFactory.js';
import { ConnectionRenderer } from './ConnectionRenderer.js';
import {
  ConnectionPoint,
  ConnectionPath,
  ConnectionUIState,
  ConnectionStyle
} from '../../types/connections.js';
import { ConnectionRouter } from '../../utils/connectionRouter.js';
import { CanvasInteractions } from './CanvasInteractions.js';
import { CanvasTools } from './CanvasTools.js';
import { CanvasStateProvider, useCanvasState } from './CanvasState.js';
import './EnhancedCanvas.css';

// Object pooling for Graphics objects to reduce GC pressure
class GraphicsPool {
  private pool: Graphics[] = [];
  private maxPoolSize = 100;

  get(): Graphics {
    return this.pool.pop() || new Graphics();
  }

  release(graphics: Graphics): void {
    if (this.pool.length < this.maxPoolSize) {
      graphics.clear();
      this.pool.push(graphics);
    }
  }

  clear(): void {
    this.pool.forEach(g => g.destroy());
    this.pool = [];
  }
}

// Enhanced Canvas Component with optimized architecture
const EnhancedCanvasContent: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const containerRef = useRef<Container | null>(null);
  const gridRef = useRef<Graphics | null>(null);
  const graphicsPoolRef = useRef(new GraphicsPool());

  const [performanceStats, setPerformanceStats] = useState({ fps: 60, memory: 0 });
  const [connectionUI, setConnectionUI] = useState<ConnectionUIState>({
    creation: {
      isCreating: false,
      sourcePoint: undefined,
      previewPath: undefined,
      validTargets: [],
      invalidTargets: []
    },
    editor: {
      selectedConnection: undefined,
      isEditing: false,
      editMode: 'path',
      waypoints: []
    },
    hover: {
      connection: undefined,
      point: undefined
    },
    selection: {
      connections: [],
      multiSelect: false
    }
  });

  // Use optimized Zustand store
  const { state: canvasState, actions: canvasActions } = useCanvasState();
  const { state: studioState } = useStudioStore();

  // Memoized expensive calculations
  const processedNodes = useMemo(() => {
    return Array.from(canvasState.nodes.values()).map(node => ({
      ...node,
      screenPosition: {
        x: (node.position.x - canvasState.viewport.x) / canvasState.viewport.zoom,
        y: (node.position.y - canvasState.viewport.y) / canvasState.viewport.zoom
      },
      isVisible: true, // Will be calculated based on viewport bounds
      style: node.style
    }));
  }, [canvasState.nodes, canvasState.viewport]);

  // Create node function with optimization
  const createNode = useCallback((nodeType: NodeType, position: Position) => {
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNode = createNodeUtil(nodeType, position, nodeId);
    canvasActions.addNode(newNode);
    canvasActions.selectNodes([nodeId]);
  }, [canvasActions]);

  // Initialize PixiJS Application with optimizations
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new Application({
      width: canvasState.config.width,
      height: canvasState.config.height,
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
    containerRef.current = mainContainer;
    app.stage.addChild(mainContainer);

    // Create layers
    const grid = new Graphics();
    gridRef.current = grid;
    mainContainer.addChild(grid);

    const nodeLayer = new Container();
    nodeLayer.name = 'nodeLayer';
    mainContainer.addChild(nodeLayer);

    const connectionLayer = new Container();
    connectionLayer.name = 'connectionLayer';
    mainContainer.addChild(connectionLayer);

    // Setup performance monitoring
    setupPerformanceMonitoring(app);

    return () => {
      graphicsPoolRef.current.clear();
      if (app) {
        app.destroy(true, true);
      }
    };
  }, [canvasState.config]);

  // Performance monitoring
  const setupPerformanceMonitoring = useCallback((app: Application) => {
    let frameCount = 0;
    let lastTime = performance.now();

    app.ticker.add(() => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        const memory = (performance as any).memory
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0;

        setPerformanceStats({ fps, memory });
        frameCount = 0;
        lastTime = currentTime;
      }
    });
  }, []);

  // Update viewport transform
  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.position.set(canvasState.viewport.x, canvasState.viewport.y);
    containerRef.current.scale.set(canvasState.viewport.zoom);
  }, [canvasState.viewport]);

  // Render grid with LOD
  useEffect(() => {
    if (!gridRef.current || !canvasState.config.gridEnabled) return;

    const grid = gridRef.current;
    grid.clear();

    if (!canvasState.config.gridEnabled) return;

    const gridSize = canvasState.config.gridSize;
    const zoom = canvasState.viewport.zoom;

    // Level of Detail based on zoom level
    let lodFactor = 1;
    let lineOpacity = 0.3;
    let lineWidth = 1;

    if (zoom < 0.3) {
      lodFactor = 4;
      lineOpacity = 0.15;
    } else if (zoom < 0.6) {
      lodFactor = 2;
      lineOpacity = 0.2;
    } else if (zoom > 3) {
      lineWidth = 0.5;
      lineOpacity = 0.4;
    }

    // Calculate grid bounds
    const bounds = {
      left: -canvasState.viewport.x / zoom - 200,
      top: -canvasState.viewport.y / zoom - 200,
      right: (-canvasState.viewport.x + canvasState.config.width) / zoom + 200,
      bottom: (-canvasState.viewport.y + canvasState.config.height) / zoom + 200
    };

    grid.lineStyle(lineWidth, canvasState.config.gridColor, lineOpacity);

    // Draw vertical lines
    for (let x = Math.floor(bounds.left / gridSize) * gridSize; x <= bounds.right; x += gridSize * lodFactor) {
      const screenX = (x - canvasState.viewport.x) / zoom;
      if (screenX >= -100 && screenX <= canvasState.config.width + 100) {
        grid.moveTo(screenX, -100);
        grid.lineTo(screenX, canvasState.config.height + 100);
      }
    }

    // Draw horizontal lines
    for (let y = Math.floor(bounds.top / gridSize) * gridSize; y <= bounds.bottom; y += gridSize * lodFactor) {
      const screenY = (y - canvasState.viewport.y) / zoom;
      if (screenY >= -100 && screenY <= canvasState.config.height + 100) {
        grid.moveTo(-100, screenY);
        grid.lineTo(canvasState.config.width + 100, screenY);
      }
    }
  }, [canvasState.config, canvasState.viewport]);

  // Render nodes with object pooling
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const nodeLayer = container.children.find(child => child.name === 'nodeLayer') as Container;
    if (!nodeLayer) return;

    // Clear existing nodes
    nodeLayer.removeChildren();

    // Render nodes using object pool
    processedNodes.forEach(nodeData => {
      const graphics = graphicsPoolRef.current.get();
      renderNode(graphics, nodeData);
      nodeLayer.addChild(graphics);
    });

    // Return graphics to pool after a delay to prevent flickering
    setTimeout(() => {
      // This would be handled by a more sophisticated pooling system
    }, 100);
  }, [processedNodes]);

  // Optimized node rendering
  const renderNode = useCallback((graphics: Graphics, node: StudioNode) => {
    graphics.clear();
    graphics.position.set(node.position.x, node.position.y);

    const style = node.style;
    const isSelected = canvasState.selectedNodes.includes(node.id);

    // Draw node background
    graphics.beginFill(style.backgroundColor, style.opacity);
    graphics.lineStyle(
      style.borderWidth + (isSelected ? 2 : 0),
      isSelected ? 0x3b82f6 : style.borderColor
    );

    if (node.type === 'decision') {
      const halfWidth = node.size.width / 2;
      const halfHeight = node.size.height / 2;
      graphics.moveTo(halfWidth, 0);
      graphics.lineTo(node.size.width, halfHeight);
      graphics.lineTo(halfWidth, node.size.height);
      graphics.lineTo(0, halfHeight);
      graphics.lineTo(halfWidth, 0);
    } else {
      graphics.drawRoundedRect(0, 0, node.size.width, node.size.height, style.borderRadius);
    }

    graphics.endFill();

    // Add text label
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: style.fontSize,
      fontWeight: style.fontWeight as any,
      fill: style.textColor,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: node.size.width - 16,
    });

    const text = new Text(node.data.label, textStyle);
    text.anchor.set(0.5);
    text.position.set(node.size.width / 2, node.size.height / 2);
    graphics.addChild(text);
  }, [canvasState.selectedNodes]);

  return (
    <div
      ref={canvasRef}
      className="enhanced-canvas"
      style={{
        cursor: canvasState.activeTool === 'pan' ? 'grab' :
               canvasState.activeTool === 'zoom' ? 'zoom-in' :
               canvasState.activeTool === 'node-create' ? 'copy' :
               canvasState.activeTool === 'connection-create' ? 'crosshair' :
               canvasState.activeTool === 'lasso-select' ? 'crosshair' :
               canvasState.activeTool === 'rectangle-select' ? 'crosshair' : 'default',
      }}
    >
      {/* Performance Monitor */}
      {canvasState.config.showPerformance && (
        <div className="canvas-performance-overlay">
          <div>FPS: {performanceStats.fps}</div>
          <div>Zoom: {canvasState.viewport.zoom.toFixed(2)}x</div>
          <div>Nodes: {canvasState.nodes.size}</div>
          {performanceStats.memory > 0 && <div>Memory: {performanceStats.memory}MB</div>}
        </div>
      )}

      {/* Zoom Level Indicator */}
      <div className="zoom-indicator">
        {Math.round(canvasState.viewport.zoom * 100)}%
      </div>

      {/* Canvas Controls */}
      <button
        className="canvas-control-button grid-toggle"
        onClick={canvasActions.toggleGrid}
        title={canvasState.config.gridEnabled ? 'Hide Grid (Ctrl+G)' : 'Show Grid (Ctrl+G)'}
      >
        ▦
      </button>

      <button
        className="canvas-control-button snap-toggle"
        onClick={canvasActions.toggleSnapToGrid}
        title={canvasState.config.snapToGrid ? 'Disable Snap to Grid (Ctrl+S)' : 'Enable Snap to Grid (Ctrl+S)'}
      >
        ⊞
      </button>

      <button
        className="canvas-control-button zoom-fit"
        onClick={() => canvasActions.updateViewport({ x: 0, y: 0, zoom: 1 })}
        title="Zoom to Fit (0)"
      >
        🎯
      </button>
    </div>
  );
});

EnhancedCanvasContent.displayName = 'EnhancedCanvasContent';

// Main Enhanced Canvas Component with State Provider
export const EnhancedCanvas: React.FC = () => {
  return (
    <CanvasStateProvider>
      <EnhancedCanvasContent />
    </CanvasStateProvider>
  );
};
