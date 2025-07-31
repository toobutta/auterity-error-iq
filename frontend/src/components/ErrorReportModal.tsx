import React, { useState } from 'react';
import { AppError, ErrorReportData } from '../types/error';

interface ErrorReportModalProps {
  error: AppError;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportData: ErrorReportData) => Promise<void>;
}

export const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  error,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [userFeedback, setUserFeedback] = useState('');
  const [reproductionSteps, setReproductionSteps] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeDetails, setIncludeDetails] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reportData: ErrorReportData = {
        error,
        userFeedback: userFeedback.trim() || undefined,
        reproductionSteps: reproductionSteps.trim() || undefined,
        expectedBehavior: expectedBehavior.trim() || undefined,
        actualBehavior: actualBehavior.trim() || undefined,
      };

      await onSubmit(reportData);
      onClose();
      
      // Reset form
      setUserFeedback('');
      setReproductionSteps('');
      setExpectedBehavior('');
      setActualBehavior('');
    } catch (submitError) {
      console.error('Failed to submit error report:', submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Report Error
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Summary */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">
                  {error.code}
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {error.userFriendlyMessage}
                </p>
                {error.correlationId && (
                  <p className="text-xs text-red-600 mt-1">
                    ID: {error.correlationId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Report Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Feedback */}
            <div>
              <label htmlFor="userFeedback" className="block text-sm font-medium text-gray-700 mb-1">
                What were you trying to do when this error occurred?
              </label>
              <textarea
                id="userFeedback"
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what you were doing..."
              />
            </div>

            {/* Reproduction Steps */}
            <div>
              <label htmlFor="reproductionSteps" className="block text-sm font-medium text-gray-700 mb-1">
                Steps to reproduce (optional)
              </label>
              <textarea
                id="reproductionSteps"
                value={reproductionSteps}
                onChange={(e) => setReproductionSteps(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. Error appears..."
              />
            </div>

            {/* Expected vs Actual Behavior */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-700 mb-1">
                  What did you expect to happen?
                </label>
                <textarea
                  id="expectedBehavior"
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Expected behavior..."
                />
              </div>
              <div>
                <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-700 mb-1">
                  What actually happened?
                </label>
                <textarea
                  id="actualBehavior"
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Actual behavior..."
                />
              </div>
            </div>

            {/* Include Technical Details */}
            <div className="flex items-center">
              <input
                id="includeDetails"
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="includeDetails" className="ml-2 block text-sm text-gray-700">
                Include technical details (error code, correlation ID, browser info)
              </label>
            </div>

            {/* Technical Details Preview */}
            {includeDetails && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <h5 className="text-xs font-medium text-gray-700 mb-2">Technical Details:</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Error Code:</strong> {error.code}</div>
                  <div><strong>Category:</strong> {error.category}</div>
                  <div><strong>Severity:</strong> {error.severity}</div>
                  {error.correlationId && (
                    <div><strong>Correlation ID:</strong> {error.correlationId}</div>
                  )}
                  <div><strong>Timestamp:</strong> {error.context.timestamp.toISOString()}</div>
                  <div><strong>URL:</strong> {error.context.url}</div>
                  <div><strong>User Agent:</strong> {error.context.userAgent?.substring(0, 50)}...</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};