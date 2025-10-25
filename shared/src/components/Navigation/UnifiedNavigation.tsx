import React, { useState, useMemo } from 'react';
import { Button } from '@auterity/design-system';
import { cn } from '@auterity/design-system';

export interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  children?: NavigationItem[];
  system?: string;
  permissions?: string[];
}

export interface SystemSwitcherItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  href: string;
  status: 'active' | 'inactive' | 'maintenance';
  description?: string;
}

export interface UnifiedNavigationProps {
  currentSystem?: string;
  navigationItems: NavigationItem[];
  systemItems: SystemSwitcherItem[];
  user?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  onSystemChange?: (systemId: string) => void;
  onNavigation?: (item: NavigationItem) => void;
  className?: string;
}

/**
 * Unified Navigation Component
 *
 * Cross-system navigation that works seamlessly across all Auterity platforms.
 * Provides consistent navigation experience with system switching capabilities.
 */
export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = ({
  currentSystem = 'workflow-studio',
  navigationItems,
  systemItems,
  user,
  onSystemChange,
  onNavigation,
  className
}) => {
  const [isSystemSwitcherOpen, setIsSystemSwitcherOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter navigation items based on current system and user permissions
  const filteredNavigationItems = useMemo(() => {
    return navigationItems.filter(item => {
      if (item.system && item.system !== currentSystem) return false;
      if (item.permissions && user?.role) {
        return item.permissions.includes(user.role);
      }
      return true;
    });
  }, [navigationItems, currentSystem, user?.role]);

  const currentSystemInfo = systemItems.find(system => system.id === currentSystem);

  const handleSystemChange = (systemId: string) => {
    setIsSystemSwitcherOpen(false);
    onSystemChange?.(systemId);
  };

  const handleNavigation = (item: NavigationItem) => {
    setIsMobileMenuOpen(false);
    onNavigation?.(item);
    item.onClick?.();
  };

  return (
    <nav className={cn('bg-white border-b border-gray-200', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and System Switcher */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="text-xl font-bold text-gray-900">Auterity</div>
            </div>

            {/* System Switcher */}
            <div className="hidden md:block ml-8">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsSystemSwitcherOpen(!isSystemSwitcherOpen)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  {currentSystemInfo?.icon}
                  <span className="ml-2">{currentSystemInfo?.name || currentSystem}</span>
                  <svg
                    className={cn('ml-2 h-4 w-4 transition-transform', {
                      'rotate-180': isSystemSwitcherOpen
                    })}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* System Switcher Dropdown */}
                {isSystemSwitcherOpen && (
                  <div className="absolute z-50 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      {systemItems.map((system) => (
                        <button
                          key={system.id}
                          onClick={() => handleSystemChange(system.id)}
                          className={cn(
                            'w-full flex items-center px-4 py-2 text-sm hover:bg-gray-100',
                            system.id === currentSystem ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                          )}
                        >
                          <span className="mr-3">{system.icon}</span>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{system.name}</div>
                            {system.description && (
                              <div className="text-xs text-gray-500">{system.description}</div>
                            )}
                          </div>
                          <div className={cn('w-2 h-2 rounded-full ml-2', {
                            'bg-green-400': system.status === 'active',
                            'bg-yellow-400': system.status === 'maintenance',
                            'bg-gray-400': system.status === 'inactive'
                          })} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {filteredNavigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium flex items-center',
                    'hover:text-gray-900 hover:bg-gray-50 transition-colors'
                  )}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user && (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-700">
                    Welcome, <span className="font-medium">{user.name}</span>
                  </div>
                  {user.avatar ? (
                    <img className="h-8 w-8 rounded-full" src={user.avatar} alt={user.name} />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            {filteredNavigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 w-full text-left flex items-center"
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
                {item.badge && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export type { UnifiedNavigationProps, NavigationItem, SystemSwitcherItem };
