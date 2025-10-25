import React, { Suspense, lazy } from 'react';
import { useStudioStore } from '../../hooks/useStudioStore.js';
import { EnhancedCanvas } from '../canvas/EnhancedCanvas.js';
import {
  CogIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import './StudioLayout.css';

// Lazy load heavy components
const NodePalette = lazy(() => import('../panels/NodePalette.js').then(module => ({ default: module.NodePalette })));
const PropertiesPanel = lazy(() => import('../panels/PropertiesPanel.js').then(module => ({ default: module.PropertiesPanel })));
const SimulationManager = lazy(() => import('../SimulationManager.js').then(module => ({ default: module.SimulationManager })));
const Toolbar = lazy(() => import('../toolbar/Toolbar.js').then(module => ({ default: module.Toolbar })));
const Minimap = lazy(() => import('../minimap/Minimap.js').then(module => ({ default: module.Minimap })));
const PerformanceMonitor = lazy(() => import('../PerformanceMonitor.js').then(module => ({ default: module.PerformanceMonitor })));
const AIDashboard = lazy(() => import('../ai/AIDashboard.js').then(module => ({ default: module.AIDashboard })));

// Loading fallback component
const LoadingFallback: React.FC<{ name: string }> = ({ name }) => (
  <div className="component-loading-fallback">
    <div className="loading-spinner"></div>
    <span>Loading {name}...</span>
  </div>
);

// Panel loading wrapper
const PanelWrapper: React.FC<{
  children: React.ReactNode;
  name: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, name, className, style }) => (
  <div className={className} style={style}>
    <Suspense fallback={<LoadingFallback name={name} />}>
      {children}
    </Suspense>
  </div>
);

interface StudioLayoutProps {
  onLogout?: () => void;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({ onLogout }) => {
  const { state, actions } = useStudioStore();

  const handlePanelResize = (panelName: keyof typeof state.panels, width: number) => {
    actions.resizePanel(panelName, width);
  };

  return (
    <div className="studio-layout" data-theme={state.theme.name}>
      {/* Header Toolbar */}
      {state.panels.toolbar.visible && state.panels.toolbar.position === 'top' && (
        <div className="studio-header">
          <Suspense fallback={<LoadingFallback name="Toolbar" />}>
            <Toolbar />
          </Suspense>

          {/* User Menu */}
          <div className="studio-user-menu">
            <button className="user-menu-button">
              <div className="user-avatar">
                {state.auth.user?.avatar ? (
                  <img src={state.auth.user.avatar} alt={state.auth.user.name} />
                ) : (
                  <span>{state.auth.user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{state.auth.user?.name}</span>
                <span className="user-email">{state.auth.user?.email}</span>
              </div>
              <span className="user-menu-arrow">▼</span>
            </button>

            <div className="user-menu-dropdown">
              <div className="user-menu-header">
                <div className="user-avatar-large">
                  {state.auth.user?.avatar ? (
                    <img src={state.auth.user.avatar} alt={state.auth.user.name} />
                  ) : (
                    <span>{state.auth.user?.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="user-details">
                  <div className="user-name-large">{state.auth.user?.name}</div>
                  <div className="user-email-large">{state.auth.user?.email}</div>
                  <div className="user-organization">{state.auth.user?.organization?.name}</div>
                </div>
              </div>

              <div className="user-menu-divider"></div>

              <div className="user-menu-section">
                <h4>Workspace</h4>
                <div className="workspace-info">
                  <div className="current-workspace">
                    {state.workspace.currentWorkspace?.name || 'No workspace selected'}
                  </div>
                  <div className="current-project">
                    {state.workspace.currentProject?.name || 'No project selected'}
                  </div>
                </div>
              </div>

              <div className="user-menu-divider"></div>

              <button className="user-menu-item">
                <CogIcon className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button className="user-menu-item">
                <ChartBarIcon className="w-4 h-4" />
                <span>Usage & Billing</span>
              </button>

              <button className="user-menu-item">
                <QuestionMarkCircleIcon className="w-4 h-4" />
                <span>Help & Support</span>
              </button>

              <div className="user-menu-divider"></div>

              <button className="user-menu-item logout-button" onClick={onLogout}>
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="studio-main">
        {/* Left Panel - Node Palette */}
        {state.panels.nodePalette.visible && (
          <div 
            className="studio-left-panel"
            style={{ width: state.panels.nodePalette.width }}
          >
            <Suspense fallback={<LoadingFallback name="Node Palette" />}>
              <NodePalette 
                width={state.panels.nodePalette.width}
                collapsed={state.panels.nodePalette.collapsed}
                onResize={(width) => handlePanelResize('nodePalette', width)}
                onToggleCollapse={() => actions.togglePanel('nodePalette')}
              />
            </Suspense>
          </div>
        )}

        {/* Canvas Area */}
        <div className="studio-canvas-container">
          <EnhancedCanvas />
          
          {/* Minimap Overlay */}
          {state.panels.minimap.visible && (
            <div className="studio-minimap-overlay">
              <Suspense fallback={<LoadingFallback name="Minimap" />}>
                <Minimap 
                  width={state.panels.minimap.width}
                  height={state.panels.minimap.height}
                />
              </Suspense>
            </div>
          )}
        </div>

        {/* Right Panels */}
        <div className="studio-right-panels">
          {/* Properties Panel */}
          {state.panels.properties.visible && (
            <div
              className="studio-right-panel"
              style={{ width: state.panels.properties.width }}
            >
              <Suspense fallback={<LoadingFallback name="Properties Panel" />}>
                <PropertiesPanel
                  width={state.panels.properties.width}
                  collapsed={state.panels.properties.collapsed}
                  onResize={(width) => handlePanelResize('properties', width)}
                  onToggleCollapse={() => actions.togglePanel('properties')}
                />
              </Suspense>
            </div>
          )}

          {/* AI Dashboard Panel */}
          {state.panels.aiDashboard.visible && (
            <div
              className="studio-right-panel"
              style={{ width: state.panels.aiDashboard.width }}
            >
              <Suspense fallback={<LoadingFallback name="AI Dashboard" />}>
                <AIDashboard
                  width={state.panels.aiDashboard.width}
                  collapsed={state.panels.aiDashboard.collapsed}
                  onResize={(width) => handlePanelResize('aiDashboard', width)}
                  onToggleCollapse={() => actions.togglePanel('aiDashboard')}
                />
              </Suspense>
            </div>
          )}

          {/* Debug Panel */}
          <Suspense fallback={<LoadingFallback name="Simulation Manager" />}>
            <SimulationManager />
          </Suspense>
        </div>
      </div>

      {/* Footer Toolbar */}
      {state.panels.toolbar.visible && state.panels.toolbar.position === 'bottom' && (
        <div className="studio-footer">
          <Suspense fallback={<LoadingFallback name="Toolbar" />}>
            <Toolbar />
          </Suspense>
        </div>
      )}

      {/* Performance Monitor */}
      <Suspense fallback={null}>
        <PerformanceMonitor />
      </Suspense>
    </div>
  );
};
