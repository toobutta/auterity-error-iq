import React, { useState } from 'react';
import { TableWidgetProps } from './types';
import { WidgetHeader } from './WidgetHeader';
import { WidgetError } from './WidgetError';
import { WidgetLoading } from './WidgetLoading';

export const TableWidget: React.FC<TableWidgetProps> = ({
  id,
  title,
  data,
  columns,
  pagination,
  onSort,
  onPageChange,
  isLoading,
  error,
  onRefresh,
  className
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const renderSortIcon = (column: { key: string; sortable?: boolean }) => {
    if (!column.sortable) return null;

    const isSorted = sortConfig?.key === column.key;
    const direction = sortConfig?.direction;

    return (
      <span className="ml-2">
        {isSorted && direction === 'asc' ? '↑' : isSorted && direction === 'desc' ? '↓' : '↕'}
      </span>
    );
  };

  const formatCellValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return value;
    }
  };

  if (error) {
    return <WidgetError message={error} onRetry={onRefresh} />;
  }

  return (
    <div className={`widget table-widget ${className || ''}`}>
      <WidgetHeader
        title={title}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />
      <div className="widget-content">
        {isLoading ? (
          <WidgetLoading />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.sortable ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => column.sortable && handleSort(column.key)}
                        style={{ width: column.width }}
                      >
                        {column.title}
                        {renderSortIcon(column)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((column) => (
                        <td
                          key={`${rowIndex}-${column.key}`}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {formatCellValue(row[column.key], column.type)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && (
              <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => onPageChange?.(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => onPageChange?.(pagination.current + 1)}
                    disabled={pagination.current * pagination.pageSize >= pagination.total}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {((pagination.current - 1) * pagination.pageSize) + 1}
                      </span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.current * pagination.pageSize, pagination.total)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{pagination.total}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => onPageChange?.(pagination.current - 1)}
                        disabled={pagination.current === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => onPageChange?.(pagination.current + 1)}
                        disabled={pagination.current * pagination.pageSize >= pagination.total}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
