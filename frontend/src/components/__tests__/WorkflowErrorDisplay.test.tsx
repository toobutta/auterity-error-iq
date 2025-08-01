import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import WorkflowErrorDisplay from '../WorkflowErrorDisplay';
import { ErrorProvider } from '../../contexts/ErrorContext';
import * as workflowsApi from '../../api/workflows';

// Mock the API functions
vi.mock('../../api/workflows', () => ({
  getExecution: vi.fn(),
  getExecutionLogs: vi.fn(),
  executeWorkflow: vi.fn(),
}));

const mockExecution = {
  id: 'exec-123',
  workflowId: 'workflow-456',
  status: 'failed' as const,
  inputData: { input: 'test data' },
  outputData: {},
  startedAt: '2024-01-01T10:00:00Z',
  completedAt: '2024-01-01T10:05:00Z',
  duration: 300000,
  errorMessage: 'AI service timeout: Request timed out after 30 seconds'
};

const mockLogs = [
  {
    id: 'log-1',
    stepName: 'Input Validation',
    level: 'info',
    message: 'Validating input parameters',
    timestamp: '2024-01-01T10:00:00Z',
    duration: 100,
    data: { input: 'test data' }
  },
  {
    id: 'log-2',
    stepName: 'AI Processing',
    level: 'error',
    message: 'AI service timeout: Request timed out after 30 seconds',
    timestamp: '2024-01-01T10:04:30Z',
    duration: 30000,
    data: { error: 'timeout' }
  }
];

const renderWithErrorProvider = (component: React.ReactElement) => {
  return render(
    <ErrorProvider>
      {component}
    </ErrorProvider>
  );
};

describe('WorkflowErrorDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (workflowsApi.getExecution as any).mockResolvedValue(mockExecution);
    (workflowsApi.getExecutionLogs as any).mockResolvedValue(mockLogs);
  });

  it('renders loading state initially', () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    expect(screen.getByText('Loading error details...')).toBeInTheDocument();
  });

  it('displays error overview after loading', async () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('Workflow Execution Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Execution ID: exec-123')).toBeInTheDocument();
    expect(screen.getByText('AI service timeout: Request timed out after 30 seconds')).toBeInTheDocument();
  });

  it('categorizes errors correctly', async () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('ai service')).toBeInTheDocument();
    });

    // Should show medium severity for AI service errors
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('displays execution timeline', async () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('Started:')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed:')).toBeInTheDocument();
    expect(screen.getByText('Duration:')).toBeInTheDocument();
  });

  it('shows execution logs when expanded', async () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('Execution Logs (2 steps)')).toBeInTheDocument();
    });

    // Click to expand logs section
    fireEvent.click(screen.getByText('Execution Logs (2 steps)'));

    await waitFor(() => {
      expect(screen.getByText('Input Validation')).toBeInTheDocument();
      expect(screen.getByText('AI Processing')).toBeInTheDocument();
    });
  });

  it('displays retry button when workflowId is provided', async () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay 
        executionId="exec-123" 
        workflowId="workflow-456"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Retry Execution')).toBeInTheDocument();
    });
  });

  it('opens retry form when retry button is clicked', async () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay 
        executionId="exec-123" 
        workflowId="workflow-456"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Retry Execution')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Retry Execution'));

    await waitFor(() => {
      expect(screen.getByText('Retry Workflow Execution')).toBeInTheDocument();
    });

    expect(screen.getByText('You can modify the input parameters before retrying the workflow execution.')).toBeInTheDocument();
  });

  it('handles retry execution', async () => {
    const mockNewExecution = { id: 'exec-789' };
    (workflowsApi.executeWorkflow as any).mockResolvedValue(mockNewExecution);
    
    const onRetrySuccess = vi.fn();

    renderWithErrorProvider(
      <WorkflowErrorDisplay 
        executionId="exec-123" 
        workflowId="workflow-456"
        onRetrySuccess={onRetrySuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Retry Execution')).toBeInTheDocument();
    });

    // Open retry form
    fireEvent.click(screen.getByText('Retry Execution'));

    await waitFor(() => {
      expect(screen.getByText('Retry Workflow Execution')).toBeInTheDocument();
    });

    // Click retry button in modal
    fireEvent.click(screen.getByRole('button', { name: /retry execution/i }));

    await waitFor(() => {
      expect(workflowsApi.executeWorkflow).toHaveBeenCalledWith('workflow-456', { input: 'test data' });
      expect(onRetrySuccess).toHaveBeenCalledWith('exec-789');
    });
  });

  it('opens error report form when report button is clicked', async () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('Report Issue')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Report Issue'));

    await waitFor(() => {
      expect(screen.getByText('Report Error')).toBeInTheDocument();
    });

    expect(screen.getByText('Help us improve by providing details about this error. Your feedback will be used to prevent similar issues.')).toBeInTheDocument();
  });

  it('identifies failure point from logs', async () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('Step 2: AI Processing')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (workflowsApi.getExecution as any).mockRejectedValue(new Error('API Error'));

    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('Loading error details...')).toBeInTheDocument();
    });

    // Should eventually show no error information available
    await waitFor(() => {
      expect(screen.getByText('No error information available')).toBeInTheDocument();
    });
  });

  it('shows different error categories correctly', async () => {
    const validationExecution = {
      ...mockExecution,
      errorMessage: 'Validation failed: Required field missing'
    };

    (workflowsApi.getExecution as any).mockResolvedValue(validationExecution);

    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('validation')).toBeInTheDocument();
    });
  });

  it('expands and collapses sections correctly', async () => {
    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('Error Overview')).toBeInTheDocument();
    });

    // Overview should be expanded by default
    expect(screen.getByText('Category')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByText('Error Overview'));

    await waitFor(() => {
      expect(screen.queryByText('Category')).not.toBeInTheDocument();
    });
  });

  it('handles missing execution data', async () => {
    (workflowsApi.getExecution as any).mockResolvedValue(null);

    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('No error information available')).toBeInTheDocument();
    });
  });

  it('handles non-failed execution status', async () => {
    const successExecution = {
      ...mockExecution,
      status: 'completed' as const
    };

    (workflowsApi.getExecution as any).mockResolvedValue(successExecution);

    renderWithErrorProvider(
      <WorkflowErrorDisplay executionId="exec-123" />
    );

    await waitFor(() => {
      expect(screen.getByText('No error information available')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();

    renderWithErrorProvider(
      <WorkflowErrorDisplay 
        executionId="exec-123" 
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Workflow Execution Failed')).toBeInTheDocument();
    });

    // Find and click close button
    const closeButton = screen.getByRole('button', { name: '' }); // Close button typically has no text
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});