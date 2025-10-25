import { DashboardTemplate, ChartType, WidgetType } from '../../types/dashboard';

// Core template interface
interface CoreDashboardTemplate extends DashboardTemplate {
  subscription_tier: 'community' | 'starter' | 'professional';
  recommended_widgets: WidgetType[];
  data_sources: string[];
}

// Core Dashboard Templates
export const coreDashboards: CoreDashboardTemplate[] = [
  {
    id: 'workflow-analytics',
    name: 'Workflow Analytics',
    description: 'Monitor and analyze your workflow performance',
    category: 'analytics',
    layout: {
      type: 'grid',
      columns: 2,
      gap: 16
    },
    widgets: [
      {
        type: 'metric',
        title: 'Active Workflows',
        data_source_type: 'database',
        position: { x: 0, y: 0, width: 1, height: 1 }
      },
      {
        type: 'chart',
        title: 'Execution Success Rate',
        chart_type: 'line' as ChartType,
        data_source_type: 'database',
        position: { x: 1, y: 0, width: 1, height: 1 }
      },
      {
        type: 'table',
        title: 'Recent Executions',
        data_source_type: 'database',
        position: { x: 0, y: 1, width: 2, height: 1 }
      }
    ],
    theme: 'default',
    tags: ['workflow', 'analytics', 'monitoring'],
    recommended_widgets: ['chart', 'metric', 'table'],
    data_sources: ['workflow_db', 'metrics_api'],
    subscription_tier: 'community',
    is_featured: true,
    usage_count: 0,
    review_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ai-performance',
    name: 'AI Model Performance',
    description: 'Track AI model usage and performance metrics',
    category: 'monitoring',
    layout: {
      type: 'grid',
      columns: 3,
      gap: 16
    },
    widgets: [
      {
        type: 'metric',
        title: 'Model Calls',
        data_source_type: 'rest',
        position: { x: 0, y: 0, width: 1, height: 1 }
      },
      {
        type: 'chart',
        title: 'Response Times',
        chart_type: 'bar' as ChartType,
        data_source_type: 'rest',
        position: { x: 1, y: 0, width: 2, height: 1 }
      },
      {
        type: 'table',
        title: 'Model Usage',
        data_source_type: 'rest',
        position: { x: 0, y: 1, width: 3, height: 1 }
      }
    ],
    theme: 'default',
    tags: ['ai', 'performance', 'monitoring'],
    recommended_widgets: ['chart', 'metric', 'table'],
    data_sources: ['ai_metrics_api', 'usage_db'],
    subscription_tier: 'starter',
    is_featured: true,
    usage_count: 0,
    review_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Core Widget Types
export const coreWidgets = [
  {
    type: 'chart' as WidgetType,
    name: 'Chart',
    description: 'Visualize data with various chart types',
    subscription_tier: 'community'
  },
  {
    type: 'metric' as WidgetType,
    name: 'Metric',
    description: 'Display key performance indicators',
    subscription_tier: 'community'
  },
  {
    type: 'table' as WidgetType,
    name: 'Table',
    description: 'Show data in tabular format',
    subscription_tier: 'community'
  },
  {
    type: 'text' as WidgetType,
    name: 'Text',
    description: 'Add text descriptions and notes',
    subscription_tier: 'community'
  }
];

// Core Data Sources
export const coreDataSources = [
  {
    type: 'rest',
    name: 'REST API',
    description: 'Connect to REST APIs',
    subscription_tier: 'community'
  },
  {
    type: 'database',
    name: 'Database',
    description: 'Connect to databases',
    subscription_tier: 'starter'
  }
];

// Permission Templates by Core Subscription Tier
export const corePermissions = {
  community: {
    canCreateCustomDashboards: true,
    canShareDashboards: false,
    canExportData: false,
    maxDashboards: 3,
    maxWidgetsPerDashboard: 5,
    availableWidgets: ['chart', 'metric', 'table', 'text'],
    availableDataSources: ['rest']
  },
  starter: {
    canCreateCustomDashboards: true,
    canShareDashboards: true,
    canExportData: true,
    maxDashboards: 10,
    maxWidgetsPerDashboard: 10,
    availableWidgets: ['chart', 'metric', 'table', 'text', 'gauge'],
    availableDataSources: ['rest', 'database']
  },
  professional: {
    canCreateCustomDashboards: true,
    canShareDashboards: true,
    canExportData: true,
    maxDashboards: 50,
    maxWidgetsPerDashboard: 20,
    availableWidgets: ['chart', 'metric', 'table', 'text', 'gauge', 'custom'],
    availableDataSources: ['rest', 'database', 'stream']
  }
};
