import { useState, useCallback } from 'react';
import { apiClient, ApiResponse, ApiErrorClass, RequestConfig } from '../lib/api-client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiErrorClass | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (config?: Partial<RequestConfig>) => Promise<ApiResponse<T> | null>;
  reset: () => void;
}

/**
 * Custom hook for API calls with loading states and error handling
 */
export function useApi<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  defaultConfig?: Partial<RequestConfig>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (config?: Partial<RequestConfig>): Promise<ApiResponse<T> | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const finalConfig: RequestConfig = {
          method,
          ...defaultConfig,
          ...config,
        };

        let response: ApiResponse<T>;

        switch (method) {
          case 'GET':
            response = await apiClient.get<T>(endpoint, finalConfig);
            break;
          case 'POST':
            response = await apiClient.post<T>(endpoint, finalConfig);
            break;
          case 'PUT':
            response = await apiClient.put<T>(endpoint, finalConfig);
            break;
          case 'PATCH':
            response = await apiClient.patch<T>(endpoint, finalConfig);
            break;
          case 'DELETE':
            response = await apiClient.delete<T>(endpoint, finalConfig);
            break;
          default:
            throw new ApiErrorClass('Unsupported HTTP method', 0);
        }

        setState(prev => ({ ...prev, data: response.data, loading: false }));
        return response;
      } catch (error) {
        const apiError = error instanceof ApiErrorClass
          ? error
          : new ApiErrorClass(
              error instanceof Error ? error.message : 'Unknown error',
              0,
              error
            );

        setState(prev => ({ ...prev, error: apiError, loading: false }));
        return null;
      }
    },
    [endpoint, method, defaultConfig]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for managing API authentication
 */
export function useAuth() {
  const setToken = useCallback((token: string | null) => {
    apiClient.setAuthToken(token);
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post<{ token: string; user: unknown }>(
      '/auth/login',
      { body: credentials }
    );
    if (response.data?.token) {
      setToken(response.data.token);
    }
    return response;
  }, [setToken]);

  const logout = useCallback(() => {
    setToken(null);
    // Clear any stored tokens
    localStorage.removeItem('auth_token');
  }, [setToken]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await apiClient.post<{ token: string }>(
        '/auth/refresh'
      );
      if (response.data?.token) {
        setToken(response.data.token);
        localStorage.setItem('auth_token', response.data.token);
      }
      return response;
    } catch (error) {
      logout();
      throw error;
    }
  }, [setToken, logout]);

  return {
    setToken,
    login,
    logout,
    refreshToken,
  };
}

/**
 * Hook for handling file uploads
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const upload = useCallback(async (
    endpoint: string,
    file: File,
    fieldName = 'file',
    additionalData?: Record<string, unknown>
  ) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Note: This is a simplified version. In a real implementation,
      // you'd want to track upload progress with XMLHttpRequest
      const response = await apiClient.uploadFile(
        endpoint,
        file,
        fieldName,
        additionalData
      );

      setUploadProgress(100);
      return response;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setUploadProgress(0);
  }, []);

  return {
    upload,
    uploading,
    uploadProgress,
    reset,
  };
}


