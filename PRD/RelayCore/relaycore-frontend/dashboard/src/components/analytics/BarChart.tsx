import React from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChart } from './BaseChart';

export interface BarChartProps {
  data: ChartData<'bar'>;
  options?: ChartOptions<'bar'>;
  height?: string | number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, options, height }) => {
  return <BaseChart type="bar" data={data} options={options} height={height} />;
};