import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UnifiedNavigation } from '@shared/components/Navigation';
import { Button } from '@auterity/design-system';
import { FeatureGateProvider, SubscriptionStatus, useDeploymentType, FeatureGate } from './components/enterprise/FeatureGate';
import N8nManagementPage from './pages/n8n/N8nManagementPage';
import EnterpriseDashboard from './pages/EnterpriseDashboard';

// System switcher items
const systemItems = [
  {
    id: 'workflow-studio',
    name: 'Workflow Studio',
    icon: '🎨',
    href: '/',
    status: 'active' as const,
    description: 'Visual workflow builder'
  },
  {
    id: 'automatrix',
    name: 'AutoMatrix',
    icon: '⚡',
    href: '/automatrix',
    status: 'active' as const,
    description: 'Workflow execution engine'
  },
  {
    id: 'relaycore',
    name: 'RelayCore',
    icon: '🔄',
    href: '/relaycore',
    status: 'active' as const,
    description: 'AI routing & optimization'
  },
  {
    id: 'neuroweaver',
    name: 'NeuroWeaver',
    icon: '🧠',
    href: '/neuroweaver',
    status: 'active' as const,
    description: 'ML model management'
  }
];

// Navigation items with subscription-based visibility
const NavigationItemsWithSubscription: React.FC = () => {
  const deploymentType = useDeploymentType();

  const baseNavigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      href: '/dashboard'
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: '🔧',
      href: '/workflows'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: '📋',
      href: '/templates'
    }
  ];

  const enterpriseNavigationItems = [
    {
      id: 'n8n-integration',
      label: 'n8n Integration',
      icon: '⚡',
      href: '/n8n'
    },
    {
      id: 'enterprise-dashboard',
      label: 'Enterprise',
      icon: '🏢',
      href: '/enterprise'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      href: '/analytics',
      badge: '3'
    }
  ];

  const allNavigationItems = [
    ...baseNavigationItems,
    ...enterpriseNavigationItems,
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      href: '/settings'
    }
  ];

  return (
    <>
      {allNavigationItems.map((item) => {
        // Gate enterprise features
        if (['n8n-integration', 'enterprise-dashboard', 'analytics'].includes(item.id)) {
          return (
            <FeatureGate
              key={item.id}
              feature={item.id === 'n8n-integration' ? 'temporalWorkflows' :
                      item.id === 'enterprise-dashboard' ? 'enterpriseSecurity' :
                      'advancedAnalytics'}
              fallback={
                <div key={item.id} className="px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
                  {item.icon} {item.label} (Premium)
                </div>
              }
            >
              <div key={item.id} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded">
                {item.icon} {item.label}
                {item.badge && <span className="ml-2 bg-red-500 text-white text-xs px-1 rounded">{item.badge}</span>}
              </div>
            </FeatureGate>
          );
        }

        return (
          <div key={item.id} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded">
            {item.icon} {item.label}
            {item.badge && <span className="ml-2 bg-red-500 text-white text-xs px-1 rounded">{item.badge}</span>}
          </div>
        );
      })}
    </>
  );
};

