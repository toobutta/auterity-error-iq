import client from './client';
import {
  Dashboard,
  DashboardWidget,
  DashboardTemplate,
  DashboardAnalytics,
  DashboardListResponse,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  CreateWidgetRequest,
  UpdateWidgetRequest,
  WidgetDataResponse,
} from '../types/dashboard';

// Dashboard CRUD operations
export const createDashboard = async (
  dashboard: CreateDashboardRequest
): Promise<Dashboard> => {
  const response = await client.post('/dashboards', dashboard);
  return response.data;
};

export const getDashboards = async (
  page = 1,
  pageSize = 10,
  filters?: {
    category?: string;
    search?: string;
    includePublic?: boolean;
  }
): Promise<DashboardListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.includePublic !== undefined) {
    params.append('include_public', filters.includePublic.toString());
  }

  const response = await client.get(`/dashboards?${params}`);
  return response.data;
};

export const getDashboard = async (id: string): Promise<Dashboard> => {
  const response = await client.get(`/dashboards/${id}`);
  return response.data;
};

export const updateDashboard = async (
  id: string,
  dashboard: UpdateDashboardRequest
): Promise<Dashboard> => {
  const response = await client.put(`/dashboards/${id}`, dashboard);
  return response.data;
};

export const deleteDashboard = async (id: string): Promise<void> => {
  await client.delete(`/dashboards/${id}`);
};

// Dashboard duplication
export const duplicateDashboard = async (id: string, name?: string): Promise<Dashboard> => {
  const response = await client.post(`/dashboards/${id}/duplicate`, { name });
  return response.data;
};

// Dashboard sharing
export const shareDashboard = async (
  id: string,
  shareData: {
    share_type: 'user' | 'role' | 'team' | 'public';
    target_id?: string;
    can_view?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
    can_share?: boolean;
    message?: string;
    expires_at?: string;
  }
): Promise<void> => {
  await client.post(`/dashboards/${id}/share`, shareData);
};

export const getDashboardShares = async (id: string) => {
  const response = await client.get(`/dashboards/${id}/shares`);
  return response.data;
};

// Widget management
export const createWidget = async (
  dashboardId: string,
  widget: CreateWidgetRequest
): Promise<DashboardWidget> => {
  const response = await client.post(`/dashboards/${dashboardId}/widgets`, widget);
  return response.data;
};

export const getWidgets = async (dashboardId: string): Promise<DashboardWidget[]> => {
  const response = await client.get(`/dashboards/${dashboardId}/widgets`);
  return response.data;
};

export const updateWidget = async (
  dashboardId: string,
  widgetId: string,
  widget: UpdateWidgetRequest
): Promise<DashboardWidget> => {
  const response = await client.put(`/dashboards/${dashboardId}/widgets/${widgetId}`, widget);
  return response.data;
};

export const deleteWidget = async (dashboardId: string, widgetId: string): Promise<void> => {
  await client.delete(`/dashboards/${dashboardId}/widgets/${widgetId}`);
};

// Widget data fetching
export const getWidgetData = async (
  dashboardId: string,
  widgetId: string,
  params?: Record<string, any>
): Promise<WidgetDataResponse> => {
  const queryParams = params ? new URLSearchParams(params) : '';
  const url = `/dashboards/${dashboardId}/widgets/${widgetId}/data${queryParams ? '?' + queryParams : ''}`;
  const response = await client.get(url);
  return response.data;
};

// Dashboard templates
export const getDashboardTemplates = async (
  filters?: {
    category?: string;
    featured_only?: boolean;
  }
): Promise<DashboardTemplate[]> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.featured_only !== undefined) {
    params.append('featured_only', filters.featured_only.toString());
  }

  const response = await client.get(`/dashboards/templates?${params}`);
  return response.data;
};

export const applyTemplate = async (
  dashboardId: string,
  templateId: string
): Promise<Dashboard> => {
  const response = await client.post(`/dashboards/${dashboardId}/templates/${templateId}/apply`);
  return response.data;
};

// Dashboard analytics
export const getDashboardAnalytics = async (dashboardId: string): Promise<DashboardAnalytics> => {
  const response = await client.get(`/dashboards/${dashboardId}/analytics`);
  return response.data;
};

export const trackDashboardView = async (dashboardId: string): Promise<void> => {
  await client.post(`/dashboards/${dashboardId}/analytics/view`);
};

// Bulk operations
export const bulkUpdateWidgets = async (
  dashboardId: string,
  updates: Array<{
    widget_id: string;
    updates: UpdateWidgetRequest;
  }>
): Promise<DashboardWidget[]> => {
  const response = await client.post(`/dashboards/${dashboardId}/widgets/bulk`, { updates });
  return response.data;
};

export const bulkDeleteWidgets = async (
  dashboardId: string,
  widgetIds: string[]
): Promise<void> => {
  await client.post(`/dashboards/${dashboardId}/widgets/bulk/delete`, { widget_ids: widgetIds });
};

// Export/Import
export const exportDashboard = async (
  dashboardId: string,
  format: 'json' | 'pdf' | 'png' = 'json'
): Promise<Blob> => {
  const response = await client.get(`/dashboards/${dashboardId}/export?format=${format}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const importDashboard = async (
  file: File,
  options?: {
    name?: string;
    category?: string;
    is_public?: boolean;
  }
): Promise<Dashboard> => {
  const formData = new FormData();
  formData.append('file', file);
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
  }

  const response = await client.post('/dashboards/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Real-time collaboration
export const getCollaborationSession = async (dashboardId: string) => {
  const response = await client.get(`/dashboards/${dashboardId}/collaboration`);
  return response.data;
};

export const joinCollaborationSession = async (
  dashboardId: string,
  userId: string
): Promise<WebSocket> => {
  // This would establish a WebSocket connection for real-time collaboration
  const wsUrl = `${client.defaults.baseURL?.replace('http', 'ws')}/dashboards/${dashboardId}/collaboration/${userId}`;
  return new WebSocket(wsUrl);
};

// Dashboard categories and utilities
export const getDashboardCategories = async (): Promise<string[]> => {
  const response = await client.get('/dashboards/categories');
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await client.get('/dashboards/stats');
  return response.data;
};

// Search and filtering
export const searchDashboards = async (
  query: string,
  filters?: {
    category?: string;
    tags?: string[];
    user_id?: string;
    is_public?: boolean;
  }
): Promise<DashboardListResponse> => {
  const params = new URLSearchParams({
    search: query,
  });

  if (filters?.category) params.append('category', filters.category);
  if (filters?.tags) filters.tags.forEach(tag => params.append('tags', tag));
  if (filters?.user_id) params.append('user_id', filters.user_id);
  if (filters?.is_public !== undefined) {
    params.append('is_public', filters.is_public.toString());
  }

  const response = await client.get(`/dashboards/search?${params}`);
  return response.data;
};

// Dashboard health and monitoring
export const getDashboardHealth = async () => {
  const response = await client.get('/dashboard/health');
  return response.data;
};

export const getDashboardPerformance = async (dashboardId: string) => {
  const response = await client.get(`/dashboards/${dashboardId}/performance`);
  return response.data;
};
