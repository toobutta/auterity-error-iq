import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Workflow,
  Database,
  Brain,
  Settings,
  Bell,
  User,
  ChevronDown,
  Menu,
  Sun,
  Moon,
  X,
  ExternalLink,
  Zap,
  BarChart3,
  Shield,
  CreditCard
} from 'lucide-react';
import { TaskCenterIntegration } from '../notifications/TaskCenterIntegration';
import { useStudioStore } from '../../hooks/useStudioStore';
import { authService } from '../../services/authService';

// Application configuration
interface Application {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  external: boolean;
  category: 'core' | 'ai' | 'analytics' | 'admin';
  requiredScopes?: string[];
  features?: string[];
}

const APPLICATIONS: Application[] = [
  {
    id: 'error-iq',
    name: 'Error IQ',
    description: 'Intelligent error monitoring and resolution',
    icon: Zap,
    url: 'https://error-iq.auterity.com',
    external: true,
    category: 'core',
    features: ['Error Detection', 'Auto-Resolution', 'Analytics']
  },
  {
    id: 'workflow-studio',
    name: 'Workflow Studio',
    description: 'Visual workflow builder and automation',
    icon: Workflow,
    url: '/dashboard', // Internal route
    external: false,
    category: 'core',
    requiredScopes: ['studio.read'],
    features: ['Drag & Drop', 'AI Integration', 'Real-time Execution']
  },
  {
    id: 'ai-hub',
    name: 'AI Hub',
    description: 'Centralized AI model management and orchestration',
    icon: Brain,
    url: 'https://ai-hub.auterity.com',
    external: true,
    category: 'ai',
    requiredScopes: ['ai.call'],
    features: ['Model Registry', 'Function Calling', 'Cost Tracking']
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Business intelligence and reporting',
    icon: BarChart3,
    url: 'https://analytics.auterity.com',
    external: true,
    category: 'analytics',
    features: ['Dashboards', 'Reports', 'Real-time Metrics']
  }
];

// Navigation items for the current application
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
  category?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and analytics'
  },
  {
    id: 'workflows',
    label: 'Workflows',
    href: '/workflows',
    icon: Workflow,
    description: 'Automation workflows'
  },
  {
    id: 'templates',
    label: 'Templates',
    href: '/templates',
    icon: Database,
    description: 'Reusable templates'
  },
  {
    id: 'ai',
    label: 'AI Hub',
    href: '/ai',
    icon: Brain,
    description: 'AI models and functions'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Reports and insights'
  },
  {
    id: 'security',
    label: 'Security',
    href: '/security',
    icon: Shield,
    description: 'Security center'
  },
  {
    id: 'billing',
    label: 'Billing',
    href: '/billing',
    icon: CreditCard,
    description: 'Usage and billing'
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'System configuration'
  }
];

interface UnifiedNavShellProps {
  children: React.ReactNode;
  currentApp?: string;
}

