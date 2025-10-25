import React, { useCallback, useEffect, useState } from "react";
import Layout from "../components/Layout";
import { QueryEditor, QueryFilter, QuerySort } from "../components/query-builder/QueryEditor";
import { QueryPreview, QueryResult } from "../components/query-builder/QueryPreview";
import { ColumnInfo, TableInfo, TableSelector } from "../components/query-builder/TableSelector";

interface DatabaseTable extends TableInfo {}
interface DatabaseColumn extends ColumnInfo {}

interface QueryConfig {
  table: string;
  columns: string[];
  filters: QueryFilter[];
  sortBy: QuerySort[];
  limit?: number;
  offset?: number;
}

const NoCodeQueryBuilderPage: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [queryConfig, setQueryConfig] = useState<QueryConfig>({
    table: '',
    columns: [],
    filters: [],
    sortBy: []
  });
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Mock data for demonstration - in real app, this would come from API
  useEffect(() => {
    // Tables are loaded internally by TableSelector component
  }, []);

  const handleTableSelect = useCallback((table: TableInfo) => {
    setSelectedTable(table);
    setQueryConfig(prev => ({
      ...prev,
      table: table.name,
      columns: table.columns.map(col => col.name),
      filters: [],
      sortBy: []
    }));
    setQueryResults([]);
    setError(null);
  }, []);

  const handleColumnsChange = useCallback((columns: ColumnInfo[]) => {
    setQueryConfig(prev => ({
      ...prev,
      columns: columns.map(col => col.name)
    }));
  }, []);

  const handleFiltersChange = useCallback((filters: QueryFilter[]) => {
    setQueryConfig(prev => ({
      ...prev,
      filters
    }));
  }, []);

  const handleSortChange = useCallback((sortBy: QuerySort[]) => {
    setQueryConfig(prev => ({
      ...prev,
      sortBy
    }));
  }, []);

  const generateMockResults = (table: DatabaseTable, config: QueryConfig): any[] => {
    const resultCount = Math.min(config.limit || 100, table.rowCount || 1000);
    const results = [];

    for (let i = 0; i < resultCount; i++) {
      const row: any = {};

      config.columns.forEach(columnName => {
        const column = table.columns.find(col => col.name === columnName);
        if (column) {
          row[columnName] = generateMockValue(column, i);
        }
      });

      results.push(row);
    }

    return results;
  };

  const generateMockValue = (column: DatabaseColumn, index: number): any => {
    switch (column.type.toLowerCase()) {
      case 'integer':
        return Math.floor(Math.random() * 1000) + index;
      case 'varchar':
        if (column.name.includes('email')) {
          return `user${index}@example.com`;
        }
        if (column.name.includes('status')) {
          return ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)];
        }
        if (column.name.includes('name')) {
          return `Sample ${column.name} ${index}`;
        }
        return `Value ${index}`;
      case 'text':
        return `This is a longer text description for item ${index}. It contains more detailed information about the record.`;
      case 'decimal':
        return (Math.random() * 1000).toFixed(2);
      case 'timestamp':
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 365));
        return date.toISOString();
      default:
        return `Mock ${column.type} value ${index}`;
    }
  };

  const handleExecuteQuery = useCallback(async () => {
    if (!selectedTable) return;

    try {
      setIsExecuting(true);
      setError(null);

      // Mock query execution - in real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

      // Generate mock results based on selected table and configuration
      const mockResults = generateMockResults(selectedTable, queryConfig);
      setQueryResults(mockResults);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to execute query";
      setError(errorMessage);

    } finally {
      setIsExecuting(false);
    }
  }, [selectedTable, queryConfig]);

  const handlePreviewExecute = useCallback(async (): Promise<QueryResult> => {
    if (!selectedTable) {
      throw new Error("No table selected");
    }

    // Generate mock results
    const mockResults = generateMockResults(selectedTable, queryConfig);

    return {
      columns: queryConfig.columns,
      rows: mockResults.map(row => queryConfig.columns.map(col => row[col])),
      rowCount: mockResults.length,
      executionTime: 1500, // Mock execution time
      error: undefined
    };
  }, [selectedTable, queryConfig]);

  const handleQueryChange = useCallback((query: string) => {
    // Update query string when QueryEditor generates it

  }, []);

  const handleAggregationChange = useCallback((aggregations: any[]) => {
    // Handle aggregation changes

  }, []);

  const handleExportResults = useCallback(() => {
    if (queryResults.length === 0) return;

    const csvContent = [
      queryConfig.columns.join(','),
      ...queryResults.map(row =>
        queryConfig.columns.map(col => JSON.stringify(row[col] || '')).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable?.name || 'query'}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [queryResults, queryConfig.columns, selectedTable]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    No-Code Database Query Builder
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Build database queries visually without writing SQL
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {queryResults.length > 0 && (
                    <button
                      onClick={handleExportResults}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </button>
                  )}
                  <button
                    onClick={handleExecuteQuery}
                    disabled={!selectedTable || isExecuting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExecuting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Executing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Execute Query
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Query Execution Failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Table Selector */}
            <div className="lg:col-span-1">
              <TableSelector
                selectedTable={selectedTable || undefined}
                onTableSelect={handleTableSelect}
                onColumnSelect={handleColumnsChange}
              />
            </div>

            {/* Query Editor */}
            <div className="lg:col-span-1">
              {selectedTable ? (
                <QueryEditor
                  selectedTable={selectedTable?.name}
                  selectedColumns={queryConfig.columns}
                  onQueryChange={handleQueryChange}
                  onFiltersChange={handleFiltersChange}
                  onSortChange={handleSortChange}
                  onAggregationChange={handleAggregationChange}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Select a table</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a table from the sidebar to start building your query.
                  </p>
                </div>
              )}
            </div>

            {/* Query Preview */}
            <div className="lg:col-span-1">
              <QueryPreview
                query={`SELECT ${queryConfig.columns.join(', ')} FROM ${queryConfig.table}`}
                onExecute={handlePreviewExecute}
                isExecuting={isExecuting}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NoCodeQueryBuilderPage;


