/**
 * n8n RelayCore Adapter
 * Integrates n8n workflows with RelayCore's AI routing and optimization
 * Migrated and adapted from auterity-workflow-studio for auterity-error-iq
 */

import { Router } from 'express';
import { n8nApiService } from '../../../../../apps/workflow-studio/src/services/n8n/n8nApiService';

// Simple logger for relaycore system
const logger = {
  info: (message: string, ...args: any[]) => {
    // Log to internal monitoring system
  },
  error: (message: string, ...args: any[]) => {
    // Log to error monitoring system
  },
  warn: (message: string, ...args: any[]) => {
    // Log to warning monitoring system
  },
  debug: (message: string, ...args: any[]) => {
    // Debug logging disabled in production
  }
};

// Placeholder interfaces - these should be imported from the actual models
interface AIRequest {
  id: string;
  prompt?: string;
  context?: any;
  user_id?: string;
  system_source?: string;
}

interface AIResponse {
  id: string;
  request_id: string;
  model_used: string;
  response: any;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  cost_usd: number;
  processing_time_ms: number;
  status: 'success' | 'error';
  error?: string;
  metadata?: any;
}

interface RoutingDecision {
  provider: string;
  reasoning: string;
  cost: number;
}

// Placeholder classes - these should be imported from actual services
class ProviderManager {
  async registerProvider(provider: any) {
    logger.info('Registering provider:', provider);
  }
}

class CostOptimizer {
  // Placeholder implementation
}

class MetricsCollector {
  async recordRequest(request: AIRequest, response: AIResponse, decision: RoutingDecision) {
    logger.info('Recording metrics for request:', request.id);
  }

  async recordError(requestId: string, error: Error, processingTime: number) {
    logger.error('Recording error for request:', requestId, error.message);
  }
}

export class N8nRelayCoreAdapter {
  private providerManager: ProviderManager;
  private costOptimizer: CostOptimizer;
  private metricsCollector: MetricsCollector;

  constructor() {
    this.providerManager = new ProviderManager();
    this.costOptimizer = new CostOptimizer();
    this.metricsCollector = new MetricsCollector();
  }

  /**
   * Register n8n as a provider in RelayCore
   */
  async registerN8nProvider(): Promise<void> {
    try {
      // Register n8n as an available provider
      await this.providerManager.registerProvider({
        id: 'n8n',
        name: 'n8n Workflow Engine',
        type: 'workflow',
        capabilities: ['workflow-execution', 'template-processing', 'data-transformation'],
        cost_per_token: 0.001, // Low cost for workflow orchestration
        max_tokens: 100000,
        supported_models: ['workflow-engine'],
        status: 'active'
      });

      logger.info('n8n provider registered with RelayCore');
    } catch (error) {
      logger.error('Failed to register n8n provider:', error);
      throw error;
    }
  }

  /**
   * Route AI requests through n8n workflows when appropriate
   */
  async routeThroughN8n(request: AIRequest, routingDecision: RoutingDecision): Promise<AIResponse | null> {
    // Determine if this request should use n8n
    if (this.shouldUseN8n(request)) {
      try {
        logger.info(`Routing AI request ${request.id} through n8n workflow`);

        // Execute n8n workflow
        const n8nResult = await n8nApiService.triggerWorkflow({
          workflowId: this.selectN8nWorkflow(request),
          parameters: {
            prompt: request.prompt,
            context: request.context,
            userId: request.user_id,
            systemSource: request.system_source
          }
        });

        // Convert to RelayCore AIResponse format
        const aiResponse: AIResponse = {
          id: `n8n_${n8nResult.executionId}`,
          request_id: request.id,
          model_used: 'n8n-workflow-engine',
          response: n8nResult.result?.response || n8nResult.result || {},
          usage: {
            input_tokens: JSON.stringify(request).length / 4, // Rough estimate
            output_tokens: JSON.stringify(n8nResult.result).length / 4,
            total_tokens: (JSON.stringify(request).length + JSON.stringify(n8nResult.result).length) / 4
          },
          cost_usd: 0.01, // Fixed low cost for workflow execution
          processing_time_ms: n8nResult.startedAt && n8nResult.completedAt
            ? new Date(n8nResult.completedAt).getTime() - new Date(n8nResult.startedAt).getTime()
            : 1000,
          status: n8nResult.status === 'completed' ? 'success' : 'error',
          error: n8nResult.error,
          metadata: {
            n8n_execution_id: n8nResult.executionId,
            workflow_id: n8nResult.workflowId,
            provider: 'n8n'
          }
        };

        // Record metrics
        await this.metricsCollector.recordRequest(request, aiResponse, {
          ...routingDecision,
          provider: 'n8n',
          reasoning: 'Request routed to n8n workflow engine for specialized processing'
        });

        logger.info(`AI request ${request.id} completed via n8n workflow: ${n8nResult.executionId}`);
        return aiResponse;

      } catch (error) {
        logger.error(`n8n routing failed for request ${request.id}:`, error);

        // Record error metrics
        await this.metricsCollector.recordError(request.id, error as Error, Date.now() - Date.now());

        return null; // Allow fallback to other providers
      }
    }

    return null; // Not suitable for n8n
  }

