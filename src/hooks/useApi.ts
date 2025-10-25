import React, { useState, useCallback } from 'react';
import { apiClient, ApiResponse, ApiErrorClass, RequestConfig } from '../services/api.js';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiErrorClass | null;
}

export function useApi<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    params?: Record<string, string>;
    autoFetch?: boolean;
  } = {}
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      let response: ApiResponse<T>;
      switch (options.method) {
        case 'POST':
          response = await apiClient.post<T>(endpoint, options.body, { params: options.params });
          break;
        case 'PUT':
          response = await apiClient.put<T>(endpoint, options.body, { params: options.params });
          break;
        case 'DELETE':
          response = await apiClient.delete<T>(endpoint, { params: options.params });
          break;
        default:
          response = await apiClient.get<T>(endpoint, { params: options.params });
      }
      setState({ data: response.data, loading: false, error: null });
      return response.data;
    } catch (error) {
      const apiError = error instanceof ApiErrorClass ? error : new ApiErrorClass('Unknown error', 0);
      setState({ data: null, loading: false, error: apiError });
      throw apiError;
    }
  }, [endpoint, options]);

  React.useEffect(() => {
    if (options.autoFetch !== false) {
      execute();
    }
  }, [execute, options.autoFetch]);

  return {
    ...state,
    refetch: execute,
  };
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    const data = response.data as any;
    if (data?.token) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // Fetch user data if needed
    }
  }, []);

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}

export function useFileUpload(endpoint: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ApiErrorClass | null>(null);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const response = await apiClient.uploadFile(endpoint, file);
      setProgress(100);
      return response.data;
    } catch (err) {
      const apiError = err instanceof ApiErrorClass ? err : new ApiErrorClass('Upload failed', 0);
      setError(apiError);
      throw apiError;
    } finally {
      setUploading(false);
    }
  }, [endpoint]);

  return {
    upload,
    uploading,
    progress,
    error,
  };
}
