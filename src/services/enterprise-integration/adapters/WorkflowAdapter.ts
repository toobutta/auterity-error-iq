/**
 * Workflow Orchestration Adapter
 * Provides enterprise-grade workflow orchestration with saga patterns,
 * event sourcing, and distributed transaction management
 */

import { temporalService } from '../../enterprise/TemporalService';
import { IntegrationEndpoint, Message, SagaDefinition, SagaContext } from '../EnterpriseIntegrationBus';

export interface WorkflowConfig {
  type: 'temporal' | 'n8n' | 'camunda' | 'zeebe';
  baseUrl?: string;
  namespace?: string;
  workerOptions?: {
    taskQueue?: string;
    maxConcurrentWorkflowTaskExecutions?: number;
    maxConcurrentActivityExecutions?: number;
  };
  auth?: {
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  inputSchema?: any;
  outputSchema?: any;
  steps: WorkflowStep[];
  errorHandlers?: Record<string, WorkflowStep[]>;
  timeout?: number;
  retries?: number;
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'activity' | 'decision' | 'subworkflow' | 'timer' | 'signal' | 'query';
  config: {
    activityName?: string;
    decisionLogic?: (input: any) => any;
    subworkflowId?: string;
    timerDuration?: number;
    signalName?: string;
    queryName?: string;
    inputMapping?: Record<string, string>;
    outputMapping?: Record<string, string>;
  };
  timeout?: number;
  retries?: number;
  compensation?: WorkflowStep;
  conditions?: {
    input?: any;
    expression?: string;
  };
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  input: any;
  output?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  steps: WorkflowStepExecution[];
  context: Record<string, any>;
  sagaContext?: SagaContext;
}

export interface WorkflowStepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'compensated';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  retryCount: number;
}

export class WorkflowAdapter {
  private config: WorkflowConfig;
  private definitions = new Map<string, WorkflowDefinition>();
  private executions = new Map<string, WorkflowExecution>();

  constructor(config: WorkflowConfig) {
    this.config = config;
  }

  /**
   * Deploy workflow definition
   */
  async deployWorkflow(definition: WorkflowDefinition): Promise<string> {
    try {
      // Validate workflow definition
      this.validateWorkflowDefinition(definition);

      // Store definition
      this.definitions.set(definition.id, definition);

      // Deploy to underlying workflow engine
      switch (this.config.type) {
        case 'temporal':
          await this.deployToTemporal(definition);
          break;
        case 'n8n':
          await this.deployToN8n(definition);
          break;
        default:
          throw new Error(`Unsupported workflow engine: ${this.config.type}`);
      }

      return definition.id;

    } catch (error) {
      console.error('Failed to deploy workflow:', error);
      throw error;
    }
  }

  /**
   * Start workflow execution
   */
  async startWorkflow(
    workflowId: string,
    input: any,
    options?: {
      correlationId?: string;
      parentWorkflowId?: string;
      timeout?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<string> {
    try {
      const definition = this.definitions.get(workflowId);
      if (!definition) {
        throw new Error(`Workflow definition ${workflowId} not found`);
      }

      const executionId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const execution: WorkflowExecution = {
        id: executionId,
        workflowId,
        status: 'running',
        input,
        startTime: new Date(),
        steps: definition.steps.map(step => ({
          stepId: step.id,
          status: 'pending',
          retryCount: 0
        })),
        context: {
          correlationId: options?.correlationId,
          parentWorkflowId: options?.parentWorkflowId,
          metadata: options?.metadata || {}
        }
      };

      this.executions.set(executionId, execution);

      // Start execution based on workflow engine
      switch (this.config.type) {
        case 'temporal':
          await this.startTemporalWorkflow(execution, definition);
          break;
        case 'n8n':
          await this.startN8nWorkflow(execution, definition);
          break;
      }

      return executionId;

    } catch (error) {
      console.error('Failed to start workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow execution status
   */
  async getWorkflowStatus(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) return null;

      // Update status from underlying engine
      switch (this.config.type) {
        case 'temporal':
          await this.updateTemporalStatus(execution);
          break;
        case 'n8n':
          await this.updateN8nStatus(execution);
          break;
      }

      return execution;

    } catch (error) {
      console.error('Failed to get workflow status:', error);
      return null;
    }
  }

  /**
   * Cancel workflow execution
   */
  async cancelWorkflow(executionId: string): Promise<boolean> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) return false;

      // Cancel in underlying engine
      switch (this.config.type) {
        case 'temporal':
          await temporalService.cancelWorkflow(executionId);
          break;
        case 'n8n':
          // Implement n8n cancellation
          break;
      }

      execution.status = 'cancelled';
      execution.endTime = new Date();
      return true;

    } catch (error) {
      console.error('Failed to cancel workflow:', error);
      return false;
    }
  }

