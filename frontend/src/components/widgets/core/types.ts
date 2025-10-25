import { ReactNode } from 'react';
import { WidgetConfig, DataSourceConfig } from '../../../types/dashboard';

export interface BaseWidgetProps {
  id: string;
  title: string;
  config: WidgetConfig;
  dataSource: DataSourceConfig;
  isLoading?: boolean;
  error?: string;
  onConfigChange?: (config: WidgetConfig) => void;
  onRefresh?: () => void;
  className?: string;
}

export interface WidgetHeaderProps {
  title: string;
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
  actions?: ReactNode;
}

export interface WidgetErrorProps {
  message: string;
  onRetry?: () => void;
}

export interface WidgetLoadingProps {
  message?: string;
}

// Chart Widget Types
export interface ChartWidgetProps extends BaseWidgetProps {
  chartType: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  xAxis?: string;
  yAxis?: string[];
  colors?: string[];
  showLegend?: boolean;
}

// Metric Widget Types
export interface MetricWidgetProps extends BaseWidgetProps {
  value: number | string;
  previousValue?: number | string;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percentage';
  prefix?: string;
  suffix?: string;
}

// Table Widget Types
export interface TableWidgetProps extends BaseWidgetProps {
  data: any[];
  columns: Array<{
    key: string;
    title: string;
    type?: 'text' | 'number' | 'date' | 'boolean';
    sortable?: boolean;
    width?: number | string;
  }>;
  pagination?: {
    pageSize: number;
    current: number;
    total: number;
  };
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
}

// Text Widget Types
export interface TextWidgetProps extends BaseWidgetProps {
  content: string;
  format: 'plain' | 'markdown' | 'html';
  editable?: boolean;
  onContentChange?: (content: string) => void;
}
