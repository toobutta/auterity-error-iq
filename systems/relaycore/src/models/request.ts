/**
 * RelayCore Request/Response Type Definitions
 * Shared interfaces for AI routing and processing
 */

export interface AIRequest {
  id: string;
  prompt: string;
  context: RequestContext;
  routing_preferences: RoutingPreferences;
  cost_constraints: CostConstraints;
  user_id?: string;
  system_source: string;
  timestamp?: Date;
}

export interface AIResponse {
  id: string;
  content: string;
  model_used: string;
  provider: string;
  cost: number;
  latency: number;
  confidence: number;
  metadata: Record<string, any>;
  timestamp?: Date;
}

export interface RequestContext {
  conversation_id?: string;
  user_role?: string;
  domain?: string;
  priority?: "low" | "medium" | "high";
  automotive_context?: AutomotiveContext;
  [key: string]: any;
}

export interface AutomotiveContext {
  dealership_id?: string;
  customer_type?: "new" | "existing" | "service";
  vehicle_info?: VehicleInfo;
  service_type?: "sales" | "service" | "parts" | "finance";
  urgency?: "low" | "medium" | "high" | "critical";
}

export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  mileage?: number;
  service_history?: ServiceRecord[];
}

export interface ServiceRecord {
  date: string;
  type: string;
  description: string;
  cost: number;
  technician?: string;
}

export interface RoutingPreferences {
  preferred_provider?: string;
  preferred_model?: string;
  avoid_providers?: string[];
  require_specialization?: string[];
  max_latency_ms?: number;
  quality_threshold?: number;
}

export interface CostConstraints {
  max_cost: number;
  budget_remaining?: number;
  cost_optimization?: "aggressive" | "balanced" | "quality_first";
  billing_account?: string;
}

export interface RoutingDecision {
  provider: string;
  model: string;
  estimated_cost: number;
  expected_latency: number;
  confidence_score: number;
  reasoning: string;
  fallback_provider?: string;
  fallback_model?: string;
  routing_rules_applied: string[];
}

export interface SteeringRule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RuleCondition {
  field: string;
  operator:
    | "equals"
    | "contains"
    | "starts_with"
    | "ends_with"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  value: any;
  case_sensitive?: boolean;
}

export interface RuleAction {
  type:
    | "route_to_provider"
    | "route_to_model"
    | "set_cost_limit"
    | "add_context"
    | "require_approval";
  parameters: Record<string, any>;
}

export interface MetricsData {
  request_id: string;
  user_id?: string;
  system_source: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  latency_ms: number;
  success: boolean;
  error_type?: string;
  error_message?: string;
  timestamp: Date;
  routing_decision: RoutingDecision;
}

export interface CostOptimizationResult {
  original_decision: RoutingDecision;
  optimized_decision: RoutingDecision;
  cost_savings: number;
  optimization_applied: string[];
  quality_impact: "none" | "minimal" | "moderate" | "significant";
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  response_time_ms: number;
  error_rate: number;
  cost_per_token: number;
  models: ModelStatus[];
  last_checked: Date;
}

export interface ModelStatus {
  name: string;
  available: boolean;
  specializations: string[];
  performance_score: number;
  cost_per_token: number;
  max_tokens: number;
}

// Express Request extension for authentication
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

