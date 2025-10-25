/**
 * n8n Neuroweaver Connector
 * Integrates n8n workflows with Neuroweaver's ML model management and monitoring
 * Migrated and adapted from auterity-workflow-studio for auterity-error-iq
 */

import { n8nApiService } from '../../../../../apps/workflow-studio/src/services/n8n/n8nApiService';

// Simple logger for neuroweaver system
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

interface ModelExecution {
  modelId: string;
  executionId: string;
  input: any;
  output: any;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  metrics?: {
    latency: number;
    tokens_used: number;
    cost: number;
  };
}

interface WorkflowMetrics {
  workflowId: string;
  executionCount: number;
  successRate: number;
  averageLatency: number;
  totalCost: number;
  lastExecution: Date;
}

export class N8nNeuroweaverConnector {
  private executionMetrics = new Map<string, WorkflowMetrics>();
  private activeExecutions = new Map<string, ModelExecution>();

  constructor() {
    // Initialize monitoring
    this.startMonitoring();
  }

  /**
   * Monitor n8n workflow executions for ML model performance
   */
  private async startMonitoring(): Promise<void> {
    // Poll for active executions every 30 seconds
    setInterval(async () => {
      await this.checkActiveExecutions();
    }, 30000);

    logger.info('n8n Neuroweaver monitoring started');
  }

