import { useEffect } from 'react';
import { CanvasTool } from '../types/studio.js';

/**
 * Hook to handle keyboard shortcuts for the canvas
 * @param actions - Studio store actions
 * @param activeTool - Current active tool
 * @param canvasEnabled - Whether shortcuts should be active
 */
export function useKeyboardShortcuts(
  actions: any,
  activeTool: CanvasTool,
  canvasEnabled: boolean = true
) {
  useEffect(() => {
    if (!canvasEnabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if modals are open or user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      // Prevent default for our handled shortcuts
      const preventDefault = () => {
        e.preventDefault();
        e.stopPropagation();
      };
      
      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key) {
          case 'v': // Select tool
            preventDefault();
            actions.setTool('select');
            break;
          case 'h': // Pan tool
            preventDefault();
            actions.setTool('pan');
            break;
          case 'z': // Zoom tool
            preventDefault();
            actions.setTool('zoom');
            break;
          case 'c': // Connection tool
            preventDefault();
            actions.setTool('connection-create');
            break;
          case 'n': // Node creation tool
            preventDefault();
            actions.setTool('node-create');
            break;
          case 'Delete': // Delete selected
          case 'Backspace':
            preventDefault();
            actions.deleteSelected();
            break;
          case ' ': // Space: temporary pan mode
            preventDefault();
            if (activeTool !== 'pan') {
              actions.setTempTool('pan');
            }
            break;
          case '0': // Reset zoom and position
            preventDefault();
            actions.updateViewport({ x: 0, y: 0, zoom: 1 });
            break;
          case '+': // Zoom in
          case '=':
            preventDefault();
            actions.zoomIn();
            break;
          case '-': // Zoom out
            preventDefault();
            actions.zoomOut();
            break;
          case 'Escape': // Cancel current operation or selection
            preventDefault();
            actions.cancelOperation();
            break;
        }
      }
      
      // Ctrl/Cmd shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'a': // Select all
            preventDefault();
            actions.selectAll();
            break;
          case 'g': // Toggle grid
            preventDefault();
            actions.toggleGrid();
            break;
          case 's': // Toggle snap to grid
            if (!e.shiftKey) {
              preventDefault();
              actions.toggleSnapToGrid();
            }
            break;
          case 'l': // Auto layout
            preventDefault();
            actions.autoLayout && actions.autoLayout('hierarchical');
            break;
          case 'f': // Fit to view
            preventDefault();
            actions.fitToView();
            break;
          case 'z': // Undo
            if (!e.shiftKey) {
              preventDefault();
              actions.undo && actions.undo();
            } else {
              // Redo (Ctrl+Shift+Z)
              preventDefault();
              actions.redo && actions.redo();
            }
            break;
          case 'y': // Redo
            preventDefault();
            actions.redo && actions.redo();
            break;
        }
      }
    };
    
    // Key up handler for temporary tool changes
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && activeTool === 'pan') {
        actions.restorePreviousTool();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [actions, activeTool, canvasEnabled]);
}
