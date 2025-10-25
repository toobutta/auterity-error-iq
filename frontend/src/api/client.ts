import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { logApiCall } from "../utils/logger";

// Extended interfaces for request timing
interface TimedAxiosRequestConfig extends AxiosRequestConfig {
  requestStartTime?: number;
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token and start timing
apiClient.interceptors.request.use(
  (config: TimedAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request start time for duration calculation
    config.requestStartTime = Date.now();

    return { ...config, requestStartTime: Date.now() };
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors and extract correlation IDs
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration
    const startTime = (response.config as TimedAxiosRequestConfig)
      .requestStartTime;
    const duration = startTime ? Date.now() - startTime : undefined;

    // Extract correlation ID from response headers
    const correlationId = response.headers["x-correlation-id"] as
      | string
      | undefined;

    // Safely add correlation ID to response data if it's an object
    if (correlationId && response.data && typeof response.data === "object") {
      (response.data as Record<string, unknown>)._correlationId = correlationId;
    }

    // Log successful API call
    logApiCall(
      response.config.method?.toUpperCase() || "UNKNOWN",
      response.config.url || "unknown",
      response.status,
      duration,
      correlationId,
    );

    return response.data;
  },
  (error: AxiosError) => {
    // Calculate request duration
    const startTime = (error.config as TimedAxiosRequestConfig | undefined)
      ?.requestStartTime;
    const duration = startTime ? Date.now() - startTime : undefined;

    // Extract correlation ID from error response
    const correlationId = error.response?.headers?.["x-correlation-id"] as
      | string
      | undefined;

    // Log failed API call
    logApiCall(
      error.config?.method?.toUpperCase() || "UNKNOWN",
      error.config?.url || "unknown",
      error.response?.status,
      duration,
      correlationId,
    );

    // Define our custom error type
    interface EnhancedError {
      correlationId?: string;
      code: string;
      message: string;
      userMessage?: string;
      category: string;
      severity: "low" | "medium" | "high";
      details?: string | Record<string, unknown>;
      retryable: boolean;
      originalError?: AxiosError;
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";

      const authError: EnhancedError = {
        correlationId,
        code: "AUTHENTICATION_ERROR",
        message: "Authentication failed. Please log in again.",
        category: "authentication",
        severity: "high",
        retryable: false,
        originalError: error,
      };

      return Promise.reject(authError);
    }

    // Check if the error response contains structured error information
    const errorData = error.response?.data as
      | Record<string, unknown>
      | undefined;

    if (errorData && typeof errorData === "object" && errorData.code) {
      // Backend returned structured error
      const structuredError: EnhancedError = {
        correlationId: (errorData.correlation_id as string) || correlationId,
        code: errorData.code as string,
        message:
          (errorData.message as string) || error.message || "An error occurred",
        userMessage: errorData.user_message as string | undefined,
        category: (errorData.category as string) || "unknown",
        severity: (errorData.severity as "low" | "medium" | "high") || "medium",
        details: errorData.details as
          | string
          | Record<string, unknown>
          | undefined,
        retryable: Boolean(errorData.retryable) || false,
        originalError: error,
      };

      return Promise.reject(structuredError);
    }

    // Handle other HTTP errors with fallback mapping
    const statusCode = error.response?.status;
    let category = "api";
    let severity: "low" | "medium" | "high" = "medium";
    let retryable = false;

    // Map status codes to categories and properties
    switch (statusCode) {
      case 400:
        category = "validation";
        break;
      case 403:
        category = "authorization";
        severity = "high";
        break;
      case 404:
        category = "api";
        severity = "medium";
        break;
      case 422:
        category = "validation";
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        category = "system";
        severity = "high";
        retryable = true;
        break;
      default:
        category = "unknown";
        break;
    }

    const errorResponse: EnhancedError = {
      correlationId,
      code: `HTTP_${statusCode || "UNKNOWN"}`,
      message:
        (error.response?.data?.message as string) ||
        error.message ||
        "An unexpected error occurred",
      details:
        (error.response?.data?.details as string | Record<string, unknown>) ||
        error.response?.statusText ||
        "",
      category,
      severity,
      retryable,
      originalError: error,
    };

    return Promise.reject(errorResponse);
  },
);

export { apiClient };
export default apiClient;


