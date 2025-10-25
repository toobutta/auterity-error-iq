import React, { useState, useMemo } from 'react';

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  hasMore: boolean;
}

interface QueryResultsDisplayProps {
  result: QueryResult | null;
  isLoading?: boolean;
  error?: string;
  onLoadMore?: () => void;
  onExport?: (format: 'csv' | 'json' | 'sql') => void;
}

export const QueryResultsDisplay: React.FC<QueryResultsDisplayProps> = ({
  result,
  isLoading = false,
  error,
  onLoadMore,
  onExport
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Format cell value for display
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (value instanceof Date) return value.toLocaleString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Get cell display type for styling
  const getCellType = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    return 'text';
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!result) return { rows: [], totalRows: 0, filteredRows: 0 };

    let rows = [...result.rows];

    // Apply search filter
    if (searchTerm) {
      rows = rows.filter(row =>
        row.some(cell =>
          formatCellValue(cell).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn !== null) {
      const columnIndex = result.columns.indexOf(sortColumn);
      if (columnIndex !== -1) {
        rows.sort((a, b) => {
          const aVal = a[columnIndex];
          const bVal = b[columnIndex];

          // Handle null values
          if (aVal === null && bVal === null) return 0;
          if (aVal === null) return sortDirection === 'asc' ? -1 : 1;
          if (bVal === null) return sortDirection === 'asc' ? 1 : -1;

          // Handle different data types
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
          }

          // String comparison
          const aStr = String(aVal).toLowerCase();
          const bStr = String(bVal).toLowerCase();

          if (sortDirection === 'asc') {
            return aStr.localeCompare(bStr);
          } else {
            return bStr.localeCompare(aStr);
          }
        });
      }
    }

    return {
      rows,
      totalRows: result.rowCount,
      filteredRows: rows.length
    };
  }, [result, searchTerm, sortColumn, sortDirection]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.rows.slice(startIndex, endIndex);
  }, [processedData.rows, currentPage, pageSize]);

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle export
  const handleExport = (format: 'csv' | 'json' | 'sql') => {
    if (onExport) {
      onExport(format);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Executing query...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-500 text-xl mr-3">⚠️</div>
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Query Execution Failed</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No results state
  if (!result || result.rows.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results</h3>
        <p className="text-gray-600">Your query returned no data. Try adjusting your filters or check your query logic.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(processedData.filteredRows / pageSize);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Query Results</h3>
            <p className="text-gray-600 mt-1">
              {processedData.filteredRows.toLocaleString()} of {result.rowCount.toLocaleString()} rows
              {searchTerm && ` (filtered from ${processedData.totalRows.toLocaleString()})`}
              • {result.executionTime}ms execution time
            </p>
          </div>

          {/* Export Options */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Export:</span>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              JSON
            </button>
            <button
              onClick={() => handleExport('sql')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              SQL
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {result.columns.map((column, index) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column}</span>
                    {sortColumn === column && (
                      <span className="text-gray-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, cellIndex) => {
                  const cellType = getCellType(cell);
                  return (
                    <td
                      key={cellIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        cellType === 'null' ? 'text-gray-400 italic' :
                        cellType === 'number' ? 'text-blue-600 font-mono' :
                        cellType === 'boolean' ? 'text-green-600 font-medium' :
                        'text-gray-900'
                      }`}
                      title={formatCellValue(cell)}
                    >
                      <div className="max-w-xs truncate">
                        {formatCellValue(cell)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.filteredRows)} of {processedData.filteredRows} results
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm border rounded ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Load More */}
      {result.hasMore && onLoadMore && (
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More Results
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-900">Total Rows</div>
            <div className="text-gray-600">{result.rowCount.toLocaleString()}</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Columns</div>
            <div className="text-gray-600">{result.columns.length}</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Execution Time</div>
            <div className="text-gray-600">{result.executionTime}ms</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Data Size</div>
            <div className="text-gray-600">
              ~{(result.rowCount * result.columns.length * 50 / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


