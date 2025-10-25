import React, { useState, useCallback } from 'react';
import { QueryBuilderCanvas } from './QueryBuilderCanvas';
import { QueryResultsDisplay } from './QueryResultsDisplay';

interface DatabaseQueryBuilderProps {
  connectionId?: string;
  className?: string;
}

export const DatabaseQueryBuilder: React.FC<DatabaseQueryBuilderProps> = ({
  connectionId,
  className = ''
}) => {
  const [generatedQuery, setGeneratedQuery] = useState<any>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string>('');

  // Handle query generation
  const handleQueryGenerated = useCallback((query: any) => {
    setGeneratedQuery(query);
    setQueryResult(null);
    setExecutionError('');
  }, []);

  // Handle query execution
  const handleQueryExecuted = useCallback(async (result: any) => {
    setQueryResult(result);
    setExecutionError('');
  }, []);

  // Handle query execution error
  const handleQueryError = useCallback((error: string) => {
    setExecutionError(error);
    setQueryResult(null);
  }, []);

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'json' | 'sql') => {
    if (!queryResult) return;

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'csv':
        // Convert result to CSV
        const headers = queryResult.columns.join(',');
        const rows = queryResult.rows.map((row: any[]) =>
          row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        content = `${headers}\n${rows}`;
        filename = 'query_results.csv';
        mimeType = 'text/csv';
        break;

      case 'json':
        content = JSON.stringify({
          columns: queryResult.columns,
          rows: queryResult.rows,
          metadata: {
            rowCount: queryResult.rowCount,
            executionTime: queryResult.executionTime
          }
        }, null, 2);
        filename = 'query_results.json';
        mimeType = 'application/json';
        break;

      case 'sql':
        content = generatedQuery?.sql || '-- Generated SQL Query';
        filename = 'query.sql';
        mimeType = 'text/plain';
        break;
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [queryResult, generatedQuery]);

  // Handle load more results
  const handleLoadMore = useCallback(() => {
    // This would trigger loading more results from the database

  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Database Query Builder</h2>
          <p className="text-sm text-gray-600 mt-1">
            Build queries visually with drag-and-drop interface
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Connected</span>
          </div>

          {/* Help */}
          <button className="text-gray-400 hover:text-gray-600">
            <span className="text-lg">❓</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Query Builder Canvas */}
        <div className="flex-1 min-h-0">
          <QueryBuilderCanvas
            connectionId={connectionId}
            onQueryGenerated={handleQueryGenerated}
            onQueryExecuted={handleQueryExecuted}
          />
        </div>

        {/* Query Results */}
        {(generatedQuery || queryResult || executionError) && (
          <div className="flex-1 min-h-0 border-t border-gray-200">
            <QueryResultsDisplay
              result={queryResult}
              isLoading={isExecuting}
              error={executionError}
              onLoadMore={handleLoadMore}
              onExport={handleExport}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>💡 Tip: Drag tables from the sidebar to start building your query</span>
          </div>

          <div className="flex items-center space-x-4">
            {generatedQuery && (
              <div className="flex items-center space-x-2">
                <span>Query generated</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            )}

            {queryResult && (
              <div className="flex items-center space-x-2">
                <span>{queryResult.rowCount} rows returned</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


