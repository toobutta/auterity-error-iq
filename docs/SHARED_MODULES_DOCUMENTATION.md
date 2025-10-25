

# Shared Modules Documentatio

n

**Document Version**: 1.

0
**Last Updated**: August 8, 202

5
**Maintained By**: Development Tea

m

#

# Overvie

w

The shared modules directory contains reusable components, utilities, types, and services that are used across the Auterity Unified Platform. These modules promote code reuse, maintain consistency, and reduce duplication across the frontend, backend, and system integrations.

--

- #

# Directory Structur

e

```
shared/
├── api/

# API clients and service abstractions

│   ├── client.ts

# HTTP client configuration

│   ├── auth.ts

# Authentication API service

│   ├── workflows.ts

# Workflow API service

│   └── index.ts

# API exports

├── components/

# Reusable UI components

│   ├── ui/

# Basic UI components

│   ├── forms/

# Form components

│   ├── charts/

# Chart components

│   └── index.ts

# Component exports

├── contexts/

# React context providers

│   ├── AuthContext.tsx

# Authentication context

│   ├── ErrorContext.tsx

# Error handling context

│   └── index.ts

# Context exports

├── hooks/

# Custom React hooks

│   ├── useAuth.ts

# Authentication hook

│   ├── useApi.ts

# API interaction hook

│   ├── useErrorHandler.ts

# Error handling hook

│   └── index.ts

# Hook exports

├── types/

# TypeScript type definitions

│   ├── error.ts

# Error types

│   ├── api.ts

# API types

│   ├── workflow.ts

# Workflow types

│   └── index.ts

# Type exports

├── utils/

# Utility functions

│   ├── logger.ts

# Logging utilities

│   ├── errorUtils.ts

# Error handling utilities

│   ├── retryUtils.ts

# Retry mechanism utilities

│   ├── component-utils.ts



# Component utility functions

│   ├── theme-utils.ts



# Theme and styling utilities

│   └── index.ts

# Utility exports

├── services/

# Business logic services

│   ├── analytics.ts

# Analytics service

│   ├── monitoring.ts

# Monitoring service

│   └── index.ts

# Service exports

├── design-tokens/



# Design system tokens

│   ├── colors.ts

# Color definitions

│   ├── typography.ts

# Typography settings

│   ├── spacing.ts

# Spacing values

│   └── index.ts

# Token exports

├── README.md

# Shared modules documentation

└── index.ts

# Main exports file

```

--

- #

# Core Module

s

#

##

 1. API Services (`/api

`

)

#

### HTTP Client Configuratio

n

**File**: `api/client.ts

`

```

typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { AuthService } from "./auth";
import { Logger } from "../utils/logger";

interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  enableRequestLogging: boolean;
}

class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private logger: Logger;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.logger = new Logger("ApiClient");
    this.client = this.createClient();
    this.setupInterceptors();
  }

  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",

      },
    });
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = AuthService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (this.config.enableRequestLogging) {
          this.logger.info("API Request:", {
            method: config.method,
            url: config.url,
            params: config.params,
          });
        }

        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await AuthService.refreshToken();
            const newToken = AuthService.getToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            AuthService.logout();
            window.location.href = "/login";
          }
        }

        this.logger.error("API Error:", {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });

        return Promise.reject(error);
      },
    );
  }

  // HTTP method wrappers
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Export configured instance
export const apiClient = new ApiClient({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  timeout: 10000,
  retryAttempts: 3,
  enableRequestLogging: process.env.NODE_ENV === "development",
});

```

#

### Authentication Servic

e

**File**: `api/auth.ts

`

