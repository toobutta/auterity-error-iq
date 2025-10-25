/**
 * Unified AI Orchestrator for Auterity Error-IQ
 * Orchestrates all AI toolkit integrations (LangChain, LiteLLM, Google Vertex, Hugging Face, AutoGen)
 * Provides a single interface for complex AI workflows and multi-agent orchestration
 */

import { langChainService, LangChainConfig } from './LangChainService';
import { liteLLMService, RoutingDecision } from './LiteLLMService';
import { googleVertexService, VertexConfig } from './GoogleVertexService';
import { huggingFaceService, HFModelConfig } from './HuggingFaceService';
import { autoGenService, AgentConfig, MultiAgentWorkflow } from './AutoGenService';
import { z } from "zod";

// Types for unified orchestration
export interface OrchestrationRequest {
  task: string;
  input: any;
  preferences?: {
    model?: string;
    costPriority?: 'low' | 'medium' | 'high';
    speedPriority?: 'low' | 'medium' | 'high';
    capabilities?: string[];
    multimodal?: boolean;
    agents?: string[];
  };
  context?: Record<string, any>;
}

export interface OrchestrationResult {
  taskId: string;
  service: 'langchain' | 'litellm' | 'vertex' | 'huggingface' | 'autogen' | 'n8n';
  result: any;
  routing?: RoutingDecision;
  executionTime: number;
  cost?: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  type: 'simple' | 'multi-agent' | 'ml-pipeline' | 'creative' | 'analysis';
  services: string[];
  estimatedCost: number;
  estimatedTime: number;
}

export class UnifiedAIOrchestrator {
  private activeTasks: Map<string, OrchestrationResult> = new Map();
  private workflowTemplates: Map<string, WorkflowTemplate> = new Map();

  constructor() {
    this.initializeWorkflowTemplates();
  }

  /**
   * Initialize predefined workflow templates
   */
  private initializeWorkflowTemplates(): void {
    const templates: WorkflowTemplate[] = [
      {
        id: 'text-analysis',
        name: 'Text Analysis & Insights',
        description: 'Analyze text for sentiment, entities, and insights',
        type: 'analysis',
        services: ['huggingface', 'vertex'],
        estimatedCost: 0.02,
        estimatedTime: 2000
      },
      {
        id: 'content-generation',
        name: 'AI Content Generation',
        description: 'Generate high-quality content with multiple AI models',
        type: 'creative',
        services: ['langchain', 'litellm', 'autogen'],
        estimatedCost: 0.05,
        estimatedTime: 3000
      },
      {
        id: 'multi-agent-debate',
        name: 'Multi-Agent Debate',
        description: 'Multiple AI agents debate and analyze a topic',
        type: 'multi-agent',
        services: ['autogen', 'langchain'],
        estimatedCost: 0.08,
        estimatedTime: 5000
      },
      {
        id: 'image-analysis',
        name: 'Advanced Image Analysis',
        description: 'Analyze images with multimodal AI capabilities',
        type: 'analysis',
        services: ['vertex', 'huggingface'],
        estimatedCost: 0.03,
        estimatedTime: 2500
      },
      {
        id: 'code-review',
        name: 'AI Code Review',
        description: 'Automated code review with multiple AI perspectives',
        type: 'analysis',
        services: ['autogen', 'huggingface'],
        estimatedCost: 0.04,
        estimatedTime: 3500
      }
    ];

    templates.forEach(template => {
      this.workflowTemplates.set(template.id, template);
    });


  }

  /**
   * Orchestrate a complex AI task across multiple services
   */
  async orchestrateTask(request: OrchestrationRequest): Promise<OrchestrationResult> {
    try {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();


      // Determine the best orchestration strategy
      const strategy = this.determineStrategy(request);

      // Execute based on strategy
      let result: any;
      let service: string;
      let routing: RoutingDecision | undefined;
      let cost: number | undefined;

      switch (strategy.type) {
        case 'simple':
          ({ result, service, cost } = await this.executeSimpleTask(request, strategy.service));
          break;

        case 'routed':
          ({ result, service, routing, cost } = await this.executeRoutedTask(request, strategy));
          break;

        case 'multi-agent':
          ({ result, service, cost } = await this.executeMultiAgentTask(request, strategy));
          break;

        case 'pipeline':
          ({ result, service, cost } = await this.executePipelineTask(request, strategy));
          break;

        default:
          throw new Error(`Unknown orchestration strategy: ${strategy.type}`);
      }

      const executionTime = Date.now() - startTime;

      const orchestrationResult: OrchestrationResult = {
        taskId,
        service: service as any,
        result,
        routing,
        executionTime,
        cost,
        metadata: {
          strategy: strategy.type,
          inputType: typeof request.input,
          preferences: request.preferences
        }
      };

      // Store result for tracking
      this.activeTasks.set(taskId, orchestrationResult);


      return orchestrationResult;

    } catch (error) {

      throw new Error(`Task orchestration failed: ${(error as Error).message}`);
    }
  }

