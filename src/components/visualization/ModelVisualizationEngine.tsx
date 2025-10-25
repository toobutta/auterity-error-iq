/**
 * PixiJS Model Visualization Engine
 * Advanced WebGL/WebGPU-powered neural network and model visualization
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle, Assets, Ticker } from 'pixi.js';
import { gsap } from 'gsap';

interface ModelNode {
  id: string;
  type: 'input' | 'hidden' | 'output' | 'attention' | 'embedding' | 'conv' | 'pooling' | 'dropout';
  position: { x: number; y: number; z?: number };
  connections: string[];
  activation?: number;
  weights?: number[];
  bias?: number;
  metadata?: {
    parameters: number;
    flops: number;
    memory: number;
    shape?: number[];
  };
}

interface Connection {
  from: string;
  to: string;
  weight: number;
  active: boolean;
}

interface ModelVisualizationProps {
  modelData: {
    nodes: ModelNode[];
    connections: Connection[];
    architecture: string;
    performance: {
      accuracy: number;
      latency: number;
      throughput: number;
      loss: number;
    };
    training?: {
      epoch: number;
      loss: number;
      accuracy: number;
    };
  };
  interactive?: boolean;
  showMetrics?: boolean;
  realTime?: boolean;
  onNodeClick?: (node: ModelNode) => void;
  onConnectionClick?: (connection: Connection) => void;
  className?: string;
}

export const ModelVisualizationEngine: React.FC<ModelVisualizationProps> = ({
  modelData,
  interactive = true,
  showMetrics = true,
  realTime = false,
  onNodeClick,
  onConnectionClick,
  className = ''
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const containerRef = useRef<Container | null>(null);
  const [selectedNode, setSelectedNode] = useState<ModelNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Node styling configuration
  const nodeStyles = {
    input: { radius: 18, color: 0x4ade80, borderColor: 0x22c55e, glowColor: 0x10b981 },
    hidden: { radius: 15, color: 0x60a5fa, borderColor: 0x3b82f6, glowColor: 0x2563eb },
    output: { radius: 18, color: 0xf87171, borderColor: 0xef4444, glowColor: 0xdc2626 },
    attention: { radius: 20, color: 0xa78bfa, borderColor: 0x8b5cf6, glowColor: 0x7c3aed },
    embedding: { radius: 22, color: 0xfbbf24, borderColor: 0xf59e0b, glowColor: 0xd97706 },
    conv: { radius: 16, color: 0x34d399, borderColor: 0x10b981, glowColor: 0x059669 },
    pooling: { radius: 16, color: 0x60a5fa, borderColor: 0x3b82f6, glowColor: 0x2563eb },
    dropout: { radius: 14, color: 0x9ca3af, borderColor: 0x6b7280, glowColor: 0x4b5563 }
  };

  // Initialize PixiJS Application
  const initializePixiApp = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Create PixiJS Application
      const app = new Application();

      await app.init({
        width: canvasRef.current.clientWidth || 800,
        height: canvasRef.current.clientHeight || 600,
        backgroundColor: 0x0a0a0a, // Dark background
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: 'webgpu' // Use WebGPU if available, fallback to WebGL
      });

      // Append canvas to DOM
      canvasRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Create main container
      const container = new Container();
      app.stage.addChild(container);
      containerRef.current = container;

      // Initialize the model visualization
      await initializeModel(container);

      // Start animation loop
      app.ticker.add(() => {
        updateAnimations();
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize PixiJS:', err);
      setError('Failed to initialize visualization engine');
      setIsLoading(false);
    }
  }, []);

  // Initialize model visualization
  const initializeModel = useCallback(async (container: Container) => {
    // Create layers for different elements
    const connectionsLayer = new Container();
    const nodesLayer = new Container();
    const effectsLayer = new Container();

    container.addChild(connectionsLayer);
    container.addChild(nodesLayer);
    container.addChild(effectsLayer);

    // Render connections first (behind nodes)
    renderConnections(connectionsLayer, modelData.connections);

    // Render nodes
    renderNodes(nodesLayer, modelData.nodes, effectsLayer);

    // Add interactive features if enabled
    if (interactive) {
      setupInteractivity(container);
    }

    // Add real-time updates if enabled
    if (realTime) {
      setupRealTimeUpdates();
    }
  }, [modelData, interactive, realTime]);

  // Render connection lines between nodes
  const renderConnections = useCallback((container: Container, connections: Connection[]) => {
    connections.forEach(connection => {
      const fromNode = modelData.nodes.find(n => n.id === connection.from);
      const toNode = modelData.nodes.find(n => n.id === connection.to);

      if (!fromNode || !toNode) return;

      const connectionGraphic = new Graphics();

      // Calculate control points for curved connections
      const dx = toNode.position.x - fromNode.position.x;
      const dy = toNode.position.y - fromNode.position.y;
      const cp1x = fromNode.position.x + dx * 0.5;
      const cp1y = fromNode.position.y;
      const cp2x = toNode.position.x - dx * 0.5;
      const cp2y = toNode.position.y;

      // Draw curved connection
      connectionGraphic
        .moveTo(fromNode.position.x, fromNode.position.y)
        .bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toNode.position.x, toNode.position.y)
        .stroke({
          color: connection.active ? 0x60a5fa : 0x374151,
          width: connection.active ? 3 : 2,
          alpha: connection.active ? 1 : 0.6
        });

      // Add weight indicator if weight is significant
      if (Math.abs(connection.weight) > 0.5) {
        const midX = (fromNode.position.x + toNode.position.x) / 2;
        const midY = (fromNode.position.y + toNode.position.y) / 2;

        const weightText = new Text({
          text: connection.weight.toFixed(2),
          style: new TextStyle({
            fontSize: 10,
            fill: connection.weight > 0 ? 0x10b981 : 0xef4444,
            align: 'center'
          })
        });
        weightText.anchor.set(0.5);
        weightText.position.set(midX, midY);
        container.addChild(weightText);
      }

      container.addChild(connectionGraphic);

      // Add click interaction for connections
      if (interactive && onConnectionClick) {
        connectionGraphic.eventMode = 'static';
        connectionGraphic.cursor = 'pointer';
        connectionGraphic.on('pointertap', () => onConnectionClick(connection));
      }
    });
  }, [modelData.nodes, interactive, onConnectionClick]);

  // Render neural network nodes
  const renderNodes = useCallback((container: Container, nodes: ModelNode[], effectsLayer: Container) => {
    nodes.forEach(node => {
      const nodeContainer = new Container();

      // Main node graphic
      const nodeGraphic = new Graphics();
      const style = nodeStyles[node.type];

      // Draw node with glow effect
      nodeGraphic
        .circle(0, 0, style.radius)
        .fill(style.color)
        .stroke({ color: style.borderColor, width: 2 });

      nodeContainer.addChild(nodeGraphic);

      // Node label
      const labelText = new Text({
        text: node.type.charAt(0).toUpperCase(),
        style: new TextStyle({
          fontSize: 12,
          fill: 0xffffff,
          fontWeight: 'bold',
          align: 'center'
        })
      });
      labelText.anchor.set(0.5);
      nodeContainer.addChild(labelText);

      // Add metadata display
      if (node.metadata) {
        const metaText = new Text({
          text: `${node.metadata.parameters}`,
          style: new TextStyle({
            fontSize: 8,
            fill: 0xd1d5db,
            align: 'center'
          })
        });
        metaText.anchor.set(0.5);
        metaText.position.set(0, style.radius + 8);
        nodeContainer.addChild(metaText);
      }

      // Position node
      nodeContainer.position.set(node.position.x, node.position.y);

      // Add activation glow effect
      if (node.activation && node.activation > 0.3) {
        const glowGraphic = new Graphics();
        glowGraphic
          .circle(0, 0, style.radius + 5)
          .fill(style.glowColor)
          .stroke({ color: style.glowColor, width: 1, alpha: 0.5 });

        glowGraphic.alpha = node.activation;
        nodeContainer.addChildAt(glowGraphic, 0); // Add behind main graphic
      }

      // Add interactive features
      if (interactive) {
        nodeContainer.eventMode = 'static';
        nodeContainer.cursor = 'pointer';

        // Hover effects
        nodeContainer.on('pointerover', () => {
          gsap.to(nodeContainer.scale, { x: 1.1, y: 1.1, duration: 0.2 });
        });

        nodeContainer.on('pointerout', () => {
          gsap.to(nodeContainer.scale, { x: 1, y: 1, duration: 0.2 });
        });

        nodeContainer.on('pointertap', () => {
          setSelectedNode(node);
          onNodeClick?.(node);

          // Selection animation
          gsap.to(nodeContainer.scale, {
            x: 1.2, y: 1.2, duration: 0.1, yoyo: true, repeat: 1
          });
        });
      }

      container.addChild(nodeContainer);
    });
  }, [interactive, onNodeClick]);

  // Setup interactive features
  const setupInteractivity = useCallback((container: Container) => {
    // Add zoom and pan controls
    container.eventMode = 'static';

    // Zoom functionality
    const zoomFactor = 1.1;
    const onWheel = (event: any) => {
      const zoom = event.deltaY > 0 ? 1 / zoomFactor : zoomFactor;
      const newScale = Math.max(0.1, Math.min(5, container.scale.x * zoom));

      gsap.to(container.scale, {
        x: newScale,
        y: newScale,
        duration: 0.2,
        ease: 'power2.out'
      });
    };

    // Pan functionality
    let isDragging = false;
    let lastPosition = { x: 0, y: 0 };

    const onPointerDown = (event: any) => {
      isDragging = true;
      lastPosition = { x: event.data.global.x, y: event.data.global.y };
      container.cursor = 'grabbing';
    };

    const onPointerMove = (event: any) => {
      if (!isDragging) return;

      const dx = event.data.global.x - lastPosition.x;
      const dy = event.data.global.y - lastPosition.y;

      container.position.x += dx;
      container.position.y += dy;

      lastPosition = { x: event.data.global.x, y: event.data.global.y };
    };

    const onPointerUp = () => {
      isDragging = false;
      container.cursor = 'grab';
    };

    // Add event listeners
    container.on('wheel', onWheel);
    container.on('pointerdown', onPointerDown);
    container.on('pointermove', onPointerMove);
    container.on('pointerup', onPointerUp);
    container.on('pointerupoutside', onPointerUp);
  }, []);

  // Setup real-time updates for live data
  const setupRealTimeUpdates = useCallback(() => {
    // Simulate real-time data updates (replace with actual WebSocket/HTTP polling)
    const updateInterval = setInterval(() => {
      // Update node activations with simulated data
      modelData.nodes.forEach(node => {
        if (Math.random() > 0.8) { // 20% chance to update
          node.activation = Math.random();
        }
      });

      // Trigger re-render
      if (containerRef.current) {
        // Update visual elements based on new data
        updateNodeVisuals();
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  // Update node visuals based on new data
  const updateNodeVisuals = useCallback(() => {
    if (!containerRef.current) return;

    // This would update the visual representation of nodes
    // based on real-time data changes
    console.log('Updating node visuals with real-time data');
  }, []);

  // Animation update loop
  const updateAnimations = useCallback(() => {
    // Handle any continuous animations
    // Particle effects, pulsing nodes, etc.
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializePixiApp();
  }, [initializePixiApp]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (appRef.current && canvasRef.current) {
        appRef.current.renderer.resize(
          canvasRef.current.clientWidth,
          canvasRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`model-visualization-engine ${className}`}>
      <div
        ref={canvasRef}
        className="pixi-canvas-container"
        style={{
          width: '100%',
          height: '600px',
          position: 'relative',
          background: '#0a0a0a'
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Initializing neural network visualization...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-overlay">
          <div className="error-message">
            <h3>Visualization Error</h3>
            <p>{error}</p>
            <button onClick={initializePixiApp}>Retry</button>
          </div>
        </div>
      )}

      {/* Metrics Overlay */}
      {showMetrics && !isLoading && !error && (
        <div className="metrics-overlay">
          <div className="metric-card">
            <div className="metric-label">Accuracy</div>
            <div className="metric-value">
              {(modelData.performance.accuracy * 100).toFixed(1)}%
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Latency</div>
            <div className="metric-value">
              {modelData.performance.latency}ms
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Throughput</div>
            <div className="metric-value">
              {modelData.performance.throughput} req/s
            </div>
          </div>

          {modelData.training && (
            <div className="metric-card">
              <div className="metric-label">Training Loss</div>
              <div className="metric-value">
                {modelData.training.loss.toFixed(4)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="node-details-panel">
          <h3>{selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)} Node</h3>

          <div className="node-info">
            <div className="info-row">
              <span>ID:</span>
              <span>{selectedNode.id}</span>
            </div>

            {selectedNode.activation !== undefined && (
              <div className="info-row">
                <span>Activation:</span>
                <span>{(selectedNode.activation * 100).toFixed(1)}%</span>
              </div>
            )}

            {selectedNode.bias !== undefined && (
              <div className="info-row">
                <span>Bias:</span>
                <span>{selectedNode.bias.toFixed(4)}</span>
              </div>
            )}

            {selectedNode.metadata && (
              <>
                <div className="info-row">
                  <span>Parameters:</span>
                  <span>{selectedNode.metadata.parameters.toLocaleString()}</span>
                </div>

                {selectedNode.metadata.shape && (
                  <div className="info-row">
                    <span>Shape:</span>
                    <span>[{selectedNode.metadata.shape.join(', ')}]</span>
                  </div>
                )}

                <div className="info-row">
                  <span>Memory:</span>
                  <span>{selectedNode.metadata.memory} MB</span>
                </div>

                <div className="info-row">
                  <span>FLOPs:</span>
                  <span>{selectedNode.metadata.flops.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          {selectedNode.weights && selectedNode.weights.length > 0 && (
            <div className="weights-preview">
              <h4>Weight Distribution</h4>
              <div className="weights-histogram">
                {/* Simple histogram visualization */}
                {selectedNode.weights.slice(0, 10).map((weight, index) => (
                  <div
                    key={index}
                    className="weight-bar"
                    style={{
                      height: `${Math.abs(weight) * 50}px`,
                      backgroundColor: weight > 0 ? '#10b981' : '#ef4444'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="visualization-controls">
        <button
          className="control-button"
          onClick={() => {
            if (containerRef.current) {
              gsap.to(containerRef.current.scale, { x: 1, y: 1, duration: 0.5 });
              gsap.to(containerRef.current.position, { x: 0, y: 0, duration: 0.5 });
            }
          }}
        >
          Reset View
        </button>

        <button
          className="control-button"
          onClick={() => {
            if (containerRef.current) {
              gsap.to(containerRef.current.scale, { x: 0.8, y: 0.8, duration: 0.5 });
            }
          }}
        >
          Zoom Out
        </button>

        <button
          className="control-button"
          onClick={() => {
            if (containerRef.current) {
              gsap.to(containerRef.current.scale, { x: 1.2, y: 1.2, duration: 0.5 });
            }
          }}
        >
          Zoom In
        </button>
      </div>
    </div>
  );
};

export default ModelVisualizationEngine;
