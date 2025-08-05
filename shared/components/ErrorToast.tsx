import React from "react";
import { AppError, ErrorRecoveryAction } from "../types/error";

interface ErrorToastProps {
  error: AppError;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  onDismiss: () => void;
  onRetry?: () => void;
  onReport?: () => void;
  recoveryActions?: ErrorRecoveryAction[];
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  position = "top-right",
  onDismiss,
  onRetry,
  onReport,
  recoveryActions = []
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 shadow-md max-w-md">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="text-red-500 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-red-800">{error.userFriendlyMessage}</h3>
            <p className="text-sm text-red-600 mt-1">{error.message}</p>
            {error.correlationId && (
              <p className="text-xs text-gray-500 mt-1">ID: {error.correlationId}</p>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {(onRetry || onReport || recoveryActions.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              Retry
            </button>
          )}
          
          {recoveryActions.map((action, index) => (
            <button
              key={index}
              onClick={() => action.action()}
              className={`px-3 py-1 text-sm ${
                action.primary
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              } rounded`}
            >
              {action.label}
            </button>
          ))}
          
          {onReport && (
            <button
              onClick={onReport}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              Report
            </button>
          )}
        </div>
      )}
    </div>
  );
};

