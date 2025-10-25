// Optimized WebGL Canvas Rendering Utilities
import { Container, Graphics, TextStyle } from 'pixi.js';
import type { StudioNode } from '../../types/studio.js';

/**
 * Optimized rendering of node connections using WebGL
 * @param graphics - PIXI Graphics instance to render onto
 * @param from - Starting point coordinates
 * @param to - Ending point coordinates
 * @param lineColor - Color of the connection line
 * @param lineWidth - Width of the connection line
 * @param selected - Whether the connection is selected
 */
export function renderConnection(
  graphics: Graphics,
  from: { x: number; y: number },
  to: { x: number; y: number },
  lineColor: number = 0x666666,
  lineWidth: number = 2,
  selected: boolean = false
): void {
  graphics.clear();
  
  // Set line style with optional selection highlighting
  if (selected) {
    graphics.lineStyle(lineWidth + 2, 0x3b82f6, 0.5);
    graphics.moveTo(from.x, from.y);
    graphics.lineTo(to.x, to.y);
  }
  
  graphics.lineStyle(lineWidth, lineColor, 1);
  graphics.moveTo(from.x, from.y);
  graphics.lineTo(to.x, to.y);
  
  // Draw arrow head
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const arrowSize = 10;
  
  graphics.beginFill(lineColor);
  graphics.moveTo(
    to.x - Math.cos(angle) * arrowSize - Math.cos(angle - Math.PI / 2) * arrowSize / 2,
    to.y - Math.sin(angle) * arrowSize - Math.sin(angle - Math.PI / 2) * arrowSize / 2
  );
  graphics.lineTo(to.x, to.y);
  graphics.lineTo(
    to.x - Math.cos(angle) * arrowSize - Math.cos(angle + Math.PI / 2) * arrowSize / 2,
    to.y - Math.sin(angle) * arrowSize - Math.sin(angle + Math.PI / 2) * arrowSize / 2
  );
  graphics.endFill();
}

/**
 * Create text style for node labels with high performance settings
 * @param node - Node for which to create text style
 * @returns TextStyle object for the node
 */
export function createNodeTextStyle(node: StudioNode): TextStyle {
  return new TextStyle({
    fontFamily: 'Arial',
    fontSize: node.style.fontSize,
    fontWeight: node.style.fontWeight as any,
    fill: node.style.textColor,
    align: 'center',
    wordWrap: true,
    wordWrapWidth: node.size.width - 16,
    // Performance optimizations
    letterSpacing: 0,
    fillGradientType: 0,
    lineJoin: 'round',
    leading: 0,
    padding: 0,
    trim: true,
    miterLimit: 10,
    stroke: 'none',
    strokeThickness: 0,
    dropShadow: false
  });
}

/**
 * Determine if a node is within the visible viewport
 * @param node - The node to check
 * @param viewport - The current viewport bounds
 * @param padding - Extra padding around viewport to preload nodes
 * @returns Whether the node is visible
 */
export function isNodeVisible(
  node: StudioNode,
  viewport: { x: number; y: number; width: number; height: number; zoom: number },
  padding: number = 200
): boolean {
  const screenX = (node.position.x - viewport.x) / viewport.zoom;
  const screenY = (node.position.y - viewport.y) / viewport.zoom;
  
  return (
    screenX + node.size.width + padding >= 0 &&
    screenX - padding <= viewport.width &&
    screenY + node.size.height + padding >= 0 &&
    screenY - padding <= viewport.height
  );
}

/**
 * Apply GPU-accelerated transformations to a container
 * This leverages WebGL hardware acceleration for smooth panning/zooming
 * @param container - PIXI Container to transform
 * @param viewport - Current viewport settings
 */
export function applyContainerTransform(
  container: Container,
  viewport: { x: number; y: number; zoom: number }
): void {
  // Use PIXI transform properties for hardware-accelerated transforms
  container.position.set(viewport.x, viewport.y);
  container.scale.set(viewport.zoom);
  
  // Force container to update its transform
  container.updateTransform();
}

/**
 * Clean up GPU resources to prevent memory leaks
 * @param container - PIXI Container to clean up
 */
export function cleanupContainer(container: Container): void {
  // Remove all children but keep references to them
  const children = [...container.children];
  container.removeChildren();
  
  // Destroy each child properly
  children.forEach(child => {
    if (child instanceof Graphics) {
      child.clear();
    }
    child.destroy({ children: true, texture: true, baseTexture: true });
  });
  
  // Clean the container itself
  container.destroy({ children: false });
}
