import React, { useState } from "react";
import { AppError, ErrorReportData } from "../types/error";

interface ErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: AppError;
  onSubmit: (reportData: ErrorReportData) => Promise<void>;
}

const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  isOpen,
  onClose,
  error,
  onSubmit,
}) => {
  const [category, setCategory] = useState("general");
  const [feedback, setFeedback] = useState("");
  const [reproductionSteps, setReproductionSteps] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorState(null);

    const reportData: ErrorReportData = {
      error,
      userFeedback: feedback,
      reproductionSteps,
      expectedBehavior,
      actualBehavior,
    };

    try {
      await onSubmit(reportData);
      onClose();
    } catch (err) {
      setErrorState((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">
          Report Error: {error.message}
        </h2>

        {errorState && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
            {errorState}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Error Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              disabled={isLoading}
            >
              <option value="general">General Error</option>
              <option value="ui">UI Issue</option>
              <option value="workflow">Workflow Execution</option>
              <option value="api">API Error</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              User Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reproduction Steps
            </label>
            <textarea
              value={reproductionSteps}
              onChange={(e) => setReproductionSteps(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expected Behavior
              </label>
              <textarea
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Actual Behavior
              </label>
              <textarea
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ErrorReportModal;


