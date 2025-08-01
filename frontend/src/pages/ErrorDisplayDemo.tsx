import React, { useState } from 'react';
import Layout from '../components/Layout';
import WorkflowErrorDisplay from '../components/WorkflowErrorDisplay';
import ErrorRecoveryGuide from '../components/ErrorRecoveryGuide';
import ErrorReportModal from '../components/ErrorReportModal';
import { ErrorCategory, ErrorSeverity, AppError } from '../types/error';
import { createAppError } from '../utils/errorUtils';

const ErrorDisplayDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('workflow-error');
  const [showReportModal, setShowReportModal] = useState(false);

  // Sample error for demonstration
  const sampleError: AppError = createAppError(
    'WORKFLOW_EXECUTION_FAILED',
    'AI service timeout: Request timed out after 30 seconds',
    {
      workflowId: 'workflow-demo-123',
      executionId: 'exec-demo-456',
      component: 'WorkflowEngine'
    },
    'The AI service failed to respond within the timeout period. This may be due to high load or service maintenance.',
    undefined,
    'corr-demo-789'
  );

  const demoSections = [
    {
      id: 'workflow-error',
      title: 'Workflow Error Display',
      description: 'Comprehensive error display for failed workflow executions'
    },
    {
      id: 'recovery-guide',
      title: 'Error Recovery Guide',
      description: 'Step-by-step recovery instructions for different error types'
    },
    {
      id: 'error-categories',
      title: 'Error Categories',
      description: 'Different error categories and their recovery steps'
    }
  ];

  const errorCategories = [
    { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.HIGH },
    { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.MEDIUM },
    { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM },
    { category: ErrorCategory.AI_SERVICE, severity: ErrorSeverity.MEDIUM },
    { category: ErrorCategory.WORKFLOW, severity: ErrorSeverity.HIGH },
    { category: ErrorCategory.DATABASE, severity: ErrorSeverity.CRITICAL }
  ];

  const handleRetrySuccess = (newExecutionId: string) => {
    alert(`Workflow retried successfully! New execution ID: ${newExecutionId}`);
  };

  const handleContactSupport = () => {
    alert('Redirecting to support portal...');
  };

  const handleRetryAction = async () => {
    // Simulate retry action
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert('Retry completed successfully!');
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Error Display Demo</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive error handling and recovery interface demonstration
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {demoSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedDemo(section.id)}
                className={`pb-2 border-b-2 font-medium text-sm transition-colors ${
                  selectedDemo === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Demo Content */}
        <div className="space-y-8">
          {/* Workflow Error Display Demo */}
          {selectedDemo === 'workflow-error' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Workflow Error Display
                </h2>
                <p className="text-gray-600">
                  This component provides a comprehensive view of workflow execution failures,
                  including error categorization, detailed logs, retry functionality, and error reporting.
                </p>
              </div>

              {/* Features List */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Key Features:</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Automatic error categorization (AI Service, Network, Validation, etc.)</li>
                  <li>• Severity assessment (Low, Medium, High, Critical)</li>
                  <li>• Failure point identification from execution logs</li>
                  <li>• Retry functionality with input parameter modification</li>
                  <li>• Comprehensive error reporting with user feedback collection</li>
                  <li>• Expandable sections for detailed technical information</li>
                </ul>
              </div>

              {/* Demo Component */}
              <WorkflowErrorDisplay
                executionId="demo-execution-123"
                workflowId="demo-workflow-456"
                onRetrySuccess={handleRetrySuccess}
                className="mb-6"
              />

              {/* Usage Example */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Usage Example:</h3>
                <pre className="text-sm text-gray-700 overflow-x-auto">
{`<WorkflowErrorDisplay
  executionId="exec-123"
  workflowId="workflow-456"
  onRetrySuccess={(newExecutionId) => {
    // Handle successful retry
    console.log('Retried with ID:', newExecutionId);
  }}
  onClose={() => {
    // Handle close action
    setShowErrorDisplay(false);
  }}
/>`}
                </pre>
              </div>
            </div>
          )}

          {/* Error Recovery Guide Demo */}
          {selectedDemo === 'recovery-guide' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Error Recovery Guide
                </h2>
                <p className="text-gray-600">
                  Interactive step-by-step recovery instructions tailored to specific error categories and severities.
                </p>
              </div>

              {/* AI Service Error Example */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  AI Service Error Recovery
                </h3>
                <ErrorRecoveryGuide
                  category={ErrorCategory.AI_SERVICE}
                  severity={ErrorSeverity.MEDIUM}
                  errorMessage="AI service timeout: Request timed out after 30 seconds"
                  onRetry={handleRetryAction}
                  onContactSupport={handleContactSupport}
                />
              </div>

              {/* Network Error Example */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Network Error Recovery
                </h3>
                <ErrorRecoveryGuide
                  category={ErrorCategory.NETWORK}
                  severity={ErrorSeverity.MEDIUM}
                  errorMessage="Network connection failed"
                  onRetry={handleRetryAction}
                />
              </div>

              {/* Usage Example */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Usage Example:</h3>
                <pre className="text-sm text-gray-700 overflow-x-auto">
{`<ErrorRecoveryGuide
  category={ErrorCategory.AI_SERVICE}
  severity={ErrorSeverity.MEDIUM}
  errorMessage="AI service timeout"
  onRetry={async () => {
    // Implement retry logic
    await retryWorkflowExecution();
  }}
  onContactSupport={() => {
    // Open support portal
    window.open('/support');
  }}
/>`}
                </pre>
              </div>
            </div>
          )}

          {/* Error Categories Demo */}
          {selectedDemo === 'error-categories' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Error Categories & Recovery
                </h2>
                <p className="text-gray-600">
                  Different error categories provide tailored recovery steps based on the type and severity of the error.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {errorCategories.map(({ category, severity }) => (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900 capitalize">
                        {category.replace('_', ' ')} Error
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        Severity: {severity}
                      </p>
                    </div>
                    <div className="p-4">
                      <ErrorRecoveryGuide
                        category={category}
                        severity={severity}
                        errorMessage={`Sample ${category.replace('_', ' ')} error message`}
                        onRetry={category !== ErrorCategory.VALIDATION ? handleRetryAction : undefined}
                        onContactSupport={
                          severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL
                            ? handleContactSupport
                            : undefined
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Report Modal Demo Button */}
        <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Reporting
          </h3>
          <p className="text-gray-600 mb-4">
            Users can provide detailed feedback about errors to help improve the system.
          </p>
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Demo Error Report Modal
          </button>
        </div>

        {/* Error Report Modal */}
        <ErrorReportModal
          error={sampleError}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={async (reportData) => {
            console.log('Error report submitted:', reportData);
            alert('Error report submitted successfully!');
          }}
        />

        {/* Integration Guide */}
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-900 mb-2">
            Integration Guide
          </h3>
          <div className="text-yellow-800 text-sm space-y-2">
            <p>
              <strong>1. Error Context:</strong> Wrap your app with ErrorProvider to enable global error handling.
            </p>
            <p>
              <strong>2. Workflow Errors:</strong> Use WorkflowErrorDisplay for failed workflow executions.
            </p>
            <p>
              <strong>3. Recovery Guidance:</strong> Include ErrorRecoveryGuide for user-friendly error resolution.
            </p>
            <p>
              <strong>4. Error Reporting:</strong> Implement ErrorReportModal for collecting user feedback.
            </p>
            <p>
              <strong>5. Error Categorization:</strong> Errors are automatically categorized and assigned severity levels.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ErrorDisplayDemo;