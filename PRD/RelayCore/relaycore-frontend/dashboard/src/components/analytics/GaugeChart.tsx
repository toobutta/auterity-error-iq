import React from 'react';
import { ChartData, ChartOptions } from 'chart.js';
import { DoughnutChart } from './DoughnutChart';
import styled from 'styled-components';

export interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  height?: string | number;
  color?: string;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

const GaugeContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const GaugeValue = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  font-weight: bold;
`;

const GaugeLabel = styled.div`
  margin-top: 8px;
  font-size: 14px;
  color: #666;
`;

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min = 0,
  max = 100,
  label,
  height = '200px',
  color = 'rgba(75, 192, 192, 1)',
  thresholds = {},
}) => {
  // Ensure value is within bounds
  const boundedValue = Math.max(min, Math.min(max, value));
  
  // Calculate percentage
  const percentage = ((boundedValue - min) / (max - min)) * 100;
  
  // Determine color based on thresholds
  let gaugeColor = color;
  if (thresholds.critical !== undefined && percentage >= thresholds.critical) {
    gaugeColor = 'rgba(255, 99, 132, 1)'; // Red for critical
  } else if (thresholds.warning !== undefined && percentage >= thresholds.warning) {
    gaugeColor = 'rgba(255, 206, 86, 1)'; // Yellow for warning
  }
  
  // Create chart data
  const chartData: ChartData<'doughnut'> = {
    labels: ['Value', 'Remaining'],
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [
          gaugeColor,
          'rgba(220, 220, 220, 0.5)', // Light gray for remaining
        ],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  };
  
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    cutout: '75%',
  };
  
  return (
    <GaugeContainer style={{ height }}>
      <DoughnutChart data={chartData} options={options} height={height} />
      <GaugeValue>{value.toFixed(1)}</GaugeValue>
      {label && <GaugeLabel>{label}</GaugeLabel>}
    </GaugeContainer>
  );
};