import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../test/utils'
import { createMockNode, createMockWorkflow, measurePerformance } from '../test/utils'

// Test our new testing infrastructure
describe('Testing Infrastructure', () => {
  describe('Test Utilities', () => {
    it('should create mock node with correct structure', () => {
      const node = createMockNode()

      expect(node).toHaveProperty('id')
      expect(node).toHaveProperty('type', 'start')
      expect(node).toHaveProperty('position')
      expect(node).toHaveProperty('data')
      expect(node).toHaveProperty('style')
    })

    it('should create mock workflow with nodes', () => {
      const workflow = createMockWorkflow()

      expect(workflow).toHaveProperty('id')
      expect(workflow).toHaveProperty('name')
      expect(workflow).toHaveProperty('nodes')
      expect(workflow.nodes).toHaveLength(1)
    })

    it('should override mock node properties', () => {
      const node = createMockNode({
        id: 'custom-node',
        type: 'end' as const,
        data: { label: 'Custom Label' }
      })

      expect(node.id).toBe('custom-node')
      expect(node.type).toBe('end')
      expect(node.data.label).toBe('Custom Label')
    })
  })

  describe('Performance Testing', () => {
    it('should measure function performance', async () => {
      const testFunction = () => {
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      }

      const result = await measurePerformance(testFunction)

      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('memoryDelta')
      expect(typeof result.duration).toBe('number')
      expect(result.duration).toBeGreaterThan(0)
    })

    it('should handle async functions', async () => {
      const asyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'done'
      }

      const result = await measurePerformance(asyncFunction)

      expect(result.duration).toBeGreaterThan(10)
    })
  })

  describe('Mock Implementations', () => {
    it('should mock Pixi.js Application', () => {
      const mockApp = {
        stage: {
          addChild: vi.fn(),
          removeChild: vi.fn(),
          interactive: true,
          on: vi.fn(),
          off: vi.fn(),
        },
        renderer: {
          resize: vi.fn(),
        },
        view: document.createElement('canvas'),
        destroy: vi.fn(),
        ticker: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      }

      expect(mockApp.stage.addChild).toBeDefined()
      expect(mockApp.renderer.resize).toBeDefined()
      expect(mockApp.destroy).toBeDefined()
    })
  })

  describe('Happy DOM Integration', () => {
    it('should render components with Happy DOM', () => {
      // Create a simple test component
      const TestComponent = () => (
        <div data-testid="test-element">
          <h1>Hello World</h1>
          <button>Click me</button>
        </div>
      )

      render(<TestComponent />)

      expect(screen.getByTestId('test-element')).toBeInTheDocument()
      expect(screen.getByText('Hello World')).toBeInTheDocument()
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle user interactions', async () => {
      const mockClick = vi.fn()

      const TestComponent = () => (
        <button onClick={mockClick} data-testid="interactive-button">
          Click me
        </button>
      )

      const { user } = render(<TestComponent />)

      const button = screen.getByTestId('interactive-button')
      await user.click(button)

      expect(mockClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('MSW Integration', () => {
    it('should mock API calls', async () => {
      const response = await fetch('http://localhost:5055/health')
      const data = await response.json()

      expect(data.status).toBe('OK')
      expect(data).toHaveProperty('timestamp')
    })

    it('should handle error responses', async () => {
      try {
        const response = await fetch('http://localhost:5055/error')
        if (!response.ok) {
          throw new Error('API Error')
        }
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })
})
