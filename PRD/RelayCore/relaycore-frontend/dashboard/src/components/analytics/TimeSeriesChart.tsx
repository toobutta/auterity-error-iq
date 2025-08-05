import React from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import { LineChart } from './LineChart';
import { format } from 'date-fns';

export interface TimeSeriesDataPoint {
  timestamp: Date | string | number;
  value: number;
}

export interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  label: string;
  color?: string;
  timeFormat?: string;
  height?: string | number;
  fillArea?: boolean;
  showLegend?: boolean;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  label,
  color = 'rgba(75, 192, 192, 1)',
  timeFormat = 'MMM d, HH:mm',
  height,
  fillArea = false,
  showLegend = true,
}) => {
  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeA - timeB;
  });

  // Format timestamps for display
  const labels = sortedData.map(point => {
    const date = new Date(point.timestamp);
    return format(date, timeFormat);
  });

  // Extract values
  const values = sortedData.map(point => point.value);

  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: color,
        backgroundColor: fillArea ? `${color.replace('1)', '0.2)')}` : undefined,
        fill: fillArea,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: label,
        },
      },
    },
  };

  return <LineChart data={chartData} options={options} height={height} />;
};