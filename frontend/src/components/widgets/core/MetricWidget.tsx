import React from 'react';
import { MetricWidgetProps } from './types';
import { WidgetHeader } from './WidgetHeader';
import { WidgetError } from './WidgetError';
import { WidgetLoading } from './WidgetLoading';

const formatValue = (
  value: number | string,
  format?: 'number' | 'currency' | 'percentage',
  prefix?: string,
  suffix?: string
) => {
  let formattedValue = value;

  if (typeof value === 'number') {
    switch (format) {
      case 'currency':
        formattedValue = value.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD'
        });
        break;
      case 'percentage':
        formattedValue = `${value.toFixed(1)}%`;
        break;
      default:
        formattedValue = value.toLocaleString();
    }
  }

  return `${prefix || ''}${formattedValue}${suffix || ''}`;
};

const calculateTrendPercentage = (current: number, previous: number) => {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
};

export const MetricWidget: React.FC<MetricWidgetProps> = ({
  id,
  title,
  value,
  previousValue,
  trend,
  format,
  prefix,
  suffix,
  isLoading,
  error,
  onRefresh,
  className
}) => {
  const renderTrend = () => {
    if (!previousValue || typeof value !== 'number' || typeof previousValue !== 'number') {
      return null;
    }

    const trendPercentage = calculateTrendPercentage(value, previousValue);
    const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral';
    const trendColor = {
      up: 'text-green-500',
      down: 'text-red-500',
      neutral: 'text-gray-500'
    }[trendDirection];

    return (
      <div className={`trend ${trendColor} flex items-center text-sm ml-2`}>
        {trendDirection === 'up' && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        )}
        {trendDirection === 'down' && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )}
        <span className="ml-1">{Math.abs(trendPercentage).toFixed(1)}%</span>
      </div>
    );
  };

  if (error) {
    return <WidgetError message={error} onRetry={onRefresh} />;
  }

  return (
    <div className={`widget metric-widget ${className || ''}`}>
      <WidgetHeader
        title={title}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />
      <div className="widget-content p-4">
        {isLoading ? (
          <WidgetLoading />
        ) : (
          <div className="flex items-center">
            <div className="text-3xl font-bold">
              {formatValue(value, format, prefix, suffix)}
            </div>
            {renderTrend()}
          </div>
        )}
      </div>
    </div>
  );
};