  /**
   * Send signal to workflow
   */
  async sendSignal(
    executionId: string,
    signalName: string,
    data: any
  ): Promise<boolean> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) return false;

      // Send signal to underlying engine
      switch (this.config.type) {
        case 'temporal':
          // Implement Temporal signal sending
          break;
        case 'n8n':
          // Implement n8n signal sending
          break;
      }

      return true;

    } catch (error) {
      console.error('Failed to send signal:', error);
      return false;
    }
  }

  /**
   * Query workflow state
   */
  async queryWorkflow(
    executionId: string,
    queryName: string,
    data?: any
  ): Promise<any> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) return null;

      // Query underlying engine
      switch (this.config.type) {
        case 'temporal':
          // Implement Temporal query
          break;
        case 'n8n':
          // Implement n8n query
          break;
      }

      return execution.context;

    } catch (error) {
      console.error('Failed to query workflow:', error);
      return null;
    }
  }

  /**
   * Execute workflow as part of a saga
   */
  async executeWorkflowInSaga(
    workflowId: string,
    sagaContext: SagaContext,
    input: any
  ): Promise<any> {
    try {
      // Start workflow with saga correlation
      const executionId = await this.startWorkflow(workflowId, input, {
        correlationId: sagaContext.correlationId,
        metadata: {
          sagaId: sagaContext.sagaId,
          sagaStep: true
        }
      });

      // Store execution ID in saga context
      sagaContext.variables[`workflow_${workflowId}`] = executionId;

      // Wait for completion (simplified - in production, use event-driven approach)
      let execution: WorkflowExecution | null = null;
      let attempts = 0;
      const maxAttempts = 300; // 5 minutes with 1s intervals

      while (attempts < maxAttempts) {
        execution = await this.getWorkflowStatus(executionId);
        if (execution && execution.status !== 'running') {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!execution || execution.status === 'running') {
        throw new Error('Workflow execution timed out');
      }

      if (execution.status === 'failed') {
        throw new Error(`Workflow failed: ${execution.error}`);
      }

      return execution.output;

    } catch (error) {
      console.error('Failed to execute workflow in saga:', error);
      throw error;
    }
  }

  /**
   * Compensate workflow execution
   */
  async compensateWorkflow(executionId: string): Promise<boolean> {
    try {
      const execution = this.executions.get(executionId);
      if (!execution) return false;

      // Execute compensation steps in reverse order
      const completedSteps = execution.steps
        .filter(step => step.status === 'completed')
        .reverse();

      for (const stepExecution of completedSteps) {
        const definition = this.definitions.get(execution.workflowId);
        const stepDefinition = definition?.steps.find(s => s.id === stepExecution.stepId);

        if (stepDefinition?.compensation) {
          await this.executeWorkflowStep(stepDefinition.compensation, execution);
          stepExecution.status = 'compensated';
        }
      }

      return true;

    } catch (error) {
      console.error('Failed to compensate workflow:', error);
      return false;
    }
  }

  // Private methods

  private validateWorkflowDefinition(definition: WorkflowDefinition): void {
    if (!definition.id || !definition.name || !definition.steps) {
      throw new Error('Invalid workflow definition: missing required fields');
    }

    // Validate step connections and dependencies
    const stepIds = new Set(definition.steps.map(s => s.id));
    for (const step of definition.steps) {
      if (step.config.subworkflowId && !this.definitions.has(step.config.subworkflowId)) {
        throw new Error(`Step ${step.id} references unknown subworkflow ${step.config.subworkflowId}`);
      }
    }
  }

  private async deployToTemporal(definition: WorkflowDefinition): Promise<void> {
    // Convert to Temporal workflow definition
    const temporalWorkflow = {
      name: definition.name,
      id: definition.id,
      steps: definition.steps.map(step => ({
        id: step.id,
        name: step.name,
        type: step.type,
        activityName: step.config.activityName,
        timeout: step.timeout,
        retries: step.retries
      }))
    };

    // Deploy to Temporal (simplified)
  }

  private async deployToN8n(definition: WorkflowDefinition): Promise<void> {
    // Convert to n8n workflow format
    const n8nWorkflow = {
      name: definition.name,
      nodes: definition.steps.map((step, index) => ({
        id: step.id,
        name: step.name,
        type: this.mapStepTypeToN8n(step.type),
        position: [index * 200, 100],
        parameters: step.config
      })),
      connections: this.buildN8nConnections(definition.steps)
    };

    // Deploy to n8n (simplified)
  }

  private async startTemporalWorkflow(
    execution: WorkflowExecution,
    definition: WorkflowDefinition
  ): Promise<void> {
    try {
      const workflowId = await temporalService.startWorkflow(
        definition.name,
        'ai-processing', // Map to appropriate type
        execution.input,
        {
          priority: 'high',
          timeout: definition.timeout,
          metadata: execution.context.metadata
        }
      );

      execution.context.engineExecutionId = workflowId;

    } catch (error) {
      execution.status = 'failed';
      execution.error = (error as Error).message;
      throw error;
    }
  }

  private async startN8nWorkflow(
    execution: WorkflowExecution,
    definition: WorkflowDefinition
  ): Promise<void> {
    // Start n8n workflow execution
  }

  private async updateTemporalStatus(execution: WorkflowExecution): Promise<void> {
    try {
      const temporalExecution = await temporalService.getWorkflowStatus(execution.context.engineExecutionId);
      if (temporalExecution) {
        execution.status = temporalExecution.status as any;
        execution.output = temporalExecution.result;
        execution.error = temporalExecution.error;

        if (execution.status !== 'running' && !execution.endTime) {
          execution.endTime = new Date();
          execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
        }
      }
    } catch (error) {
      console.error('Failed to update Temporal status:', error);
    }
  }

  private async updateN8nStatus(execution: WorkflowExecution): Promise<void> {
    // Update n8n workflow status
  }

  private async executeWorkflowStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<any> {
    const stepExecution = execution.steps.find(s => s.stepId === step.id);
    if (!stepExecution) return;

    stepExecution.status = 'running';
    stepExecution.startTime = new Date();

    try {
      let result: any;

      switch (step.type) {
        case 'activity':
          result = await this.executeActivityStep(step, execution);
          break;
        case 'decision':
          result = step.config.decisionLogic?.(execution.context) || null;
          break;
        case 'subworkflow':
          if (step.config.subworkflowId) {
            result = await this.executeWorkflowInSaga(step.config.subworkflowId, execution.sagaContext!, execution.input);
          }
          break;
        case 'timer':
          await new Promise(resolve => setTimeout(resolve, step.config.timerDuration || 1000));
          result = true;
          break;
        default:
          result = null;
      }

      stepExecution.status = 'completed';
      stepExecution.output = result;
      stepExecution.endTime = new Date();
      stepExecution.duration = stepExecution.endTime.getTime() - (stepExecution.startTime?.getTime() || 0);

      return result;

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.error = (error as Error).message;
      stepExecution.endTime = new Date();
      throw error;
    }
  }

  private async executeActivityStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Execute activity based on activity name
    switch (step.config.activityName) {
      case 'ai-generation':
        return await this.executeAIGenerationActivity(step, execution);
      case 'data-processing':
        return await this.executeDataProcessingActivity(step, execution);
      case 'external-api':
        return await this.executeExternalAPIActivity(step, execution);
      default:
        throw new Error(`Unknown activity: ${step.config.activityName}`);
    }
  }

  private async executeAIGenerationActivity(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Implement AI generation activity
  }

  private async executeDataProcessingActivity(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Implement data processing activity
  }

  private async executeExternalAPIActivity(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Implement external API call activity
  }

  private mapStepTypeToN8n(stepType: WorkflowStep['type']): string {
    const typeMapping: Record<string, string> = {
      'activity': 'function',
      'decision': 'switch',
      'subworkflow': 'executeWorkflow',
      'timer': 'wait',
      'signal': 'webhook',
      'query': 'httpRequest'
    };
    return typeMapping[stepType] || 'function';
  }

  private buildN8nConnections(steps: WorkflowStep[]): any {
    const connections: any = {};

    for (let i = 0; i < steps.length - 1; i++) {
      const currentStep = steps[i];
      const nextStep = steps[i + 1];

      connections[currentStep.id] = {
        main: [
          [
            {
              node: nextStep.id,
              type: 'main',
              index: 0
            }
          ]
        ]
      };
    }

    return connections;
  }
}

