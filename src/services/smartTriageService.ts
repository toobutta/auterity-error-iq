/**
 * Smart Triage Service
 * 
 * Handles triage decision algorithms, workflow routing rules, priority calculation,
 * and triage queue management (Non-AI business logic)
 */

import { z } from 'zod';

// Triage Schemas
const PriorityLevelSchema = z.enum(['low', 'medium', 'high', 'critical', 'urgent']);

const TriageRuleTypeSchema = z.enum([
  'keyword_match',
  'pattern_match',
  'threshold_based',
  'time_based',
  'user_based',
  'workload_based',
  'resource_based',
  'custom'
]);

const TriageActionSchema = z.enum([
  'route_to_queue',
  'assign_to_agent',
  'escalate',
  'auto_resolve',
  'schedule_later',
  'merge_with_existing',
  'create_incident',
  'notify_stakeholders'
]);

const TriageRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: TriageRuleTypeSchema,
  priority: z.number().min(1).max(100), // Higher number = higher priority
  is_active: z.boolean().default(true),
  
  // Conditions
  conditions: z.object({
    keywords: z.array(z.string()).default([]),
    patterns: z.array(z.string()).default([]),
    thresholds: z.record(z.number()).default({}),
    time_windows: z.array(z.object({
      start: z.string(), // HH:MM format
      end: z.string(),   // HH:MM format
      days: z.array(z.number()).default([]) // 0-6, 0=Sunday
    })).default([]),
    user_attributes: z.record(z.unknown()).default({}),
    workload_limits: z.record(z.number()).default({})
  }),
  
  // Actions
  actions: z.array(z.object({
    type: TriageActionSchema,
    parameters: z.record(z.unknown()),
    delay_seconds: z.number().default(0)
  })),
  
  // Metadata
  tenant_id: z.string(),
  created_by: z.string(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  last_used_at: z.date().optional(),
  usage_count: z.number().default(0)
});

const TriageItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  content: z.string(),
  priority: PriorityLevelSchema.default('medium'),
  
  // Source information
  source: z.object({
    type: z.string(),
    id: z.string(),
    user_id: z.string().optional(),
    session_id: z.string().optional(),
    ip_address: z.string().optional(),
    user_agent: z.string().optional()
  }),
  
  // Context data
  context: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  
  // Triage results
  triage_results: z.object({
    assigned_queue: z.string().optional(),
    assigned_agent: z.string().optional(),
    applied_rules: z.array(z.string()).default([]),
    confidence_score: z.number().min(0).max(1),
    routing_decision: z.string(),
    suggested_actions: z.array(z.string()).default([]),
    processing_time_ms: z.number().default(0)
  }).optional(),
  
  // Status tracking
  status: z.enum(['pending', 'triaged', 'assigned', 'in_progress', 'resolved', 'closed']).default('pending'),
  
  // Timestamps
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  triaged_at: z.date().optional(),
  assigned_at: z.date().optional(),
  resolved_at: z.date().optional(),
  
  // SLA tracking
  sla_deadline: z.date().optional(),
  sla_breached: z.boolean().default(false)
});

const TriageQueueSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  queue_type: z.enum(['general', 'priority', 'specialized', 'escalation', 'overflow']),
  
  // Configuration
  config: z.object({
    max_capacity: z.number().default(1000),
    auto_assignment: z.boolean().default(true),
    sla_minutes: z.number().default(240), // 4 hours default
    priority_weighting: z.record(z.number()).default({}),
    routing_rules: z.array(z.string()).default([])
  }),
  
  // Current state
  current_load: z.number().default(0),
  assigned_agents: z.array(z.string()).default([]),
  
  // Statistics
  stats: z.object({
    total_processed: z.number().default(0),
    avg_processing_time_minutes: z.number().default(0),
    sla_compliance_rate: z.number().default(1.0),
    current_backlog: z.number().default(0)
  }),
  
  // Metadata
  tenant_id: z.string(),
  is_active: z.boolean().default(true),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

// Types
export type PriorityLevel = z.infer<typeof PriorityLevelSchema>;
export type TriageRuleType = z.infer<typeof TriageRuleTypeSchema>;
export type TriageAction = z.infer<typeof TriageActionSchema>;
export type TriageRule = z.infer<typeof TriageRuleSchema>;
export type TriageItem = z.infer<typeof TriageItemSchema>;
export type TriageQueue = z.infer<typeof TriageQueueSchema>;

