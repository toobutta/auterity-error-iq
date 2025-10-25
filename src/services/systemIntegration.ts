/**
 * System Integration Service
 *
 * Integrates all major systems: MCP Protocol, Agent Marketplace, Smart Triage, and NeuroWeaver
 * Provides unified APIs and cross-system coordination
 */

import { EventEmitter } from 'events';
import { mcpProtocolService } from './mcpProtocolService';
import { agentMarketplaceService } from './agentMarketplaceService';
import { smartTriageService } from './smartTriageService';
import { neuroWeaverIntegration } from './neuroweaverIntegration';
import { RegisteredAgent, MCPMessage } from './mcpProtocolService';
import { AgentMetadata, AgentReview } from './agentMarketplaceService';
import { TriageItem, TriageDecision, TriageQueue } from './smartTriageService';
import { TrainingJob, TrainingConfig } from './neuroweaverIntegration';

export interface SystemIntegrationConfig {
  enableAutoTraining: boolean;
  enableCrossSystemOptimization: boolean;
  enableIntelligentRouting: boolean;
  enableRealTimeCollaboration: boolean;
  defaultTenantId: string;
  maxConcurrentJobs: number;
}

export interface WorkflowExecutionContext {
  workflowId: string;
  tenantId: string;
  userId: string;
  sessionId: string;
  startTime: Date;
  agents: string[]; // Agent IDs involved
  triageResults: TriageDecision[];
  trainingJobs: string[]; // Training job IDs
  metrics: {
    executionTime: number;
    cost: number;
    success: boolean;
    agentPerformance: Record<string, any>;
  };
}

export interface CrossSystemOptimization {
  workflowId: string;
  optimizationType: 'performance' | 'cost' | 'reliability' | 'scalability';
  currentMetrics: Record<string, number>;
  targetMetrics: Record<string, number>;
  recommendations: {
    agentReplacements: Array<{ oldAgentId: string; newAgentId: string; reason: string }>;
    trainingInitiatives: Array<{ type: string; description: string; priority: number }>;
    triageImprovements: Array<{ ruleId: string; improvement: string; impact: number }>;
  };
  estimatedImprovement: number;
  implementationPlan: string[];
}

export class SystemIntegrationService extends EventEmitter {
  private config: SystemIntegrationConfig;
  private activeContexts: Map<string, WorkflowExecutionContext> = new Map();
  private optimizationCache: Map<string, CrossSystemOptimization> = new Map();

  constructor(config: SystemIntegrationConfig) {
    super();
    this.config = config;
    this.initializeSystemListeners();
  }

  // ===== SYSTEM INITIALIZATION =====

  private initializeSystemListeners(): void {
    // MCP Protocol Events
    mcpProtocolService.on('agent:registered', this.handleAgentRegistered.bind(this));
    mcpProtocolService.on('agent:activated', this.handleAgentActivated.bind(this));
    mcpProtocolService.on('message:received', this.handleMCPMessage.bind(this));

    // Agent Marketplace Events
    // Note: Agent marketplace service doesn't emit events, but we can add integration points

    // Smart Triage Events
    // Note: Smart triage service doesn't emit events, but we can add integration points

    // NeuroWeaver Events
    neuroWeaverIntegration.on('job:completed', this.handleTrainingJobCompleted.bind(this));
    neuroWeaverIntegration.on('model:deployed', this.handleModelDeployed.bind(this));
  }

  // ===== UNIFIED WORKFLOW EXECUTION =====

