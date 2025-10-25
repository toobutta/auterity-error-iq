import React, { useCallback, useMemo } from 'react';
import { Graphics } from 'pixi.js';
import { StudioNode, Position } from '../../types/studio.js';

interface CanvasToolsProps {
  activeTool: string;
  nodes: Map<string, StudioNode>;
  selectedNodes: string[];
  canvas: any;
  viewport: any;
  onToolChange: (tool: string) => void;
  onNodeCreate: (nodeType: string, position: Position) => void;
  onNodeSelect: (nodeId: string, multiSelect?: boolean) => void;
  onNodeDuplicate: (nodeIds: string[]) => void;
  onNodeDelete: (nodeIds: string[]) => void;
  onConnectionCreate: (sourceId: string, targetId: string) => void;
}

export const CanvasTools: React.FC<CanvasToolsProps> = React.memo(({
  activeTool,
  nodes,
  selectedNodes,
  canvas,
  viewport,
  onToolChange,
  onNodeCreate,
  onNodeSelect,
  onNodeDuplicate,
  onNodeDelete,
  onConnectionCreate
}) => {

  // Tool-specific keyboard shortcuts
  const handleToolShortcut = useCallback((key: string, ctrlKey: boolean, shiftKey: boolean) => {
    switch (key.toLowerCase()) {
      case 'v':
        if (!ctrlKey) {
          onToolChange('select');
        }
        break;
      case 'h':
        if (!ctrlKey) {
          onToolChange('pan');
        }
        break;
      case 'c':
        if (!ctrlKey) {
          onToolChange('connection-create');
        }
        break;
      case 'n':
        if (!ctrlKey) {
          onToolChange('node-create');
        }
        break;
      case 'z':
        if (!ctrlKey) {
          onToolChange('zoom');
        }
        break;
      case 'l':
        if (!ctrlKey) {
          onToolChange('lasso-select');
        }
        break;
      case 'r':
        if (!ctrlKey) {
          onToolChange('rectangle-select');
        }
        break;
    }
  }, [onToolChange]);

  // Node creation at center of viewport
  const createNodeAtCenter = useCallback((nodeType: string) => {
    const centerX = 0; // Will be calculated based on viewport
    const centerY = 0;

    // Convert screen coordinates to world coordinates
    const worldX = (centerX - viewport.x) / viewport.zoom;
    const worldY = (centerY - viewport.y) / viewport.zoom;

    // Snap to grid if enabled
    let finalX = worldX;
    let finalY = worldY;

    if (canvas.config.snapToGrid) {
      const gridSize = canvas.config.gridSize;
      finalX = Math.round(finalX / gridSize) * gridSize;
      finalY = Math.round(finalY / gridSize) * gridSize;
    }

    onNodeCreate(nodeType, { x: finalX, y: finalY });
  }, [viewport, canvas.config, onNodeCreate]);

  // Duplicate selected nodes
  const duplicateSelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) return;

    const offset = 50; // Offset for duplicated nodes
    const duplicatedIds: string[] = [];

    selectedNodes.forEach(nodeId => {
      const node = nodes.get(nodeId);
      if (node) {
        const newPosition = {
          x: node.position.x + offset,
          y: node.position.y + offset
        };

        // Create duplicate node (this will be handled by the store)
        duplicatedIds.push(nodeId);
      }
    });

    if (duplicatedIds.length > 0) {
      onNodeDuplicate(duplicatedIds);
    }
  }, [nodes, selectedNodes, onNodeDuplicate]);

  // Delete selected items
  const deleteSelectedItems = useCallback(() => {
    if (selectedNodes.length > 0) {
      onNodeDelete(selectedNodes);
    }
  }, [selectedNodes, onNodeDelete]);

  // Select all nodes
  const selectAllNodes = useCallback(() => {
    const allNodeIds = Array.from(nodes.keys());
    allNodeIds.forEach(nodeId => onNodeSelect(nodeId, true));
  }, [nodes, onNodeSelect]);

  // Clear selection
  const clearSelection = useCallback(() => {
    // This will be handled by the store
  }, []);

  // Tool action handlers
  const toolActions = useMemo(() => ({
    'select': {
      onClick: (position: Position) => {
        // Handle selection logic
      },
      onDrag: (start: Position, end: Position) => {
        // Handle selection rectangle
      },
      cursor: 'default'
    },
    'pan': {
      onClick: () => {},
      onDrag: () => {},
      cursor: 'grab'
    },
    'connection-create': {
      onClick: (position: Position) => {
        // Find node at position and start connection
      },
      onDrag: () => {},
      cursor: 'crosshair'
    },
    'node-create': {
      onClick: (position: Position) => {
        // Create node at position
        onNodeCreate('action', position);
      },
      onDrag: () => {},
      cursor: 'copy'
    },
    'zoom': {
      onClick: () => {},
      onDrag: () => {},
      cursor: 'zoom-in'
    },
    'lasso-select': {
      onClick: () => {},
      onDrag: () => {},
      cursor: 'crosshair'
    },
    'rectangle-select': {
      onClick: () => {},
      onDrag: () => {},
      cursor: 'crosshair'
    }
  }), [onNodeCreate]);

  // Get current tool configuration
  const currentTool = toolActions[activeTool as keyof typeof toolActions] || toolActions.select;

  // Bulk operations
  const bulkOperations = useMemo(() => ({
    duplicate: duplicateSelectedNodes,
    delete: deleteSelectedItems,
    selectAll: selectAllNodes,
    clearSelection
  }), [duplicateSelectedNodes, deleteSelectedItems, selectAllNodes, clearSelection]);

  // Node type shortcuts
  const nodeTypeShortcuts = useMemo(() => ({
    '1': 'start',
    '2': 'action',
    '3': 'decision',
    '4': 'api-call',
    '5': 'email',
    '6': 'database',
    '7': 'ai-model',
    '8': 'end'
  }), []);

  return null; // This component manages tool logic but doesn't render UI
});

CanvasTools.displayName = 'CanvasTools';
