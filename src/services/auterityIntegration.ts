import { unifiedApiClient, UnifiedAPIClient } from '../../../auterity-error-iq/shared/services/unified-api-client/index.js';
import { WorkflowSchema, type Workflow, type Node, type Edge } from '@auterity/workflow-contracts';
import { logger } from '../../../auterity-error-iq/shared/utils/logger.js';
import { retryWithBackoff } from '../../../auterity-error-iq/shared/utils/retryUtils.js';

export interface AuterityIntegrationConfig {
  autmatrixUrl?: string;
  neuroweaverUrl?: string;
  relaycoreUrl?: string;
  authToken?: string;
  enableAI?: boolean;
  enableMonitoring?: boolean;
}

export interface WorkflowExecutionResult {
  executionId: string;
  status: 'success' | 'error' | 'running';
  result?: any;
  error?: string;
  metrics?: {
    executionTime: number;
    cost: number;
    modelUsed?: string;
  };
}

export interface AIModelSuggestion {
  nodeId: string;
  suggestions: Array<{
    type: string;
    confidence: number;
    reasoning: string;
    config: any;
  }>;
}

export class AuterityIntegrationService {
  private apiClient: UnifiedAPIClient;
  private config: AuterityIntegrationConfig;
  private executionCache = new Map<string, WorkflowExecutionResult>();

