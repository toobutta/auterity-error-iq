import React, { useState, useEffect } from "react";
import { AppError } from "../types/error";
import apiClient from "../api/client";

interface InputData {
  [key: string]: string | number | boolean | null;
}

interface RetryWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  executionId: string;
  error: AppError;
  onRetry: (modifiedInputs: InputData) => Promise<void>;
}

const RetryWorkflowModal: React.FC<RetryWorkflowModalProps> = ({
  isOpen,
  onClose,
  workflowId,
  executionId,
  error,
  onRetry,
}) => {
  const [inputs, setInputs] = useState<InputData>({});
  const [retryHistory, setRetryHistory] = useState<
    { timestamp: string; status: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch original inputs and retry history
      apiClient
        .get(`/workflows/${workflowId}/executions/${executionId}/inputs`)
        .then((response) => setInputs(response.data))
        .catch((err: Error) => setErrorState(err.message));

      apiClient
        .get(`/workflows/${workflowId}/executions/${executionId}/retry-history`)
        .then((response) => setRetryHistory(response.data))
        .catch((err: Error) => setErrorState(err.message));
    }
  }, [isOpen, workflowId, executionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorState(null);

    try {
      await onRetry(inputs);
      onClose();
    } catch (err) {
      setErrorState((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    setInputs({
      ...inputs,
      [e.target.name]: value,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold">
            Retry Workflow: {workflowId}
          </h2>

          {errorState && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
              {errorState}
            </div>
          )}

          <div className="mb-6">
            <h3 className="mb-2 font-semibold">Error Details</h3>
            <pre className="mb-4 max-h-40 overflow-auto rounded-md bg-gray-100 p-3 text-sm">
              {JSON.stringify(error, null, 2)}
            </pre>

            <h3 className="mb-2 font-semibold">Retry History</h3>
            <div className="mb-4 max-h-40 overflow-auto rounded-md bg-gray-100 p-3 text-sm">
              {retryHistory.length > 0 ? (
                retryHistory.map((entry, index) => (
                  <div key={index} className="mb-2">
                    <span className="font-mono text-xs">{entry.timestamp}</span>
                    <span className="ml-2 font-semibold">{entry.status}</span>
                  </div>
                ))
              ) : (
                <p>No retry attempts recorded yet</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold">Modify Inputs</h3>

            {Object.entries(inputs).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <label
                  htmlFor={key}
                  className="block text-sm font-medium text-gray-700"
                >
                  {key}
                </label>
                <input
                  id={key}
                  name={key}
                  type="text"
                  value={value === null ? "" : String(value)}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring focus:ring-blue-200"
                  disabled={isLoading}
                />
              </div>
            ))}

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
                {isLoading ? "Retrying..." : "Retry Workflow"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RetryWorkflowModal;


