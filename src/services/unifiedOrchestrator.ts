/**
 * Unified Orchestrator Service
 *
 * Central coordination system that integrates all major components:
 * - MCP Protocol (multi-agent orchestration)
 * - Agent Marketplace (agent management)
 * - Smart Triage (intelligent routing)
 * - NeuroWeaver (ML training)
 * - Multimodal Triage (voice/screenshot/log analysis)
 * - Playbook Service (automated remediation)
 */

import { EventEmitter } from 'events';
import { systemIntegration } from './systemIntegration';
import { mcpProtocolService } from './mcpProtocolService';
import { agentMarketplaceService } from './agentMarketplaceService';
import { smartTriageService } from './smartTriageService';
import { neuroWeaverIntegration } from './neuroweaverIntegration';
import { multimodalTriageService } from './multimodalTriageService';
import { playbookService } from './playbookService';
import {
  WorkflowExecutionContext,
  CrossSystemOptimization
} from './systemIntegration';

export interface UnifiedWorkflowRequest {
  id: string;
  type: 'manual' | 'triage' | 'multimodal' | 'scheduled' | 'api';
  input: Record<string, unknown>;
  context: Record<string, unknown>;
  userId: string;
  tenantId: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  requirements?: {
    agents?: string[];
    capabilities?: string[];
    maxExecutionTime?: number;
    approvalRequired?: boolean;
  };
}

