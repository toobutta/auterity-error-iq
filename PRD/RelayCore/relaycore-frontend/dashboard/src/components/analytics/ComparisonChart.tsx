import React from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import { LineChart } from './LineChart';
import { format } from 'date-fns';

export interface MetricSeries {
  label: string;
  data: { timestamp: Date | string | number; value: number }[];
  color?: string;
}

export interface ComparisonChartProps {
  series: MetricSeries[];
  timeFormat?: string;
  height?: string | number;
  title?: string;
  yAxisLabel?: string;
  fillArea?: boolean;
}

// Default chart colors
const defaultColors = [
  'rgba(75, 192, 192, 1)',   // teal
  'rgba(255, 99, 132, 1)',    // red
  'rgba(54, 162, 235, 1)',    // blue
  'rgba(255, 206, 86, 1)',    // yellow
  'rgba(153, 102, 255, 1)',   // purple
  'rgba(255, 159, 64, 1)',    // orange
  'rgba(199, 199, 199, 1)',   // gray
  'rgba(83, 102, 255, 1)',    // indigo
  'rgba(255, 99, 255, 1)',    // pink
  'rgba(99, 255, 132, 1)',    // green
];

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  series,
  timeFormat = 'MMM d, HH:mm',
  height,
  title,
  yAxisLabel,
  fillArea = false,
}) => {
  // Get all unique timestamps across all series
  const allTimestamps = new Set<number>();
  
  series.forEach(s => {
    s.data.forEach(point => {
      allTimestamps.add(new Date(point.timestamp).getTime());
    });
  });
  
  // Sort timestamps
  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
  
  // Format timestamps for display
  const labels = sortedTimestamps.map(timestamp => format(new Date(timestamp), timeFormat));
  
  // Create datasets
  const datasets = series.map((s, index) => {
    const color = s.color || defaultColors[index % defaultColors.length];
    
    // Create a map of timestamp to value for quick lookup
    const valueMap = new Map<number, number>();
    s.data.forEach(point => {
      valueMap.set(new Date(point.timestamp).getTime(), point.value);
    });
    
    // Create data array with values for each timestamp (or null if no data)
    const data = sortedTimestamps.map(timestamp => {
      return valueMap.has(timestamp) ? valueMap.get(timestamp) : null;
    });
    
    return {
      label: s.label,
      data,
      borderColor: color,
      backgroundColor: fillArea ? color.replace('1)', '0.2)') : undefined,
      fill: fillArea,
      tension: 0.4,
    };
  });
  
  const chartData: ChartData<'line'> = {
    labels,
    datasets,
  };
  
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
      title: {
        display: !!title,
        text: title || '',
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
          display: !!yAxisLabel,
          text: yAxisLabel || '',
        },
      },
    },
  };
  
  return <LineChart data={chartData} options={options} height={height} />;
};