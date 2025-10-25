import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/enhanced/Card';
import { Badge } from '../ui/enhanced/Badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface ChartDataPoint {
  [key: string]: any;
}

export interface ChartConfig {
  title?: string;
  description?: string;
  data: ChartDataPoint[];
  xAxis?: string;
  yAxis?: string[];
  colors?: string[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  animation?: boolean;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
}

// Color palettes for consistent theming
export const CHART_COLORS = {
  primary: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a'],
  success: ['#10b981', '#059669', '#047857', '#065f46'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
  error: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
  info: ['#06b6d4', '#0891b2', '#0e7490', '#155e75'],
  purple: ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'],
  gray: ['#6b7280', '#4b5563', '#374151', '#1f2937'],
  mixed: [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ]
};

// Trend indicator component
export const TrendIndicator: React.FC<{
  value: number;
  direction: 'up' | 'down' | 'neutral';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, direction, label, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const TrendIcon = direction === 'up' ? TrendingUp :
                   direction === 'down' ? TrendingDown : Minus;

  const colorClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className={`flex items-center gap-1 ${colorClasses[direction]} ${sizeClasses[size]}`}>
      <TrendIcon className={iconSizeClasses[size]} />
      <span>{value.toFixed(1)}%</span>
      {label && <span className="text-muted-foreground"> {label}</span>}
    </div>
  );
};

// Custom tooltip component
export const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: any) => string;
}> = ({ active, payload, label, formatter, labelFormatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      {label && (
        <p className="font-medium mb-2">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((entry, index) => {
        const [formattedValue, formattedName] = formatter
          ? formatter(entry.value, entry.dataKey)
          : [entry.value, entry.name || entry.dataKey];

        return (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {formattedName}: {formattedValue}
          </p>
        );
      })}
    </div>
  );
};

// Line Chart Component
export const LineChartComponent: React.FC<ChartConfig & {
  variant?: 'default' | 'area' | 'smooth';
  strokeWidth?: number;
}> = ({
  title,
  description,
  data,
  xAxis = 'x',
  yAxis = ['y'],
  colors = CHART_COLORS.primary,
  height = 300,
  showLegend = true,
  showGrid = true,
  animation = true,
  variant = 'default',
  strokeWidth = 2,
  trend
}) => {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length]
    }));
  }, [data, colors]);

  const ChartComponent = variant === 'area' ? AreaChart : LineChart;

  return (
    <Card>
      {(title || trend) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            {trend && <TrendIndicator {...trend} />}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {yAxis.map((yKey, index) => {
              if (variant === 'area') {
                return (
                  <Area
                    key={yKey}
                    type="monotone"
                    dataKey={yKey}
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.3}
                    strokeWidth={strokeWidth}
                  />
                );
              }
              return (
                <Line
                  key={yKey}
                  type={variant === 'smooth' ? 'monotone' : 'linear'}
                  dataKey={yKey}
                  stroke={colors[index % colors.length]}
                  strokeWidth={strokeWidth}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Bar Chart Component
export const BarChartComponent: React.FC<ChartConfig & {
  variant?: 'default' | 'stacked' | 'grouped';
  barSize?: number;
}> = ({
  title,
  description,
  data,
  xAxis = 'x',
  yAxis = ['y'],
  colors = CHART_COLORS.primary,
  height = 300,
  showLegend = true,
  showGrid = true,
  animation = true,
  variant = 'default',
  barSize,
  trend
}) => {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length]
    }));
  }, [data, colors]);

  return (
    <Card>
      {(title || trend) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            {trend && <TrendIndicator {...trend} />}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {yAxis.map((yKey, index) => (
              <Bar
                key={yKey}
                dataKey={yKey}
                fill={colors[index % colors.length]}
                stackId={variant === 'stacked' ? 'stack' : undefined}
                barSize={barSize}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Pie Chart Component
export const PieChartComponent: React.FC<ChartConfig & {
  dataKey?: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
}> = ({
  title,
  description,
  data,
  colors = CHART_COLORS.mixed,
  height = 300,
  showLegend = true,
  dataKey = 'value',
  nameKey = 'name',
  innerRadius = 0,
  outerRadius = 80,
  showLabels = true,
  trend
}) => {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: item.fill || colors[index % colors.length]
    }));
  }, [data, colors]);

  return (
    <Card>
      {(title || trend) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            {trend && <TrendIndicator {...trend} />}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey={dataKey}
              nameKey={nameKey}
              label={showLabels ? ({ name, value, percent }) =>
                `${name}: ${(percent * 100).toFixed(1)}%` : false
              }
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Scatter Plot Component
export const ScatterChartComponent: React.FC<ChartConfig & {
  xKey?: string;
  yKey?: string;
  zKey?: string;
  shape?: 'circle' | 'square' | 'triangle' | 'diamond';
}> = ({
  title,
  description,
  data,
  xKey = 'x',
  yKey = 'y',
  zKey,
  colors = CHART_COLORS.primary,
  height = 300,
  showLegend = true,
  showGrid = true,
  shape = 'circle',
  trend
}) => {
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length]
    }));
  }, [data, colors]);

  return (
    <Card>
      {(title || trend) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            {trend && <TrendIndicator {...trend} />}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis dataKey={yKey} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Scatter
              dataKey={zKey || yKey}
              fill={colors[0]}
              shape={shape}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Radar Chart Component
export const RadarChartComponent: React.FC<ChartConfig & {
  dataKey?: string;
  polarAngleKey?: string;
}> = ({
  title,
  description,
  data,
  dataKey = 'value',
  polarAngleKey = 'subject',
  colors = CHART_COLORS.primary,
  height = 300,
  showLegend = true,
  trend
}) => {
  return (
    <Card>
      {(title || trend) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            {trend && <TrendIndicator {...trend} />}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={polarAngleKey} />
            <PolarRadiusAxis />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Radar
              dataKey={dataKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// KPI Card Component
export const KPICard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  description?: string;
  target?: number;
  showProgress?: boolean;
  color?: 'default' | 'success' | 'warning' | 'error';
}> = ({
  title,
  value,
  unit,
  change,
  icon,
  description,
  target,
  showProgress = false,
  color = 'default'
}) => {
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  const progress = target ? Math.min((numericValue / target) * 100, 100) : 0;

  const colorClasses = {
    default: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {icon && <div className="text-muted-foreground">{icon}</div>}
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <p className={`text-3xl font-bold ${colorClasses[color]}`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {unit && (
                <span className="text-lg text-muted-foreground">{unit}</span>
              )}
            </div>
            {change && (
              <TrendIndicator
                value={change.value}
                direction={change.direction}
                label={change.label}
                size="sm"
              />
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        {target && showProgress && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  color === 'success' ? 'bg-green-600' :
                  color === 'warning' ? 'bg-yellow-600' :
                  color === 'error' ? 'bg-red-600' : 'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Metric Comparison Component
export const MetricComparison: React.FC<{
  title: string;
  metrics: Array<{
    label: string;
    value: number;
    color: string;
    change?: {
      value: number;
      direction: 'up' | 'down' | 'neutral';
    };
  }>;
  height?: number;
}> = ({ title, metrics, height = 200 }) => {
  const maxValue = Math.max(...metrics.map(m => m.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{metric.value.toLocaleString()}</span>
                  {metric.change && (
                    <TrendIndicator
                      value={metric.change.value}
                      direction={metric.change.direction}
                      size="sm"
                    />
                  )}
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(metric.value / maxValue) * 100}%`,
                    backgroundColor: metric.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Chart Grid Layout Component
export const ChartGrid: React.FC<{
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
}> = ({ children, columns = 2, gap = 6, className }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
  };

  return (
    <div
      className={`grid ${gridClasses[columns as keyof typeof gridClasses]} gap-${gap} ${className || ''}`}
    >
      {children}
    </div>
  );
};

export {
  CHART_COLORS,
  TrendIndicator,
  CustomTooltip,
  LineChartComponent,
  BarChartComponent,
  PieChartComponent,
  ScatterChartComponent,
  RadarChartComponent,
  KPICard,
  MetricComparison,
  ChartGrid
};
