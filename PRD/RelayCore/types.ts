/**
 * Type definitions for the Budget Management System
 */

/**
 * Budget Definition
 * Represents a budget configuration for a specific scope
 */
export interface BudgetDefinition {
  id: string;                     // Unique identifier
  name: string;                   // Display name
  description?: string;           // Optional description
  scopeType: 'organization' | 'team' | 'user' | 'project'; // Budget scope
  scopeId: string;                // ID of the scope entity
  amount: number;                 // Budget amount
  currency: string;               // Currency code (USD, EUR, etc.)
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom'; // Budget period
  startDate: string;              // ISO date string for period start
  endDate?: string;               // ISO date string for period end (optional for recurring)
  recurring: boolean;             // Whether budget recurs after period
  alerts: BudgetAlert[];          // Alert configurations
  tags?: Record<string, string>;  // Optional metadata tags
  createdAt: string;              // Creation timestamp
  updatedAt: string;              // Last update timestamp
  createdBy: string;              // User ID who created the budget
  parentBudgetId?: string;        // Optional parent budget for hierarchical budgets
}

/**
 * Budget Alert
 * Defines alert thresholds and actions for a budget
 */
export interface BudgetAlert {
  threshold: number;              // Percentage threshold (0-100)
  actions: BudgetAction[];        // Actions to take when threshold is crossed
  notificationChannels?: string[]; // Channels to notify (email, slack, etc.)
  message?: string;               // Custom message for notification
}

/**
 * Budget Action
 * Actions that can be taken when a budget threshold is crossed
 */
export type BudgetAction = 
  | 'notify'                      // Send notification only
  | 'restrict-models'             // Restrict access to expensive models
  | 'require-approval'            // Require approval for further spending
  | 'block-all'                   // Block all further spending
  | 'auto-downgrade';             // Automatically downgrade to cheaper models

/**
 * Budget Status
 * Represents the current status of a budget
 */
export interface BudgetStatus {
  budgetId: string;               // Budget identifier
  currentAmount: number;          // Current spend amount
  limit: number;                  // Budget limit
  currency: string;               // Currency code
  percentUsed: number;            // Percentage used (0-100)
  remaining: number;              // Remaining amount
  daysRemaining: number;          // Days remaining in period
  burnRate: number;               // Average daily spend
  projectedTotal: number;         // Projected total by period end
  status: 'normal' | 'warning' | 'critical' | 'exceeded'; // Current status
  activeAlerts: BudgetAlertStatus[]; // Currently active alerts
  lastUpdated: string;            // Last update timestamp
}

/**
 * Budget Alert Status
 * Represents the status of a triggered budget alert
 */
export interface BudgetAlertStatus {
  threshold: number;              // Alert threshold
  triggeredAt: string;            // When the alert was triggered
  actions: BudgetAction[];        // Actions being taken
  acknowledged: boolean;          // Whether alert was acknowledged
  acknowledgedBy?: string;        // Who acknowledged the alert
  acknowledgedAt?: string;        // When the alert was acknowledged
}

/**
 * Usage Record
 * Represents a usage record against a budget
 */
export interface UsageRecord {
  id: string;                     // Unique identifier
  budgetId: string;               // Associated budget
  amount: number;                 // Usage amount
  currency: string;               // Currency code
  timestamp: string;              // When the usage occurred
  source: 'relaycore' | 'auterity' | 'manual'; // Source of the usage
  description?: string;           // Optional description
  metadata: {
    requestId?: string;           // Associated request ID
    modelId?: string;             // AI model used
    userId?: string;              // User who generated the usage
    teamId?: string;              // Team associated with usage
    projectId?: string;           // Project associated with usage
    tags?: Record<string, string>; // Additional metadata tags
  };
}

/**
 * Budget Report
 * Represents a budget usage report
 */
export interface BudgetReport {
  budgetId: string;               // Budget identifier
  timeRange: string;              // Time range for the report
  startDate: string;              // Start date of the report period
  endDate: string;                // End date of the report period
  totalSpend: number;             // Total spend in the period
  limit: number;                  // Budget limit
  currency: string;               // Currency code
  groupedData: GroupedUsage[];    // Usage data grouped by specified dimension
  topSpenders: SpenderUsage[];    // Top spenders by user
  modelUsage: ModelUsage[];       // Usage by model
  generatedAt: string;            // When the report was generated
}

/**
 * Grouped Usage
 * Represents usage data grouped by a dimension
 */
export interface GroupedUsage {
  group: string;                  // Group identifier (day, week, model, etc.)
  amount: number;                 // Total amount for the group
  percentage: number;             // Percentage of total spend
}

/**
 * Spender Usage
 * Represents usage by a specific user
 */
export interface SpenderUsage {
  userId: string;                 // User identifier
  amount: number;                 // Total amount spent by user
  percentage: number;             // Percentage of total spend
}

/**
 * Model Usage
 * Represents usage by a specific model
 */
export interface ModelUsage {
  modelId: string;                // Model identifier
  amount: number;                 // Total amount spent on model
  percentage: number;             // Percentage of total spend
}

/**
 * Model Selection Request
 * Request to select an optimal model based on constraints
 */
