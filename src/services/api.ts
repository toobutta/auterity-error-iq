import { authService } from './authService';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5055';
const API_KEY = import.meta.env.VITE_API_KEY ?? 'dev-api-key-123'; // Fallback for development

/**
 * Standardized API response interface
 */
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

/**
 * Standardized API error interface
 */
export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

/**
 * Custom API error class
 */
export class ApiErrorClass extends Error implements ApiError {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Request configuration interface
 */
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
}

class ApiClient {
  private async getHeaders(includeAuth = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      try {
        const token = await authService.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          // Fallback to API key for development
          headers['x-api-key'] = API_KEY;
        }
      } catch (error) {
        console.warn('Failed to get auth token, falling back to API key:', error);
        headers['x-api-key'] = API_KEY;
      }
    } else {
      headers['x-api-key'] = API_KEY;
    }

    return headers;
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers = await this.getHeaders(options.method !== 'GET');
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new ApiErrorClass(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    return response.json();
  }

  /**
   * Standardized request method with enhanced error handling
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, API_BASE);

    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const requestOptions: RequestInit = {
      method: config.method || 'GET',
      headers: await this.getHeaders(config.method !== 'GET'),
    };

    if (config.body && config.method !== 'GET') {
      if (config.body instanceof FormData) {
        // For FormData, remove Content-Type header to let browser set it with boundary
        const headers = { ...(requestOptions.headers as Record<string, string>) };
        delete headers['Content-Type'];
        requestOptions.headers = headers;
        requestOptions.body = config.body;
      } else {
        requestOptions.body = JSON.stringify(config.body);
      }
    }

    // Override headers if provided
    if (config.headers) {
      requestOptions.headers = { ...(requestOptions.headers as Record<string, string>), ...config.headers };
    }

    try {
      const response = await fetch(url.toString(), requestOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiErrorClass(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
        message: response.statusText,
      };
    } catch (error) {
      if (error instanceof ApiErrorClass) {
        throw error;
      }
      throw new ApiErrorClass(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  async getWorkflow(id: string) {
    const url = `${API_BASE}/v1/workflows/${id}`;
    const response = await fetch(url, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    const etag = response.headers.get('etag') ?? undefined;
    const json = await response.json();
    return { json, etag };
  }

  async saveWorkflow(id: string, payload: unknown) {
    const url = `${API_BASE}/v1/workflows/${id}`;
    return this.makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async createWorkflow(payload: unknown) {
    const url = `${API_BASE}/v1/workflows`;
    return this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listWorkflows(workspaceId?: string, projectId?: string) {
    let url = `${API_BASE}/v1/workflows`;
    const params = new URLSearchParams();
    if (workspaceId) params.append('workspace', workspaceId);
    if (projectId) params.append('project', projectId);
    if (params.toString()) url += `?${params.toString()}`;

    return this.makeRequest(url);
  }

  async deleteWorkflow(id: string) {
    const url = `${API_BASE}/v1/workflows/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }
  }

  async executeWorkflow(id: string, inputs?: Record<string, any>) {
    const url = `${API_BASE}/v1/workflows/${id}/execute`;
    return this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ inputs }),
    });
  }

  async getExecutionStatus(executionId: string) {
    const url = `${API_BASE}/v1/executions/${executionId}`;
    return this.makeRequest(url);
  }

  async getTemplates(category?: string) {
    let url = `${API_BASE}/v1/templates`;
    if (category) url += `?category=${encodeURIComponent(category)}`;
    return this.makeRequest(url);
  }

  async importWorkflow(payload: unknown) {
    const url = `${API_BASE}/v1/workflows/import`;
    return this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async exportWorkflow(id: string, format: 'json' | 'png' | 'svg' = 'json') {
    const url = `${API_BASE}/v1/workflows/${id}/export?format=${format}`;
    const response = await fetch(url, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    if (format === 'json') {
      return response.json();
    } else {
      return response.blob();
    }
  }

  /**
   * Standardized GET request
   */
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * Standardized POST request
   */
  async post<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * Standardized PUT request
   */
  async put<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * Standardized DELETE request
   */
  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * File upload with progress tracking
   */
  async uploadFile<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    // For file uploads, we'll use the legacy makeRequest method but with better error handling
    const url = `${API_BASE}${endpoint}`;
    const headers = await this.getHeaders(true);
    // Remove Content-Type for FormData
    const uploadHeaders = { ...headers };
    delete uploadHeaders['Content-Type'];

    const response = await fetch(url, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new ApiErrorClass(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
      message: response.statusText,
    };
  }

  // AI Hub integration methods
  async callAIFunction(functionName: string, parameters: Record<string, any>) {
    const url = `${API_BASE}/v1/ai/functions/${functionName}`;
    return this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(parameters),
    });
  }

  async getAIFunctions() {
    const url = `${API_BASE}/v1/ai/functions`;
    return this.makeRequest(url);
  }

  // Workspace and project management
  async getWorkspaces() {
    const url = `${API_BASE}/v1/workspaces`;
    return this.makeRequest(url);
  }

  async getProjects(workspaceId: string) {
    const url = `${API_BASE}/v1/workspaces/${workspaceId}/projects`;
    return this.makeRequest(url);
  }

  async createWorkspace(name: string) {
    const url = `${API_BASE}/v1/workspaces`;
    return this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async createProject(workspaceId: string, name: string, environment: string) {
    const url = `${API_BASE}/v1/workspaces/${workspaceId}/projects`;
    return this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ name, environment }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Legacy exports for backward compatibility
export async function getCanonical(id: string) {
  const result = await apiClient.getWorkflow(id);
  return result;
}

export async function importCanonical(payload: unknown) {
  return apiClient.importWorkflow(payload);
}

export async function exportReactFlow(payload: unknown) {
  // This function expects the old format, we'll need to adapt
  return apiClient.importWorkflow(payload);
}
