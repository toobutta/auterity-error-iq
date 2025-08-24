import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
  gradient?: string;
  trend?: 'up' | 'down' | 'stable';
  loading?: boolean;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  icon = '📊',
  gradient = 'bg-automotive-primary',
  trend,
  loading = false,
  onClick,
}) => {
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    stable: '→',
  };

  const isClickable = !!onClick;

  if (loading) {
    return (
      <div className="metric-card">
        <div className="animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        metric-card group relative cursor-pointer
        ${isClickable ? 'hover:scale-105 active:scale-95' : ''}
      `}
      onClick={onClick}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-slate-800/50 rounded-lg"></div>

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 group-hover:text-automotive-primary transition-colors">
            {title}
          </p>

          {/* Subtitle */}
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">{subtitle}</p>}

          {/* Value */}
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-automotive-primary transition-colors">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>

          {/* Change indicator */}
          {change && (
            <div
              className={`text-sm font-medium flex items-center space-x-1 ${changeColors[changeType]}`}
            >
              <span>
                {trend
                  ? trendIcons[trend]
                  : changeType === 'positive'
                    ? '↗️'
                    : changeType === 'negative'
                      ? '↘️'
                      : '→'}
              </span>
              <span>{change}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div
          className={`
          p-3 rounded-xl text-white text-2xl shadow-lg transition-all duration-200
          ${gradient}
          group-hover:scale-110 group-hover:shadow-xl
        `}
        >
          {icon}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 w-0 h-1 bg-automotive-primary transition-all duration-300 group-hover:w-full rounded-full"></div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-automotive-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg"></div>
    </div>
  );
};

// Specialized metric cards for different contexts
export const RevenueMetricCard: React.FC<Omit<MetricCardProps, 'icon' | 'gradient'>> = (props) => (
  <MetricCard {...props} icon="💰" gradient="bg-gradient-to-r from-green-500 to-emerald-600" />
);

export const CustomerMetricCard: React.FC<Omit<MetricCardProps, 'icon' | 'gradient'>> = (props) => (
  <MetricCard {...props} icon="👥" gradient="bg-automotive-accent" />
);

export const WorkflowMetricCard: React.FC<Omit<MetricCardProps, 'icon' | 'gradient'>> = (props) => (
  <MetricCard {...props} icon="🔄" gradient="bg-automotive-primary" />
);

export const ServiceMetricCard: React.FC<Omit<MetricCardProps, 'icon' | 'gradient'>> = (props) => (
  <MetricCard {...props} icon="🔧" gradient="bg-gradient-to-r from-purple-500 to-indigo-600" />
);

export const InventoryMetricCard: React.FC<Omit<MetricCardProps, 'icon' | 'gradient'>> = (
  props
) => <MetricCard {...props} icon="📦" gradient="bg-automotive-success" />;

// Grid container for metric cards
interface MetricGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
}

export const MetricGrid: React.FC<MetricGridProps> = ({ children, columns = 4, gap = 'lg' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  const gaps = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return <div className={`grid ${gridCols[columns]} ${gaps[gap]}`}>{children}</div>;
};

export default MetricCard;
