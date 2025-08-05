/**
 * Cost-Aware Steering Rule Extension for RelayCore
 * 
 * This extension adds cost-aware model selection capabilities to RelayCore's Steering Rule Engine.
 * It integrates with the Budget Management System and Model Selection Algorithm to enable
 * intelligent model selection based on cost parameters and budget constraints.
 */

import { Request, Response, NextFunction } from 'express';
import { Rule, RuleAction, RuleCondition, SteeringRuleEngine } from '../steering-rule-engine';
import { ModelSelectionRequest, ModelSelectionResponse, BudgetStatus } from './types';
import axios from 'axios';

// Configuration
const MODEL_SELECTION_API = process.env.MODEL_SELECTION_API || 'http://localhost:3000/api/v1/models/select';
const BUDGET_STATUS_API = process.env.BUDGET_STATUS_API || 'http://localhost:3000/api/v1/budgets/status';
const USAGE_REPORTING_API = process.env.USAGE_REPORTING_API || 'http://localhost:3000/api/v1/budgets';

/**
 * Cost-aware model selection condition
 * Checks if a request should use cost-aware model selection
 */
export class CostAwareCondition implements RuleCondition {
  private type: string;
  private path: string;
  
  constructor(config: any) {
    this.type = config.type || 'request';
    this.path = config.path || '/v1/chat/completions';
  }
  
  async evaluate(req: Request): Promise<boolean> {
    // Check if the request matches the configured path
    return req.path === this.path;
  }
}

/**
 * Cost-aware model selection action
 * Selects the optimal model based on cost parameters and budget constraints
 */
export class CostAwareModelSelectionAction implements RuleAction {
  private budgetScope: 'organization' | 'team' | 'user' | 'project';
  private scopeIdPath: string;
  private qualityRequirement: 'standard' | 'high' | 'maximum';
  private fallbackChain: boolean;
  private costLimit?: number;
  private preferredModel?: string;
  private excludedModels?: string[];
  
  constructor(config: any) {
    this.budgetScope = config.budget_scope || 'organization';
    this.scopeIdPath = config.scope_id_path || 'user.organizationId';
    this.qualityRequirement = config.quality_requirement || 'standard';
    this.fallbackChain = config.fallback_chain !== false;
    this.costLimit = config.cost_limit;
    this.preferredModel = config.preferred_model;
    this.excludedModels = config.excluded_models;
  }
  
  async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract scope ID from request based on configured path
      const scopeId = this.extractScopeId(req);
      if (!scopeId) {
        console.warn('Could not extract scope ID for budget check');
        return next();
      }
      
      // Check budget status
      const budgetStatus = await this.checkBudgetStatus(this.budgetScope, scopeId);
      if (!budgetStatus) {
        console.warn('Could not retrieve budget status');
        return next();
      }
      
      // Extract task type from request metadata or infer from content
      const taskType = this.extractTaskType(req);
      
      // Create model selection request
      const selectionRequest = this.createSelectionRequest(req, taskType, budgetStatus);
      
      // Call model selection API
      const selectedModel = await this.selectModel(selectionRequest);
      if (!selectedModel) {
        console.warn('Model selection failed');
        return next();
      }
      
      // Apply selected model to request
      this.applyModelSelection(req, selectedModel);
      
      // Store selection metadata for usage reporting
      this.storeSelectionMetadata(req, selectedModel);
      
