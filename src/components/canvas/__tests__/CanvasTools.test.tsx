import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CanvasTools } from '../CanvasTools.js';
import { useCanvasStore } from '../CanvasState.js';

// Mock the store
vi.mock('../CanvasState', () => ({
  useCanvasStore: vi.fn()
}));

// Mock node factory
vi.mock('../../../utils/nodeFactory', () => ({
  createNode: vi.fn((type, position, id) => ({
    id,
    type,
    position,
    data: {},
    style: {}
  }))
}));

describe('CanvasTools', () => {
  const mockStore = {
    nodes: new Map(),
    connections: new Map(),
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedNodes: ['node1'],
    selectedConnections: [],
    activeTool: 'select',
    config: { width: 800, height: 600, backgroundColor: 0xffffff },
    actions: {
      addNode: vi.fn(),
      updateNode: vi.fn(),
      deleteNode: vi.fn(),
      setActiveTool: vi.fn(),
      selectNodes: vi.fn(),
      addConnection: vi.fn()
    }
  };

  const mockProps = {
    activeTool: 'select',
    nodes: new Map(),
    selectedNodes: [],
    canvas: { width: 800, height: 600 },
    viewport: { x: 0, y: 0, zoom: 1 },
    onToolChange: vi.fn(),
    onNodeCreate: vi.fn(),
    onNodeSelect: vi.fn(),
    onNodeDuplicate: vi.fn(),
    onNodeDelete: vi.fn(),
    onConnectionCreate: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useCanvasStore as any).mockReturnValue(mockStore);
  });

  it('renders tool palette', () => {
    render(<CanvasTools {...mockProps} />);
    expect(screen.getByRole('toolbar', { name: /canvas tools/i })).toBeInTheDocument();
  });

  it('displays available tools', () => {
    render(<CanvasTools {...mockProps} />);

    expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add node/i })).toBeInTheDocument();
  });

  it('changes active tool when clicked', () => {
    render(<CanvasTools {...mockProps} />);

    const panButton = screen.getByRole('button', { name: /pan/i });
    fireEvent.click(panButton);

    expect(mockProps.onToolChange).toHaveBeenCalledWith('pan');
  });

  it('shows active tool state', () => {
    render(<CanvasTools {...{ ...mockProps, activeTool: 'pan' }} />);

    const panButton = screen.getByRole('button', { name: /pan/i });
    expect(panButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles keyboard shortcuts for tools', () => {
    render(<CanvasTools {...mockProps} />);

    // Press 'V' for select tool
    fireEvent.keyDown(document, { key: 'v' });
    expect(mockProps.onToolChange).toHaveBeenCalledWith('select');

    // Press 'H' for pan tool
    fireEvent.keyDown(document, { key: 'h' });
    expect(mockProps.onToolChange).toHaveBeenCalledWith('pan');

    // Press 'A' for add node tool
    fireEvent.keyDown(document, { key: 'a' });
    expect(mockProps.onToolChange).toHaveBeenCalledWith('add-node');
  });

  it('handles node creation with add-node tool', async () => {
    render(<CanvasTools {...{ ...mockProps, activeTool: 'add-node' }} />);

    // Simulate canvas click
    const canvas = screen.getByRole('canvas-tools-container');
    fireEvent.click(canvas, { clientX: 200, clientY: 150 });

    await waitFor(() => {
      expect(mockProps.onNodeCreate).toHaveBeenCalled();
    });
  });

  it('handles bulk operations', () => {
    render(<CanvasTools {...{ ...mockProps, selectedNodes: ['node1', 'node2', 'node3'] }} />);

    const deleteButton = screen.getByRole('button', { name: /delete selected/i });
    fireEvent.click(deleteButton);

    expect(mockProps.onNodeDelete).toHaveBeenCalledWith(['node1', 'node2', 'node3']);
  });

  it('shows tooltips for accessibility', () => {
    render(<CanvasTools {...mockProps} />);

    const selectButton = screen.getByRole('button', { name: /select/i });
    expect(selectButton).toHaveAttribute('title', 'Select tool (V)');
  });

  it('handles undo/redo operations', () => {
    render(<CanvasTools {...mockProps} />);

    // Test undo
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    // Should trigger undo action (mocked in store)

    // Test redo
    fireEvent.keyDown(document, { key: 'y', ctrlKey: true });
    // Should trigger redo action (mocked in store)
  });

  it('updates tool state based on canvas interactions', () => {
    const { rerender } = render(<CanvasTools {...mockProps} />);

    // Simulate tool change from external source
    rerender(<CanvasTools {...{ ...mockProps, activeTool: 'add-node' }} />);

    const addNodeButton = screen.getByRole('button', { name: /add node/i });
    expect(addNodeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles connection creation', () => {
    render(<CanvasTools {...{ ...mockProps, activeTool: 'connect', selectedNodes: ['source-node'] }} />);

    const canvas = screen.getByRole('canvas-tools-container');
    fireEvent.click(canvas, { clientX: 300, clientY: 200 });

    expect(mockProps.onConnectionCreate).toHaveBeenCalled();
  });

  it('validates tool operations', () => {
    render(<CanvasTools {...{ ...mockProps, selectedNodes: [] }} />);

    const deleteButton = screen.getByRole('button', { name: /delete selected/i });

    // Should be disabled when no nodes selected
    expect(deleteButton).toBeDisabled();
  });
});
