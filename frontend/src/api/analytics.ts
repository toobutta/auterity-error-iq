// Analytics API Functions

import client from './client';

export interface AnalyticsEvent {
  event_type: string;
  event_category?: string;
  event_action?: string;
  event_label?: string;
  event_value?: number;
  session_id?: string;
  properties?: Record<string, any>;
  context?: Record<string, any>;
}

export interface PerformanceMetric {
  metric_type: string;
  metric_name: string;
  value: number;
  unit?: string;
  service_name?: string;
  endpoint?: string;
  tags?: Record<string, any>;
}

export interface UserAnalytics {
  total_events: number;
  event_types: Record<string, number>;
  event_categories: Record<string, number>;
  page_views: Array<{
    url: string;
    title?: string;
    timestamp: string;
  }>;
  user_journey: Array<{
    timestamp: string;
    event_type: string;
    action: string;
    page?: string;
  }>;
  time_range: {
    from?: string;
    to?: string;
  };
}

export interface PerformanceAnalytics {
  metrics: Record<string, {
    type: string;
    name: string;
    unit?: string;
    values: number[];
    avg: number;
    min: number;
    max: number;
    count: number;
  }>;
  time_series: Record<string, Record<string, number>>;
  summary: {
    total_metrics: number;
    unique_metric_types: number;
    time_range: {
      from?: string;
      to?: string;
    };
  };
}

export interface DashboardAnalytics {
  dashboard_id: string;
  total_views: number;
  total_edits: number;
  unique_users: number;
  avg_session_time: number;
  most_viewed_widgets: Array<[string, number]>;
  usage_over_time: Record<string, number>;
  time_range: {
    from?: string;
    to?: string;
  };
}

export interface BusinessMetrics {
  categories: Record<string, Array<{
    id: string;
    name: string;
    current_value?: number;
    previous_value?: number;
    target_value?: number;
    change_percentage?: number;
    trend_direction?: string;
    time_period: string;
    unit?: string;
  }>>;
  summary: {
    total_metrics: number;
    categories_count: number;
    time_range: {
      from?: string;
      to?: string;
    };
  };
}

export interface AnalyticsSummary {
  period_days: number;
  user_activity: {
    total_events: number;
    unique_users: number;
    total_sessions: number;
    avg_events_per_user: number;
    avg_events_per_session: number;
  };
  performance?: {
    avg_response_time?: number;
    error_rate?: number;
  };
  generated_at: string;
}

// Event Tracking
export const trackEvent = async (eventData: AnalyticsEvent): Promise<{ event_id: string; status: string }> => {
  const response = await client.post('/analytics/events', eventData);
  return response.data;
};

export const trackPageView = async (
  pageUrl: string,
  pageTitle?: string,
  referrer?: string
): Promise<{ event_id: string; status: string }> => {
  return await trackEvent({
    event_type: 'page_view',
    event_category: 'navigation',
    event_action: 'view',
    event_label: pageUrl,
    context: {
      page_url: pageUrl,
      page_title: pageTitle,
      referrer: referrer
    }
  });
};

export const trackUserInteraction = async (
  action: string,
  category: string = 'ui',
  label?: string,
  value?: number,
  properties?: Record<string, any>
): Promise<{ event_id: string; status: string }> => {
  return await trackEvent({
    event_type: 'interaction',
    event_category: category,
    event_action: action,
    event_label: label,
    event_value: value,
    properties
  });
};

// Performance Tracking
export const trackPerformanceMetric = async (
  metricData: PerformanceMetric
): Promise<{ metric_id: string; status: string }> => {
  const response = await client.post('/analytics/performance', metricData);
  return response.data;
};

export const trackResponseTime = async (
  endpoint: string,
  responseTime: number,
  serviceName?: string
): Promise<{ metric_id: string; status: string }> => {
  return await trackPerformanceMetric({
    metric_type: 'response_time',
    metric_name: 'api_response_time',
    value: responseTime,
    unit: 'ms',
    service_name: serviceName,
    endpoint: endpoint
  });
};

export const trackErrorRate = async (
  serviceName: string,
  errorCount: number,
  totalRequests: number
): Promise<{ metric_id: string; status: string }> => {
  const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

  return await trackPerformanceMetric({
    metric_type: 'error_rate',
    metric_name: 'service_error_rate',
    value: errorRate,
    unit: '%',
    service_name: serviceName
  });
};

// Analytics Queries
export const getUserAnalytics = async (
  dateFrom?: Date,
  dateTo?: Date,
  eventTypes?: string[]
): Promise<UserAnalytics> => {
  const params = new URLSearchParams();

  if (dateFrom) params.append('date_from', dateFrom.toISOString());
  if (dateTo) params.append('date_to', dateTo.toISOString());
  if (eventTypes) {
    eventTypes.forEach(type => params.append('event_types', type));
  }

  const response = await client.get(`/analytics/user?${params}`);
  return response.data;
};

export const getPerformanceAnalytics = async (
  serviceName?: string,
  metricTypes?: string[],
  dateFrom?: Date,
  dateTo?: Date
): Promise<PerformanceAnalytics> => {
  const params = new URLSearchParams();

  if (serviceName) params.append('service_name', serviceName);
  if (dateFrom) params.append('date_from', dateFrom.toISOString());
  if (dateTo) params.append('date_to', dateTo.toISOString());
  if (metricTypes) {
    metricTypes.forEach(type => params.append('metric_types', type));
  }

  const response = await client.get(`/analytics/performance?${params}`);
  return response.data;
};

