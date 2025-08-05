import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '@relaycore/design-system';
import {
  TimeRangeSelector,
  TimeSeriesChart,
  ComparisonChart,
  PieChart,
  GaugeChart,
  MetricsTable,
} from '../../components/analytics';
import { subDays, format, addHours } from 'date-fns';

const PageContainer = styled.div`
  padding: 20px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidthCard = styled(Card)`
  grid-column: 1 / -1;
`;

// Generate mock time series data
const generateTimeSeriesData = (days: number, baseValue: number, volatility: number) => {
  const data = [];
  const end = new Date();
  const start = subDays(end, days);
  
  let currentDate = start;
  let value = baseValue;
  
  while (currentDate <= end) {
    // Add some randomness to the value
    value = value + (Math.random() - 0.5) * volatility;
    value = Math.max(0, value); // Ensure value is not negative
    
    data.push({
      timestamp: new Date(currentDate),
      value: parseFloat(value.toFixed(2)),
    });
    
    currentDate = addHours(currentDate, 6);
  }
  
  return data;
};

// Generate mock model usage data
const generateModelUsageData = () => {
  const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-2', 'claude-instant', 'llama-2'];
  const colors = [
    'rgba(75, 192, 192, 0.8)',
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(255, 206, 86, 0.8)',
    'rgba(153, 102, 255, 0.8)',
  ];
  
  const data = {
    labels: models,
    datasets: [
      {
        data: models.map(() => Math.floor(Math.random() * 1000) + 100),
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };
  
  return data;
};

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState({ start: subDays(new Date(), 7), end: new Date() });
  const [requestData, setRequestData] = useState<any[]>([]);
  const [costData, setCostData] = useState<any[]>([]);
  const [tokenData, setTokenData] = useState<any[]>([]);
  const [latencyData, setLatencyData] = useState<any[]>([]);
  const [modelUsageData, setModelUsageData] = useState<any>({});
  
  // Generate mock data when time range changes
  useEffect(() => {
    // Generate request volume data
    setRequestData(generateTimeSeriesData(7, 500, 100));
    
    // Generate cost data
    setCostData(generateTimeSeriesData(7, 50, 10));
    
    // Generate token usage data
    setTokenData(generateTimeSeriesData(7, 10000, 2000));
    
    // Generate latency data
    setLatencyData(generateTimeSeriesData(7, 200, 50));
    
    // Generate model usage data
    setModelUsageData(generateModelUsageData());
  }, [timeRange]);
  
  const handleTimeRangeChange = (range: { start: Date; end: Date }) => {
    setTimeRange(range);
  };
  
  const metricsData = [
    { id: '1', name: 'Total Requests', value: '12,345', change: 5.2, unit: '' },
    { id: '2', name: 'Average Response Time', value: '245', change: -12.3, unit: 'ms' },
    { id: '3', name: 'Cache Hit Rate', value: '68.7', change: 3.1, unit: '%' },
    { id: '4', name: 'Token Savings', value: '42.3', change: 1.5, unit: '%' },
    { id: '5', name: 'Total Cost', value: '$123.45', change: -8.2, unit: '' },
    { id: '6', name: 'Average Request Size', value: '1,234', change: 0, unit: 'tokens' },
  ];
  
  return (
    <PageContainer>
      <h1>Analytics</h1>
      
      <TimeRangeSelector onChange={handleTimeRangeChange} initialRange="week" />
      
      <StatsGrid>
        <Card>
          <CardBody>
            <GaugeChart 
              value={68.7} 
              label="Cache Hit Rate" 
              thresholds={{ warning: 50, critical: 30 }} 
              color="rgba(75, 192, 192, 1)"
            />
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <GaugeChart 
              value={42.3} 
              label="Token Savings" 
              thresholds={{ warning: 20, critical: 10 }} 
              color="rgba(54, 162, 235, 1)"
            />
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <GaugeChart 
              value={245} 
              min={0}
              max={500}
              label="Avg Response Time (ms)" 
              thresholds={{ warning: 300, critical: 400 }} 
              color="rgba(255, 159, 64, 1)"
            />
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <GaugeChart 
              value={98.7} 
              label="Uptime" 
              thresholds={{ warning: 95, critical: 90 }} 
              color="rgba(153, 102, 255, 1)"
            />
          </CardBody>
        </Card>
      </StatsGrid>
      
      <ChartGrid>
        <Card>
          <CardHeader>Request Volume</CardHeader>
          <CardBody>
            <TimeSeriesChart 
              data={requestData} 
              label="Requests" 
              color="rgba(75, 192, 192, 1)" 
              fillArea={true}
              height={300}
            />
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>Cost</CardHeader>
          <CardBody>
            <TimeSeriesChart 
              data={costData} 
              label="Cost ($)" 
              color="rgba(255, 99, 132, 1)" 
              fillArea={true}
              height={300}
            />
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>Token Usage</CardHeader>
          <CardBody>
            <TimeSeriesChart 
              data={tokenData} 
              label="Tokens" 
              color="rgba(54, 162, 235, 1)" 
              fillArea={true}
              height={300}
            />
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>Response Latency</CardHeader>
          <CardBody>
            <TimeSeriesChart 
              data={latencyData} 
              label="Latency (ms)" 
              color="rgba(255, 159, 64, 1)" 
              fillArea={true}
              height={300}
            />
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>Model Usage</CardHeader>
          <CardBody>
            <PieChart data={modelUsageData} height={300} />
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>Key Metrics</CardHeader>
          <CardBody>
            <MetricsTable data={metricsData} showChange={true} />
          </CardBody>
        </Card>
        
        <FullWidthCard>
          <CardHeader>Performance Comparison</CardHeader>
          <CardBody>
            <ComparisonChart 
              series={[
                {
                  label: 'Requests',
                  data: requestData,
                  color: 'rgba(75, 192, 192, 1)',
                },
                {
                  label: 'Response Time',
                  data: latencyData,
                  color: 'rgba(255, 159, 64, 1)',
                },
              ]}
              height={300}
              title="Requests vs. Response Time"
            />
          </CardBody>
        </FullWidthCard>
      </ChartGrid>
    </PageContainer>
  );
};