```

typescript
import { apiClient } from "./client";
import { Logger } from "../utils/logger";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company?: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company?: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
}

class AuthServiceClass {
  private logger: Logger;
  private tokenKey = "auth_token";
  private userKey = "auth_user";

  constructor() {
    this.logger = new Logger("AuthService");
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/api/auth/login",
        credentials,
      );
      this.setToken(response.access_token);

      // Fetch user data after successful login
      const user = await this.getCurrentUser();
      this.setUser(user);

      this.logger.info("User logged in successfully");
      return response;
    } catch (error) {
      this.logger.error("Login failed:", error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      const response = await apiClient.post<User>(
        "/api/auth/register",
        userData,
      );
      this.logger.info("User registered successfully");
      return response;
    } catch (error) {
      this.logger.error("Registration failed:", error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>("/api/auth/me");
      this.setUser(response);
      return response;
    } catch (error) {
      this.logger.error("Failed to fetch current user:", error);
      throw error;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/api/auth/refresh");
      this.setToken(response.access_token);
      this.logger.info("Token refreshed successfully");
      return response;
    } catch (error) {
      this.logger.error("Token refresh failed:", error);
      this.logout();
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.logger.info("User logged out");
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user?.permissions.includes(permission) || false;
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.roles.includes(role) || false;
  }
}

export const AuthService = new AuthServiceClass();

```

#

##

 2. Utility Functions (`/utils

`

)

#

### Logging Utilit

y

**File**: `utils/logger.ts

`

```

typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: any;
}

class LoggerClass {
  private namespace: string;
  private logLevel: LogLevel;

  constructor(namespace: string = "App") {
    this.namespace = namespace;
    this.logLevel = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const level = process.env.REACT_APP_LOG_LEVEL || "INFO";
    return LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: any,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      namespace: this.namespace,
      message,
      data,
    };
  }

  private output(entry: LogEntry): void {
    const { timestamp, level, namespace, message, data } = entry;
    const levelName = LogLevel[level];
    const prefix = `[${timestamp}] ${levelName} [${namespace}]:`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data || "");
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data || "");
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data || "");
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, data || "");
        break;
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === "production" && level >= LogLevel.WARN) {
      this.sendToMonitoring(entry);
    }
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    try {
      await fetch("/api/monitoring/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error("Failed to send log to monitoring:", error);
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatMessage(LogLevel.INFO, message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatMessage(LogLevel.WARN, message, data));
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatMessage(LogLevel.ERROR, message, data));
    }
  }

  createChild(childNamespace: string): LoggerClass {
    return new LoggerClass(`${this.namespace}:${childNamespace}`);
  }
}

export const Logger = LoggerClass;
export const logger = new LoggerClass();

```

#

### Error Handling Utilitie

s

**File**: `utils/errorUtils.ts

`

```

typescript
import { Logger } from "./logger";

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: "low" | "medium" | "high" | "critical";
  category: "network" | "validation" | "business" | "system" | "unknown";
}

class ErrorUtilsClass {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("ErrorUtils");
  }

  createErrorReport(
    error: Error,
    context: ErrorContext,
    severity: ErrorReport["severity"] = "medium",
  ): ErrorReport {
    const category = this.categorizeError(error);

    return {
      id: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
      severity,
      category,
    };
  }

  private categorizeError(error: Error): ErrorReport["category"] {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return "network";
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return "validation";
    }
    if (message.includes("unauthorized") || message.includes("forbidden")) {
      return "business";
    }
    if (message.includes("system") || message.includes("internal")) {
      return "system";
    }

    return "unknown";
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async reportError(errorReport: ErrorReport): Promise<void> {
    try {
      // Log locally
      this.logger.error("Error reported:", errorReport);

      // Send to backend error reporting service
      await fetch("/api/errors/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify(errorReport),
      });
    } catch (reportingError) {
      this.logger.error("Failed to report error:", reportingError);
    }
  }

  createUserFriendlyMessage(
    error: Error,
    category?: ErrorReport["category"],
  ): string {
    const detectedCategory = category || this.categorizeError(error);

    switch (detectedCategory) {
      case "network":
        return "Connection problem. Please check your internet connection and try again.";
      case "validation":
        return "Please check your input and try again.";
      case "business":
        return "You do not have permission to perform this action.";
      case "system":
        return "A system error occurred. Our team has been notified.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const retryablePatterns = [
      "network",
      "timeout",
      "connection",
      "temporary",
      "rate limit",
    ];

    return retryablePatterns.some((pattern) => message.includes(pattern));
  }

  shouldShowDetails(error: Error, userRole?: string): boolean {
    // Show detailed errors to developers and admins
    return (
      process.env.NODE_ENV === "development" ||
      userRole === "admin" ||
      userRole === "developer"
    );
  }
}

export const ErrorUtils = new ErrorUtilsClass();

```