export const UnifiedNavShell: React.FC<UnifiedNavShellProps> = ({
  children,
  currentApp = 'workflow-studio'
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useStudioStore();

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [appSwitcherOpen, setAppSwitcherOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored && stored !== 'auto') return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Current application
  const currentApplication = useMemo(() =>
    APPLICATIONS.find(app => app.id === currentApp) || APPLICATIONS[0],
    [currentApp]
  );

  // Available applications (filtered by user permissions)
  const availableApplications = useMemo(() => {
    return APPLICATIONS.filter(app => {
      if (!app.requiredScopes) return true;
      return app.requiredScopes.every(scope => authService.hasScope(scope));
    });
  }, []);

  // Filtered navigation items
  const filteredNavItems = useMemo(() => {
    return NAV_ITEMS.filter(item => {
      // Add filtering logic based on user permissions, features, etc.
      return true; // For now, show all
    });
  }, []);

  // Effects
  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  useEffect(() => {
    // Close dropdowns on route change
    setSidebarMobileOpen(false);
    setUserMenuOpen(false);
    setAppSwitcherOpen(false);
  }, [location.pathname]);

  // Handlers
  const toggleTheme = () => setIsDark(!isDark);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleAppSwitch = (app: Application) => {
    if (app.external) {
      // Add tenancy context to external URLs
      const url = new URL(app.url);
      if (state.workspace.currentWorkspace) {
        url.searchParams.set('workspace', state.workspace.currentWorkspace.id);
      }
      if (state.workspace.currentProject) {
        url.searchParams.set('project', state.workspace.currentProject.id);
      }
      window.open(url.toString(), '_blank');
    } else {
      navigate(app.url);
    }
    setAppSwitcherOpen(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getCurrentPage = () => {
    return filteredNavItems.find(item => item.href === location.pathname);
  };

  const currentPage = getCurrentPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-all duration-300">
      {/* Mobile sidebar overlay */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarCollapsed ? 'w-20' : 'w-72'}
        ${sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full card border-r border-white/20 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
          {/* App Switcher */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setAppSwitcherOpen(!appSwitcherOpen)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <currentApplication.icon className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 text-left">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentApplication.name}
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {currentApplication.description}
                  </p>
                </div>
              )}
              {!sidebarCollapsed && <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {/* App Switcher Dropdown */}
            {appSwitcherOpen && !sidebarCollapsed && (
              <div className="mt-2 card border shadow-lg">
                <div className="p-2 max-h-80 overflow-y-auto">
                  {availableApplications.map(app => (
                    <button
                      key={app.id}
                      onClick={() => handleAppSwitch(app)}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <app.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {app.name}
                          </span>
                          {app.external && <ExternalLink className="w-3 h-3 text-gray-500" />}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {app.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredNavItems.map(item => (
              <NavItem
                key={item.id}
                item={item}
                isActive={location.pathname === item.href}
                collapsed={sidebarCollapsed}
              />
            ))}
          </nav>

          {/* Sidebar toggle */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleSidebar}
              className="w-full btn-ghost p-3 flex items-center justify-center"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* Top Bar */}
        <header className="h-16 card border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
          <div className="h-full px-6 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarMobileOpen(true)}
              className="btn-ghost p-2 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title and breadcrumbs */}
            <div className="flex-1 lg:ml-6">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentPage?.label || 'Dashboard'}
                </h2>
                {state.workspace.currentWorkspace && (
                  <>
                    <span className="text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {state.workspace.currentWorkspace.name}
                    </span>
                    {state.workspace.currentProject && (
                      <>
                        <span className="text-gray-400 dark:text-gray-500">/</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {state.workspace.currentProject.name}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
              {currentPage?.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {currentPage.description}
                </p>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="btn-ghost p-2"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Task Center / Notifications */}
              <TaskCenterIntegration
                workspaceId={state.workspace.currentWorkspace?.id}
                projectId={state.workspace.currentProject?.id}
                userId={state.auth.user?.id || ''}
              />

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg btn-ghost"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    {state.auth.user?.avatar ? (
                      <img src={state.auth.user.avatar} alt={state.auth.user.name} className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {state.auth.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {state.auth.user?.email || 'user@auterity.com'}
                    </p>
                  </div>
                  <ChevronDown className={`transform transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 card border shadow-xl z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {state.auth.user?.name || 'User'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {state.auth.user?.email || 'user@auterity.com'}
                      </p>
                      {state.auth.user?.organization && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {state.auth.user.organization.name}
                        </p>
                      )}
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </Link>
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors w-full text-left"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};

// Navigation Item Component
interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, collapsed }) => {
  const IconComponent = item.icon;

  return (
    <Link
      to={item.href}
      className={`nav-item group relative ${isActive ? 'active' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <div className="flex items-center space-x-3 w-full">
        <div className={`transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200'}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        {!collapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div>
              <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                {item.label}
              </span>
              {item.description && (
                <p className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                  {item.description}
                </p>
              )}
            </div>

            {item.badge && item.badge > 0 && (
              <span className={`badge badge-primary text-xs px-2 py-1 ${isActive ? 'bg-white/20 text-white' : ''}`}>
                {item.badge}
              </span>
            )}
          </div>
        )}

        {collapsed && item.badge && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {item.badge}
          </span>
        )}
      </div>
    </Link>
  );
};

export default UnifiedNavShell;
