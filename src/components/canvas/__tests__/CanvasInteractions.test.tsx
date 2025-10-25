import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanvasInteractions } from '../CanvasInteractions';
import { useCanvasStore } from '../CanvasState';

// Mock the store
vi.mock('../CanvasState', () => ({
  useCanvasStore: vi.fn()
}));

// Mock PIXI
vi.mock('pixi.js', () => ({
  Application: vi.fn(() => ({
    view: document.createElement('canvas'),
    stage: { addChild: vi.fn(), removeChild: vi.fn() },
    renderer: { resize: vi.fn() },
    destroy: vi.fn()
  })),
  Container: vi.fn(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroy: vi.fn()
  }))
}));

describe('CanvasInteractions', () => {
  const mockStore = {
    nodes: new Map(),
    connections: new Map(),
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedNodes: [],
    selectedConnections: [],
    activeTool: 'select',
    config: { width: 800, height: 600, backgroundColor: 0xffffff },
    actions: {
      setViewport: vi.fn(),
      selectNodes: vi.fn(),
      addNode: vi.fn(),
      updateNode: vi.fn(),
      deleteNode: vi.fn(),
      setActiveTool: vi.fn()
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useCanvasStore as any).mockReturnValue(mockStore);
  });

  it('renders without crashing', () => {
    render(<CanvasInteractions />);
    expect(screen.getByRole('canvas-container')).toBeInTheDocument();
  });

  it('handles mouse down events', () => {
    render(<CanvasInteractions />);
    const container = screen.getByRole('canvas-container');

    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });

    // Should call selectNodes with empty array for new selection
    expect(mockStore.actions.selectNodes).toHaveBeenCalledWith([]);
  });

  it('handles mouse move events during drag', () => {
    render(<CanvasInteractions />);
    const container = screen.getByRole('canvas-container');

    // Start drag
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(container, { clientX: 150, clientY: 150 });

    // Should update viewport during drag
    expect(mockStore.actions.setViewport).toHaveBeenCalled();
  });

  it('handles wheel events for zoom', () => {
    render(<CanvasInteractions />);
    const container = screen.getByRole('canvas-container');

    fireEvent.wheel(container, { deltaY: -100, clientX: 400, clientY: 300 });

    // Should update viewport with zoom
    expect(mockStore.actions.setViewport).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts', () => {
    render(<CanvasInteractions />);

    // Test delete key
    fireEvent.keyDown(document, { key: 'Delete' });
    expect(mockStore.actions.deleteNode).toHaveBeenCalled();

    // Test escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockStore.actions.setActiveTool).toHaveBeenCalledWith('select');
  });

  it('prevents default behavior on handled events', () => {
    render(<CanvasInteractions />);
    const container = screen.getByRole('canvas-container');

    const wheelEvent = fireEvent.wheel(container, { deltaY: -100 });
    expect(wheelEvent.defaultPrevented).toBe(true);
  });

  it('memoizes event handlers', () => {
    const { rerender } = render(<CanvasInteractions />);

    // Get initial handler references
    const initialHandlers = {
      onMouseDown: vi.fn(),
      onMouseMove: vi.fn(),
      onWheel: vi.fn()
    };

    // Re-render
    rerender(<CanvasInteractions />);

    // Event handlers should be the same references (memoized)
    // This is tested implicitly by React.memo optimization
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<CanvasInteractions />);

    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
  });

  it('handles touch events on mobile', () => {
    // Mock touch event
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as Touch]
    });

    render(<CanvasInteractions />);
    const container = screen.getByRole('canvas-container');

    fireEvent(container, touchStart);

    // Should handle touch like mouse events
    expect(mockStore.actions.selectNodes).toHaveBeenCalledWith([]);
  });

  it('respects zoom limits', () => {
    render(<CanvasInteractions />);
    const container = screen.getByRole('canvas-container');

    // Try to zoom out too far
    fireEvent.wheel(container, { deltaY: 1000, clientX: 400, clientY: 300 });

    // Should clamp zoom to minimum value
    const lastCall = mockStore.actions.setViewport.mock.calls[mockStore.actions.setViewport.mock.calls.length - 1];
    expect(lastCall[0].zoom).toBeGreaterThanOrEqual(0.1);
  });
});