export const getDashboardAnalytics = async (
  dashboardId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<DashboardAnalytics> => {
  const params = new URLSearchParams();

  if (dateFrom) params.append('date_from', dateFrom.toISOString());
  if (dateTo) params.append('date_to', dateTo.toISOString());

  const response = await client.get(`/analytics/dashboard/${dashboardId}?${params}`);
  return response.data;
};

export const getBusinessMetrics = async (
  categories?: string[],
  dateFrom?: Date,
  dateTo?: Date
): Promise<BusinessMetrics> => {
  const params = new URLSearchParams();

  if (dateFrom) params.append('date_from', dateFrom.toISOString());
  if (dateTo) params.append('date_to', dateTo.toISOString());
  if (categories) {
    categories.forEach(category => params.append('categories', category));
  }

  const response = await client.get(`/analytics/business?${params}`);
  return response.data;
};

export const getAnalyticsSummary = async (days: number = 30): Promise<AnalyticsSummary> => {
  const response = await client.get(`/analytics/summary?days=${days}`);
  return response.data;
};

// Dashboard Analytics Tracking
export const trackDashboardView = async (
  dashboardId: string,
  duration?: number,
  context?: Record<string, any>
): Promise<void> => {
  await client.post(`/analytics/dashboard/${dashboardId}/track`, {
    type: 'view',
    duration,
    ...context
  });
};

export const trackDashboardEdit = async (
  dashboardId: string,
  action: string,
  context?: Record<string, any>
): Promise<void> => {
  await client.post(`/analytics/dashboard/${dashboardId}/track`, {
    type: 'edit',
    action,
    ...context
  });
};

export const trackWidgetInteraction = async (
  dashboardId: string,
  widgetId: string,
  interactionType: string,
  context?: Record<string, any>
): Promise<void> => {
  await client.post(`/analytics/dashboard/${dashboardId}/track`, {
    type: 'interaction',
    widget_id: widgetId,
    interaction_type: interactionType,
    ...context
  });
};

// Session Management
export const startUserSession = async (
  sessionId: string,
  context?: Record<string, any>
): Promise<{ session_id: string; status: string }> => {
  const response = await client.post('/analytics/sessions/start', {
    session_id: sessionId,
    context
  });
  return response.data;
};

export const updateUserSession = async (
  sessionId: string,
  pageViews?: number,
  eventsCount?: number,
  duration?: number
): Promise<{ status: string }> => {
  const response = await client.put(`/analytics/sessions/${sessionId}`, {
    page_views: pageViews,
    events_count: eventsCount,
    duration
  });
  return response.data;
};

export const endUserSession = async (sessionId: string): Promise<{ status: string }> => {
  const response = await client.post(`/analytics/sessions/${sessionId}/end`);
  return response.data;
};

// Utility Functions
export const getAnalyticsDateRanges = () => [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'Last year', value: 365 }
];

export const formatAnalyticsValue = (value: number, type: 'number' | 'percentage' | 'currency' | 'duration' = 'number'): string => {
  switch (type) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    case 'duration':
      if (value < 60) return `${Math.round(value)}s`;
      if (value < 3600) return `${Math.round(value / 60)}m`;
      return `${Math.round(value / 3600)}h`;
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
};

export const calculateTrend = (
  current: number,
  previous: number
): { direction: 'up' | 'down' | 'neutral'; percentage: number } => {
  if (previous === 0) {
    return { direction: current > 0 ? 'up' : 'neutral', percentage: 0 };
  }

  const percentage = ((current - previous) / previous) * 100;

  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (percentage > 1) direction = 'up';
  else if (percentage < -1) direction = 'down';

  return { direction, percentage: Math.abs(percentage) };
};

export const generateAnalyticsReport = async (
  reportType: string,
  parameters: Record<string, any>
): Promise<{ report_id: string; status: string; download_url?: string }> => {
  const response = await client.post('/analytics/reports/generate', {
    template_id: reportType,
    parameters,
    format: 'pdf'
  });
  return response.data;
};

export const getAnalyticsReportTemplates = async (): Promise<Array<{
  id: string;
  name: string;
  description: string;
  type: string;
  category?: string;
  tags: string[];
}>> => {
  const response = await client.get('/analytics/reports/templates');
  return response.data.templates || [];
};

// Real-time Analytics
export const getRealtimeSessions = async (): Promise<{
  active_sessions: number;
  sessions: Array<{
    id: string;
    user_id?: string;
    session_id: string;
    device_type?: string;
    browser?: string;
    country?: string;
    last_activity: string;
    page_views: number;
    events_count: number;
  }>;
}> => {
  const response = await client.get('/analytics/realtime/sessions');
  return response.data;
};

export const getRealtimeEvents = async (limit: number = 50): Promise<{
  events: Array<{
    id: string;
    user_id?: string;
    event_type: string;
    event_category: string;
    event_action: string;
    event_label?: string;
    event_value?: number;
    page_url?: string;
    timestamp: string;
  }>;
  total: number;
}> => {
  const response = await client.get(`/analytics/realtime/events?limit=${limit}`);
  return response.data;
};
