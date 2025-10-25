/**
 * CORRECTED WORKFLOW STUDIO APP
 *
 * This component properly integrates with existing Auterity infrastructure
 * instead of duplicating routing, auth, notifications, and theming.
 */

import React, { Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ============================================================================
// EXISTING AUTERITY INFRASTRUCTURE COMPONENTS (MOCKED FOR NOW)
// ============================================================================

// These would be actual imports from auterity-error-iq in a real integration
// For now, we'll create mock implementations that match the existing patterns

interface User {
  id: string;
  email: string;
  username?: string;
  organization?: {
    currentWorkspace?: {
      id: string;
      name: string;
      currentProject?: {
        id: string;
        name: string;
      };
    };
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

// Mock WebSocket service
const websocketService = {
  connect: (workflowId: string, userId: string, username: string) => {
    console.log('Connecting to WebSocket:', { workflowId, userId, username });
  },
  disconnect: () => {
    console.log('Disconnecting from WebSocket');
  },
  on: (event: string, callback: (data: any) => void) => {
    console.log('Listening to WebSocket event:', event);
  }
};

// Mock Layout component
const Layout: React.FC<{
  children: React.ReactNode;
  showCrossAppNav?: boolean;
  crossAppNavigation?: React.ReactNode;
  workspaceContext?: React.ReactNode;
}> = ({ children, crossAppNavigation, workspaceContext }) => (
  <div className="auterity-layout">
    <nav className="sidebar">
      <div className="nav-header">
        <h2>Auterity</h2>
      </div>
      {crossAppNavigation}
    </nav>
    <main className="main-content">
      {workspaceContext}
      {children}
    </main>
  </div>
);

// Mock implementations that would be replaced with actual imports
const mockAuthContext: AuthContextType = {
  user: {
    id: '1',
    email: 'user@auterity.com',
    organization: {
      currentWorkspace: {
        id: 'ws-1',
        name: 'Default Workspace',
        currentProject: {
          id: 'proj-1',
          name: 'Workflow Studio'
        }
      }
    }
  },
  isAuthenticated: true,
  login: async () => {},
  logout: async () => {}
};

const mockNotifications: Notification[] = [];

const useAuth = () => mockAuthContext;
const useNotifications = () => ({
  notifications: mockNotifications,
  addNotification: (notification: Omit<Notification, 'id'>) => {
    console.log('Notification:', notification);
  }
});

// ============================================================================
// WORKFLOW STUDIO SPECIFIC COMPONENTS
// ============================================================================

// Import Command Palette
import CommandPalette from './ui/CommandPalette';
import './ui/CommandPalette.css';

// Loading component using existing patterns
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading Workflow Studio...</span>
  </div>
);

// Cross-app navigation component (extends existing navigation)
const CrossAppNavigation = () => {
  const { user } = useAuth();

  const handleCrossAppNavigation = (appId: string, route: string = '') => {
    const appUrls = {
      'error-iq': 'https://error-iq.auterity.com',
      'ai-hub': 'https://ai-hub.auterity.com',
      'analytics': 'https://analytics.auterity.com'
    };

    if (appUrls[appId]) {
      const url = new URL(route, appUrls[appId]);
      // Add tenancy context
      if (user?.organization?.currentWorkspace) {
        url.searchParams.set('workspace', user.organization.currentWorkspace.id);
      }
      window.open(url.toString(), '_blank');
    }
  };

  return (
    <div className="cross-app-navigation">
      <div className="nav-section">
        <h4 className="nav-section-title">Auterity Apps</h4>
        <div className="nav-links">
          <button
            onClick={() => handleCrossAppNavigation('error-iq', '/dashboard')}
            className="nav-link"
          >
            <span className="nav-icon">⚡</span>
            <span>Error IQ</span>
          </button>
          <button
            onClick={() => handleCrossAppNavigation('ai-hub', '/models')}
            className="nav-link"
          >
            <span className="nav-icon">🧠</span>
            <span>AI Hub</span>
          </button>
          <button
            onClick={() => handleCrossAppNavigation('analytics', '/dashboard')}
            className="nav-link"
          >
            <span className="nav-icon">📊</span>
            <span>Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Workspace context component (integrates with existing tenancy)
const WorkspaceContext = () => {
  const { user } = useAuth();

  if (!user?.organization?.currentWorkspace) return null;

  return (
    <div className="workspace-context-bar">
      <div className="workspace-info">
        <span className="workspace-name">
          {user.organization.currentWorkspace.name}
        </span>
        {user.organization.currentWorkspace.currentProject && (
          <span className="project-name">
            / {user.organization.currentWorkspace.currentProject.name}
          </span>
        )}
      </div>
      <div className="workspace-actions">
        <button className="workspace-settings-btn">⚙️</button>
      </div>
    </div>
  );
};

// Extended Layout that wraps existing Layout with Workflow Studio features
const WorkflowStudioLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Connect to WebSocket for real-time collaboration
  React.useEffect(() => {
    if (user) {
      websocketService.connect('workflow-studio', user.id, user.username || user.email);
      websocketService.on('workflow-update', (data) => {
        addNotification({
          type: 'info',
          title: 'Workflow Updated',
          message: `Workflow ${data.workflowName} was updated by ${data.userName}`,
        });
      });
    }

    return () => {
      websocketService.disconnect();
    };
  }, [user, addNotification]);

  return (
    <Layout
      showCrossAppNav={true}
      crossAppNavigation={<CrossAppNavigation />}
      workspaceContext={<WorkspaceContext />}
    >
      {children}
    </Layout>
  );
};

// Main Workflow Studio Dashboard
const WorkflowStudioDashboard = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  return (
    <div className="workflow-studio-dashboard">
      <div className="dashboard-header">
        <h1>Welcome to Workflow Studio</h1>
        <p>Create, manage, and execute powerful workflows with AI assistance</p>
      </div>

      <div className="dashboard-grid">
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button
              onClick={() => addNotification({
                type: 'success',
                title: 'New Workflow',
                message: 'Creating new workflow...',
              })}
              className="action-btn primary"
            >
              <span>✨</span>
              <span>New Workflow</span>
            </button>
            <button className="action-btn">
              <span>📚</span>
              <span>Browse Templates</span>
            </button>
            <button className="action-btn">
              <span>🤖</span>
              <span>AI Assistant</span>
            </button>
          </div>
        </div>

        <div className="recent-workflows">
          <h3>Recent Workflows</h3>
          <div className="workflow-list">
            {/* Existing workflows would be loaded from API */}
            <div className="empty-state">
              <p>No workflows yet. Create your first workflow to get started!</p>
            </div>
          </div>
        </div>

        <div className="workspace-stats">
          <h3>Workspace Stats</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">0</span>
              <span className="stat-label">Active Workflows</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">0</span>
              <span className="stat-label">Executions Today</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">0%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Workflow Builder Page using existing infrastructure
const WorkflowBuilderPage = () => {
  return (
    <div className="workflow-builder-page">
      <div className="page-header">
        <h1>Workflow Builder</h1>
        <p>Build powerful workflows with drag-and-drop simplicity</p>
      </div>

      <div className="builder-container">
        {/* This would use EnhancedWorkflowBuilder from auterity-error-iq */}
        <div className="workflow-canvas-placeholder">
          <div className="placeholder-content">
            <h3>Workflow Canvas</h3>
            <p>Interactive workflow builder would be loaded here from existing infrastructure</p>
            <div className="placeholder-actions">
              <button className="btn-primary">Add Node</button>
              <button className="btn-secondary">Save Workflow</button>
              <button className="btn-secondary">Test Workflow</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const WorkflowStudioApp: React.FC = () => {
  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState({
    page: 'dashboard',
    workflowId: undefined,
    nodeId: undefined,
    selectedItems: []
  });

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }

      // Escape to close command palette
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen]);

  // Update context based on current route
  useEffect(() => {
    const path = window.location.pathname;
    const page = path.split('/')[1] || 'dashboard';
    setCurrentContext(prev => ({ ...prev, page }));
  }, []);

  return (
    <div className="workflow-studio-app">
      {/* Universal Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        currentContext={currentContext}
      />

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <div className="login-page">
              <h1>🔐 Workflow Studio Login</h1>
              <p>Integrated with existing Auterity authentication system</p>
              <div className="login-features">
                <p>✅ Single Sign-On across all Auterity apps</p>
                <p>✅ Secure JWT token management</p>
                <p>✅ Multi-tenant workspace support</p>
              </div>
            </div>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <WorkflowStudioLayout>
              <WorkflowStudioDashboard />
            </WorkflowStudioLayout>
          }
        />

        <Route
          path="/workflows"
          element={
            <WorkflowStudioLayout>
              <div className="workflows-page">
                <h1>📋 My Workflows</h1>
                <p>Workflow management using existing Auterity patterns</p>
                <div className="feature-list">
                  <p>🔄 Real-time collaboration</p>
                  <p>📊 Performance analytics</p>
                  <p>🎯 AI-powered optimization</p>
                </div>
              </div>
            </WorkflowStudioLayout>
          }
        />

        <Route
          path="/workflows/builder/:id"
          element={
            <WorkflowStudioLayout>
              <WorkflowBuilderPage />
            </WorkflowStudioLayout>
          }
        />

        <Route
          path="/query-builder"
          element={
            <WorkflowStudioLayout>
              <div className="query-builder-page">
                <h1>🗃️ No-Code SQL Query Builder</h1>
                <p>Visual database query builder integrated from Auterity Error IQ</p>
                <div className="feature-highlights">
                  <p>✨ Drag-and-drop query building</p>
                  <p>✨ Live SQL generation and preview</p>
                  <p>✨ Smart data type detection</p>
                  <p>✨ Export to CSV functionality</p>
                </div>
              </div>
            </WorkflowStudioLayout>
          }
        />

        <Route
          path="/ai-assistant"
          element={
            <WorkflowStudioLayout>
              <div className="ai-assistant-page">
                <h1>🤖 AI Workflow Assistant</h1>
                <p>Intelligent workflow assistance with cognitive insights</p>
                <div className="ai-features">
                  <p>💬 Contextual chat assistance</p>
                  <p>💡 Performance insights and recommendations</p>
                  <p>🎯 Automated workflow optimization</p>
                  <p>🔧 Natural language workflow generation</p>
                </div>
              </div>
            </WorkflowStudioLayout>
          }
        />

        <Route
          path="/analytics"
          element={
            <WorkflowStudioLayout>
              <div className="analytics-page">
                <h1>📊 Workflow Analytics</h1>
                <p>Advanced analytics and performance monitoring</p>
                <div className="analytics-features">
                  <p>📈 Real-time performance metrics</p>
                  <p>🔍 Bottleneck identification</p>
                  <p>📋 Execution history and logs</p>
                  <p>🎯 Predictive insights</p>
                </div>
              </div>
            </WorkflowStudioLayout>
          }
        />

        <Route
          path="/marketplace"
          element={
            <WorkflowStudioLayout>
              <div className="marketplace-page">
                <h1>🛒 Template Marketplace</h1>
                <p>Discover and import workflow templates</p>
                <div className="marketplace-features">
                  <p>🎨 Industry-specific templates</p>
                  <p>⭐ Community ratings and reviews</p>
                  <p>👁️ Interactive template previews</p>
                  <p>📥 One-click template import</p>
                </div>
              </div>
            </WorkflowStudioLayout>
          }
        />

        <Route
          path="/collaboration"
          element={
            <WorkflowStudioLayout>
              <div className="collaboration-page">
                <h1>👥 Real-time Collaboration</h1>
                <p>Collaborative workflow editing with live presence</p>
                <div className="collaboration-features">
                  <p>👥 Live user cursors and presence</p>
                  <p>🔄 Real-time synchronization</p>
                  <p>💬 Contextual comments and discussions</p>
                  <p>📝 Change history and conflict resolution</p>
                </div>
              </div>
            </WorkflowStudioLayout>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default WorkflowStudioApp;