export interface TriageDecision {
  routing_decision: string;
  confidence_score: number;
  rule_applied?: string;
  reasoning: string;
  suggested_actions: string[];
  processing_time_ms: number;
  priority_adjustment?: PriorityLevel;
}

export interface TriageMetrics {
  total_items: number;
  items_by_priority: Record<PriorityLevel, number>;
  items_by_status: Record<string, number>;
  avg_processing_time: number;
  sla_compliance_rate: number;
  rule_effectiveness: Record<string, number>;
  queue_utilization: Record<string, number>;
}

export class SmartTriageService {
  private rules: Map<string, TriageRule> = new Map();
  private queues: Map<string, TriageQueue> = new Map();
  private items: Map<string, TriageItem> = new Map();
  private ruleCache: Map<string, TriageRule[]> = new Map(); // tenant_id -> rules

  // ===== TRIAGE RULE MANAGEMENT =====

  /**
   * Create a new triage rule
   */
  async createRule(rule: Omit<TriageRule, 'id' | 'created_at' | 'updated_at'>): Promise<TriageRule> {
    const newRule: TriageRule = {
      ...rule,
      id: this.generateId('rule'),
      created_at: new Date(),
      updated_at: new Date()
    };

    // Validate rule
    const validatedRule = TriageRuleSchema.parse(newRule);
    
    this.rules.set(validatedRule.id, validatedRule);
    this.clearRuleCache(validatedRule.tenant_id);
    
    return validatedRule;
  }

  /**
   * Get triage rules for a tenant
   */
  async getRules(tenantId: string): Promise<TriageRule[]> {
    // Check cache first
    if (this.ruleCache.has(tenantId)) {
      return this.ruleCache.get(tenantId)!;
    }

    // Load rules for tenant
    const tenantRules = Array.from(this.rules.values())
      .filter(rule => rule.tenant_id === tenantId && rule.is_active)
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    this.ruleCache.set(tenantId, tenantRules);
    return tenantRules;
  }

  /**
   * Update triage rule
   */
  async updateRule(ruleId: string, updates: Partial<TriageRule>): Promise<TriageRule | null> {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) {
      return null;
    }

    const updatedRule: TriageRule = {
      ...existingRule,
      ...updates,
      updated_at: new Date()
    };

    // Validate updated rule
    const validatedRule = TriageRuleSchema.parse(updatedRule);
    
    this.rules.set(ruleId, validatedRule);
    this.clearRuleCache(validatedRule.tenant_id);
    