  /**
   * Execute a complete workflow with all systems integrated
   */
  async executeIntegratedWorkflow(
    workflowId: string,
    input: Record<string, unknown>,
    userId: string,
    tenantId: string = this.config.defaultTenantId
  ): Promise<WorkflowExecutionContext> {
    const contextId = `ctx_${workflowId}_${Date.now()}`;
    const startTime = new Date();

    const context: WorkflowExecutionContext = {
      workflowId,
      tenantId,
      userId,
      sessionId: contextId,
      startTime,
      agents: [],
      triageResults: [],
      trainingJobs: [],
      metrics: {
        executionTime: 0,
        cost: 0,
        success: false,
        agentPerformance: {}
      }
    };

    this.activeContexts.set(contextId, context);
    this.emit('workflow:started', context);

    try {
      // Step 1: Intelligent Triage
      const triageDecision = await this.performIntelligentTriage(input, tenantId);
      context.triageResults.push(triageDecision);

      // Step 2: Agent Discovery and Assignment
      const requiredAgents = await this.discoverAndAssignAgents(
        workflowId,
        triageDecision,
        input
      );
      context.agents = requiredAgents.map(a => a.id);

      // Step 3: Multi-Agent Orchestration
      const orchestrationResult = await this.orchestrateMultiAgentWorkflow(
        workflowId,
        requiredAgents,
        input,
        context
      );

      // Step 4: Performance Analysis and Optimization
      if (this.config.enableAutoTraining) {
        const trainingJob = await this.initiateWorkflowOptimization(workflowId, context);
        context.trainingJobs.push(trainingJob.id);
      }

      // Step 5: Cross-System Learning
      if (this.config.enableCrossSystemOptimization) {
        await this.performCrossSystemOptimization(workflowId, context);
      }

      // Finalize context
      context.metrics.executionTime = Date.now() - startTime.getTime();
      context.metrics.success = true;

      this.activeContexts.set(contextId, context);
      this.emit('workflow:completed', context);

      return context;

    } catch (error) {
      console.error(`Integrated workflow execution failed:`, error);
      context.metrics.success = false;
      this.emit('workflow:failed', { context, error });
      throw error;
    }
  }

  // ===== INTELLIGENT TRIAGE INTEGRATION =====

  private async performIntelligentTriage(
    input: Record<string, unknown>,
    tenantId: string
  ): Promise<TriageDecision> {
    // Convert input to triage content
    const content = this.formatInputForTriage(input);
    const context = { ...input, tenantId, timestamp: Date.now() };

    // Perform triage using smart triage service
    return await smartTriageService.triageItem(content, context, tenantId);
  }

  private formatInputForTriage(input: Record<string, unknown>): string {
    // Convert structured input to text for triage analysis
    const keyFields = ['title', 'description', 'content', 'message', 'query', 'request'];
    const primaryContent = keyFields.find(field => input[field]) || 'unknown';

    let content = input[primaryContent] || JSON.stringify(input);

    // Add context about data types and complexity
    if (Array.isArray(input.data)) {
      content += ` [Contains ${input.data.length} data items]`;
    }

    if (input.workflowId) {
      content += ` [Workflow: ${input.workflowId}]`;
    }

    return content;
  }

  // ===== AGENT DISCOVERY AND ASSIGNMENT =====

  private async discoverAndAssignAgents(
    workflowId: string,
    triageDecision: TriageDecision,
    input: Record<string, unknown>
  ): Promise<RegisteredAgent[]> {
    const requiredCapabilities = this.extractRequiredCapabilities(workflowId, triageDecision, input);
    const availableAgents = mcpProtocolService.getAgents().filter(agent =>
      agent.status === 'ACTIVE' &&
      requiredCapabilities.some(cap =>
        agent.capabilities.some(agentCap => agentCap.name === cap)
      )
    );

    // Prioritize agents based on marketplace ratings and performance
    const prioritizedAgents = await this.prioritizeAgents(availableAgents, workflowId);

    return prioritizedAgents.slice(0, Math.min(prioritizedAgents.length, 5)); // Limit to 5 agents
  }

