import React, { useCallback, useState } from 'react';

export interface QueryFilter {
  column: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with';
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

export interface QuerySort {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryAggregation {
  function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  column: string;
  alias?: string;
}

interface QueryEditorProps {
  selectedTable?: string;
  selectedColumns?: string[];
  onQueryChange: (query: string) => void;
  onFiltersChange: (filters: QueryFilter[]) => void;
  onSortChange: (sort: QuerySort[]) => void;
  onAggregationChange: (aggregations: QueryAggregation[]) => void;
}

export const QueryEditor: React.FC<QueryEditorProps> = ({
  selectedTable,
  selectedColumns = [],
  onQueryChange,
  onFiltersChange,
  onSortChange,
  onAggregationChange
}) => {
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [sort, setSort] = useState<QuerySort[]>([]);
  const [aggregations, setAggregations] = useState<QueryAggregation[]>([]);
  const [limit, setLimit] = useState<number | undefined>(100);

  const generateQuery = useCallback(() => {
    if (!selectedTable || selectedColumns.length === 0) {
      onQueryChange('');
      return;
    }

    let query = `SELECT `;

    // Handle aggregations
    if (aggregations.length > 0) {
      const aggColumns = aggregations.map(agg => {
        const alias = agg.alias || `${agg.function.toLowerCase()}_${agg.column}`;
        return `${agg.function}(${agg.column}) AS ${alias}`;
      });
      query += aggColumns.join(', ');
    } else {
      query += selectedColumns.join(', ');
    }

    query += ` FROM ${selectedTable}`;

    // Add WHERE clause for filters
    if (filters.length > 0) {
      const whereConditions = filters.map((filter, index) => {
        let condition = '';

        switch (filter.operator) {
          case 'equals':
            condition = `${filter.column} = '${filter.value}'`;
            break;
          case 'not_equals':
            condition = `${filter.column} != '${filter.value}'`;
            break;
          case 'greater_than':
            condition = `${filter.column} > '${filter.value}'`;
            break;
          case 'less_than':
            condition = `${filter.column} < '${filter.value}'`;
            break;
          case 'contains':
            condition = `${filter.column} LIKE '%${filter.value}%'`;
            break;
          case 'starts_with':
            condition = `${filter.column} LIKE '${filter.value}%'`;
            break;
          case 'ends_with':
            condition = `${filter.column} LIKE '%${filter.value}'`;
            break;
        }

        if (index > 0 && filter.logicalOperator) {
          return ` ${filter.logicalOperator} ${condition}`;
        }

        return condition;
      });

      query += ` WHERE ${whereConditions.join('')}`;
    }

    // Add GROUP BY for aggregations
    if (aggregations.length > 0 && selectedColumns.length > 0) {
      const groupColumns = selectedColumns.filter(col =>
        !aggregations.some(agg => agg.column === col)
      );
      if (groupColumns.length > 0) {
        query += ` GROUP BY ${groupColumns.join(', ')}`;
      }
    }

    // Add ORDER BY
    if (sort.length > 0) {
      const orderBy = sort.map(s => `${s.column} ${s.direction}`).join(', ');
      query += ` ORDER BY ${orderBy}`;
    }

    // Add LIMIT
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    onQueryChange(query);
  }, [selectedTable, selectedColumns, filters, sort, aggregations, limit, onQueryChange]);

  React.useEffect(() => {
    generateQuery();
  }, [generateQuery]);

  const addFilter = () => {
    const newFilter: QueryFilter = {
      column: selectedColumns[0] || '',
      operator: 'equals',
      value: '',
      logicalOperator: filters.length > 0 ? 'AND' : undefined
    };
    const newFilters = [...filters, newFilter];
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const updateFilter = (index: number, updates: Partial<QueryFilter>) => {
    const newFilters = filters.map((filter, i) =>
      i === index ? { ...filter, ...updates } : filter
    );
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const addSort = () => {
    const newSort: QuerySort = {
      column: selectedColumns[0] || '',
      direction: 'ASC'
    };
    const newSortList = [...sort, newSort];
    setSort(newSortList);
    onSortChange(newSortList);
  };

  const updateSort = (index: number, updates: Partial<QuerySort>) => {
    const newSort = sort.map((s, i) =>
      i === index ? { ...s, ...updates } : s
    );
    setSort(newSort);
    onSortChange(newSort);
  };

  const removeSort = (index: number) => {
    const newSort = sort.filter((_, i) => i !== index);
    setSort(newSort);
    onSortChange(newSort);
  };

  const addAggregation = () => {
    const newAggregation: QueryAggregation = {
      function: 'COUNT',
      column: selectedColumns[0] || '',
      alias: ''
    };
    const newAggregations = [...aggregations, newAggregation];
    setAggregations(newAggregations);
    onAggregationChange(newAggregations);
  };

  const updateAggregation = (index: number, updates: Partial<QueryAggregation>) => {
    const newAggregations = aggregations.map((agg, i) =>
      i === index ? { ...agg, ...updates } : agg
    );
    setAggregations(newAggregations);
    onAggregationChange(newAggregations);
  };

  const removeAggregation = (index: number) => {
    const newAggregations = aggregations.filter((_, i) => i !== index);
    setAggregations(newAggregations);
    onAggregationChange(newAggregations);
  };

  return (
    <div className="query-editor bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Query Editor</h3>

      {!selectedTable && (
        <div className="text-center py-8 text-gray-500">
          Select a table to start building your query
        </div>
      )}

      {selectedTable && (
        <>
          {/* Filters Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-medium">Filters</h4>
              <button
                onClick={addFilter}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                + Add Filter
              </button>
            </div>

            {filters.map((filter, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                {index > 0 && (
                  <select
                    value={filter.logicalOperator}
                    onChange={(e) => updateFilter(index, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                )}

                <select
                  value={filter.column}
                  onChange={(e) => updateFilter(index, { column: e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {selectedColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(index, { operator: e.target.value as QueryFilter['operator'] })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                  <option value="contains">Contains</option>
                  <option value="starts_with">Starts With</option>
                  <option value="ends_with">Ends With</option>
                </select>

                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => updateFilter(index, { value: e.target.value })}
                  placeholder="Value"
                  className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                />

                <button
                  onClick={() => removeFilter(index)}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Sort Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-medium">Sort</h4>
              <button
                onClick={addSort}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                + Add Sort
              </button>
            </div>

            {sort.map((sortItem, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <select
                  value={sortItem.column}
                  onChange={(e) => updateSort(index, { column: e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {selectedColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>

                <select
                  value={sortItem.direction}
                  onChange={(e) => updateSort(index, { direction: e.target.value as 'ASC' | 'DESC' })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="ASC">Ascending</option>
                  <option value="DESC">Descending</option>
                </select>

                <button
                  onClick={() => removeSort(index)}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Aggregation Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-medium">Aggregations</h4>
              <button
                onClick={addAggregation}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                + Add Aggregation
              </button>
            </div>

            {aggregations.map((agg, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <select
                  value={agg.function}
                  onChange={(e) => updateAggregation(index, { function: e.target.value as QueryAggregation['function'] })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="COUNT">COUNT</option>
                  <option value="SUM">SUM</option>
                  <option value="AVG">AVG</option>
                  <option value="MIN">MIN</option>
                  <option value="MAX">MAX</option>
                </select>

                <select
                  value={agg.column}
                  onChange={(e) => updateAggregation(index, { column: e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {selectedColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={agg.alias || ''}
                  onChange={(e) => updateAggregation(index, { alias: e.target.value })}
                  placeholder="Alias (optional)"
                  className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                />

                <button
                  onClick={() => removeAggregation(index)}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Limit Section */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Limit Results</h4>
            <input
              type="number"
              value={limit || ''}
              onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Number of rows (optional)"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
        </>
      )}
    </div>
  );
};


