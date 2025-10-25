import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiClient } from '../../services/api'
import { server } from '../../test/server'

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  },
}))

describe('API Service', () => {
  beforeEach(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
  })

  describe('Authentication & Headers', () => {
    it('should include JWT token in headers when available', async () => {
      const mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      }

      const result = await apiClient.createWorkflow(mockWorkflow)

      expect(result).toBeDefined()
      // MSW will verify the Authorization header was sent
    })

    it('should fallback to API key when JWT token fails', async () => {
      // Mock auth service to throw error
      const { authService } = await import('../../services/authService')
      vi.mocked(authService.getToken).mockRejectedValueOnce(new Error('Auth failed'))

      const mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      }

      const result = await apiClient.createWorkflow(mockWorkflow)

      expect(result).toBeDefined()
      // MSW will verify the x-api-key header was sent as fallback
    })

    it('should handle network errors gracefully', async () => {
      // Mock fetch to simulate network error
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.getWorkflow('test-id')).rejects.toThrow('Network error')
    })
  })

  describe('Workflow CRUD Operations', () => {
    const mockWorkflow = {
      id: 'test-workflow',
      name: 'Test Workflow',
      nodes: [
        {
          id: 'node-1',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Start' }
        }
      ],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }

    it('should create a new workflow', async () => {
      const result = await apiClient.createWorkflow(mockWorkflow)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('canonical')
      expect(result.canonical).toEqual(mockWorkflow)
    })

    it('should get a workflow by ID', async () => {
      const result = await apiClient.getWorkflow('test-workflow-id')

      expect(result).toHaveProperty('json')
      expect(result).toHaveProperty('etag')
      expect(result.json).toHaveProperty('id')
      expect(result.json).toHaveProperty('canonical')
    })

    it('should update an existing workflow', async () => {
      const updatedWorkflow = {
        ...mockWorkflow,
        name: 'Updated Workflow'
      }

      const result = await apiClient.saveWorkflow('test-workflow-id', updatedWorkflow)

      expect(result).toHaveProperty('id')
      expect(result.canonical.name).toBe('Updated Workflow')
    })

    it('should delete a workflow', async () => {
      // Should not throw an error
      await expect(apiClient.deleteWorkflow('test-workflow-id')).resolves.not.toThrow()
    })

    it('should list workflows with optional filters', async () => {
      const result = await apiClient.listWorkflows('workspace-1', 'project-1')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
    })

    it('should list all workflows without filters', async () => {
      const result = await apiClient.listWorkflows()

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('Workflow Execution', () => {
    it('should execute a workflow without inputs', async () => {
      const result = await apiClient.executeWorkflow('test-workflow-id')

      expect(result).toHaveProperty('executionId')
      expect(result).toHaveProperty('status')
      expect(result.status).toBe('running')
    })

    it('should execute a workflow with inputs', async () => {
      const inputs = {
        param1: 'value1',
        param2: 42
      }

      const result = await apiClient.executeWorkflow('test-workflow-id', inputs)

      expect(result).toHaveProperty('executionId')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('inputs')
      expect(result.inputs).toEqual(inputs)
    })

    it('should get execution status', async () => {
      const result = await apiClient.getExecutionStatus('execution-123')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('workflowId')
    })
  })

  describe('Template Management', () => {
    it('should get all templates', async () => {
      const result = await apiClient.getTemplates()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('category')
    })

    it('should get templates by category', async () => {
      const result = await apiClient.getTemplates('ai')

      expect(Array.isArray(result)).toBe(true)
      result.forEach(template => {
        expect(template.category).toBe('ai')
      })
    })
  })

  describe('Import/Export Operations', () => {
    const mockWorkflowData = {
      id: 'import-test',
      name: 'Import Test',
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }

    it('should import a workflow', async () => {
      const result = await apiClient.importWorkflow(mockWorkflowData)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('canonical')
    })

    it('should export workflow as JSON', async () => {
      const result = await apiClient.exportWorkflow('test-workflow-id', 'json')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('canonical')
      expect(result).toHaveProperty('exportedAt')
    })

    it('should export workflow as blob for non-JSON formats', async () => {
      const result = await apiClient.exportWorkflow('test-workflow-id', 'png')

      expect(result).toBeInstanceOf(Blob)
    })
  })

  describe('AI Function Integration', () => {
    it('should call AI function', async () => {
      const parameters = {
        prompt: 'Generate a summary',
        maxTokens: 100
      }

      const result = await apiClient.callAIFunction('text-generation', parameters)

      expect(result).toHaveProperty('function')
      expect(result).toHaveProperty('result')
      expect(result).toHaveProperty('executionTime')
      expect(result.function).toBe('text-generation')
    })

    it('should get available AI functions', async () => {
      const result = await apiClient.getAIFunctions()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('description')
      expect(result[0]).toHaveProperty('parameters')
    })
  })

  describe('Workspace & Project Management', () => {
    it('should get all workspaces', async () => {
      const result = await apiClient.getWorkspaces()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
    })

    it('should get projects for a workspace', async () => {
      const result = await apiClient.getProjects('workspace-1')

      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('workspaceId')
    })

    it('should create a new workspace', async () => {
      const result = await apiClient.createWorkspace('New Test Workspace')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result.name).toBe('New Test Workspace')
    })

    it('should create a new project', async () => {
      const result = await apiClient.createProject('workspace-1', 'New Project', 'development')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('workspaceId')
      expect(result).toHaveProperty('environment')
      expect(result.environment).toBe('development')
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      await expect(apiClient.getWorkflow('non-existent-id')).rejects.toThrow('API Error 404')
    })

    it('should handle 500 server errors', async () => {
      // Trigger server error by using invalid data
      const invalidWorkflow = {
        id: 'invalid',
        name: '', // Empty name should trigger server error
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      }

      await expect(apiClient.createWorkflow(invalidWorkflow)).rejects.toThrow('API Error 500')
    })

    it('should handle network timeouts', async () => {
      // Mock a timeout
      vi.useFakeTimers()
      const timeoutPromise = apiClient.getWorkflow('timeout-test')

      vi.advanceTimersByTime(30000) // Advance 30 seconds

      await expect(timeoutPromise).rejects.toThrow()
      vi.useRealTimers()
    })

    it('should handle malformed JSON responses', async () => {
      // MSW will return invalid JSON for this endpoint
      await expect(apiClient.getWorkflow('malformed-json')).rejects.toThrow()
    })
  })

  describe('Performance & Load Testing', () => {
    it('should handle concurrent requests efficiently', async () => {
      const startTime = performance.now()

      const promises = Array.from({ length: 10 }, (_, i) =>
        apiClient.getWorkflow(`concurrent-test-${i}`)
      )

      const results = await Promise.all(promises)
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(results).toHaveLength(10)
      results.forEach(result => {
        expect(result).toHaveProperty('json')
      })

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000) // Less than 5 seconds for 10 concurrent requests
    })

    it('should handle large payload responses', async () => {
      const result = await apiClient.getWorkflow('large-workflow')

      expect(result).toHaveProperty('json')
      expect(result.json.canonical.nodes).toHaveLength(100)
    })
  })

  describe('Legacy API Compatibility', () => {
    it('should support legacy getCanonical function', async () => {
      const { getCanonical } = await import('../../services/api')

      const result = await getCanonical('legacy-test')

      expect(result).toHaveProperty('json')
      expect(result).toHaveProperty('etag')
    })

    it('should support legacy importCanonical function', async () => {
      const { importCanonical } = await import('../../services/api')

      const mockData = {
        id: 'legacy-import',
        name: 'Legacy Import',
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      }

      const result = await importCanonical(mockData)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('canonical')
    })
  })
})
