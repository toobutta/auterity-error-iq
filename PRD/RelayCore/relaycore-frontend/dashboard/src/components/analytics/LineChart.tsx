import React from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChart } from './BaseChart';

export interface LineChartProps {
  data: ChartData<'line'>;
  options?: ChartOptions<'line'>;
  height?: string | number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, options, height }) => {
  return <BaseChart type="line" data={data} options={options} height={height} />;
};