import React from 'react';
import { WidgetLoadingProps } from './types';

export const WidgetLoading: React.FC<WidgetLoadingProps> = ({
  message = 'Loading...'
}) => {
  return (
    <div className="widget-loading p-4 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
};