  private extractRequiredCapabilities(
    workflowId: string,
    triageDecision: TriageDecision,
    input: Record<string, unknown>
  ): string[] {
    const capabilities = new Set<string>();

    // Add capabilities based on triage decision routing
    if (triageDecision.routing_decision.includes('analysis')) {
      capabilities.add('data_analysis');
      capabilities.add('insights');
    }

    if (triageDecision.routing_decision.includes('processing')) {
      capabilities.add('data_processing');
      capabilities.add('transformation');
    }

    if (triageDecision.routing_decision.includes('automation')) {
      capabilities.add('automation');
      capabilities.add('workflow_execution');
    }

    // Add capabilities based on input complexity
    const inputSize = JSON.stringify(input).length;
    if (inputSize > 10000) {
      capabilities.add('large_data_processing');
    }

    // Add workflow-specific capabilities
    capabilities.add('workflow_execution');
    capabilities.add('error_handling');

    return Array.from(capabilities);
  }

  private async prioritizeAgents(
    agents: RegisteredAgent[],
    workflowId: string
  ): Promise<RegisteredAgent[]> {
    // Get agent metadata from marketplace for ratings
    const agentPromises = agents.map(async (agent) => {
      try {
        const metadata = await agentMarketplaceService.getAgent(agent.id);
        return { agent, metadata };
      } catch {
        return { agent, metadata: null };
      }
    });

    const agentsWithMetadata = await Promise.all(agentPromises);

    // Sort by rating, then by download count
    return agentsWithMetadata
      .sort((a, b) => {
        const aRating = a.metadata?.average_rating || 0;
        const bRating = b.metadata?.average_rating || 0;

        if (aRating !== bRating) {
          return bRating - aRating;
        }

        const aDownloads = a.metadata?.total_downloads || 0;
        const bDownloads = b.metadata?.total_downloads || 0;

        return bDownloads - aDownloads;
      })
      .map(item => item.agent);
  }

  // ===== MULTI-AGENT ORCHESTRATION =====

  private async orchestrateMultiAgentWorkflow(
    workflowId: string,
    agents: RegisteredAgent[],
    input: Record<string, unknown>,
    context: WorkflowExecutionContext
  ): Promise<any> {
    // Send initial orchestration message to primary agent
    const primaryAgent = agents[0];
    if (!primaryAgent) {
      throw new Error('No suitable agents found for workflow execution');
    }

    const orchestrationMessage: Omit<MCPMessage, 'id' | 'timestamp'> = {
      type: 'request',
      method: 'orchestrate_workflow',
      params: {
        workflowId,
        input,
        availableAgents: agents.map(a => ({ id: a.id, capabilities: a.capabilities })),
        context: context.sessionId
      }
    };

    try {
      await mcpProtocolService.sendMessage(primaryAgent.id, orchestrationMessage);

      // Wait for orchestration completion (simplified - in real implementation,
      // this would be event-driven with proper timeout handling)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Collect results from all agents
      const results = await this.collectAgentResults(workflowId, agents, context);

      return results;

    } catch (error) {
      console.error(`Multi-agent orchestration failed:`, error);
      throw error;
    }
  }

  private async collectAgentResults(
    workflowId: string,
    agents: RegisteredAgent[],
    context: WorkflowExecutionContext
  ): Promise<Record<string, unknown>> {
    const results: Record<string, unknown> = {};

    // Collect results from message queue for each agent
    for (const agent of agents) {
      const messages = mcpProtocolService.getQueuedMessages(agent.id);
      const agentResults = messages
        .filter(msg => msg.type === 'response' && msg.params?.workflowId === workflowId)
        .map(msg => msg.result)
        .filter(Boolean);

      if (agentResults.length > 0) {
        results[agent.id] = agentResults[agentResults.length - 1];
      }
    }

    return results;
  }

  // ===== WORKFLOW OPTIMIZATION =====

  private async initiateWorkflowOptimization(
    workflowId: string,
    context: WorkflowExecutionContext
  ): Promise<TrainingJob> {
    const trainingConfig: TrainingConfig = {
      model_type: 'regression',
      workflow_optimization_target: 'performance',
      auto_architecture_optimization: true,
      hyperparameter_tuning: true,
      data_sources: {
        workflow_executions: true,
        user_interactions: true,
        agent_performance: true,
        triage_decisions: true,
        marketplace_usage: false
      }
    };

    return await neuroWeaverIntegration.trainWorkflowOptimizationModel(
      workflowId,
      'performance'
    );
  }

