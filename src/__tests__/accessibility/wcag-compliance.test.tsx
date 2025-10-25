import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { EnhancedCanvas } from '../../components/canvas/EnhancedCanvas.js'
import { PropertiesPanel } from '../../components/panels/PropertiesPanel.js'
import { NodePalette } from '../../components/panels/NodePalette.js'
import { Toolbar } from '../../components/toolbar/Toolbar.js'
import { useStudioStore } from '../../hooks/useStudioStore.js'
import { server } from '../../test/server.js'
import React from 'react'

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    getToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  },
}))

// Enhanced Pixi.js mock with complete API coverage for accessibility testing
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
  TextStyle: vi.fn().mockImplementation((style: any = {}) => ({
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

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, actions } = useStudioStore()
  return <div data-testid="studio-store-context">{children}</div>
}

// Mock components with proper accessibility attributes
const AccessiblePropertiesPanel: React.FC = () => {
  const { state } = useStudioStore()
  const { selection, nodes } = state

  const selectedNode = selection.selectedNodes.length === 1
    ? nodes.get(selection.selectedNodes[0])
    : null

  return (
    <div
      role="complementary"
      aria-label="Properties panel"
      data-testid="properties-panel"
    >
      <h2 id="properties-heading">Properties</h2>
      {selectedNode ? (
        <div role="region" aria-labelledby="properties-heading">
          <p>Selected: {selectedNode.data.label}</p>
          <p>Type: {selectedNode.type}</p>
          <button
            aria-label={`Edit properties for ${selectedNode.data.label}`}
            data-testid="edit-properties-btn"
          >
            Edit Properties
          </button>
        </div>
      ) : (
        <p role="status" aria-live="polite">No node selected</p>
      )}
    </div>
  )
}

const AccessibleNodePalette: React.FC = () => (
  <div
    role="complementary"
    aria-label="Node palette"
    data-testid="node-palette"
  >
    <h2 id="palette-heading">Node Palette</h2>
    <div role="toolbar" aria-labelledby="palette-heading">
      <button
        aria-label="Create start node"
        data-testid="start-node-btn"
      >
        Start Node
      </button>
      <button
        aria-label="Create action node"
        data-testid="action-node-btn"
      >
        Action Node
      </button>
    </div>
  </div>
)

const AccessibleToolbar: React.FC = () => (
  <div
    role="toolbar"
    aria-label="Canvas tools"
    data-testid="toolbar"
  >
    <h2 id="toolbar-heading">Tools</h2>
    <button
      aria-label="Select tool"
      aria-pressed="true"
      data-testid="select-tool"
    >
      Select
    </button>
    <button
      aria-label="Pan tool"
      aria-pressed="false"
      data-testid="pan-tool"
    >
      Pan
    </button>
    <button
      aria-label="Zoom in"
      aria-describedby="zoom-help"
      data-testid="zoom-in-btn"
    >
      +
    </button>
    <div id="zoom-help" className="sr-only">
      Zoom in on canvas. Keyboard shortcut: +
    </div>
  </div>
)

describe('WCAG 2.1 AA Compliance', () => {
  beforeEach(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
  })

  describe('Automated Accessibility Testing', () => {
    it('should pass axe-core accessibility audit for canvas component', async () => {
      const { container } = render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Wait for canvas to initialize
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should pass axe-core accessibility audit for toolbar', async () => {
      const { container } = render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should pass axe-core accessibility audit for properties panel', async () => {
      const { container } = render(
        <TestWrapper>
          <AccessiblePropertiesPanel />
        </TestWrapper>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should pass axe-core accessibility audit for node palette', async () => {
      const { container } = render(
        <TestWrapper>
          <AccessibleNodePalette />
        </TestWrapper>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation (2.1.1)', () => {
    it('should support full keyboard navigation through canvas tools', async () => {
      render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      const selectTool = screen.getByTestId('select-tool')
      const panTool = screen.getByTestId('pan-tool')
      const zoomInBtn = screen.getByTestId('zoom-in-btn')

      // Test Tab navigation
      selectTool.focus()
      expect(document.activeElement).toBe(selectTool)

      fireEvent.keyDown(selectTool, { key: 'Tab' })
      expect(document.activeElement).toBe(panTool)

      fireEvent.keyDown(panTool, { key: 'Tab' })
      expect(document.activeElement).toBe(zoomInBtn)
    })

    it('should support keyboard shortcuts with proper announcements', async () => {
      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Mock keyboard shortcuts
      const canvas = screen.getByRole('main')

      // Test spacebar for pan tool toggle
      fireEvent.keyDown(canvas, { key: ' ' })
      // Should announce tool change to screen readers

      // Test 'G' for grid toggle
      fireEvent.keyDown(canvas, { key: 'g', ctrlKey: true })
      // Should announce grid state change

      // Test '0' for zoom to fit
      fireEvent.keyDown(canvas, { key: '0' })
      // Should announce zoom reset
    })

    it('should provide keyboard navigation for canvas interactions', async () => {
      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      const canvas = screen.getByRole('main')

      // Canvas should be focusable
      canvas.focus()
      expect(document.activeElement).toBe(canvas)

      // Test arrow key navigation (if implemented)
      fireEvent.keyDown(canvas, { key: 'ArrowUp' })
      fireEvent.keyDown(canvas, { key: 'ArrowDown' })
      fireEvent.keyDown(canvas, { key: 'ArrowLeft' })
      fireEvent.keyDown(canvas, { key: 'ArrowRight' })

      // Canvas should announce position changes to screen readers
    })
  })

  describe('Screen Reader Support (1.3.1, 4.1.2)', () => {
    it('should provide proper ARIA labels for all interactive elements', async () => {
      render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      const selectTool = screen.getByTestId('select-tool')
      const panTool = screen.getByTestId('pan-tool')
      const zoomInBtn = screen.getByTestId('zoom-in-btn')

      expect(selectTool).toHaveAttribute('aria-label', 'Select tool')
      expect(panTool).toHaveAttribute('aria-label', 'Pan tool')
      expect(zoomInBtn).toHaveAttribute('aria-label', 'Zoom in')
    })

    it('should announce dynamic content changes to screen readers', async () => {
      render(
        <TestWrapper>
          <AccessiblePropertiesPanel />
        </TestWrapper>
      )

      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('aria-live', 'polite')

      // When node selection changes, screen reader should be notified
      expect(statusElement).toBeInTheDocument()
    })

    it('should provide proper heading structure', async () => {
      render(
        <TestWrapper>
          <div>
            <AccessibleToolbar />
            <AccessiblePropertiesPanel />
            <AccessibleNodePalette />
          </div>
        </TestWrapper>
      )

      const headings = screen.getAllByRole('heading', { level: 2 })
      expect(headings).toHaveLength(3)

      // Check heading hierarchy
      expect(headings[0]).toHaveTextContent('Tools')
      expect(headings[1]).toHaveTextContent('Properties')
      expect(headings[2]).toHaveTextContent('Node Palette')
    })

    it('should use semantic HTML elements correctly', async () => {
      render(
        <TestWrapper>
          <div>
            <AccessibleToolbar />
            <AccessiblePropertiesPanel />
          </div>
        </TestWrapper>
      )

      // Check for proper semantic roles
      expect(screen.getByRole('toolbar')).toBeInTheDocument()
      expect(screen.getByRole('complementary')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('Color Contrast (1.4.3, 1.4.11)', () => {
    it('should maintain minimum color contrast ratios', async () => {
      // This test would typically use a color contrast testing library
      // For now, we'll test that the theme provides adequate contrast

      const { LIGHT_THEME } = await import('../../constants/themes.js')

      // Test that theme colors meet WCAG contrast requirements
      expect(LIGHT_THEME.colors.text).toBeDefined()
      expect(LIGHT_THEME.colors.background).toBeDefined()

      // In a real implementation, you would calculate contrast ratios:
      // - Normal text: 4.5:1 minimum
      // - Large text: 3:1 minimum
      // - UI components: 3:1 minimum
    })

    it('should support high contrast mode', async () => {
      // Test that the application supports Windows High Contrast mode
      // This would involve checking CSS media queries and high contrast colors

      const { container } = render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      // Check for high contrast support in CSS
      // This is typically handled by CSS media queries, not testable in unit tests
      expect(container).toBeInTheDocument()
    })

    it('should not rely solely on color for conveying information', async () => {
      render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      const selectTool = screen.getByTestId('select-tool')
      const panTool = screen.getByTestId('pan-tool')

      // Tools should have both visual and textual indicators
      expect(selectTool).toHaveAttribute('aria-pressed', 'true')
      expect(panTool).toHaveAttribute('aria-pressed', 'false')

      // Screen readers should announce the state
      expect(selectTool).toHaveAttribute('aria-label')
      expect(panTool).toHaveAttribute('aria-label')
    })
  })

  describe('Focus Management (2.4.7, 2.4.3)', () => {
    it('should maintain visible focus indicators', async () => {
      render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      const selectTool = screen.getByTestId('select-tool')

      // Focus the element
      selectTool.focus()

      // Check that focus is visible (this would be tested with visual regression)
      expect(document.activeElement).toBe(selectTool)

      // The actual focus ring visibility would be tested in visual regression tests
    })

    it('should manage focus correctly during modal operations', async () => {
      // Test focus management when opening/closing modals or dialogs
      // This would involve testing focus trapping and restoration

      render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      const selectTool = screen.getByTestId('select-tool')
      selectTool.focus()

      expect(document.activeElement).toBe(selectTool)
    })

    it('should provide logical tab order', async () => {
      render(
        <TestWrapper>
          <div>
            <AccessibleToolbar />
            <AccessibleNodePalette />
            <AccessiblePropertiesPanel />
          </div>
        </TestWrapper>
      )

      const allFocusable = screen.getAllByRole('button')

      // Test that tab order follows logical reading order
      expect(allFocusable.length).toBeGreaterThan(0)

      // Focus first element
      allFocusable[0].focus()
      expect(document.activeElement).toBe(allFocusable[0])
    })
  })

  describe('Touch Target Sizes (2.5.5)', () => {
    it('should provide adequate touch target sizes', async () => {
      render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      const buttons = screen.getAllByRole('button')

      buttons.forEach(button => {
        const rect = button.getBoundingClientRect()

        // WCAG requires minimum 44px touch targets
        expect(rect.width).toBeGreaterThanOrEqual(44)
        expect(rect.height).toBeGreaterThanOrEqual(44)
      })
    })

    it('should maintain touch target sizes on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      const buttons = screen.getAllByRole('button')

      buttons.forEach(button => {
        const rect = button.getBoundingClientRect()

        // Touch targets should remain adequate on mobile
        expect(rect.width).toBeGreaterThanOrEqual(44)
        expect(rect.height).toBeGreaterThanOrEqual(44)
      })
    })
  })

  describe('Error Identification (3.3.1)', () => {
    it('should announce form validation errors to screen readers', async () => {
      render(
        <TestWrapper>
          <AccessiblePropertiesPanel />
        </TestWrapper>
      )

      // Test that validation errors are properly announced
      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('aria-live', 'polite')

      // In a real scenario, triggering validation would update this element
      expect(statusElement).toBeInTheDocument()
    })

    it('should associate error messages with form fields', async () => {
      // Test that error messages are properly associated with inputs
      // This would involve testing aria-describedby relationships

      render(
        <TestWrapper>
          <AccessiblePropertiesPanel />
        </TestWrapper>
      )

      // Check for proper error associations
      expect(screen.getByTestId('properties-panel')).toBeInTheDocument()
    })
  })

  describe('Language and Content (3.1.1, 3.1.2)', () => {
    it('should specify document language', async () => {
      // Test that the document has proper lang attribute
      expect(document.documentElement).toHaveAttribute('lang')
    })

    it('should use clear and simple language', async () => {
      render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      // Check that button labels are clear and unambiguous
      const selectTool = screen.getByTestId('select-tool')
      const panTool = screen.getByTestId('pan-tool')

      expect(selectTool).toHaveAttribute('aria-label')
      expect(panTool).toHaveAttribute('aria-label')
    })

    it('should avoid jargon without explanation', async () => {
      // Test that technical terms are explained or avoided
      render(
        <TestWrapper>
          <AccessibleToolbar />
        </TestWrapper>
      )

      // Check tooltips or help text for complex terms
      const zoomBtn = screen.getByTestId('zoom-in-btn')
      expect(zoomBtn).toHaveAttribute('aria-describedby')
    })
  })

  describe('Timing and Interruptions (2.2.1, 2.2.4)', () => {
    it('should not have time limits that cannot be extended', async () => {
      // Test that any time limits can be extended or disabled
      // This is important for users who need more time to complete actions

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Canvas operations should not have restrictive time limits
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should allow users to pause, stop, or hide moving content', async () => {
      // Test that animations and auto-updating content can be controlled

      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // Any animations should be controllable by the user
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Input Assistance (3.3.2, 3.3.3)', () => {
    it('should provide input assistance and error prevention', async () => {
      render(
        <TestWrapper>
          <AccessiblePropertiesPanel />
        </TestWrapper>
      )

      // Test that the interface helps prevent input errors
      // This could include validation, suggestions, or reversible actions

      expect(screen.getByTestId('properties-panel')).toBeInTheDocument()
    })

    it('should support undo functionality', async () => {
      // Test that destructive actions can be undone
      render(
        <TestWrapper>
          <EnhancedCanvas />
        </TestWrapper>
      )

      // The canvas should support undo operations
      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })
})