#

### Retry Utilitie

s

**File**: `utils/retryUtils.ts

`

```

typescript
import { Logger } from "./logger";

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
};

class RetryUtilsClass {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("RetryUtils");
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
  ): Promise<T> {
    const config = { ...defaultRetryOptions, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {

      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry this error
        if (config.shouldRetry && !config.shouldRetry(lastError)) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, config);

        this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, {
          error: lastError.message,
          attempt,
          delay,
        });

        // Call retry callback if provided
        if (config.onRetry) {
          config.onRetry(attempt, lastError);
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private calculateDelay(attempt: number, config: RetryOptions): number {
    // Exponential backoff: baseDelay

 * (backoffFactor ^ (attemp

t

 - 1))

    let delay = config.baseDelay

 * Math.pow(config.backoffFactor, attemp

t

 - 1)

;

    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay

 * (0.

5

 + Math.random(

)

 * 0.5)

;

    }

    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Predefined retry conditions
  isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("fetch")
    );
  }

  isRetryableHttpError(error: any): boolean {
    if (!error.response) return false;

    const status = error.response.status;
    // Retry on 5xx errors and 429 (rate limit)
    return status >= 500 || status === 429;
  }

  isTemporaryError(error: Error): boolean {
    return this.isNetworkError(error) || this.isRetryableHttpError(error);
  }
}

export const RetryUtils = new RetryUtilsClass();

// Convenience wrapper for common retry scenarios
export const retry = RetryUtils.withRetry.bind(RetryUtils);

```

#

##

 3. Custom Hooks (`/hooks

`

)

#

### Authentication Hoo

k

**File**: `hooks/useAuth.ts

`

```

typescript
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { AuthService } from '../api/auth';
import { Logger } from '../utils/logger';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company?: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logger = new Logger('AuthProvider');

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      if (AuthService.isAuthenticated()) {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      logger.error('Failed to initialize auth:', error);
      AuthService.logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await AuthService.login({ email, password });
      const user = AuthService.getUser();
      setUser(user);

      logger.info('User logged in successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      logger.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    AuthService.logout();
    setUser(null);
    setError(null);
    logger.info('User logged out');
  };

  const register = async (userData: any): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await AuthService.register(userData);
      logger.info('User registered successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setError(message);
      logger.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return AuthService.hasPermission(permission);
  };

  const hasRole = (role: string): boolean => {
    return AuthService.hasRole(role);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    hasPermission,
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

```

#

### API Hoo

k

**File**: `hooks/useApi.ts

`

```

typescript
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../api/client";
import { RetryUtils } from "../utils/retryUtils";
import { Logger } from "../utils/logger";

interface UseApiOptions {
  immediate?: boolean;
  retryOptions?: {
    maxAttempts?: number;
    baseDelay?: number;
  };
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {},
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const logger = new Logger("useApi");

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      try {
        setLoading(true);
        setError(null);

        const result = await RetryUtils.withRetry(() => apiFunction(...args), {
          maxAttempts: options.retryOptions?.maxAttempts || 3,
          baseDelay: options.retryOptions?.baseDelay || 1000,
          shouldRetry: RetryUtils.isTemporaryError,
        });

        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        logger.error("API call failed:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, options.retryOptions, logger],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [execute, options.immediate]);

  return { data, loading, error, execute, reset };
}

// Specialized hooks for common operations
export function useWorkflowApi() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkflows = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/api/workflows", {
        params: filters,
      });
      setWorkflows(response.workflows);
      return response;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch workflows");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkflow = useCallback(async (workflowData: any) => {
    try {
      setLoading(true);
      const response = await apiClient.post("/api/workflows", workflowData);
      setWorkflows((prev) => [response, ...prev]);
      return response;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to create workflow");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeWorkflow = useCallback(
    async (workflowId: string, inputData: any) => {
      try {
        setLoading(true);
        const response = await apiClient.post(
          `/api/workflows/${workflowId}/execute`,
          { input_data: inputData },
        );
        return response;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to execute workflow");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    workflows,
    loading,
    error,
    fetchWorkflows,
    createWorkflow,
    executeWorkflow,
  };
}

```

