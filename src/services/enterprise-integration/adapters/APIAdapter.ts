/**
 * API Integration Adapter
 * Provides enterprise-grade API integration with REST, SOAP, and GraphQL
 * support including authentication, rate limiting, and error handling
 */

import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { IntegrationEndpoint, Message } from '../EnterpriseIntegrationBus';

export interface APIConfig {
  type: 'rest' | 'soap' | 'graphql';
  baseUrl: string;
  timeout: number;
  retries: number;
  auth?: {
    type: 'basic' | 'bearer' | 'oauth2' | 'api_key' | 'custom';
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    customAuth?: (config: AxiosRequestConfig) => Promise<AxiosRequestConfig>;
  };
  headers?: Record<string, string>;
  rateLimit?: {
    requests: number;
    period: number; // in milliseconds
  };
  ssl?: {
    rejectUnauthorized?: boolean;
    cert?: string;
    key?: string;
    ca?: string;
  };
}

export interface APIOperation {
  type: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';
  endpoint: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document' | 'stream';
  transformRequest?: (data: any) => any;
  transformResponse?: (data: any) => any;
}

export interface SOAPOperation extends APIOperation {
  soapAction?: string;
  soapVersion?: '1.1' | '1.2';
  namespaces?: Record<string, string>;
}

export interface GraphQLOperation extends APIOperation {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export class APIAdapter {
  private config: APIConfig;
  private axiosInstance;
  private rateLimitTokens: number;
  private rateLimitResetTime: number;
  private requestQueue: Array<{
    operation: APIOperation;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(config: APIConfig) {
    this.config = config;
    this.rateLimitTokens = config.rateLimit?.requests || 100;
    this.rateLimitResetTime = Date.now() + (config.rateLimit?.period || 60000);

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      httpsAgent: config.ssl ? {
        rejectUnauthorized: config.ssl.rejectUnauthorized !== false,
        cert: config.ssl.cert,
        key: config.ssl.key,
        ca: config.ssl.ca
      } : undefined
    });

    // Add request/response interceptors
    this.setupInterceptors();
  }

  /**
   * Execute API operation
   */
  async execute(operation: APIOperation): Promise<any> {
    try {
      // Apply rate limiting
      await this.applyRateLimit();

      // Apply authentication
      const config = await this.applyAuthentication(operation);

      // Execute request with retry logic
      return await this.executeWithRetry(config, operation.retries || this.config.retries);

    } catch (error) {
      console.error('API operation failed:', error);
      throw error;
    }
  }

  /**
   * Execute SOAP operation
   */
  async executeSOAP(operation: SOAPOperation): Promise<any> {
    try {
      const soapEnvelope = this.buildSOAPEnvelope(operation);
      const soapConfig: APIOperation = {
        ...operation,
        type: 'post',
        data: soapEnvelope,
        headers: {
          'Content-Type': `application/soap+xml; charset=utf-8${operation.soapAction ? `; action="${operation.soapAction}"` : ''}`,
          'SOAPAction': operation.soapAction || '',
          ...operation.headers
        }
      };

      const response = await this.execute(soapConfig);
      return this.parseSOAPResponse(response.data);

    } catch (error) {
      console.error('SOAP operation failed:', error);
      throw error;
    }
  }

