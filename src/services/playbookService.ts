/**
 * Playbook Service
 *
 * Manages automated remediation playbooks that can be triggered
 * based on triage results, with approval workflows and safety checks
 */

import { z } from 'zod';
import { EventEmitter } from 'events';
import { mcpProtocolService, MCPMessage } from './mcpProtocolService';
import { smartTriageService } from './smartTriageService';

// Playbook Schemas
const PlaybookStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum([
    'agent_action',
    'api_call',
    'database_query',
    'file_operation',
    'notification',
    'approval_required',
    'conditional_branch',
    'manual_step',
    'rollback_step'
  ]),
  config: z.record(z.unknown()).default({}),
  dependencies: z.array(z.string()).default([]), // Step IDs this step depends on
  timeout_seconds: z.number().default(300),
  retry_count: z.number().default(0),
  retry_delay_seconds: z.number().default(30),
  on_failure: z.enum(['stop', 'continue', 'rollback']).default('stop'),
  required_permissions: z.array(z.string()).default([]),
  estimated_duration_seconds: z.number().default(60)
});

const PlaybookTriggerSchema = z.object({
  type: z.enum([
    'manual',
    'triage_result',
    'schedule',
    'alert',
    'api_call',
    'multimodal_analysis'
  ]),
  conditions: z.record(z.unknown()).default({}),
  priority: z.number().min(1).max(5).default(3),
  auto_execute: z.boolean().default(false),
  require_approval: z.boolean().default(true),
  approval_timeout_minutes: z.number().default(30),
  notify_on_trigger: z.array(z.string()).default([]) // User IDs or email addresses
});

const PlaybookSafetyCheckSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum([
    'resource_limits',
    'time_window',
    'dependency_check',
    'impact_assessment',
    'permission_check',
    'custom_validation'
  ]),
  config: z.record(z.unknown()).default({}),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  fail_action: z.enum(['block', 'warn', 'allow']).default('block'),
  enabled: z.boolean().default(true)
});

const PlaybookExecutionSchema = z.object({
  id: z.string(),
  playbook_id: z.string(),
  trigger_id: z.string().optional(),
  status: z.enum([
    'pending',
    'approved',
    'running',
    'paused',
    'completed',
    'failed',
    'cancelled',
    'rolled_back'
  ]).default('pending'),
  progress: z.number().min(0).max(1).default(0),
  current_step: z.string().optional(),
  step_results: z.record(z.object({
    status: z.enum(['pending', 'running', 'completed', 'failed', 'skipped']),
    start_time: z.date().optional(),
    end_time: z.date().optional(),
    duration_seconds: z.number().optional(),
    output: z.unknown().optional(),
    error: z.string().optional(),
    retry_count: z.number().default(0)
  })).default({}),
  context: z.record(z.unknown()).default({}),
  triggered_by: z.string(),
  approved_by: z.string().optional(),
  approved_at: z.date().optional(),
  started_at: z.date().optional(),
  completed_at: z.date().optional(),
  total_duration_seconds: z.number().optional(),
  safety_check_results: z.array(z.object({
    check_id: z.string(),
    passed: z.boolean(),
    message: z.string(),
    severity: z.string(),
    timestamp: z.date().default(() => new Date())
  })).default([]),
  rollback_actions: z.array(z.string()).default([])
});

const RemediationPlaybookSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string().default('1.0.0'),
  category: z.enum([
    'incident_response',
    'system_maintenance',
    'performance_optimization',
    'security_remediation',
    'data_recovery',
    'configuration_management',
    'custom'
  ]).default('incident_response'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  tags: z.array(z.string()).default([]),
  steps: z.array(PlaybookStepSchema),
  triggers: z.array(PlaybookTriggerSchema).default([]),
  safety_checks: z.array(PlaybookSafetyCheckSchema).default([]),
  rollback_plan: z.array(PlaybookStepSchema).default([]),
  estimated_duration_minutes: z.number().default(30),
  max_concurrent_executions: z.number().default(1),
  require_approval: z.boolean().default(true),
  approval_roles: z.array(z.string()).default(['admin', 'devops']),
  created_by: z.string(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  last_executed_at: z.date().optional(),
  execution_count: z.number().default(0),
  success_rate: z.number().min(0).max(1).default(0),
  average_execution_time_minutes: z.number().default(0),
  is_active: z.boolean().default(true),
  metadata: z.record(z.unknown()).default({})
});

// Types
export type PlaybookStep = z.infer<typeof PlaybookStepSchema>;
export type PlaybookTrigger = z.infer<typeof PlaybookTriggerSchema>;
export type PlaybookSafetyCheck = z.infer<typeof PlaybookSafetyCheckSchema>;
export type PlaybookExecution = z.infer<typeof PlaybookExecutionSchema>;
export type RemediationPlaybook = z.infer<typeof RemediationPlaybookSchema>;

