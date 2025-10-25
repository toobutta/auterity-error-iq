import React, { useEffect, useCallback, useState } from 'react';
import { useStudioStore } from '../../hooks/useStudioStore.js';
import { FileMenu } from './FileMenu.js';
import { fileManagementService } from '../../services/fileManagementService.js';
import { ToolBrowser } from '../ToolBrowser.js';
import { toolNodeFactory } from '../../utils/toolIntegration.js';
import {
  CursorArrowRaysIcon,
  HandRaisedIcon,
  LinkIcon,
  WrenchScrewdriverIcon,
  Squares2X2Icon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  ViewfinderCircleIcon,
  BugAntIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import './Toolbar.css';

interface ToolbarProps {
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ className = '' }) => {
  const { state, actions } = useStudioStore();
  const { canvas } = state;
  const [isToolBrowserOpen, setIsToolBrowserOpen] = useState(false);

  // Handle adding a tool to the canvas
  const handleAddTool = useCallback((toolId: string) => {
    const toolNode = toolNodeFactory.createToolNode(toolId, {
      x: canvas.viewport.x + 100,
      y: canvas.viewport.y + 100
    });
    actions.addNode(toolNode);
  }, [actions, canvas.viewport, toolNodeFactory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrlKey, metaKey, shiftKey, key } = event;
      const isCtrlOrCmd = ctrlKey || metaKey;

      // File operations
      if (isCtrlOrCmd && !shiftKey && key === 'n') {
        event.preventDefault();
        fileManagementService.newWorkflow();
      } else if (isCtrlOrCmd && !shiftKey && key === 'o') {
        event.preventDefault();
        // Would open file dialog
        console.log('Open file dialog');
      } else if (isCtrlOrCmd && !shiftKey && key === 's') {
        event.preventDefault();
        fileManagementService.saveWorkflow();
      } else if (isCtrlOrCmd && shiftKey && key === 'S') {
        event.preventDefault();
        // Would open save as dialog
        console.log('Save as dialog');
      }

      // Canvas operations
      if (key === ' ') {
        event.preventDefault();
        actions.setActiveTool(canvas.activeTool === 'select' ? 'pan' : 'select');
      } else if (key === 'g' || key === 'G') {
        event.preventDefault();
        actions.toggleGrid();
      } else if (key === 's' || key === 'S') {
        event.preventDefault();
        actions.toggleSnapToGrid();
      } else if (key === '0') {
        event.preventDefault();
        actions.updateViewport({ x: 0, y: 0, zoom: 1 });
      } else if (key === '+' || key === '=') {
        event.preventDefault();
        actions.updateViewport({ zoom: canvas.viewport.zoom * 1.2 });
      } else if (key === '-') {
        event.preventDefault();
        actions.updateViewport({ zoom: canvas.viewport.zoom / 1.2 });
      }

      // Node creation shortcuts (1-9)
      if (!isCtrlOrCmd && !shiftKey && /^[1-9]$/.test(key)) {
        event.preventDefault();
        const nodeTypes = [
          'start', 'end', 'action', 'decision', 'condition',
          'loop', 'parallel', 'merge', 'wait', 'delay'
        ];
        const nodeType = nodeTypes[parseInt(key) - 1];
        if (nodeType) {
          // Would create node at center
          console.log('Create node:', nodeType);
        }
      }

      // Bulk operations
      if (isCtrlOrCmd && key === 'a') {
        event.preventDefault();
        actions.selectAll();
      } else if (isCtrlOrCmd && key === 'd') {
        event.preventDefault();
        // Would duplicate selected
        console.log('Duplicate selected');
      }

      // History
      if (isCtrlOrCmd && key === 'z') {
        event.preventDefault();
        if (shiftKey) {
          actions.redo();
        } else {
          actions.undo();
        }
      } else if (isCtrlOrCmd && key === 'y') {
        event.preventDefault();
        actions.redo();
      }

      // Delete
      if (key === 'Delete' || key === 'Backspace') {
        event.preventDefault();
        // Would delete selected items
        console.log('Delete selected');
      }

      // Connection tool
      if (isCtrlOrCmd && key === 'c') {
        event.preventDefault();
        actions.setActiveTool('connection-create');
      } else if (key === 'Escape') {
        event.preventDefault();
        actions.setActiveTool('select');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actions, canvas]);

  return (
    <div className={`toolbar ${className}`}>
      {/* File Menu */}
      <FileMenu />

      <div className="toolbar-separator" />

      {/* Tool Selection Group */}
      <div className="toolbar-group">
        <button
          className={`toolbar-button ${canvas.activeTool === 'select' ? 'active' : ''}`}
          onClick={() => actions.setActiveTool('select')}
          title="Select Tool (Space to toggle)"
        >
          <CursorArrowRaysIcon className="w-4 h-4" />
          <span className="tool-label">Select</span>
        </button>

        <button
          className={`toolbar-button ${canvas.activeTool === 'pan' ? 'active' : ''}`}
          onClick={() => actions.setActiveTool('pan')}
          title="Pan Tool (Space to toggle)"
        >
          <HandRaisedIcon className="w-4 h-4" />
          <span className="tool-label">Pan</span>
        </button>

        <button
          className={`toolbar-button ${canvas.activeTool === 'connection-create' ? 'active' : ''}`}
          onClick={() => actions.setActiveTool('connection-create')}
          title="Connection Tool (Ctrl+C)"
        >
          <LinkIcon className="w-4 h-4" />
          <span className="tool-label">Connect</span>
        </button>

        <button
          className="toolbar-button"
          onClick={() => setIsToolBrowserOpen(true)}
          title="Tool Library (Add external tools and integrations)"
        >
          <WrenchScrewdriverIcon className="w-4 h-4" />
          <span className="tool-label">Tools</span>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* View Controls */}
      <div className="toolbar-group">
        <button
          className={`toolbar-button ${canvas.config.gridEnabled ? 'active' : ''}`}
          onClick={actions.toggleGrid}
          title="Toggle Grid (Ctrl+G)"
        >
          <Squares2X2Icon className="w-4 h-4" />
          <span className="tool-label">Grid</span>
        </button>

        <button
          className={`toolbar-button ${canvas.config.snapToGrid ? 'active' : ''}`}
          onClick={actions.toggleSnapToGrid}
          title="Snap to Grid (Ctrl+S)"
        >
          <MapPinIcon className="w-4 h-4" />
          <span className="tool-label">Snap</span>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Zoom Controls */}
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={() => actions.updateViewport({ zoom: canvas.viewport.zoom / 1.2 })}
          title="Zoom Out (-)"
        >
          <MinusIcon className="w-4 h-4" />
          <span className="tool-label">Out</span>
        </button>

        <div className="zoom-display">
          {Math.round(canvas.viewport.zoom * 100)}%
        </div>

        <button
          className="toolbar-button"
          onClick={() => actions.updateViewport({ zoom: canvas.viewport.zoom * 1.2 })}
          title="Zoom In (+)"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="tool-label">In</span>
        </button>

        <button
          className="toolbar-button"
          onClick={() => actions.updateViewport({ x: 0, y: 0, zoom: 1 })}
          title="Fit to Screen (0)"
        >
          <ViewfinderCircleIcon className="w-4 h-4" />
          <span className="tool-label">Fit</span>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* Debug Controls */}
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={() => actions.togglePanel('debug')}
          title="Toggle Debug Panel"
        >
          <BugAntIcon className="w-4 h-4" />
          <span className="tool-label">Debug</span>
        </button>
        
        <button
          className={`toolbar-button ${state.panels.aiDashboard.visible ? 'active' : ''}`}
          onClick={() => actions.togglePanel('aiDashboard')}
          title="Toggle AI Dashboard"
        >
          <CpuChipIcon className="w-4 h-4" />
          <span className="tool-label">AI</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="toolbar-spacer" />

      {/* Status */}
      <div className="toolbar-status">
        <div className="status-item">
          {canvas.activeTool}
        </div>
      </div>

      {/* Tool Browser */}
      <ToolBrowser
        isOpen={isToolBrowserOpen}
        onClose={() => setIsToolBrowserOpen(false)}
        onAddTool={handleAddTool}
      />
    </div>
  );
};