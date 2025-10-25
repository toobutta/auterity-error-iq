import React from 'react';
import { useStudioStore } from '../../hooks/useStudioStore';
import './Minimap.css';

interface MinimapProps {
  width: number;
  height: number;
}

export const Minimap: React.FC<MinimapProps> = ({ width, height }) => {
  const { state, actions } = useStudioStore();
  const { canvas, nodes } = state;

  // Calculate minimap scale
  const canvasWidth = canvas.config.width;
  const canvasHeight = canvas.config.height;
  const scaleX = width / canvasWidth;
  const scaleY = height / canvasHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculate viewport rectangle
  const viewportWidth = width / canvas.viewport.zoom;
  const viewportHeight = height / canvas.viewport.zoom;
  const viewportX = -canvas.viewport.x * scale;
  const viewportY = -canvas.viewport.y * scale;

  const handleMinimapClick = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert minimap coordinates to canvas coordinates
    const canvasX = (x / scale) * canvas.viewport.zoom - (width / canvas.viewport.zoom) / 2;
    const canvasY = (y / scale) * canvas.viewport.zoom - (height / canvas.viewport.zoom) / 2;
    
    actions.updateViewport({
      x: -canvasX,
      y: -canvasY,
    });
  };

  return (
    <div 
      className="minimap" 
      style={{ width, height }}
      onClick={handleMinimapClick}
    >
      <svg 
        width={width} 
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="minimap-svg"
      >
        {/* Grid */}
        {canvas.config.gridEnabled && (
          <defs>
            <pattern 
              id="minimap-grid" 
              width={canvas.config.gridSize * scale} 
              height={canvas.config.gridSize * scale} 
              patternUnits="userSpaceOnUse"
            >
              <path 
                d={`M ${canvas.config.gridSize * scale} 0 L 0 0 0 ${canvas.config.gridSize * scale}`} 
                fill="none" 
                stroke="var(--color-grid)" 
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
        )}
        
        {canvas.config.gridEnabled && (
          <rect 
            width={width} 
            height={height} 
            fill="url(#minimap-grid)" 
          />
        )}

        {/* Background */}
        <rect 
          width={width} 
          height={height} 
          fill="var(--color-background)" 
          opacity="0.8"
        />

        {/* Nodes */}
        {Array.from(nodes.values()).map(node => (
          <rect
            key={node.id}
            x={node.position.x * scale}
            y={node.position.y * scale}
            width={node.size.width * scale}
            height={node.size.height * scale}
            fill={`#${node.style.backgroundColor.toString(16).padStart(6, '0')}`}
            stroke={`#${node.style.borderColor.toString(16).padStart(6, '0')}`}
            strokeWidth={0.5}
            opacity="0.8"
            rx={node.style.borderRadius * scale}
          />
        ))}

        {/* Viewport Rectangle */}
        <rect
          x={Math.max(0, viewportX)}
          y={Math.max(0, viewportY)}
          width={Math.min(width - Math.max(0, viewportX), viewportWidth)}
          height={Math.min(height - Math.max(0, viewportY), viewportHeight)}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeDasharray="4,2"
          opacity="0.8"
        />
      </svg>

      {/* Controls */}
      <div className="minimap-controls">
        <button 
          className="minimap-button"
          onClick={(e) => {
            e.stopPropagation();
            actions.togglePanel('minimap');
          }}
          title="Hide minimap"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
