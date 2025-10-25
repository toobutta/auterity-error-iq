/**
 * Cross-Filter Analytics Dashboard
 * Interactive data visualization with real-time filtering and drill-down capabilities
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';
import {
  Table,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import * as d3 from 'd3';
import { useDebounce } from '../../hooks/useDebounce';

interface AnalyticsData {
  id: string;
  timestamp: string;
  category: string;
  value: number;
  userId: string;
  workflowId?: string;
  status: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  cost?: number;
  confidence?: number;
  location?: string;
  device?: string;
  metadata?: Record<string, any>;
}

interface FilterState {
  dateRange: { start: Date; end: Date };
  categories: string[];
  status: string[];
  userIds: string[];
  minValue?: number;
  maxValue?: number;
  searchTerm: string;
}

interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'scatter' | 'composed';
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  title: string;
  color: string;
}

interface CrossFilterAnalyticsDashboardProps {
  data: AnalyticsData[];
  onDataFilter?: (filteredData: AnalyticsData[]) => void;
  onInsightGenerated?: (insights: string[]) => void;
  className?: string;
  realTime?: boolean;
}

export const CrossFilterAnalyticsDashboard: React.FC<CrossFilterAnalyticsDashboardProps> = ({
  data,
  onDataFilter,
  onInsightGenerated,
  className = '',
  realTime = false
}) => {
  // State management
  const [filterState, setFilterState] = useState<FilterState>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    },
    categories: [],
    status: [],
    userIds: [],
    searchTerm: ''
  });

  const [selectedChart, setSelectedChart] = useState<string>('overview');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['value', 'duration']);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  // Debounced search for performance
  const debouncedSearchTerm = useDebounce(filterState.searchTerm, 300);

  // Filtered data computation
  const filteredData = useMemo(() => {
    let filtered = data.filter(item => {
      const itemDate = new Date(item.timestamp);
      const inDateRange = itemDate >= filterState.dateRange.start &&
                         itemDate <= filterState.dateRange.end;

      const matchesCategory = filterState.categories.length === 0 ||
                             filterState.categories.includes(item.category);

      const matchesStatus = filterState.status.length === 0 ||
                           filterState.status.includes(item.status);

      const matchesUser = filterState.userIds.length === 0 ||
                         filterState.userIds.includes(item.userId);

      const matchesValue = (filterState.minValue === undefined || item.value >= filterState.minValue) &&
                          (filterState.maxValue === undefined || item.value <= filterState.maxValue);

      const matchesSearch = !debouncedSearchTerm ||
                           item.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           item.status.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           item.userId.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      return inDateRange && matchesCategory && matchesStatus &&
             matchesUser && matchesValue && matchesSearch;
    });

    // Notify parent of filtered data
    onDataFilter?.(filtered);

    return filtered;
  }, [data, filterState, debouncedSearchTerm, onDataFilter]);

  // Generate insights from filtered data
  const generateInsights = useCallback(() => {
    if (filteredData.length === 0) return;

    const newInsights: string[] = [];

    // Trend analysis
    const sortedData = filteredData.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (sortedData.length > 1) {
      const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
      const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));

      const firstHalfAvg = d3.mean(firstHalf, d => d.value) || 0;
      const secondHalfAvg = d3.mean(secondHalf, d => d.value) || 0;

      const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

      if (Math.abs(changePercent) > 10) {
        newInsights.push(
          `Trend: ${changePercent > 0 ? 'Increasing' : 'Decreasing'} by ${Math.abs(changePercent).toFixed(1)}%`
        );
      }
    }

    // Error rate analysis
    const errorRate = filteredData.filter(d => d.status === 'error').length / filteredData.length;
    if (errorRate > 0.1) {
      newInsights.push(`High error rate: ${(errorRate * 100).toFixed(1)}% of operations failed`);
    }

    // Performance insights
    if (filteredData.some(d => d.duration)) {
      const avgDuration = d3.mean(filteredData.filter(d => d.duration), d => d.duration!) || 0;
      const slowOperations = filteredData.filter(d => (d.duration || 0) > avgDuration * 2);

      if (slowOperations.length > 0) {
        newInsights.push(`${slowOperations.length} operations are significantly slower than average`);
      }
    }

    // Category distribution
    const categoryCounts = d3.rollup(
      filteredData,
      v => v.length,
      d => d.category
    );

    const dominantCategory = Array.from(categoryCounts.entries())
      .sort(([, a], [, b]) => b - a)[0];

    if (dominantCategory) {
      newInsights.push(`Most active category: ${dominantCategory[0]} (${dominantCategory[1]} operations)`);
    }

    setInsights(newInsights);
    onInsightGenerated?.(newInsights);
  }, [filteredData, onInsightGenerated]);

  // Generate insights when filtered data changes
  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];

    const groupedData = d3.rollup(
      filteredData,
      values => ({
        count: values.length,
        totalValue: d3.sum(values, d => d.value),
        avgValue: d3.mean(values, d => d.value) || 0,
        successRate: values.filter(d => d.status === 'success').length / values.length,
        avgDuration: d3.mean(values.filter(d => d.duration), d => d.duration!) || 0
      }),
      d => d3.timeDay.floor(new Date(d.timestamp)) // Group by day
    );

    return Array.from(groupedData.entries())
      .map(([date, stats]) => ({
        date: date.toISOString().split('T')[0],
        count: stats.count,
        totalValue: stats.totalValue,
        avgValue: stats.avgValue,
        successRate: stats.successRate * 100,
        avgDuration: stats.avgDuration
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  // Category distribution data
  const categoryData = useMemo(() => {
    const categoryStats = d3.rollup(
      filteredData,
      values => ({
        count: values.length,
        totalValue: d3.sum(values, d => d.value),
        avgValue: d3.mean(values, d => d.value) || 0
      }),
      d => d.category
    );

    return Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        name: category,
        value: stats.count,
        totalValue: stats.totalValue,
        avgValue: stats.avgValue
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Status distribution data
  const statusData = useMemo(() => {
    const statusStats = d3.rollup(
      filteredData,
      values => values.length,
      d => d.status
    );

    return Array.from(statusStats.entries())
      .map(([status, count]) => ({
        name: status,
        value: count
      }));
  }, [filteredData]);

  // Filter update handlers
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilterState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const updateDateRange = useCallback((start: Date, end: Date) => {
    setFilterState(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  }, []);

  const toggleFilterArray = useCallback((key: 'categories' | 'status' | 'userIds', value: string) => {
    setFilterState(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  }, []);

  // Chart configurations
  const chartConfigs: Record<string, ChartConfig> = {
    overview: {
      type: 'composed',
      xAxis: 'date',
      yAxis: 'count',
      title: 'Overview',
      color: '#3b82f6'
    },
    trends: {
      type: 'line',
      xAxis: 'date',
      yAxis: 'avgValue',
      title: 'Value Trends',
      color: '#10b981'
    },
    performance: {
      type: 'area',
      xAxis: 'date',
      yAxis: 'avgDuration',
      title: 'Performance Trends',
      color: '#f59e0b'
    },
    categories: {
      type: 'bar',
      xAxis: 'name',
      yAxis: 'value',
      groupBy: 'category',
      title: 'Category Distribution',
      color: '#8b5cf6'
    },
    status: {
      type: 'pie',
      xAxis: 'name',
      yAxis: 'value',
      title: 'Status Distribution',
      color: '#ef4444'
    },
    scatter: {
      type: 'scatter',
      xAxis: 'avgValue',
      yAxis: 'avgDuration',
      title: 'Value vs Duration',
      color: '#06b6d4'
    }
  };

  // Color schemes for charts
  const colorSchemes = {
    status: {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    },
    categories: d3.schemeCategory10
  };

  // Render chart based on configuration
  const renderChart = useCallback((config: ChartConfig, data: any[]) => {
    if (data.length === 0) {
      return <div className="no-data">No data available for the selected filters</div>;
    }

    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (config.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetrics[0] || 'count'}
              stroke={config.color}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey={selectedMetrics[0] || 'avgDuration'}
              stroke={config.color}
              fill={config.color}
              fillOpacity={0.6}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="value"
              fill={config.color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colorSchemes.status[entry.name as keyof typeof colorSchemes.status] || config.color}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis} />
            <YAxis dataKey={config.yAxis} />
            <Tooltip />
            <Legend />
            <Scatter
              name="Data Points"
              data={data}
              fill={config.color}
            />
          </ScatterChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xAxis} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="count" fill={config.color} opacity={0.7} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="successRate"
              stroke="#10b981"
              strokeWidth={2}
            />
          </ComposedChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  }, [selectedMetrics]);

  return (
    <div className={`cross-filter-analytics-dashboard ${className}`}>
      {/* Header with title and summary */}
      <div className="dashboard-header">
        <h2>Analytics Dashboard</h2>
        <div className="summary-stats">
          <div className="stat-card">
            <span className="stat-value">{filteredData.length.toLocaleString()}</span>
            <span className="stat-label">Total Records</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {(filteredData.reduce((sum, item) => sum + item.value, 0) / filteredData.length || 0).toFixed(2)}
            </span>
            <span className="stat-label">Avg Value</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {((filteredData.filter(d => d.status === 'success').length / filteredData.length || 0) * 100).toFixed(1)}%
            </span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="filters-panel">
        <div className="filter-row">
          {/* Date Range Filter */}
          <div className="filter-group">
            <label>Date Range</label>
            <div className="date-inputs">
              <input
                type="date"
                value={filterState.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => updateDateRange(new Date(e.target.value), filterState.dateRange.end)}
              />
              <span>to</span>
              <input
                type="date"
                value={filterState.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => updateDateRange(filterState.dateRange.start, new Date(e.target.value))}
              />
            </div>
          </div>

          {/* Search Filter */}
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search categories, status, users..."
              value={filterState.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-row">
          {/* Category Filter */}
          <div className="filter-group">
            <label>Categories</label>
            <div className="filter-chips">
              {Array.from(new Set(data.map(d => d.category))).map(category => (
                <button
                  key={category}
                  className={`filter-chip ${filterState.categories.includes(category) ? 'active' : ''}`}
                  onClick={() => toggleFilterArray('categories', category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label>Status</label>
            <div className="filter-chips">
              {['success', 'error', 'warning', 'info'].map(status => (
                <button
                  key={status}
                  className={`filter-chip ${filterState.status.includes(status) ? 'active' : ''}`}
                  onClick={() => toggleFilterArray('status', status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Chart Type Selector */}
        <div className="chart-selector">
          {Object.entries(chartConfigs).map(([key, config]) => (
            <button
              key={key}
              className={`chart-type-button ${selectedChart === key ? 'active' : ''}`}
              onClick={() => setSelectedChart(key)}
            >
              {config.title}
            </button>
          ))}
        </div>

        {/* Main Chart */}
        <div className="main-chart">
          <h3>{chartConfigs[selectedChart]?.title}</h3>
          <ResponsiveContainer width="100%" height={400}>
            {renderChart(
              chartConfigs[selectedChart],
              selectedChart === 'categories' ? categoryData :
              selectedChart === 'status' ? statusData :
              selectedChart === 'scatter' ? chartData.map(d => ({
                avgValue: d.avgValue,
                avgDuration: d.avgDuration,
                count: d.count
              })) :
              chartData
            )}
          </ResponsiveContainer>
        </div>

        {/* Insights Panel */}
        {insights.length > 0 && (
          <div className="insights-panel">
            <h3>AI Insights</h3>
            <ul className="insights-list">
              {insights.map((insight, index) => (
                <li key={index} className="insight-item">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="data-table-section">
        <h3>Detailed Data ({filteredData.length} records)</h3>
        <div className="data-table-container">
          <DataTable data={filteredData.slice(0, 100)} /> {/* Limit for performance */}
        </div>
        {filteredData.length > 100 && (
          <p className="table-note">
            Showing first 100 records. Use filters to narrow down results.
          </p>
        )}
      </div>
    </div>
  );
};

// Data Table Component
interface DataTableProps {
  data: AnalyticsData[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const columns = useMemo<ColumnDef<AnalyticsData>[]>(() => [
    {
      accessorKey: 'timestamp',
      header: 'Time',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString()
    },
    {
      accessorKey: 'category',
      header: 'Category'
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ getValue }) => (getValue() as number).toFixed(2)
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`status-badge status-${getValue()}`}>
          {getValue() as string}
        </span>
      )
    },
    {
      accessorKey: 'duration',
      header: 'Duration (ms)',
      cell: ({ getValue }) => getValue() ? `${(getValue() as number).toFixed(0)}ms` : '-'
    },
    {
      accessorKey: 'userId',
      header: 'User'
    }
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className="data-table">
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="table-pagination">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CrossFilterAnalyticsDashboard;
