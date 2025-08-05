/**
 * Types for the Steering Rule Engine
 * 
 * This file defines the TypeScript interfaces for the YAML-based routing rules
 * that determine how requests are routed to different AI providers.
 */

/**
 * Represents a condition that can be evaluated against a request
 */
export interface RuleCondition {
  // Field to evaluate (e.g., 'request.prompt', 'request.model', 'request.user', etc.)
  field: string;
  
  // Operator for comparison (e.g., 'equals', 'contains', 'regex', 'gt', 'lt', etc.)
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'exists' | 'not_exists';
  
  // Value to compare against (can be string, number, boolean, or array)
  value?: string | number | boolean | Array<string | number | boolean>;
}

/**
 * Represents an action to take when a rule matches
 */
export interface RuleAction {
  // Type of action to perform
  type: 'route' | 'transform' | 'inject' | 'reject' | 'log';
  
  // Parameters for the action
  params: {
    // For 'route' action: the provider to route to
    provider?: string;
    
    // For 'route' action: the specific model to use
    model?: string;
    
    // For 'transform' action: transformation to apply to the request
    transformation?: {
      field: string;
      operation: 'replace' | 'append' | 'prepend' | 'delete';
      value?: string;
    };
    
    // For 'inject' action: context to inject into the request
    context?: {
      field: string;
      value: string;
    };
    
    // For 'reject' action: error message to return
    message?: string;
    
    // For 'reject' action: HTTP status code to return
    status?: number;
    
    // For 'log' action: log level
    level?: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Represents a single steering rule
 */
export interface SteeringRule {
  // Unique identifier for the rule
  id: string;
  
  // Human-readable name for the rule
  name: string;
  
  // Optional description of what the rule does
  description?: string;
  
  // Priority of the rule (lower numbers have higher priority)
  priority: number;
  
  // Whether the rule is enabled
  enabled: boolean;
  
  // Conditions that must be met for the rule to apply
  conditions: RuleCondition[];
  
  // Logical operator to combine conditions ('and' or 'or')
  operator: 'and' | 'or';
  
  // Actions to take when the rule matches
  actions: RuleAction[];
  
  // Whether to continue evaluating other rules after this one matches
  continue: boolean;
  
  // Tags for organizing and filtering rules
  tags?: string[];
  
  // Metadata for the rule (creation date, last modified, etc.)
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    [key: string]: any;
  };
}

/**
 * Represents a collection of steering rules
 */
export interface SteeringRuleSet {
  // Version of the rule schema
  version: string;
  
  // Name of the rule set
  name: string;
  
  // Description of the rule set
  description?: string;
  
  // The rules in the set
  rules: SteeringRule[];
  
  // Default actions to take if no rules match
  defaultActions?: RuleAction[];
}

/**
 * Result of evaluating a rule against a request
 */
export interface RuleEvaluationResult {
  // Whether the rule matched
  matched: boolean;
  
  // The rule that was evaluated
  rule: SteeringRule;
  
  // The actions that were taken
  actions: RuleAction[];
  
  // Whether to continue evaluating other rules
  continue: boolean;
}

/**
 * Context for rule evaluation
 */
export interface RuleEvaluationContext {
  // The original request
  request: any;
  
  // The user making the request
  user?: any;
  
  // The organization the user belongs to
  organization?: any;
  
  // Additional context for evaluation
  context?: Record<string, any>;
}