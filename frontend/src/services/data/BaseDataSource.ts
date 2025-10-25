import {
  DataSourceConfig,
  DataSourceError,
  DataSourceMetadata,
  DataSourceOptions,
  DataSourceQueryParams,
  DataSourceResponse,
  IDataSource
} from './types';

export abstract class BaseDataSource implements IDataSource {
  protected config: DataSourceConfig | null = null;
  protected options: DataSourceOptions = {
    cache: {
      enabled: false,
      ttl: 300 // 5 minutes default
    },
    timeout: 30000, // 30 seconds default
    retry: {
      attempts: 3,
      backoff: 1000 // 1 second default
    }
  };

  protected status = {
    isConnected: false,
    lastSync: undefined as string | undefined,
    error: undefined as DataSourceError | undefined
  };

  constructor(options?: Partial<DataSourceOptions>) {
    this.options = { ...this.options, ...options };
  }

  abstract connect(config: DataSourceConfig): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract fetchData<T>(query: DataSourceQueryParams): Promise<DataSourceResponse<T>>;
  abstract getMetadata(): Promise<DataSourceMetadata>;

  async testConnection(): Promise<boolean> {
    try {
      if (!this.config) {
        throw new Error('Data source not configured');
      }
      await this.connect(this.config);
      return true;
    } catch (error) {
      return false;
    } finally {
      await this.disconnect();
    }
  }

  getStatus() {
    return Promise.resolve(this.status);
  }

  protected updateStatus(update: Partial<typeof this.status>) {
    this.status = { ...this.status, ...update };
  }

  protected handleError(error: any): DataSourceError {
    const baseError: DataSourceError = {
      message: 'An error occurred while processing the data source request'
    };

    if (error instanceof Error) {
      return {
        ...baseError,
        message: error.message,
        details: error.stack
      };
    }

    if (typeof error === 'string') {
      return {
        ...baseError,
        message: error
      };
    }

    return {
      ...baseError,
      details: error
    };
  }

  protected async retryOperation<T>(
    operation: () => Promise<T>,
    attempts = this.options.retry?.attempts
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempts && attempts > 1) {
        await new Promise(resolve => 
          setTimeout(resolve, this.options.retry?.backoff || 1000)
        );
        return this.retryOperation(operation, attempts - 1);
      }
      throw error;
    }
  }

  protected getCacheKey(query: DataSourceQueryParams): string {
    return JSON.stringify({
      config: this.config,
      query
    });
  }
}
