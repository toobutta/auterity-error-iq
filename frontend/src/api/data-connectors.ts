// Data Connectors API Functions

import client from './client';

export interface DataSourceConnection {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  status: string;
  last_connected?: number;
  error_message?: string;
}

export interface QueryResult {
  data: any;
  metadata: Record<string, any>;
  execution_time: number;
  success: boolean;
  error_message?: string;
}

export interface DataSourceType {
  value: string;
  label: string;
}

export interface QueryTemplate {
  name: string;
  description: string;
  template: string;
}

export interface ConnectionHealth {
  id: string;
  name: string;
  healthy: boolean;
  status: string;
  last_connected?: number;
  error_message?: string;
  response_time?: number;
}

// Connection Management
export const createConnection = async (
  connection: Omit<DataSourceConnection, 'id' | 'status' | 'last_connected' | 'error_message'>
): Promise<{ id: string; name: string; type: string; status: string; message: string }> => {
  const response = await client.post('/data-connectors/connections', connection);
  return response.data;
};

export const getConnections = async (): Promise<Omit<DataSourceConnection, 'config'>[]> => {
  const response = await client.get('/data-connectors/connections');
  return response.data;
};

export const getConnection = async (id: string): Promise<DataSourceConnection> => {
  const response = await client.get(`/data-connectors/connections/${id}`);
  return response.data;
};

export const updateConnection = async (
  id: string,
  updates: Partial<Pick<DataSourceConnection, 'name' | 'config'>>
): Promise<DataSourceConnection> => {
  const response = await client.put(`/data-connectors/connections/${id}`, updates);
  return response.data;
};

export const deleteConnection = async (id: string): Promise<void> => {
  await client.delete(`/data-connectors/connections/${id}`);
};

export const testConnection = async (id: string): Promise<{
  id: string;
  name: string;
  success: boolean;
  status: string;
  error_message?: string;
  last_tested?: number;
}> => {
  const response = await client.post(`/data-connectors/connections/${id}/test`);
  return response.data;
};

// Query Execution
export const executeQuery = async (
  connectionId: string,
  query: string,
  params?: Record<string, any>
): Promise<QueryResult> => {
  const response = await client.post(`/data-connectors/connections/${connectionId}/query`, {
    query,
    params
  });
  return response.data;
};

// Schema and Metadata
export const getConnectionSchema = async (id: string): Promise<Record<string, any>> => {
  const response = await client.get(`/data-connectors/connections/${id}/schema`);
  return response.data;
};

export const getSupportedTypes = async (): Promise<DataSourceType[]> => {
  const response = await client.get('/data-connectors/types');
  return response.data;
};

export const getQueryTemplates = async (dataSourceType: string): Promise<QueryTemplate[]> => {
  const response = await client.get(`/data-connectors/query-templates/${dataSourceType}`);
  return response.data;
};

// Health and Monitoring
export const getConnectionHealth = async (id: string): Promise<ConnectionHealth> => {
  const response = await client.get(`/data-connectors/connections/${id}/health`);
  return response.data;
};

export const bulkTestConnections = async (connectionIds: string[]): Promise<{
  id: string;
  name?: string;
  success: boolean;
  status?: string;
  error_message?: string;
}[]> => {
  const response = await client.post('/data-connectors/bulk-test', connectionIds);
  return response.data;
};

// Analytics
export const getConnectorAnalytics = async (): Promise<{
  total_connections: number;
  connections_by_type: Record<string, number>;
  connections_by_status: Record<string, number>;
  healthy_connections: number;
  unhealthy_connections: number;
}> => {
  const response = await client.get('/data-connectors/analytics');
  return response.data;
};

