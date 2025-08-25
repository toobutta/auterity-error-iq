import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// Type definitions
interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  startTime: string;
  endTime?: string;
  result?: any;
  error?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  system: "autmatrix" | "neuroweaver" | "relaycore";
  category: string;
  config: any;
}

interface Model {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "training" | "deploying";
  provider: string;
  costPerRequest: number;
  performanceMetrics: {
    accuracy?: number;
    responseTime?: number;
    throughput?: number;
  };
}

interface DeploymentInfo {
  id: string;
  modelId: string;
  status: "deployed" | "pending" | "failed";
  endpoint: string;
  deployedAt: string;
}

interface TrainingProgress {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  metrics: Record<string, any>;
  estimatedCompletion: string;
}

interface AIRequest {
  id: string;
  prompt: string;
  modelId?: string;
  systemPreferences?: {
    preferredSystem?: "autmatrix" | "neuroweaver" | "relaycore";
    maxCost?: number;
    priority?: "speed" | "accuracy" | "cost";
  };
}

interface AIResponse {
  id: string;
  requestId: string;
  response: string;
  modelUsed: string;
  cost: number;
  responseTime: number;
  timestamp: string;
}

interface RoutingMetrics {
  totalRequests: number;
  averageResponseTime: number;
  totalCost: number;
  systemDistribution: Record<string, number>;
  errorRate: number;
}

interface SteeringRules {
  id: string;
  name: string;
  conditions: any[];
  actions: any[];
  priority: number;
  enabled: boolean;
}

interface CostAnalytics {
  dailyCost: number;
  monthlyCost: number;
  costBySystem: Record<string, number>;
  costTrend: "increasing" | "decreasing" | "stable";
  budgetRemaining: number;
}

interface UnifiedAPIClient {
  autmatrix: {
    executeWorkflow: (
      workflowId: string,
      inputs: any,
    ) => Promise<WorkflowExecution>;
    getWorkflowTemplates: () => Promise<WorkflowTemplate[]>;
    getExecutionHistory: (filters: any) => Promise<WorkflowExecution[]>;
  };

  neuroweaver: {
    getModels: () => Promise<Model[]>;
    deployModel: (modelId: string) => Promise<DeploymentInfo>;
    getTrainingProgress: (jobId: string) => Promise<TrainingProgress>;
    instantiateTemplate: (templateId: string, inputs: any) => Promise<string>;
  };

  relaycore: {
    routeAIRequest: (request: AIRequest) => Promise<AIResponse>;
    getRoutingMetrics: () => Promise<RoutingMetrics>;
    updateSteeringRules: (rules: SteeringRules) => Promise<void>;
    getCostAnalytics: () => Promise<CostAnalytics>;
  };
}

// API client implementation
class UnifiedAPIClientImpl implements UnifiedAPIClient {
  private autmatrixClient: AxiosInstance;
  private neuroweaverClient: AxiosInstance;
  private relaycoreClient: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    // Initialize API clients for each system
    this.autmatrixClient = axios.create({
      baseURL: process.env.AUTMATRIX_API_URL || "http://localhost:3001/api",
      timeout: 10000,
    });

    this.neuroweaverClient = axios.create({
      baseURL: process.env.NEUROWEAVER_API_URL || "http://localhost:3002/api",
      timeout: 10000,
    });

    this.relaycoreClient = axios.create({
      baseURL: process.env.RELAYCORE_API_URL || "http://localhost:3003/api",
      timeout: 10000,
    });

    // Add request interceptors for authentication
    this.addAuthInterceptors();