    return validatedRule;
  }

  /**
   * Delete triage rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    this.rules.delete(ruleId);
    this.clearRuleCache(rule.tenant_id);
    
    return true;
  }

  // ===== TRIAGE DECISION ALGORITHMS =====

  /**
   * Perform triage on an item
   */
  async triageItem(
    content: string,
    context: Record<string, unknown>,
    tenantId: string,
    source?: TriageItem['source']
  ): Promise<TriageDecision> {
    const startTime = Date.now();

    try {
      // Get active rules for tenant
      const rules = await this.getRules(tenantId);

      // Apply rules in priority order
      let bestDecision: TriageDecision | null = null;
      let highestConfidence = 0;

      for (const rule of rules) {
        const decision = await this.evaluateRule(rule, content, context);
        
        if (decision.confidence_score > highestConfidence) {
          bestDecision = decision;
          highestConfidence = decision.confidence_score;
          bestDecision.rule_applied = rule.id;
        }

        // Stop if we have high confidence
        if (decision.confidence_score >= 0.9) {
          break;
        }
      }

      // Fallback decision if no rules matched well
      if (!bestDecision || bestDecision.confidence_score < 0.3) {
        bestDecision = this.createFallbackDecision(content, context);
      }

      // Calculate processing time
      bestDecision.processing_time_ms = Date.now() - startTime;

      // Update rule usage statistics
      if (bestDecision.rule_applied) {
        await this.updateRuleUsage(bestDecision.rule_applied);
      }

      return bestDecision;

    } catch (error) {
      console.error('Triage failed:', error);
      return this.createErrorDecision(error, Date.now() - startTime);
    }
  }

  /**
   * Evaluate a single rule against content and context
   */
  private async evaluateRule(
    rule: TriageRule,
    content: string,
    context: Record<string, unknown>
  ): Promise<TriageDecision> {
    let confidence = 0;
    let reasoning = '';
    const suggestedActions: string[] = [];

    // Evaluate based on rule type
    switch (rule.type) {
      case 'keyword_match':
        confidence = this.evaluateKeywordMatch(rule, content);
        reasoning = `Keyword match evaluation: ${confidence.toFixed(2)}`;
        break;

      case 'pattern_match':
        confidence = this.evaluatePatternMatch(rule, content);
        reasoning = `Pattern match evaluation: ${confidence.toFixed(2)}`;
        break;

      case 'threshold_based':
        confidence = this.evaluateThresholds(rule, context);
        reasoning = `Threshold-based evaluation: ${confidence.toFixed(2)}`;
        break;

      case 'time_based':
        confidence = this.evaluateTimeWindows(rule);
        reasoning = `Time-based evaluation: ${confidence.toFixed(2)}`;
        break;

      case 'user_based':
        confidence = this.evaluateUserAttributes(rule, context);
        reasoning = `User-based evaluation: ${confidence.toFixed(2)}`;
        break;

      case 'workload_based':
        confidence = this.evaluateWorkload(rule, context);
        reasoning = `Workload-based evaluation: ${confidence.toFixed(2)}`;
        break;

      case 'resource_based':
        confidence = this.evaluateResources(rule, context);
        reasoning = `Resource-based evaluation: ${confidence.toFixed(2)}`;
        break;

      default:
        confidence = 0.1;
        reasoning = 'Unknown rule type';
    }

    // Determine routing decision and actions
    let routingDecision = 'general_queue';
    
    if (rule.actions.length > 0) {
      const primaryAction = rule.actions[0];
      
      switch (primaryAction.type) {
        case 'route_to_queue':
          routingDecision = primaryAction.parameters.queue_id as string || 'general_queue';
          suggestedActions.push(`Route to queue: ${routingDecision}`);
          break;

        case 'assign_to_agent':
          routingDecision = 'agent_assignment';
          suggestedActions.push(`Assign to agent: ${primaryAction.parameters.agent_id}`);
          break;

        case 'escalate':
          routingDecision = 'escalation_queue';
          suggestedActions.push('Escalate to higher priority');
          break;

        case 'auto_resolve':
          routingDecision = 'auto_resolution';
          suggestedActions.push('Auto-resolve with template response');
          break;

        case 'schedule_later':
          routingDecision = 'scheduled_queue';
          suggestedActions.push(`Schedule for later processing`);
          break;

        default:
          suggestedActions.push(`Execute action: ${primaryAction.type}`);
      }
    }

    return {
      routing_decision: routingDecision,
      confidence_score: confidence,
      reasoning,
      suggested_actions: suggestedActions,
      processing_time_ms: 0 // Will be set by caller
    };
  }

  // ===== RULE EVALUATION METHODS =====

  private evaluateKeywordMatch(rule: TriageRule, content: string): number {
    const keywords = rule.conditions.keywords;
    if (keywords.length === 0) return 0;

    const contentLower = content.toLowerCase();
    const matchedKeywords = keywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );

    return matchedKeywords.length / keywords.length;
  }

  private evaluatePatternMatch(rule: TriageRule, content: string): number {
    const patterns = rule.conditions.patterns;
    if (patterns.length === 0) return 0;

    let matches = 0;
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(content)) {
          matches++;
        }
      } catch (error) {
        console.warn(`Invalid regex pattern: ${pattern}`);
      }
    }

    return matches / patterns.length;
  }

  private evaluateThresholds(rule: TriageRule, context: Record<string, unknown>): number {
    const thresholds = rule.conditions.thresholds;
    const thresholdKeys = Object.keys(thresholds);
    
    if (thresholdKeys.length === 0) return 0;

    let matches = 0;
    for (const key of thresholdKeys) {
      const contextValue = Number(context[key]) || 0;
      const thresholdValue = thresholds[key];
      
      if (contextValue >= thresholdValue) {
        matches++;
      }
    }

    return matches / thresholdKeys.length;
  }

  private evaluateTimeWindows(rule: TriageRule): number {
    const timeWindows = rule.conditions.time_windows;
    if (timeWindows.length === 0) return 1; // No time restrictions

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentTime = currentHour * 60 + currentMinute; // Minutes since midnight

    for (const window of timeWindows) {
      // Check day of week
      if (window.days.length > 0 && !window.days.includes(currentDay)) {
        continue;
      }

      // Parse time window
      const startParts = window.start.split(':');
      const endParts = window.end.split(':');
      const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      // Check if current time is within window
      if (currentTime >= startTime && currentTime <= endTime) {
        return 1.0;
      }
    }

    return 0.0; // Outside all time windows
  }

  private evaluateUserAttributes(rule: TriageRule, context: Record<string, unknown>): number {
    const requiredAttributes = rule.conditions.user_attributes;
    const attributeKeys = Object.keys(requiredAttributes);
    
    if (attributeKeys.length === 0) return 1; // No user restrictions

    let matches = 0;
    for (const key of attributeKeys) {
      const contextValue = context[key];
      const requiredValue = requiredAttributes[key];
      
      if (contextValue === requiredValue) {
        matches++;
      }
    }

    return matches / attributeKeys.length;
  }

  private evaluateWorkload(rule: TriageRule, context: Record<string, unknown>): number {
    const workloadLimits = rule.conditions.workload_limits;
    const limitKeys = Object.keys(workloadLimits);
    
    if (limitKeys.length === 0) return 1; // No workload restrictions

    let withinLimits = 0;
    for (const key of limitKeys) {
      const currentLoad = Number(context[key]) || 0;
      const limit = workloadLimits[key];
      
      if (currentLoad <= limit) {
        withinLimits++;
      }
    }

    return withinLimits / limitKeys.length;
  }

  private evaluateResources(rule: TriageRule, context: Record<string, unknown>): number {
    // Evaluate resource availability (CPU, memory, etc.)
    // This is a simplified implementation
    const resourceUtilization = Number(context.resource_utilization) || 0;
    
    if (resourceUtilization < 0.7) return 1.0; // Low utilization
    if (resourceUtilization < 0.9) return 0.5; // Medium utilization
    return 0.1; // High utilization
  }

  // ===== PRIORITY CALCULATION =====

  /**
   * Calculate priority based on various factors
   */
  calculatePriority(
    content: string,
    context: Record<string, unknown>,
    triageDecision: TriageDecision
  ): PriorityLevel {
    let score = 0;

    // Base score from triage confidence
    score += triageDecision.confidence_score * 20;

    // Keyword-based priority scoring
    const urgentKeywords = ['urgent', 'critical', 'emergency', 'down', 'outage', 'failure'];
    const highKeywords = ['important', 'asap', 'priority', 'escalate'];
    const contentLower = content.toLowerCase();

    if (urgentKeywords.some(keyword => contentLower.includes(keyword))) {
      score += 40;
    } else if (highKeywords.some(keyword => contentLower.includes(keyword))) {
      score += 25;
    }

    // Context-based scoring
    const userPriority = Number(context.user_priority) || 0;
    const businessImpact = Number(context.business_impact) || 0;
    const affectedUsers = Number(context.affected_users) || 0;

    score += userPriority * 10;
    score += businessImpact * 15;
    score += Math.min(affectedUsers / 10, 20); // Cap at 20 points

    // SLA considerations
    const slaDeadline = context.sla_deadline as Date;
    if (slaDeadline) {
      const timeToDeadline = slaDeadline.getTime() - Date.now();
      const hoursToDeadline = timeToDeadline / (1000 * 60 * 60);
      
      if (hoursToDeadline < 1) score += 30;
      else if (hoursToDeadline < 4) score += 20;
      else if (hoursToDeadline < 24) score += 10;
    }

    // Convert score to priority level
    if (score >= 80) return 'critical';
    if (score >= 60) return 'urgent';
    if (score >= 40) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }

  // ===== QUEUE MANAGEMENT =====

  /**
   * Create a new triage queue
   */
  async createQueue(queue: Omit<TriageQueue, 'id' | 'created_at' | 'updated_at'>): Promise<TriageQueue> {
    const newQueue: TriageQueue = {
      ...queue,
      id: this.generateId('queue'),
      created_at: new Date(),
      updated_at: new Date()
    };

    // Validate queue
    const validatedQueue = TriageQueueSchema.parse(newQueue);
    
    this.queues.set(validatedQueue.id, validatedQueue);
    return validatedQueue;
  }

  /**
   * Get all queues for a tenant
   */
  async getQueues(tenantId: string): Promise<TriageQueue[]> {
    return Array.from(this.queues.values())
      .filter(queue => queue.tenant_id === tenantId && queue.is_active);
  }

  /**
   * Get queue by ID
   */
  async getQueue(queueId: string): Promise<TriageQueue | null> {
    return this.queues.get(queueId) || null;
  }

  /**
   * Update queue statistics
   */
  async updateQueueStats(queueId: string, stats: Partial<TriageQueue['stats']>): Promise<void> {
    const queue = this.queues.get(queueId);
    if (!queue) return;

    queue.stats = { ...queue.stats, ...stats };
    queue.updated_at = new Date();
    this.queues.set(queueId, queue);
  }

  /**
   * Add item to queue
   */
  async addToQueue(queueId: string, itemId: string): Promise<boolean> {
    const queue = this.queues.get(queueId);
    const item = this.items.get(itemId);
    
    if (!queue || !item) return false;

    // Check capacity
    if (queue.current_load >= queue.config.max_capacity) {
      return false;
    }

    // Update queue load
    queue.current_load++;
    queue.stats.current_backlog++;
    queue.updated_at = new Date();
    this.queues.set(queueId, queue);

    // Update item status
    item.status = 'triaged';
    item.triaged_at = new Date();
    if (item.triage_results) {
      item.triage_results.assigned_queue = queueId;
    }
    this.items.set(itemId, item);

    return true;
  }

  // ===== UTILITY METHODS =====

  /**
   * Create fallback decision for unmatched items
   */
  private createFallbackDecision(content: string, context: Record<string, unknown>): TriageDecision {
    return {
      routing_decision: 'general_queue',
      confidence_score: 0.1,
      reasoning: 'No rules matched - using fallback routing',
      suggested_actions: ['Route to general queue for manual review'],
      processing_time_ms: 0
    };
  }

  /**
   * Create error decision when triage fails
   */
  private createErrorDecision(error: unknown, processingTime: number): TriageDecision {
    return {
      routing_decision: 'error_queue',
      confidence_score: 0.0,
      reasoning: `Triage failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggested_actions: ['Route to error queue for investigation'],
      processing_time_ms: processingTime
    };
  }

  /**
   * Update rule usage statistics
   */
  private async updateRuleUsage(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    rule.usage_count++;
    rule.last_used_at = new Date();
    rule.updated_at = new Date();
    this.rules.set(ruleId, rule);
  }

  /**
   * Clear rule cache for tenant
   */
  private clearRuleCache(tenantId: string): void {
    this.ruleCache.delete(tenantId);
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get triage metrics for a tenant
   */
  async getTriageMetrics(tenantId: string): Promise<TriageMetrics> {
    const tenantItems = Array.from(this.items.values())
      .filter(item => item.triage_results?.assigned_queue && 
        this.queues.get(item.triage_results.assigned_queue)?.tenant_id === tenantId);

    const metrics: TriageMetrics = {
      total_items: tenantItems.length,
      items_by_priority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
        urgent: 0
      },
      items_by_status: {},
      avg_processing_time: 0,
      sla_compliance_rate: 0,
      rule_effectiveness: {},
      queue_utilization: {}
    };

    // Calculate metrics
    let totalProcessingTime = 0;
    let slaCompliantItems = 0;

    for (const item of tenantItems) {
      // Count by priority
      metrics.items_by_priority[item.priority]++;

      // Count by status
      metrics.items_by_status[item.status] = (metrics.items_by_status[item.status] || 0) + 1;

      // Processing time
      if (item.triage_results) {
        totalProcessingTime += item.triage_results.processing_time_ms;
      }

      // SLA compliance
      if (!item.sla_breached) {
        slaCompliantItems++;
      }

      // Rule effectiveness
      if (item.triage_results?.applied_rules) {
        for (const ruleId of item.triage_results.applied_rules) {
          metrics.rule_effectiveness[ruleId] = (metrics.rule_effectiveness[ruleId] || 0) + 1;
        }
      }
    }

    if (tenantItems.length > 0) {
      metrics.avg_processing_time = totalProcessingTime / tenantItems.length;
      metrics.sla_compliance_rate = slaCompliantItems / tenantItems.length;
    }

    // Queue utilization
    const tenantQueues = await this.getQueues(tenantId);
    for (const queue of tenantQueues) {
      metrics.queue_utilization[queue.id] = queue.current_load / queue.config.max_capacity;
    }

    return metrics;
  }
}

// Export singleton instance
export const smartTriageService = new SmartTriageService();
