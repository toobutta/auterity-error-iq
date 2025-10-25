import { DataSourceType, DataSourceConfig } from '../../types/dashboard';

export interface DataSourceResponse<T = any> {
  data: T;
  timestamp: string;
  source: string;
  cache_hit?: boolean;
  execution_time_ms?: number;
  error?: string;
}

export interface DataSourceError {
  message: string;
  code?: string;
  details?: any;
}

export interface DataSourceOptions {
  cache?: {
    enabled: boolean;
    ttl: number;
  };
  timeout?: number;
  retry?: {
    attempts: number;
    backoff: number;
  };
}

export interface DataSourceMetadata {
  name: string;
  type: DataSourceType;
  description?: string;
  schema?: Record<string, any>;
  capabilities: {
    streaming: boolean;
    caching: boolean;
    filtering: boolean;
    sorting: boolean;
    pagination: boolean;
  };
}

export interface DataSourceQueryParams {
  filters?: Record<string, any>;
  sort?: { field: string; order: 'asc' | 'desc' };
  pagination?: { page: number; pageSize: number };
  timeRange?: { start: string; end: string };
}

export interface DataSourceConnection {
  id: string;
  name: string;
  type: DataSourceType;
  config: DataSourceConfig;
  status: 'active' | 'inactive' | 'error';
  lastSyncTime?: string;
  error?: DataSourceError;
}

export interface IDataSource {
  connect(config: DataSourceConfig): Promise<void>;
  disconnect(): Promise<void>;
  fetchData<T>(query: DataSourceQueryParams): Promise<DataSourceResponse<T>>;
  getMetadata(): Promise<DataSourceMetadata>;
  testConnection(): Promise<boolean>;
  getStatus(): Promise<{
    isConnected: boolean;
    lastSync?: string;
    error?: DataSourceError;
  }>;
}