  /**
   * Determine the best orchestration strategy for a task
   */
  private determineStrategy(request: OrchestrationRequest): any {
    const { task, preferences = {} } = request;

    // Simple text generation
    if (task === 'text-generation' && !preferences.agents) {
      return {
        type: 'routed',
        service: 'litellm',
        fallbackServices: ['langchain', 'vertex']
      };
    }

    // Multimodal tasks
    if (preferences.multimodal || task.includes('image') || task.includes('vision')) {
      return {
        type: 'simple',
        service: 'vertex'
      };
    }

    // Multi-agent tasks
    if (preferences.agents && preferences.agents.length > 1) {
      return {
        type: 'multi-agent',
        agents: preferences.agents,
        maxRounds: 5
      };
    }

    // Model-specific tasks (Hugging Face models)
    if (task.includes('classification') || task.includes('sentiment') || task.includes('ner')) {
      return {
        type: 'simple',
        service: 'huggingface'
      };
    }

    // Complex workflows
    if (task.includes('workflow') || task.includes('pipeline')) {
      return {
        type: 'pipeline',
        services: ['langchain', 'autogen', 'litellm']
      };
    }

    // Default: use intelligent routing
    return {
      type: 'routed',
      service: 'litellm',
      fallbackServices: ['langchain', 'vertex', 'huggingface']
    };
  }

  /**
   * Execute simple task with single service
   */
  private async executeSimpleTask(request: OrchestrationRequest, service: string): Promise<any> {
    switch (service) {
      case 'vertex':
        const vertexResult = await googleVertexService.generateText(
          request.input,
          request.preferences as Partial<VertexConfig>
        );
        return {
          result: vertexResult,
          service: 'vertex',
          cost: 0.01 // Estimate
        };

      case 'huggingface':
        const hfResult = await huggingFaceService.runInference(
          request.preferences?.model || 'distilbert-base-uncased-finetuned-sst-2-english',
          request.input,
          { task: this.inferHFtask(request.task) }
        );
        return {
          result: hfResult,
          service: 'huggingface',
          cost: 0.005 // Estimate
        };

      default:
        throw new Error(`Unsupported service: ${service}`);
    }
  }

  /**
   * Execute task with intelligent routing
   */
  private async executeRoutedTask(request: OrchestrationRequest, strategy: any): Promise<any> {
    const routing = await liteLLMService.determineRouting(
      typeof request.input === 'string' ? request.input : JSON.stringify(request.input),
      {
        model: request.preferences?.model,
        costPriority: request.preferences?.costPriority,
        speedPriority: request.preferences?.speedPriority,
        capabilities: request.preferences?.capabilities
      }
    );

    // In a real implementation, this would route to the selected provider
    // For now, simulate the response
    const result = {
      text: `Response from ${routing.provider} using ${routing.model}`,
      routing,
      simulated: true
    };

    liteLLMService.recordActualCost(routing.provider, routing.model, routing.estimatedCost, 100);

    return {
      result,
      service: 'litellm',
      routing,
      cost: routing.estimatedCost
    };
  }

  /**
   * Execute multi-agent task
   */
  private async executeMultiAgentTask(request: OrchestrationRequest, strategy: any): Promise<any> {
    const agentIds = strategy.agents || ['assistant', 'analyst'];

    // Validate agents exist
    agentIds.forEach((agentId: string) => {
      if (!autoGenService.getAgent(agentId)) {
        throw new Error(`Agent ${agentId} not found`);
      }
    });

    const execution = await autoGenService.executeMultiAgentConversation(
      agentIds,
      typeof request.input === 'string' ? request.input : JSON.stringify(request.input),
      strategy.maxRounds || 5
    );

    return {
      result: {
        conversation: execution.conversation,
        finalResult: execution.result,
        agentsUsed: execution.agents
      },
      service: 'autogen',
      cost: 0.02 // Estimate
    };
  }