  /**
   * Determine if a request should be routed through n8n
   */
  private shouldUseN8n(request: AIRequest): boolean {
    // Criteria for using n8n:
    // 1. Complex multi-step workflows
    // 2. Integration with external services
    // 3. Data transformation requirements
    // 4. Template-based processing

    const prompt = request.prompt?.toLowerCase() || '';
    const context = JSON.stringify(request.context || {}).toLowerCase();

    const n8nIndicators = [
      'workflow',
      'integrate',
      'connect to',
      'api call',
      'webhook',
      'database',
      'email',
      'slack',
      'automation',
      'template'
    ];

    const hasN8nKeywords = n8nIndicators.some(indicator =>
      prompt.includes(indicator) || context.includes(indicator)
    );

    return hasN8nKeywords;
  }

  /**
   * Select appropriate n8n workflow based on request content
   */
  private selectN8nWorkflow(request: AIRequest): string {
    const prompt = request.prompt?.toLowerCase() || '';

    // Simple workflow selection logic - can be enhanced with ML
    if (prompt.includes('email')) {
      return 'email-automation-workflow';
    } else if (prompt.includes('database') || prompt.includes('query')) {
      return 'data-processing-workflow';
    } else if (prompt.includes('webhook') || prompt.includes('api')) {
      return 'integration-workflow';
    } else if (prompt.includes('template')) {
      return 'template-processing-workflow';
    } else {
      return 'general-automation-workflow'; // Default workflow
    }
  }

  /**
   * Get n8n provider status for monitoring
   */
  async getN8nProviderStatus() {
    try {
      const workflows = await n8nApiService.listWorkflows();
      return {
        provider: 'n8n',
        status: 'active',
        workflows_count: workflows.length,
        last_check: new Date().toISOString(),
        capabilities: ['workflow-execution', 'template-processing', 'data-transformation']
      };
    } catch (error) {
      logger.error('Failed to get n8n provider status:', error);
      return {
        provider: 'n8n',
        status: 'error',
        error: (error as Error).message,
        last_check: new Date().toISOString()
      };
    }
  }

  /**
   * Create Express routes for n8n-RelayCore integration
   */
  createRoutes(): Router {
    const router = Router();

    // GET /api/v1/relaycore/n8n/status
    router.get('/status', async (req, res) => {
      try {
        const status = await this.getN8nProviderStatus();
        res.json({ success: true, data: status });
      } catch (error) {
        logger.error('Failed to get n8n status:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Failed to get n8n status' }
        });
      }
    });

    // POST /api/v1/relaycore/n8n/register
    router.post('/register', async (req, res) => {
      try {
        await this.registerN8nProvider();
        res.json({ success: true, message: 'n8n provider registered successfully' });
      } catch (error) {
        logger.error('Failed to register n8n provider:', error);
        res.status(500).json({
          success: false,
          error: { message: 'Failed to register n8n provider' }
        });
      }
    });

    return router;
  }
}

export const n8nRelayCoreAdapter = new N8nRelayCoreAdapter();


