import React, { useState } from 'react';
import { AppError, ErrorReportData } from '../types/error';
import { useError } from '../contexts/ErrorContext';

interface ErrorReportModalProps {
  error: AppError;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (reportData: ErrorReportData) => Promise<void>;
}

interface FormData {
  userFeedback: string;
  reproductionSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: 'first-time' | 'occasional' | 'frequent' | 'always';
  impact: 'minor' | 'moderate' | 'major' | 'blocking';
  browserInfo: string;
  additionalContext: string;
}

const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  error,
  isOpen,
  onClose,
  onSubmit
}) => {
  const { reportError } = useError();
  const [formData, setFormData] = useState<FormData>({
    userFeedback: '',
    reproductionSteps: '',
    expectedBehavior: '',
    actualBehavior: '',
    severity: error.severity as FormData['severity'],
    frequency: 'first-time',
    impact: 'moderate',
    browserInfo: `${navigator.userAgent}`,
    additionalContext: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const reportData: ErrorReportData = {
        error,
        userFeedback: formData.userFeedback,
        reproductionSteps: formData.reproductionSteps,
        expectedBehavior: formData.expectedBehavior,
        actualBehavior: formData.actualBehavior
      };

      if (onSubmit) {
        await onSubmit(reportData);
      } else {
        await reportError(reportData);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
        setCurrentStep(1);
        setFormData({
          userFeedback: '',
          reproductionSteps: '',
          expectedBehavior: '',
          actualBehavior: '',
          severity: error.severity as FormData['severity'],
          frequency: 'first-time',
          impact: 'moderate',
          browserInfo: `${navigator.userAgent}`,
          additionalContext: ''
        });
      }, 2000);
    } catch (submitError) {
      console.error('Failed to submit error report:', submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.userFeedback.trim().length > 0;
      case 2:
        return formData.reproductionSteps.trim().length > 0;
      case 3:
        return formData.expectedBehavior.trim().length > 0 && formData.actualBehavior.trim().length > 0;
      default:
        return false;
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Describe the Issue';
      case 2: return 'Reproduction Steps';
      case 3: return 'Expected vs Actual Behavior';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Report Error</h2>
              <p className="text-sm text-gray-600 mt-1">
                Help us improve by providing details about this error
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{getStepTitle(currentStep)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Report Submitted Successfully</h3>
              <p className="text-gray-600">
                Thank you for your feedback. Our team will review this error report and work on a fix.
              </p>
            </div>
          ) : (
            <>
              {/* Error Summary */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800">Error Details</h4>
                    <p className="text-red-700 text-sm mt-1">{error.userFriendlyMessage}</p>
                    <div className="mt-2 text-xs text-red-600">
                      <span className="font-medium">ID:</span> {error.correlationId || error.id}
                      <span className="ml-4 font-medium">Category:</span> {error.category.replace('_', ' ')}
                      <span className="ml-4 font-medium">Severity:</span> {error.severity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 1: Describe the Issue */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What were you trying to do when this error occurred? *
                    </label>
                    <textarea
                      value={formData.userFeedback}
                      onChange={(e) => handleInputChange('userFeedback', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="I was trying to create a new workflow when..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How often does this happen?
                      </label>
                      <select
                        value={formData.frequency}
                        onChange={(e) => handleInputChange('frequency', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="first-time">First time</option>
                        <option value="occasional">Occasionally</option>
                        <option value="frequent">Frequently</option>
                        <option value="always">Every time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Impact on your work
                      </label>
                      <select
                        value={formData.impact}
                        onChange={(e) => handleInputChange('impact', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="minor">Minor inconvenience</option>
                        <option value="moderate">Moderate disruption</option>
                        <option value="major">Major problem</option>
                        <option value="blocking">Completely blocking</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Error severity
                      </label>
                      <select
                        value={formData.severity}
                        onChange={(e) => handleInputChange('severity', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Reproduction Steps */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How can we reproduce this error? *
                    </label>
                    <textarea
                      value={formData.reproductionSteps}
                      onChange={(e) => handleInputChange('reproductionSteps', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={6}
                      placeholder="1. Go to the workflow builder&#10;2. Click on 'Add Step'&#10;3. Select 'AI Process'&#10;4. The error appears when..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Please provide step-by-step instructions that would help us reproduce the error
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional context (optional)
                    </label>
                    <textarea
                      value={formData.additionalContext}
                      onChange={(e) => handleInputChange('additionalContext', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Any additional information that might be helpful..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Expected vs Actual Behavior */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What did you expect to happen? *
                    </label>
                    <textarea
                      value={formData.expectedBehavior}
                      onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="I expected the workflow to save successfully and show a confirmation message..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What actually happened? *
                    </label>
                    <textarea
                      value={formData.actualBehavior}
                      onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Instead, an error message appeared and the workflow was not saved..."
                      required
                    />
                  </div>

                  {/* Browser Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Browser Information
                    </label>
                    <textarea
                      value={formData.browserInfo}
                      onChange={(e) => handleInputChange('browserInfo', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 text-xs font-mono bg-gray-50"
                      rows={2}
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This information helps us debug browser-specific issues
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!submitSuccess && (
          <div className="border-t border-gray-200 p-6">
            <div className="flex justify-between">
              <div>
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                {currentStep < totalSteps ? (
                  <button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={!canProceedToNextStep()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!canProceedToNextStep() || isSubmitting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isSubmitting && (
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorReportModal;