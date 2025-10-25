/**
 * Budget Management System - Type Definitions
 * Core types for budget definitions, status, and usage tracking
 */

export type ScopeType = "organization" | "team" | "user" | "project";
export type BudgetPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "custom";
export type BudgetAction =
  | "notify" // Send notification only
  | "restrict-models" // Restrict access to expensive models
  | "require-approval" // Require approval for further spending
  | "block-all" // Block all further spending
  | "auto-downgrade"; // Automatically downgrade to cheaper models

export type BudgetStatus = "normal" | "warning" | "critical" | "exceeded";
export type UsageSource = "relaycore" | "auterity" | "manual";

export interface BudgetAlert {
  threshold: number; // Percentage threshold (0-100)
  actions: BudgetAction[]; // Actions to take when threshold is crossed
  notificationChannels?: string[]; // Channels to notify (email, slack, etc.)
  message?: string; // Custom message for notification
}

export interface BudgetDefinition {
  id: string; // Unique identifier
  name: string; // Display name
  description?: string; // Optional description
  scopeType: ScopeType; // Budget scope
  scopeId: string; // ID of the scope entity
  amount: number; // Budget amount
  currency: string; // Currency code (USD, EUR, etc.)
  period: BudgetPeriod; // Budget period
  startDate: string; // ISO date string for period start
  endDate?: string; // ISO date string for period end (optional for recurring)
  recurring: boolean; // Whether budget recurs after period
  alerts: BudgetAlert[]; // Alert configurations
  tags?: Record<string, string>; // Optional metadata tags
  createdAt: string; // Creation timestamp
  updatedAt: string; // Last update timestamp
  createdBy: string; // User ID who created the budget
  parentBudgetId?: string; // Optional parent budget for hierarchical budgets
}

export interface BudgetAlertStatus {
  threshold: number; // Alert threshold
  triggeredAt: string; // When the alert was triggered
  actions: BudgetAction[]; // Actions being taken
  acknowledged: boolean; // Whether alert was acknowledged
  acknowledgedBy?: string; // Who acknowledged the alert
  acknowledgedAt?: string; // When the alert was acknowledged
}

export interface BudgetStatusInfo {
  budgetId: string; // Budget identifier
  currentAmount: number; // Current spend amount
  limit: number; // Budget limit
  currency: string; // Currency code
  percentUsed: number; // Percentage used (0-100)
  remaining: number; // Remaining amount
  daysRemaining: number; // Days remaining in period
  burnRate: number; // Average daily spend
  projectedTotal: number; // Projected total by period end
  status: BudgetStatus; // Current status
  activeAlerts: BudgetAlertStatus[]; // Currently active alerts
  lastUpdated: string; // Last update timestamp
}

export interface UsageRecord {
  id: string; // Unique identifier
  budgetId: string; // Associated budget
  amount: number; // Usage amount
  currency: string; // Currency code
  timestamp: string; // When the usage occurred
  source: UsageSource; // Source of the usage
  description?: string; // Optional description
  metadata: {
    requestId?: string; // Associated request ID
    modelId?: string; // AI model used
    userId?: string; // User who generated the usage
    teamId?: string; // Team associated with usage
    projectId?: string; // Project associated with usage
    tags?: Record<string, string>; // Additional metadata tags
  };
}

export interface CreateBudgetRequest {
  name: string;
  description?: string;
  scopeType: ScopeType;
  scopeId: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  startDate: string;
  endDate?: string;
  recurring: boolean;
  alerts: BudgetAlert[];
  tags?: Record<string, string>;
  parentBudgetId?: string;
}

export interface UpdateBudgetRequest {
  name?: string;
  description?: string;
  amount?: number;
  currency?: string;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string;
  recurring?: boolean;
  alerts?: BudgetAlert[];
  tags?: Record<string, string>;
}

export interface RecordUsageRequest {
  amount: number;
  currency: string;
  timestamp?: string;
  source: UsageSource;
  description?: string;
  metadata: {
    requestId?: string;
    modelId?: string;
    userId?: string;
    teamId?: string;
    projectId?: string;
    tags?: Record<string, string>;
  };
}

export interface BudgetConstraintCheck {
  budgetId: string;
  estimatedCost: number;
  currency: string;
  canProceed: boolean;
  reason?: string;
  suggestedActions?: BudgetAction[];
}

export interface BudgetListQuery {
  scopeType?: ScopeType;
  scopeId?: string;
  includeInactive?: boolean;
  parentBudgetId?: string;
}

