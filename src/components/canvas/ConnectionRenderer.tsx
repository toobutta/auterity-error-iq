import React, { useEffect, useRef, useCallback } from 'react';
import { Application, Graphics, Container, Text, TextStyle, Ticker } from 'pixi.js';
import { ConnectionPath, ConnectionPoint, ConnectionStyle, ConnectionCreationState } from '../../types/connections';
import { ConnectionRouter } from '../../utils/connectionRouter';

interface ConnectionRendererProps {
  app: Application;
  connections: Map<string, ConnectionPath>;
  creationState: ConnectionCreationState;
  selectedConnections: string[];
  hoverConnection?: string;
  onConnectionClick?: (connectionId: string, event: any) => void;
  onConnectionHover?: (connectionId: string | null) => void;
  showDataFlow?: boolean;
  showLabels?: boolean;
  animationSpeed?: number;
}

export class ConnectionRenderer {
  private app: Application;
  private container: Container;
  private connectionGraphics: Map<string, Graphics> = new Map();
  private previewGraphics: Graphics | null = null;
  private dataFlowGraphics: Map<string, Graphics> = new Map();
  private animationTicker: Ticker;
  private showDataFlow: boolean = true;
  private showLabels: boolean = true;
  private animationSpeed: number = 1;

  constructor(app: Application, options?: { showDataFlow?: boolean; showLabels?: boolean; animationSpeed?: number }) {
    this.app = app;
    this.showDataFlow = options?.showDataFlow ?? true;
    this.showLabels = options?.showLabels ?? true;
    this.animationSpeed = options?.animationSpeed ?? 1;

    this.container = new Container();
    this.container.name = 'connectionLayer';
    this.app.stage.addChild(this.container);

    // Setup animation ticker for animated connections and data flow
    this.animationTicker = new Ticker();
    this.animationTicker.add(this.updateAnimations.bind(this));
    this.animationTicker.start();
  }

  /**
   * Render all connections
   */
  renderConnections(connections: Map<string, ConnectionPath>, selectedIds: string[], hoverId?: string) {
    // Clear existing graphics for connections that no longer exist
    for (const [id, graphics] of this.connectionGraphics) {
      if (!connections.has(id)) {
        this.container.removeChild(graphics);
        this.connectionGraphics.delete(id);
      }
    }

    // Render each connection
    for (const [id, connection] of connections) {
      this.renderConnection(id, connection, selectedIds.includes(id), hoverId === id);
    }
  }

  /**
   * Render a single connection
   */
  private renderConnection(
    id: string,
    connection: ConnectionPath,
    isSelected: boolean,
    isHovered: boolean
  ) {
    let graphics = this.connectionGraphics.get(id);

    if (!graphics) {
      graphics = new Graphics();
      graphics.interactive = true;
      graphics.buttonMode = true;
      graphics.name = `connection-${id}`;

      // Add event listeners
      graphics.on('pointerdown', (event) => {
        event.stopPropagation();
        this.handleConnectionClick(id, event);
      });

      graphics.on('pointerover', () => this.handleConnectionHover(id));
      graphics.on('pointerout', () => this.handleConnectionHover(null));

      this.container.addChild(graphics);
      this.connectionGraphics.set(id, graphics);
    }

    // Clear and redraw
    graphics.clear();
    this.drawConnectionPath(graphics, connection, isSelected, isHovered);

    // Add enhanced label if specified
    if (connection.style.label && this.showLabels) {
      this.drawEnhancedConnectionLabel(graphics, connection);
    }

    // Add data flow indicator if enabled
    if (this.showDataFlow && connection.metadata.dataFlow !== 'unidirectional') {
      this.drawDataFlowIndicator(graphics, connection);
    }
  }

  /**
   * Draw the connection path with appropriate styling
   */
  private drawConnectionPath(
    graphics: Graphics,
    connection: ConnectionPath,
    isSelected: boolean,
    isHovered: boolean
  ) {
    const style = connection.style;
    const points = this.getPathPoints(connection);

    if (points.length < 2) return;

    // Apply selection/hover effects
    const finalStyle = {
      ...style,
      width: isSelected ? style.width + 2 : (isHovered ? style.width + 1 : style.width),
      opacity: isSelected ? 1 : (isHovered ? 0.9 : style.opacity),
      color: isSelected ? 0x2563eb : (isHovered ? this.lightenColor(style.color) : style.color)
    };

    // Set line style
    if (finalStyle.dashed) {
      this.drawDashedLine(graphics, points, finalStyle);
    } else {
      this.drawSolidLine(graphics, points, finalStyle);
    }

    // Draw arrow if needed
    if (finalStyle.arrowSize > 0) {
      this.drawArrow(graphics, points, finalStyle);
    }

    // Draw selection outline
    if (isSelected) {
      this.drawSelectionOutline(graphics, points);
    }
  }

