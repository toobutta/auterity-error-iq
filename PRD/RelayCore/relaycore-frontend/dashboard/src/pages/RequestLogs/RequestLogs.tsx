import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, Table, Input, Button } from '@relaycore/design-system';

const RequestLogsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

interface RequestLog {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  status: string;
  latency: number;
  tokens: number;
  cost: number;
  endpoint: string;
}

export const RequestLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Mock data
  const requestLogs: RequestLog[] = [
    {
      id: '1',
      timestamp: '2025-08-02T15:30:45Z',
      provider: 'OpenAI',
      model: 'gpt-4',
      status: 'success',
      latency: 1250,
      tokens: 350,
      cost: 0.07,
      endpoint: '/v1/chat/completions',
    },
    {
      id: '2',
      timestamp: '2025-08-02T15:28:12Z',
      provider: 'Anthropic',
      model: 'claude-3-opus',
      status: 'success',
      latency: 1800,
      tokens: 520,
      cost: 0.12,
      endpoint: '/v1/messages',
    },
    {
      id: '3',
      timestamp: '2025-08-02T15:25:33Z',
      provider: 'Mistral',
      model: 'mistral-large',
      status: 'success',
      latency: 950,
      tokens: 280,
      cost: 0.04,
      endpoint: '/v1/chat/completions',
    },
    {
      id: '4',
      timestamp: '2025-08-02T15:20:18Z',
      provider: 'OpenAI',
      model: 'gpt-4',
      status: 'error',
      latency: 350,
      tokens: 0,
      cost: 0,
      endpoint: '/v1/chat/completions',
    },
    {
      id: '5',
      timestamp: '2025-08-02T15:15:45Z',
      provider: 'Anthropic',
      model: 'claude-3-sonnet',
      status: 'success',
      latency: 1100,
      tokens: 420,
      cost: 0.06,
      endpoint: '/v1/messages',
    },
  ];

  const columns = [
    {
      key: 'timestamp',
      title: 'Timestamp',
      render: (value: string) => new Date(value).toLocaleString(),
      sortable: true,
    },
    {
      key: 'provider',
      title: 'Provider',
      sortable: true,
    },
    {
      key: 'model',
      title: 'Model',
      sortable: true,
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => (
        <span style={{ 
          color: value === 'success' ? 'green' : 'red',
          fontWeight: 'bold'
        }}>
          {value}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'latency',
      title: 'Latency (ms)',
      sortable: true,
    },
    {
      key: 'tokens',
      title: 'Tokens',
      sortable: true,
    },
    {
      key: 'cost',
      title: 'Cost ($)',
      render: (value: number) => value.toFixed(4),
      sortable: true,
    },
    {
      key: 'endpoint',
      title: 'Endpoint',
      sortable: true,
    },
  ];

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleRowClick = (record: RequestLog) => {
    console.log('Clicked record:', record);
    // Open request details modal
  };

  return (
    <RequestLogsContainer>
      <h1>Request Logs</h1>
      
      <FiltersContainer>
        <FilterGroup>
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button>Search</Button>
        </FilterGroup>
        
        <FilterGroup>
          <Button variant="tertiary">Filter</Button>
          <Button variant="tertiary">Export</Button>
        </FilterGroup>
      </FiltersContainer>
      
      <Card>
        <Table
          columns={columns}
          data={requestLogs}
          rowKey="id"
          onRowClick={handleRowClick}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          striped
        />
      </Card>
    </RequestLogsContainer>
  );
};