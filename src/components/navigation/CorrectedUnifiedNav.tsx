/**
 * CORRECTED APPROACH: Extend Existing Auterity Navigation
 *
 * Instead of building new navigation components, extend the existing
 * Layout.tsx from auterity-error-iq with cross-app functionality.
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auterity-error-iq/frontend/src/contexts/AuthContext';
import { useNotifications } from '../../../auterity-error-iq/frontend/src/components/notifications/NotificationSystem';

// Import existing components from auterity-error-iq
import { ExistingLayout } from '../../../auterity-error-iq/frontend/src/components/Layout';
import { ExistingNavigation } from '../../../auterity-error-iq/frontend/src/components/Layout';

// Extend existing navigation items
const CROSS_APP_NAV_ITEMS = [
  {
    id: 'error-iq',
    label: 'Error IQ',
    href: 'https://error-iq.auterity.com/dashboard',
    icon: 'zap',
    external: true,
    description: 'Error monitoring and resolution'
  },
  {
    id: 'ai-hub',
    label: 'AI Hub',
    href: 'https://ai-hub.auterity.com/dashboard',
    icon: 'brain',
    external: true,
    description: 'AI model management'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: 'https://analytics.auterity.com/dashboard',
    icon: 'bar-chart',
    external: true,
    description: 'Business intelligence'
  }
];

interface ExtendedLayoutProps {
  children: React.ReactNode;
  showCrossAppNav?: boolean;
}

export const ExtendedAuterityLayout: React.FC<ExtendedLayoutProps> = ({
  children,
  showCrossAppNav = true
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  // Cross-app navigation handler
  const handleCrossAppNavigation = (app: typeof CROSS_APP_NAV_ITEMS[0]) => {
    if (app.external) {
      // Add tenancy context to external URLs
      const url = new URL(app.href);
      if (user?.organization?.currentWorkspace) {
        url.searchParams.set('workspace', user.organization.currentWorkspace.id);
      }
      window.open(url.toString(), '_blank');
    }
  };

  // Extend existing navigation with cross-app items
  const extendedNavItems = [
    ...ExistingNavigation, // Use existing navigation items
    ...(showCrossAppNav ? CROSS_APP_NAV_ITEMS : [])
  ];

  return (
    <ExistingLayout
      navigationItems={extendedNavItems}
      onNavigate={handleCrossAppNavigation}
      user={user}
      location={location}
    >
      {/* Add workspace context display */}
      {user?.organization?.currentWorkspace && (
        <div className="workspace-context-bar">
          <span className="workspace-name">
            {user.organization.currentWorkspace.name}
          </span>
          {user.organization.currentWorkspace.currentProject && (
            <span className="project-name">
              / {user.organization.currentWorkspace.currentProject.name}
            </span>
          )}
        </div>
      )}

      {children}
    </ExistingLayout>
  );
};

// Integration with Workflow Studio
export const WorkflowStudioWithAuterityNav = () => {
  return (
    <ExtendedAuterityLayout showCrossAppNav={true}>
      {/* Existing Workflow Studio routes and components */}
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/workflows/builder/:id" element={<WorkflowBuilder />} />
        {/* ... existing routes ... */}
      </Routes>
    </ExtendedAuterityLayout>
  );
};

// Cross-app navigation hook using existing infrastructure
export const useAuterityCrossAppNavigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navigateToErrorIQ = React.useCallback((params?: {
    errorId?: string;
    workflowId?: string;
  }) => {
    const baseUrl = 'https://error-iq.auterity.com';
    const url = new URL('/dashboard', baseUrl);

    // Add tenancy context
    if (user?.organization?.currentWorkspace) {
      url.searchParams.set('workspace', user.organization.currentWorkspace.id);
    }

    // Add specific parameters
    if (params?.errorId) url.searchParams.set('error', params.errorId);
    if (params?.workflowId) url.searchParams.set('workflow', params.workflowId);

    window.open(url.toString(), '_blank');
  }, [user]);

  const navigateToAIHub = React.useCallback((params?: {
    functionName?: string;
    modelId?: string;
  }) => {
    const baseUrl = 'https://ai-hub.auterity.com';
    const url = new URL('/dashboard', baseUrl);

    // Add tenancy context
    if (user?.organization?.currentWorkspace) {
      url.searchParams.set('workspace', user.organization.currentWorkspace.id);
    }

    window.open(url.toString(), '_blank');
  }, [user]);

  const navigateToAnalytics = React.useCallback((params?: {
    workflowId?: string;
    executionId?: string;
  }) => {
    const baseUrl = 'https://analytics.auterity.com';
    const url = new URL('/dashboard', baseUrl);

    // Add tenancy context
    if (user?.organization?.currentWorkspace) {
      url.searchParams.set('workspace', user.organization.currentWorkspace.id);
    }

    window.open(url.toString(), '_blank');
  }, [user]);

  return {
    navigateToErrorIQ,
    navigateToAIHub,
    navigateToAnalytics
  };
};