  /**
   * Get interpolated points for the connection path
   */
  private getPathPoints(connection: ConnectionPath): { x: number; y: number }[] {
    const { source, target, waypoints } = connection;

    if (waypoints.length === 0) {
      return [source, target];
    }

    // Create smooth curve through waypoints
    const allPoints = [source, ...waypoints, target];
    return this.interpolatePoints(allPoints, connection.style.curveType);
  }

  /**
   * Interpolate points based on curve type
   */
  private interpolatePoints(points: ConnectionPoint[], curveType: string): { x: number; y: number }[] {
    if (points.length < 2) return points;

    switch (curveType) {
      case 'straight':
        return points;
      case 'bezier':
        return this.createBezierCurve(points);
      case 'orthogonal':
        return this.createOrthogonalPath(points);
      default:
        return points;
    }
  }

  /**
   * Create smooth bezier curve
   */
  private createBezierCurve(points: ConnectionPoint[]): { x: number; y: number }[] {
    if (points.length < 3) return points;

    const result: { x: number; y: number }[] = [];
    const steps = 20;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      for (let t = 0; t <= 1; t += 1 / steps) {
        const point = this.cubicBezierPoint(t, p0, p1, p2, p3);
        result.push(point);
      }
    }

    return result;
  }

  /**
   * Create orthogonal (right-angle) path
   */
  private createOrthogonalPath(points: ConnectionPoint[]): { x: number; y: number }[] {
    const result: { x: number; y: number }[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const current = points[i];

      // Create intermediate points for orthogonal routing
      const midX = (prev.x + current.x) / 2;
      const midY = (prev.y + current.y) / 2;

      // Choose horizontal or vertical first based on distance
      if (Math.abs(current.x - prev.x) > Math.abs(current.y - prev.y)) {
        result.push({ x: midX, y: prev.y });
        result.push({ x: midX, y: current.y });
      } else {
        result.push({ x: prev.x, y: midY });
        result.push({ x: current.x, y: midY });
      }

      result.push(current);
    }

    return result;
  }

  /**
   * Calculate point on cubic bezier curve
   */
  private cubicBezierPoint(t: number, p0: ConnectionPoint, p1: ConnectionPoint, p2: ConnectionPoint, p3: ConnectionPoint) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }

  /**
   * Draw solid line
   */
  private drawSolidLine(graphics: Graphics, points: { x: number; y: number }[], style: ConnectionStyle) {
    graphics.lineStyle(style.width, style.color, style.opacity);

    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
  }

  /**
   * Draw dashed line
   */
  private drawDashedLine(graphics: Graphics, points: { x: number; y: number }[], style: ConnectionStyle) {
    const dashLength = 8;
    const gapLength = 6;
    let dash = true;
    let currentLength = 0;
    let segmentStart = points[0];

    graphics.lineStyle(style.width, style.color, style.opacity);

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const dx = point.x - segmentStart.x;
      const dy = point.y - segmentStart.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      if (segmentLength === 0) continue;

      const unitX = dx / segmentLength;
      const unitY = dy / segmentLength;

      let remainingLength = segmentLength;

      while (remainingLength > 0) {
        const stepLength = Math.min(remainingLength, dash ? dashLength : gapLength);

        if (dash) {
          graphics.moveTo(segmentStart.x, segmentStart.y);
          graphics.lineTo(
            segmentStart.x + unitX * stepLength,
            segmentStart.y + unitY * stepLength
          );
        }

        segmentStart = {
          x: segmentStart.x + unitX * stepLength,
          y: segmentStart.y + unitY * stepLength
        };

        remainingLength -= stepLength;
        dash = !dash;
      }
    }
  }

  /**
   * Draw arrow at the end of the connection
   */
  private drawArrow(graphics: Graphics, points: { x: number; y: number }[], style: ConnectionStyle) {
    if (points.length < 2) return;

    const end = points[points.length - 1];
    const prev = points[points.length - 2];

    // Calculate arrow direction
    const dx = end.x - prev.x;
    const dy = end.y - prev.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return;

    const unitX = dx / length;
    const unitY = dy / length;

    // Arrow size and angle
    const arrowSize = style.arrowSize;
    const arrowAngle = Math.PI / 6; // 30 degrees

    const arrowX1 = end.x - arrowSize * (unitX * Math.cos(arrowAngle) - unitY * Math.sin(arrowAngle));
    const arrowY1 = end.y - arrowSize * (unitX * Math.sin(arrowAngle) + unitY * Math.cos(arrowAngle));

    const arrowX2 = end.x - arrowSize * (unitX * Math.cos(-arrowAngle) - unitY * Math.sin(-arrowAngle));
    const arrowY2 = end.y - arrowSize * (unitX * Math.sin(-arrowAngle) + unitY * Math.cos(-arrowAngle));

    // Draw arrow head
    graphics.lineStyle(0);
    graphics.beginFill(style.color, style.opacity);
    graphics.moveTo(end.x, end.y);
    graphics.lineTo(arrowX1, arrowY1);
    graphics.lineTo(arrowX2, arrowY2);
    graphics.lineTo(end.x, end.y);
    graphics.endFill();
  }

  /**
   * Draw selection outline
   */
  private drawSelectionOutline(graphics: Graphics, points: { x: number; y: number }[]) {
    graphics.lineStyle(2, 0x2563eb, 0.8);

    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
  }

  /**
   * Draw enhanced connection label with better styling and positioning
   */
  private drawEnhancedConnectionLabel(graphics: Graphics, connection: ConnectionPath) {
    if (!connection.style.label) return;

    const label = connection.style.label;
    const points = this.getPathPoints(connection);

    // Find optimal label position along the curve
    const labelPos = this.findOptimalLabelPosition(points, label.position);

    // Create enhanced text styling
    const textStyle = new TextStyle({
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 11,
      fontWeight: '500',
      fill: label.textColor,
      align: 'center',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowAlpha: 0.3,
      dropShadowDistance: 1
    });

    const text = new Text(label.text, textStyle);
    text.anchor.set(0.5);
    text.position.set(labelPos.x, labelPos.y - 10);

    // Enhanced background with rounded corners and better padding
    if (label.backgroundColor) {
      const padding = 6;
      const bounds = text.getBounds();
      const bgWidth = Math.max(bounds.width + 2 * padding, 60);
      const bgHeight = bounds.height + 2 * padding;

      graphics.beginFill(label.backgroundColor, 0.95);
      graphics.drawRoundedRect(
        labelPos.x - bgWidth / 2,
        labelPos.y - bgHeight / 2 - 10,
        bgWidth,
        bgHeight,
        4
      );
      graphics.endFill();

      // Add subtle border
      graphics.lineStyle(1, label.textColor, 0.3);
      graphics.drawRoundedRect(
        labelPos.x - bgWidth / 2,
        labelPos.y - bgHeight / 2 - 10,
        bgWidth,
        bgHeight,
        4
      );
    }

    graphics.addChild(text);
  }

  /**
   * Draw data flow indicator for bidirectional or conditional connections
   */
  private drawDataFlowIndicator(graphics: Graphics, connection: ConnectionPath) {
    const points = this.getPathPoints(connection);
    if (points.length < 2) return;

    const midIndex = Math.floor(points.length / 2);
    const midPoint = points[midIndex];

    // Draw flow direction indicator
    const flowSize = 8;
    const flowColor = connection.metadata.dataFlow === 'bidirectional' ? 0xffa500 : 0x10b981;

    graphics.beginFill(flowColor, 0.8);
    graphics.lineStyle(1, flowColor, 1);

    if (connection.metadata.dataFlow === 'bidirectional') {
      // Draw bidirectional arrows
      graphics.moveTo(midPoint.x - flowSize, midPoint.y);
      graphics.lineTo(midPoint.x - flowSize/2, midPoint.y - flowSize/2);
      graphics.lineTo(midPoint.x - flowSize/2, midPoint.y + flowSize/2);
      graphics.lineTo(midPoint.x - flowSize, midPoint.y);

      graphics.moveTo(midPoint.x + flowSize, midPoint.y);
      graphics.lineTo(midPoint.x + flowSize/2, midPoint.y - flowSize/2);
      graphics.lineTo(midPoint.x + flowSize/2, midPoint.y + flowSize/2);
      graphics.lineTo(midPoint.x + flowSize, midPoint.y);
    } else {
      // Draw conditional flow indicator
      graphics.drawCircle(midPoint.x, midPoint.y, flowSize/2);
      graphics.moveTo(midPoint.x - flowSize/3, midPoint.y - flowSize/3);
      graphics.lineTo(midPoint.x + flowSize/3, midPoint.y + flowSize/3);
      graphics.moveTo(midPoint.x + flowSize/3, midPoint.y - flowSize/3);
      graphics.lineTo(midPoint.x - flowSize/3, midPoint.y + flowSize/3);
    }

    graphics.endFill();

    // Add flow direction text
    const flowText = connection.metadata.dataFlow === 'bidirectional' ? '↔' : '?';
    const textStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 10,
      fill: 0xffffff,
      align: 'center'
    });

    const flowTextObj = new Text(flowText, textStyle);
    flowTextObj.anchor.set(0.5);
    flowTextObj.position.set(midPoint.x, midPoint.y - 1);
    graphics.addChild(flowTextObj);
  }

  /**
   * Find optimal position for connection label
   */
  private findOptimalLabelPosition(points: { x: number; y: number }[], position: string) {
    switch (position) {
      case 'start':
        return points[0];
      case 'end':
        return points[points.length - 1];
      case 'middle':
      default:
        // Find the flattest part of the curve for better readability
        let bestIndex = Math.floor(points.length / 2);
        let bestCurvature = Infinity;

        for (let i = 1; i < points.length - 1; i++) {
          const prev = points[i - 1];
          const current = points[i];
          const next = points[i + 1];

          // Calculate curvature using angle between segments
          const dx1 = current.x - prev.x;
          const dy1 = current.y - prev.y;
          const dx2 = next.x - current.x;
          const dy2 = next.y - current.y;

          const angle1 = Math.atan2(dy1, dx1);
          const angle2 = Math.atan2(dy2, dx2);
          const curvature = Math.abs(angle2 - angle1);

          if (curvature < bestCurvature) {
            bestCurvature = curvature;
            bestIndex = i;
          }
        }

        return points[bestIndex];
    }
  }

  /**
   * Render connection creation preview
   */
  renderCreationPreview(state: ConnectionCreationState) {
    // Clear existing preview
    if (this.previewGraphics) {
      this.container.removeChild(this.previewGraphics);
      this.previewGraphics = null;
    }

    if (!state.isCreating || !state.sourcePoint || !state.previewPath) return;

    this.previewGraphics = new Graphics();
    this.drawConnectionPath(this.previewGraphics, state.previewPath, false, false);

    // Make preview semi-transparent
    this.previewGraphics.alpha = 0.7;
    this.container.addChild(this.previewGraphics);
  }

  /**
   * Update animations for animated connections
   */
  private updateAnimations() {
    // Update animated connection styles
    for (const [id, connection] of this.connectionGraphics) {
      if (connection && connection.alpha !== undefined) {
        // Add subtle pulsing effect for animated connections
        if (connection.name?.includes('animated')) {
          const time = Date.now() * 0.005;
          const pulse = 0.8 + 0.2 * Math.sin(time);
          connection.alpha = pulse;
        }
      }
    }
  }

  /**
   * Handle connection click
   */
  private handleConnectionClick(connectionId: string, event: any) {
    // This will be handled by the parent component
    console.log('Connection clicked:', connectionId);
  }

  /**
   * Handle connection hover
   */
  private handleConnectionHover(connectionId: string | null) {
    // This will be handled by the parent component
    console.log('Connection hover:', connectionId);
  }

  /**
   * Lighten a color for hover effects
   */
  private lightenColor(color: number): number {
    // Convert to HSL, increase lightness, convert back
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    // Simple lighten by increasing RGB values
    const factor = 1.2;
    const newR = Math.min(255, Math.floor(r * factor));
    const newG = Math.min(255, Math.floor(g * factor));
    const newB = Math.min(255, Math.floor(b * factor));

    return (newR << 16) | (newG << 8) | newB;
  }

  /**
   * Destroy the renderer and clean up resources
   */
  destroy() {
    this.animationTicker.destroy();

    for (const graphics of this.connectionGraphics.values()) {
      this.container.removeChild(graphics);
    }
    this.connectionGraphics.clear();

    if (this.previewGraphics) {
      this.container.removeChild(this.previewGraphics);
    }

    this.app.stage.removeChild(this.container);
  }
}