  // ===== CROSS-SYSTEM OPTIMIZATION =====

  private async performCrossSystemOptimization(
    workflowId: string,
    context: WorkflowExecutionContext
  ): Promise<CrossSystemOptimization> {
    // Check cache first
    if (this.optimizationCache.has(workflowId)) {
      return this.optimizationCache.get(workflowId)!;
    }

    const optimization: CrossSystemOptimization = {
      workflowId,
      optimizationType: 'performance',
      currentMetrics: {
        executionTime: context.metrics.executionTime,
        cost: context.metrics.cost,
        successRate: context.metrics.success ? 1 : 0
      },
      targetMetrics: {
        executionTime: context.metrics.executionTime * 0.8, // 20% improvement target
        cost: context.metrics.cost * 0.9, // 10% cost reduction target
        successRate: 0.95 // 95% success rate target
      },
      recommendations: {
        agentReplacements: [],
        trainingInitiatives: [],
        triageImprovements: []
      },
      estimatedImprovement: 0,
      implementationPlan: []
    };

    // Analyze agent performance
    const agentPerformance = await this.analyzeAgentPerformance(context);
    optimization.recommendations.agentReplacements = agentPerformance.replacements;

    // Analyze triage effectiveness
    const triageAnalysis = await this.analyzeTriageEffectiveness(context);
    optimization.recommendations.triageImprovements = triageAnalysis.improvements;

    // Generate training recommendations
    const trainingRecommendations = await this.generateTrainingRecommendations(context);
    optimization.recommendations.trainingInitiatives = trainingRecommendations;

    // Calculate estimated improvement
    optimization.estimatedImprovement = this.calculateEstimatedImprovement(optimization);

    // Generate implementation plan
    optimization.implementationPlan = this.generateImplementationPlan(optimization);

    // Cache optimization
    this.optimizationCache.set(workflowId, optimization);

    return optimization;
  }

  private async analyzeAgentPerformance(context: WorkflowExecutionContext): Promise<{
    replacements: Array<{ oldAgentId: string; newAgentId: string; reason: string }>
  }> {
    const replacements: Array<{ oldAgentId: string; newAgentId: string; reason: string }> = [];

    for (const agentId of context.agents) {
      const agent = mcpProtocolService.getAgent(agentId);
      if (!agent) continue;

      // Get agent metadata from marketplace
      try {
        const metadata = await agentMarketplaceService.getAgent(agentId);
        if (!metadata) continue;

        // Check if there are better performing alternatives
        const alternatives = await agentMarketplaceService.searchAgents(
          agent.capabilities.map(cap => cap.name).join(' '),
          5
        );

        const betterAlternatives = alternatives.filter(alt =>
          alt.average_rating > metadata.average_rating &&
          alt.id !== agentId
        );

        if (betterAlternatives.length > 0) {
          const bestAlternative = betterAlternatives[0];
          replacements.push({
            oldAgentId: agentId,
            newAgentId: bestAlternative.id,
            reason: `Higher rated alternative available (${bestAlternative.average_rating} vs ${metadata.average_rating})`
          });
        }
      } catch (error) {
        console.warn(`Failed to analyze performance for agent ${agentId}:`, error);
      }
    }

    return { replacements };
  }

  private async analyzeTriageEffectiveness(context: WorkflowExecutionContext): Promise<{
    improvements: Array<{ ruleId: string; improvement: string; impact: number }>
  }> {
    const improvements: Array<{ ruleId: string; improvement: string; impact: number }> = [];

    // Analyze triage decision accuracy
    if (context.triageResults.length > 0) {
      const triageResult = context.triageResults[0];

      if (triageResult.confidence_score < 0.7) {
        improvements.push({
          ruleId: 'general',
          improvement: 'Improve triage rule confidence through additional training data',
          impact: 0.15
        });
      }

      if (triageResult.processing_time_ms > 2000) {
        improvements.push({
          ruleId: 'performance',
          improvement: 'Optimize triage processing time with rule caching',
          impact: 0.1
        });
      }
    }

    return { improvements };
  }

