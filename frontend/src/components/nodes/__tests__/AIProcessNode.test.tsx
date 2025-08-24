import { render, screen } from '@testing-library/react';
import { AIProcessNode } from '../AIProcessNode';
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

describe('AIProcessNode', () => {
  const mockData: NodeData = {
    label: 'AI Process',
    description: 'This is an AI process node',
    type: 'ai_process',
    config: {
      prompt: 'This is a test prompt for AI processing',
    },
  };

  it('renders AI process node with label and description', () => {
    render(<AIProcessNode data={mockData} isConnectable={true} />);

    expect(screen.getByText('AI Process')).toBeInTheDocument();
    expect(screen.getByText('This is an AI process node')).toBeInTheDocument();
  });

  it('renders truncated prompt when provided', () => {
    render(<AIProcessNode data={mockData} isConnectable={true} />);

    // The prompt gets truncated to 30 characters plus "..."
    expect(screen.getByText(/This is a test prompt for AI p.../)).toBeInTheDocument();
  });

  it('renders both target and source handles', () => {
    render(<AIProcessNode data={mockData} isConnectable={true} />);

    expect(screen.getByTestId('handle-target-top')).toBeInTheDocument();
    expect(screen.getByTestId('handle-source-bottom')).toBeInTheDocument();
  });

  it('shows validation errors when present', () => {
    const dataWithErrors = {
      ...mockData,
      validationErrors: ['AI prompt is required', 'Step name is required'],
    };

    render(<AIProcessNode data={dataWithErrors} isConnectable={true} />);

    expect(screen.getByText('AI prompt is required')).toBeInTheDocument();
  });

  it('applies error styling when validation errors exist', () => {
    const dataWithErrors = {
      ...mockData,
      validationErrors: ['AI prompt is required'],
    };

    const { container } = render(<AIProcessNode data={dataWithErrors} isConnectable={true} />);

    const nodeElement = container.querySelector('.border-red-400');
    expect(nodeElement).toBeInTheDocument();
  });

  it('applies normal styling when no validation errors', () => {
    const { container } = render(<AIProcessNode data={mockData} isConnectable={true} />);

    const nodeElement = container.querySelector('.border-blue-300');
    expect(nodeElement).toBeInTheDocument();
  });

  it('renders without prompt when not provided', () => {
    const dataWithoutPrompt = {
      ...mockData,
      config: {},
    };

    render(<AIProcessNode data={dataWithoutPrompt} isConnectable={true} />);

    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
  });
});