export interface PlaybookExecutionContext {
  executionId: string;
  playbook: RemediationPlaybook;
  triggerData?: any;
  userId: string;
  tenantId: string;
  sessionId: string;
  variables: Record<string, unknown>;
}

export interface SafetyCheckResult {
  check: PlaybookSafetyCheck;
  passed: boolean;
  message: string;
  details?: any;
  suggestedActions?: string[];
}

export interface PlaybookMetrics {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_execution_time: number;
  success_rate: number;
  most_used_playbooks: Array<{ playbook_id: string; count: number; name: string }>;
  execution_trends: Array<{ date: string; count: number; success_rate: number }>;
  common_failure_points: Array<{ step_id: string; failure_count: number; error_pattern: string }>;
}

export class PlaybookService extends EventEmitter {
  private playbooks: Map<string, RemediationPlaybook> = new Map();
  private executions: Map<string, PlaybookExecution> = new Map();
  private activeExecutions: Map<string, PlaybookExecutionContext> = new Map();
  private approvalQueue: Map<string, PlaybookExecution> = new Map();

  // ===== PLAYBOOK MANAGEMENT =====

  /**
   * Create a new remediation playbook
   */
  async createPlaybook(playbookData: Omit<RemediationPlaybook, 'id' | 'created_at' | 'updated_at'>): Promise<RemediationPlaybook> {
    const playbook: RemediationPlaybook = {
      ...playbookData,
      id: this.generateId('playbook'),
      created_at: new Date(),
      updated_at: new Date()
    };

    // Validate playbook
    const validatedPlaybook = RemediationPlaybookSchema.parse(playbook);

    // Validate step dependencies
    this.validateStepDependencies(validatedPlaybook.steps);

    this.playbooks.set(validatedPlaybook.id, validatedPlaybook);
    this.emit('playbook:created', validatedPlaybook);

    return validatedPlaybook;
  }

  /**
   * Get playbook by ID
   */
  async getPlaybook(playbookId: string): Promise<RemediationPlaybook | null> {
    return this.playbooks.get(playbookId) || null;
  }

  /**
   * Update playbook
   */
  async updatePlaybook(playbookId: string, updates: Partial<RemediationPlaybook>): Promise<RemediationPlaybook | null> {
    const existingPlaybook = this.playbooks.get(playbookId);
    if (!existingPlaybook) {
      return null;
    }

    const updatedPlaybook: RemediationPlaybook = {
      ...existingPlaybook,
      ...updates,
      updated_at: new Date()
    };

    // Validate updated playbook
    const validatedPlaybook = RemediationPlaybookSchema.parse(updatedPlaybook);

    // Validate step dependencies if steps were updated
    if (updates.steps) {
      this.validateStepDependencies(validatedPlaybook.steps);
    }

    this.playbooks.set(playbookId, validatedPlaybook);
    this.emit('playbook:updated', validatedPlaybook);

    return validatedPlaybook;
  }

  /**
   * Delete playbook
   */
  async deletePlaybook(playbookId: string): Promise<boolean> {
    const deleted = this.playbooks.delete(playbookId);
    if (deleted) {
      this.emit('playbook:deleted', { playbookId });
    }
    return deleted;
  }

  /**
   * Get all playbooks with filtering
   */
  async getPlaybooks(filter?: {
    category?: string;
    tags?: string[];
    is_active?: boolean;
    created_by?: string;
  }): Promise<RemediationPlaybook[]> {
    let playbooks = Array.from(this.playbooks.values());

    if (filter) {
      if (filter.category) {
        playbooks = playbooks.filter(p => p.category === filter.category);
      }
      if (filter.tags && filter.tags.length > 0) {
        playbooks = playbooks.filter(p =>
          filter.tags!.some(tag => p.tags.includes(tag))
        );
      }
      if (filter.is_active !== undefined) {
        playbooks = playbooks.filter(p => p.is_active === filter.is_active);
      }
      if (filter.created_by) {
        playbooks = playbooks.filter(p => p.created_by === filter.created_by);
      }
    }

    return playbooks.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  // ===== PLAYBOOK EXECUTION =====

  /**
   * Execute a playbook
   */
  async executePlaybook(
    playbookId: string,
    triggerData?: any,
    userId: string = 'system',
    tenantId: string = 'default'
  ): Promise<PlaybookExecution> {
    const playbook = this.playbooks.get(playbookId);
    if (!playbook) {
      throw new Error(`Playbook ${playbookId} not found`);
    }

    if (!playbook.is_active) {
      throw new Error(`Playbook ${playbookId} is not active`);
    }

    const execution: PlaybookExecution = {
      id: this.generateId('execution'),
      playbook_id: playbookId,
      trigger_id: triggerData?.trigger_id,
      status: playbook.require_approval ? 'pending' : 'approved',
      progress: 0,
      step_results: {},
      context: triggerData || {},
      triggered_by: userId,
      safety_check_results: []
    };

    // Validate execution
    const validatedExecution = PlaybookExecutionSchema.parse(execution);

    this.executions.set(validatedExecution.id, validatedExecution);

    if (validatedExecution.status === 'pending') {
      this.approvalQueue.set(validatedExecution.id, validatedExecution);
      this.emit('execution:pending_approval', validatedExecution);
    } else {
      // Start execution immediately
      await this.startExecution(validatedExecution.id);
    }

    return validatedExecution;
  }

  /**
   * Approve playbook execution
   */
  async approveExecution(executionId: string, approverId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'pending') {
      return false;
    }

    execution.status = 'approved';
    execution.approved_by = approverId;
    execution.approved_at = new Date();

    this.executions.set(executionId, execution);
    this.approvalQueue.delete(executionId);

    this.emit('execution:approved', execution);

    // Start execution
    await this.startExecution(executionId);

    return true;
  }

