// Shared Tenancy Types for Auterity Platform
// These types should be shared across Workflow Studio, Error IQ, and AI Hub

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  settings: OrganizationSettings;
  billing: BillingInfo;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationSettings {
  default_workspace_role: WorkspaceRole;
  max_workspaces: number;
  max_users: number;
  features: FeatureFlags;
  security: SecuritySettings;
}

export interface BillingInfo {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled';
  limits: BillingLimits;
}

export interface BillingLimits {
  workspaces: number;
  users: number;
  storage_gb: number;
  api_calls_per_month: number;
  ai_tokens_per_month: number;
}

export interface FeatureFlags {
  advanced_ai: boolean;
  real_time_collaboration: boolean;
  custom_integrations: boolean;
  audit_logs: boolean;
  advanced_security: boolean;
}

export interface SecuritySettings {
  require_mfa: boolean;
  session_timeout_minutes: number;
  password_policy: PasswordPolicy;
  ip_whitelist?: string[];
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
}

export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  settings: WorkspaceSettings;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface WorkspaceSettings {
  default_project_role: ProjectRole;
  visibility: 'public' | 'private' | 'organization';
  allow_external_collaborators: boolean;
  features: FeatureFlags;
  integrations: IntegrationSettings;
}

export interface IntegrationSettings {
  slack_webhook?: string;
  github_token?: string;
  jira_url?: string;
  custom_webhooks: WebhookConfig[];
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'billing';

export interface WorkspaceMember {
  user_id: string;
  workspace_id: string;
  role: WorkspaceRole;
  invited_by: string;
  invited_at: Date;
  joined_at?: Date;
  permissions: WorkspacePermission[];
}

export interface WorkspacePermission {
  resource: string;
  actions: string[];
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description?: string;
  type: ProjectType;
  settings: ProjectSettings;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export type ProjectType =
  | 'web-app'
  | 'api'
  | 'mobile'
  | 'ai-model'
  | 'data-pipeline'
  | 'automation'
  | 'integration'
  | 'other';

export interface ProjectSettings {
  default_environment_role: EnvironmentRole;
  deployment: DeploymentSettings;
  monitoring: MonitoringSettings;
  security: SecuritySettings;
}

export interface DeploymentSettings {
  provider: CloudProvider;
  region: string;
  auto_deploy: boolean;
  deployment_approval_required: boolean;
  rollback_strategy: 'manual' | 'automatic' | 'none';
}

export interface MonitoringSettings {
  enable_logging: boolean;
  enable_metrics: boolean;
  enable_tracing: boolean;
  alert_channels: AlertChannel[];
  retention_days: number;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  target: string;
  events: string[];
}

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'digitalocean' | 'on-premise';

export type ProjectRole = 'owner' | 'admin' | 'developer' | 'viewer';

export interface ProjectMember {
  user_id: string;
  project_id: string;
  role: ProjectRole;
  assigned_by: string;
  assigned_at: Date;
  permissions: ProjectPermission[];
}

export interface ProjectPermission {
  resource: string;
  actions: string[];
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  attribute: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: any;
}

export interface Environment {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  type: EnvironmentType;
  settings: EnvironmentSettings;
  status: EnvironmentStatus;
  created_at: Date;
  updated_at: Date;
}

export type EnvironmentType = 'development' | 'staging' | 'production' | 'testing' | 'demo';

export interface EnvironmentSettings {
  region: string;
  provider: CloudProvider;
  resources: ResourceLimits;
  variables: EnvironmentVariables;
  domains: string[];
}

export interface ResourceLimits {
  cpu_cores: number;
  memory_gb: number;
  storage_gb: number;
  bandwidth_gb: number;
}

export interface EnvironmentVariables {
  [key: string]: string;
}

export interface EnvironmentStatus {
  health: 'healthy' | 'degraded' | 'unhealthy';
  last_check: Date;
  uptime_percentage: number;
  incidents: Incident[];
}

export interface Incident {
  id: string;
  type: 'downtime' | 'degraded_performance' | 'security_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  start_time: Date;
  end_time?: Date;
  description: string;
  resolved: boolean;
}

export type EnvironmentRole = 'owner' | 'admin' | 'developer' | 'viewer';

export interface EnvironmentMember {
  user_id: string;
  environment_id: string;
  role: EnvironmentRole;
  granted_by: string;
  granted_at: Date;
}

// Tenancy Context Types
export interface TenancyContext {
  organization_id: string;
  workspace_id: string;
  project_id?: string;
  environment_id?: string;
  user_id?: string;
}

export interface RequestContext extends TenancyContext {
  request_id: string;
  user_agent: string;
  ip_address: string;
  timestamp: Date;
}

// API Request/Response Types
export interface TenancyHeaders {
  'X-Organization-Id': string;
  'X-Workspace-Id': string;
  'X-Project-Id'?: string;
  'X-Environment-Id'?: string;
  'X-User-Id'?: string;
  'X-Request-Id': string;
}

export interface ApiResponse<T = any> {
  data: T;
  meta: {
    request_id: string;
    timestamp: Date;
    tenancy: TenancyContext;
    pagination?: PaginationInfo;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ListOptions {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

// Error Types
export enum TenancyErrorCode {
  ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND',
  WORKSPACE_ACCESS_DENIED = 'WORKSPACE_ACCESS_DENIED',
  PROJECT_QUOTA_EXCEEDED = 'PROJECT_QUOTA_EXCEEDED',
  ENVIRONMENT_SUSPENDED = 'ENVIRONMENT_SUSPENDED',
  INVALID_TENANCY_CONTEXT = 'INVALID_TENANCY_CONTEXT',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
}

export interface TenancyError extends Error {
  code: TenancyErrorCode;
  tenancy_context: TenancyContext;
  details?: Record<string, any>;
  http_status: number;
}

// Service Interfaces
export interface TenancyService {
  validateAccess(context: TenancyContext, action: string, resource: string): Promise<boolean>;
  getOrganization(orgId: string): Promise<Organization>;
  getWorkspace(workspaceId: string): Promise<Workspace>;
  getProject(projectId: string): Promise<Project>;
  getEnvironment(envId: string): Promise<Environment>;
  listUserWorkspaces(userId: string): Promise<Workspace[]>;
  listWorkspaceProjects(workspaceId: string): Promise<Project[]>;
  listProjectEnvironments(projectId: string): Promise<Environment[]>;
}

// Utility Types
export type EntityType = 'organization' | 'workspace' | 'project' | 'environment' | 'user';

export interface EntityReference {
  type: EntityType;
  id: string;
  name: string;
  slug: string;
}

export interface EntityHierarchy {
  organization: EntityReference;
  workspace: EntityReference;
  project?: EntityReference;
  environment?: EntityReference;
}

// Audit and Compliance Types
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  tenancy_context: TenancyContext;
  changes?: {
    before: any;
    after: any;
  };
  metadata: Record<string, any>;
  ip_address: string;
  user_agent: string;
}

// Quota and Usage Types
export interface ResourceQuotas {
  organization: {
    workspaces: { current: number; limit: number };
    users: { current: number; limit: number };
    storage_gb: { current: number; limit: number };
    api_calls_per_month: { current: number; limit: number };
    ai_tokens_per_month: { current: number; limit: number };
  };
  workspace: {
    projects: { current: number; limit: number };
    workflows: { current: number; limit: number };
    executions_per_month: { current: number; limit: number };
  };
  project: {
    environments: { current: number; limit: number };
    deployments_per_month: { current: number; limit: number };
  };
}

export interface UsageRecord {
  id: string;
  tenancy_context: TenancyContext;
  resource_type: string;
  resource_id: string;
  usage_type: string;
  quantity: number;
  unit: string;
  cost: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

// Migration Types
export interface Migration {
  id: string;
  version: string;
  description: string;
  tenant_scope: 'global' | 'organization' | 'workspace';
  up: (db: any) => Promise<void>;
  down: (db: any) => Promise<void>;
  checksum: string;
}

// Cache Types
export interface CacheEntry {
  key: string;
  value: any;
  ttl: number;
  tenancy_context: TenancyContext;
  created_at: Date;
}

export interface CacheInvalidationRule {
  pattern: string;
  tenancy_fields: (keyof TenancyContext)[];
  cascade: boolean;
}

// Webhook Types
export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  tenancy_context: TenancyContext;
  timestamp: Date;
  signature: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_id: string;
  url: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  status_code?: number;
  response_body?: string;
  error_message?: string;
  attempt_count: number;
  max_attempts: number;
  next_retry_at?: Date;
  delivered_at?: Date;
  created_at: Date;
}
