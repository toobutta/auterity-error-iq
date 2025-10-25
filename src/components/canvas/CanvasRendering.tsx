import { useEffect, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useStudioStore } from '../../hooks/useStudioStore.js';
import { StudioNode, Position } from '../../types/studio.js';

interface CanvasRenderingProps {
  app: Application;
  container: Container;
  gridRef: React.RefObject<Graphics | null>;
  nodeLayerRef: React.RefObject<Container | null>;
  connectionLayerRef: React.RefObject<Container | null>;
}

export const useCanvasRendering = ({
  app,
  container,
  gridRef,
  nodeLayerRef,
  connectionLayerRef
}: CanvasRenderingProps) => {
  const { state } = useStudioStore();
  const { canvas, nodes, connections, selection, theme } = state;

  // Get viewport bounds for culling
  const getViewportBounds = useCallback(() => {
    if (!app.view || !app.view.getBoundingClientRect) {
      return { left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 };
    }

    const rect = app.view.getBoundingClientRect();
    const padding = 100; // Extra padding for smooth scrolling

    return {
      left: -canvas.viewport.x / canvas.viewport.zoom - padding,
      top: -canvas.viewport.y / canvas.viewport.zoom - padding,
      right: (-canvas.viewport.x + rect.width) / canvas.viewport.zoom + padding,
      bottom: (-canvas.viewport.y + rect.height) / canvas.viewport.zoom + padding,
      width: rect.width,
      height: rect.height
    };
  }, [app.view, canvas.viewport]);

  // Check if origin (0,0) is visible in viewport
  const isOriginVisible = useCallback(() => {
    const bounds = getViewportBounds();
    return bounds.left <= 0 && bounds.right >= 0 && bounds.top <= 0 && bounds.bottom >= 0;
  }, [getViewportBounds]);

  // Enhanced grid rendering with LOD (Level of Detail) and performance optimization
  const renderGrid = useCallback(() => {
    if (!gridRef.current || !canvas.config.gridEnabled) return;

    const grid = gridRef.current;
    grid.clear();

    if (!canvas.config.gridEnabled) return;

    const gridSize = canvas.config.gridSize;
    const viewportBounds = getViewportBounds();
    const zoom = canvas.viewport.zoom;

    // Level of Detail based on zoom level
    let lodFactor = 1;
    let lineOpacity = 0.3;
    let lineWidth = 1;

    if (zoom < 0.3) {
      lodFactor = 4; // Show every 4th line at low zoom
      lineOpacity = 0.15;
    } else if (zoom < 0.6) {
      lodFactor = 2; // Show every 2nd line at medium zoom
      lineOpacity = 0.2;
    } else if (zoom > 3) {
      lineWidth = 0.5; // Thinner lines at high zoom
      lineOpacity = 0.4;
    }

    // Calculate grid lines within viewport bounds with LOD
    const startX = Math.floor(viewportBounds.left / (gridSize * lodFactor)) * (gridSize * lodFactor);
    const endX = Math.ceil(viewportBounds.right / (gridSize * lodFactor)) * (gridSize * lodFactor);
    const startY = Math.floor(viewportBounds.top / (gridSize * lodFactor)) * (gridSize * lodFactor);
    const endY = Math.ceil(viewportBounds.bottom / (gridSize * lodFactor)) * (gridSize * lodFactor);

    // Draw grid lines with LOD optimization
    grid.lineStyle(lineWidth, canvas.config.gridColor, lineOpacity);

    // Vertical lines with LOD
    for (let x = startX; x <= endX; x += gridSize * lodFactor) {
      const screenX = (x - canvas.viewport.x) / zoom;
      if (screenX >= -100 && screenX <= viewportBounds.width + 100) {
        grid.moveTo(screenX, -100);
        grid.lineTo(screenX, viewportBounds.height + 100);
      }
    }

    // Horizontal lines with LOD
    for (let y = startY; y <= endY; y += gridSize * lodFactor) {
      const screenY = (y - canvas.viewport.y) / zoom;
      if (screenY >= -100 && screenY <= viewportBounds.height + 100) {
        grid.moveTo(-100, screenY);
        grid.lineTo(viewportBounds.width + 100, screenY);
      }
    }

    // Draw sub-grid at high zoom levels
    if (zoom > 2 && lodFactor === 1) {
      const subGridSize = gridSize / 4;
      const subOpacity = lineOpacity * 0.3;
      grid.lineStyle(0.5, canvas.config.gridColor, subOpacity);

      const subStartX = Math.floor(viewportBounds.left / subGridSize) * subGridSize;
      const subEndX = Math.ceil(viewportBounds.right / subGridSize) * subGridSize;
      const subStartY = Math.floor(viewportBounds.top / subGridSize) * subGridSize;
      const subEndY = Math.ceil(viewportBounds.bottom / subGridSize) * subGridSize;

      // Sub-grid vertical lines
      for (let x = subStartX; x <= subEndX; x += subGridSize) {
        if (x % gridSize !== 0) { // Don't redraw main grid lines
          const screenX = (x - canvas.viewport.x) / zoom;
          if (screenX >= -50 && screenX <= viewportBounds.width + 50) {
            grid.moveTo(screenX, -50);
            grid.lineTo(screenX, viewportBounds.height + 50);
          }
        }
      }

      // Sub-grid horizontal lines
      for (let y = subStartY; y <= subEndY; y += subGridSize) {
        if (y % gridSize !== 0) { // Don't redraw main grid lines
          const screenY = (y - canvas.viewport.y) / zoom;
          if (screenY >= -50 && screenY <= viewportBounds.height + 50) {
            grid.moveTo(-50, screenY);
            grid.lineTo(viewportBounds.width + 50, screenY);
          }
        }
      }
    }

    // Draw origin crosshair with LOD
    if (isOriginVisible() && zoom > 0.5) {
      const crosshairSize = Math.max(10, 20 / zoom);
      grid.lineStyle(2, canvas.config.gridColor, Math.min(0.8, lineOpacity * 2));
      const originX = -canvas.viewport.x / zoom;
      const originY = -canvas.viewport.y / zoom;

      if (originX >= 0 && originX <= viewportBounds.width) {
        grid.moveTo(originX, Math.max(0, originY - crosshairSize));
        grid.lineTo(originX, Math.min(viewportBounds.height, originY + crosshairSize));
      }

      if (originY >= 0 && originY <= viewportBounds.height) {
        grid.moveTo(Math.max(0, originX - crosshairSize), originY);
        grid.lineTo(Math.min(viewportBounds.width, originX + crosshairSize), originY);
      }
    }
  }, [gridRef, canvas, getViewportBounds, isOriginVisible]);

  // Render individual node
  const renderNode = useCallback((node: StudioNode): Graphics => {
    const graphics = new Graphics();
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
      // Draw diamond shape for decision nodes
      const halfWidth = node.size.width / 2;
      const halfHeight = node.size.height / 2;
      graphics.moveTo(halfWidth, 0);
      graphics.lineTo(node.size.width, halfHeight);
      graphics.lineTo(halfWidth, node.size.height);
      graphics.lineTo(0, halfHeight);
      graphics.lineTo(halfWidth, 0);
    } else if (node.type === 'start' || node.type === 'end') {
      // Draw rounded rectangle for start/end nodes
      graphics.drawRoundedRect(0, 0, node.size.width, node.size.height, style.borderRadius);
    } else {
      // Draw rectangle for other nodes
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

    graphics.removeChildren();
    graphics.addChild(text);

    // Add selection handles if selected
    if (isSelected) {
      renderSelectionHandles(graphics, node);
    }

    // Add connection points
    renderConnectionPoints(graphics, node);

    return graphics;
  }, [selection.selectedNodes]);

  // Render selection handles
  const renderSelectionHandles = useCallback((graphics: Graphics, node: StudioNode) => {
    const handleSize = 8;
    const handleColor = 0x3b82f6;

    // Corner handles
    const positions = [
      { x: -handleSize/2, y: -handleSize/2 }, // Top-left
      { x: node.size.width - handleSize/2, y: -handleSize/2 }, // Top-right
      { x: node.size.width - handleSize/2, y: node.size.height - handleSize/2 }, // Bottom-right
      { x: -handleSize/2, y: node.size.height - handleSize/2 }, // Bottom-left
    ];

    positions.forEach(pos => {
      const handle = new Graphics();
      handle.beginFill(handleColor);
      handle.drawRect(0, 0, handleSize, handleSize);
      handle.endFill();
      handle.position.set(pos.x, pos.y);
      graphics.addChild(handle);
    });
  }, []);

  // Render connection points
  const renderConnectionPoints = useCallback((graphics: Graphics, node: StudioNode) => {
    const connectionPoints = getNodeConnectionPoints(node);
    const isSelected = selection.selectedNodes.includes(node.id);
    const showPoints = isSelected || canvas.activeTool === 'connection-create';

    if (!showPoints) return;

    connectionPoints.forEach(point => {
      const localX = point.x - node.position.x;
      const localY = point.y - node.position.y;

      // Draw connection point
      const pointGraphics = new Graphics();
      pointGraphics.beginFill(point.type === 'input' ? 0x10b981 : 0x3b82f6, 0.9);
      pointGraphics.lineStyle(2, point.type === 'input' ? 0x059669 : 0x2563eb);

      if (node.type === 'decision' && point.label) {
        // Diamond shape for decision points
        const size = 6;
        pointGraphics.moveTo(localX, localY - size);
        pointGraphics.lineTo(localX + size, localY);
        pointGraphics.lineTo(localX, localY + size);
        pointGraphics.lineTo(localX - size, localY);
        pointGraphics.lineTo(localX, localY - size);
      } else {
        // Circle for regular points
        pointGraphics.drawCircle(localX, localY, 4);
      }

      pointGraphics.endFill();

      // Add hover effect
      pointGraphics.interactive = true;
      pointGraphics.cursor = 'pointer';

      pointGraphics.on('pointerover', () => {
        pointGraphics.alpha = 0.7;
        pointGraphics.scale.set(1.2);
      });

      pointGraphics.on('pointerout', () => {
        pointGraphics.alpha = 1;
        pointGraphics.scale.set(1);
      });

      graphics.addChild(pointGraphics);

      // Add label for decision points
      if (point.label) {
        const labelStyle = new TextStyle({
          fontFamily: 'Arial',
          fontSize: 10,
          fill: 0xffffff,
          align: 'center'
        });

        const label = new Text(point.label, labelStyle);
        label.anchor.set(0.5);
        label.position.set(localX, localY + (point.type === 'input' ? -12 : 12));
        graphics.addChild(label);
      }
    });
  }, [selection.selectedNodes, canvas.activeTool]);

  // Get all connection points for a node
  const getNodeConnectionPoints = useCallback((node: StudioNode) => {
    const points = [];

    // Add input points (top)
    if (node.type !== 'start') {
      points.push({
        id: `${node.id}-input-main`,
        x: node.position.x + node.size.width / 2,
        y: node.position.y,
        type: 'input',
        nodeId: node.id,
        dataType: 'any'
      });
    }

    // Add output points (bottom)
    if (node.type !== 'end') {
      points.push({
        id: `${node.id}-output-main`,
        x: node.position.x + node.size.width / 2,
        y: node.position.y + node.size.height,
        type: 'output',
        nodeId: node.id,
        dataType: 'any'
      });
    }

    // Add decision-specific points
    if (node.type === 'decision') {
      points.push(
        {
          id: `${node.id}-output-true`,
          x: node.position.x + node.size.width,
          y: node.position.y + node.size.height / 2,
          type: 'output',
          nodeId: node.id,
          dataType: 'boolean',
          label: 'True'
        },
        {
          id: `${node.id}-output-false`,
          x: node.position.x,
          y: node.position.y + node.size.height / 2,
          type: 'output',
          nodeId: node.id,
          dataType: 'boolean',
          label: 'False'
        }
      );
    }

    return points;
  }, []);

  // Enhanced node rendering with viewport culling
  const renderNodes = useCallback(() => {
    if (!nodeLayerRef.current) return;

    const nodeLayer = nodeLayerRef.current;
    const viewportBounds = getViewportBounds();

    // Remove nodes that no longer exist
    for (const [nodeId, graphics] of nodeLayer.children.entries()) {
      const child = graphics as Graphics;
      if (child.name && !nodes.has(child.name)) {
        nodeLayer.removeChild(child);
      }
    }

    // Add or update nodes with viewport culling
    for (const [nodeId, node] of nodes) {
      // Check if node is within viewport bounds (with padding)
      const nodeBounds = {
        left: node.position.x,
        top: node.position.y,
        right: node.position.x + node.size.width,
        bottom: node.position.y + node.size.height
      };

      const isVisible = nodeBounds.right >= viewportBounds.left - 100 &&
                       nodeBounds.left <= viewportBounds.right + 100 &&
                       nodeBounds.bottom >= viewportBounds.top - 100 &&
                       nodeBounds.top <= viewportBounds.bottom + 100;

      if (!isVisible) {
        // Remove node if it's no longer visible
        const existingGraphics = nodeLayer.children.find(child => (child as Graphics).name === nodeId) as Graphics;
        if (existingGraphics) {
          nodeLayer.removeChild(existingGraphics);
        }
        continue;
      }

      let graphics = nodeLayer.children.find(child => (child as Graphics).name === nodeId) as Graphics;

      if (!graphics) {
        graphics = renderNode(node);
        graphics.name = nodeId;
        graphics.interactive = true;
        graphics.cursor = 'pointer';
        nodeLayer.addChild(graphics);
      } else {
        // Update existing node
        graphics.clear();
        graphics.position.set(node.position.x, node.position.y);

        const style = node.style;
        const isSelected = selection.selectedNodes.includes(node.id);

        // Redraw node background
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
        } else if (node.type === 'start' || node.type === 'end') {
          graphics.drawRoundedRect(0, 0, node.size.width, node.size.height, style.borderRadius);
        } else {
          graphics.drawRoundedRect(0, 0, node.size.width, node.size.height, style.borderRadius);
        }

        graphics.endFill();

        // Update text label
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

        graphics.removeChildren();
        graphics.addChild(text);

        // Add selection handles if selected
        if (isSelected) {
          renderSelectionHandles(graphics, node);
        }

        // Add connection points
        renderConnectionPoints(graphics, node);
      }
    }
  }, [nodeLayerRef, nodes, selection.selectedNodes, canvas.activeTool, getViewportBounds, renderNode, renderSelectionHandles, renderConnectionPoints]);

  // Update grid when canvas config changes
  useEffect(() => {
    renderGrid();
  }, [renderGrid]);

  // Update nodes when nodes or selection changes
  useEffect(() => {
    renderNodes();
  }, [renderNodes]);

  return {
    renderGrid,
    renderNodes,
    getViewportBounds,
    isOriginVisible
  };
};
