/**
 * Analytics Types
 * TypeScript definitions for analytics service and components
 */

// Analytics Event Interface
export interface AnalyticsEvent {
  name: string;
  properties: {
    timestamp: number;
    sessionId: string;
    userId?: string;
    path?: string;
    [key: string]: any;
  };
}

// User Interface for Analytics
export interface AnalyticsUser {
  id: string;
  email?: string;
  role?: string;
  organization?: string;
  plan?: string;
  properties?: Record<string, any>;
}

// Analytics Configuration
export interface AnalyticsConfig {
  enabled?: boolean;
  trackPageViews?: boolean;
  trackUserInteractions?: boolean;
  trackErrors?: boolean;
  trackPerformance?: boolean;
  privacyMode?: 'full' | 'anonymized' | 'minimal';
  sampleRate?: number;
  backendUrl?: string;
  consentRequired?: boolean;
  consentCategories?: string[];
}

// Analytics Metrics
export interface AnalyticsMetrics {
  totalEvents: number;
  eventsLast24h: number;
  uniqueUsers: number;
  topEvents: Record<string, number>;
  averageSessionDuration: number;
  bounceRate: number;
}

// Privacy Settings
export interface PrivacySettings {
  analyticsEnabled: boolean;
  errorTrackingEnabled: boolean;
  performanceTrackingEnabled: boolean;
  personalizationEnabled: boolean;
  marketingEnabled: boolean;
}

// User Consent
export interface UserConsent {
  granted: boolean;
  timestamp: number;
  categories: string[];
  version: string;
}

// Analytics Dashboard Data
export interface AnalyticsDashboardData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    bounceRate: number;
    topPages: Array<{ path: string; views: number }>;
  };
  events: {
    total: number;
    byType: Record<string, number>;
    timeline: Array<{ date: string; count: number }>;
  };
  performance: {
    coreWebVitals: {
      cls: number;
      fid: number;
      fcp: number;
      lcp: number;
      ttfb: number;
    };
    pageLoadTime: number;
    errorRate: number;
  };
  userBehavior: {
    popularFeatures: Array<{ feature: string; usage: number }>;
    userFlow: Array<{ from: string; to: string; count: number }>;
    conversionFunnel: Array<{ step: string; count: number; rate: number }>;
  };
}

// Analytics Report
export interface AnalyticsReport {
  id: string;
  title: string;
  description: string;
  dateRange: {
    start: number;
    end: number;
  };
  data: AnalyticsDashboardData;
  generatedAt: number;
  generatedBy: string;
}

// Custom Event Types
export type AnalyticsEventType =
  | 'page_view'
  | 'user_interaction'
  | 'workflow_event'
  | 'ai_interaction'
  | 'error'
  | 'performance'
  | 'user_identify'
  | 'feature_usage'
  | 'conversion'
  | 'custom';

// Event Categories
export interface EventCategory {
  name: string;
  description: string;
  events: string[];
  enabled: boolean;
}

// Analytics Integration Status
export interface AnalyticsIntegrationStatus {
  vercelAnalytics: boolean;
  customBackend: boolean;
  errorTracking: boolean;
  performanceTracking: boolean;
  userConsent: boolean;
  lastHealthCheck: number;
}

// Export all types
export type {
  AnalyticsEvent,
  AnalyticsUser,
  AnalyticsConfig,
  AnalyticsMetrics,
  PrivacySettings,
  UserConsent,
  AnalyticsDashboardData,
  AnalyticsReport,
  AnalyticsEventType,
  EventCategory,
  AnalyticsIntegrationStatus
};
