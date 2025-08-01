import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ErrorReportModal from '../ErrorReportModal';
import { ErrorProvider } from '../../contexts/ErrorContext';
import { AppError, ErrorCategory, ErrorSeverity } from '../../types/error';

const mockError: AppError = {
  id: 'error-123',
  code: 'WORKFLOW_EXECUTION_FAILED',
  message: 'Workflow execution failed',
  category: ErrorCategory.WORKFLOW,
  severity: ErrorSeverity.HIGH,
  correlationId: 'corr-456',
  context: {
    workflowId: 'workflow-789',
    executionId: 'exec-123',
    timestamp: new Date(),
    url: 'http://localhost:3000/workflows',
    userAgent: 'Mozilla/5.0 (Test Browser)'
  },
  retryable: true,
  userFriendlyMessage: 'The workflow could not be completed due to an error.',
  actionable: true,
  suggestedActions: ['Review workflow configuration', 'Check input parameters']
};

const renderWithErrorProvider = (component: React.ReactElement) => {
  return render(
    <ErrorProvider>
      {component}
    </ErrorProvider>
  );
};

describe('ErrorReportModal', () => {
  const defaultProps = {
    error: mockError,
    isOpen: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} isOpen={false} />
    );

    expect(screen.queryByText('Report Error')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} />
    );

    expect(screen.getByText('Report Error')).toBeInTheDocument();
    expect(screen.getByText('Help us improve by providing details about this error')).toBeInTheDocument();
  });

  it('displays error details in summary', () => {
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} />
    );

    expect(screen.getByText('The workflow could not be completed due to an error.')).toBeInTheDocument();
    expect(screen.getByText('corr-456')).toBeInTheDocument();
    expect(screen.getByText('workflow')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('shows progress bar with correct step', () => {
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} />
    );

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Describe the Issue')).toBeInTheDocument();
  });

  it('requires user feedback to proceed from step 1', () => {
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} />
    );

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();

    const textarea = screen.getByPlaceholderText('I was trying to create a new workflow when...');
    fireEvent.change(textarea, { target: { value: 'I was trying to execute a workflow' } });

    expect(nextButton).not.toBeDisabled();
  });

  it('navigates through all steps correctly', async () => {
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} />
    );

    // Step 1: Describe the Issue
    const userFeedbackTextarea = screen.getByPlaceholderText('I was trying to create a new workflow when...');
    fireEvent.change(userFeedbackTextarea, { target: { value: 'I was trying to execute a workflow' } });

    fireEvent.click(screen.getByText('Next'));

    // Step 2: Reproduction Steps
    await waitFor(() => {
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
      expect(screen.getByText('Reproduction Steps')).toBeInTheDocument();
    });

    const reproductionTextarea = screen.getByPlaceholderText(/1\. Go to the workflow builder/);
    fireEvent.change(reproductionTextarea, { target: { value: '1. Open workflow\n2. Click execute\n3. Error occurs' } });

    fireEvent.click(screen.getByText('Next'));

    // Step 3: Expected vs Actual Behavior
    await waitFor(() => {
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
      expect(screen.getByText('Expected vs Actual Behavior')).toBeInTheDocument();
    });

    const expectedTextarea = screen.getByPlaceholderText('I expected the workflow to save successfully and show a confirmation message...');
    fireEvent.change(expectedTextarea, { target: { value: 'Expected workflow to complete successfully' } });

    const actualTextarea = screen.getByPlaceholderText('Instead, an error message appeared and the workflow was not saved...');
    fireEvent.change(actualTextarea, { target: { value: 'Got an error message instead' } });

    expect(screen.getByText('Submit Report')).not.toBeDisabled();
  });

  it('allows navigation back to previous steps', async () => {
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} />
    );

    // Fill step 1 and go to step 2
    const userFeedbackTextarea = screen.getByPlaceholderText('I was trying to create a new workflow when...');
    fireEvent.change(userFeedbackTextarea, { target: { value: 'Test feedback' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    });

    // Go back to step 1
    fireEvent.click(screen.getByText('Previous'));

    await waitFor(() => {
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });

    // Verify data is preserved
    expect(screen.getByDisplayValue('Test feedback')).toBeInTheDocument();
  });

  it('submits report with correct data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} onSubmit={onSubmit} />
    );

    // Fill all required fields
    fireEvent.change(
      screen.getByPlaceholderText('I was trying to create a new workflow when...'),
      { target: { value: 'User feedback' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByPlaceholderText(/1\. Go to the workflow builder/),
      { target: { value: 'Reproduction steps' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByPlaceholderText('I expected the workflow to save successfully and show a confirmation message...'),
      { target: { value: 'Expected behavior' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Instead, an error message appeared and the workflow was not saved...'),
      { target: { value: 'Actual behavior' } }
    );

    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        error: mockError,
        userFeedback: 'User feedback',
        reproductionSteps: 'Reproduction steps',
        expectedBehavior: 'Expected behavior',
        actualBehavior: 'Actual behavior'
      });
    });
  });

  it('shows success message after submission', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} onSubmit={onSubmit} />
    );

    // Fill and submit form (abbreviated)
    fireEvent.change(
      screen.getByPlaceholderText('I was trying to create a new workflow when...'),
      { target: { value: 'Test' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => screen.getByText('Step 2 of 3'));
    
    fireEvent.change(
      screen.getByPlaceholderText(/1\. Go to the workflow builder/),
      { target: { value: 'Test' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => screen.getByText('Step 3 of 3'));
    
    fireEvent.change(
      screen.getByPlaceholderText('I expected the workflow to save successfully and show a confirmation message...'),
      { target: { value: 'Test' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Instead, an error message appeared and the workflow was not saved...'),
      { target: { value: 'Test' } }
    );

    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(screen.getByText('Report Submitted Successfully')).toBeInTheDocument();
    });

    expect(screen.getByText('Thank you for your feedback. Our team will review this error report and work on a fix.')).toBeInTheDocument();
  });

  it('handles submission errors gracefully', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
    
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} onSubmit={onSubmit} />
    );

    // Fill and submit form (abbreviated)
    fireEvent.change(
      screen.getByPlaceholderText('I was trying to create a new workflow when...'),
      { target: { value: 'Test' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => screen.getByText('Step 2 of 3'));
    
    fireEvent.change(
      screen.getByPlaceholderText(/1\. Go to the workflow builder/),
      { target: { value: 'Test' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => screen.getByText('Step 3 of 3'));
    
    fireEvent.change(
      screen.getByPlaceholderText('I expected the workflow to save successfully and show a confirmation message...'),
      { target: { value: 'Test' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Instead, an error message appeared and the workflow was not saved...'),
      { target: { value: 'Test' } }
    );

    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    // Should not show success message
    expect(screen.queryByText('Report Submitted Successfully')).not.toBeInTheDocument();
  });

  it('closes modal when cancel is clicked', () => {
    const onClose = vi.fn();
    
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} onClose={onClose} />
    );

    fireEvent.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalled();
  });

  it('closes modal when X button is clicked', () => {
    const onClose = vi.fn();
    
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} onClose={onClose} />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // X button typically has no text
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('displays browser information correctly', async () => {
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} />
    );

    // Navigate to step 3
    fireEvent.change(
      screen.getByPlaceholderText('I was trying to create a new workflow when...'),
      { target: { value: 'Test' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => screen.getByText('Step 2 of 3'));
    
    fireEvent.change(
      screen.getByPlaceholderText(/1\. Go to the workflow builder/),
      { target: { value: 'Test' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Browser Information')).toBeInTheDocument();
    });

    // Should display user agent
    expect(screen.getByDisplayValue(/Mozilla/)).toBeInTheDocument();
  });

  it('updates form fields correctly', () => {
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} />
    );

    // Test frequency dropdown
    const frequencySelect = screen.getByDisplayValue('First time');
    fireEvent.change(frequencySelect, { target: { value: 'frequent' } });
    expect(screen.getByDisplayValue('Frequently')).toBeInTheDocument();

    // Test impact dropdown
    const impactSelect = screen.getByDisplayValue('Moderate disruption');
    fireEvent.change(impactSelect, { target: { value: 'major' } });
    expect(screen.getByDisplayValue('Major problem')).toBeInTheDocument();

    // Test severity dropdown
    const severitySelect = screen.getByDisplayValue('High');
    fireEvent.change(severitySelect, { target: { value: 'critical' } });
    expect(screen.getByDisplayValue('Critical')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    const onSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} onSubmit={onSubmit} />
    );

    // Fill form and navigate to final step
    fireEvent.change(
      screen.getByPlaceholderText('I was trying to create a new workflow when...'),
      { target: { value: 'Test' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => screen.getByText('Step 2 of 3'));
    
    fireEvent.change(
      screen.getByPlaceholderText(/1\. Go to the workflow builder/),
      { target: { value: 'Test' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => screen.getByText('Step 3 of 3'));
    
    fireEvent.change(
      screen.getByPlaceholderText('I expected the workflow to save successfully and show a confirmation message...'),
      { target: { value: 'Test' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Instead, an error message appeared and the workflow was not saved...'),
      { target: { value: 'Test' } }
    );

    fireEvent.click(screen.getByText('Submit Report'));

    expect(screen.getByText('Submitting...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Report Submitted Successfully')).toBeInTheDocument();
    });
  });

  it('resets form after successful submission', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    
    renderWithErrorProvider(
      <ErrorReportModal {...defaultProps} onSubmit={onSubmit} onClose={onClose} />
    );

    // Fill and submit form
    fireEvent.change(
      screen.getByPlaceholderText('I was trying to create a new workflow when...'),
      { target: { value: 'Test feedback' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => screen.getByText('Step 2 of 3'));
    
    fireEvent.change(
      screen.getByPlaceholderText(/1\. Go to the workflow builder/),
      { target: { value: 'Test steps' } }
    );
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => screen.getByText('Step 3 of 3'));
    
    fireEvent.change(
      screen.getByPlaceholderText('I expected the workflow to save successfully and show a confirmation message...'),
      { target: { value: 'Expected' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Instead, an error message appeared and the workflow was not saved...'),
      { target: { value: 'Actual' } }
    );

    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(screen.getByText('Report Submitted Successfully')).toBeInTheDocument();
    });

    // Wait for auto-close
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
}); 