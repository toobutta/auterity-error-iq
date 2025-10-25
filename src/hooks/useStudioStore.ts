import { useState, useCallback, useRef } from 'react';
import { StudioState, StudioNode, Connection, Viewport, CanvasTool, SelectionState, Workspace, Project } from '../types/studio';
import { AuthState } from '../types/auth';
import { LIGHT_THEME, DEFAULT_CANVAS_CONFIG } from '../constants/themes';
import { authService } from '../services/authService';

const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  token: null,
  refreshToken: null,
  error: null,
};

const initialState: StudioState = {
  canvas: {
    viewport: { x: 0, y: 0, zoom: 1 },
    config: DEFAULT_CANVAS_CONFIG,
    activeTool: 'select',
  },
  nodes: new Map(),
  connections: new Map(),
  selection: {
    selectedNodes: [],
    selectedConnections: [],
    isSelecting: false,
  },
  panels: {
    nodePalette: { visible: true, width: 280, collapsed: false },
    properties: { visible: true, width: 320, collapsed: false },
    minimap: { visible: true, width: 200, height: 150 },
    toolbar: { visible: true, position: 'top' },
    debug: { visible: false, width: 400, collapsed: false },
    aiDashboard: { visible: true, width: 380, collapsed: false, position: 'right' },
  },
  theme: LIGHT_THEME,
  auth: initialAuthState,
  workspace: {},
  history: {
    canUndo: false,
    canRedo: false,
    currentIndex: 0,
  },
};

