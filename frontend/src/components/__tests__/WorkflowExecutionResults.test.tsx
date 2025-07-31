// React import removed as it's not needed in this test file
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkflowExecutionResults from '../WorkflowExecutionResults';
import * as workflowsApi from '../../api/workflows';

// Mock the API
vi.mock('../../api/workflows', () => ({
  getExecution: vi.fn(),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('WorkflowExecutionResults Component', () => {
  const mockExecution = {
    id: 'exec-123',
    status: 'completed',
    duration: 12345,
    startedAt: '2025-07-29T12:34:56.789Z',
    completedAt: '2025-07-29T12:34:56.789Z',
    inputData: { input: 'test' },
    outputData: {
      result: 'success',
      data: { key: 'value' }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (workflowsApi.getExecution as jest.MockedFunction<typeof workflowsApi.getExecution>).mockResolvedValue(mockExecution);
  });

  it('renders component with completed status', async () => {
    render(<WorkflowExecutionResults executionId="exec-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Execution Results')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('12.3s')).toBeInTheDocument();
      expect(screen.getByText('Output Data')).toBeInTheDocument();
    });
  });

  it('copies output to clipboard when button is clicked', async () => {
    render(<WorkflowExecutionResults executionId="exec-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Execution Results')).toBeInTheDocument();
    });

    const copyButton = screen.getByRole('button', { name: /copy output/i });
    fireEvent.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(mockExecution.outputData, null, 2));
  });

  it('renders error status when execution fails', async () => {
    const errorExecution = {
      ...mockExecution,
      status: 'failed',
      errorMessage: 'Test error message'
    };
    
    (workflowsApi.getExecution as jest.MockedFunction<typeof workflowsApi.getExecution>).mockResolvedValue(errorExecution);
    
    render(<WorkflowExecutionResults executionId="exec-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('failed')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  it('handles primitive output data correctly', async () => {
    const primitiveExecution = {
      ...mockExecution,
      outputData: 42
    };
    
    (workflowsApi.getExecution as jest.MockedFunction<typeof workflowsApi.getExecution>).mockResolvedValue(primitiveExecution);
    
    render(<WorkflowExecutionResults executionId="exec-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Output Data')).toBeInTheDocument();
    });
  });

  it('handles string output data correctly', async () => {
    const stringExecution = {
      ...mockExecution,
      outputData: 'Test string output'
    };
    
    (workflowsApi.getExecution as jest.MockedFunction<typeof workflowsApi.getExecution>).mockResolvedValue(stringExecution);
    
    render(<WorkflowExecutionResults executionId="exec-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Output Data')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<WorkflowExecutionResults executionId="exec-123" />);
    
    expect(screen.getByText('Loading execution results...')).toBeInTheDocument();
  });

  it('shows error state when API call fails', async () => {
    (workflowsApi.getExecution as jest.MockedFunction<typeof workflowsApi.getExecution>).mockRejectedValue(new Error('API Error'));
    
    render(<WorkflowExecutionResults executionId="exec-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Results')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });
});
