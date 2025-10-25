import { useCallback, useEffect, useRef } from 'react';
import { Application, Container } from 'pixi.js';
import { useStudioStore } from '../../hooks/useStudioStore.js';
import { Position, NodeType } from '../../types/studio.js';
import { createNode as createNodeUtil } from '../../utils/nodeFactory.js';

interface CanvasInteractionProps {
  app: Application;
  container: Container;
  canvasRef: React.RefObject<HTMLDivElement>;
  onCreateNode?: (nodeType: NodeType, position: Position) => void;
  onDuplicateNodes?: () => void;
  onDeleteItems?: () => void;
}

export const useCanvasInteraction = ({
  app,
  container,
  canvasRef,
  onCreateNode,
  onDuplicateNodes,
  onDeleteItems
}: CanvasInteractionProps) => {
  const { state, actions } = useStudioStore();
  const { canvas, nodes, selection } = state;

  // Animation system for smooth transitions
  const animationRef = useRef<{ zoom: number; pan: Position; targetZoom: number; targetPan: Position } | null>(null);

  // Enhanced pan with momentum
  const setupPanInteraction = useCallback(() => {
    let isDragging = false;
    let dragStart: Position = { x: 0, y: 0 };
    let lastPosition: Position = { x: 0, y: 0 };
    let momentum: Position = { x: 0, y: 0 };
    let lastMoveTime = 0;

    const onPointerDown = (event: any) => {
      if (canvas.activeTool !== 'pan' && canvas.activeTool !== 'select') return;

      isDragging = true;
      momentum = { x: 0, y: 0 };
      const position = event.data.global;
      dragStart = { x: position.x, y: position.y };
      lastPosition = { x: canvas.viewport.x, y: canvas.viewport.y };
      lastMoveTime = performance.now();

      // Stop any ongoing animation
      animationRef.current = null;
    };

    const onPointerMove = (event: any) => {
      const currentTime = performance.now();
      const position = event.data.global;

      if (!isDragging || (canvas.activeTool !== 'pan' && canvas.activeTool !== 'select')) return;

      const deltaTime = currentTime - lastMoveTime;

      if (canvas.activeTool === 'pan') {
        // Direct pan for pan tool
        const deltaX = position.x - dragStart.x;
        const deltaY = position.y - dragStart.y;

        actions.updateViewport({
          x: lastPosition.x + deltaX,
          y: lastPosition.y + deltaY,
        });
      } else if (canvas.activeTool === 'select') {
        // Calculate momentum for smooth scrolling
        const deltaX = position.x - dragStart.x;
        const deltaY = position.y - dragStart.y;

        if (deltaTime > 0) {
          momentum.x = (deltaX / deltaTime) * 1000; // pixels per second
          momentum.y = (deltaY / deltaTime) * 1000;
        }

        actions.updateViewport({
          x: lastPosition.x + deltaX,
          y: lastPosition.y + deltaY,
        });
      }

      lastMoveTime = currentTime;
    };

    const onPointerUp = () => {
      if (isDragging) {
        isDragging = false;

        // Apply momentum for smooth finish
        if (canvas.activeTool === 'select' && (Math.abs(momentum.x) > 50 || Math.abs(momentum.y) > 50)) {
          const momentumFactor = 0.8;
          const targetX = canvas.viewport.x + momentum.x * momentumFactor;
          const targetY = canvas.viewport.y + momentum.y * momentumFactor;

          actions.updateViewport({
            x: targetX,
            y: targetY,
          });
        }
      }
    };

    app.stage.interactive = true;
    app.stage.on('pointerdown', onPointerDown);
    app.stage.on('pointermove', onPointerMove);
    app.stage.on('pointerup', onPointerUp);
    app.stage.on('pointerupoutside', onPointerUp);

    return () => {
      app.stage.off('pointerdown', onPointerDown);
      app.stage.off('pointermove', onPointerMove);
      app.stage.off('pointerup', onPointerUp);
      app.stage.off('pointerupoutside', onPointerUp);
    };
  }, [app, canvas, actions]);

  // Enhanced wheel zoom with smooth animations
  const setupZoomInteraction = useCallback(() => {
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();

      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.01, Math.min(10, canvas.viewport.zoom * zoomFactor));

      // Zoom towards mouse position
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const worldX = (mouseX - canvas.viewport.x) / canvas.viewport.zoom;
        const worldY = (mouseY - canvas.viewport.y) / canvas.viewport.zoom;

        const newX = mouseX - worldX * newZoom;
        const newY = mouseY - worldY * newZoom;

        // Use smooth animation for zoom
        animationRef.current = {
          zoom: canvas.viewport.zoom,
          pan: { x: canvas.viewport.x, y: canvas.viewport.y },
          targetZoom: newZoom,
          targetPan: { x: newX, y: newY }
        };
      }
    };

    if (canvasRef.current) {
      canvasRef.current.addEventListener('wheel', onWheel, { passive: false });
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('wheel', onWheel);
      }
    };
  }, [canvasRef, canvas.viewport, actions]);

  // Enhanced keyboard shortcuts
  const setupKeyboardInteraction = useCallback(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return;

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          actions.setActiveTool(canvas.activeTool === 'pan' ? 'select' : 'pan');
          break;
        case 'c':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            actions.setActiveTool('connection-create');
          }
          break;
        case 'escape':
          event.preventDefault();
          actions.clearSelection();
          break;

        // Node creation shortcuts (1-9 keys)
        case '1':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            createNodeAtCenter('start');
          }
          break;
        case '2':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            createNodeAtCenter('action');
          }
          break;
        case '3':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            createNodeAtCenter('decision');
          }
          break;
        case '4':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            createNodeAtCenter('api-call');
          }
          break;
        case '5':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            createNodeAtCenter('email');
          }
          break;
        case '6':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            createNodeAtCenter('database');
          }
          break;
        case '7':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            createNodeAtCenter('ai-model');
          }
          break;
        case '8':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            createNodeAtCenter('end');
          }
          break;

        // Bulk operations
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            actions.selectAll();
          }
          break;
        case 'd':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onDuplicateNodes?.();
          }
          break;
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          onDeleteItems?.();
          break;

        // History operations
        case 'z':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.shiftKey) {
              actions.redo();
            } else {
              actions.undo();
            }
          }
          break;
        case 'y':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            actions.redo();
          }
          break;

        // View controls
        case 'g':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            actions.toggleGrid();
          }
          break;
        case 's':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            actions.toggleSnapToGrid();
          }
          break;
        case '0':
          event.preventDefault();
          actions.updateViewport({ x: 0, y: 0, zoom: 1 });
          break;
        case '+':
        case '=':
          event.preventDefault();
          actions.updateViewport({
            zoom: Math.min(10, canvas.viewport.zoom * 1.2)
          });
          break;
        case '-':
          event.preventDefault();
          actions.updateViewport({
            zoom: Math.max(0.01, canvas.viewport.zoom / 1.2)
          });
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [canvas.activeTool, actions, onDuplicateNodes, onDeleteItems]);

  // Drag and drop handlers for node creation
  const setupDragDropInteraction = useCallback(() => {
    let isDragOver = false;

    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'copy';
      isDragOver = true;
    };

    const onDragLeave = (event: DragEvent) => {
      event.preventDefault();
      isDragOver = false;
    };

    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      isDragOver = false;

      try {
        const data = JSON.parse(event.dataTransfer!.getData('application/json'));
        if (data.type === 'node-create') {
          // Calculate drop position relative to canvas
          const rect = canvasRef.current!.getBoundingClientRect();
          const canvasX = event.clientX - rect.left;
          const canvasY = event.clientY - rect.top;

          // Convert screen coordinates to world coordinates
          const worldX = (canvasX - canvas.viewport.x) / canvas.viewport.zoom;
          const worldY = (canvasY - canvas.viewport.y) / canvas.viewport.zoom;

          // Snap to grid if enabled
          let finalX = worldX;
          let finalY = worldY;

          if (canvas.config.snapToGrid) {
            const gridSize = canvas.config.gridSize;
            finalX = Math.round(finalX / gridSize) * gridSize;
            finalY = Math.round(finalY / gridSize) * gridSize;
          }

          onCreateNode?.(data.nodeType, { x: finalX, y: finalY });
        }
      } catch (error) {
        console.error('Failed to parse drag data:', error);
      }
    };

    if (canvasRef.current) {
      canvasRef.current.addEventListener('dragover', onDragOver);
      canvasRef.current.addEventListener('dragleave', onDragLeave);
      canvasRef.current.addEventListener('drop', onDrop);
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('dragover', onDragOver);
        canvasRef.current.removeEventListener('dragleave', onDragLeave);
        canvasRef.current.removeEventListener('drop', onDrop);
      }
    };
  }, [canvasRef, canvas.viewport, canvas.config, onCreateNode]);

  // Node creation at center of viewport
  const createNodeAtCenter = useCallback((nodeType: NodeType) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Convert screen coordinates to world coordinates
    const worldX = (centerX - canvas.viewport.x) / canvas.viewport.zoom;
    const worldY = (centerY - canvas.viewport.y) / canvas.viewport.zoom;

    // Snap to grid if enabled
    let finalX = worldX;
    let finalY = worldY;

    if (canvas.config.snapToGrid) {
      const gridSize = canvas.config.gridSize;
      finalX = Math.round(finalX / gridSize) * gridSize;
      finalY = Math.round(finalY / gridSize) * gridSize;
    }

    onCreateNode?.(nodeType, { x: finalX, y: finalY });
  }, [canvasRef, canvas.viewport, canvas.config, onCreateNode]);

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

  // Setup animation ticker
  useEffect(() => {
    if (!app) return;

    const ticker = app.ticker;
    ticker.add(updateAnimations);

    return () => {
      ticker.remove(updateAnimations);
    };
  }, [app, updateAnimations]);

  // Initialize all interactions
  useEffect(() => {
    if (!app || !container) return;

    const cleanupPan = setupPanInteraction();
    const cleanupZoom = setupZoomInteraction();
    const cleanupKeyboard = setupKeyboardInteraction();
    const cleanupDragDrop = setupDragDropInteraction();

    return () => {
      cleanupPan();
      cleanupZoom();
      cleanupKeyboard();
      cleanupDragDrop();
    };
  }, [app, container, setupPanInteraction, setupZoomInteraction, setupKeyboardInteraction, setupDragDropInteraction]);

  return {
    createNodeAtCenter,
  };
};
