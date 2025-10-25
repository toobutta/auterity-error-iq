import React from 'react';

interface Conflict {
  id: string;
  operationA: {
    id: string;
    type: string;
    userId: string;
    timestamp: Date;
    description: string;
  };
  operationB: {
    id: string;
    type: string;
    userId: string;
    timestamp: Date;
    description: string;
  };
  conflictType: string;
  description: string;
}

interface ConflictResolutionModalProps {
  conflict: Conflict;
  onResolve: (resolution: 'accept' | 'reject' | 'merge') => void;
  onClose: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onResolve,
  onClose
}) => {
  const handleResolution = (resolution: 'accept' | 'reject' | 'merge') => {
    onResolve(resolution);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Collaboration Conflict Detected
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Two users made conflicting changes. Please choose how to resolve this conflict.
          </p>
        </div>

        {/* Conflict Details */}
        <div className="px-6 py-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Conflict Type</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {conflict.conflictType.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operation A */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">Change A</h4>
                <span className="text-xs text-gray-500">
                  {new Date(conflict.operationA.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {conflict.operationA.description}
              </p>
              <div className="text-xs text-gray-500">
                By: {conflict.operationA.userId}
              </div>
            </div>

            {/* Operation B */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">Change B</h4>
                <span className="text-xs text-gray-500">
                  {new Date(conflict.operationB.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {conflict.operationB.description}
              </p>
              <div className="text-xs text-gray-500">
                By: {conflict.operationB.userId}
              </div>
            </div>
          </div>

          {/* Conflict Description */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Conflict Details
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>{conflict.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Choose Resolution:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleResolution('accept')}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Accept Change A
            </button>
            <button
              onClick={() => handleResolution('reject')}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Accept Change B
            </button>
            <button
              onClick={() => handleResolution('merge')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Merge Changes
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <p><strong>Accept Change A:</strong> Keep the first change and discard the second</p>
            <p><strong>Accept Change B:</strong> Keep the second change and discard the first</p>
            <p><strong>Merge Changes:</strong> Attempt to combine both changes (may require manual review)</p>
          </div>
        </div>
      </div>
    </div>
  );
};


