import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../design-system/utils/cn';
import { COLORS } from '../../design-system/tokens/colors';

// Mobile navigation item
export interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number | string;
  children?: MobileNavItem[];
}

// Mobile navigation props
export interface MobileNavigationProps {
  items: MobileNavItem[];
  isOpen: boolean;
  onClose: () => void;
  onItemClick?: (item: MobileNavItem) => void;
  position?: 'left' | 'right';
  className?: string;
}

// Mobile navigation component
const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  isOpen,
  onClose,
  onItemClick,
  position = 'left',
  className = ''
}) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Close navigation on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname, isOpen, onClose]);

  // Handle item click
  const handleItemClick = useCallback((item: MobileNavItem) => {
    if (item.children && item.children.length > 0) {
      // Toggle expanded state for items with children
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      // Close navigation and navigate for leaf items
      onClose();
      onItemClick?.(item);
    }
  }, [onClose, onItemClick]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when navigation is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Navigation panel */}
      <div
        className={cn(
          'fixed top-0 bottom-0 z-50 w-80 max-w-[90vw] bg-white shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          position === 'left' ? 'left-0' : 'right-0',
          isOpen
            ? 'translate-x-0'
            : position === 'left'
            ? '-translate-x-full'
            : 'translate-x-full',
          className
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            type="button"
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {items.map(item => (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-left',
                    'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
                    'focus:outline-none focus:bg-gray-100 focus:ring-2 focus:ring-blue-500',
                    'transition-colors duration-200',
                    location.pathname === item.path && 'bg-blue-50 text-blue-700 border-r-4 border-r-blue-500'
                  )}
                  onClick={() => handleItemClick(item)}
                  aria-expanded={expandedItems.has(item.id)}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0 w-5 h-5">
                      {item.icon}
                    </span>
                    <span className="font-medium truncate">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full min-w-[20px]">
                        {item.badge}
                      </span>
                    )}

                    {item.children && item.children.length > 0 && (
                      <svg
                        className={cn(
                          'w-4 h-4 text-gray-400 transition-transform duration-200',
                          expandedItems.has(item.id) ? 'rotate-90' : ''
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Submenu */}
                {item.children && item.children.length > 0 && expandedItems.has(item.id) && (
                  <ul className="ml-8 mt-1 space-y-1">
                    {item.children.map(child => (
                      <li key={child.id}>
                        <Link
                          to={child.path}
                          className={cn(
                            'flex items-center justify-between px-4 py-2 text-sm',
                            'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                            'focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-blue-500',
                            'rounded-md transition-colors duration-200',
                            location.pathname === child.path && 'bg-blue-50 text-blue-700'
                          )}
                          onClick={onClose}
                          aria-current={location.pathname === child.path ? 'page' : undefined}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="flex-shrink-0 w-4 h-4">
                              {child.icon}
                            </span>
                            <span className="truncate">
                              {child.label}
                            </span>
                          </div>

                          {child.badge && (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full min-w-[18px]">
                              {child.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500 text-center">
            Error-IQ v1.0.0
          </div>
        </div>
      </div>
    </>
  );
};

// Mobile bottom navigation for main app navigation
export const MobileBottomNavigation: React.FC<{
  items: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: number;
  }>;
  className?: string;
}> = ({ items, className = '' }) => {
  const location = useLocation();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-30',
        'bg-white border-t border-gray-200',
        'px-2 py-2 safe-area-bottom',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <ul className="flex justify-around items-center">
        {items.map(item => (
          <li key={item.id} className="flex-1">
            <Link
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-lg',
                'text-gray-600 hover:text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'transition-colors duration-200 min-h-[48px]',
                location.pathname === item.path && 'text-blue-600 bg-blue-50'
              )}
              aria-current={location.pathname === item.path ? 'page' : undefined}
            >
              <div className="relative">
                <span className="w-6 h-6">
                  {item.icon}
                </span>
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium truncate max-w-full">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileNavigation;