export function useStudioStore() {
  const [state, setState] = useState<StudioState>(initialState);
  const historyRef = useRef<StudioState[]>([initialState]);
  const historyIndexRef = useRef(0);

  // Canvas actions
  const updateViewport = useCallback((viewport: Partial<Viewport>) => {
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        viewport: { ...prev.canvas.viewport, ...viewport },
      },
    }));
  }, []);

  const setActiveTool = useCallback((tool: CanvasTool) => {
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        activeTool: tool,
      },
    }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        config: {
          ...prev.canvas.config,
          gridEnabled: !prev.canvas.config.gridEnabled,
        },
      },
    }));
  }, []);

  const toggleSnapToGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        config: {
          ...prev.canvas.config,
          snapToGrid: !prev.canvas.config.snapToGrid,
        },
      },
    }));
  }, []);

  // Node actions
  const addNode = useCallback((node: StudioNode) => {
    setState(prev => {
      const newNodes = new Map(prev.nodes);
      newNodes.set(node.id, node);
      return {
        ...prev,
        nodes: newNodes,
      };
    });
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<StudioNode>) => {
    setState(prev => {
      const newNodes = new Map(prev.nodes);
      const existingNode = newNodes.get(id);
      if (existingNode) {
        newNodes.set(id, { ...existingNode, ...updates });
      }
      return {
        ...prev,
        nodes: newNodes,
      };
    });
  }, []);

  const deleteNode = useCallback((id: string) => {
    setState(prev => {
      const newNodes = new Map(prev.nodes);
      const newConnections = new Map(prev.connections);
      
      // Remove node
      newNodes.delete(id);
      
      // Remove connections to/from this node
      for (const [connId, connection] of newConnections) {
        if (connection.sourceId === id || connection.targetId === id) {
          newConnections.delete(connId);
        }
      }
      
      return {
        ...prev,
        nodes: newNodes,
        connections: newConnections,
        selection: {
          ...prev.selection,
          selectedNodes: prev.selection.selectedNodes.filter(nodeId => nodeId !== id),
        },
      };
    });
  }, []);

  // Connection actions
  const addConnection = useCallback((connection: Connection) => {
    setState(prev => {
      const newConnections = new Map(prev.connections);
      newConnections.set(connection.id, connection);
      return {
        ...prev,
        connections: newConnections,
      };
    });
  }, []);

  const updateConnection = useCallback((id: string, updates: Partial<Connection>) => {
    setState(prev => {
      const newConnections = new Map(prev.connections);
      const existingConnection = newConnections.get(id);
      if (existingConnection) {
        newConnections.set(id, { ...existingConnection, ...updates });
      }
      return {
        ...prev,
        connections: newConnections,
      };
    });
  }, []);

  const deleteConnection = useCallback((id: string) => {
    setState(prev => {
      const newConnections = new Map(prev.connections);
      newConnections.delete(id);
      return {
        ...prev,
        connections: newConnections,
        selection: {
          ...prev.selection,
          selectedConnections: prev.selection.selectedConnections.filter(connId => connId !== id),
        },
      };
    });
  }, []);

  // Selection actions
  const selectNodes = useCallback((nodeIds: string[], addToSelection = false) => {
    setState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        selectedNodes: addToSelection 
          ? [...new Set([...prev.selection.selectedNodes, ...nodeIds])]
          : nodeIds,
      },
    }));
  }, []);

  const selectConnections = useCallback((connectionIds: string[], addToSelection = false) => {
    setState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        selectedConnections: addToSelection
          ? [...new Set([...prev.selection.selectedConnections, ...connectionIds])]
          : connectionIds,
      },
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selection: {
        selectedNodes: [],
        selectedConnections: [],
        isSelecting: false,
      },
    }));
  }, []);

  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selection: {
        selectedNodes: Array.from(prev.nodes.keys()),
        selectedConnections: Array.from(prev.connections.keys()),
        isSelecting: false,
      },
    }));
  }, []);

  // Panel actions
  const togglePanel = useCallback((panelName: keyof StudioState['panels']) => {
    setState(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [panelName]: {
          ...prev.panels[panelName],
          visible: !prev.panels[panelName].visible,
        },
      },
    }));
  }, []);

  const resizePanel = useCallback((panelName: keyof StudioState['panels'], width: number) => {
    setState(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [panelName]: {
          ...prev.panels[panelName],
          width,
        },
      },
    }));
  }, []);

  // History actions
  const saveState = useCallback(() => {
    setState(currentState => {
      const currentIndex = historyIndexRef.current;
      const history = historyRef.current;

      // Remove any future history if we're not at the end
      if (currentIndex < history.length - 1) {
        historyRef.current = history.slice(0, currentIndex + 1);
      }

      // Add current state to history
      historyRef.current.push({ ...currentState });
      historyIndexRef.current = historyRef.current.length - 1;

      // Limit history size
      if (historyRef.current.length > 50) {
        historyRef.current = historyRef.current.slice(-50);
        historyIndexRef.current = historyRef.current.length - 1;
      }

      return {
        ...currentState,
        history: {
          canUndo: historyIndexRef.current > 0,
          canRedo: historyIndexRef.current < historyRef.current.length - 1,
          currentIndex: historyIndexRef.current,
        },
      };
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const previousState = historyRef.current[historyIndexRef.current];
      setState({
        ...previousState,
        history: {
          canUndo: historyIndexRef.current > 0,
          canRedo: true,
          currentIndex: historyIndexRef.current,
        },
      });
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextState = historyRef.current[historyIndexRef.current];
      setState({
        ...nextState,
        history: {
          canUndo: true,
          canRedo: historyIndexRef.current < historyRef.current.length - 1,
          currentIndex: historyIndexRef.current,
        },
      });
    }
  }, []);

  // Authentication actions
  const setAuthLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      auth: {
        ...prev.auth,
        isLoading,
      },
    }));
  }, []);

  const setAuthUser = useCallback((user: any, token: string, refreshToken?: string) => {
    setState(prev => ({
      ...prev,
      auth: {
        ...prev.auth,
        isAuthenticated: true,
        isLoading: false,
        user,
        token,
        refreshToken,
        error: null,
      },
    }));
  }, []);

  const setAuthError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      auth: {
        ...prev.auth,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        refreshToken: null,
        error,
      },
    }));
  }, []);

  const clearAuth = useCallback(() => {
    setState(prev => ({
      ...prev,
      auth: initialAuthState,
    }));
  }, []);

  // Workspace actions
  const setCurrentWorkspace = useCallback((workspace: Workspace) => {
    setState(prev => ({
      ...prev,
      workspace: {
        ...prev.workspace,
        currentWorkspace: workspace,
        currentProject: undefined, // Reset project when workspace changes
      },
    }));
  }, []);

  const setCurrentProject = useCallback((project: Project) => {
    setState(prev => ({
      ...prev,
      workspace: {
        ...prev.workspace,
        currentProject: project,
      },
    }));
  }, []);

  return {
    state,
    actions: {
      // Canvas
      updateViewport,
      setActiveTool,
      toggleGrid,
      toggleSnapToGrid,

      // Nodes
      addNode,
      updateNode,
      deleteNode,

      // Connections
      addConnection,
      updateConnection,
      deleteConnection,

      // Selection
      selectNodes,
      selectConnections,
      clearSelection,
      selectAll,

      // Panels
      togglePanel,
      resizePanel,

      // Authentication
      setAuthLoading,
      setAuthUser,
      setAuthError,
      clearAuth,

      // Workspace
      setCurrentWorkspace,
      setCurrentProject,

      // History
      saveState,
      undo,
      redo,
    },
  };
}
