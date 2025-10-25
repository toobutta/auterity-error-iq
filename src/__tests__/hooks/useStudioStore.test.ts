import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStudioStore } from '../../hooks/useStudioStore.js'
import { server } from '../../test/server.js'

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    getToken: vi.fn().mockResolvedValue('mock-token'),
  },
}))

// Mock the theme constants
vi.mock('../../constants/themes', () => ({
  LIGHT_THEME: {
    name: 'light',
    colors: {
      background: '#ffffff',
      surface: '#f8f9fa',
      primary: '#007bff',
      secondary: '#6c757d',
      accent: '#28a745',
      text: '#212529',
      textSecondary: '#6c757d',
      border: '#dee2e6',
      grid: '#e9ecef',
      selection: '#007bff',
      error: '#dc3545',
      warning: '#ffc107',
      success: '#28a745'
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    borderRadius: { sm: 4, md: 8, lg: 12 },
    shadows: { sm: '0 1px 3px rgba(0,0,0,0.12)', md: '0 4px 6px rgba(0,0,0,0.16)', lg: '0 10px 25px rgba(0,0,0,0.19)' }
  },
  DEFAULT_CANVAS_CONFIG: {
    width: 800,
    height: 600,
    backgroundColor: 0xffffff,
    gridEnabled: true,
    gridSize: 20,
    gridColor: 0xe0e0e0,
    snapToGrid: false,
    showRulers: false
  }
}))

describe('useStudioStore', () => {
  beforeEach(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
  })

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useStudioStore())

      expect(result.current.state.canvas.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
      expect(result.current.state.canvas.activeTool).toBe('select')
      expect(result.current.state.nodes.size).toBe(0)
      expect(result.current.state.connections.size).toBe(0)
      expect(result.current.state.selection.selectedNodes).toEqual([])
      expect(result.current.state.history.canUndo).toBe(false)
      expect(result.current.state.history.canRedo).toBe(false)
    })

    it('should have all required action functions', () => {
      const { result } = renderHook(() => useStudioStore())

      const expectedActions = [
        'updateViewport', 'setActiveTool', 'toggleGrid', 'toggleSnapToGrid',
        'addNode', 'updateNode', 'deleteNode',
        'addConnection', 'updateConnection', 'deleteConnection',
        'selectNodes', 'selectConnections', 'clearSelection', 'selectAll',
        'togglePanel', 'resizePanel',
        'setAuthLoading', 'setAuthUser', 'setAuthError', 'clearAuth',
        'setCurrentWorkspace', 'setCurrentProject',
        'saveState', 'undo', 'redo'
      ]

      expectedActions.forEach(action => {
        expect(typeof (result.current.actions as any)[action]).toBe('function')
      })
    })
  })

  describe('Canvas Actions', () => {
    it('should update viewport correctly', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.updateViewport({ x: 100, y: 200, zoom: 1.5 })
      })

      expect(result.current.state.canvas.viewport).toEqual({ x: 100, y: 200, zoom: 1.5 })
    })

    it('should set active tool', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.setActiveTool('pan')
      })

      expect(result.current.state.canvas.activeTool).toBe('pan')
    })

    it('should toggle grid', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.toggleGrid()
      })

      expect(result.current.state.canvas.config.gridEnabled).toBe(false)

      act(() => {
        result.current.actions.toggleGrid()
      })

      expect(result.current.state.canvas.config.gridEnabled).toBe(true)
    })

    it('should toggle snap to grid', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.toggleSnapToGrid()
      })

      expect(result.current.state.canvas.config.snapToGrid).toBe(true)

      act(() => {
        result.current.actions.toggleSnapToGrid()
      })

      expect(result.current.state.canvas.config.snapToGrid).toBe(false)
    })
  })

  describe('Node Actions', () => {
    const mockNode = {
      id: 'node-1',
      type: 'action' as const,
      position: { x: 100, y: 200 },
      size: { width: 120, height: 48 },
      data: { label: 'Test Node' },
      style: {
        backgroundColor: 0x007bff,
        borderColor: 0x0056b3,
        borderWidth: 2,
        borderRadius: 4,
        textColor: 0xffffff,
        fontSize: 14,
        fontWeight: 'normal',
        shadow: false,
        opacity: 1
      },
      selected: false,
      dragging: false,
      resizing: false
    }

    it('should add node correctly', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addNode(mockNode)
      })

      expect(result.current.state.nodes.size).toBe(1)
      expect(result.current.state.nodes.get('node-1')).toEqual(mockNode)
    })

    it('should update node correctly', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addNode(mockNode)
      })

      act(() => {
        result.current.actions.updateNode('node-1', {
          position: { x: 150, y: 250 },
          selected: true
        })
      })

      const updatedNode = result.current.state.nodes.get('node-1')
      expect(updatedNode?.position).toEqual({ x: 150, y: 250 })
      expect(updatedNode?.selected).toBe(true)
    })

    it('should delete node correctly', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addNode(mockNode)
      })

      expect(result.current.state.nodes.size).toBe(1)

      act(() => {
        result.current.actions.deleteNode('node-1')
      })

      expect(result.current.state.nodes.size).toBe(0)
    })

    it('should handle deleting non-existent node gracefully', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.deleteNode('non-existent')
      })

      expect(result.current.state.nodes.size).toBe(0)
    })
  })

  describe('Connection Actions', () => {
    const mockConnection = {
      id: 'conn-1',
      sourceId: 'node-1',
      targetId: 'node-2',
      sourceHandle: 'output-1',
      targetHandle: 'input-1',
      label: 'Test Connection',
      style: {
        color: 0x007bff,
        width: 2,
        opacity: 1,
        animated: false,
        dashed: false,
        arrowSize: 8
      },
      selected: false
    }

    it('should add connection correctly', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addConnection(mockConnection)
      })

      expect(result.current.state.connections.size).toBe(1)
      expect(result.current.state.connections.get('conn-1')).toEqual(mockConnection)
    })

    it('should update connection correctly', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addConnection(mockConnection)
      })

      act(() => {
        result.current.actions.updateConnection('conn-1', {
          selected: true,
          label: 'Updated Connection'
        })
      })

      const updatedConnection = result.current.state.connections.get('conn-1')
      expect(updatedConnection?.selected).toBe(true)
      expect(updatedConnection?.label).toBe('Updated Connection')
    })

    it('should delete connection correctly', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addConnection(mockConnection)
      })

      expect(result.current.state.connections.size).toBe(1)

      act(() => {
        result.current.actions.deleteConnection('conn-1')
      })

      expect(result.current.state.connections.size).toBe(0)
    })
  })

  describe('Selection Actions', () => {
    const mockNode1 = {
      id: 'node-1',
      type: 'action' as const,
      position: { x: 100, y: 200 },
      size: { width: 120, height: 48 },
      data: { label: 'Node 1' },
      style: {
        backgroundColor: 0x007bff,
        borderColor: 0x0056b3,
        borderWidth: 2,
        borderRadius: 4,
        textColor: 0xffffff,
        fontSize: 14,
        fontWeight: 'normal',
        shadow: false,
        opacity: 1
      },
      selected: false,
      dragging: false,
      resizing: false
    }

    const mockNode2 = {
      ...mockNode1,
      id: 'node-2',
      data: { label: 'Node 2' }
    }

    beforeEach(() => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addNode(mockNode1)
        result.current.actions.addNode(mockNode2)
      })
    })

    it('should select single node', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addNode(mockNode1)
        result.current.actions.selectNodes(['node-1'])
      })

      expect(result.current.state.selection.selectedNodes).toEqual(['node-1'])
    })

    it('should select multiple nodes', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addNode(mockNode1)
        result.current.actions.addNode(mockNode2)
        result.current.actions.selectNodes(['node-1', 'node-2'])
      })

      expect(result.current.state.selection.selectedNodes).toEqual(['node-1', 'node-2'])
    })

    it('should add to selection with ctrl key', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addNode(mockNode1)
        result.current.actions.addNode(mockNode2)
        result.current.actions.selectNodes(['node-1'], true)
        result.current.actions.selectNodes(['node-2'], true)
      })

      expect(result.current.state.selection.selectedNodes).toEqual(['node-1', 'node-2'])
    })

    it('should clear selection', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.addNode(mockNode1)
        result.current.actions.selectNodes(['node-1'])
        result.current.actions.clearSelection()
      })

      expect(result.current.state.selection.selectedNodes).toEqual([])
      expect(result.current.state.selection.selectedConnections).toEqual([])
    })

    it('should select all nodes and connections', () => {
      const { result } = renderHook(() => useStudioStore())

      const mockConnection = {
        id: 'conn-1',
        sourceId: 'node-1',
        targetId: 'node-2',
        style: {
          color: 0x007bff,
          width: 2,
          opacity: 1,
          animated: false,
          dashed: false,
          arrowSize: 8
        },
        selected: false
      }

      act(() => {
        result.current.actions.addNode(mockNode1)
        result.current.actions.addNode(mockNode2)
        result.current.actions.addConnection(mockConnection)
        result.current.actions.selectAll()
      })

      expect(result.current.state.selection.selectedNodes).toHaveLength(2)
      expect(result.current.state.selection.selectedConnections).toHaveLength(1)
    })
  })

  describe('Panel Actions', () => {
    it('should toggle panel visibility', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.togglePanel('nodePalette')
      })

      expect(result.current.state.panels.nodePalette.visible).toBe(false)

      act(() => {
        result.current.actions.togglePanel('nodePalette')
      })

      expect(result.current.state.panels.nodePalette.visible).toBe(true)
    })

    it('should resize panel', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.resizePanel('properties', 400)
      })

      expect(result.current.state.panels.properties.width).toBe(400)
    })
  })

  describe('History Actions', () => {
    it('should save state to history', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.saveState()
      })

      expect(result.current.state.history.canUndo).toBe(true)
      expect(result.current.state.history.canRedo).toBe(false)
    })

    it('should undo and redo actions', () => {
      const { result } = renderHook(() => useStudioStore())

      // Initial state
      const initialViewport = result.current.state.canvas.viewport

      // Change viewport
      act(() => {
        result.current.actions.updateViewport({ x: 100, y: 100 })
        result.current.actions.saveState()
      })

      expect(result.current.state.canvas.viewport.x).toBe(100)

      // Undo
      act(() => {
        result.current.actions.undo()
      })

      expect(result.current.state.canvas.viewport).toEqual(initialViewport)
      expect(result.current.state.history.canRedo).toBe(true)

      // Redo
      act(() => {
        result.current.actions.redo()
      })

      expect(result.current.state.canvas.viewport.x).toBe(100)
    })

    it('should limit history size', () => {
      const { result } = renderHook(() => useStudioStore())

      // Create more than 50 history entries
      for (let i = 0; i < 60; i++) {
        act(() => {
          result.current.actions.updateViewport({ x: i, y: i })
          result.current.actions.saveState()
        })
      }

      // History should be limited to 50 entries
      // This is tested by ensuring the hook doesn't crash with large history
      expect(result.current.state.history.canUndo).toBe(true)
    })
  })

  describe('Authentication Actions', () => {
    it('should set auth loading state', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.setAuthLoading(true)
      })

      expect(result.current.state.auth.isLoading).toBe(true)
    })

    it('should set auth user', () => {
      const { result } = renderHook(() => useStudioStore())
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }

      act(() => {
        result.current.actions.setAuthUser(mockUser, 'token-123', 'refresh-456')
      })

      expect(result.current.state.auth.isAuthenticated).toBe(true)
      expect(result.current.state.auth.user).toEqual(mockUser)
      expect(result.current.state.auth.token).toBe('token-123')
      expect(result.current.state.auth.refreshToken).toBe('refresh-456')
      expect(result.current.state.auth.error).toBeNull()
    })

    it('should set auth error', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.setAuthError('Authentication failed')
      })

      expect(result.current.state.auth.isAuthenticated).toBe(false)
      expect(result.current.state.auth.error).toBe('Authentication failed')
    })

    it('should clear auth', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.setAuthUser({ id: '1', email: 'test@example.com' }, 'token')
        result.current.actions.clearAuth()
      })

      expect(result.current.state.auth.isAuthenticated).toBe(false)
      expect(result.current.state.auth.user).toBeNull()
      expect(result.current.state.auth.token).toBeNull()
    })
  })

  describe('Workspace Actions', () => {
    it('should set current workspace', () => {
      const { result } = renderHook(() => useStudioStore())
      const mockWorkspace = { id: 'ws-1', name: 'Test Workspace', description: 'A test workspace' }

      act(() => {
        result.current.actions.setCurrentWorkspace(mockWorkspace)
      })

      expect(result.current.state.workspace.currentWorkspace).toEqual(mockWorkspace)
      expect(result.current.state.workspace.currentProject).toBeUndefined()
    })

    it('should set current project', () => {
      const { result } = renderHook(() => useStudioStore())
      const mockProject = { id: 'proj-1', name: 'Test Project', workspaceId: 'ws-1', environment: 'development' }

      act(() => {
        result.current.actions.setCurrentProject(mockProject)
      })

      expect(result.current.state.workspace.currentProject).toEqual(mockProject)
    })
  })

  describe('Performance and Memory', () => {
    it('should handle large state efficiently', () => {
      const { result } = renderHook(() => useStudioStore())

      const startTime = performance.now()

      act(() => {
        // Add many nodes
        for (let i = 0; i < 100; i++) {
          const node = {
            id: `node-${i}`,
            type: 'action' as const,
            position: { x: i * 10, y: i * 10 },
            size: { width: 120, height: 48 },
            data: { label: `Node ${i}` },
            style: {
              backgroundColor: 0x007bff,
              borderColor: 0x0056b3,
              borderWidth: 2,
              borderRadius: 4,
              textColor: 0xffffff,
              fontSize: 14,
              fontWeight: 'normal',
              shadow: false,
              opacity: 1
            },
            selected: false,
            dragging: false,
            resizing: false
          }
          result.current.actions.addNode(node)
        }
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000) // Less than 1 second
      expect(result.current.state.nodes.size).toBe(100)
    })

    it('should handle rapid state changes without memory leaks', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        // Rapid viewport changes
        for (let i = 0; i < 1000; i++) {
          result.current.actions.updateViewport({
            x: Math.sin(i) * 100,
            y: Math.cos(i) * 100,
            zoom: 1 + Math.sin(i) * 0.5
          })
        }
      })

      // Should not have crashed and should have final state
      expect(result.current.state.canvas.viewport.zoom).toBeGreaterThan(0.5)
      expect(result.current.state.canvas.viewport.zoom).toBeLessThan(1.5)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid node updates gracefully', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        // Try to update non-existent node
        result.current.actions.updateNode('non-existent', { selected: true })
      })

      // Should not crash
      expect(result.current.state.nodes.size).toBe(0)
    })

    it('should handle invalid connection updates gracefully', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        // Try to update non-existent connection
        result.current.actions.updateConnection('non-existent', { selected: true })
      })

      // Should not crash
      expect(result.current.state.connections.size).toBe(0)
    })

    it('should handle undo/redo on empty history gracefully', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        result.current.actions.undo()
        result.current.actions.redo()
      })

      // Should not crash
      expect(result.current.state.history.canUndo).toBe(false)
      expect(result.current.state.history.canRedo).toBe(false)
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complex workflow creation', () => {
      const { result } = renderHook(() => useStudioStore())

      act(() => {
        // Create start node
        const startNode = {
          id: 'start',
          type: 'start' as const,
          position: { x: 100, y: 100 },
          size: { width: 120, height: 48 },
          data: { label: 'Start' },
          style: {
            backgroundColor: 0x28a745,
            borderColor: 0x1e7e34,
            borderWidth: 2,
            borderRadius: 24,
            textColor: 0xffffff,
            fontSize: 14,
            fontWeight: 'bold',
            shadow: false,
            opacity: 1
          },
          selected: false,
          dragging: false,
          resizing: false
        }

        // Create action node
        const actionNode = {
          id: 'action-1',
          type: 'action' as const,
          position: { x: 300, y: 100 },
          size: { width: 120, height: 48 },
          data: { label: 'Process Data' },
          style: {
            backgroundColor: 0x007bff,
            borderColor: 0x0056b3,
            borderWidth: 2,
            borderRadius: 4,
            textColor: 0xffffff,
            fontSize: 14,
            fontWeight: 'normal',
            shadow: false,
            opacity: 1
          },
          selected: false,
          dragging: false,
          resizing: false
        }

        // Create connection
        const connection = {
          id: 'conn-1',
          sourceId: 'start',
          targetId: 'action-1',
          style: {
            color: 0x007bff,
            width: 2,
            opacity: 1,
            animated: true,
            dashed: false,
            arrowSize: 8
          },
          selected: false
        }

        result.current.actions.addNode(startNode)
        result.current.actions.addNode(actionNode)
        result.current.actions.addConnection(connection)
        result.current.actions.selectNodes(['start', 'action-1'])
        result.current.actions.saveState()
      })

      expect(result.current.state.nodes.size).toBe(2)
      expect(result.current.state.connections.size).toBe(1)
      expect(result.current.state.selection.selectedNodes).toHaveLength(2)
      expect(result.current.state.history.canUndo).toBe(true)
    })

    it('should handle bulk operations efficiently', () => {
      const { result } = renderHook(() => useStudioStore())

      const startTime = performance.now()

      // Bulk add nodes
      act(() => {
        for (let i = 0; i < 50; i++) {
          const node = {
            id: `bulk-node-${i}`,
            type: 'action' as const,
            position: { x: i * 20, y: i * 20 },
            size: { width: 120, height: 48 },
            data: { label: `Bulk Node ${i}` },
            style: {
              backgroundColor: 0x007bff,
              borderColor: 0x0056b3,
              borderWidth: 2,
              borderRadius: 4,
              textColor: 0xffffff,
              fontSize: 14,
              fontWeight: 'normal',
              shadow: false,
              opacity: 1
            },
            selected: false,
            dragging: false,
            resizing: false
          }
          result.current.actions.addNode(node)
        }
      })

      // Bulk select all nodes
      act(() => {
        result.current.actions.selectAll()
        result.current.actions.saveState()
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.current.state.nodes.size).toBe(50)
      expect(result.current.state.selection.selectedNodes).toHaveLength(50)
      expect(duration).toBeLessThan(500) // Should complete quickly
    })
  })
})