export interface ModelSelectionRequest {
  requestId: string;              // Unique request identifier
  content: {
    messages?: Message[];         // Chat messages (for chat models)
    prompt?: string;              // Text prompt (for completion models)
    systemPrompt?: string;        // System prompt
  };
  metadata: {
    userId?: string;              // User making the request
    organizationId?: string;      // Organization ID
    teamId?: string;              // Team ID
    projectId?: string;           // Project ID
    taskType?: TaskType;          // Type of task
    qualityRequirement?: QualityRequirement; // Quality requirement
    budgetPriority?: BudgetPriority; // Budget priority
    tags?: Record<string, string>; // Additional metadata
  };
  constraints?: {
    preferredModel?: string;      // Preferred model (if any)
    excludedModels?: string[];    // Models to exclude
    maxCost?: number;             // Maximum cost constraint
    minQuality?: number;          // Minimum quality score (0-100)
    requiredCapabilities?: ModelCapability[]; // Required capabilities
  };
}

/**
 * Message
 * Represents a message in a chat conversation
 */
export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;                  // For function messages
}

/**
 * Task Type
 * Types of tasks that can be performed by AI models
 */
export type TaskType = 
  | 'general-chat'
  | 'creative-writing'
  | 'code-generation'
  | 'data-analysis'
  | 'reasoning'
  | 'summarization'
  | 'translation'
  | 'question-answering';

/**
 * Quality Requirement
 * Level of quality required for a request
 */
export type QualityRequirement = 'standard' | 'high' | 'maximum';

/**
 * Budget Priority
 * Priority between cost and quality
 */
export type BudgetPriority = 'cost-saving' | 'balanced' | 'quality-first';

/**
 * Model Capability
 * Capabilities that models can have
 */
export type ModelCapability = 
  | 'text-generation'
  | 'code-generation'
  | 'function-calling'
  | 'image-understanding'
  | 'tool-use'
  | 'reasoning'
  | 'math'
  | 'embeddings';

/**
 * Model Selection Response
 * Response from the model selection algorithm
 */
export interface ModelSelectionResponse {
  requestId: string;              // Original request ID
  selectedModel: string;          // Selected model ID
  alternatives: AlternativeModel[]; // Alternative models
  reasoning: string;              // Explanation of selection
  estimatedCost: {
    amount: number;               // Estimated cost
    currency: string;             // Currency code
    breakdown: {
      inputTokens: number;        // Estimated input tokens
      outputTokens: number;       // Estimated output tokens
      inputCost: number;          // Input token cost
      outputCost: number;         // Output token cost
    };
  };
  budgetImpact: {
    budgetId: string;             // Affected budget ID
    percentOfRemaining: number;   // Percentage of remaining budget
    status: 'low' | 'medium' | 'high'; // Impact level
  };
  qualityExpectation: number;     // Expected quality score (0-100)
  fallbackChain: string[];        // Fallback models if selected is unavailable
}

/**
 * Alternative Model
 * Represents an alternative model that wasn't selected
 */
export interface AlternativeModel {
  modelId: string;                // Model ID
  reason: string;                 // Why it wasn't selected
  costDifference: number;         // Cost difference (+ or -)
  qualityDifference: number;      // Quality difference (+ or -)
}

/**
 * Model Definition
 * Represents a model's capabilities and characteristics
 */
export interface ModelDefinition {
  id: string;                     // Unique identifier
  provider: string;               // Model provider (OpenAI, Anthropic, etc.)
  name: string;                   // Display name
  version: string;                // Model version
  capabilities: ModelCapability[]; // Model capabilities
  costPerToken: {
    input: number;                // Cost per input token
    output: number;               // Cost per output token
    currency: string;             // Currency code
  };
  qualityScores: {
    reasoning: number;            // Score for reasoning tasks (0-100)
    creativity: number;           // Score for creative tasks (0-100)
    knowledge: number;            // Score for knowledge-based tasks (0-100)
    coding: number;               // Score for coding tasks (0-100)
    math: number;                 // Score for mathematical tasks (0-100)
  };
  contextWindow: number;          // Maximum context window size
  maxOutputTokens: number;        // Maximum output tokens
  averageSpeed: number;           // Average tokens per second
  status: 'active' | 'deprecated' | 'preview'; // Model status
  tags: string[];                 // Model tags
  createdAt: string;              // When the model was added
  updatedAt: string;              // When the model was last updated
}

/**
 * Cost Estimate Request
 * Request to estimate the cost of a request
 */
export interface CostEstimateRequest {
  content: {
    messages?: Message[];         // Chat messages (for chat models)
    prompt?: string;              // Text prompt (for completion models)
    systemPrompt?: string;        // System prompt
  };
  models: string[];               // Models to estimate for
}

/**
 * Cost Estimate Response
 * Response with cost estimates for models
 */
export interface CostEstimateResponse {
  estimates: ModelCostEstimate[];
}

/**
 * Model Cost Estimate
 * Cost estimate for a specific model
 */
export interface ModelCostEstimate {
  modelId: string;                // Model ID
  inputTokens: number;            // Estimated input tokens
  estimatedOutputTokens: number;  // Estimated output tokens
  cost: {
    amount: number;               // Total estimated cost
    currency: string;             // Currency code
    breakdown: {
      inputCost: number;          // Input token cost
      outputCost: number;         // Output token cost
    };
  };
}