import { BaseDataSource } from './BaseDataSource';
import {
  DataSourceConfig,
  DataSourceMetadata,
  DataSourceQueryParams,
  DataSourceResponse
} from './types';

export class DatabaseDataSource extends BaseDataSource {
  private connection: any = null; // Will be typed based on the database client

  async connect(config: DataSourceConfig): Promise<void> {
    try {
      this.config = config;
      
      // The actual connection logic will depend on the database type
      // For now, we'll make a REST call to our backend service that manages DB connections
      const response = await fetch('/api/database/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error('Failed to establish database connection');
      }

      const connectionInfo = await response.json();
      this.connection = connectionInfo;
      this.updateStatus({ isConnected: true, error: undefined });
    } catch (error) {
      const processedError = this.handleError(error);
      this.updateStatus({ isConnected: false, error: processedError });
      throw processedError;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await fetch('/api/database/disconnect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            connectionId: this.connection.id
          })
        });
      } catch (error) {
        console.error('Error disconnecting from database:', error);
      }
    }
    
    this.connection = null;
    this.updateStatus({ isConnected: false });
  }

  async fetchData<T>(query: DataSourceQueryParams): Promise<DataSourceResponse<T>> {
    if (!this.connection || !this.config) {
      throw new Error('Database not connected');
    }

    const startTime = Date.now();

    try {
      const queryParams = this.buildQueryParams(query);
      const response = await this.retryOperation(async () => {
        const result = await fetch('/api/database/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            connectionId: this.connection.id,
            query: queryParams
          })
        });

        if (!result.ok) {
          throw new Error('Database query failed');
        }

        return result.json();
      });

      const executionTime = Date.now() - startTime;

      return {
        data: response.data,
        timestamp: new Date().toISOString(),
        source: 'database',
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
      name: 'Database',
      type: 'database',
      description: 'Database connection for querying structured data',
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
    // Convert the generic query params to database-specific query format
    const params: Record<string, any> = {
      select: this.config?.query?.select || '*',
      from: this.config?.query?.from,
      where: {}
    };

    // Add filters
    if (query.filters) {
      params.where = query.filters;
    }

    // Add sorting
    if (query.sort) {
      params.orderBy = {
        field: query.sort.field,
        direction: query.sort.order.toUpperCase()
      };
    }

    // Add pagination
    if (query.pagination) {
      params.limit = query.pagination.pageSize;
      params.offset = (query.pagination.page - 1) * query.pagination.pageSize;
    }

    // Add time range if applicable
    if (query.timeRange) {
      params.where.timeRange = {
        field: this.config?.query?.timeField || 'created_at',
        start: query.timeRange.start,
        end: query.timeRange.end
      };
    }

    return params;
  }
}
