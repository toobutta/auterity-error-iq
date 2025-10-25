import React, { useState, useCallback } from 'react';
import {
  Squares2X2Icon,
  CircleStackIcon,
  CpuChipIcon,
  UserIcon,
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  FolderIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import './UnifiedNavigation.css';

// System types
type SystemType = 'AutoMatrix' | 'RelayCore' | 'NeuroWeaver';

// Navigation context
interface NavigationContext {
  workspace: string;
  project: string;
  path: string[];
}

interface UnifiedNavigationProps {
  currentSystem?: SystemType;
  context?: NavigationContext;
  onSystemChange?: (system: SystemType) => void;
  onContextChange?: (context: NavigationContext) => void;
  userName?: string;
  userAvatar?: string;
  className?: string;
}

export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = ({
  currentSystem = 'AutoMatrix',
  context = { workspace: 'Default', project: 'My Project', path: [] },
  onSystemChange,
  onContextChange,
  userName = 'User',
  userAvatar,
  className = ''
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  
  // Handle system change
  const handleSystemChange = useCallback((system: SystemType) => {
    if (onSystemChange) {
      onSystemChange(system);
    }
  }, [onSystemChange]);
  
  // Handle workspace change
  const handleWorkspaceChange = useCallback((workspace: string) => {
    if (onContextChange) {
      onContextChange({ ...context, workspace, project: '', path: [] });
    }
    setIsWorkspaceMenuOpen(false);
  }, [context, onContextChange]);
  
  // Handle project change
  const handleProjectChange = useCallback((project: string) => {
    if (onContextChange) {
      onContextChange({ ...context, project, path: [] });
    }
  }, [context, onContextChange]);
  
  // Handle path navigation
  const handlePathClick = useCallback((index: number) => {
    if (onContextChange && index < context.path.length) {
      onContextChange({
        ...context,
        path: context.path.slice(0, index + 1)
      });
    }
  }, [context, onContextChange]);
  
  // Get system icon
  const getSystemIcon = (system: SystemType) => {
    switch (system) {
      case 'AutoMatrix':
        return <Squares2X2Icon className="system-icon" />;
      case 'RelayCore':
        return <CpuChipIcon className="system-icon" />;
      case 'NeuroWeaver':
        return <CircleStackIcon className="system-icon" />;
      default:
        return <Squares2X2Icon className="system-icon" />;
    }
  };
  
  // Get system color
  const getSystemColor = (system: SystemType) => {
    switch (system) {
      case 'AutoMatrix':
        return 'blue';
      case 'RelayCore':
        return 'purple';
      case 'NeuroWeaver':
        return 'green';
      default:
        return 'blue';
    }
  };
  
  return (
    <div className={`unified-navigation ${className}`}>
      {/* System Tabs */}
      <div className="system-tabs">
        <button
          className={`system-tab ${currentSystem === 'AutoMatrix' ? 'active' : ''} system-color-blue`}
          onClick={() => handleSystemChange('AutoMatrix')}
          title="AutoMatrix Workflow Engine"
        >
          <Squares2X2Icon className="system-icon" />
          <span className="system-name">AutoMatrix</span>
        </button>
        
        <button
          className={`system-tab ${currentSystem === 'RelayCore' ? 'active' : ''} system-color-purple`}
          onClick={() => handleSystemChange('RelayCore')}
          title="RelayCore AI Router"
        >
          <CpuChipIcon className="system-icon" />
          <span className="system-name">RelayCore</span>
        </button>
        
        <button
          className={`system-tab ${currentSystem === 'NeuroWeaver' ? 'active' : ''} system-color-green`}
          onClick={() => handleSystemChange('NeuroWeaver')}
          title="NeuroWeaver Model Management"
        >
          <CircleStackIcon className="system-icon" />
          <span className="system-name">NeuroWeaver</span>
        </button>
      </div>
      
      {/* Context Bar */}
      <div className="context-bar">
        {/* Workspace Selector */}
        <div className="workspace-selector">
          <button
            className="workspace-button"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
          >
            <FolderIcon className="workspace-icon" />
            <span className="workspace-name">{context.workspace}</span>
            <ChevronDownIcon className="dropdown-icon" />
          </button>
          
          {isWorkspaceMenuOpen && (
            <div className="workspace-dropdown">
              <div className="dropdown-header">
                <h4>Workspaces</h4>
              </div>
              <div className="dropdown-items">
                <button
                  className={`dropdown-item ${context.workspace === 'Production' ? 'active' : ''}`}
                  onClick={() => handleWorkspaceChange('Production')}
                >
                  <FolderIcon className="item-icon" />
                  <span>Production</span>
                </button>
                <button
                  className={`dropdown-item ${context.workspace === 'Development' ? 'active' : ''}`}
                  onClick={() => handleWorkspaceChange('Development')}
                >
                  <FolderIcon className="item-icon" />
                  <span>Development</span>
                </button>
                <button
                  className={`dropdown-item ${context.workspace === 'Testing' ? 'active' : ''}`}
                  onClick={() => handleWorkspaceChange('Testing')}
                >
                  <FolderIcon className="item-icon" />
                  <span>Testing</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb-navigation">
          <div className="breadcrumb-item">
            <HomeIcon className="breadcrumb-icon" />
          </div>
          
          <div className="breadcrumb-separator">
            <ChevronRightIcon className="separator-icon" />
          </div>
          
          <div className="breadcrumb-item">
            <span>{context.workspace}</span>
          </div>
          
          {context.project && (
            <>
              <div className="breadcrumb-separator">
                <ChevronRightIcon className="separator-icon" />
              </div>
              
              <div className="breadcrumb-item">
                <span>{context.project}</span>
              </div>
            </>
          )}
          
          {context.path.map((pathItem, index) => (
            <React.Fragment key={index}>
              <div className="breadcrumb-separator">
                <ChevronRightIcon className="separator-icon" />
              </div>
              
              <div
                className="breadcrumb-item"
                onClick={() => handlePathClick(index)}
              >
                <span>{pathItem}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* User Menu */}
      <div className="user-menu">
        <button
          className="user-button"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        >
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="user-avatar" />
          ) : (
            <div className="user-avatar-placeholder">
              <UserIcon className="avatar-icon" />
            </div>
          )}
          <span className="user-name">{userName}</span>
          <ChevronDownIcon className="dropdown-icon" />
        </button>
        
        {isUserMenuOpen && (
          <div className="user-dropdown">
            <div className="dropdown-header">
              <div className="user-info">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="user-avatar-large" />
                ) : (
                  <div className="user-avatar-large-placeholder">
                    <UserIcon className="avatar-icon-large" />
                  </div>
                )}
                <div className="user-details">
                  <h4>{userName}</h4>
                  <p>user@example.com</p>
                </div>
              </div>
            </div>
            
            <div className="dropdown-divider"></div>
            
            <div className="dropdown-items">
              <button className="dropdown-item">
                <CogIcon className="item-icon" />
                <span>Settings</span>
              </button>
              <button className="dropdown-item">
                <DocumentIcon className="item-icon" />
                <span>Documentation</span>
              </button>
              <button className="dropdown-item logout">
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* System Indicator */}
      <div className={`system-indicator system-color-${getSystemColor(currentSystem)}`}>
        {getSystemIcon(currentSystem)}
        <span className="system-indicator-name">{currentSystem}</span>
      </div>
    </div>
  );
};

export default UnifiedNavigation;