    // Add response interceptors for error handling
    this.addErrorInterceptors();
  }

  // Authentication methods
  public setAuthToken(token: string): void {
    this.authToken = token;
  }

  public clearAuthToken(): void {
    this.authToken = null;
  }

  private addAuthInterceptors(): void {
    const authInterceptor = (
      config: AxiosRequestConfig,
    ): AxiosRequestConfig => {
      if (this.authToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    };

    this.autmatrixClient.interceptors.request.use(authInterceptor);
    this.neuroweaverClient.interceptors.request.use(authInterceptor);
    this.relaycoreClient.interceptors.request.use(authInterceptor);
  }

  private addErrorInterceptors(): void {
    const errorInterceptor = (error: any): Promise<any> => {
      console.error("API Error:", error.response?.data || error.message);
      return Promise.reject(error);
    };

    this.autmatrixClient.interceptors.response.use(undefined, errorInterceptor);
    this.neuroweaverClient.interceptors.response.use(
      undefined,
      errorInterceptor,
    );
    this.relaycoreClient.interceptors.response.use(undefined, errorInterceptor);
  }

  // AutoMatrix API methods
  public autmatrix = {
    executeWorkflow: async (
      workflowId: string,
      inputs: any,
    ): Promise<WorkflowExecution> => {
      try {
        const response: AxiosResponse<WorkflowExecution> =
          await this.autmatrixClient.post(`/workflows/${workflowId}/execute`, {
            inputs,
          });
        return response.data;
      } catch (error) {
        throw new Error(`Failed to execute workflow: ${error}`);
      }
    },

    getWorkflowTemplates: async (): Promise<WorkflowTemplate[]> => {
      try {
        const response: AxiosResponse<WorkflowTemplate[]> =
          await this.autmatrixClient.get("/templates");
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch workflow templates: ${error}`);
      }
    },

    getExecutionHistory: async (filters: any): Promise<WorkflowExecution[]> => {
      try {
        const response: AxiosResponse<WorkflowExecution[]> =
          await this.autmatrixClient.get("/executions", { params: filters });
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch execution history: ${error}`);
      }
    },
  };

  // NeuroWeaver API methods
  public neuroweaver = {
    getModels: async (): Promise<Model[]> => {
      try {
        const response: AxiosResponse<Model[]> =
          await this.neuroweaverClient.get("/models");
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch models: ${error}`);
      }
    },

    deployModel: async (modelId: string): Promise<DeploymentInfo> => {
      try {
        const response: AxiosResponse<DeploymentInfo> =
          await this.neuroweaverClient.post(`/models/${modelId}/deploy`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to deploy model: ${error}`);
      }
    },

    getTrainingProgress: async (jobId: string): Promise<TrainingProgress> => {
      try {
        const response: AxiosResponse<TrainingProgress> =
          await this.neuroweaverClient.get(`/training/${jobId}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch training progress: ${error}`);
      }
    },

    instantiateTemplate: async (
      templateId: string,
      inputs: any,
    ): Promise<string> => {
      try {
        const response: AxiosResponse<{ instanceId: string }> =
          await this.neuroweaverClient.post(
            `/templates/${templateId}/instantiate`,
            { inputs },
          );
        return response.data.instanceId;
      } catch (error) {
        throw new Error(`Failed to instantiate template: ${error}`);
      }
    },
  };

  // RelayCore API methods
  public relaycore = {
    routeAIRequest: async (request: AIRequest): Promise<AIResponse> => {
      try {
        const response: AxiosResponse<AIResponse> =
          await this.relaycoreClient.post("/ai/route", request);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to route AI request: ${error}`);
      }
    },

    getRoutingMetrics: async (): Promise<RoutingMetrics> => {
      try {
        const response: AxiosResponse<RoutingMetrics> =
          await this.relaycoreClient.get("/metrics/routing");
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch routing metrics: ${error}`);
      }
    },

    updateSteeringRules: async (rules: SteeringRules): Promise<void> => {
      try {
        await this.relaycoreClient.put("/steering/rules", rules);
      } catch (error) {
        throw new Error(`Failed to update steering rules: ${error}`);
      }
    },

    getCostAnalytics: async (): Promise<CostAnalytics> => {
      try {
        const response: AxiosResponse<CostAnalytics> =
          await this.relaycoreClient.get("/analytics/cost");
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch cost analytics: ${error}`);
      }
    },
  };

  // WebSocket connection for real-time updates
  public connectWebSocket(
    system: "autmatrix" | "neuroweaver" | "relaycore",
  ): WebSocket {
    let wsUrl: string;

    switch (system) {
      case "autmatrix":
        wsUrl = process.env.AUTMATRIX_WS_URL || "ws://localhost:3001/ws";
        break;
      case "neuroweaver":
        wsUrl = process.env.NEUROWEAVER_WS_URL || "ws://localhost:3002/ws";
        break;
      case "relaycore":
        wsUrl = process.env.RELAYCORE_WS_URL || "ws://localhost:3003/ws";
        break;
      default:
        throw new Error(`Unknown system: ${system}`);
    }

    const ws = new WebSocket(wsUrl);

    // Add authentication header if available
    if (this.authToken) {
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "auth", token: this.authToken }));
      };
    }

    return ws;
  }
}

// Export singleton instance
export const unifiedApiClient = new UnifiedAPIClientImpl();

// Export types for use in other modules
export type {
  WorkflowExecution,
  WorkflowTemplate,
  Model,
  DeploymentInfo,
  TrainingProgress,
  AIRequest,
  AIResponse,
  RoutingMetrics,
  SteeringRules,
  CostAnalytics,
  UnifiedAPIClient,
};
