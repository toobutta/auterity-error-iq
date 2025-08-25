/**
 * Phase 1: Shared Contracts System
 * API contracts and data models for cross-stream compatibility
 */

// API Contract Definitions
export interface APIContract {
  id: string;
  name: string;
  version: string;
  description: string;
  endpoints: APIEndpoint[];
  dataModels: DataModelReference[];
  authentication: AuthenticationSpec;
  rateLimit: RateLimitSpec;
  documentation: string;
  lastUpdated: Date;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string;
  parameters: Parameter[];
  requestBody?: RequestBodySpec;
  responses: ResponseSpec[];
  authentication: boolean;
  rateLimit?: RateLimitSpec;
  deprecated?: boolean;
  tags: string[];
}

export interface Parameter {
  name: string;
  location: "path" | "query" | "header" | "cookie";
  type: string;
  required: boolean;
  description: string;
  schema: JSONSchema;
  example?: any;
}

export interface RequestBodySpec {
  description: string;
  required: boolean;
  contentType: string;
  schema: JSONSchema;
  examples: Record<string, any>;
}

export interface ResponseSpec {
  statusCode: number;
  description: string;
  contentType: string;
  schema: JSONSchema;
  examples: Record<string, any>;
  headers?: Record<string, HeaderSpec>;
}

export interface HeaderSpec {
  description: string;
  type: string;
  required: boolean;
  example?: string;
}

export interface AuthenticationSpec {
  type: "bearer" | "basic" | "apiKey" | "oauth2";
  description: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuth2Flows;
}

export interface OAuth2Flows {
  authorizationCode?: OAuth2Flow;
  implicit?: OAuth2Flow;
  password?: OAuth2Flow;
  clientCredentials?: OAuth2Flow;
}

export interface OAuth2Flow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface RateLimitSpec {
  requests: number;
  window: number; // seconds
  burst?: number;
  scope: "global" | "user" | "ip";
}

// Data Model Definitions
export interface DataModel {
  id: string;
  name: string;
  version: string;
  description: string;
  schema: JSONSchema;
  relationships: DataRelationship[];
  validation: ValidationRule[];
  examples: Record<string, any>;
  metadata: DataModelMetadata;
}

export interface DataModelReference {
  modelId: string;
  version: string;
  usage: "input" | "output" | "both";
  required: boolean;
}

export interface DataRelationship {
  type: "oneToOne" | "oneToMany" | "manyToMany";
  targetModel: string;
  foreignKey: string;
  description: string;
}

export interface DataModelMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
  category: string;
  deprecated?: boolean;
  deprecationReason?: string;
}

export interface JSONSchema {
  $schema?: string;
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  additionalProperties?: boolean | JSONSchema;
  enum?: any[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  description?: string;
  example?: any;
  default?: any;
}

export interface ValidationRule {
  field: string;
  type: "required" | "format" | "range" | "custom";
  rule: string;
  message: string;
  severity: "error" | "warning";
}

// Event Schema Definitions
export interface EventSchema {
  id: string;
  name: string;
  version: string;
  description: string;
  eventType: string;
  source: string;
  dataSchema: JSONSchema;
  metadata: EventMetadata;
  routing: EventRouting;
}

export interface EventMetadata {
  createdAt: Date;
  updatedAt: Date;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  retention: number; // days
  encryption: boolean;
}

export interface EventRouting {
  topics: string[];
  consumers: string[];
  filters: EventFilter[];
}

export interface EventFilter {
  field: string;
  operator: "eq" | "ne" | "gt" | "lt" | "in" | "contains";
  value: any;
}

// Integration Point Definitions
export interface IntegrationPoint {
  id: string;
  name: string;
  type: "api" | "webhook" | "queue" | "database" | "file";
  description: string;
  sourceSystem: string;
  targetSystem: string;
  configuration: IntegrationConfig;
  dataMapping: DataMapping[];
  errorHandling: ErrorHandlingConfig;
  monitoring: MonitoringConfig;
  security: SecurityConfig;
}

export interface IntegrationConfig {
  protocol: string;
  endpoint: string;
  authentication: AuthenticationSpec;
  timeout: number;
  retryPolicy: RetryPolicy;
  batchSize?: number;
  frequency?: string; // cron expression
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: "linear" | "exponential" | "fixed";
  initialDelay: number;
  maxDelay: number;
  multiplier?: number;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  required: boolean;
  defaultValue?: any;
}

export interface ErrorHandlingConfig {
  strategy: "retry" | "dlq" | "ignore" | "alert";
  maxErrors: number;
  alertThreshold: number;
  escalation: EscalationConfig[];
}

export interface EscalationConfig {
  level: number;
  condition: string;
  action: "email" | "slack" | "webhook" | "page";
  target: string;
  delay: number;
}

export interface MonitoringConfig {
  metrics: string[];
  healthCheck: HealthCheckConfig;
  alerts: AlertConfig[];
  logging: LoggingConfig;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // seconds
  timeout: number; // seconds
  healthyThreshold: number;
  unhealthyThreshold: number;
}

export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  severity: "info" | "warning" | "error" | "critical";
  channels: string[];
}

