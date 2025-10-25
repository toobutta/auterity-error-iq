import React, { useState } from 'react';

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  error?: string;
}

interface QueryPreviewProps {
  query: string;
  onExecute: () => Promise<QueryResult>;
  isExecuting?: boolean;
  maxRows?: number;
}

export const QueryPreview: React.FC<QueryPreviewProps> = ({
  query,
  onExecute,
  isExecuting = false,
  maxRows = 100
}) => {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [showFullResult, setShowFullResult] = useState(false);

  const handleExecute = async () => {
    try {
      const queryResult = await onExecute();
      setResult(queryResult);
    } catch (error) {
      setResult({
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Query execution failed'
      });
    }
  };

  const displayedRows = showFullResult ? result?.rows : result?.rows?.slice(0, maxRows);
  const hasMoreRows = (result?.rows?.length || 0) > maxRows;

  return (
    <div className="query-preview bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Query Preview</h3>

      {/* Query Display */}
      <div className="mb-4">
        <h4 className="text-md font-medium mb-2">Generated Query</h4>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
            {query || 'No query generated yet'}
          </pre>
        </div>
      </div>

      {/* Execute Button */}
      <div className="mb-4">
        <button
          onClick={handleExecute}
          disabled={isExecuting || !query.trim()}
          className={`px-4 py-2 rounded-md font-medium ${
            isExecuting
              ? 'bg-gray-400 cursor-not-allowed'
              : !query.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isExecuting ? 'Executing...' : 'Execute Query'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-md font-medium">Query Results</h4>
            <div className="text-sm text-gray-600">
              {result.executionTime}ms • {result.rowCount} rows
            </div>
          </div>

          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{result.error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {result.columns.map((column, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedRows?.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {cell === null ? (
                              <span className="text-gray-400 italic">NULL</span>
                            ) : typeof cell === 'object' ? (
                              <span className="text-gray-600">[Object]</span>
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Show More/Less Button */}
              {hasMoreRows && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowFullResult(!showFullResult)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showFullResult ? 'Show Less' : `Show ${result.rows.length - maxRows} More Rows`}
                  </button>
                </div>
              )}

              {/* No Results */}
              {result.rows.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


