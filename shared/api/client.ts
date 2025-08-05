import axios from 'axios';
import { logApiCall } from '../utils/logger';

// Extended interfaces for request timing
interface TimedAxiosRequestConfig {
  requestStartTime?: number;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and start timing
apiClient.interceptors.request.use(
  (config: TimedAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request start time for duration calculation
    config.requestStartTime = Date.now();
    
    return { ...config, requestStartTime: Date.now() };
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and extract correlation IDs
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const startTime = (response.config as TimedAxiosRequestConfig).requestStartTime;
    const duration = startTime ? Date.now() - startTime : undefined;
    
    // Extract correlation ID from response headers
    const correlationId = response.headers['x-correlation-id'];
    if (correlationId) {
      response.data._correlationId = correlationId;
    }
    
    // Log successful API call
    logApiCall(
      response.config.method?.toUpperCase() || 'UNKNOWN',
      response.config.url || 'unknown',
      response.status,
      duration,
      correlationId
    );
    
    return response.data;
  },
  (error) => {
    // Calculate request duration
    const startTime = error.config?.requestStartTime;
    const duration = startTime ? Date.now() - startTime : undefined;
    
    // Extract correlation ID from error response
    const correlationId = error.response?.headers['x-correlation-id'];
    
    // Log failed API call
    logApiCall(
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || 'unknown',
      error.response?.status,
      duration,
      correlationId
    );
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject({
        ...error,
        correlationId,
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed. Please log in again.',
        category: 'authentication',
        severity: 'high',
        retryable: false,
      });
    }

    // Check if the error response contains structured error information
    const errorData = error.response?.data;
    if (errorData && typeof errorData === 'object' && errorData.code) {
      // Backend returned structured error
      return Promise.reject({
        ...error,
        code: errorData.code,
        message: errorData.message || error.message,
        userMessage: errorData.user_message,
        category: errorData.category,
        severity: errorData.severity,
        details: errorData.details,
        retryable: errorData.retryable || false,
        correlationId: errorData.correlation_id || correlationId,
      });
    }

    // Handle other HTTP errors with fallback mapping
    const statusCode = error.response?.status;
    let category = 'api';
    let severity = 'medium';
    let retryable = false;

    // Map status codes to categories and properties
    switch (statusCode) {
      case 400:
        category = 'validation';
        break;
      case 403:
        category = 'authorization';
        severity = 'high';
        break;
      case 404:
        category = 'api';
        severity = 'medium';
        break;
      case 422:
        category = 'validation';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        category = 'system';
        severity = 'high';
        retryable = true;
        break;
      default:
        category = 'unknown';
        break;
    }

    const errorResponse = {
      ...error,
      correlationId,
      code: `HTTP_${statusCode || 'UNKNOWN'}`,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      details: error.response?.data?.details || error.response?.statusText,
      category,
      severity,
      retryable,
    };

    return Promise.reject(errorResponse);
  }
);

export { apiClient };
export default apiClient;
