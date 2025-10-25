import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Application, Graphics, Container, Text, TextStyle, Ticker } from 'pixi.js';
import { useStudioStore } from '../../hooks/useStudioStore.js';
import { StudioNode, Connection, Position, NodeType } from '../../types/studio.js';
import { createNode as createNodeUtil } from '../../utils/nodeFactory.js';
import { 
  renderConnection, 
  createNodeTextStyle, 
  isNodeVisible,
  applyContainerTransform 
} from './canvasRendering.js';
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

  // Undo/Redo system
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Animation control for accessibility
  const [animationsPaused, setAnimationsPaused] = useState(false);

  // Use Zustand store
  const { state, actions } = useStudioStore();
  const { canvas, nodes, connections, selection, theme } = state;

  // Undo/Redo functions
  const saveState = useCallback(() => {
    const currentState = {
      nodes: Array.from(nodes.entries()),
      connections: Array.from(connections.entries()),
      canvas: { ...canvas },
      timestamp: Date.now()
    };

    setUndoStack(prev => [...prev, currentState].slice(-50)); // Keep last 50 states
    setRedoStack([]); // Clear redo stack when new action is performed
    setCanUndo(true);
    setCanRedo(false);
  }, [nodes, connections, canvas]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;

    const currentState = {
      nodes: Array.from(nodes.entries()),
      connections: Array.from(connections.entries()),
      canvas: { ...canvas }
    };

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    // Restore previous state (skip saveState to avoid infinite loop)
    previousState.nodes.forEach(([id, node]: [string, any]) => {
      if (node) actions.updateNode(id, node);
    });

    previousState.connections.forEach(([id, connection]: [string, any]) => {
      if (connection) actions.updateConnection(id, connection);
    });

    actions.updateCanvas(previousState.canvas);

    setUndoStack(newUndoStack);
    setRedoStack(prev => [...prev, currentState]);
    setCanUndo(newUndoStack.length > 0);
    setCanRedo(true);
  }, [undoStack, nodes, connections, canvas, actions]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    // Restore next state
    nextState.nodes.forEach(([id, node]: [string, any]) => {
      if (node) actions.updateNode(id, node);
    });

    nextState.connections.forEach(([id, connection]: [string, any]) => {
      if (connection) actions.updateConnection(id, connection);
    });

    actions.updateCanvas(nextState.canvas);

    setRedoStack(newRedoStack);
    setUndoStack(prev => [...prev, nextState]);
    setCanRedo(newRedoStack.length > 0);
    setCanUndo(true);
  }, [redoStack, actions]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          undo();
        } else if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Memoized expensive calculations
  const processedNodes = useMemo(() => {
    return Array.from(nodes.values()).map((node: unknown) => {
      const typedNode = node as StudioNode;
      
      // Calculate screen position for efficient viewport transforms
      const screenX = (typedNode.position.x - canvas.viewport.x) / canvas.viewport.zoom;
      const screenY = (typedNode.position.y - canvas.viewport.y) / canvas.viewport.zoom;
      
      // Determine visibility for culling off-screen nodes
      const isVisible = isNodeVisible(
        typedNode,
        {
          x: canvas.viewport.x,
          y: canvas.viewport.y,
          width: canvas.config.width,
          height: canvas.config.height,
          zoom: canvas.viewport.zoom
        },
        200 // Padding to prevent pop-in
      );
      
      return {
        ...typedNode,
        screenPosition: { x: screenX, y: screenY },
        isVisible, // Only render visible nodes
        style: typedNode.style
      };
    });
  }, [nodes, canvas.viewport, canvas.config.width, canvas.config.height]);

  // Create node function with optimization
  const createNode = useCallback((nodeType: NodeType, position: Position) => {
    const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNode = createNodeUtil(nodeType, position, nodeId);
    actions.addNode(newNode);
    actions.selectNodes([nodeId]);
  }, [actions]);

  // Initialize PixiJS Application with optimizations
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new Application({
      width: canvas.config.width,
      height: canvas.config.height,
      backgroundColor: canvas.config.backgroundColor,
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
  }, [canvas.config]);

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
    
    // Use optimized transform utility with hardware acceleration
    applyContainerTransform(containerRef.current, canvas.viewport);
  }, [canvas.viewport]);

  // Render grid with LOD
  useEffect(() => {
    if (!gridRef.current || !canvas.config.gridEnabled) return;

    const grid = gridRef.current;
    grid.clear();

    if (!canvas.config.gridEnabled) return;

    const gridSize = canvas.config.gridSize;
    const zoom = canvas.viewport.zoom;

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
      left: -canvas.viewport.x / zoom - 200,
      top: -canvas.viewport.y / zoom - 200,
      right: (-canvas.viewport.x + canvas.config.width) / zoom + 200,
      bottom: (-canvas.viewport.y + canvas.config.height) / zoom + 200
    };

    grid.lineStyle(lineWidth, canvas.config.gridColor, lineOpacity);

    // Draw vertical lines
    for (let x = Math.floor(bounds.left / gridSize) * gridSize; x <= bounds.right; x += gridSize * lodFactor) {
      const screenX = (x - canvas.viewport.x) / zoom;
      if (screenX >= -100 && screenX <= canvas.config.width + 100) {
        grid.moveTo(screenX, -100);
        grid.lineTo(screenX, canvas.config.height + 100);
      }
    }

    // Draw horizontal lines
    for (let y = Math.floor(bounds.top / gridSize) * gridSize; y <= bounds.bottom; y += gridSize * lodFactor) {
      const screenY = (y - canvas.viewport.y) / zoom;
      if (screenY >= -100 && screenY <= canvas.config.height + 100) {
        grid.moveTo(-100, screenY);
        grid.lineTo(canvas.config.width + 100, screenY);
      }
    }
  }, [canvas.config, canvas.viewport]);

  // Optimized node rendering function
  const renderNode = useCallback((graphics: Graphics, node: StudioNode): void => {
    graphics.clear();
    graphics.position.set(node.position.x, node.position.y);

    const style = node.style;
    const isSelected = selection.selectedNodes.includes(node.id);

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

    // Use optimized text style creation from utility
    const textStyle = createNodeTextStyle(node);
    const text = new Text(node.data.label, textStyle);
    text.anchor.set(0.5);
    text.position.set(node.size.width / 2, node.size.height / 2);
    graphics.addChild(text);
  }, [selection.selectedNodes]);

  // Render nodes with object pooling
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const nodeLayer = container.children.find(child => child.name === 'nodeLayer') as Container;
    if (!nodeLayer) return;

    // Clear existing nodes
    nodeLayer.removeChildren();

    // Performance tracking
    const startTime = performance.now();
    let visibleNodeCount = 0;

    // Render only visible nodes using object pool
    processedNodes.forEach(nodeData => {
      // Skip off-screen nodes for better performance
      if (!nodeData.isVisible) return;

      visibleNodeCount++;
      const graphics = graphicsPoolRef.current.get();
      renderNode(graphics, nodeData);
      nodeLayer.addChild(graphics);
    });

    const renderTime = performance.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Rendered ${visibleNodeCount}/${processedNodes.length} nodes in ${renderTime.toFixed(2)}ms`);
    }

    // Return graphics to pool after a delay to prevent flickering
    setTimeout(() => {
      // This would be handled by a more sophisticated pooling system
    }, 100);
  }, [processedNodes, renderNode]);

  return (
    <main
      ref={canvasRef}
      className="enhanced-canvas"
      aria-label="Workflow canvas"
      data-testid="enhanced-canvas"
      data-tool={canvas.activeTool}
      style={{
        cursor: 
          canvas.activeTool === 'pan' ? 'grab' :
          canvas.activeTool === 'zoom' ? 'zoom-in' :
          canvas.activeTool === 'node-create' ? 'copy' :
          canvas.activeTool === 'connection-create' ? 'crosshair' :
          canvas.activeTool === 'lasso-select' ? 'crosshair' :
          canvas.activeTool === 'rectangle-select' ? 'crosshair' : 'default',
      }}
    >
      {/* Performance Monitor */}
      {process.env.NODE_ENV === 'development' && (
        <div className="canvas-performance-overlay">
          <div>FPS: {performanceStats.fps}</div>
          <div>Zoom: {canvas.viewport.zoom.toFixed(2)}x</div>
          <div>Nodes: {nodes.size}</div>
          {performanceStats.memory > 0 && <div>Memory: {performanceStats.memory}MB</div>}
        </div>
      )}

      {/* Zoom Level Indicator */}
      <div className="zoom-indicator" aria-live="polite" aria-atomic="true">
        {Math.round(canvas.viewport.zoom * 100)}%
      </div>

      {/* Canvas Controls */}
      <button
        className="canvas-control-button grid-toggle"
        onClick={actions.toggleGrid}
        title={canvas.config.gridEnabled ? 'Hide Grid (Ctrl+G)' : 'Show Grid (Ctrl+G)'}
        aria-label={canvas.config.gridEnabled ? 'Hide grid' : 'Show grid'}
      >
        ▦
      </button>

      <button
        className="canvas-control-button snap-toggle"
        onClick={actions.toggleSnapToGrid}
        title={canvas.config.snapToGrid ? 'Disable Snap to Grid (Ctrl+S)' : 'Enable Snap to Grid (Ctrl+S)'}
        aria-label={canvas.config.snapToGrid ? 'Disable snap to grid' : 'Enable snap to grid'}
      >
        ⊞
      </button>

      <button
        className="canvas-control-button zoom-fit"
        onClick={() => actions.updateViewport({ x: 0, y: 0, zoom: 1 })}
        title="Zoom to Fit (0)"
        aria-label="Zoom to fit"
      >
        🎯
      </button>

      {/* Undo/Redo Controls */}
      <button
        className={`canvas-control-button undo ${!canUndo ? 'disabled' : ''}`}
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo last action"
      >
        ↶
      </button>

      <button
        className={`canvas-control-button redo ${!canRedo ? 'disabled' : ''}`}
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        aria-label="Redo last undone action"
      >
        ↷
      </button>

      {/* Animation Control for Accessibility */}
      <button
        className="canvas-control-button animation-toggle"
        onClick={() => setAnimationsPaused(!animationsPaused)}
        title={animationsPaused ? 'Resume Animations' : 'Pause Animations'}
        aria-label={animationsPaused ? 'Resume animations' : 'Pause animations'}
      >
        {animationsPaused ? '▶️' : '⏸️'}
      </button>
    </main>
  );
});

EnhancedCanvasContent.displayName = 'EnhancedCanvasContent';

// Main Enhanced Canvas Component
export const EnhancedCanvas: React.FC = () => {
  return <EnhancedCanvasContent />;
};
