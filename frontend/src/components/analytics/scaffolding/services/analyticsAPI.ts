/**
 * Analytics API Service - Business Intelligence & User Analytics
 */

import { UserAnalytics, SystemPerformance, BusinessMetrics, AnalyticsFilters } from '../types/analytics.types';

class AnalyticsAPIService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = '/api/analytics', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User Analytics
  async getUserAnalytics(
    userId?: string,
    tenantId?: string,
    filters?: AnalyticsFilters
  ): Promise<UserAnalytics> {
    const params = new URLSearchParams();

    if (userId) params.append('userId', userId);
    if (tenantId) params.append('tenantId', tenantId);
    if (filters?.dateRange) {
      if (filters.dateRange.from) params.append('dateFrom', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) params.append('dateTo', filters.dateRange.to.toISOString());
    }
    if (filters?.eventType) {
      filters.eventType.forEach(type => params.append('eventType', type));
    }

    const queryString = params.toString();
    const endpoint = `/user${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // System Performance
  async getSystemPerformance(
    dateRange?: { from: Date; to: Date },
    service?: string
  ): Promise<SystemPerformance[]> {
    const params = new URLSearchParams();

    if (dateRange) {
      if (dateRange.from) params.append('dateFrom', dateRange.from.toISOString());
      if (dateRange.to) params.append('dateTo', dateRange.to.toISOString());
    }
    if (service) params.append('service', service);

    const queryString = params.toString();
    const endpoint = `/performance${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Business Metrics
  async getBusinessMetrics(
    tenantId?: string,
    dateRange?: { from: Date; to: Date },
    categories?: string[]
  ): Promise<BusinessMetrics> {
    const params = new URLSearchParams();

    if (tenantId) params.append('tenantId', tenantId);
    if (dateRange) {
      if (dateRange.from) params.append('dateFrom', dateRange.from.toISOString());
      if (dateRange.to) params.append('dateTo', dateRange.to.toISOString());
    }
    if (categories) {
      categories.forEach(category => params.append('category', category));
    }

    const queryString = params.toString();
    const endpoint = `/business${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Event Tracking
  async trackEvent(eventData: {
    type: string;
    category: string;
    action: string;
    label?: string;
    value?: number;
    properties?: Record<string, any>;
    userId?: string;
    sessionId?: string;
  }): Promise<{ eventId: string }> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Performance Metrics Tracking
  async trackPerformanceMetric(metricData: {
    name: string;
    value: number;
    unit?: string;
    service?: string;
    endpoint?: string;
    tags?: Record<string, any>;
  }): Promise<{ metricId: string }> {
    return this.request('/performance', {
      method: 'POST',
      body: JSON.stringify(metricData),
    });
  }

  // Dashboard Analytics
  async getDashboardAnalytics(
    dashboardId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<any> {
    const params = new URLSearchParams();

    if (dateRange) {
      if (dateRange.from) params.append('dateFrom', dateRange.from.toISOString());
      if (dateRange.to) params.append('dateTo', dateRange.to.toISOString());
    }

    const queryString = params.toString();
    const endpoint = `/dashboard/${dashboardId}${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Analytics Summary
  async getAnalyticsSummary(
    days: number = 30,
    tenantId?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('days', days.toString());
    if (tenantId) params.append('tenantId', tenantId);

    return this.request(`/summary?${params}`);
  }

  // Export Data
  async exportData(
    format: 'csv' | 'json' | 'pdf',
    filters?: AnalyticsFilters,
    dataType: 'users' | 'performance' | 'business' = 'users'
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    params.append('type', dataType);

    if (filters?.dateRange) {
      if (filters.dateRange.from) params.append('dateFrom', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) params.append('dateTo', filters.dateRange.to.toISOString());
    }

    const url = `${this.baseUrl}/export?${params}`;
    const response = await fetch(url, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  }

  // Real-time Subscription
  async subscribeToUpdates(
    callback: (update: any) => void,
    filters?: AnalyticsFilters
  ): Promise<() => void> {
    // WebSocket connection for real-time updates
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/realtime';

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Send subscription filters
        if (filters) {
          ws.send(JSON.stringify({ type: 'subscribe', filters }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          callback(update);
        } catch (error) {
          console.error('Failed to parse real-time update:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      // Return unsubscribe function
      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      // Fallback to polling
      return this.setupPollingFallback(callback, filters);
    }
  }

  private setupPollingFallback(
    callback: (update: any) => void,
    filters?: AnalyticsFilters
  ): () => void {
    const poll = async () => {
      try {
        const summary = await this.getAnalyticsSummary(1);
        callback({
          type: 'summary_update',
          data: summary,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Polling fallback failed:', error);
      }
    };

    // Poll every 30 seconds
    const intervalId = setInterval(poll, 30000);

    // Initial poll
    poll();

    return () => {
      clearInterval(intervalId);
    };
  }
}

// Singleton instance
export const analyticsAPI = new AnalyticsAPIService();
export default analyticsAPI;
