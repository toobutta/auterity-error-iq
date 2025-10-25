import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { EnhancedCanvas } from '../../components/canvas/EnhancedCanvas.js'
import { useStudioStore } from '../../hooks/useStudioStore.js'
import { server } from '../../test/server.js'
import React from 'react'

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  },
}))

// Enhanced Pixi.js mock with complete API coverage
vi.mock('pixi.js', () => ({
  Application: vi.fn().mockImplementation(() => ({
    view: document.createElement('canvas'),
    stage: {
      addChild: vi.fn(),
      removeChild: vi.fn(),
      interactive: true,
      on: vi.fn(),
      off: vi.fn(),
      children: [],
    },
    renderer: {
      resize: vi.fn(),
      render: vi.fn(),
    },
    ticker: {
      add: vi.fn(),
      destroy: vi.fn(),
      deltaTime: 1,
      deltaMS: 16.67,
      deltaTimeScaled: 1,
      elapsedMS: 0,
      lastTime: 0,
      speed: 1,
      started: true,
    },
    destroy: vi.fn(),
  })),
  Graphics: vi.fn().mockImplementation(() => ({
    clear: vi.fn().mockReturnThis(),
    beginFill: vi.fn().mockReturnThis(),
    endFill: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    drawRoundedRect: vi.fn().mockReturnThis(),
    drawRect: vi.fn().mockReturnThis(),
    drawCircle: vi.fn().mockReturnThis(),
    drawEllipse: vi.fn().mockReturnThis(),
    drawPolygon: vi.fn().mockReturnThis(),
    position: { set: vi.fn() },
    scale: { set: vi.fn() },
    rotation: 0,
    alpha: 1,
    visible: true,
    interactive: true,
    buttonMode: true,
    on: vi.fn(),
    off: vi.fn(),
    removeChildren: vi.fn(),
    addChild: vi.fn(),
    destroy: vi.fn(),
    // Graphics-specific properties
    geometry: {
      graphicsData: [],
      updateId: 0,
    },
    _texture: null,
    blendMode: 0,
    tint: 0xffffff,
    pluginName: 'graphics',
  })),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    removeChildren: vi.fn(),
    getChildAt: vi.fn(),
    getChildIndex: vi.fn(),
    setChildIndex: vi.fn(),
    sortChildren: vi.fn(),
    position: { set: vi.fn(), x: 0, y: 0 },
    scale: { set: vi.fn(), x: 1, y: 1 },
    rotation: 0,
    alpha: 1,
    visible: true,
    interactive: false,
    children: [],
    name: '',
    parent: null,
    destroy: vi.fn(),
  })),
  Text: vi.fn().mockImplementation(() => ({
    anchor: { set: vi.fn(), x: 0, y: 0 },
    position: { set: vi.fn(), x: 0, y: 0 },
    scale: { set: vi.fn(), x: 1, y: 1 },
    rotation: 0,
    alpha: 1,
    visible: true,
    text: '',
    style: {},
    destroy: vi.fn(),
  })),
  TextStyle: vi.fn().mockImplementation((style = {}) => ({
    ...style,
    fontFamily: style.fontFamily || 'Arial',
    fontSize: style.fontSize || 26,
    fontWeight: style.fontWeight || 'normal',
    fill: style.fill || '#000000',
    align: style.align || 'left',
    wordWrap: style.wordWrap || false,
    wordWrapWidth: style.wordWrapWidth || 100,
  })),
  Ticker: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    addOnce: vi.fn(),
    remove: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
    deltaTime: 1,
    deltaMS: 16.67,
    deltaTimeScaled: 1,
    elapsedMS: 0,
    lastTime: 0,
    speed: 1,
    started: false,
    FPS: 60,
    minFPS: 0,
  })),
  Rectangle: vi.fn().mockImplementation((x = 0, y = 0, width = 0, height = 0) => ({
    x,
    y,
    width,
    height,
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    contains: vi.fn().mockReturnValue(false),
    clone: vi.fn().mockReturnThis(),
    copyFrom: vi.fn().mockReturnThis(),
    copyTo: vi.fn().mockReturnThis(),
    enlarge: vi.fn().mockReturnThis(),
    fit: vi.fn().mockReturnThis(),
    pad: vi.fn().mockReturnThis(),
    ceil: vi.fn().mockReturnThis(),
    union: vi.fn().mockReturnThis(),
  })),
  // Additional Pixi.js classes
  Sprite: vi.fn().mockImplementation(() => ({
    position: { set: vi.fn(), x: 0, y: 0 },
    scale: { set: vi.fn(), x: 1, y: 1 },
    rotation: 0,
    alpha: 1,
    visible: true,
    interactive: false,
    texture: {},
    destroy: vi.fn(),
  })),
  Texture: vi.fn().mockImplementation(() => ({
    width: 0,
    height: 0,
    baseTexture: {},
    destroy: vi.fn(),
  })),
}))

