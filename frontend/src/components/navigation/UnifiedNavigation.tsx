import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../design-system/utils/cn';
import { COLORS } from '../../design-system/tokens/colors';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { LoadingSpinner } from '../../design-system/components/Feedback';

// Navigation item types
export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  active?: boolean;
  badge?: number | string;
  children?: NavigationItem[];
  requiresAuth?: boolean;
  permissions?: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  disabled?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface UnifiedNavigationProps {
  items: NavigationItem[];
  quickActions?: QuickAction[];
  user?: User;
  notifications?: Notification[];
  searchEnabled?: boolean;
  breadcrumbs?: Array<{
    label: string;
    path?: string;
  }>;
  onItemClick?: (item: NavigationItem) => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

// Breadcrumb component
const Breadcrumb: React.FC<{
  items: Array<{ label: string; path?: string }>;
  onItemClick?: (path: string) => void;
}> = ({ items, onItemClick }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            {item.path && index < items.length - 1 ? (
              <button
                type="button"
                className="breadcrumb-link"
                onClick={() => onItemClick?.(item.path!)}
                aria-label={`Go to ${item.label}`}
              >
                {item.label}
              </button>
            ) : (
              <span className="breadcrumb-current" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Search component
const NavigationSearch: React.FC<{
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}> = ({ onSearch, placeholder = "Search...", isLoading = false }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    onSearch(value);
  }, [onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  }, []);

  return (
    <div className="navigation-search">
      <div className="search-container">
        <button
          type="button"
          className="search-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {isOpen && (
          <div className="search-input-container">
            <Input
              type="search"
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="search-input"
              autoFocus
            />
            {isLoading && (
              <div className="search-loading">
                <LoadingSpinner size="sm" variant="primary" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// User menu component
const UserMenu: React.FC<{
  user: User;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
}> = ({ user, onProfileClick, onSettingsClick, onLogoutClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="user-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="avatar-image" />
          ) : (
            <div className="avatar-placeholder">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={cn('status-indicator', `status-${user.status}`)} />
        </div>
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-role">{user.role}</span>
        </div>
        <svg className={cn('menu-icon', { 'rotate-180': isOpen })} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="menu-header">
            <div className="menu-user-info">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          <div className="menu-items">
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                onProfileClick?.();
                setIsOpen(false);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>

            <button
              type="button"
              className="menu-item"
              onClick={() => {
                onSettingsClick?.();
                setIsOpen(false);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>

            <hr className="menu-divider" />

            <button
              type="button"
              className="menu-item menu-item-danger"
              onClick={() => {
                onLogoutClick?.();
                setIsOpen(false);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Notification panel
const NotificationPanel: React.FC<{
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAllRead?: () => void;
}> = ({ notifications, onNotificationClick, onMarkAllRead }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-panel">
      <button
        type="button"
        className="notification-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-read"
                onClick={onMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={cn('notification-item', {
                    'notification-unread': !notification.read,
                    [`notification-${notification.type}`]: true
                  })}
                  onClick={() => {
                    onNotificationClick(notification);
                    setIsOpen(false);
                  }}
                >
                  <div className="notification-icon">
                    {notification.type === 'success' && '✓'}
                    {notification.type === 'error' && '✕'}
                    {notification.type === 'warning' && '⚠'}
                    {notification.type === 'info' && 'ℹ'}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-timestamp">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </div>
                  </div>

                  {notification.action && (
                    <div className="notification-action">
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          notification.action?.onClick();
                        }}
                      >
                        {notification.action.label}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main navigation component
export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = ({
  items,
  quickActions = [],
  user,
  notifications = [],
  searchEnabled = true,
  breadcrumbs,
  onItemClick,
  onSearch,
  onNotificationClick,
  className = ''
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>('');

  // Update active item based on current location
  useEffect(() => {
    const currentItem = items.find(item =>
      item.path === location.pathname ||
      location.pathname.startsWith(item.path + '/')
    );
    setActiveItem(currentItem?.id || '');
  }, [location.pathname, items]);

  const handleItemClick = useCallback((item: NavigationItem) => {
    setActiveItem(item.id);
    onItemClick?.(item);
    navigate(item.path);
    setMobileMenuOpen(false); // Close mobile menu
  }, [onItemClick, navigate]);

  const handleBreadcrumbClick = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <header className={cn('unified-navigation', className)}>
      {/* Top bar */}
      <div className="navigation-top">
        <div className="navigation-left">
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="mobile-menu-toggle lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>

          {/* Logo/Brand */}
          <div className="navigation-brand">
            <Link to="/" className="brand-link">
              <span className="brand-text">Error-IQ</span>
            </Link>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="hidden md:block">
              <Breadcrumb
                items={breadcrumbs}
                onItemClick={handleBreadcrumbClick}
              />
            </div>
          )}
        </div>

        <div className="navigation-center">
          {/* Search */}
          {searchEnabled && onSearch && (
            <NavigationSearch onSearch={onSearch} />
          )}
        </div>

        <div className="navigation-right">
          {/* Quick actions */}
          {quickActions.map(action => (
            <button
              key={action.id}
              type="button"
              className="quick-action-btn"
              onClick={action.action}
              disabled={action.disabled}
              title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
            >
              {action.icon}
            </button>
          ))}

          {/* Notifications */}
          {notifications.length > 0 && (
            <NotificationPanel
              notifications={notifications}
              onNotificationClick={onNotificationClick || (() => {})}
              onMarkAllRead={() => console.log('Mark all read')}
            />
          )}

          {/* User menu */}
          {user && (
            <UserMenu
              user={user}
              onProfileClick={() => navigate('/profile')}
              onSettingsClick={() => navigate('/settings')}
              onLogoutClick={() => console.log('Logout')}
            />
          )}
        </div>
      </div>

      {/* Navigation menu */}
      <nav
        className={cn('navigation-menu', {
          'mobile-open': mobileMenuOpen
        })}
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="navigation-items">
          {items.map(item => (
            <li key={item.id} className="navigation-item">
              <button
                type="button"
                className={cn('navigation-link', {
                  'active': activeItem === item.id || item.active
                })}
                onClick={() => handleItemClick(item)}
                aria-current={activeItem === item.id ? 'page' : undefined}
              >
                <span className="navigation-icon">
                  {item.icon}
                </span>
                <span className="navigation-label">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="navigation-badge">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  );
};