// Utility Functions
export const validateConnectionConfig = (
  type: string,
  config: Record<string, any>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  switch (type) {
    case 'rest_api':
      if (!config.base_url) {
        errors.push('Base URL is required');
      }
      if (config.auth_type && !config.auth_config) {
        errors.push('Auth config is required when auth type is specified');
      }
      break;

    case 'postgresql':
      if (!config.host) errors.push('Host is required');
      if (!config.database) errors.push('Database name is required');
      if (!config.username) errors.push('Username is required');
      break;

    case 'mongodb':
      if (!config.host) errors.push('Host is required');
      if (!config.database) errors.push('Database name is required');
      break;

    case 'redis':
      if (!config.host) errors.push('Host is required');
      break;

    case 'elasticsearch':
      if (!Array.isArray(config.hosts) || config.hosts.length === 0) {
        errors.push('At least one Elasticsearch host is required');
      }
      break;

    case 's3':
      if (!config.bucket_name) errors.push('Bucket name is required');
      if (!config.region) errors.push('Region is required');
      break;

    case 'bigquery':
      if (!config.project_id) errors.push('Project ID is required');
      if (!config.dataset_id) errors.push('Dataset ID is required');
      break;

    case 'snowflake':
      if (!config.account) errors.push('Account is required');
      if (!config.database) errors.push('Database is required');
      if (!config.schema) errors.push('Schema is required');
      break;

    case 'kafka':
      if (!Array.isArray(config.brokers) || config.brokers.length === 0) {
        errors.push('At least one Kafka broker is required');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const getConnectionTypeDescription = (type: string): string => {
  const descriptions: Record<string, string> = {
    rest_api: 'Connect to REST APIs and web services',
    postgresql: 'Connect to PostgreSQL databases',
    mysql: 'Connect to MySQL databases',
    mongodb: 'Connect to MongoDB databases',
    redis: 'Connect to Redis data stores',
    elasticsearch: 'Connect to Elasticsearch clusters',
    s3: 'Connect to Amazon S3 storage',
    bigquery: 'Connect to Google BigQuery',
    snowflake: 'Connect to Snowflake data warehouse',
    kafka: 'Connect to Kafka message streams',
    websocket: 'Connect to WebSocket data streams',
    file_upload: 'Upload and process files'
  };

  return descriptions[type] || 'Unknown data source type';
};

export const getDefaultConnectionConfig = (type: string): Record<string, any> => {
  const defaults: Record<string, Record<string, any>> = {
    rest_api: {
      base_url: '',
      timeout: 30,
      rate_limit: 100,
      auth_type: 'none',
      auth_config: {}
    },
    postgresql: {
      host: 'localhost',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl_mode: 'require'
    },
    mysql: {
      host: 'localhost',
      port: 3306,
      database: '',
      username: '',
      password: ''
    },
    mongodb: {
      host: 'localhost',
      port: 27017,
      database: '',
      username: '',
      password: '',
      auth_source: 'admin'
    },
    redis: {
      host: 'localhost',
      port: 6379,
      password: '',
      db: 0
    },
    elasticsearch: {
      hosts: ['localhost:9200'],
      username: '',
      password: '',
      use_ssl: false
    },
    s3: {
      bucket_name: '',
      region: 'us-east-1',
      access_key_id: '',
      secret_access_key: ''
    },
    bigquery: {
      project_id: '',
      dataset_id: '',
      credentials_file: ''
    },
    snowflake: {
      account: '',
      database: '',
      schema: '',
      warehouse: '',
      username: '',
      password: ''
    },
    kafka: {
      brokers: ['localhost:9092'],
      group_id: '',
      auto_offset_reset: 'latest'
    },
    websocket: {
      url: '',
      reconnect_interval: 5000,
      max_reconnect_attempts: 10
    },
    file_upload: {
      max_file_size: 10485760, // 10MB
      allowed_extensions: ['.csv', '.json', '.xml', '.xlsx', '.txt'],
      upload_path: '/uploads'
    }
  };

  return defaults[type] || {};
};

// Connection templates for quick setup
export const getConnectionTemplates = (): Array<{
  name: string;
  type: string;
  description: string;
  config: Record<string, any>;
}> => [
  {
    name: 'Local PostgreSQL',
    type: 'postgresql',
    description: 'Connect to a local PostgreSQL database',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      password: '',
      ssl_mode: 'disable'
    }
  },
  {
    name: 'Local MongoDB',
    type: 'mongodb',
    description: 'Connect to a local MongoDB instance',
    config: {
      host: 'localhost',
      port: 27017,
      database: 'test',
      username: '',
      password: '',
      auth_source: 'admin'
    }
  },
  {
    name: 'Local Redis',
    type: 'redis',
    description: 'Connect to a local Redis instance',
    config: {
      host: 'localhost',
      port: 6379,
      password: '',
      db: 0
    }
  },
  {
    name: 'JSONPlaceholder API',
    type: 'rest_api',
    description: 'Sample REST API for testing',
    config: {
      base_url: 'https://jsonplaceholder.typicode.com',
      timeout: 30,
      rate_limit: 100,
      auth_type: 'none',
      auth_config: {}
    }
  },
  {
    name: 'GitHub API',
    type: 'rest_api',
    description: 'Connect to GitHub REST API',
    config: {
      base_url: 'https://api.github.com',
      timeout: 30,
      rate_limit: 60,
      auth_type: 'bearer',
      auth_config: {
        token: '' // User needs to provide their token
      }
    }
  }
];
