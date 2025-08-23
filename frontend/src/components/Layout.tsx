import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Modern icons (can be replaced with actual icon library)
const Icons = {
  Dashboard: () => <span className="text-xl">📊</span>,
  Workflows: () => <span className="text-xl">🔄</span>,
  Templates: () => <span className="text-xl">📋</span>,
  Settings: () => <span className="text-xl">⚙️</span>,
  Menu: () => <span className="text-xl">☰</span>,
  Close: () => <span className="text-xl">✕</span>,
  Light: () => <span className="text-xl">☀️</span>,
  Dark: () => <span className="text-xl">🌙</span>,
  Auto: () => <span className="text-xl">🌓</span>,
  Notification: () => <span className="text-xl">🔔</span>,
  User: () => <span className="text-xl">👤</span>,
  ChevronDown: () => <span className="text-sm">▼</span>,
  Car: () => <span className="text-xl">🚗</span>,
};

interface NavItemData {
  href: string;
  label: string;
  icon: React.ComponentType;
  badge?: number;
}

const navigationItems: NavItemData[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Icons.Dashboard },
  { href: '/workflows', label: 'Workflows', icon: Icons.Workflows, badge: 3 },
  { href: '/templates', label: 'Templates', icon: Icons.Templates },
  { href: '/settings', label: 'Settings', icon: Icons.Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Theme state (simplified version)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  
  // User menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarMobileOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
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
        <div className="h-full glass-card-strong border-r border-white/20 dark:border-slate-700/50">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-white/10 dark:border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-automotive-primary rounded-xl flex items-center justify-center shadow-lg">
                <Icons.Car />
              </div>
              {!sidebarCollapsed && (
                <div className="animate-fade-in">
                  <h1 className="text-xl font-bold text-automotive-primary">AutoMatrix</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI Hub</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isActive={location.pathname === item.href}
                collapsed={sidebarCollapsed}
              />
            ))}
          </nav>

          {/* Sidebar toggle (desktop) */}
          <div className="p-4 border-t border-white/10 dark:border-slate-700/50">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full p-3 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Icons.Menu />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* Top Bar */}
        <header className="h-16 glass-card border-b border-white/20 dark:border-slate-700/50 sticky top-0 z-30">
          <div className="h-full px-6 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors lg:hidden"
            >
              <Icons.Menu />
            </button>

            {/* Desktop sidebar toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors"
            >
              <Icons.Menu />
            </button>

            {/* Page title */}
            <div className="flex-1 lg:ml-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigationItems.find(item => item.href === location.pathname)?.label || 'AutoMatrix AI Hub'}
              </h2>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Icons.Light /> : <Icons.Dark />}
              </button>

              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors relative">
                <Icons.Notification />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-automotive-gold rounded-full flex items-center justify-center">
                    <Icons.User />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name || 'User'}
                  </span>
                  <Icons.ChevronDown />
                </button>

                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 glass-card border border-white/20 dark:border-slate-700/50 rounded-lg shadow-xl z-50">
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/settings');
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        Settings
                      </button>
                      <hr className="border-white/10 dark:border-slate-700/50 my-1" />
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                      >
                        Sign Out
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
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

// Navigation Item Component
interface NavItemProps {
  item: NavItemData;
  isActive: boolean;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, collapsed }) => {
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      className={`
        nav-item group relative flex items-center space-x-3 p-3 rounded-xl transition-all duration-200
        ${isActive 
          ? 'bg-automotive-primary text-white shadow-automotive' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-slate-800/50 hover:text-automotive-primary'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      title={collapsed ? item.label : undefined}
    >
      {/* Icon */}
      <div className={`transition-transform duration-200 ${!collapsed && 'group-hover:scale-110'}`}>
        <Icon />
      </div>
      
      {/* Label */}
      {!collapsed && (
        <div className="flex-1 flex items-center justify-between">
          <span className="font-medium">{item.label}</span>
          {item.badge && (
            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
      )}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {item.label}
          {item.badge && (
            <span className="ml-2 w-4 h-4 bg-red-500 text-xs rounded-full inline-flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
};

export default Layout;