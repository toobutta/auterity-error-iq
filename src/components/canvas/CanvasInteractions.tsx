import React, { useCallback, useEffect, useRef } from 'react';
import { Application, Container } from 'pixi.js';
import { Position } from '../../types/studio.js';

interface CanvasInteractionsProps {
  app: Application | null;
  container: Container | null;
  canvas: any; // From store
  activeTool: string;
  viewport: any;
  onViewportUpdate: (viewport: any) => void;
  onNodeSelect: (nodeId: string, multiSelect?: boolean) => void;
  onNodeCreate: (position: Position) => void;
  onConnectionStart: (sourcePoint: any) => void;
  onConnectionComplete: (targetPoint: any) => void;
  onConnectionCancel: () => void;
  onCanvasClick: (position: Position) => void;
}

export const CanvasInteractions: React.FC<CanvasInteractionsProps> = React.memo(({
  app,
  container,
  canvas,
  activeTool,
  viewport,
  onViewportUpdate,
  onNodeSelect,
  onNodeCreate,
  onConnectionStart,
  onConnectionComplete,
  onConnectionCancel,
  onCanvasClick
}) => {
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<Position>({ x: 0, y: 0 });
  const lastPositionRef = useRef<Position>({ x: 0, y: 0 });
  const momentumRef = useRef<Position>({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(0);
  const animationRef = useRef<{ zoom: number; pan: Position; targetZoom: number; targetPan: Position } | null>(null);

  // Enhanced pan with momentum
  const handlePointerDown = useCallback((event: any) => {
    if (activeTool !== 'pan' && activeTool !== 'select') return;

    isDraggingRef.current = true;
    momentumRef.current = { x: 0, y: 0 };
    const position = event.data.global;
    dragStartRef.current = { x: position.x, y: position.y };
    lastPositionRef.current = { x: viewport.x, y: viewport.y };
    lastMoveTimeRef.current = performance.now();

    // Stop any ongoing animation
    animationRef.current = null;
  }, [activeTool, viewport]);

  const handlePointerMove = useCallback((event: any) => {
    const currentTime = performance.now();
    const position = event.data.global;

    // Handle connection creation preview
    if (activeTool === 'connection-create') {
      // This will be handled by the connection system
      return;
    }

    if (!isDraggingRef.current || (activeTool !== 'pan' && activeTool !== 'select')) return;

    const deltaTime = currentTime - lastMoveTimeRef.current;

    if (activeTool === 'pan') {
      // Direct pan for pan tool
      const deltaX = position.x - dragStartRef.current.x;
      const deltaY = position.y - dragStartRef.current.y;

      onViewportUpdate({
        x: lastPositionRef.current.x + deltaX,
        y: lastPositionRef.current.y + deltaY,
      });
    } else if (activeTool === 'select') {
      // Calculate momentum for smooth scrolling
      const deltaX = position.x - dragStartRef.current.x;
      const deltaY = position.y - dragStartRef.current.y;

      if (deltaTime > 0) {
        momentumRef.current.x = (deltaX / deltaTime) * 1000; // pixels per second
        momentumRef.current.y = (deltaY / deltaTime) * 1000;
      }

      onViewportUpdate({
        x: lastPositionRef.current.x + deltaX,
        y: lastPositionRef.current.y + deltaY,
      });
    }

    lastMoveTimeRef.current = currentTime;
  }, [activeTool, onViewportUpdate]);

  const handlePointerUp = useCallback((event: any) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;

      // Apply momentum for smooth finish
      if (activeTool === 'select' && (Math.abs(momentumRef.current.x) > 50 || Math.abs(momentumRef.current.y) > 50)) {
        const momentumFactor = 0.8;
        const targetX = viewport.x + momentumRef.current.x * momentumFactor;
        const targetY = viewport.y + momentumRef.current.y * momentumFactor;

        onViewportUpdate({
          x: targetX,
          y: targetY,
        });
      }
    }
  }, [activeTool, viewport, onViewportUpdate]);

  // Enhanced wheel zoom with smooth animations
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.01, Math.min(10, viewport.zoom * zoomFactor));

    // Zoom towards mouse position
    const rect = (event.target as HTMLElement)?.getBoundingClientRect();
    if (rect && container) {
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const worldX = (mouseX - viewport.x) / viewport.zoom;
      const worldY = (mouseY - viewport.y) / viewport.zoom;

      const newX = mouseX - worldX * newZoom;
      const newY = mouseY - worldY * newZoom;

      // Use smooth animation for zoom
      animationRef.current = {
        zoom: viewport.zoom,
        pan: { x: viewport.x, y: viewport.y },
        targetZoom: newZoom,
        targetPan: { x: newX, y: newY }
      };
    }
  }, [viewport, container]);

  // Enhanced keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.target !== document.body) return;

    switch (event.key.toLowerCase()) {
      case ' ':
        event.preventDefault();
        // Toggle between pan and select tools
        break;
      case 'c':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Set connection creation tool
        }
        break;
      case 'escape':
        if (activeTool === 'connection-create') {
          onConnectionCancel();
        }
        break;

      // Node creation shortcuts (1-9 keys)
      case '1':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          onNodeCreate({ x: 0, y: 0 }); // Will be positioned at center
        }
        break;
      case '2':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          onNodeCreate({ x: 0, y: 0 });
        }
        break;
      // ... more node shortcuts

      // Bulk operations
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Select all
        }
        break;
      case 'd':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Duplicate selected nodes
        }
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        // Delete selected items
        break;

      // History operations
      case 'z':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Undo/Redo
        }
        break;

      // View controls
      case 'g':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Toggle grid
        }
        break;
      case 's':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Toggle snap to grid
        }
        break;
      case '0':
        event.preventDefault();
        onViewportUpdate({ x: 0, y: 0, zoom: 1 });
        break;
      case '+':
      case '=':
        event.preventDefault();
        onViewportUpdate({
          zoom: Math.min(10, viewport.zoom * 1.2)
        });
        break;
      case '-':
        event.preventDefault();
        onViewportUpdate({
          zoom: Math.max(0.01, viewport.zoom / 1.2)
        });
        break;
    }
  }, [activeTool, viewport, onViewportUpdate, onNodeCreate, onConnectionCancel]);

  // Animation system for smooth transitions
  const updateAnimations = useCallback(() => {
    if (!animationRef.current || !container) return;

    const anim = animationRef.current;
    const deltaTime = 1 / 60; // Assuming 60 FPS
    const smoothFactor = 0.15;

    // Smooth zoom animation
    const zoomDiff = anim.targetZoom - anim.zoom;
    if (Math.abs(zoomDiff) > 0.001) {
      anim.zoom += zoomDiff * smoothFactor;
      container.scale.set(anim.zoom);
    } else {
      anim.zoom = anim.targetZoom;
      container.scale.set(anim.zoom);
    }

    // Smooth pan animation
    const panXDiff = anim.targetPan.x - anim.pan.x;
    const panYDiff = anim.targetPan.y - anim.pan.y;

    if (Math.abs(panXDiff) > 0.5 || Math.abs(panYDiff) > 0.5) {
      anim.pan.x += panXDiff * smoothFactor;
      anim.pan.y += panYDiff * smoothFactor;
      container.position.set(anim.pan.x, anim.pan.y);
    } else {
      anim.pan.x = anim.targetPan.x;
      anim.pan.y = anim.targetPan.y;
      container.position.set(anim.pan.x, anim.pan.y);
      animationRef.current = null; // Animation complete
    }
  }, [container]);

  // Setup interactions
  useEffect(() => {
    if (!app || !container) return;

    // Add event listeners
    app.stage.interactive = true;
    app.stage.on('pointerdown', handlePointerDown);
    app.stage.on('pointermove', handlePointerMove);
    app.stage.on('pointerup', handlePointerUp);
    app.stage.on('pointerupoutside', handlePointerUp);

    // Wheel and keyboard listeners need to be on DOM element
    const canvasElement = app.view as HTMLCanvasElement;
    if (canvasElement.parentElement) {
      canvasElement.parentElement.addEventListener('wheel', handleWheel, { passive: false });
    }

    window.addEventListener('keydown', handleKeyDown);

    // Setup animation ticker
    const ticker = app.ticker;
    ticker.add(updateAnimations);

    return () => {
      app.stage.off('pointerdown', handlePointerDown);
      app.stage.off('pointermove', handlePointerMove);
      app.stage.off('pointerup', handlePointerUp);
      app.stage.off('pointerupoutside', handlePointerUp);

      if (canvasElement.parentElement) {
        canvasElement.parentElement.removeEventListener('wheel', handleWheel);
      }

      window.removeEventListener('keydown', handleKeyDown);
      ticker.remove(updateAnimations);
    };
  }, [app, container, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel, handleKeyDown, updateAnimations]);

  return null; // This component doesn't render anything
});

CanvasInteractions.displayName = 'CanvasInteractions';