export interface OrchestrationResult {
  workflowId: string;
  status: 'success' | 'partial_success' | 'failed';
  execution: WorkflowExecutionContext;
  multimodalAnalysis?: any;
  triageResult?: any;
  agentAssignments: Array<{
    agentId: string;
    capabilities: string[];
    assignedTasks: string[];
  }>;
  playbookExecutions: string[];
  optimizations: CrossSystemOptimization[];
  metrics: {
    totalProcessingTime: number;
    agentUtilization: Record<string, number>;
    costSavings: number;
    automationRate: number;
  };
  recommendations: Array<{
    type: 'optimization' | 'training' | 'agent_replacement' | 'playbook_creation';
    description: string;
    impact: number;
    implementation: string[];
  }>;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    mcp: 'healthy' | 'degraded' | 'unhealthy';
    marketplace: 'healthy' | 'degraded' | 'unhealthy';
    triage: 'healthy' | 'degraded' | 'unhealthy';
    neuroweaver: 'healthy' | 'degraded' | 'unhealthy';
    multimodal: 'healthy' | 'degraded' | 'unhealthy';
    playbooks: 'healthy' | 'degraded' | 'unhealthy';
  };
  metrics: {
    activeWorkflows: number;
    queuedRequests: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

export class UnifiedOrchestratorService extends EventEmitter {
  private activeWorkflows: Map<string, UnifiedWorkflowRequest> = new Map();
  private requestQueue: UnifiedWorkflowRequest[] = [];
  private isProcessing = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeEventListeners();
    this.startHealthMonitoring();
  }

  // ===== UNIFIED WORKFLOW ORCHESTRATION =====

  /**
   * Process a unified workflow request through all integrated systems
   */
  async processUnifiedRequest(request: Omit<UnifiedWorkflowRequest, 'id'>): Promise<OrchestrationResult> {
    const unifiedRequest: UnifiedWorkflowRequest = {
      ...request,
      id: this.generateId('workflow')
    };

    this.activeWorkflows.set(unifiedRequest.id, unifiedRequest);
    this.emit('workflow:started', unifiedRequest);

    const startTime = Date.now();
    let result: OrchestrationResult;

    try {
      // Step 1: Multimodal Analysis (if applicable)
      const multimodalAnalysis = await this.performMultimodalAnalysis(unifiedRequest);

      // Step 2: Intelligent Triage
      const triageResult = await this.performIntelligentTriage(unifiedRequest, multimodalAnalysis);

      // Step 3: Agent Discovery and Marketplace Integration
      const agentAssignments = await this.discoverAndAssignAgents(unifiedRequest, triageResult);

      // Step 4: Execute Integrated Workflow
      const execution = await systemIntegration.executeIntegratedWorkflow(
        unifiedRequest.id,
        unifiedRequest.input,
        unifiedRequest.userId,
        unifiedRequest.tenantId
      );

      // Step 5: Cross-System Optimization
      const optimizations = await this.performCrossSystemOptimization(execution);

      // Step 6: Playbook Automation
      const playbookExecutions = await this.triggerRelevantPlaybooks(execution, triageResult);

      // Step 7: Generate Recommendations
      const recommendations = await this.generateSmartRecommendations(execution, optimizations);

      // Calculate metrics
      const totalProcessingTime = Date.now() - startTime;
      const metrics = this.calculateExecutionMetrics(execution, agentAssignments, totalProcessingTime);

      result = {
        workflowId: unifiedRequest.id,
        status: execution.metrics.success ? 'success' : 'failed',
        execution,
        multimodalAnalysis,
        triageResult,
        agentAssignments,
        playbookExecutions,
        optimizations,
        metrics,
        recommendations
      };

      this.emit('workflow:completed', result);

    } catch (error) {
      console.error('Unified orchestration failed:', error);
      result = await this.handleOrchestrationFailure(unifiedRequest, error, startTime);
    } finally {
      this.activeWorkflows.delete(unifiedRequest.id);
    }

    return result;
  }

  // ===== MULTIMODAL ANALYSIS INTEGRATION =====

  private async performMultimodalAnalysis(request: UnifiedWorkflowRequest): Promise<any> {
    // Determine if multimodal analysis is needed
    const hasVoiceData = request.input.voiceData || request.input.transcript;
    const hasImageData = request.input.screenshot || request.input.imageData;
    const hasLogData = request.input.logs || request.input.logData;

    if (!hasVoiceData && !hasImageData && !hasLogData) {
      return null; // No multimodal data
    }

    try {
      // Prepare multimodal inputs
      let voiceCommand = undefined;
      let screenshot = undefined;
      let logDump = undefined;

      if (hasVoiceData) {
        voiceCommand = {
          transcript: request.input.transcript || '',
          confidence: request.input.confidence || 0.8,
          audioData: request.input.voiceData,
          timestamp: new Date()
        };
      }

      if (hasImageData) {
        screenshot = {
          imageData: request.input.imageData || request.input.screenshot,
          format: 'png', // Default format
          dimensions: { width: 1920, height: 1080 }, // Default dimensions
          fileSize: request.input.fileSize || 1000000,
          timestamp: new Date(),
          metadata: request.input.metadata || {}
        };
      }

      if (hasLogData) {
        logDump = {
          logData: request.input.logData || request.input.logs,
          format: 'text',
          source: request.input.source || 'unknown',
          timestamp: new Date(),
          fileSize: request.input.fileSize || 1000000,
          metadata: request.input.metadata || {}
        };
      }

      const analysis = await multimodalTriageService.performMultimodalAnalysis(
        voiceCommand,
        screenshot,
        logDump,
        request.tenantId
      );

      return analysis;

    } catch (error) {
      console.error('Multimodal analysis failed:', error);
      return { error: error instanceof Error ? error.message : 'Analysis failed' };
    }
  }

  // ===== INTELLIGENT TRIAGE INTEGRATION =====

  private async performIntelligentTriage(
    request: UnifiedWorkflowRequest,
    multimodalAnalysis?: any
  ): Promise<any> {
    try {
      // Prepare content for triage
      let content = this.formatRequestForTriage(request);

      // Include multimodal insights
      if (multimodalAnalysis && multimodalAnalysis.integratedAssessment) {
        content += `\n\nMultimodal Analysis: ${multimodalAnalysis.integratedAssessment.summary}`;
        content += `\nSeverity: ${multimodalAnalysis.integratedAssessment.overallSeverity}`;
        content += `\nConfidence: ${(multimodalAnalysis.integratedAssessment.confidence * 100).toFixed(1)}%`;

        if (multimodalAnalysis.integratedAssessment.impact?.affectedSystems?.length > 0) {
          content += `\nAffected Systems: ${multimodalAnalysis.integratedAssessment.impact.affectedSystems.join(', ')}`;
        }
      }

      // Perform triage
      const triageResult = await smartTriageService.triageItem(
        content,
        {
          ...request.context,
          multimodalAnalysis,
          userId: request.userId,
          tenantId: request.tenantId
        },
        request.tenantId
      );

      return triageResult;

    } catch (error) {
      console.error('Intelligent triage failed:', error);
      return {
        routing_decision: 'general_queue',
        confidence_score: 0.1,
        reasoning: `Triage failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggested_actions: ['Route to general queue for manual review']
      };
    }
  }

  private formatRequestForTriage(request: UnifiedWorkflowRequest): string {
    let content = `Unified Workflow Request\n`;
    content += `Type: ${request.type}\n`;
    content += `Priority: ${request.priority || 'medium'}\n`;

    // Add key input fields
    const keyFields = ['title', 'description', 'message', 'query', 'action', 'request'];
    for (const field of keyFields) {
      if (request.input[field]) {
        content += `${field.charAt(0).toUpperCase() + field.slice(1)}: ${request.input[field]}\n`;
      }
    }

    // Add requirements
    if (request.requirements) {
      content += `\nRequirements:\n`;
      if (request.requirements.capabilities?.length > 0) {
        content += `Capabilities: ${request.requirements.capabilities.join(', ')}\n`;
      }
      if (request.requirements.agents?.length > 0) {
        content += `Preferred Agents: ${request.requirements.agents.join(', ')}\n`;
      }
      if (request.requirements.maxExecutionTime) {
        content += `Max Execution Time: ${request.requirements.maxExecutionTime}ms\n`;
      }
    }

    return content;
  }

  // ===== AGENT DISCOVERY AND MARKETPLACE INTEGRATION =====

  private async discoverAndAssignAgents(
    request: UnifiedWorkflowRequest,
    triageResult: any
  ): Promise<Array<{ agentId: string; capabilities: string[]; assignedTasks: string[] }>> {
    try {
      const requiredCapabilities = this.extractRequiredCapabilities(request, triageResult);
      const availableAgents = mcpProtocolService.getAgents().filter(agent =>
        agent.status === 'ACTIVE' &&
        requiredCapabilities.some(cap =>
          agent.capabilities.some(agentCap => agentCap.name === cap)
        )
      );

      // Get agent ratings from marketplace
      const agentsWithRatings = await Promise.all(
        availableAgents.map(async (agent) => {
          try {
            const metadata = await agentMarketplaceService.getAgent(agent.id);
            return {
              agent,
              rating: metadata?.average_rating || 3.0,
              downloadCount: metadata?.total_downloads || 0
            };
          } catch {
            return {
              agent,
              rating: 3.0,
              downloadCount: 0
            };
          }
        })
      );

      // Sort by rating and download count
      agentsWithRatings.sort((a, b) => {
        if (a.rating !== b.rating) return b.rating - a.rating;
        return b.downloadCount - a.downloadCount;
      });

      // Assign tasks to top agents
      const assignments: Array<{ agentId: string; capabilities: string[]; assignedTasks: string[] }> = [];
      const maxAgents = Math.min(agentsWithRatings.length, 5); // Limit to 5 agents

      for (let i = 0; i < maxAgents; i++) {
        const { agent } = agentsWithRatings[i];
        const assignedCapabilities = agent.capabilities
          .filter(cap => requiredCapabilities.includes(cap.name))
          .map(cap => cap.name);

        assignments.push({
          agentId: agent.id,
          capabilities: assignedCapabilities,
          assignedTasks: this.generateTasksForAgent(agent, assignedCapabilities)
        });
      }

      return assignments;

    } catch (error) {
      console.error('Agent discovery failed:', error);
      return [];
    }
  }

  private extractRequiredCapabilities(request: UnifiedWorkflowRequest, triageResult: any): string[] {
    const capabilities = new Set<string>();

    // Add capabilities based on request type
    switch (request.type) {
      case 'multimodal':
        capabilities.add('data_analysis');
        capabilities.add('multimodal_processing');
        break;
      case 'triage':
        capabilities.add('incident_response');
        capabilities.add('problem_diagnosis');
        break;
      default:
        capabilities.add('task_execution');
        capabilities.add('workflow_processing');
    }

    // Add capabilities based on triage decision
    if (triageResult.routing_decision) {
      if (triageResult.routing_decision.includes('analysis')) {
        capabilities.add('data_analysis');
        capabilities.add('insights');
      }
      if (triageResult.routing_decision.includes('processing')) {
        capabilities.add('data_processing');
        capabilities.add('transformation');
      }
      if (triageResult.routing_decision.includes('automation')) {
        capabilities.add('automation');
        capabilities.add('workflow_execution');
      }
    }

    // Add explicitly required capabilities
    if (request.requirements?.capabilities) {
      request.requirements.capabilities.forEach(cap => capabilities.add(cap));
    }

    return Array.from(capabilities);
  }

  private generateTasksForAgent(agent: any, capabilities: string[]): string[] {
    const tasks: string[] = [];

    capabilities.forEach(capability => {
      switch (capability) {
        case 'data_analysis':
          tasks.push('Analyze input data for insights');
          break;
        case 'data_processing':
          tasks.push('Process and transform data');
          break;
        case 'workflow_execution':
          tasks.push('Execute workflow tasks');
          break;
        case 'incident_response':
          tasks.push('Handle incident response');
          break;
        case 'multimodal_processing':
          tasks.push('Process multimodal inputs');
          break;
        default:
          tasks.push(`Execute ${capability} tasks`);
      }
    });

    return tasks;
  }

  // ===== CROSS-SYSTEM OPTIMIZATION =====

  private async performCrossSystemOptimization(execution: WorkflowExecutionContext): Promise<CrossSystemOptimization[]> {
    try {
      const optimizations = await systemIntegration.performCrossSystemOptimization(
        execution.workflowId,
        execution
      );

      return [optimizations];
    } catch (error) {
      console.error('Cross-system optimization failed:', error);
      return [];
    }
  }

  // ===== PLAYBOOK AUTOMATION =====

  private async triggerRelevantPlaybooks(
    execution: WorkflowExecutionContext,
    triageResult: any
  ): Promise<string[]> {
    try {
      const relevantPlaybooks = await playbookService.getPlaybooks();

      // Filter playbooks based on execution context and triage results
      const matchingPlaybooks = relevantPlaybooks.filter(playbook => {
        // Check if playbook triggers match current context
        return playbook.triggers.some(trigger => {
          if (trigger.type === 'triage_result' && triageResult.routing_decision) {
            return trigger.conditions.routing_decision === triageResult.routing_decision;
          }
          return false;
        });
      });

      const executions: string[] = [];

      for (const playbook of matchingPlaybooks.slice(0, 3)) { // Limit to 3 playbooks
        try {
          const playbookExecution = await playbookService.executePlaybook(
            playbook.id,
            {
              workflowId: execution.workflowId,
              triageResult,
              multimodalAnalysis: execution.context?.multimodalAnalysis
            },
            execution.userId,
            execution.tenantId
          );
          executions.push(playbookExecution.id);
        } catch (error) {
          console.error(`Failed to execute playbook ${playbook.id}:`, error);
        }
      }

      return executions;

    } catch (error) {
      console.error('Playbook automation failed:', error);
      return [];
    }
  }

  // ===== SMART RECOMMENDATIONS =====

  private async generateSmartRecommendations(
    execution: WorkflowExecutionContext,
    optimizations: CrossSystemOptimization[]
  ): Promise<Array<{
    type: 'optimization' | 'training' | 'agent_replacement' | 'playbook_creation';
    description: string;
    impact: number;
    implementation: string[];
  }>> {
    const recommendations: Array<{
      type: 'optimization' | 'training' | 'agent_replacement' | 'playbook_creation';
      description: string;
      impact: number;
      implementation: string[];
    }> = [];

    // Generate optimization recommendations
    if (optimizations.length > 0) {
      const optimization = optimizations[0];
      optimization.recommendations.agentReplacements.forEach(replacement => {
        recommendations.push({
          type: 'agent_replacement',
          description: replacement.reason,
          impact: 0.1,
          implementation: [
            `Replace agent ${replacement.oldAgentId} with ${replacement.newAgentId}`,
            'Update workflow configurations',
            'Test new agent performance'
          ]
        });
      });

      optimization.recommendations.trainingInitiatives.forEach(initiative => {
        recommendations.push({
          type: 'training',
          description: initiative.description,
          impact: 0.05,
          implementation: [
            'Initiate ML training job',
            'Monitor training progress',
            'Deploy optimized model',
            'Validate performance improvements'
          ]
        });
      });
    }

    // Generate playbook creation recommendations
    if (execution.metrics.success && execution.metrics.executionTime > 10000) {
      recommendations.push({
        type: 'playbook_creation',
        description: 'Create automated playbook for this workflow pattern',
        impact: 0.15,
        implementation: [
          'Analyze successful execution pattern',
          'Create template playbook',
          'Configure triggers and approvals',
          'Test playbook execution'
        ]
      });
    }

    // Sort by impact
    return recommendations.sort((a, b) => b.impact - a.impact);
  }

  // ===== METRICS AND HEALTH MONITORING =====

  private calculateExecutionMetrics(
    execution: WorkflowExecutionContext,
    agentAssignments: any[],
    totalProcessingTime: number
  ): OrchestrationResult['metrics'] {
    const agentUtilization: Record<string, number> = {};
    agentAssignments.forEach(assignment => {
      agentUtilization[assignment.agentId] = assignment.assignedTasks.length;
    });

    // Estimate cost savings based on automation
    const costSavings = execution.metrics.executionTime * 0.001; // Rough estimate

    // Calculate automation rate
    const automationRate = execution.agents.length > 0 ? 1 : 0;

    return {
      totalProcessingTime,
      agentUtilization,
      costSavings,
      automationRate
    };
  }

  private async handleOrchestrationFailure(
    request: UnifiedWorkflowRequest,
    error: any,
    startTime: number
  ): Promise<OrchestrationResult> {
    const failedExecution: WorkflowExecutionContext = {
      workflowId: request.id,
      tenantId: request.tenantId,
      userId: request.userId,
      sessionId: request.id,
      startTime: new Date(startTime),
      agents: [],
      triageResults: [],
      trainingJobs: [],
      metrics: {
        executionTime: Date.now() - startTime,
        cost: 0,
        success: false,
        agentPerformance: {}
      }
    };

    return {
      workflowId: request.id,
      status: 'failed',
      execution: failedExecution,
      agentAssignments: [],
      playbookExecutions: [],
      optimizations: [],
      metrics: {
        totalProcessingTime: Date.now() - startTime,
        agentUtilization: {},
        costSavings: 0,
        automationRate: 0
      },
      recommendations: [{
        type: 'optimization',
        description: 'Review and fix orchestration failure',
        impact: 0.2,
        implementation: [
          'Analyze error logs',
          'Identify failure point',
          'Implement error handling',
          'Add retry mechanisms'
        ]
      }]
    };
  }

  // ===== SYSTEM HEALTH MONITORING =====

  private async checkSystemHealth(): Promise<SystemHealthStatus> {
    try {
      const [mcpHealth, marketplaceHealth, triageHealth, neuroweaverHealth] = await Promise.allSettled([
        this.checkMCPHealth(),
        this.checkMarketplaceHealth(),
        this.checkTriageHealth(),
        this.checkNeuroWeaverHealth()
      ]);

      const components = {
        mcp: mcpHealth.status === 'fulfilled' && mcpHealth.value ? 'healthy' : 'unhealthy',
        marketplace: marketplaceHealth.status === 'fulfilled' && marketplaceHealth.value ? 'healthy' : 'unhealthy',
        triage: triageHealth.status === 'fulfilled' && triageHealth.value ? 'healthy' : 'unhealthy',
        neuroweaver: neuroweaverHealth.status === 'fulfilled' && neuroweaverHealth.value ? 'healthy' : 'unhealthy',
        multimodal: 'healthy', // Assume healthy for now
        playbooks: 'healthy'  // Assume healthy for now
      };

      const unhealthyCount = Object.values(components).filter(status => status !== 'healthy').length;
      const overall = unhealthyCount === 0 ? 'healthy' : unhealthyCount <= 2 ? 'degraded' : 'unhealthy';

      return {
        overall,
        components,
        metrics: {
          activeWorkflows: this.activeWorkflows.size,
          queuedRequests: this.requestQueue.length,
          averageResponseTime: 5000, // Mock value
          errorRate: 0.02 // Mock value
        }
      };

    } catch (error) {
      console.error('Health check failed:', error);
      return {
        overall: 'unhealthy',
        components: {
          mcp: 'unhealthy',
          marketplace: 'unhealthy',
          triage: 'unhealthy',
          neuroweaver: 'unhealthy',
          multimodal: 'unhealthy',
          playbooks: 'unhealthy'
        },
        metrics: {
          activeWorkflows: 0,
          queuedRequests: 0,
          averageResponseTime: 0,
          errorRate: 1.0
        }
      };
    }
  }

  private async checkMCPHealth(): Promise<boolean> {
    try {
      const agents = mcpProtocolService.getAgents();
      return agents.length >= 0; // Basic connectivity check
    } catch {
      return false;
    }
  }

  private async checkMarketplaceHealth(): Promise<boolean> {
    try {
      const agents = await agentMarketplaceService.getAgents();
      return agents.length >= 0;
    } catch {
      return false;
    }
  }

  private async checkTriageHealth(): Promise<boolean> {
    try {
      // Basic health check - could be enhanced
      return true;
    } catch {
      return false;
    }
  }

  private async checkNeuroWeaverHealth(): Promise<boolean> {
    try {
      // Basic health check - could be enhanced
      return true;
    } catch {
      return false;
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.checkSystemHealth();
      this.emit('health:status', health);

      // Emit alerts for unhealthy components
      Object.entries(health.components).forEach(([component, status]) => {
        if (status !== 'healthy') {
          this.emit('health:alert', {
            component,
            status,
            timestamp: new Date(),
            message: `${component} is ${status}`
          });
        }
      });
    }, 30000); // Check every 30 seconds
  }

  // ===== EVENT LISTENERS =====

  private initializeEventListeners(): void {
    // Listen to system integration events
    systemIntegration.on('workflow:started', (context) => {
      this.emit('orchestration:workflow_started', context);
    });

    systemIntegration.on('workflow:completed', (context) => {
      this.emit('orchestration:workflow_completed', context);
    });

    systemIntegration.on('optimization:ready', (data) => {
      this.emit('orchestration:optimization_ready', data);
    });

    // Listen to multimodal triage events
    multimodalTriageService.on('multimodal:analysis_complete', (analysis) => {
      this.emit('orchestration:multimodal_analysis', analysis);
    });

    // Listen to playbook events
    playbookService.on('execution:started', (execution) => {
      this.emit('orchestration:playbook_started', execution);
    });

    playbookService.on('execution:completed', (execution) => {
      this.emit('orchestration:playbook_completed', execution);
    });
  }

  // ===== PUBLIC API =====

  /**
   * Get current system health
   */
  async getSystemHealth(): Promise<SystemHealthStatus> {
    return this.checkSystemHealth();
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows(): UnifiedWorkflowRequest[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(workflowId: string): Promise<boolean> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return false;

    this.activeWorkflows.delete(workflowId);
    this.emit('workflow:cancelled', workflow);
    return true;
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<{
    activeWorkflows: number;
    completedWorkflows: number;
    averageProcessingTime: number;
    systemUtilization: number;
  }> {
    // Mock metrics - could be enhanced with real data collection
    return {
      activeWorkflows: this.activeWorkflows.size,
      completedWorkflows: 100, // Mock
      averageProcessingTime: 5000, // Mock
      systemUtilization: 0.7 // Mock
    };
  }

  /**
   * Shutdown the orchestrator
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.activeWorkflows.clear();
    this.requestQueue.length = 0;
    this.removeAllListeners();
  }

  // ===== UTILITY METHODS =====

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const unifiedOrchestrator = new UnifiedOrchestratorService();