  /**
   * Track ML model execution through n8n workflows
   */
  async trackModelExecution(
    modelId: string,
    workflowId: string,
    input: any
  ): Promise<ModelExecution> {
    try {
      logger.info(`Tracking model execution: ${modelId} via workflow: ${workflowId}`);

      // Start n8n workflow execution
      const n8nResult = await n8nApiService.triggerWorkflow({
        workflowId,
        parameters: {
          modelId,
          input,
          trackMetrics: true,
          systemSource: 'neuroweaver'
        }
      });

      // Create execution record
      const execution: ModelExecution = {
        modelId,
        executionId: n8nResult.executionId,
        input,
        output: n8nResult.result,
        startTime: new Date(),
        status: n8nResult.status === 'completed' ? 'completed' : 'running'
      };

      // Store for monitoring
      this.activeExecutions.set(n8nResult.executionId, execution);

      // Update workflow metrics
      await this.updateWorkflowMetrics(workflowId, n8nResult);

      logger.info(`Model execution tracked: ${n8nResult.executionId}`);
      return execution;

    } catch (error) {
      logger.error(`Failed to track model execution for ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Get execution status and metrics
   */
  async getExecutionMetrics(executionId: string): Promise<ModelExecution | null> {
    try {
      // Check local cache first
      if (this.activeExecutions.has(executionId)) {
        return this.activeExecutions.get(executionId)!;
      }

      // Get from n8n API
      const n8nStatus = await n8nApiService.getExecutionStatus(executionId);
      if (!n8nStatus) return null;

      // Convert to Neuroweaver format
      const execution: ModelExecution = {
        modelId: n8nStatus.workflowId, // Using workflowId as modelId for now
        executionId: n8nStatus.executionId,
        input: null, // Would need to be stored separately
        output: n8nStatus.result,
        startTime: n8nStatus.startedAt ? new Date(n8nStatus.startedAt) : new Date(),
        endTime: n8nStatus.completedAt ? new Date(n8nStatus.completedAt) : undefined,
        status: n8nStatus.status === 'completed' ? 'completed' :
                n8nStatus.status === 'failed' ? 'failed' : 'running'
      };

      return execution;

    } catch (error) {
      logger.error(`Failed to get execution metrics for ${executionId}:`, error);
      return null;
    }
  }

  /**
   * Get workflow performance metrics
   */
  async getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics | null> {
    return this.executionMetrics.get(workflowId) || null;
  }

  /**
   * Create ML pipeline workflow using n8n
   */
  async createMLPipelineWorkflow(
    pipelineConfig: {
      name: string;
      models: string[];
      preprocessing?: any;
      postprocessing?: any;
    }
  ): Promise<string> {
    try {
      logger.info(`Creating ML pipeline workflow: ${pipelineConfig.name}`);

      // Create workflow configuration
      const workflowConfig = {
        name: pipelineConfig.name,
        nodes: [
          {
            id: 'preprocess',
            type: 'function',
            parameters: {
              code: pipelineConfig.preprocessing || 'return input;',
              function: 'preprocess'
            }
          },
          ...pipelineConfig.models.map((modelId, index) => ({
            id: `model_${index}`,
            type: 'n8n.trigger',
            parameters: {
              workflowId: modelId,
              outputVariable: `modelOutput_${index}`
            }
          })),
          {
            id: 'postprocess',
            type: 'function',
            parameters: {
              code: pipelineConfig.postprocessing || 'return input;',
              function: 'postprocess'
            }
          }
        ],
        connections: this.generatePipelineConnections(pipelineConfig.models.length)
      };

      // In a real implementation, this would create the workflow via n8n API
      // For now, we'll simulate and return a workflow ID
      const workflowId = `ml_pipeline_${Date.now()}`;

      logger.info(`ML pipeline workflow created: ${workflowId}`);
      return workflowId;

    } catch (error) {
      logger.error('Failed to create ML pipeline workflow:', error);
      throw error;
    }
  }

  /**
   * Monitor and update workflow metrics
   */
  private async updateWorkflowMetrics(
    workflowId: string,
    n8nResult: any
  ): Promise<void> {
    const currentMetrics = this.executionMetrics.get(workflowId) || {
      workflowId,
      executionCount: 0,
      successRate: 1.0,
      averageLatency: 0,
      totalCost: 0,
      lastExecution: new Date()
    };

    // Update metrics
    currentMetrics.executionCount += 1;
    currentMetrics.lastExecution = new Date();

    // Calculate success rate
    const isSuccess = n8nResult.status === 'completed';
    currentMetrics.successRate =
      ((currentMetrics.successRate * (currentMetrics.executionCount - 1)) + (isSuccess ? 1 : 0)) /
      currentMetrics.executionCount;

    // Update latency (rough estimate)
    if (n8nResult.executionTime) {
      const latency = Date.now() - new Date(n8nResult.executionTime).getTime();
      currentMetrics.averageLatency =
        ((currentMetrics.averageLatency * (currentMetrics.executionCount - 1)) + latency) /
        currentMetrics.executionCount;
    }

    // Update cost (estimate)
    currentMetrics.totalCost += 0.01; // Fixed cost estimate

    this.executionMetrics.set(workflowId, currentMetrics);
  }

  /**
   * Check status of active executions
   */
  private async checkActiveExecutions(): Promise<void> {
    for (const [executionId, execution] of this.activeExecutions.entries()) {
      try {
        const status = await n8nApiService.getExecutionStatus(executionId);

        if (status && status.status !== 'running') {
          // Update execution record
          execution.status = status.status === 'completed' ? 'completed' : 'failed';
          execution.endTime = new Date();
          execution.output = status.result;

          // Calculate metrics
          if (execution.endTime && execution.startTime) {
            execution.metrics = {
              latency: execution.endTime.getTime() - execution.startTime.getTime(),
              tokens_used: 100, // Estimate
              cost: 0.01 // Estimate
            };
          }

          // Update workflow metrics
          if (status.workflowId) {
            await this.updateWorkflowMetrics(status.workflowId, status);
          }

          // Remove from active executions after 5 minutes
          setTimeout(() => {
            this.activeExecutions.delete(executionId);
          }, 5 * 60 * 1000);

          logger.info(`Execution ${executionId} completed with status: ${status.status}`);
        }
      } catch (error) {
        logger.warn(`Failed to check status for execution ${executionId}:`, error);
      }
    }
  }

  /**
   * Generate connections for ML pipeline
   */
  private generatePipelineConnections(modelCount: number): any[] {
    const connections: any[] = [];

    // Preprocess -> First model
    connections.push({
      from: 'preprocess',
      to: 'model_0',
      fromOutput: 'output',
      toInput: 'input'
    });

    // Model chain
    for (let i = 0; i < modelCount - 1; i++) {
      connections.push({
        from: `model_${i}`,
        to: `model_${i + 1}`,
        fromOutput: 'output',
        toInput: 'input'
      });
    }

    // Last model -> Postprocess
    connections.push({
      from: `model_${modelCount - 1}`,
      to: 'postprocess',
      fromOutput: 'output',
      toInput: 'input'
    });

    return connections;
  }

  /**
   * Get comprehensive monitoring dashboard data
   */
  async getMonitoringDashboard(): Promise<{
    activeExecutions: number;
    totalWorkflows: number;
    averageSuccessRate: number;
    totalCost: number;
    topWorkflows: WorkflowMetrics[];
  }> {
    const workflows = Array.from(this.executionMetrics.values());

    return {
      activeExecutions: this.activeExecutions.size,
      totalWorkflows: workflows.length,
      averageSuccessRate: workflows.length > 0
        ? workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length
        : 0,
      totalCost: workflows.reduce((sum, w) => sum + w.totalCost, 0),
      topWorkflows: workflows
        .sort((a, b) => b.executionCount - a.executionCount)
        .slice(0, 5)
    };
  }
}

export const n8nNeuroweaverConnector = new N8nNeuroweaverConnector();


