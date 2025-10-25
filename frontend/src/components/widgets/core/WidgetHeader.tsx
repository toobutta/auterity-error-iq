import React from 'react';
import { WidgetHeaderProps } from './types';

export const WidgetHeader: React.FC<WidgetHeaderProps> = ({
  title,
  isLoading,
  onRefresh,
  actions
}) => {
  return (
    <div className="widget-header flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <div className="flex items-center space-x-2">
        {actions}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-1 rounded-full hover:bg-gray-100 ${
              isLoading ? 'animate-spin' : ''
            }`}
          >
            <svg
              className="h-4 w-4 text-gray-400"
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
          </button>
        )}
      </div>
    </div>
  );
};
