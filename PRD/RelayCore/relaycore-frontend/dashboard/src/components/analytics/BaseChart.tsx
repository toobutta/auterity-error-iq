import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  ChartType,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import styled from 'styled-components';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ChartContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

export interface BaseChartProps {
  type: ChartType;
  data: ChartData<any>;
  options?: ChartOptions<any>;
  height?: string | number;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  type,
  data,
  options = {},
  height = '300px',
}) => {
  const defaultOptions: ChartOptions<any> = {
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
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };

  return (
    <ChartContainer style={{ height }}>
      <Chart type={type} data={data} options={mergedOptions} />
    </ChartContainer>
  );
};