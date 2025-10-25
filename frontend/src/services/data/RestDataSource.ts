import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BaseDataSource } from './BaseDataSource';
import {
  DataSourceConfig,
  DataSourceMetadata,
  DataSourceQueryParams,
  DataSourceResponse
} from './types';

export class RestDataSource extends BaseDataSource {
  private client: AxiosInstance | null = null;
  private abortController: AbortController | null = null;

  async connect(config: DataSourceConfig): Promise<void> {
    try {
      this.config = config;
      const axiosConfig: AxiosRequestConfig = {
        baseURL: config.endpoint,
        timeout: this.options.timeout,
        headers: config.headers || {}
      };

      // Configure authentication
      if (config.auth) {
        switch (config.auth.type) {
          case 'bearer':
            axiosConfig.headers!.Authorization = `Bearer ${config.auth.credentials.token}`;
            break;
          case 'basic':
            const { username, password } = config.auth.credentials;
            const basicAuth = btoa(`${username}:${password}`);
            axiosConfig.headers!.Authorization = `Basic ${basicAuth}`;
            break;
          case 'api-key':
            const { key, headerName = 'X-API-Key' } = config.auth.credentials;
            axiosConfig.headers![headerName] = key;
            break;
          // OAuth2 would require more complex handling
        }
      }

      this.client = axios.create(axiosConfig);
      this.updateStatus({ isConnected: true, error: undefined });
    } catch (error) {
      const processedError = this.handleError(error);
      this.updateStatus({ isConnected: false, error: processedError });
      throw processedError;
    }
  }

  async disconnect(): Promise<void> {
    this.client = null;
    this.abortController?.abort();
    this.abortController = null;
    this.updateStatus({ isConnected: false });
  }

  async fetchData<T>(query: DataSourceQueryParams): Promise<DataSourceResponse<T>> {
    if (!this.client || !this.config) {
      throw new Error('REST data source not connected');
    }

    const startTime = Date.now();
    this.abortController = new AbortController();

    try {
      const params = this.buildQueryParams(query);
      const method = (this.config.method || 'GET').toLowerCase();
      const requestConfig: AxiosRequestConfig = {
        params,
        signal: this.abortController.signal
      };

      const response = await this.retryOperation(async () => {
        if (method === 'get') {
          return await this.client!.get(this.config!.endpoint || '', requestConfig);
        } else if (method === 'post') {
          return await this.client!.post(this.config!.endpoint || '', this.config!.body, requestConfig);
        }
        throw new Error(`Unsupported HTTP method: ${method}`);
      });

      const executionTime = Date.now() - startTime;

      return {
        data: response.data,
        timestamp: new Date().toISOString(),
        source: 'rest',
        execution_time_ms: executionTime,
        cache_hit: false
      };
    } catch (error) {
      const processedError = this.handleError(error);
      throw processedError;
    }
  }

  async getMetadata(): Promise<DataSourceMetadata> {
    return {
      name: 'REST API',
      type: 'rest',
      description: 'REST API data source for fetching data from HTTP endpoints',
      capabilities: {
        streaming: false,
        caching: true,
        filtering: true,
        sorting: true,
        pagination: true
      }
    };
  }

  private buildQueryParams(query: DataSourceQueryParams): Record<string, any> {
    const params: Record<string, any> = {};

    // Add filters
    if (query.filters) {
      Object.entries(query.filters).forEach(([key, value]) => {
        params[key] = value;
      });
    }

    // Add sorting
    if (query.sort) {
      params.sort_field = query.sort.field;
      params.sort_order = query.sort.order;
    }

    // Add pagination
    if (query.pagination) {
      params.page = query.pagination.page;
      params.page_size = query.pagination.pageSize;
    }

    // Add time range
    if (query.timeRange) {
      params.start_time = query.timeRange.start;
      params.end_time = query.timeRange.end;
    }

    return params;
  }
}
