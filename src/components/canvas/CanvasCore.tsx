import React, { useRef, useEffect, useCallback } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import { useStudioStore } from '../../hooks/useStudioStore.js';

interface CanvasCoreProps {
  onAppReady: (app: Application, container: Container) => void;
  onPerformanceStats?: (fps: number, memory: number) => void;
  children?: React.ReactNode;
}

export const CanvasCore: React.FC<CanvasCoreProps> = ({
  onAppReady,
  onPerformanceStats,
  children
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const containerRef = useRef<Container | null>(null);
  const gridRef = useRef<Graphics | null>(null);
  const nodeLayerRef = useRef<Container | null>(null);
  const connectionLayerRef = useRef<Container | null>(null);

  const { state } = useStudioStore();
  const { canvas } = state;

  // Initialize PixiJS Application
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

    // Create main container for infinite canvas
    const mainContainer = new Container();
    containerRef.current = mainContainer;
    app.stage.addChild(mainContainer);

    // Create grid layer (bottom)
    const grid = new Graphics();
    gridRef.current = grid;
    mainContainer.addChild(grid);

    // Create node layer (middle)
    const nodeLayer = new Container();
    nodeLayer.name = 'nodeLayer';
    nodeLayerRef.current = nodeLayer;
    mainContainer.addChild(nodeLayer);

    // Create connection layer (top)
    const connectionLayer = new Container();
    connectionLayer.name = 'connectionLayer';
    connectionLayerRef.current = connectionLayer;
    mainContainer.addChild(connectionLayer);

    // Setup performance monitoring
    setupPerformanceMonitoring(app);

    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current || !app) return;

      const rect = canvasRef.current.getBoundingClientRect();
      app.renderer.resize(rect.width, rect.height);

      // Ensure viewport stays within infinite bounds
      const maxViewport = 50000;
      const clampedViewport = {
        x: Math.max(-maxViewport, Math.min(maxViewport, canvas.viewport.x)),
        y: Math.max(-maxViewport, Math.min(maxViewport, canvas.viewport.y)),
        zoom: Math.max(0.01, Math.min(10, canvas.viewport.zoom))
      };

      if (clampedViewport.x !== canvas.viewport.x ||
          clampedViewport.y !== canvas.viewport.y ||
          clampedViewport.zoom !== canvas.viewport.zoom) {
        // This will be handled by parent component
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Notify parent component that app is ready
    onAppReady(app, mainContainer);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (app) {
        app.destroy(true, true);
      }
    };
  }, [canvas.config, onAppReady]);

  // Performance monitoring
  const setupPerformanceMonitoring = useCallback((app: Application) => {
    if (!onPerformanceStats) return;

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

        onPerformanceStats(fps, memory);
        frameCount = 0;
        lastTime = currentTime;
      }
    });
  }, [onPerformanceStats]);

  // Update viewport transform
  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.position.set(canvas.viewport.x, canvas.viewport.y);
    containerRef.current.scale.set(canvas.viewport.zoom);
  }, [canvas.viewport]);

  return (
    <div
      ref={canvasRef}
      className="enhanced-canvas"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
};

// Export refs for parent component access
export const useCanvasRefs = () => {
  return {
    canvasRef: useRef<HTMLDivElement>(null),
    appRef: useRef<Application | null>(null),
    containerRef: useRef<Container | null>(null),
    gridRef: useRef<Graphics | null>(null),
    nodeLayerRef: useRef<Container | null>(null),
    connectionLayerRef: useRef<Container | null>(null),
  };
};