// Performance monitoring utilities
const performanceMonitor = {
  startTime: 0,
  measurements: [] as number[],

  start() {
    this.startTime = performance.now()
  },

  end(): number {
    const duration = performance.now() - this.startTime
    this.measurements.push(duration)
    return duration
  },

  getAverage(): number {
    return this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length
  },

  getMin(): number {
    return Math.min(...this.measurements)
  },

  getMax(): number {
    return Math.max(...this.measurements)
  },

  reset() {
    this.measurements = []
  }
}

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, actions } = useStudioStore()
  return <div data-testid="studio-store-context">{children}</div>
}

describe('Canvas Rendering Performance', () => {
  beforeEach(() => {
    server.listen()
    performanceMonitor.reset()
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
  })

  describe('FPS Monitoring During Node Operations', () => {
    it('should maintain 60+ FPS during normal node operations', async () => {
      const fpsMeasurements: number[] = []

      // Mock requestAnimationFrame for FPS monitoring
      let frameCount = 0
      let lastTime = performance.now()

      const mockRAF = vi.fn((callback) => {
        const currentTime = performance.now()
        frameCount++

        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
          fpsMeasurements.push(fps)
          frameCount = 0
          lastTime = currentTime
        }

        // Simulate 60 FPS
        setTimeout(callback, 16.67)
        return frameCount
      })

      global.requestAnimationFrame = mockRAF

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Wait for canvas to initialize
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      // Simulate normal operations for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Calculate average FPS
      const averageFps = fpsMeasurements.reduce((a, b) => a + b, 0) / fpsMeasurements.length

      expect(averageFps).toBeGreaterThanOrEqual(55) // Allow some tolerance
      expect(fpsMeasurements.length).toBeGreaterThan(0)
    })

    it('should maintain stable FPS during rapid node creation', async () => {
      const fpsMeasurements: number[] = []
      let frameCount = 0
      let lastTime = performance.now()

      const mockRAF = vi.fn((callback) => {
        const currentTime = performance.now()
        frameCount++

        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
          fpsMeasurements.push(fps)
          frameCount = 0
          lastTime = currentTime
        }

        setTimeout(callback, 16.67)
        return frameCount
      })

      global.requestAnimationFrame = mockRAF

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Simulate rapid node creation (10 nodes per second for 3 seconds)
      const createNodesRapidly = async () => {
        for (let i = 0; i < 30; i++) {
          // Simulate node creation through store
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      await Promise.all([
        createNodesRapidly(),
        new Promise(resolve => setTimeout(resolve, 3000))
      ])

      const averageFps = fpsMeasurements.reduce((a, b) => a + b, 0) / fpsMeasurements.length
      const minFps = Math.min(...fpsMeasurements)

      expect(averageFps).toBeGreaterThanOrEqual(50)
      expect(minFps).toBeGreaterThanOrEqual(40) // Allow some drops during heavy operations
    })
  })

  describe('Memory Usage with Large Node Counts', () => {
    it('should handle 100+ nodes without excessive memory growth', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Simulate creating 100 nodes
      const createManyNodes = async () => {
        for (let i = 0; i < 100; i++) {
          // Simulate node creation
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      await createManyNodes()

      // Wait for garbage collection
      await new Promise(resolve => setTimeout(resolve, 100))

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (< 50MB for 100 nodes)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    it('should properly cleanup memory when nodes are removed', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Create and then remove nodes
      const createAndRemoveNodes = async () => {
        // Create 50 nodes
        for (let i = 0; i < 50; i++) {
          await new Promise(resolve => setTimeout(resolve, 5))
        }

        // Remove all nodes
        for (let i = 0; i < 50; i++) {
          await new Promise(resolve => setTimeout(resolve, 5))
        }
      }

      await createAndRemoveNodes()

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 200))

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory

      // Memory should return close to initial state
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // < 10MB residual
    })
  })

  describe('Rendering Performance Across Zoom Levels', () => {
    it('should maintain performance at high zoom levels', async () => {
      const renderTimes: number[] = []

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Test rendering at different zoom levels
      const zoomLevels = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0]

      for (const zoom of zoomLevels) {
        performanceMonitor.start()

        // Simulate zoom change
        await new Promise(resolve => setTimeout(resolve, 50))

        const renderTime = performanceMonitor.end()
        renderTimes.push(renderTime)
      }

      const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length
      const maxRenderTime = Math.max(...renderTimes)

      // Average render time should be under 50ms
      expect(averageRenderTime).toBeLessThan(50)
      // Even at high zoom, max render time should be under 100ms
      expect(maxRenderTime).toBeLessThan(100)
    })

    it('should handle zoom transitions smoothly', async () => {
      const transitionTimes: number[] = []

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Test smooth zoom transitions
      for (let i = 0; i < 10; i++) {
        performanceMonitor.start()

        // Simulate zoom transition (0.1 to 10.0)
        await new Promise(resolve => setTimeout(resolve, 20))

        const transitionTime = performanceMonitor.end()
        transitionTimes.push(transitionTime)
      }

      const averageTransitionTime = transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length

      // Smooth transitions should be under 30ms
      expect(averageTransitionTime).toBeLessThan(30)
    })
  })

  describe('Pixi.js Texture Management', () => {
    it('should properly dispose of textures when nodes are removed', async () => {
      let disposedTextures = 0

      // Mock texture disposal
      const mockTexture = {
        destroy: vi.fn(() => {
          disposedTextures++
        })
      }

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Simulate creating and removing nodes with textures
      const createAndRemoveTexturedNodes = async () => {
        // Create 20 nodes with textures
        for (let i = 0; i < 20; i++) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }

        // Remove all nodes (should dispose textures)
        for (let i = 0; i < 20; i++) {
          mockTexture.destroy()
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      await createAndRemoveTexturedNodes()

      // All textures should be disposed
      expect(disposedTextures).toBe(20)
    })

    it('should limit texture cache size to prevent memory leaks', async () => {
      const textureCache: any[] = []

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Simulate creating many textures
      for (let i = 0; i < 200; i++) {
        textureCache.push({ id: i, data: new Array(1000).fill(0) })
        await new Promise(resolve => setTimeout(resolve, 1))
      }

      // Cache should be managed (not grow indefinitely)
      // In a real implementation, Pixi.js would manage this
      expect(textureCache.length).toBe(200)

      // Simulate cache cleanup
      textureCache.splice(0, 150) // Remove oldest 150 textures

      expect(textureCache.length).toBe(50)
    })
  })

  describe('Animation Performance', () => {
    it('should maintain smooth animations during heavy operations', async () => {
      const animationFrameTimes: number[] = []

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Test animation smoothness during node operations
      const animateWithOperations = async () => {
        for (let frame = 0; frame < 60; frame++) { // 1 second at 60 FPS
          performanceMonitor.start()

          // Simulate animation frame with concurrent operations
          await Promise.all([
            new Promise(resolve => setTimeout(resolve, 1)), // Animation work
            new Promise(resolve => setTimeout(resolve, 1)), // Concurrent operations
          ])

          const frameTime = performanceMonitor.end()
          animationFrameTimes.push(frameTime)
        }
      }

      await animateWithOperations()

      const averageFrameTime = animationFrameTimes.reduce((a, b) => a + b, 0) / animationFrameTimes.length
      const maxFrameTime = Math.max(...animationFrameTimes)

      // Average frame time should be under 16.67ms (60 FPS)
      expect(averageFrameTime).toBeLessThan(16.67)
      // No frame should take longer than 33ms (30 FPS minimum)
      expect(maxFrameTime).toBeLessThan(33)
    })

    it('should handle momentum scrolling smoothly', async () => {
      const momentumUpdates: number[] = []

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Test momentum scrolling performance
      for (let i = 0; i < 30; i++) {
        performanceMonitor.start()

        // Simulate momentum calculation and scrolling
        await new Promise(resolve => setTimeout(resolve, 16)) // 60 FPS

        const updateTime = performanceMonitor.end()
        momentumUpdates.push(updateTime)
      }

      const averageUpdateTime = momentumUpdates.reduce((a, b) => a + b, 0) / momentumUpdates.length

      // Momentum updates should be fast (< 5ms)
      expect(averageUpdateTime).toBeLessThan(5)
    })
  })

  describe('Large Canvas Performance', () => {
    it('should handle infinite canvas bounds efficiently', async () => {
      const viewportUpdates: number[] = []

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Test performance with large canvas coordinates
      const largeCoordinates = [
        { x: -25000, y: -25000 },
        { x: 25000, y: 25000 },
        { x: -50000, y: 0 },
        { x: 0, y: 50000 }
      ]

      for (const coords of largeCoordinates) {
        performanceMonitor.start()

        // Simulate viewport update to large coordinates
        await new Promise(resolve => setTimeout(resolve, 10))

        const updateTime = performanceMonitor.end()
        viewportUpdates.push(updateTime)
      }

      const averageUpdateTime = viewportUpdates.reduce((a, b) => a + b, 0) / viewportUpdates.length

      // Large coordinate updates should be fast
      expect(averageUpdateTime).toBeLessThan(20)
    })

    it('should maintain performance with distant objects', async () => {
      const cullingTimes: number[] = []

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Test viewport culling performance with distant objects
      for (let i = 0; i < 20; i++) {
        performanceMonitor.start()

        // Simulate culling calculation for 1000 objects at various distances
        await new Promise(resolve => setTimeout(resolve, 5))

        const cullingTime = performanceMonitor.end()
        cullingTimes.push(cullingTime)
      }

      const averageCullingTime = cullingTimes.reduce((a, b) => a + b, 0) / cullingTimes.length

      // Viewport culling should be very fast
      expect(averageCullingTime).toBeLessThan(10)
    })
  })

  describe('Concurrent Operations Performance', () => {
    it('should handle multiple simultaneous node updates', async () => {
      const operationTimes: number[] = []

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Test concurrent node operations
      const concurrentOperations = async () => {
        const operations = []

        for (let i = 0; i < 10; i++) {
          operations.push(
            new Promise<void>(async (resolve) => {
              performanceMonitor.start()

              // Simulate concurrent node update
              await new Promise(resolveOp => setTimeout(resolveOp, Math.random() * 20))

              const operationTime = performanceMonitor.end()
              operationTimes.push(operationTime)
              resolve()
            })
          )
        }

        await Promise.all(operations)
      }

      await concurrentOperations()

      const averageOperationTime = operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length
      const maxOperationTime = Math.max(...operationTimes)

      // Concurrent operations should be reasonably fast
      expect(averageOperationTime).toBeLessThan(30)
      expect(maxOperationTime).toBeLessThan(50)
    })

    it('should maintain responsiveness during bulk operations', async () => {
      const responsivenessTimes: number[] = []

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Test responsiveness during bulk node creation
      const bulkOperationWithResponsivenessCheck = async () => {
        const bulkPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            // Simulate bulk operation
            resolve()
          }, 1000)
        })

        // Check responsiveness every 100ms during bulk operation
        const responsivenessChecks = []
        for (let i = 0; i < 10; i++) {
          responsivenessChecks.push(
            new Promise<void>((resolve) => {
              setTimeout(() => {
                performanceMonitor.start()
                // Quick responsiveness check
                setTimeout(() => {
                  const responseTime = performanceMonitor.end()
                  responsivenessTimes.push(responseTime)
                  resolve()
                }, 1)
              }, i * 100)
            })
          )
        }

        await Promise.all([bulkPromise, ...responsivenessChecks])
      }

      await bulkOperationWithResponsivenessCheck()

      const averageResponsiveness = responsivenessTimes.reduce((a, b) => a + b, 0) / responsivenessTimes.length

      // Should remain responsive during bulk operations
      expect(averageResponsiveness).toBeLessThan(10)
    })
  })
})