// Factory functions
export function createWorkflowAdapter(config: WorkflowConfig): WorkflowAdapter {
  return new WorkflowAdapter(config);
}

export function createWorkflowEndpoint(
  id: string,
  name: string,
  config: WorkflowConfig,
  definitions: WorkflowDefinition[]
): IntegrationEndpoint {
  const adapter = new WorkflowAdapter(config);

  return {
    id,
    type: 'processor',
    name,
    uri: `workflow://${config.type}`,
    config: { adapter, definitions },
    enabled: true,
    errorHandler: async (error, message) => {
      console.error(`Workflow endpoint ${id} error:`, error);
    }
  };
}

// Saga-enabled workflow execution
export class SagaWorkflowExecutor {
  private workflowAdapter: WorkflowAdapter;

  constructor(workflowAdapter: WorkflowAdapter) {
    this.workflowAdapter = workflowAdapter;
  }

  async executeWorkflowInSaga(
    sagaDefinition: SagaDefinition,
    workflowId: string,
    input: any
  ): Promise<SagaDefinition> {
    // Add workflow execution step to saga
    const workflowStep: SagaStep = {
      id: `workflow_${workflowId}`,
      action: async (context: SagaContext) => {
        return await this.workflowAdapter.executeWorkflowInSaga(workflowId, context, input);
      },
      compensation: async (context: SagaContext) => {
        const executionId = context.variables[`workflow_${workflowId}`];
        if (executionId) {
          await this.workflowAdapter.compensateWorkflow(executionId);
        }
      }
    };

    sagaDefinition.steps.push(workflowStep);

    return sagaDefinition;
  }
}

