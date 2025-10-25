import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Modern SVG icon components
const Icons = {
  Dashboard: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  Workflows: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),
  Templates: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  AI: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  ),
  Settings: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  Menu: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  ),
  Sun: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  Moon: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  ),
  Bell: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  ),
  User: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  ChevronDown: ({ className = "w-4 h-4" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  ),
  Logo: ({ className = "w-8 h-8" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Logout: ({ className = "w-5 h-5" }) => (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
};

interface NavItemData {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

const navigationItems: NavItemData[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Icons.Dashboard,
    description: "Overview and analytics",
  },
  {
    href: "/workflows",
    label: "Workflows",
    icon: Icons.Workflows,
    badge: 3,
    description: "Automation workflows",
  },
  {
    href: "/templates",
    label: "Templates",
    icon: Icons.Templates,
    description: "Reusable templates",
  },
  {
    href: "/auterity-expansion",
    label: "AI Expansion",
    icon: Icons.AI,
    badge: 3,
    description: "AI-powered features",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Icons.Settings,
    description: "System configuration",
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("auterity-theme");
      if (stored && stored !== "auto") return stored === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Sidebar states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // User menu and notification states
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Mock notifications
  const [notifications] = useState([
    {
      id: 1,
      title: "Workflow completed",
      message: "Marketing automation workflow finished successfully",
      time: "2 min ago",
      unread: true,
    },
    {
      id: 2,
      title: "System update",
      message: "Auterity platform updated to v2.1.0",
      time: "1 hour ago",
      unread: false,
    },
    {
      id: 3,
      title: "New template available",
      message: "Customer onboarding template has been published",
      time: "3 hours ago",
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("auterity-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("auterity-theme", "light");
    }
  }, [isDark]);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Close dropdowns on route change
  useEffect(() => {
    setSidebarMobileOpen(false);
    setUserMenuOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {

    }
  };

  const currentPage = navigationItems.find(
    (item) => item.href === location.pathname,
  );

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
      <aside
        className={`
        fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarCollapsed ? "w-20" : "w-72"}
        ${sidebarMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="h-full card border-r border-white/20 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Icons.Logo className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold text-gradient">Auterity</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI Platform
                  </p>
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

          {/* Sidebar toggle */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleSidebar}
              className="w-full btn-ghost p-3 flex items-center justify-center"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icons.Menu />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}`}
      >
        {/* Top Bar */}
        <header className="h-16 card border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
          <div className="h-full px-6 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarMobileOpen(true)}
              className="btn-ghost p-2 lg:hidden"
            >
              <Icons.Menu />
            </button>

            {/* Page title */}
            <div className="flex-1 lg:ml-6">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentPage?.label || "Dashboard"}
                </h2>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPage?.description || "Welcome to Auterity"}
                </span>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="btn-ghost p-2"
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <Icons.Sun /> : <Icons.Moon />}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="btn-ghost p-2 relative"
                >
                  <Icons.Bell />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 card border shadow-xl z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`w-2 h-2 mt-2 rounded-full ${notification.unread ? "bg-blue-500" : "bg-gray-300"}`}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <button className="btn-primary btn-sm w-full">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg btn-ghost"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Icons.User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name || "Admin User"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {user?.email || "admin@auterity.local"}
                    </p>
                  </div>
                  <Icons.ChevronDown
                    className={`transform transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* User dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 card border shadow-xl z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user?.name || "Admin User"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user?.email || "admin@auterity.local"}
                      </p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Icons.User className="w-4 h-4" />
                        <span className="text-sm">Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Icons.Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </Link>
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors w-full text-left"
                      >
                        <Icons.Logout className="w-4 h-4" />
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
  item: NavItemData;
  isActive: boolean;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, collapsed }) => {
  const IconComponent = item.icon;

  return (
    <Link
      to={item.href}
      className={`nav-item group relative ${isActive ? "active" : ""}`}
      title={collapsed ? item.label : undefined}
    >
      <div className="flex items-center space-x-3 w-full">
        <div
          className={`transition-colors ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200"}`}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {!collapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div>
              <span
                className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-700 dark:text-gray-200"}`}
              >
                {item.label}
              </span>
              {item.description && (
                <p
                  className={`text-xs mt-0.5 ${isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {item.description}
                </p>
              )}
            </div>

            {item.badge && item.badge > 0 && (
              <span
                className={`badge badge-primary text-xs px-2 py-1 ${isActive ? "bg-white/20 text-white" : ""}`}
              >
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

export default Layout;