  /**
   * Execute pipeline task
   */
  private async executePipelineTask(request: OrchestrationRequest, strategy: any): Promise<any> {
    // Create a conversation chain for pipeline processing
    const chainId = await langChainService.createConversationChain({
      model: request.preferences?.model || 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: 'You are coordinating a multi-step AI pipeline. Process the input through multiple stages and provide comprehensive results.'
    });

    const input = typeof request.input === 'string' ? request.input : JSON.stringify(request.input);
    const result = await langChainService.executeChain(chainId, input);

    return {
      result,
      service: 'langchain',
      cost: 0.03 // Estimate
    };
  }

  /**
   * Infer Hugging Face task from general task description
   */
  private inferHFtask(task: string): string {
    if (task.includes('sentiment')) return 'text-classification';
    if (task.includes('question')) return 'question-answering';
    if (task.includes('summary')) return 'summarization';
    if (task.includes('translate')) return 'translation';
    return 'text-classification'; // Default
  }

  /**
   * Get available workflow templates
   */
  getWorkflowTemplates(type?: string): WorkflowTemplate[] {
    const templates = Array.from(this.workflowTemplates.values());
    return type ? templates.filter(t => t.type === type) : templates;
  }

  /**
   * Execute a workflow template
   */
  async executeWorkflowTemplate(templateId: string, input: any): Promise<OrchestrationResult> {
    const template = this.workflowTemplates.get(templateId);
    if (!template) {
      throw new Error(`Workflow template ${templateId} not found`);
    }

    const request: OrchestrationRequest = {
      task: template.type,
      input,
      preferences: {
        capabilities: template.services
      }
    };

    return await this.orchestrateTask(request);
  }

  /**
   * Get orchestration analytics
   */
  getAnalytics(hours = 24): {
    totalTasks: number;
    serviceUsage: Record<string, number>;
    averageExecutionTime: number;
    totalCost: number;
    successRate: number;
  } {
    const tasks = Array.from(this.activeTasks.values());
    const recentTasks = tasks.filter(task =>
      Date.now() - (task.metadata?.timestamp || 0) < (hours * 60 * 60 * 1000)
    );

    const serviceUsage: Record<string, number> = {};
    let totalExecutionTime = 0;
    let totalCost = 0;
    let successfulTasks = 0;

    recentTasks.forEach(task => {
      serviceUsage[task.service] = (serviceUsage[task.service] || 0) + 1;
      totalExecutionTime += task.executionTime;
      totalCost += task.cost || 0;

      // Assume success if no error in metadata
      if (!task.metadata?.error) successfulTasks++;
    });

    return {
      totalTasks: recentTasks.length,
      serviceUsage,
      averageExecutionTime: recentTasks.length > 0 ? totalExecutionTime / recentTasks.length : 0,
      totalCost,
      successRate: recentTasks.length > 0 ? (successfulTasks / recentTasks.length) * 100 : 0
    };
  }

  /**
   * Get health status of all integrated services
   */
  getHealthStatus(): {
    langchain: any;
    litellm: any;
    vertex: any;
    huggingface: any;
    autogen: any;
    overall: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const langchainHealth = langChainService.getHealthStatus();
    const litellmHealth = liteLLMService.getCostMetrics();
    const vertexHealth = googleVertexService.getHealthStatus();
    const huggingfaceHealth = huggingFaceService.getHealthStatus();
    const autogenHealth = autoGenService.getHealthStatus();

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!vertexHealth.apiKeyConfigured || !huggingfaceHealth.apiKeyConfigured) {
      overall = 'degraded';
    }

    if (langchainHealth.chainsActive === 0 && autogenHealth.agentsAvailable === 0) {
      overall = 'unhealthy';
    }

    return {
      langchain: langchainHealth,
      litellm: litellmHealth,
      vertex: vertexHealth,
      huggingface: huggingfaceHealth,
      autogen: autogenHealth,
      overall
    };
  }

  /**
   * Clean up old task results
   */
  cleanupTasks(olderThanHours = 24): number {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [taskId, task] of this.activeTasks.entries()) {
      if ((task.metadata?.timestamp || 0) < cutoffTime) {
        this.activeTasks.delete(taskId);
        cleanedCount++;
      }
    }


    return cleanedCount;
  }
}

// Export singleton instance
export const unifiedAIOrchestrator = new UnifiedAIOrchestrator();