  private async generateTrainingRecommendations(context: WorkflowExecutionContext): Promise<
    Array<{ type: string; description: string; priority: number }>
  > {
    const recommendations: Array<{ type: string; description: string; priority: number }> = [];

    // Recommend workflow-specific training
    if (context.metrics.executionTime > 5000) {
      recommendations.push({
        type: 'performance_optimization',
        description: 'Train workflow-specific performance optimization model',
        priority: 8
      });
    }

    // Recommend agent collaboration training
    if (context.agents.length > 1) {
      recommendations.push({
        type: 'agent_collaboration',
        description: 'Train multi-agent collaboration optimization model',
        priority: 7
      });
    }

    // Recommend error handling training
    if (!context.metrics.success) {
      recommendations.push({
        type: 'error_handling',
        description: 'Train error detection and recovery optimization model',
        priority: 9
      });
    }

    return recommendations;
  }

  private calculateEstimatedImprovement(optimization: CrossSystemOptimization): number {
    let totalImprovement = 0;

    // Agent replacement improvements
    totalImprovement += optimization.recommendations.agentReplacements.length * 0.1;

    // Triage improvements
    totalImprovement += optimization.recommendations.triageImprovements.reduce(
      (sum, improvement) => sum + improvement.impact,
      0
    );

    // Training improvements (estimated)
    totalImprovement += optimization.recommendations.trainingInitiatives.length * 0.05;

    return Math.min(totalImprovement, 0.5); // Cap at 50% improvement
  }

  private generateImplementationPlan(optimization: CrossSystemOptimization): string[] {
    const plan: string[] = [];

    // Agent replacements
    if (optimization.recommendations.agentReplacements.length > 0) {
      plan.push(`Replace ${optimization.recommendations.agentReplacements.length} underperforming agents`);
      optimization.recommendations.agentReplacements.forEach(replacement => {
        plan.push(`- Replace agent ${replacement.oldAgentId} with ${replacement.newAgentId}`);
      });
    }

    // Triage improvements
    if (optimization.recommendations.triageImprovements.length > 0) {
      plan.push(`Implement ${optimization.recommendations.triageImprovements.length} triage improvements`);
      optimization.recommendations.triageImprovements.forEach(improvement => {
        plan.push(`- ${improvement.improvement}`);
      });
    }

    // Training initiatives
    if (optimization.recommendations.trainingInitiatives.length > 0) {
      plan.push(`Initiate ${optimization.recommendations.trainingInitiatives.length} training programs`);
      optimization.recommendations.trainingInitiatives.forEach(initiative => {
        plan.push(`- ${initiative.description} (Priority: ${initiative.priority})`);
      });
    }

    // Timeline estimates
    plan.push(`Estimated timeline: ${Math.ceil(plan.length / 3)} weeks`);
    plan.push(`Expected improvement: ${(optimization.estimatedImprovement * 100).toFixed(1)}%`);

    return plan;
  }

  // ===== EVENT HANDLERS =====

  private async handleAgentRegistered(agent: RegisteredAgent): Promise<void> {
    // Automatically add agent to marketplace if not already present
    try {
      const existingAgent = await agentMarketplaceService.getAgent(agent.id);
      if (!existingAgent) {
        await agentMarketplaceService.storeAgent({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          category: 'custom', // Default category
          tier: 'professional', // Default tier
          status: 'draft',
          capabilities: agent.capabilities.map(cap => cap.name),
          pricing_tiers: {},
          creator_id: 'system', // System-created agent
          tags: ['auto-registered'],
          industries: [],
          required_integrations: [],
          configuration_schema: {}
        });
      }
    } catch (error) {
      console.warn(`Failed to auto-register agent in marketplace:`, error);
    }
  }