  /**
   * Execute GraphQL operation
   */
  async executeGraphQL(operation: GraphQLOperation): Promise<any> {
    try {
      const graphqlConfig: APIOperation = {
        ...operation,
        type: 'post',
        data: {
          query: operation.query,
          variables: operation.variables,
          operationName: operation.operationName
        },
        headers: {
          'Content-Type': 'application/json',
          ...operation.headers
        }
      };

      const response = await this.execute(graphqlConfig);
      return response.data;

    } catch (error) {
      console.error('GraphQL operation failed:', error);
      throw error;
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<{
    status: 'connected' | 'failed';
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const response = await this.axiosInstance.get('/health', {
        timeout: 5000,
        validateStatus: () => true // Accept any status code
      });

      const responseTime = Date.now() - startTime;

      return {
        status: response.status >= 200 && response.status < 300 ? 'connected' : 'failed',
        responseTime,
        error: response.status >= 400 ? `HTTP ${response.status}: ${response.statusText}` : undefined
      };

    } catch (error: any) {
      return {
        status: 'failed',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // Private methods

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add correlation ID if not present
        if (!config.headers['X-Correlation-ID']) {
          config.headers['X-Correlation-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Add timestamp
        config.headers['X-Timestamp'] = new Date().toISOString();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log successful responses
        console.log(`API ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      async (error) => {
        // Enhanced error logging
        const config = error.config;
        console.error(`API Error: ${config?.method?.toUpperCase()} ${config?.url}`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          correlationId: config?.headers['X-Correlation-ID']
        });

        return Promise.reject(error);
      }
    );
  }

  private async applyRateLimit(): Promise<void> {
    if (!this.config.rateLimit) return;

    const now = Date.now();

    // Reset tokens if period has passed
    if (now >= this.rateLimitResetTime) {
      this.rateLimitTokens = this.config.rateLimit.requests;
      this.rateLimitResetTime = now + this.config.rateLimit.period;
    }

    // Check if we have available tokens
    if (this.rateLimitTokens <= 0) {
      // Wait for token reset
      const waitTime = this.rateLimitResetTime - now;
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.rateLimitTokens = this.config.rateLimit.requests;
        this.rateLimitResetTime = Date.now() + this.config.rateLimit.period;
      }
    }

    // Consume token
    this.rateLimitTokens--;
  }

  private async applyAuthentication(operation: APIOperation): Promise<AxiosRequestConfig> {
    if (!this.config.auth) return {};

    const config: AxiosRequestConfig = {
      headers: { ...operation.headers }
    };

    switch (this.config.auth.type) {
      case 'basic':
        if (this.config.auth.username && this.config.auth.password) {
          const auth = Buffer.from(`${this.config.auth.username}:${this.config.auth.password}`).toString('base64');
          config.headers!.Authorization = `Basic ${auth}`;
        }
        break;

      case 'bearer':
        if (this.config.auth.token) {
          config.headers!.Authorization = `Bearer ${this.config.auth.token}`;
        }
        break;

      case 'api_key':
        if (this.config.auth.apiKey) {
          config.headers![this.config.auth.apiKey.includes(':') ? this.config.auth.apiKey.split(':')[0] : 'X-API-Key'] =
            this.config.auth.apiKey.includes(':') ? this.config.auth.apiKey.split(':')[1] : this.config.auth.apiKey;
        }
        break;

      case 'oauth2':
        // Implement OAuth2 token refresh logic here
        if (this.config.auth.token) {
          config.headers!.Authorization = `Bearer ${this.config.auth.token}`;
        }
        break;

      case 'custom':
        if (this.config.auth.customAuth) {
          return await this.config.auth.customAuth(config);
        }
        break;
    }

    return config;
  }

  private async executeWithRetry(
    config: AxiosRequestConfig,
    retries: number,
    attempt: number = 1
  ): Promise<AxiosResponse> {
    try {
      const fullConfig: AxiosRequestConfig = {
        method: config.method || 'get',
        url: config.url,
        data: config.data,
        params: config.params,
        headers: {
          ...this.axiosInstance.defaults.headers,
          ...config.headers
        },
        timeout: config.timeout || this.config.timeout,
        responseType: config.responseType
      };

      // Apply transformations
      if (config.transformRequest) {
        fullConfig.data = config.transformRequest(fullConfig.data);
      }

      if (config.transformResponse) {
        fullConfig.transformResponse = [config.transformResponse];
      }

      return await this.axiosInstance.request(fullConfig);

    } catch (error: any) {
      // Check if we should retry
      if (attempt < retries && this.shouldRetry(error)) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(config, retries, attempt + 1);
      }

      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx status codes
    if (!error.response) return true; // Network error
    if (error.response.status >= 500) return true; // Server error
    if (error.response.status === 429) return true; // Rate limited

    return false;
  }

  private buildSOAPEnvelope(operation: SOAPOperation): string {
    const soapVersion = operation.soapVersion || '1.1';
    const namespaces = operation.namespaces || {};

    const envelopeNS = soapVersion === '1.2'
      ? 'http://www.w3.org/2003/05/soap-envelope'
      : 'http://schemas.xmlsoap.org/soap/envelope/';

    let envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="${envelopeNS}"`;

    // Add custom namespaces
    Object.entries(namespaces).forEach(([prefix, uri]) => {
      envelope += ` xmlns:${prefix}="${uri}"`;
    });

    envelope += `>
<soap:Header/>
<soap:Body>`;

    // Add operation body
    if (operation.data) {
      envelope += operation.data;
    }

    envelope += `
</soap:Body>
</soap:Envelope>`;

    return envelope;
  }

  private parseSOAPResponse(soapResponse: string): any {
    // Simple SOAP response parser
    // In production, you'd use a proper XML parser
    try {
      // Extract the body content between <soap:Body> tags
      const bodyMatch = soapResponse.match(/<soap:Body[^>]*>([\s\S]*?)<\/soap:Body>/i);
      if (bodyMatch) {
        return { data: bodyMatch[1] };
      }

      return { data: soapResponse };

    } catch (error) {
      console.error('Failed to parse SOAP response:', error);
      return { error: 'Failed to parse SOAP response', raw: soapResponse };
    }
  }
}

// Factory functions
export function createAPIAdapter(config: APIConfig): APIAdapter {
  return new APIAdapter(config);
}

export function createAPIEndpoint(
  id: string,
  name: string,
  config: APIConfig,
  operations: APIOperation[]
): IntegrationEndpoint {
  const adapter = new APIAdapter(config);

  return {
    id,
    type: 'processor',
    name,
    uri: `api://${config.type}/${config.baseUrl}`,
    config: { adapter, operations },
    enabled: true,
    errorHandler: async (error, message) => {
      console.error(`API endpoint ${id} error:`, error);
      // Could send to error queue or retry
    }
  };
}

// Pre-built adapters for common services
export function createSlackAdapter(token: string): APIAdapter {
  return new APIAdapter({
    type: 'rest',
    baseUrl: 'https://slack.com/api',
    timeout: 10000,
    retries: 3,
    auth: {
      type: 'bearer',
      token
    }
  });
}

export function createGitHubAdapter(token: string): APIAdapter {
  return new APIAdapter({
    type: 'rest',
    baseUrl: 'https://api.github.com',
    timeout: 10000,
    retries: 3,
    auth: {
      type: 'bearer',
      token
    },
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Auterity-Integration/1.0'
    }
  });
}

export function createSalesforceAdapter(instanceUrl: string, accessToken: string): APIAdapter {
  return new APIAdapter({
    type: 'rest',
    baseUrl: instanceUrl,
    timeout: 30000,
    retries: 2,
    auth: {
      type: 'bearer',
      token: accessToken
    },
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
}

export function createStripeAdapter(secretKey: string): APIAdapter {
  return new APIAdapter({
    type: 'rest',
    baseUrl: 'https://api.stripe.com/v1',
    timeout: 10000,
    retries: 3,
    auth: {
      type: 'basic',
      username: secretKey,
      password: ''
    }
  });
}

