// Dashboard Types

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: Record<string, any>;
  theme: string;
  is_public: boolean;
  tags: string[];
  category?: string;
  user_id: string;
  tenant_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: string;
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, any>;
  data_source_type: string;
  data_source_config: Record<string, any>;
  style: Record<string, any>;
  is_visible: boolean;
  refresh_interval?: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardShare {
  id: string;
  dashboard_id: string;
  share_type: 'user' | 'role' | 'team' | 'public';
  target_id?: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_share: boolean;
  message?: string;
  expires_at?: string;
  shared_by_user_id: string;
  created_at: string;
  last_accessed_at?: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  layout: Record<string, any>;
  widgets: any[];
  theme: string;
  tags: string[];
  preview_image_url?: string;
  is_featured: boolean;
  usage_count: number;
  rating?: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardAnalytics {
  id: string;
  dashboard_id: string;
  user_id: string;
  view_count: number;
  edit_count: number;
  share_count: number;
  export_count: number;
  total_view_time: number;
  last_viewed_at?: string;
  first_viewed_at?: string;
  widget_interactions: Record<string, number>;
  load_times: number[];
  error_count: number;
  created_at: string;
  updated_at: string;
}

// API Request/Response Types
export interface CreateDashboardRequest {
  name: string;
  description?: string;
  layout?: Record<string, any>;
  theme?: string;
  is_public?: boolean;
  tags?: string[];
  category?: string;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  layout?: Record<string, any>;
  theme?: string;
  is_public?: boolean;
  tags?: string[];
  category?: string;
}

export interface DashboardListResponse {
  dashboards: Dashboard[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateWidgetRequest {
  widget_type: string;
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config?: Record<string, any>;
  data_source_type: string;
  data_source_config?: Record<string, any>;
  style?: Record<string, any>;
  refresh_interval?: number;
}

export interface UpdateWidgetRequest {
  widget_type?: string;
  title?: string;
  position?: { x: number; y: number; width: number; height: number };
  config?: Record<string, any>;
  data_source_type?: string;
  data_source_config?: Record<string, any>;
  style?: Record<string, any>;
  is_visible?: boolean;
  refresh_interval?: number;
}

export interface WidgetDataResponse {
  data: any;
  timestamp: string;
  source: string;
  cache_hit?: boolean;
  execution_time_ms?: number;
}

// Widget Types
export type WidgetType =
  | 'chart'
  | 'metric'
  | 'table'
  | 'text'
  | 'image'
  | 'map'
  | 'timeline'
  | 'gauge'
  | 'progress'
  | 'list';

// Data Source Types
export type DataSourceType =
  | 'rest'
  | 'database'
  | 'stream'
  | 'file'
  | 'static';

// Chart Types
export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'radar';

// Dashboard Categories
export type DashboardCategory =
  | 'analytics'
  | 'monitoring'
  | 'business'
  | 'technical'
  | 'financial'
  | 'operational'
  | 'compliance'
  | 'custom';

// Widget Configuration
export interface WidgetConfig {
  title?: string;
  description?: string;
  showHeader?: boolean;
  showBorder?: boolean;
  backgroundColor?: string;
  textColor?: string;
  padding?: number;
}

// Chart Widget Config
export interface ChartWidgetConfig extends WidgetConfig {
  chartType: ChartType;
  dataSource: string;
  xAxis?: string;
  yAxis?: string[];
  groupBy?: string;
  filters?: Record<string, any>;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

// Metric Widget Config
export interface MetricWidgetConfig extends WidgetConfig {
  metric: string;
  dataSource: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  filters?: Record<string, any>;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  prefix?: string;
  suffix?: string;
  color?: string;
  threshold?: {
    value: number;
    color: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  };
}

// Table Widget Config
export interface TableWidgetConfig extends WidgetConfig {
  dataSource: string;
  columns: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean';
    sortable?: boolean;
    filterable?: boolean;
  }>;
  pageSize?: number;
  showPagination?: boolean;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Text Widget Config
export interface TextWidgetConfig extends WidgetConfig {
  content: string;
  format: 'markdown' | 'html' | 'plain';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
  textAlign?: 'left' | 'center' | 'right';
}

// Data Source Configuration
export interface DataSourceConfig {
  type: DataSourceType;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key' | 'oauth2';
    credentials: Record<string, any>;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
  };
}

// Dashboard Layout
export interface DashboardLayout {
  type: 'grid' | 'masonry' | 'list';
  columns?: number;
  gap?: number;
  breakpoints?: {
    sm?: { columns: number };
    md?: { columns: number };
    lg?: { columns: number };
    xl?: { columns: number };
  };
}

// Dashboard Permissions
export interface DashboardPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canExport: boolean;
  canDuplicate: boolean;
}