  /**
   * Reject playbook execution
   */
  async rejectExecution(executionId: string, approverId: string, reason?: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'pending') {
      return false;
    }

    execution.status = 'cancelled';
    execution.approved_by = approverId;
    execution.approved_at = new Date();

    if (reason) {
      execution.context.rejection_reason = reason;
    }

    this.executions.set(executionId, execution);
    this.approvalQueue.delete(executionId);

    this.emit('execution:rejected', execution);

    return true;
  }

  /**
   * Start playbook execution
   */
  private async startExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const playbook = this.playbooks.get(execution.playbook_id);
    if (!playbook) return;

    // Create execution context
    const context: PlaybookExecutionContext = {
      executionId,
      playbook,
      triggerData: execution.context,
      userId: execution.triggered_by,
      tenantId: 'default', // Should be passed in
      sessionId: `session_${executionId}`,
      variables: { ...execution.context }
    };

    this.activeExecutions.set(executionId, context);

    execution.status = 'running';
    execution.started_at = new Date();
    this.executions.set(executionId, execution);

    this.emit('execution:started', execution);

    // Execute playbook steps
    try {
      await this.executePlaybookSteps(executionId, context);
    } catch (error) {
      console.error(`Playbook execution ${executionId} failed:`, error);
      await this.handleExecutionFailure(executionId, error);
    }
  }

  /**
   * Execute playbook steps
   */
  private async executePlaybookSteps(executionId: string, context: PlaybookExecutionContext): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const playbook = context.playbook;
    const completedSteps = new Set<string>();
    const pendingSteps = new Set(playbook.steps.map(s => s.id));

    while (pendingSteps.size > 0) {
      // Find steps that can be executed (all dependencies completed)
      const executableSteps = playbook.steps.filter(step =>
        pendingSteps.has(step.id) &&
        step.dependencies.every(dep => completedSteps.has(dep))
      );

      if (executableSteps.length === 0) {
        // Check for circular dependencies or blocked steps
        if (pendingSteps.size > 0) {
          throw new Error('Circular dependency or blocked steps detected');
        }
        break;
      }

      // Execute steps in parallel
      const stepPromises = executableSteps.map(step =>
        this.executeStep(step, context)
      );

      const stepResults = await Promise.allSettled(stepPromises);

      // Process results
      stepResults.forEach((result, index) => {
        const step = executableSteps[index];
        const stepResult = execution.step_results[step.id] || {
          status: 'pending',
          retry_count: 0
        };

        if (result.status === 'fulfilled') {
          stepResult.status = 'completed';
          stepResult.output = result.value;
        } else {
          stepResult.status = 'failed';
          stepResult.error = result.reason instanceof Error ? result.reason.message : 'Unknown error';

          // Handle retry logic
          if (stepResult.retry_count < step.retry_count) {
            stepResult.retry_count++;
            // Don't mark as completed yet - will retry
            return;
          }
        }

        stepResult.end_time = new Date();
        if (stepResult.start_time) {
          stepResult.duration_seconds = (stepResult.end_time.getTime() - stepResult.start_time.getTime()) / 1000;
        }

        execution.step_results[step.id] = stepResult;

        if (stepResult.status === 'completed') {
          completedSteps.add(step.id);
          pendingSteps.delete(step.id);
        } else if (stepResult.status === 'failed') {
          // Handle failure based on step configuration
          if (step.on_failure === 'rollback') {
            await this.rollbackExecution(executionId);
            return;
          } else if (step.on_failure === 'stop') {
            throw new Error(`Step ${step.id} failed: ${stepResult.error}`);
          }
          // For 'continue', just mark as failed but continue
          completedSteps.add(step.id);
          pendingSteps.delete(step.id);
        }
      });

      // Update progress
      const totalSteps = playbook.steps.length;
      const completedCount = completedSteps.size;
      execution.progress = completedCount / totalSteps;
      this.executions.set(executionId, execution);

      this.emit('execution:progress', { executionId, progress: execution.progress });
    }

    // Execution completed successfully
    execution.status = 'completed';
    execution.completed_at = new Date();
    execution.total_duration_seconds = execution.started_at ?
      (execution.completed_at.getTime() - execution.started_at.getTime()) / 1000 : 0;

    this.executions.set(executionId, execution);
    this.activeExecutions.delete(executionId);

    // Update playbook metrics
    await this.updatePlaybookMetrics(playbook.id, execution);

    this.emit('execution:completed', execution);
  }

  /**
   * Execute a single playbook step
   */
  private async executeStep(step: PlaybookStep, context: PlaybookExecutionContext): Promise<any> {
    const execution = this.executions.get(context.executionId);
    if (!execution) throw new Error('Execution not found');

    // Update step status
    const stepResult = execution.step_results[step.id] || {
      status: 'running',
      retry_count: 0
    };
    stepResult.start_time = new Date();
    execution.step_results[step.id] = stepResult;
    this.executions.set(context.executionId, execution);

    try {
      let result: any;

      // Execute based on step type
      switch (step.type) {
        case 'agent_action':
          result = await this.executeAgentAction(step, context);
          break;

        case 'api_call':
          result = await this.executeApiCall(step, context);
          break;

        case 'database_query':
          result = await this.executeDatabaseQuery(step, context);
          break;

        case 'file_operation':
          result = await this.executeFileOperation(step, context);
          break;

        case 'notification':
          result = await this.executeNotification(step, context);
          break;

        case 'approval_required':
          result = await this.executeApprovalRequired(step, context);
          break;

        case 'conditional_branch':
          result = await this.executeConditionalBranch(step, context);
          break;

        case 'manual_step':
          result = await this.executeManualStep(step, context);
          break;

        default:
          throw new Error(`Unsupported step type: ${step.type}`);
      }

      return result;

    } catch (error) {
      console.error(`Step ${step.id} execution failed:`, error);
      throw error;
    }
  }

  // ===== STEP EXECUTION METHODS =====

  private async executeAgentAction(step: PlaybookStep, context: PlaybookExecutionContext): Promise<any> {
    const config = step.config as {
      agent_id?: string;
      capability?: string;
      action: string;
      parameters: Record<string, unknown>;
    };

    let targetAgentId = config.agent_id;

    // Find agent by capability if not specified
    if (!targetAgentId && config.capability) {
      const agents = mcpProtocolService.discoverAgentsByCapability(config.capability);
      if (agents.length > 0) {
        targetAgentId = agents[0].id; // Use first available agent
      }
    }

    if (!targetAgentId) {
      throw new Error(`No suitable agent found for capability: ${config.capability}`);
    }

    // Send action to agent
    const message: Omit<MCPMessage, 'id' | 'timestamp'> = {
      type: 'request',
      method: 'execute_action',
      params: {
        action: config.action,
        parameters: { ...config.parameters, ...context.variables },
        execution_id: context.executionId,
        step_id: step.id
      }
    };

    await mcpProtocolService.sendMessage(targetAgentId, message);

    return { agent_id: targetAgentId, action: config.action };
  }

  private async executeApiCall(step: PlaybookStep, context: PlaybookExecutionContext): Promise<any> {
    const config = step.config as {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: any;
      timeout?: number;
    };

    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: config.body ? JSON.stringify(config.body) : undefined,
      signal: AbortSignal.timeout(config.timeout || 30000)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeDatabaseQuery(step: PlaybookStep, context: PlaybookExecutionContext): Promise<any> {
    // This would integrate with a database service
    // For now, return mock result
    const config = step.config as {
      query: string;
      parameters?: Record<string, unknown>;
    };

    console.log(`Executing database query: ${config.query}`, config.parameters);
    return { rows_affected: 1, success: true };
  }

  private async executeFileOperation(step: PlaybookStep, context: PlaybookExecutionContext): Promise<any> {
    // This would integrate with a file system service
    // For now, return mock result
    const config = step.config as {
      operation: 'read' | 'write' | 'delete' | 'move';
      path: string;
      content?: string;
      destination?: string;
    };

    console.log(`Executing file operation: ${config.operation} on ${config.path}`);
    return { operation: config.operation, path: config.path, success: true };
  }

  private async executeNotification(step: PlaybookStep, context: PlaybookExecutionContext): Promise<any> {
    const config = step.config as {
      type: 'email' | 'slack' | 'teams' | 'webhook';
      recipients: string[];
      subject?: string;
      message: string;
      template?: string;
    };

    // Send notification (integrate with notification service)
    console.log(`Sending ${config.type} notification to:`, config.recipients);
    console.log(`Message: ${config.message}`);

    return {
      type: config.type,
      recipients: config.recipients,
      sent_at: new Date().toISOString()
    };
  }

  private async executeApprovalRequired(step: PlaybookStep, context: PlaybookExecutionContext): Promise<any> {
    const config = step.config as {
      approvers: string[];
      message: string;
      timeout_minutes: number;
    };

    // Create approval request
    const approvalRequest = {
      execution_id: context.executionId,
      step_id: step.id,
      approvers: config.approvers,
      message: config.message,
      timeout_minutes: config.timeout_minutes,
      requested_at: new Date()
    };

    this.emit('step:approval_required', approvalRequest);

    // Wait for approval (in real implementation, this would be async)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Approval timeout'));
      }, config.timeout_minutes * 60 * 1000);

      // Listen for approval
      const handleApproval = (approved: boolean) => {
        clearTimeout(timeout);
        if (approved) {
          resolve({ approved: true, approved_at: new Date() });
        } else {
          reject(new Error('Approval denied'));
        }
      };

      // This would be replaced with actual approval mechanism
      setTimeout(() => handleApproval(true), 5000); // Auto-approve for demo
    });
  }

  private async executeConditionalBranch(step: PlaybookStep, context: PlaybookExecutionContext): Promise<any> {
    const config = step.config as {
      condition: string;
      true_step?: string;
      false_step?: string;
    };

    // Evaluate condition (simplified)
    const condition = this.evaluateCondition(config.condition, context.variables);

    return {
      condition: config.condition,
      result: condition,
      next_step: condition ? config.true_step : config.false_step
    };
  }

  private async executeManualStep(step: PlaybookStep, context: PlaybookExecutionContext): Promise<any> {
    const config = step.config as {
      instructions: string;
      assignee?: string;
      timeout_minutes: number;
    };

    // Create manual task
    const manualTask = {
      execution_id: context.executionId,
      step_id: step.id,
      instructions: config.instructions,
      assignee: config.assignee,
      created_at: new Date(),
      timeout_minutes: config.timeout_minutes
    };

    this.emit('step:manual_required', manualTask);

    // Wait for manual completion (in real implementation, this would be async)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ completed: true, completed_at: new Date() });
      }, 10000); // Simulate manual completion
    });
  }

  // ===== SAFETY AND VALIDATION =====

  /**
   * Run safety checks before playbook execution
   */
  async runSafetyChecks(playbook: RemediationPlaybook, context: Record<string, unknown>): Promise<SafetyCheckResult[]> {
    const results: SafetyCheckResult[] = [];

    for (const check of playbook.safety_checks) {
      if (!check.enabled) continue;

      try {
        const result = await this.executeSafetyCheck(check, context);
        results.push(result);
      } catch (error) {
        results.push({
          check,
          passed: false,
          message: `Safety check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        });
      }
    }

    return results;
  }

  private async executeSafetyCheck(check: PlaybookSafetyCheck, context: Record<string, unknown>): Promise<SafetyCheckResult> {
    switch (check.type) {
      case 'resource_limits':
        return this.checkResourceLimits(check, context);

      case 'time_window':
        return this.checkTimeWindow(check, context);

      case 'dependency_check':
        return this.checkDependencies(check, context);

      case 'impact_assessment':
        return this.checkImpactAssessment(check, context);

      case 'permission_check':
        return this.checkPermissions(check, context);

      default:
        return {
          check,
          passed: true,
          message: 'Check type not implemented'
        };
    }
  }

  private async checkResourceLimits(check: PlaybookSafetyCheck, context: Record<string, unknown>): Promise<SafetyCheckResult> {
    const config = check.config as {
      max_cpu_percent?: number;
      max_memory_percent?: number;
      max_disk_percent?: number;
      max_network_usage?: number;
    };

    // Mock resource checks
    const currentResources = {
      cpu_percent: 45,
      memory_percent: 60,
      disk_percent: 30,
      network_usage: 100
    };

    const violations: string[] = [];

    if (config.max_cpu_percent && currentResources.cpu_percent > config.max_cpu_percent) {
      violations.push(`CPU usage ${currentResources.cpu_percent}% exceeds limit ${config.max_cpu_percent}%`);
    }

    if (config.max_memory_percent && currentResources.memory_percent > config.max_memory_percent) {
      violations.push(`Memory usage ${currentResources.memory_percent}% exceeds limit ${config.max_memory_percent}%`);
    }

    return {
      check,
      passed: violations.length === 0,
      message: violations.length > 0 ? violations.join('; ') : 'Resource limits OK',
      details: { current: currentResources, limits: config, violations }
    };
  }

  private async checkTimeWindow(check: PlaybookSafetyCheck, context: Record<string, unknown>): Promise<SafetyCheckResult> {
    const config = check.config as {
      allowed_days?: number[];
      allowed_hours_start?: number;
      allowed_hours_end?: number;
      timezone?: string;
    };

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentHour = now.getHours();

    let allowed = true;
    let reason = '';

    if (config.allowed_days && !config.allowed_days.includes(currentDay)) {
      allowed = false;
      reason = `Current day (${currentDay}) not in allowed days: ${config.allowed_days.join(', ')}`;
    }

    if (config.allowed_hours_start !== undefined && config.allowed_hours_end !== undefined) {
      if (currentHour < config.allowed_hours_start || currentHour > config.allowed_hours_end) {
        allowed = false;
        reason = `Current hour (${currentHour}) not in allowed range: ${config.allowed_hours_start}-${config.allowed_hours_end}`;
      }
    }

    return {
      check,
      passed: allowed,
      message: allowed ? 'Time window check passed' : `Time window violation: ${reason}`,
      details: { current: { day: currentDay, hour: currentHour }, config }
    };
  }

  private async checkDependencies(check: PlaybookSafetyCheck, context: Record<string, unknown>): Promise<SafetyCheckResult> {
    const config = check.config as {
      required_services?: string[];
      required_components?: string[];
      health_checks?: Array<{ url: string; timeout: number }>;
    };

    const issues: string[] = [];

    // Check required services
    if (config.required_services) {
      for (const service of config.required_services) {
        // Mock service check
        if (service === 'database' && Math.random() < 0.1) { // 10% chance of failure for demo
          issues.push(`Service ${service} is not available`);
        }
      }
    }

    // Check health endpoints
    if (config.health_checks) {
      for (const healthCheck of config.health_checks) {
        try {
          const response = await fetch(healthCheck.url, {
            signal: AbortSignal.timeout(healthCheck.timeout || 5000)
          });
          if (!response.ok) {
            issues.push(`Health check failed for ${healthCheck.url}: ${response.status}`);
          }
        } catch (error) {
          issues.push(`Health check failed for ${healthCheck.url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return {
      check,
      passed: issues.length === 0,
      message: issues.length > 0 ? issues.join('; ') : 'Dependency check passed',
      details: { issues }
    };
  }

  private async checkImpactAssessment(check: PlaybookSafetyCheck, context: Record<string, unknown>): Promise<SafetyCheckResult> {
    const config = check.config as {
      max_affected_users?: number;
      max_service_downtime_minutes?: number;
      critical_components?: string[];
      risk_threshold?: 'low' | 'medium' | 'high' | 'critical';
    };

    // Mock impact assessment
    const assessedImpact = {
      affected_users: Math.floor(Math.random() * 1000),
      service_downtime_minutes: Math.floor(Math.random() * 60),
      affected_components: ['web_server', 'database'],
      risk_level: 'medium' as const
    };

    let passed = true;
    const issues: string[] = [];

    if (config.max_affected_users && assessedImpact.affected_users > config.max_affected_users) {
      passed = false;
      issues.push(`Affected users ${assessedImpact.affected_users} exceeds limit ${config.max_affected_users}`);
    }

    if (config.max_service_downtime_minutes && assessedImpact.service_downtime_minutes > config.max_service_downtime_minutes) {
      passed = false;
      issues.push(`Service downtime ${assessedImpact.service_downtime_minutes}min exceeds limit ${config.max_service_downtime_minutes}min`);
    }

    return {
      check,
      passed,
      message: passed ? 'Impact assessment passed' : issues.join('; '),
      details: { assessed: assessedImpact, limits: config },
      suggestedActions: passed ? undefined : [
        'Consider scheduling during maintenance window',
        'Implement gradual rollout',
        'Prepare rollback plan',
        'Notify stakeholders in advance'
      ]
    };
  }

  private async checkPermissions(check: PlaybookSafetyCheck, context: Record<string, unknown>): Promise<SafetyCheckResult> {
    const config = check.config as {
      required_permissions?: string[];
      required_roles?: string[];
      user_id?: string;
    };

    // Mock permission check
    const userPermissions = ['admin', 'devops', 'read', 'write'];
    const userRoles = ['admin', 'developer'];

    const missingPermissions: string[] = [];
    const missingRoles: string[] = [];

    if (config.required_permissions) {
      for (const permission of config.required_permissions) {
        if (!userPermissions.includes(permission)) {
          missingPermissions.push(permission);
        }
      }
    }

    if (config.required_roles) {
      for (const role of config.required_roles) {
        if (!userRoles.includes(role)) {
          missingRoles.push(role);
        }
      }
    }

    const passed = missingPermissions.length === 0 && missingRoles.length === 0;
    const issues = [
      ...missingPermissions.map(p => `Missing permission: ${p}`),
      ...missingRoles.map(r => `Missing role: ${r}`)
    ];

    return {
      check,
      passed,
      message: passed ? 'Permission check passed' : issues.join('; '),
      details: { user_permissions: userPermissions, user_roles: userRoles, required: config }
    };
  }

  // ===== UTILITY METHODS =====

  private validateStepDependencies(steps: PlaybookStep[]): void {
    const stepIds = new Set(steps.map(s => s.id));

    for (const step of steps) {
      for (const dep of step.dependencies) {
        if (!stepIds.has(dep)) {
          throw new Error(`Step ${step.id} depends on non-existent step ${dep}`);
        }

        // Check for circular dependencies
        if (this.hasCircularDependency(step.id, dep, steps)) {
          throw new Error(`Circular dependency detected involving steps ${step.id} and ${dep}`);
        }
      }
    }
  }

  private hasCircularDependency(currentId: string, targetId: string, steps: PlaybookStep[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkCycle = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) return true;
      if (visited.has(stepId)) return false;

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.find(s => s.id === stepId);
      if (step) {
        for (const dep of step.dependencies) {
          if (checkCycle(dep)) return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    return checkCycle(targetId);
  }

  private evaluateCondition(condition: string, variables: Record<string, unknown>): boolean {
    // Simple condition evaluation (in real implementation, use a proper expression evaluator)
    try {
      // Replace variables in condition
      let evaluatedCondition = condition;
      for (const [key, value] of Object.entries(variables)) {
        evaluatedCondition = evaluatedCondition.replace(new RegExp(`\\$${key}`, 'g'), String(value));
      }

      // Simple evaluation (very basic - in production, use a proper expression language)
      if (evaluatedCondition.includes('==')) {
        const [left, right] = evaluatedCondition.split('==').map(s => s.trim());
        return left === right;
      }

      if (evaluatedCondition.includes('>')) {
        const [left, right] = evaluatedCondition.split('>').map(s => s.trim());
        return Number(left) > Number(right);
      }

      if (evaluatedCondition.includes('<')) {
        const [left, right] = evaluatedCondition.split('<').map(s => s.trim());
        return Number(left) < Number(right);
      }

      return Boolean(variables[evaluatedCondition] || evaluatedCondition === 'true');
    } catch (error) {
      console.error('Condition evaluation failed:', error);
      return false;
    }
  }

  private async rollbackExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    const context = this.activeExecutions.get(executionId);

    if (!execution || !context) return;

    execution.status = 'rolled_back';
    execution.completed_at = new Date();

    // Execute rollback steps
    const playbook = context.playbook;
    for (const rollbackStep of playbook.rollback_plan) {
      try {
        await this.executeStep(rollbackStep, context);
        execution.rollback_actions.push(rollbackStep.id);
      } catch (error) {
        console.error(`Rollback step ${rollbackStep.id} failed:`, error);
      }
    }

    this.executions.set(executionId, execution);
    this.activeExecutions.delete(executionId);

    this.emit('execution:rolled_back', execution);
  }

  private async updatePlaybookMetrics(playbookId: string, execution: PlaybookExecution): Promise<void> {
    const playbook = this.playbooks.get(playbookId);
    if (!playbook) return;

    playbook.execution_count++;
    playbook.last_executed_at = execution.completed_at;

    if (execution.status === 'completed') {
      const successRate = (playbook.success_rate * (playbook.execution_count - 1) + 1) / playbook.execution_count;
      playbook.success_rate = successRate;

      if (execution.total_duration_seconds) {
        const avgTime = (playbook.average_execution_time_minutes * (playbook.execution_count - 1) +
                        execution.total_duration_seconds / 60) / playbook.execution_count;
        playbook.average_execution_time_minutes = avgTime;
      }
    }

    playbook.updated_at = new Date();
    this.playbooks.set(playbookId, playbook);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ===== PUBLIC API METHODS =====

  /**
   * Get execution by ID
   */
  async getExecution(executionId: string): Promise<PlaybookExecution | null> {
    return this.executions.get(executionId) || null;
  }

  /**
   * Get all executions with filtering
   */
  async getExecutions(filter?: {
    playbook_id?: string;
    status?: PlaybookExecution['status'];
    triggered_by?: string;
    date_from?: Date;
    date_to?: Date;
  }): Promise<PlaybookExecution[]> {
    let executions = Array.from(this.executions.values());

    if (filter) {
      if (filter.playbook_id) {
        executions = executions.filter(e => e.playbook_id === filter.playbook_id);
      }
      if (filter.status) {
        executions = executions.filter(e => e.status === filter.status);
      }
      if (filter.triggered_by) {
        executions = executions.filter(e => e.triggered_by === filter.triggered_by);
      }
      if (filter.date_from) {
        executions = executions.filter(e => e.created_at >= filter.date_from!);
      }
      if (filter.date_to) {
        executions = executions.filter(e => e.created_at <= filter.date_to!);
      }
    }

    return executions.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(userId?: string): Promise<PlaybookExecution[]> {
    const pending = Array.from(this.approvalQueue.values());

    if (userId) {
      // Filter by user's approval permissions
      return pending.filter(execution => {
        const playbook = this.playbooks.get(execution.playbook_id);
        return playbook && playbook.approval_roles.some(role =>
          // Mock role check - in real implementation, check user's roles
          role === 'admin' || role === 'devops'
        );
      });
    }

    return pending;
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution || !['pending', 'running'].includes(execution.status)) {
      return false;
    }

    execution.status = 'cancelled';
    execution.completed_at = new Date();
    this.executions.set(executionId, execution);

    if (this.activeExecutions.has(executionId)) {
      this.activeExecutions.delete(executionId);
    }

    this.emit('execution:cancelled', execution);
    return true;
  }

  /**
   * Get playbook metrics
   */
  async getPlaybookMetrics(): Promise<PlaybookMetrics> {
    const executions = Array.from(this.executions.values());
    const playbooks = Array.from(this.playbooks.values());

    const total = executions.length;
    const successful = executions.filter(e => e.status === 'completed').length;
    const failed = executions.filter(e => e.status === 'failed').length;

    const avgExecutionTime = executions
      .filter(e => e.total_duration_seconds)
      .reduce((sum, e) => sum + e.total_duration_seconds!, 0) / executions.length || 0;

    // Calculate most used playbooks
    const playbookUsage = new Map<string, number>();
    for (const execution of executions) {
      playbookUsage.set(execution.playbook_id, (playbookUsage.get(execution.playbook_id) || 0) + 1);
    }

    const mostUsed = Array.from(playbookUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([playbookId, count]) => {
        const playbook = this.playbooks.get(playbookId);
        return {
          playbook_id: playbookId,
          count,
          name: playbook?.name || 'Unknown'
        };
      });

    return {
      total_executions: total,
      successful_executions: successful,
      failed_executions: failed,
      average_execution_time: avgExecutionTime,
      success_rate: total > 0 ? successful / total : 0,
      most_used_playbooks: mostUsed,
      execution_trends: [], // Would be populated with historical data
      common_failure_points: [] // Would be populated with failure analysis
    };
  }

  /**
   * Create template playbook for common scenarios
   */
  async createTemplatePlaybook(scenario: string): Promise<RemediationPlaybook> {
    let template: Omit<RemediationPlaybook, 'id' | 'created_at' | 'updated_at'>;

    switch (scenario) {
      case 'database_connection_issue':
        template = {
          name: 'Database Connection Remediation',
          description: 'Automated remediation for database connection issues',
          category: 'incident_response',
          priority: 'high',
          tags: ['database', 'connection', 'remediation'],
          steps: [
            {
              id: 'check_db_health',
              name: 'Check Database Health',
              description: 'Verify database server status and connectivity',
              type: 'agent_action',
              config: {
                capability: 'database_monitoring',
                action: 'check_health',
                parameters: {}
              },
              dependencies: [],
              timeout_seconds: 30
            },
            {
              id: 'restart_connection_pool',
              name: 'Restart Connection Pool',
              description: 'Restart the database connection pool',
              type: 'agent_action',
              config: {
                capability: 'database_admin',
                action: 'restart_pool',
                parameters: {}
              },
              dependencies: ['check_db_health'],
              timeout_seconds: 60
            },
            {
              id: 'verify_connectivity',
              name: 'Verify Connectivity',
              description: 'Test database connectivity after remediation',
              type: 'agent_action',
              config: {
                capability: 'database_monitoring',
                action: 'test_connection',
                parameters: {}
              },
              dependencies: ['restart_connection_pool'],
              timeout_seconds: 30
            }
          ],
          triggers: [{
            type: 'triage_result',
            conditions: {
              routing_decision: 'database_issue',
              severity: 'high'
            },
            priority: 4,
            auto_execute: false,
            require_approval: true
          }],
          safety_checks: [
            {
              id: 'business_hours_check',
              name: 'Business Hours Check',
              description: 'Ensure remediation is performed during business hours',
              type: 'time_window',
              config: {
                allowed_days: [1, 2, 3, 4, 5], // Monday to Friday
                allowed_hours_start: 9,
                allowed_hours_end: 17
              },
              severity: 'medium',
              fail_action: 'warn'
            }
          ],
          estimated_duration_minutes: 15,
          require_approval: true,
          approval_roles: ['admin', 'dba'],
          created_by: 'system',
          is_active: true,
          metadata: {
            template: true,
            scenario: 'database_connection_issue',
            version: '1.0'
          }
        };
        break;

      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }

    return await this.createPlaybook(template);
  }
}

// Export singleton instance
export const playbookService = new PlaybookService();
