/**
 * WORKFLOW STUDIO QUERY BUILDER
 * 
 * Integrates Auterity's existing NoCodeQueryBuilderPage with workflow-specific enhancements
 * for seamless data integration within workflow nodes.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from '../../../auterity-error-iq/frontend/src/contexts/AuthContext';
import { useNotifications } from '../../../auterity-error-iq/frontend/src/components/notifications/NotificationSystem';

// Enhanced interfaces for workflow integration
interface WorkflowQueryConfig {
  id: string;
  name: string;
  table: string;
  columns: string[];
  filters: QueryFilter[];
  sortBy: QuerySort[];
  limit?: number;
  offset?: number;
  workflowNodeId?: string;
  outputMapping?: Record<string, string>;
}

interface QueryFilter {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  dataType: string;
}

interface QuerySort {
  column: string;
  direction: 'asc' | 'desc';
}

interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  rowCount?: number;
  description?: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  description?: string;
}

interface WorkflowQueryBuilderProps {
  workflowId?: string;
  nodeId?: string;
  onQuerySave?: (query: WorkflowQueryConfig) => void;
  onQueryExecute?: (query: WorkflowQueryConfig, results: any[]) => void;
  initialQuery?: WorkflowQueryConfig;
  className?: string;
}

export const WorkflowQueryBuilder: React.FC<WorkflowQueryBuilderProps> = ({
  workflowId,
  nodeId,
  onQuerySave,
  onQueryExecute,
  initialQuery,
  className = ''
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // State management
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [queryConfig, setQueryConfig] = useState<WorkflowQueryConfig>(
    initialQuery || {
      id: `query_${Date.now()}`,
      name: 'New Query',
      table: '',
      columns: [],
      filters: [],
      sortBy: []
    }
  );
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<TableInfo[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    loadAvailableTables();
  }, []);

  const loadAvailableTables = async () => {
    // Mock table data - in real implementation, this would come from API
    const mockTables: TableInfo[] = [
      {
        name: 'customers',
        schema: 'public',
        columns: [
          { name: 'id', type: 'integer', nullable: false, primaryKey: true },
          { name: 'name', type: 'varchar', nullable: false },
          { name: 'email', type: 'varchar', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false },
          { name: 'status', type: 'varchar', nullable: true }
        ],
        rowCount: 1250,
        description: 'Customer information and contact details'
      },
      {
        name: 'orders',
        schema: 'public',
        columns: [
          { name: 'id', type: 'integer', nullable: false, primaryKey: true },
          { name: 'customer_id', type: 'integer', nullable: false },
          { name: 'total_amount', type: 'decimal', nullable: false },
          { name: 'status', type: 'varchar', nullable: false },
          { name: 'created_at', type: 'timestamp', nullable: false }
        ],
        rowCount: 5680,
        description: 'Customer order information and status'
      },
      {
        name: 'products',
        schema: 'public',
        columns: [
          { name: 'id', type: 'integer', nullable: false, primaryKey: true },
          { name: 'name', type: 'varchar', nullable: false },
          { name: 'price', type: 'decimal', nullable: false },
          { name: 'category', type: 'varchar', nullable: true },
          { name: 'in_stock', type: 'boolean', nullable: false }
        ],
        rowCount: 890,
        description: 'Product catalog and inventory'
      }
    ];
    setAvailableTables(mockTables);
  };

  // Generate SQL from query config
  const generateSQL = useMemo(() => {
    if (!queryConfig.table || queryConfig.columns.length === 0) return '';

    let sql = `SELECT ${queryConfig.columns.join(', ')} FROM ${queryConfig.table}`;

    // Add WHERE clauses
    if (queryConfig.filters.length > 0) {
      const whereClause = queryConfig.filters.map(filter => {
        switch (filter.operator) {
          case 'equals':
            return `${filter.column} = '${filter.value}'`;
          case 'contains':
            return `${filter.column} LIKE '%${filter.value}%'`;
          case 'greater_than':
            return `${filter.column} > ${filter.value}`;
          case 'less_than':
            return `${filter.column} < ${filter.value}`;
          default:
            return `${filter.column} = '${filter.value}'`;
        }
      }).join(' AND ');
      sql += ` WHERE ${whereClause}`;
    }

    // Add ORDER BY
    if (queryConfig.sortBy.length > 0) {
      const orderClause = queryConfig.sortBy.map(sort => 
        `${sort.column} ${sort.direction.toUpperCase()}`
      ).join(', ');
      sql += ` ORDER BY ${orderClause}`;
    }

    // Add LIMIT
    if (queryConfig.limit) {
      sql += ` LIMIT ${queryConfig.limit}`;
    }

    return sql;
  }, [queryConfig]);

  // Handle table selection
  const handleTableSelect = useCallback((table: TableInfo) => {
    setSelectedTable(table);
    setQueryConfig(prev => ({
      ...prev,
      table: table.name,
      columns: table.columns.slice(0, 5).map(col => col.name), // Select first 5 columns by default
      filters: [],
      sortBy: []
    }));
    setQueryResults([]);
    setError(null);
  }, []);

  // Handle column selection
  const handleColumnToggle = useCallback((columnName: string) => {
    setQueryConfig(prev => ({
      ...prev,
      columns: prev.columns.includes(columnName)
        ? prev.columns.filter(col => col !== columnName)
        : [...prev.columns, columnName]
    }));
  }, []);

  // Handle filter changes
  const handleAddFilter = useCallback(() => {
    if (!selectedTable) return;
    
    const firstColumn = selectedTable.columns[0];
    const newFilter: QueryFilter = {
      column: firstColumn.name,
      operator: 'equals',
      value: '',
      dataType: firstColumn.type
    };
    
    setQueryConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  }, [selectedTable]);

  const handleUpdateFilter = useCallback((index: number, field: keyof QueryFilter, value: any) => {
    setQueryConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, [field]: value } : filter
      )
    }));
  }, []);

  const handleRemoveFilter = useCallback((index: number) => {
    setQueryConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  }, []);

  // Generate mock results
  const generateMockResults = useCallback((table: TableInfo, config: WorkflowQueryConfig): any[] => {
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
  }, []);

  const generateMockValue = (column: ColumnInfo, index: number): any => {
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
      case 'decimal':
        return (Math.random() * 1000).toFixed(2);
      case 'timestamp':
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 365));
        return date.toISOString();
      case 'boolean':
        return Math.random() > 0.5;
      default:
        return `Mock ${column.type} value ${index}`;
    }
  };

  // Execute query
  const handleExecuteQuery = useCallback(async () => {
    if (!selectedTable) return;

    try {
      setIsExecuting(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResults = generateMockResults(selectedTable, queryConfig);
      setQueryResults(mockResults);

      addNotification({
        type: 'success',
        title: 'Query Executed',
        message: `Retrieved ${mockResults.length} rows successfully`
      });

      // Callback for workflow integration
      if (onQueryExecute) {
        onQueryExecute(queryConfig, mockResults);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to execute query";
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Query Failed',
        message: errorMessage
      });
    } finally {
      setIsExecuting(false);
    }
  }, [selectedTable, queryConfig, generateMockResults, addNotification, onQueryExecute]);

  // Save query configuration
  const handleSaveQuery = useCallback(() => {
    if (onQuerySave) {
      onQuerySave(queryConfig);
    }
    addNotification({
      type: 'success',
      title: 'Query Saved',
      message: `Query "${queryConfig.name}" saved successfully`
    });
  }, [queryConfig, onQuerySave, addNotification]);

  return (
    <div className={`workflow-query-builder ${className}`}>
      {/* Header */}
      <div className="query-builder-header">
        <div className="header-content">
          <h2 className="title">Workflow Query Builder</h2>
          <p className="subtitle">Build database queries for your workflow nodes</p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleSaveQuery}
            className="btn btn-secondary"
            disabled={!selectedTable}
          >
            💾 Save Query
          </button>
          <button
            onClick={handleExecuteQuery}
            disabled={!selectedTable || isExecuting}
            className="btn btn-primary"
          >
            {isExecuting ? (
              <>
                <div className="spinner" />
                Executing...
              </>
            ) : (
              <>
                ▶️ Execute Query
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <div className="error-content">
            <h4>Query Execution Failed</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="query-builder-content">
        {/* Table Selector */}
        <div className="panel table-selector">
          <h3>📊 Select Table</h3>
          <div className="table-list">
            {availableTables.map(table => (
              <div
                key={table.name}
                className={`table-item ${selectedTable?.name === table.name ? 'selected' : ''}`}
                onClick={() => handleTableSelect(table)}
              >
                <div className="table-info">
                  <h4>{table.name}</h4>
                  <p>{table.description}</p>
                  <span className="row-count">{table.rowCount?.toLocaleString()} rows</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Query Configuration */}
        <div className="panel query-config">
          {selectedTable ? (
            <>
              <h3>⚙️ Configure Query</h3>
              
              {/* Column Selection */}
              <div className="config-section">
                <h4>Select Columns</h4>
                <div className="column-grid">
                  {selectedTable.columns.map(column => (
                    <label key={column.name} className="column-checkbox">
                      <input
                        type="checkbox"
                        checked={queryConfig.columns.includes(column.name)}
                        onChange={() => handleColumnToggle(column.name)}
                      />
                      <span className="column-info">
                        <strong>{column.name}</strong>
                        <small>{column.type}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="config-section">
                <div className="section-header">
                  <h4>Filters</h4>
                  <button onClick={handleAddFilter} className="btn btn-small">
                    ➕ Add Filter
                  </button>
                </div>
                {queryConfig.filters.map((filter, index) => (
                  <div key={index} className="filter-row">
                    <select
                      value={filter.column}
                      onChange={(e) => handleUpdateFilter(index, 'column', e.target.value)}
                    >
                      {selectedTable.columns.map(col => (
                        <option key={col.name} value={col.name}>{col.name}</option>
                      ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => handleUpdateFilter(index, 'operator', e.target.value)}
                    >
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="greater_than">Greater Than</option>
                      <option value="less_than">Less Than</option>
                    </select>
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => handleUpdateFilter(index, 'value', e.target.value)}
                      placeholder="Filter value"
                    />
                    <button
                      onClick={() => handleRemoveFilter(index)}
                      className="btn btn-danger btn-small"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>

              {/* Limit */}
              <div className="config-section">
                <h4>Limit Results</h4>
                <input
                  type="number"
                  value={queryConfig.limit || ''}
                  onChange={(e) => setQueryConfig(prev => ({
                    ...prev,
                    limit: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  placeholder="Max rows (optional)"
                  min="1"
                  max="10000"
                />
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>📋 Select a Table</h3>
              <p>Choose a table from the left to start building your query</p>
            </div>
          )}
        </div>

        {/* Query Preview & Results */}
        <div className="panel query-preview">
          <h3>🔍 Query Preview</h3>
          
          {/* Generated SQL */}
          <div className="sql-preview">
            <h4>Generated SQL</h4>
            <pre className="sql-code">{generateSQL || 'SELECT * FROM table_name'}</pre>
          </div>

          {/* Results */}
          {queryResults.length > 0 && (
            <div className="results-section">
              <h4>Results ({queryResults.length} rows)</h4>
              <div className="results-table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      {queryConfig.columns.map(column => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResults.slice(0, 10).map((row, index) => (
                      <tr key={index}>
                        {queryConfig.columns.map(column => (
                          <td key={column}>{String(row[column])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {queryResults.length > 10 && (
                  <p className="results-note">
                    Showing first 10 rows of {queryResults.length} total results
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowQueryBuilder;
