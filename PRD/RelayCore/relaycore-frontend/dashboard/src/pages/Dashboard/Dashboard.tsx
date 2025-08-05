import React from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '@relaycore/design-system';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
`;

const StatCard = styled(Card)`
  padding: 20px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ChartContainer = styled.div`
  height: 300px;
  margin-top: 20px;
`;

export const Dashboard: React.FC = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <StatsGrid>
        <StatCard>
          <StatValue>12,345</StatValue>
          <StatLabel>Total Requests</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>$123.45</StatValue>
          <StatLabel>Total Cost</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>98.7%</StatValue>
          <StatLabel>Cache Hit Rate</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>45.6%</StatValue>
          <StatLabel>Token Savings</StatLabel>
        </StatCard>
      </StatsGrid>
      
      <DashboardContainer>
        <Card>
          <CardHeader>Request Volume</CardHeader>
          <CardBody>
            <ChartContainer>
              {/* Chart will be implemented here */}
              <div>Request volume chart placeholder</div>
            </ChartContainer>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>Cost Breakdown</CardHeader>
          <CardBody>
            <ChartContainer>
              {/* Chart will be implemented here */}
              <div>Cost breakdown chart placeholder</div>
            </ChartContainer>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>Model Usage</CardHeader>
          <CardBody>
            <ChartContainer>
              {/* Chart will be implemented here */}
              <div>Model usage chart placeholder</div>
            </ChartContainer>
          </CardBody>
        </Card>
        
        <Card>
          <CardHeader>Token Usage</CardHeader>
          <CardBody>
            <ChartContainer>
              {/* Chart will be implemented here */}
              <div>Token usage chart placeholder</div>
            </ChartContainer>
          </CardBody>
        </Card>
      </DashboardContainer>
    </div>
  );
};