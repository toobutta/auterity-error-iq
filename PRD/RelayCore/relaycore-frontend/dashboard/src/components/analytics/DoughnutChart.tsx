import React from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChart } from './BaseChart';

export interface DoughnutChartProps {
  data: ChartData<'doughnut'>;
  options?: ChartOptions<'doughnut'>;
  height?: string | number;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({ data, options, height }) => {
  return <BaseChart type="doughnut" data={data} options={options} height={height} />;
};