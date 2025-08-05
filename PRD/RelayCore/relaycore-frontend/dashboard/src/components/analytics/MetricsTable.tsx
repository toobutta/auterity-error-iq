import React from 'react';
import styled from 'styled-components';
import { Table } from '@relaycore/design-system';

export interface MetricData {
  id: string;
  name: string;
  value: number | string;
  change?: number;
  unit?: string;
}

export interface MetricsTableProps {
  data: MetricData[];
  title?: string;
  showChange?: boolean;
}

const TableContainer = styled.div`
  width: 100%;
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 16px;
`;

const ChangeIndicator = styled.span<{ isPositive: boolean; isNeutral: boolean }>`
  color: ${({ isPositive, isNeutral }) => 
    isNeutral ? '#666' : isPositive ? '#4caf50' : '#f44336'};
  display: inline-flex;
  align-items: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 0;
    height: 0;
    margin-right: 4px;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: ${({ isPositive, isNeutral }) => 
      isNeutral ? 'none' : isPositive ? '5px solid #4caf50' : 'none'};
    border-top: ${({ isPositive, isNeutral }) => 
      isNeutral ? 'none' : isPositive ? 'none' : '5px solid #f44336'};
  }
`;

export const MetricsTable: React.FC<MetricsTableProps> = ({
  data,
  title,
  showChange = true,
}) => {
  const columns = [
    {
      id: 'name',
      header: 'Metric',
      accessor: 'name',
    },
    {
      id: 'value',
      header: 'Value',
      accessor: (row: MetricData) => {
        if (row.unit) {
          return `${row.value} ${row.unit}`;
        }
        return row.value;
      },
    },
  ];

  if (showChange) {
    columns.push({
      id: 'change',
      header: 'Change',
      cell: (value: any, row: MetricData) => {
        if (row.change === undefined) return null;
        
        const isPositive = row.change > 0;
        const isNeutral = row.change === 0;
        
        return (
          <ChangeIndicator isPositive={isPositive} isNeutral={isNeutral}>
            {isPositive ? '+' : ''}{row.change}%
          </ChangeIndicator>
        );
      },
    });
  }

  return (
    <TableContainer>
      {title && <Title>{title}</Title>}
      <Table
        columns={columns}
        data={data}
        emptyMessage="No metrics available"
      />
    </TableContainer>
  );
};