#

##

 4. Type Definitions (`/types

`

)

#

### Core Type

s

**File**: `types/index.ts

`

```

typescript
// Common utility types
export type UUID = string;
export type Timestamp = string;
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: "success" | "error";
  timestamp: Timestamp;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
    timestamp: Timestamp;
    request_id: UUID;
  };
}

// User and Authentication types
export interface User {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  company?: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Workflow types
export interface WorkflowNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface Workflow {
  id: UUID;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by: UUID;
  template_id?: UUID;
  execution_count: number;
  last_execution?: Timestamp;
}

export interface WorkflowExecution {
  id: UUID;
  workflow_id: UUID;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  started_at: Timestamp;
  completed_at?: Timestamp;
  duration?: number;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  steps: WorkflowExecutionStep[];
}

export interface WorkflowExecutionStep {
  step_id: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  started_at?: Timestamp;
  completed_at?: Timestamp;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error_message?: string;
}

// Template types
export interface Template {
  id: UUID;
  name: string;
  description?: string;
  category: string;
  definition: WorkflowDefinition;
  parameters: TemplateParameter[];
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  usage_count: number;
}

export interface TemplateParameter {
  name: string;
  description?: string;
  parameter_type: "string" | "number" | "boolean" | "email" | "url" | "date";
  is_required: boolean;
  default_value?: any;
  validation_pattern?: string;
}

// System monitoring types
export interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Timestamp;
  version: string;
  environment: string;
  services: Record<string, ServiceHealth>;
}

export interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  response_time: number;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  system: {
    uptime: number;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
  };
  application: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_response_time: number;
    requests_per_minute: number;
  };
  workflows: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    average_execution_time: number;
    executions_last_hour: number;
  };
}

```

#

### Error Type

s

**File**: `types/error.ts

`

```

typescript
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: "low" | "medium" | "high" | "critical";
  category: "network" | "validation" | "business" | "system" | "unknown";
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: any;
}

export interface ErrorNotification {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  dismissed: boolean;
  persistent: boolean;
}

```

--

- #

# Usage Guideline

s

#

##

 1. Import Patter

n

s

```

typescript
// Import specific modules
import { apiClient } from "@/shared/api/client";
import { Logger } from "@/shared/utils/logger";
import { useAuth } from "@/shared/hooks/useAuth";

// Import from index files
import { AuthService, WorkflowService } from "@/shared/api";
import { retry, ErrorUtils } from "@/shared/utils";
import { useApi, useWorkflowApi } from "@/shared/hooks";

// Import types
import type { User, Workflow, ApiResponse } from "@/shared/types";

```

#

##

 2. Component Integrati

o

n

```

typescript
// Using shared hooks in components
import React from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useWorkflowApi } from '@/shared/hooks/useApi';
import { Logger } from '@/shared/utils/logger';

const WorkflowDashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { workflows, loading, fetchWorkflows, createWorkflow } = useWorkflowApi();
  const logger = new Logger('WorkflowDashboard');

  const handleCreateWorkflow = async (workflowData: any) => {
    try {
      await createWorkflow(workflowData);
      logger.info('Workflow created successfully');
    } catch (error) {
      logger.error('Failed to create workflow:', error);
    }
  };

  if (!hasPermission('workflow:read')) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      {/

* Component JSX */}

    </div>
  );
};

```

