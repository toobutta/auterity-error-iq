/**
 * NeuroWeaver Frontend Type Definitions
 * TypeScript interfaces for model management
 */

export interface Model {
  id: string;
  name: string;
  description: string;
  specialization: string;
  status: ModelStatus;
  version: string;
  created_at: string;
  updated_at: string;
  performance_metrics?: PerformanceMetrics;
  deployment_info?: DeploymentInfo;
  training_config?: TrainingConfig;
}

export type ModelStatus =
  | "registered"
  | "training"
  | "trained"
  | "deploying"
  | "deployed"
  | "training_failed"
  | "deployment_failed"
  | "stopped";

export interface PerformanceMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  latency_ms?: number;
  throughput_rps?: number;
  cost_per_request?: number;
  [key: string]: any;
}

export interface DeploymentInfo {
  endpoint?: string;
  replicas?: number;
  cpu_usage?: number;
  memory_usage?: number;
  requests_per_minute?: number;
  last_health_check?: string;
  deployment_time?: string;
}

export interface TrainingConfig {
  base_model: string;
  training_data_path?: string;
  hyperparameters: {
    learning_rate?: number;
    batch_size?: number;
    epochs?: number;
    max_length?: number;
    [key: string]: any;
  };
  auto_deploy: boolean;
}

export interface ModelRegistrationRequest {
  name: string;
  description: string;
  specialization: string;
  base_model: string;
  training_data_path?: string;
  hyperparameters?: Record<string, any>;
  auto_deploy: boolean;
}

export interface ModelUpdateRequest {
  description?: string;
  status?: ModelStatus;
  performance_metrics?: PerformanceMetrics;
}

export interface ModelDeploymentRequest {
  model_id: string;
  deployment_config?: {
    replicas?: number;
    cpu_limit?: string;
    memory_limit?: string;
    auto_scaling?: boolean;
  };
  register_with_relaycore: boolean;
}

export interface TrainingRequest {
  model_id: string;
  training_data: TrainingData;
  hyperparameters?: Record<string, any>;
  validation_split?: number;
}

export interface TrainingData {
  dataset_path: string;
  format: "jsonl" | "csv" | "parquet";
  input_column: string;
  output_column: string;
  preprocessing?: {
    max_length?: number;
    truncation?: boolean;
    padding?: boolean;
  };
}

export interface InferenceRequest {
  model_id: string;
  prompt: string;
  context?: Record<string, any>;
  parameters?: {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stop_sequences?: string[];
  };
}

export interface InferenceResponse {
  id: string;
  model_id: string;
  response: string;
  confidence: number;
  latency_ms: number;
  tokens_used: number;
  cost: number;
  metadata: {
    model_version: string;
    specialization: string;
    timestamp: string;
  };
}

export interface Specialization {
  name: string;
  description: string;
  status: "available" | "development" | "deprecated";
  use_cases: string[];
  example_prompts: string[];
  performance_benchmarks?: PerformanceMetrics;
}

export interface ServiceStatus {
  service: string;
  version: string;
  environment: string;
  debug: boolean;
  training_enabled: boolean;
  auto_deploy: boolean;
  model_storage: string;
  available_specializations: Specialization[];
}

export interface MetricsData {
  timestamp: string;
  model_id: string;
  requests_count: number;
  average_latency: number;
  success_rate: number;
  cost_total: number;
  tokens_processed: number;
}

export interface TrainingJob {
  id: string;
  model_id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  logs: string[];
  metrics: {
    loss?: number;
    accuracy?: number;
    epoch?: number;
    step?: number;
  };
}

