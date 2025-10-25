import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { StudioNode, Connection, Position } from '../../types/studio.js';

// Canvas State Interface
interface CanvasState {
  nodes: Map<string, StudioNode>;
  connections: Map<string, Connection>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  selectedNodes: string[];
  selectedConnections: string[];
  activeTool: string;
  config: {
    width: number;
    height: number;
    backgroundColor: number;
    gridEnabled: boolean;
    gridSize: number;
    gridColor: number;
    snapToGrid: boolean;
    showPerformance: boolean;
  };
  history: {
    past: any[];
    present: any;
    future: any[];
  };
}

// Canvas Actions Interface
interface CanvasActions {
  // Node operations
  addNode: (node: StudioNode) => void;
  updateNode: (id: string, updates: Partial<StudioNode>) => void;
  deleteNode: (id: string) => void;
  duplicateNodes: (nodeIds: string[]) => void;

  // Connection operations
  addConnection: (connection: Connection) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;

  // Selection operations
  selectNodes: (nodeIds: string[], multiSelect?: boolean) => void;
  selectConnections: (connectionIds: string[], multiSelect?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Viewport operations
  updateViewport: (updates: Partial<CanvasState['viewport']>) => void;

  // Tool operations
  setActiveTool: (tool: string) => void;

  // Config operations
  updateConfig: (updates: Partial<CanvasState['config']>) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;

  // History operations
  undo: () => void;
  redo: () => void;
  saveState: () => void;
}

// Combined State and Actions
type CanvasStore = CanvasState & CanvasActions;

// Initial state
const initialState: CanvasState = {
  nodes: new Map(),
  connections: new Map(),
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodes: [],
  selectedConnections: [],
  activeTool: 'select',
  config: {
    width: 800,
    height: 600,
    backgroundColor: 0xffffff,
    gridEnabled: true,
    gridSize: 20,
    gridColor: 0xe2e8f0,
    snapToGrid: true,
    showPerformance: false
  },
  history: {
    past: [],
    present: null,
    future: []
  }
};

// Create Zustand store with Immer
export const useCanvasStore = create<CanvasStore>()(
  immer((set, get) => ({
    ...initialState,

    // Node operations
    addNode: (node) => {
      set((state) => {
        state.nodes.set(node.id, node);
      });
      get().saveState();
    },

    updateNode: (id, updates) => {
      set((state) => {
        const node = state.nodes.get(id);
        if (node) {
          Object.assign(node, updates);
        }
      });
    },

    deleteNode: (id) => {
      set((state) => {
        state.nodes.delete(id);
        // Also remove related connections
        for (const [connId, connection] of state.connections) {
          if (connection.sourceId === id || connection.targetId === id) {
            state.connections.delete(connId);
          }
        }
      });
      get().saveState();
    },

    duplicateNodes: (nodeIds) => {
      set((state) => {
        const offset = 50;
        nodeIds.forEach(nodeId => {
          const node = state.nodes.get(nodeId);
          if (node) {
            const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const duplicatedNode = {
              ...node,
              id: newId,
              position: {
                x: node.position.x + offset,
                y: node.position.y + offset
              },
              selected: false
            };
            state.nodes.set(newId, duplicatedNode);
          }
        });
      });
      get().saveState();
    },

    // Connection operations
    addConnection: (connection) => {
      set((state) => {
        state.connections.set(connection.id, connection);
      });
      get().saveState();
    },

    updateConnection: (id, updates) => {
      set((state) => {
        const connection = state.connections.get(id);
        if (connection) {
          Object.assign(connection, updates);
        }
      });
    },

    deleteConnection: (id) => {
      set((state) => {
        state.connections.delete(id);
      });
      get().saveState();
    },

    // Selection operations
    selectNodes: (nodeIds, multiSelect = false) => {
      set((state) => {
        if (!multiSelect) {
          state.selectedNodes = [];
        }
        nodeIds.forEach(nodeId => {
          if (!state.selectedNodes.includes(nodeId)) {
            state.selectedNodes.push(nodeId);
          }
        });
      });
    },

    selectConnections: (connectionIds, multiSelect = false) => {
      set((state) => {
        if (!multiSelect) {
          state.selectedConnections = [];
        }
        connectionIds.forEach(connectionId => {
          if (!state.selectedConnections.includes(connectionId)) {
            state.selectedConnections.push(connectionId);
          }
        });
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedNodes = [];
        state.selectedConnections = [];
      });
    },

    selectAll: () => {
      set((state) => {
        state.selectedNodes = Array.from(state.nodes.keys());
        state.selectedConnections = Array.from(state.connections.keys());
      });
    },

    // Viewport operations
    updateViewport: (updates) => {
      set((state) => {
        Object.assign(state.viewport, updates);
      });
    },

    // Tool operations
    setActiveTool: (tool) => {
      set((state) => {
        state.activeTool = tool;
      });
    },

    // Config operations
    updateConfig: (updates) => {
      set((state) => {
        Object.assign(state.config, updates);
      });
    },

    toggleGrid: () => {
      set((state) => {
        state.config.gridEnabled = !state.config.gridEnabled;
      });
    },

    toggleSnapToGrid: () => {
      set((state) => {
        state.config.snapToGrid = !state.config.snapToGrid;
      });
    },

    // History operations
    undo: () => {
      set((state) => {
        if (state.history.past.length > 0) {
          const previous = state.history.past[state.history.past.length - 1];
          const newPast = state.history.past.slice(0, -1);

          state.history.future.unshift(state.history.present);
          state.history.present = previous;
          state.history.past = newPast;

          // Restore state from history
          Object.assign(state, previous);
        }
      });
    },

    redo: () => {
      set((state) => {
        if (state.history.future.length > 0) {
          const next = state.history.future[0];
          const newFuture = state.history.future.slice(1);

          state.history.past.push(state.history.present);
          state.history.present = next;
          state.history.future = newFuture;

          // Restore state from history
          Object.assign(state, next);
        }
      });
    },

    saveState: () => {
      set((state) => {
        // Create a snapshot of current state (excluding history)
        const snapshot = {
          nodes: new Map(state.nodes),
          connections: new Map(state.connections),
          viewport: { ...state.viewport },
          selectedNodes: [...state.selectedNodes],
          selectedConnections: [...state.selectedConnections],
          activeTool: state.activeTool,
          config: { ...state.config }
        };

        // Add current state to history
        state.history.past.push(state.history.present);
        state.history.present = snapshot;
        state.history.future = [];

        // Limit history size
        if (state.history.past.length > 50) {
          state.history.past.shift();
        }
      });
    }
  }))
);

// React Context for Canvas State
interface CanvasStateContextType {
  state: CanvasState;
  actions: CanvasActions;
}

const CanvasStateContext = createContext<CanvasStateContextType | null>(null);

interface CanvasStateProviderProps {
  children: React.ReactNode;
}

export const CanvasStateProvider: React.FC<CanvasStateProviderProps> = ({ children }) => {
  const store = useCanvasStore();

  // Split state and actions for better performance
  const state = useMemo(() => ({
    nodes: store.nodes,
    connections: store.connections,
    viewport: store.viewport,
    selectedNodes: store.selectedNodes,
    selectedConnections: store.selectedConnections,
    activeTool: store.activeTool,
    config: store.config,
    history: store.history
  }), [
    store.nodes,
    store.connections,
    store.viewport,
    store.selectedNodes,
    store.selectedConnections,
    store.activeTool,
    store.config,
    store.history
  ]);

  const actions = useMemo(() => ({
    addNode: store.addNode,
    updateNode: store.updateNode,
    deleteNode: store.deleteNode,
    duplicateNodes: store.duplicateNodes,
    addConnection: store.addConnection,
    updateConnection: store.updateConnection,
    deleteConnection: store.deleteConnection,
    selectNodes: store.selectNodes,
    selectConnections: store.selectConnections,
    clearSelection: store.clearSelection,
    selectAll: store.selectAll,
    updateViewport: store.updateViewport,
    setActiveTool: store.setActiveTool,
    updateConfig: store.updateConfig,
    toggleGrid: store.toggleGrid,
    toggleSnapToGrid: store.toggleSnapToGrid,
    undo: store.undo,
    redo: store.redo,
    saveState: store.saveState
  }), [store]);

  const contextValue = useMemo(() => ({
    state,
    actions
  }), [state, actions]);

  return (
    <CanvasStateContext.Provider value={contextValue}>
      {children}
    </CanvasStateContext.Provider>
  );
};

// Hook to use canvas state
export const useCanvasState = () => {
  const context = useContext(CanvasStateContext);
  if (!context) {
    throw new Error('useCanvasState must be used within a CanvasStateProvider');
  }
  return context;
};

// Canvas State Component (for use in component composition)
interface CanvasStateProps {
  children: (state: CanvasState, actions: CanvasActions) => React.ReactNode;
}

export const CanvasState: React.FC<CanvasStateProps> = React.memo(({ children }) => {
  const { state, actions } = useCanvasState();

  return <>{children(state, actions)}</>;
});

CanvasState.displayName = 'CanvasState';
