import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChartWidgetProps } from './types';
import { WidgetHeader } from './WidgetHeader';
import { WidgetError } from './WidgetError';
import { WidgetLoading } from './WidgetLoading';

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  id,
  title,
  chartType,
  data,
  xAxis,
  yAxis = [],
  colors = ['#8884d8', '#82ca9d', '#ffc658'],
  showLegend = true,
  isLoading,
  error,
  onRefresh,
  className
}) => {
  const renderChart = useMemo(() => {
    if (!data?.length) return null;

    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {yAxis.map((axis, index) => (
              <Line
                key={axis}
                type="monotone"
                dataKey={axis}
                stroke={colors[index % colors.length]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {yAxis.map((axis, index) => (
              <Bar
                key={axis}
                dataKey={axis}
                fill={colors[index % colors.length]}
              />
            ))}
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {yAxis.map((axis, index) => (
              <Area
                key={axis}
                type="monotone"
                dataKey={axis}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={yAxis[0]}
              nameKey={xAxis}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            />
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  }, [chartType, data, xAxis, yAxis, colors, showLegend]);

  if (error) {
    return <WidgetError message={error} onRetry={onRefresh} />;
  }

  return (
    <div className={`widget chart-widget ${className || ''}`}>
      <WidgetHeader
        title={title}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />
      <div className="widget-content" style={{ height: '300px' }}>
        {isLoading ? (
          <WidgetLoading />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
