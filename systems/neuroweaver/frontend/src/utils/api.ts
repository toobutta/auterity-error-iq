/**
 * NeuroWeaver Frontend API Client
 * Axios-based HTTP client for backend communication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// Create axios instance with base configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookie
    const token =
      typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// API helper functions
export const api = {
  // Authentication
  auth: {
    login: (credentials: { username: string; password: string }) =>
      apiClient.post("/auth/login", credentials),
    logout: () => apiClient.post("/auth/logout"),
    refresh: () => apiClient.post("/auth/refresh"),
    register: (data: any) => apiClient.post("/api/auth/register", data),
  },

  // Models
  models: {
    list: (params?: { specialization?: string; status?: string }) =>
      apiClient.get("/api/v1/models", { params }),
    get: (id: string) => apiClient.get(`/api/v1/models/${id}`),
    register: (data: any) => apiClient.post("/api/v1/models/register", data),
    update: (id: string, data: any) =>
      apiClient.put(`/api/v1/models/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/v1/models/${id}`),
    deploy: (id: string, config: any) =>
      apiClient.post(`/api/v1/models/${id}/deploy`, config),
  },

  // Training
  training: {
    start: (data: any) => apiClient.post("/api/v1/training/start", data),
    status: (jobId: string) =>
      apiClient.get(`/api/v1/training/${jobId}/status`),
    logs: (jobId: string) => apiClient.get(`/api/v1/training/${jobId}/logs`),
    cancel: (jobId: string) =>
      apiClient.post(`/api/v1/training/${jobId}/cancel`),
  },

  // Inference
  inference: {
    predict: (data: any) => apiClient.post("/api/v1/inference", data),
    batch: (data: any) => apiClient.post("/api/v1/inference/batch", data),
  },

  // Metrics
  metrics: {
    models: (params?: {
      model_id?: string;
      start_date?: string;
      end_date?: string;
    }) => apiClient.get("/api/v1/metrics/models", { params }),
    system: () => apiClient.get("/api/v1/metrics/system"),
  },

  // Service
  service: {
    status: () => apiClient.get("/api/v1/status"),
    health: () => apiClient.get("/health"),
  },
};

export default apiClient;