export interface LoggingConfig {
  level: "debug" | "info" | "warning" | "error";
  format: "json" | "text";
  destination: "console" | "file" | "syslog" | "elasticsearch";
  retention: number; // days
}

export interface SecurityConfig {
  encryption: EncryptionConfig;
  accessControl: AccessControlConfig;
  audit: AuditConfig;
}

export interface EncryptionConfig {
  inTransit: boolean;
  atRest: boolean;
  algorithm: string;
  keyRotation: number; // days
}

export interface AccessControlConfig {
  authentication: boolean;
  authorization: boolean;
  roles: string[];
  permissions: Permission[];
}

export interface Permission {
  action: string;
  resource: string;
  conditions?: string[];
}

export interface AuditConfig {
  enabled: boolean;
  events: string[];
  retention: number; // days
  destination: string;
}

// Workflow Integration Contracts
export interface WorkflowContract {
  id: string;
  name: string;
  version: string;
  description: string;
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  steps: WorkflowStepContract[];
  dependencies: WorkflowDependency[];
  quality: QualityContract;
}

export interface WorkflowInput {
  name: string;
  type: string;
  required: boolean;
  description: string;
  schema: JSONSchema;
  source: string;
}

export interface WorkflowOutput {
  name: string;
  type: string;
  description: string;
  schema: JSONSchema;
  destination: string;
}

export interface WorkflowStepContract {
  id: string;
  name: string;
  type: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  executor: string;
  configuration: Record<string, any>;
}

export interface WorkflowDependency {
  type: "workflow" | "service" | "data" | "resource";
  name: string;
  version: string;
  required: boolean;
  description: string;
}

export interface QualityContract {
  gates: QualityGateContract[];
  metrics: QualityMetricContract[];
  sla: SLAContract;
}

export interface QualityGateContract {
  name: string;
  type: string;
  criteria: QualityCriteriaContract[];
  blocking: boolean;
}

export interface QualityCriteriaContract {
  metric: string;
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "ne";
  threshold: number;
  weight: number;
}

export interface QualityMetricContract {
  name: string;
  type: "coverage" | "performance" | "security" | "compliance";
  unit: string;
  target: number;
  critical: boolean;
}

export interface SLAContract {
  availability: number; // percentage
  responseTime: number; // milliseconds
  throughput: number; // requests per second
  errorRate: number; // percentage
  recovery: number; // minutes
}

// Tool Communication Contracts
export interface ToolCommunicationContract {
  sourceTools: string[];
  targetTools: string[];
  messageTypes: MessageTypeContract[];
  protocols: CommunicationProtocol[];
  security: CommunicationSecurity;
}

export interface MessageTypeContract {
  type: string;
  description: string;
  schema: JSONSchema;
  priority: "low" | "medium" | "high" | "urgent";
  ttl: number; // seconds
}

export interface CommunicationProtocol {
  name: string;
  type: "sync" | "async";
  transport: "http" | "websocket" | "queue" | "stream";
  encoding: "json" | "protobuf" | "avro";
  compression: boolean;
}

export interface CommunicationSecurity {
  authentication: boolean;
  encryption: boolean;
  signing: boolean;
  authorization: string[];
}
