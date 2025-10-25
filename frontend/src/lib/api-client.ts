/**
 * Standardized API client for Auterity Error-IQ
 * Provides consistent error handling, authentication, and request management
 */

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

export class ApiErrorClass implements ApiError {
  message: string;
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    this.message = message;
    this.status = status;
    this.details = details;
  }
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(baseURL = '/api', timeout = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null): void {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      timeout = this.timeout,
    } = config;

    // Build URL with query parameters
    let url = `${this.baseURL}${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: { ...this.defaultHeaders, ...headers },
      signal: AbortSignal.timeout(timeout),
    };

    // Add body for non-GET requests
    if (method !== 'GET' && body) {
      if (body instanceof FormData) {
        // Remove Content-Type for FormData (browser sets it automatically)
        const headersCopy = { ...requestOptions.headers } as Record<string, string>;
        delete headersCopy['Content-Type'];
        requestOptions.headers = headersCopy;
        requestOptions.body = body;
      } else {
        requestOptions.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiErrorClass(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error;
      }

      // Network or other errors
      throw new ApiErrorClass(
        error instanceof Error ? error.message : 'Network error',
        0,
        error
      );
    }
  }

  // HTTP method helpers
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST' });
  }

  async put<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT' });
  }

  async patch<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH' });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // File upload helper
  async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName = 'file',
    additionalData?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for testing or multiple instances
export default ApiClient;