      // Continue to next middleware
      next();
    } catch (error) {
      console.error('Error in cost-aware model selection:', error);
      next(error);
    }
  }
  
  /**
   * Extract scope ID from request based on configured path
   */
  private extractScopeId(req: Request): string | null {
    try {
      const parts = this.scopeIdPath.split('.');
      let value: any = req;
      
      for (const part of parts) {
        if (!value || typeof value !== 'object') {
          return null;
        }
        value = value[part];
      }
      
      return typeof value === 'string' ? value : null;
    } catch (error) {
      console.error('Error extracting scope ID:', error);
      return null;
    }
  }
  
  /**
   * Check budget status for the given scope
   */
  private async checkBudgetStatus(scopeType: string, scopeId: string): Promise<BudgetStatus | null> {
    try {
      const response = await axios.get(`${BUDGET_STATUS_API}/${scopeType}/${scopeId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking budget status:', error);
      return null;
    }
  }
  
  /**
   * Extract task type from request metadata or infer from content
   */
  private extractTaskType(req: Request): string {
    // First check if task type is explicitly provided in metadata
    if (req.body.metadata?.taskType) {
      return req.body.metadata.taskType;
    }
    
    // Otherwise try to infer from content
    const messages = req.body.messages || [];
    const userMessages = messages.filter((m: any) => m.role === 'user').map((m: any) => m.content).join(' ');
    
    // Simple heuristic-based detection
    if (userMessages.includes('code') || userMessages.includes('function') || userMessages.includes('programming')) {
      return 'code-generation';
    } else if (userMessages.includes('summarize') || userMessages.includes('summary')) {
      return 'summarization';
    } else if (userMessages.includes('translate') || userMessages.includes('translation')) {
      return 'translation';
    } else if (userMessages.includes('analyze') || userMessages.includes('analysis')) {
      return 'data-analysis';
    } else if (userMessages.includes('write') || userMessages.includes('create') || userMessages.includes('generate')) {
      return 'creative-writing';
    } else if (userMessages.includes('reason') || userMessages.includes('think') || userMessages.includes('logic')) {
      return 'reasoning';
    } else if (userMessages.includes('?')) {
      return 'question-answering';
    }
    
    // Default to general chat
    return 'general-chat';
  }
  
  /**
   * Create model selection request
   */
  private createSelectionRequest(req: Request, taskType: string, budgetStatus: BudgetStatus): ModelSelectionRequest {
    // Extract user information
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId;
    const teamId = req.user?.teamId;
    
    // Extract content from request
    const messages = req.body.messages;
    const prompt = req.body.prompt;
    const systemPrompt = req.body.system || messages?.find((m: any) => m.role === 'system')?.content;
    
    // Create selection request
    return {
      requestId: req.id || `req-${Date.now()}`,
      content: {
        messages,
        prompt,
        systemPrompt
      },
      metadata: {
        userId,
        organizationId,
        teamId,
        taskType,
        qualityRequirement: this.qualityRequirement,
        budgetPriority: this.determineBudgetPriority(budgetStatus),
        tags: req.body.metadata?.tags || {}
      },
      constraints: {
        preferredModel: this.preferredModel || req.body.model,
        excludedModels: this.excludedModels,
        maxCost: this.costLimit,
        minQuality: this.qualityRequirementToScore(this.qualityRequirement)
      }
    };
  }
  
  /**
   * Determine budget priority based on budget status
   */
  private determineBudgetPriority(budgetStatus: BudgetStatus): 'cost-saving' | 'balanced' | 'quality-first' {
    const percentUsed = budgetStatus.percentUsed;
    
    if (percentUsed >= 85) {
      return 'cost-saving';
    } else if (percentUsed >= 60) {
      return 'balanced';
    } else {
      return 'quality-first';
    }
  }
  
  /**
   * Convert quality requirement to numeric score
   */
  private qualityRequirementToScore(requirement: string): number {
    switch (requirement) {
      case 'maximum':
        return 90;
      case 'high':
        return 75;
      case 'standard':
      default:
        return 50;
    }
  }
  
  /**
   * Call model selection API
   */
  private async selectModel(request: ModelSelectionRequest): Promise<ModelSelectionResponse | null> {
    try {
      const response = await axios.post(MODEL_SELECTION_API, request);
      return response.data;
    } catch (error) {
      console.error('Error selecting model:', error);
      return null;
    }
  }
  
  /**
   * Apply selected model to request
   */
  private applyModelSelection(req: Request, selection: ModelSelectionResponse): void {
    // Store original model for reference
    req.originalModel = req.body.model;
    
    // Update model in request
    req.body.model = selection.selectedModel;
    
    // Store selection information in request for later use
    req.modelSelection = selection;
  }
  
  /**
   * Store selection metadata for usage reporting
   */
  private storeSelectionMetadata(req: Request, selection: ModelSelectionResponse): void {
    // Store metadata for usage reporting middleware
    req.costAwareMetadata = {
      selectedModel: selection.selectedModel,
      originalModel: req.originalModel,
      estimatedCost: selection.estimatedCost,
      budgetImpact: selection.budgetImpact,
      reasoning: selection.reasoning,
      requestId: selection.requestId
    };
  }
}

/**
 * Usage reporting middleware
 * Reports actual usage to the Budget Management System
 */
export function usageReportingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to capture response
  res.end = function(chunk?: any, encoding?: string, callback?: () => void): Response {
    // Restore original end function
    res.end = originalEnd;
    
    // Call original end function
    res.end(chunk, encoding, callback);
    
    // Report usage if cost-aware metadata exists
    if (req.costAwareMetadata) {
      reportUsage(req, res).catch(error => {
        console.error('Error reporting usage:', error);
      });
    }
    
    return res;
  };
  
  next();
}

/**
 * Report usage to Budget Management System
 */
async function reportUsage(req: Request, res: Response): Promise<void> {
  try {
    // Extract metadata
    const metadata = req.costAwareMetadata;
    if (!metadata) {
      return;
    }
    
    // Extract budget ID
    const budgetId = metadata.budgetImpact?.budgetId;
    if (!budgetId) {
      return;
    }
    
    // Calculate actual tokens used
    const responseData = JSON.parse(res.body || '{}');
    const inputTokens = responseData.usage?.prompt_tokens || 0;
    const outputTokens = responseData.usage?.completion_tokens || 0;
    
    // Calculate actual cost
    const modelInfo = await getModelInfo(metadata.selectedModel);
    if (!modelInfo) {
      return;
    }
    
    const inputCost = inputTokens * modelInfo.costPerToken.input;
    const outputCost = outputTokens * modelInfo.costPerToken.output;
    const totalCost = inputCost + outputCost;
    
    // Create usage record
    const usageRecord = {
      amount: totalCost,
      currency: modelInfo.costPerToken.currency,
      timestamp: new Date().toISOString(),
      source: 'relaycore',
      description: `${metadata.selectedModel} API usage`,
      metadata: {
        requestId: metadata.requestId,
        modelId: metadata.selectedModel,
        userId: req.user?.id,
        teamId: req.user?.teamId,
        organizationId: req.user?.organizationId,
        inputTokens,
        outputTokens,
        originalModel: metadata.originalModel,
        tags: req.body.metadata?.tags || {}
      }
    };
    
    // Send usage record to Budget Management System
    await axios.post(`${USAGE_REPORTING_API}/${budgetId}/usage`, usageRecord);
  } catch (error) {
    console.error('Error reporting usage:', error);
  }
}

/**
 * Get model information
 */
async function getModelInfo(modelId: string): Promise<any> {
  try {
    const response = await axios.get(`${MODEL_SELECTION_API}/models/${modelId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting model info:', error);
    return null;
  }
}

/**
 * Register cost-aware extensions with Steering Rule Engine
 */
export function registerCostAwareExtensions(engine: SteeringRuleEngine): void {
  // Register condition
  engine.registerConditionType('cost-aware', (config: any) => new CostAwareCondition(config));
  
  // Register action
  engine.registerActionType('select-model', (config: any) => new CostAwareModelSelectionAction(config));
  
  console.log('Cost-aware steering rule extensions registered');
}

/**
 * Example steering rule configuration
 */
export const exampleCostAwareRule: Rule = {
  name: 'cost-aware-model-selection',
  priority: 100,
  when: [
    {
      type: 'cost-aware',
      path: '/v1/chat/completions'
    }
  ],
  then: [
    {
      type: 'select-model',
      budget_scope: 'team',
      scope_id_path: 'user.teamId',
      quality_requirement: 'high',
      fallback_chain: true,
      cost_limit: 0.50,
      preferred_model: 'gpt-4'
    }
  ]
};