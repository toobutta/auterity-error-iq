import { render, screen } from '@testing-library/react';
import { StartNode } from '../StartNode';
import { NodeData } from '../../../types/workflow';

// Mock ReactFlow Handle component
vi.mock('reactflow', () => ({
  Handle: ({ type, position }: { type: string; position: string }) => (
    <div data-testid={`handle-${type}-${position}`} />
  ),
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
}));

describe('StartNode', () => {
  const mockData: NodeData = {
    label: 'Start Node',
    description: 'This is a start node',
    type: 'start',
    config: {},
  };

  it('renders start node with label and description', () => {
    render(<StartNode data={mockData} isConnectable={true} />);

    expect(screen.getByText('Start Node')).toBeInTheDocument();
    expect(screen.getByText('This is a start node')).toBeInTheDocument();
  });

  it('renders without description when not provided', () => {
    const dataWithoutDescription = { ...mockData, description: undefined };
    render(<StartNode data={dataWithoutDescription} isConnectable={true} />);

    expect(screen.getByText('Start Node')).toBeInTheDocument();
    expect(screen.queryByText('This is a start node')).not.toBeInTheDocument();
  });

  it('renders source handle at bottom', () => {
    render(<StartNode data={mockData} isConnectable={true} />);

    expect(screen.getByTestId('handle-source-bottom')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<StartNode data={mockData} isConnectable={true} />);

    const nodeElement = container.querySelector('.bg-green-100');
    expect(nodeElement).toBeInTheDocument();
    expect(nodeElement).toHaveClass('border-2', 'border-green-300', 'rounded-lg');
  });
});