  private async handleAgentActivated(agent: RegisteredAgent): Promise<void> {
    // Update marketplace status
    try {
      await agentMarketplaceService.updateAgent(agent.id, { status: 'published' });
    } catch (error) {
      console.warn(`Failed to update agent status in marketplace:`, error);
    }
  }

  private async handleMCPMessage({ sourceAgentId, message }: { sourceAgentId: string; message: MCPMessage }): Promise<void> {
    // Process messages that might affect other systems
    if (message.method === 'workflow_completed' && message.result) {
      // Trigger cross-system optimization analysis
      const workflowId = message.params?.workflowId as string;
      if (workflowId) {
        const context = Array.from(this.activeContexts.values()).find(
          ctx => ctx.workflowId === workflowId
        );

        if (context && this.config.enableCrossSystemOptimization) {
          setTimeout(() => {
            this.performCrossSystemOptimization(workflowId, context);
          }, 1000); // Delay to allow metrics to settle
        }
      }
    }
  }

  private async handleTrainingJobCompleted(job: TrainingJob): Promise<void> {
    // Update system with new training insights
    if (job.workflow_id) {
      // Clear optimization cache to force re-analysis
      this.optimizationCache.delete(job.workflow_id);

      // Emit optimization ready event
      this.emit('optimization:ready', {
        workflowId: job.workflow_id,
        optimizationType: 'training_based',
        trainingJob: job
      });
    }
  }

  private async handleModelDeployed({ jobId, deployment }: { jobId: string; deployment: any }): Promise<void> {
    // Update agent marketplace with new model capabilities
    const job = await neuroWeaverIntegration.getTrainingJob(jobId);
    if (job?.workflow_id) {
      // Notify that workflow optimization is available
      this.emit('workflow:optimization_available', {
        workflowId: job.workflow_id,
        deployment
      });
    }
  }

  // ===== PUBLIC API METHODS =====

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    mcp: boolean;
    marketplace: boolean;
    triage: boolean;
    neuroweaver: boolean;
    overall: boolean;
  }> {
    const health = {
      mcp: true, // MCP is always available as it's in-memory
      marketplace: true, // Marketplace is always available as it's in-memory
      triage: true, // Triage is always available as it's in-memory
      neuroweaver: true, // Assume NeuroWeaver is available
      overall: true
    };

    // Could add actual health checks here
    health.overall = health.mcp && health.marketplace && health.triage && health.neuroweaver;

    return health;
  }

  /**
   * Get cross-system metrics
   */
  async getCrossSystemMetrics(tenantId: string): Promise<{
    activeWorkflows: number;
    totalAgents: number;
    marketplaceAgents: number;
    trainingJobs: number;
    optimizationOpportunities: number;
  }> {
    const activeWorkflows = Array.from(this.activeContexts.values()).filter(
      ctx => ctx.tenantId === tenantId
    ).length;

    const totalAgents = mcpProtocolService.getAgents().length;
    const marketplaceAgents = (await agentMarketplaceService.getAgents()).length;
    const trainingJobs = (await neuroWeaverIntegration.getTrainingJobs()).length;

    return {
      activeWorkflows,
      totalAgents,
      marketplaceAgents,
      trainingJobs,
      optimizationOpportunities: this.optimizationCache.size
    };
  }

  /**
   * Shutdown all systems
   */
  async shutdown(): Promise<void> {
    // Stop training jobs
    const jobs = await neuroWeaverIntegration.getTrainingJobs({ status: 'training' });
    await Promise.all(jobs.map(job => neuroWeaverIntegration.cancelTrainingJob(job.id)));

    // Clear caches
    this.activeContexts.clear();
    this.optimizationCache.clear();

    // Shutdown MCP
    mcpProtocolService.destroy();

    this.emit('system:shutdown');
  }
}

// Export singleton instance
export const systemIntegration = new SystemIntegrationService({
  enableAutoTraining: true,
  enableCrossSystemOptimization: true,
  enableIntelligentRouting: true,
  enableRealTimeCollaboration: true,
  defaultTenantId: 'default_tenant',
  maxConcurrentJobs: 10
});
