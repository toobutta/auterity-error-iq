import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useCallback, useEffect, useState } from 'react';

// Create a custom hook for API calls
export const useApi = () => {
  const [api, setApi] = useState<AxiosInstance | null>(null);

  useEffect(() => {
    // Create an axios instance with default configuration
    const instance = axios.create({
      baseURL: process.env.REACT_APP_API_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    instance.interceptors.request.use(
      (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        
        // If token exists, add it to the headers
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    instance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Handle authentication errors
        if (error.response && error.response.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    );

    setApi(instance);
  }, []);

  // Wrapper for GET requests
  const get = useCallback(
    (url: string, config?: AxiosRequestConfig) => {
      if (!api) throw new Error('API not initialized');
      return api.get(url, config);
    },
    [api]
  );

  // Wrapper for POST requests
  const post = useCallback(
    (url: string, data?: any, config?: AxiosRequestConfig) => {
      if (!api) throw new Error('API not initialized');
      return api.post(url, data, config);
    },
    [api]
  );

  // Wrapper for PUT requests
  const put = useCallback(
    (url: string, data?: any, config?: AxiosRequestConfig) => {
      if (!api) throw new Error('API not initialized');
      return api.put(url, data, config);
    },
    [api]
  );

  // Wrapper for DELETE requests
  const del = useCallback(
    (url: string, config?: AxiosRequestConfig) => {
      if (!api) throw new Error('API not initialized');
      return api.delete(url, config);
    },
    [api]
  );

  // Wrapper for PATCH requests
  const patch = useCallback(
    (url: string, data?: any, config?: AxiosRequestConfig) => {
      if (!api) throw new Error('API not initialized');
      return api.patch(url, data, config);
    },
    [api]
  );

  return {
    api,
    get,
    post,
    put,
    delete: del,
    patch,
  };
};