// Enhanced Home Page with Subscription Features
const HomePage: React.FC = () => {
  const deploymentType = useDeploymentType();

  const getDeploymentMessage = () => {
    switch (deploymentType) {
      case 'saas':
        return 'You are using the Auterity SaaS platform with enterprise-grade features.';
      case 'white-label':
        return 'You are using a white-label deployment customized for your organization.';
      case 'self-hosted':
        return 'You are using a self-hosted deployment with full control and customization.';
      default:
        return 'Welcome to Auterity Workflow Studio.';
    }
  };

  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Subscription Status Banner */}
        <div className="mb-6">
          <SubscriptionStatus />
        </div>

        {/* Deployment Type Indicator */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">
              {deploymentType === 'saas' ? '☁️' : deploymentType === 'white-label' ? '🏷️' : '🏠'}
            </span>
            <div>
              <h3 className="font-semibold text-blue-900 capitalize">
                {deploymentType.replace('-', ' ')} Deployment
              </h3>
              <p className="text-sm text-blue-700">{getDeploymentMessage()}</p>
            </div>
          </div>
        </div>

        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Auterity Workflow Studio
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Build and manage your workflows with our unified AI platform
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Feature Cards with Subscription Gating */}
              <FeatureGate
                feature="workflowCanvas"
                fallback={
                  <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="text-center">
                      <span className="text-3xl mb-4 block">🎨</span>
                      <h3 className="font-semibold mb-2">Visual Workflow Builder</h3>
                      <p className="text-sm text-gray-600 mb-4">Available in Professional plans</p>
                      <Button variant="outline" size="sm">Upgrade to Unlock</Button>
                    </div>
                  </div>
                }
              >
                <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="text-center">
                    <span className="text-3xl mb-4 block">🎨</span>
                    <h3 className="font-semibold mb-2">Visual Workflow Builder</h3>
                    <p className="text-sm text-gray-600 mb-4">Drag & drop AI nodes to create powerful workflows</p>
                    <Button variant="primary" size="sm">Create Workflow</Button>
                  </div>
                </div>
              </FeatureGate>

              <FeatureGate
                feature="temporalWorkflows"
                fallback={
                  <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="text-center">
                      <span className="text-3xl mb-4 block">⚡</span>
                      <h3 className="font-semibold mb-2">Advanced Orchestration</h3>
                      <p className="text-sm text-gray-600 mb-4">Available in Professional plans</p>
                      <Button variant="outline" size="sm">Upgrade to Unlock</Button>
                    </div>
                  </div>
                }
              >
                <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="text-center">
                    <span className="text-3xl mb-4 block">⚡</span>
                    <h3 className="font-semibold mb-2">Advanced Orchestration</h3>
                    <p className="text-sm text-gray-600 mb-4">Reliable workflow execution with Temporal</p>
                    <Button variant="primary" size="sm">View Orchestrator</Button>
                  </div>
                </div>
              </FeatureGate>

              <FeatureGate
                feature="novitaAI"
                fallback={
                  <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="text-center">
                      <span className="text-3xl mb-4 block">🤖</span>
                      <h3 className="font-semibold mb-2">200+ AI Models</h3>
                      <p className="text-sm text-gray-600 mb-4">Available in Enterprise plans</p>
                      <Button variant="outline" size="sm">Upgrade to Unlock</Button>
                    </div>
                  </div>
                }
              >
                <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="text-center">
                    <span className="text-3xl mb-4 block">🤖</span>
                    <h3 className="font-semibold mb-2">200+ AI Models</h3>
                    <p className="text-sm text-gray-600 mb-4">Access diverse AI models with smart routing</p>
                    <Button variant="primary" size="sm">Browse Models</Button>
                  </div>
                </div>
              </FeatureGate>
            </div>

            <div className="space-x-4">
              <Button variant="primary" size="lg">
                Create New Workflow
              </Button>
              <Button variant="outline" size="lg">
                Browse Templates
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

// Custom Navigation Component with Subscription
const CustomNavigation: React.FC = () => {
  const handleSystemChange = (systemId: string) => {

    // In a real implementation, this would navigate to the system
  };

  const handleNavigation = (item: any) => {

    // In a real implementation, this would handle navigation
  };

  return (
    <UnifiedNavigation
      currentSystem="workflow-studio"
      navigationItems={<NavigationItemsWithSubscription />}
      systemItems={systemItems}
      user={{
        name: 'John Doe',
        role: 'admin'
      }}
      onSystemChange={handleSystemChange}
      onNavigation={handleNavigation}
    />
  );
};

const App: React.FC = () => {
  return (
    <FeatureGateProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <CustomNavigation />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/n8n" element={
              <FeatureGate
                feature="temporalWorkflows"
                fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">🔒</span>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h2>
                      <p className="text-gray-600 mb-4">n8n Integration requires a Professional or Enterprise plan.</p>
                      <Button variant="primary">Upgrade Plan</Button>
                    </div>
                  </div>
                }
              >
                <N8nManagementPage />
              </FeatureGate>
            } />
            <Route path="/enterprise" element={
              <FeatureGate
                feature="enterpriseSecurity"
                fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">🏢</span>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Enterprise Feature</h2>
                      <p className="text-gray-600 mb-4">Enterprise Dashboard requires an Enterprise plan.</p>
                      <Button variant="primary">Upgrade to Enterprise</Button>
                    </div>
                  </div>
                }
              >
                <EnterpriseDashboard />
              </FeatureGate>
            } />
            {/* Add more routes as needed */}
            <Route path="/dashboard" element={<HomePage />} />
            <Route path="/workflows" element={<HomePage />} />
            <Route path="/templates" element={<HomePage />} />
            <Route path="/analytics" element={<HomePage />} />
            <Route path="/settings" element={<HomePage />} />
          </Routes>
        </div>
      </Router>
    </FeatureGateProvider>
  );
};

export default App;

