import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  Button, 
  Form, 
  FormItem, 
  FormGroup, 
  FormActions,
  Input,
  Table
} from '@relaycore/design-system';

const ConfigurationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 20px;
`;

const Tab = styled.div<{ active?: boolean }>`
  padding: 10px 20px;
  cursor: pointer;
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
  color: ${({ active, theme }) => (active ? theme.colors.primary : theme.colors.textPrimary)};
  border-bottom: 2px solid ${({ active, theme }) => (active ? theme.colors.primary : 'transparent')};
`;

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
}

interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  apiKey: string;
}

export const Configuration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  // Mock data
  const apiKeys: ApiKey[] = [
    {
      id: '1',
      name: 'Production',
      key: 'rk_prod_1234567890abcdef',
      created: '2025-07-15T10:30:00Z',
      lastUsed: '2025-08-02T15:45:22Z',
    },
    {
      id: '2',
      name: 'Development',
      key: 'rk_dev_1234567890abcdef',
      created: '2025-07-20T14:15:00Z',
      lastUsed: '2025-08-01T09:12:45Z',
    },
    {
      id: '3',
      name: 'Testing',
      key: 'rk_test_1234567890abcdef',
      created: '2025-07-25T16:45:00Z',
      lastUsed: '2025-07-30T11:30:18Z',
    },
  ];
  
  const providers: Provider[] = [
    {
      id: '1',
      name: 'OpenAI',
      enabled: true,
      priority: 1,
      apiKey: '••••••••••••••••••••••••',
    },
    {
      id: '2',
      name: 'Anthropic',
      enabled: true,
      priority: 2,
      apiKey: '••••••••••••••••••••••••',
    },
    {
      id: '3',
      name: 'Mistral',
      enabled: true,
      priority: 3,
      apiKey: '••••••••••••••••••••••••',
    },
    {
      id: '4',
      name: 'Cohere',
      enabled: false,
      priority: 4,
      apiKey: '',
    },
  ];

  const apiKeyColumns = [
    {
      key: 'name',
      title: 'Name',
    },
    {
      key: 'key',
      title: 'API Key',
    },
    {
      key: 'created',
      title: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'lastUsed',
      title: 'Last Used',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: () => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button size="small" variant="tertiary">Copy</Button>
          <Button size="small" variant="danger">Revoke</Button>
        </div>
      ),
    },
  ];

  const providerColumns = [
    {
      key: 'name',
      title: 'Provider',
    },
    {
      key: 'enabled',
      title: 'Status',
      render: (value: boolean) => (
        <span style={{ 
          color: value ? 'green' : 'red',
          fontWeight: 'bold'
        }}>
          {value ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'priority',
      title: 'Priority',
    },
    {
      key: 'apiKey',
      title: 'API Key',
    },
    {
      key: 'actions',
      title: 'Actions',
      render: () => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button size="small">Edit</Button>
          <Button size="small" variant="tertiary">Test</Button>
        </div>
      ),
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <Card>
            <CardHeader>General Settings</CardHeader>
            <CardBody>
              <Form
                initialValues={{
                  serviceName: 'RelayCore API',
                  logLevel: 'info',
                  maxConcurrentRequests: 100,
                  defaultTimeout: 60,
                }}
                onSubmit={(values) => console.log('Form submitted:', values)}
              >
                <FormGroup title="Service Configuration">
                  <FormItem name="serviceName" label="Service Name">
                    <Input name="serviceName" />
                  </FormItem>
                  <FormItem name="logLevel" label="Log Level">
                    <Input name="logLevel" />
                  </FormItem>
                </FormGroup>
                
                <FormGroup title="Performance Settings">
                  <FormItem name="maxConcurrentRequests" label="Max Concurrent Requests">
                    <Input name="maxConcurrentRequests" type="number" />
                  </FormItem>
                  <FormItem name="defaultTimeout" label="Default Timeout (seconds)">
                    <Input name="defaultTimeout" type="number" />
                  </FormItem>
                </FormGroup>
                
                <FormActions>
                  <Button variant="tertiary">Reset</Button>
                  <Button type="submit">Save Changes</Button>
                </FormActions>
              </Form>
            </CardBody>
          </Card>
        );
      
      case 'apiKeys':
        return (
          <Card>
            <CardHeader>API Keys</CardHeader>
            <CardBody>
              <Button style={{ marginBottom: '20px' }}>Create New API Key</Button>
              <Table
                columns={apiKeyColumns}
                data={apiKeys}
                rowKey="id"
              />
            </CardBody>
          </Card>
        );
      
      case 'providers':
        return (
          <Card>
            <CardHeader>AI Providers</CardHeader>
            <CardBody>
              <Button style={{ marginBottom: '20px' }}>Add Provider</Button>
              <Table
                columns={providerColumns}
                data={providers}
                rowKey="id"
              />
            </CardBody>
          </Card>
        );
      
      case 'caching':
        return (
          <Card>
            <CardHeader>Caching Configuration</CardHeader>
            <CardBody>
              <Form
                initialValues={{
                  cacheEnabled: true,
                  cacheTTL: 3600,
                  semanticCachingEnabled: true,
                  semanticSimilarityThreshold: 0.95,
                }}
                onSubmit={(values) => console.log('Form submitted:', values)}
              >
                <FormGroup title="Cache Settings">
                  <FormItem name="cacheEnabled" label="Enable Caching">
                    <Input name="cacheEnabled" type="checkbox" />
                  </FormItem>
                  <FormItem name="cacheTTL" label="Cache TTL (seconds)">
                    <Input name="cacheTTL" type="number" />
                  </FormItem>
                </FormGroup>
                
                <FormGroup title="Semantic Caching">
                  <FormItem name="semanticCachingEnabled" label="Enable Semantic Caching">
                    <Input name="semanticCachingEnabled" type="checkbox" />
                  </FormItem>
                  <FormItem name="semanticSimilarityThreshold" label="Similarity Threshold">
                    <Input name="semanticSimilarityThreshold" type="number" step="0.01" min="0" max="1" />
                  </FormItem>
                </FormGroup>
                
                <FormActions>
                  <Button variant="tertiary">Reset</Button>
                  <Button type="submit">Save Changes</Button>
                </FormActions>
              </Form>
            </CardBody>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <ConfigurationContainer>
      <h1>Configuration</h1>
      
      <TabsContainer>
        <Tab 
          active={activeTab === 'general'} 
          onClick={() => setActiveTab('general')}
        >
          General
        </Tab>
        <Tab 
          active={activeTab === 'apiKeys'} 
          onClick={() => setActiveTab('apiKeys')}
        >
          API Keys
        </Tab>
        <Tab 
          active={activeTab === 'providers'} 
          onClick={() => setActiveTab('providers')}
        >
          Providers
        </Tab>
        <Tab 
          active={activeTab === 'caching'} 
          onClick={() => setActiveTab('caching')}
        >
          Caching
        </Tab>
      </TabsContainer>
      
      {renderTabContent()}
    </ConfigurationContainer>
  );
};