  constructor(config: AuterityIntegrationConfig = {}) {
    this.config = {
      autmatrixUrl: process.env.AUTMATRIX_API_URL || 'http://localhost:3001/api',
      neuroweaverUrl: process.env.NEUROWEAVER_API_URL || 'http://localhost:3002/api',
      relaycoreUrl: process.env.RELAYCORE_API_URL || 'http://localhost:3003/api',
      enableAI: true,
      enableMonitoring: true,
      ...config
    };

    // Use the singleton instance
    this.apiClient = unifiedApiClient;

    logger.info('AuterityIntegrationService initialized', {
      config: this.config,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Execute a workflow using Auterity's AutoMatrix system
   */
  async executeWorkflow(workflow: Workflow, inputs: Record<string, any> = {}): Promise<WorkflowExecutionResult> {
    try {
      logger.info('Executing workflow via Auterity', {
        workflowId: workflow.id,
        nodeCount: workflow.nodes.length,
        edgeCount: workflow.edges.length
      });

      // Validate workflow structure
      const validationResult = WorkflowSchema.safeParse(workflow);
      if (!validationResult.success) {
        throw new Error(`Invalid workflow structure: ${validationResult.error.message}`);
      }

      // Execute with retry logic
      const execution = await retryWithBackoff(
        () => this.apiClient.autmatrix.executeWorkflow(workflow.id, inputs),
        {
          maxAttempts: 3,
          baseDelay: 1000
        }
      );

      const result: WorkflowExecutionResult = {
        executionId: execution.id,
        status: execution.status === 'completed' ? 'success' :
                execution.status === 'failed' ? 'error' : 'running',
        result: execution.result,
        error: execution.error,
        metrics: {
          executionTime: execution.endTime ?
            new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime() : 0,
          cost: 0
        }
      };

      // Cache the result
      this.executionCache.set(execution.id, result);

      logger.info('Workflow execution completed', {
        executionId: execution.id,
        status: result.status,
        executionTime: result.metrics?.executionTime
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Workflow execution failed', {
        error: errorMessage,
        workflowId: workflow.id
      });
      throw error;
    }
  }

  /**
   * Get AI-powered suggestions for workflow optimization
   */
  async getAISuggestions(workflow: Workflow): Promise<AIModelSuggestion[]> {
    if (!this.config.enableAI) {
      return [];
    }

    try {
      logger.info('Requesting AI suggestions for workflow optimization');

      const suggestions: AIModelSuggestion[] = [];

      for (const node of workflow.nodes) {
        const aiRequest = {
          id: `suggestion-${node.id}`,
          prompt: `Analyze this workflow node and suggest optimizations: ${JSON.stringify(node)}`,
          systemPreferences: {
            preferredSystem: 'relaycore' as const,
            priority: 'accuracy' as const
          }
        };

        const aiResponse = await retryWithBackoff(
          () => this.apiClient.relaycore.routeAIRequest(aiRequest),
          { maxAttempts: 2, baseDelay: 500 }
        );

        const nodeSuggestions = this.parseAISuggestions(aiResponse.response, node.id);
        if (nodeSuggestions.length > 0) {
          suggestions.push({
            nodeId: node.id,
            suggestions: nodeSuggestions
          });
        }
      }

      logger.info('AI suggestions generated', { suggestionCount: suggestions.length });
      return suggestions;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('AI suggestions failed, falling back to basic suggestions', {
        error: errorMessage
      });
      return this.getFallbackSuggestions(workflow);
    }
  }

  /**
   * Get available workflow templates from AutoMatrix
   */
  async getWorkflowTemplates() {
    try {
      const templates = await this.apiClient.autmatrix.getWorkflowTemplates();
      logger.info('Retrieved workflow templates', { count: templates.length });
      return templates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to retrieve workflow templates', { error: errorMessage });
      return [];
    }
  }

  /**
   * Get execution history and analytics
   */
  async getExecutionHistory(filters: any = {}) {
    try {
      const history = await this.apiClient.autmatrix.getExecutionHistory(filters);
      logger.info('Retrieved execution history', { count: history.length });
      return history;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to retrieve execution history', { error: errorMessage });
      return [];
    }
  }

  /**
   * Get system health and monitoring metrics
   */
  async getSystemHealth() {
    if (!this.config.enableMonitoring) {
      return null;
    }

    try {
      const [routingMetrics, costAnalytics] = await Promise.all([
        this.apiClient.relaycore.getRoutingMetrics(),
        this.apiClient.relaycore.getCostAnalytics()
      ]);

      return {
        routing: routingMetrics,
        costs: costAnalytics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to retrieve system health', { error: errorMessage });
      return null;
    }
  }

  /**
   * Get available AI models from NeuroWeaver
   */
  async getAvailableModels() {
    try {
      const models = await this.apiClient.neuroweaver.getModels();
      logger.info('Retrieved available AI models', { count: models.length });
      return models;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to retrieve AI models', { error: errorMessage });
      return [];
    }
  }

  private parseAISuggestions(aiResponse: string, nodeId: string) {
    const suggestions = [];

    if (aiResponse.toLowerCase().includes('parallel') || aiResponse.toLowerCase().includes('concurrent')) {
      suggestions.push({
        type: 'parallel-processing',
        confidence: 0.8,
        reasoning: 'AI suggests parallel processing could improve performance',
        config: { maxConcurrency: 3 }
      });
    }

    if (aiResponse.toLowerCase().includes('cache') || aiResponse.toLowerCase().includes('memory')) {
      suggestions.push({
        type: 'caching',
        confidence: 0.7,
        reasoning: 'AI recommends adding caching for better performance',
        config: { ttl: 3600, maxSize: 100 }
      });
    }

    return suggestions;
  }

  private getFallbackSuggestions(workflow: Workflow): AIModelSuggestion[] {
    const suggestions: AIModelSuggestion[] = [];

    for (const node of workflow.nodes) {
      if (node.type === 'action' && !node.data?.cache) {
        suggestions.push({
          nodeId: node.id,
          suggestions: [{
            type: 'caching',
            confidence: 0.6,
            reasoning: 'Consider adding caching to improve performance',
            config: { ttl: 300 }
          }]
        });
      }
    }

    return suggestions;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.executionCache.clear();
    logger.info('AuterityIntegrationService disposed');
  }
}

// Singleton instance for easy access
export const auterityIntegration = new AuterityIntegrationService();
