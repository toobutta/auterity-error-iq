import { DashboardTemplate, ChartType, WidgetType } from '../../types/dashboard';

// Base template interface extending DashboardTemplate
interface IndustryDashboardTemplate extends DashboardTemplate {
  industry: string;
  compliance_requirements?: string[];
  recommended_widgets: WidgetType[];
  data_sources: string[];
  subscription_tier: 'community' | 'starter' | 'professional' | 'enterprise';
}

// Healthcare Dashboard Templates
export const healthcareDashboards: IndustryDashboardTemplate[] = [
  {
    id: 'healthcare-operations',
    name: 'Healthcare Operations Dashboard',
    description: 'Complete overview of healthcare operations with HIPAA compliance monitoring',
    category: 'healthcare',
    industry: 'healthcare',
    layout: {
      type: 'grid',
      columns: 3,
      gap: 20
    },
    widgets: [
      {
        type: 'metric',
        title: 'Patient Flow',
        data_source_type: 'database',
        position: { x: 0, y: 0, width: 1, height: 1 }
      },
      {
        type: 'chart',
        title: 'Admission Trends',
        chart_type: 'line' as ChartType,
        data_source_type: 'database',
        position: { x: 1, y: 0, width: 2, height: 1 }
      },
      {
        type: 'compliance',
        title: 'HIPAA Compliance Status',
        data_source_type: 'rest',
        position: { x: 0, y: 1, width: 1, height: 1 }
      }
    ],
    theme: 'medical',
    tags: ['healthcare', 'operations', 'HIPAA', 'compliance'],
    compliance_requirements: ['HIPAA', 'HITECH'],
    recommended_widgets: ['chart', 'metric', 'table', 'compliance'],
    data_sources: ['EHR', 'Claims', 'Appointments'],
    subscription_tier: 'enterprise',
    is_featured: true,
    usage_count: 0,
    review_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Financial Services Dashboard Templates
export const financialDashboards: IndustryDashboardTemplate[] = [
  {
    id: 'financial-risk-analytics',
    name: 'Risk Analytics Dashboard',
    description: 'Comprehensive risk analysis and compliance monitoring for financial institutions',
    category: 'financial',
    industry: 'finance',
    layout: {
      type: 'grid',
      columns: 4,
      gap: 16
    },
    widgets: [
      {
        type: 'gauge',
        title: 'Risk Score',
        data_source_type: 'rest',
        position: { x: 0, y: 0, width: 1, height: 1 }
      },
      {
        type: 'chart',
        title: 'Transaction Volume',
        chart_type: 'bar' as ChartType,
        data_source_type: 'stream',
        position: { x: 1, y: 0, width: 2, height: 1 }
      },
      {
        type: 'compliance',
        title: 'Regulatory Compliance',
        data_source_type: 'rest',
        position: { x: 3, y: 0, width: 1, height: 2 }
      }
    ],
    theme: 'financial',
    tags: ['finance', 'risk', 'compliance', 'analytics'],
    compliance_requirements: ['SOX', 'PCI-DSS'],
    recommended_widgets: ['chart', 'gauge', 'table', 'compliance'],
    data_sources: ['Market Data', 'Transaction Systems', 'Risk Models'],
    subscription_tier: 'enterprise',
    is_featured: true,
    usage_count: 0,
    review_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Automotive Dashboard Templates
export const automotiveDashboards: IndustryDashboardTemplate[] = [
  {
    id: 'dealership-operations',
    name: 'Dealership Operations Dashboard',
    description: 'Real-time overview of dealership performance and inventory management',
    category: 'automotive',
    industry: 'automotive',
    layout: {
      type: 'grid',
      columns: 3,
      gap: 20
    },
    widgets: [
      {
        type: 'metric',
        title: 'Sales Performance',
        data_source_type: 'database',
        position: { x: 0, y: 0, width: 1, height: 1 }
      },
      {
        type: 'chart',
        title: 'Inventory Levels',
        chart_type: 'bar' as ChartType,
        data_source_type: 'database',
        position: { x: 1, y: 0, width: 2, height: 1 }
      },
      {
        type: 'table',
        title: 'Service Appointments',
        data_source_type: 'rest',
        position: { x: 0, y: 1, width: 2, height: 1 }
      }
    ],
    theme: 'automotive',
    tags: ['automotive', 'dealership', 'sales', 'service'],
    recommended_widgets: ['chart', 'metric', 'table', 'map'],
    data_sources: ['DMS', 'Inventory', 'Service'],
    subscription_tier: 'professional',
    is_featured: true,
    usage_count: 0,
    review_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Template Categories
export const industryCategories = {
  healthcare: {
    name: 'Healthcare',
    description: 'Templates for healthcare providers and medical facilities',
    compliance: ['HIPAA', 'HITECH'],
    templates: healthcareDashboards,
    minTier: 'enterprise'
  },
  financial: {
    name: 'Financial Services',
    description: 'Templates for banks, investment firms, and financial institutions',
    compliance: ['SOX', 'PCI-DSS'],
    templates: financialDashboards,
    minTier: 'enterprise'
  },
  automotive: {
    name: 'Automotive',
    description: 'Templates for dealerships and automotive services',
    compliance: [],
    templates: automotiveDashboards,
    minTier: 'professional'
  }
};

// Widget Categories by Industry
export const industryWidgets = {
  healthcare: [
    {
      type: 'patient-flow' as WidgetType,
      name: 'Patient Flow',
      description: 'Track patient admission, discharge, and transfer metrics',
      subscription_tier: 'enterprise'
    },
    {
      type: 'compliance-monitor' as WidgetType,
      name: 'Compliance Monitor',
      description: 'HIPAA compliance monitoring and alerts',
      subscription_tier: 'enterprise'
    }
  ],
  financial: [
    {
      type: 'risk-gauge' as WidgetType,
      name: 'Risk Gauge',
      description: 'Real-time risk assessment metrics',
      subscription_tier: 'enterprise'
    },
    {
      type: 'transaction-monitor' as WidgetType,
      name: 'Transaction Monitor',
      description: 'Real-time transaction monitoring and analysis',
      subscription_tier: 'enterprise'
    }
  ],
  automotive: [
    {
      type: 'inventory-tracker' as WidgetType,
      name: 'Inventory Tracker',
      description: 'Real-time inventory management and analytics',
      subscription_tier: 'professional'
    },
    {
      type: 'service-scheduler' as WidgetType,
      name: 'Service Scheduler',
      description: 'Service appointment management and tracking',
      subscription_tier: 'professional'
    }
  ]
};

// Data Source Connectors by Industry
export const industryDataSources = {
  healthcare: [
    {
      type: 'ehr',
      name: 'Electronic Health Records',
      description: 'Integration with major EHR systems',
      subscription_tier: 'enterprise'
    },
    {
      type: 'claims',
      name: 'Claims Processing',
      description: 'Insurance claims data integration',
      subscription_tier: 'enterprise'
    }
  ],
  financial: [
    {
      type: 'market-data',
      name: 'Market Data Feed',
      description: 'Real-time market data integration',
      subscription_tier: 'enterprise'
    },
    {
      type: 'transaction-system',
      name: 'Transaction Systems',
      description: 'Core banking system integration',
      subscription_tier: 'enterprise'
    }
  ],
  automotive: [
    {
      type: 'dms',
      name: 'Dealer Management System',
      description: 'DMS integration for dealerships',
      subscription_tier: 'professional'
    },
    {
      type: 'inventory',
      name: 'Inventory Management',
      description: 'Real-time inventory tracking',
      subscription_tier: 'professional'
    }
  ]
};

// Permission Templates by Subscription Tier
export const tierPermissions = {
  community: {
    canCreateCustomDashboards: true,
    canShareDashboards: false,
    canExportData: false,
    canAccessTemplates: false,
    maxDashboards: 3,
    maxWidgetsPerDashboard: 5
  },
  starter: {
    canCreateCustomDashboards: true,
    canShareDashboards: true,
    canExportData: true,
    canAccessTemplates: true,
    maxDashboards: 10,
    maxWidgetsPerDashboard: 10
  },
  professional: {
    canCreateCustomDashboards: true,
    canShareDashboards: true,
    canExportData: true,
    canAccessTemplates: true,
    maxDashboards: 50,
    maxWidgetsPerDashboard: 20,
    canAccessIndustryTemplates: ['automotive']
  },
  enterprise: {
    canCreateCustomDashboards: true,
    canShareDashboards: true,
    canExportData: true,
    canAccessTemplates: true,
    maxDashboards: -1, // unlimited
    maxWidgetsPerDashboard: -1, // unlimited
    canAccessIndustryTemplates: ['automotive', 'healthcare', 'financial']
  }
};