#

##

 3. Service Integrati

o

n

```

typescript
// Using shared services
import { AuthService } from "@/shared/api/auth";
import { retry } from "@/shared/utils/retryUtils";
import { Logger } from "@/shared/utils/logger";

class CustomService {
  private logger = new Logger("CustomService");

  async performCriticalOperation() {
    if (!AuthService.isAuthenticated()) {
      throw new Error("Authentication required");
    }

    return retry(
      async () => {
        // Critical operation that might fail
        const result = await fetch("/api/critical-endpoint");

        return result.json();
      },
      {
        maxAttempts: 5,
        shouldRetry: (error) => error.message.includes("temporary"),
        onRetry: (attempt, error) => {
          this.logger.warn(
            `Retrying critical operation (attempt ${attempt}):`,
            error,
          );
        },
      },
    );
  }
}

```

--

- #

# Testing Shared Module

s

#

##

 1. Unit Testi

n

g

```

typescript
// Testing utilities
import { describe, it, expect, vi } from "vitest";
import { ErrorUtils } from "../utils/errorUtils";
import { RetryUtils } from "../utils/retryUtils";

describe("ErrorUtils", () => {
  it("should categorize network errors correctly", () => {
    const networkError = new Error("Network request failed");
    const report = ErrorUtils.createErrorReport(networkError, {});
    expect(report.category).toBe("network");
  });

  it("should generate user-friendly messages", () => {

    const validationError = new Error("Invalid email format");
    const message = ErrorUtils.createUserFriendlyMessage(
      validationError,
      "validation",
    );
    expect(message).toBe("Please check your input and try again.");
  });
});

describe("RetryUtils", () => {
  it("should retry failed operations", async () => {
    let attempts = 0;
    const operation = vi.fn(() => {
      attempts++;

      if (attempts < 3) {
        throw new Error("Temporary failure");
      }
      return Promise.resolve("success");
    });

    const result = await RetryUtils.withRetry(operation, {
      maxAttempts: 5,
      baseDelay: 10,
      shouldRetry: () => true,
    });

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(3);
  });
});

```

#

##

 2. Integration Testi

n

g

```

typescript
// Testing hooks
import { renderHook, waitFor } from "@testing-library/react";

import { useAuth } from "../hooks/useAuth";
import { AuthService } from "../api/auth";

// Mock AuthService
vi.mock("../api/auth");

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize user from stored token", async () => {
    const mockUser = { id: "1", email: "test@example.com" };
    AuthService.isAuthenticated.mockReturnValue(true);
    AuthService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });
});

```

--

- #

# Maintenance and Best Practice

s

#

##

 1. Code Quali

t

y

- **Type Safety**: All shared modules use TypeScrip

t

- **Error Handling**: Comprehensive error handling with loggin

g

- **Testing**: Unit tests for all utilities and service

s

- **Documentation**: JSDoc comments for public API

s

#

##

 2. Performan

c

e

- **Tree Shaking**: Modular exports for optimal bundlin

g

- **Lazy Loading**: Conditional imports where appropriat

e

- **Memoization**: React hooks use proper dependencie

s

- **Caching**: API responses cached where beneficia

l

#

##

 3. Securi

t

y

- **Input Validation**: All user inputs validate

d

- **Token Management**: Secure token storage and refres

h

- **Error Sanitization**: Sensitive data excluded from error report

s

- **Audit Logging**: Security events logged appropriatel

y

#

##

 4. Versioni

n

g

- **Semantic Versioning**: Breaking changes increment major versio

n

- **Changelog**: All changes documente

d

- **Migration Guides**: Breaking change migration documentatio

n

- **Backward Compatibility**: Maintained where possibl

e

--

- This comprehensive shared modules documentation provides developers with the knowledge and tools needed to effectively use and extend the common functionality across the Auterity platform.
