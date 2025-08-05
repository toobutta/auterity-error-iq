import React from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChart } from './BaseChart';

export interface PieChartProps {
  data: ChartData<'pie'>;
  options?: ChartOptions<'pie'>;
  height?: string | number;
}

export const PieChart: React.FC<PieChartProps> = ({ data, options, height }) => {
  return <BaseChart type="pie" data={data} options={options} height={height} />;
};