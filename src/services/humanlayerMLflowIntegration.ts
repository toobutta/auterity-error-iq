/**
 * HumanLayer + MLflow Integration Service
 * Provides unified workflow orchestration between human approvals,
 * ML experiments, and AI model deployments
 */

import { humanLayerService, HumanApprovalRequest, HumanApprovalResponse } from './humanLayerService';
import { enhancedMLflowService, Experiment, Run, ModelVersion } from './enhancedMLflowService';
import { unifiedAIService } from './unifiedAIService';
import { intelligentRouter, RoutingRequest } from './intelligentRouter';
import { advancedMonitoringService } from './advancedMonitoringService';

// Types and interfaces
export interface MLWorkflow {
  id: string;
  name: string;
  description: string;
  experimentId: string;
  modelName: string;
  stages: WorkflowStage[];
  status: 'draft' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface WorkflowStage {
  id: string;
  name: string;
  type: 'data_prep' | 'training' | 'validation' | 'deployment' | 'approval' | 'monitoring';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  dependencies: string[]; // IDs of stages that must complete first
  config: Record<string, any>;
  results?: any;
  approvalRequired: boolean;
  approvalRequestId?: string;
}

export interface ModelDeployment {
  id: string;
  modelName: string;
  version: string;
  workflowId: string;
  environment: 'staging' | 'production';
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'rollback';
  approvalStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
  approvalRequestId?: string;
  deploymentConfig: Record<string, any>;
  metrics: Record<string, any>;
  deployedAt?: Date;
}

export interface HumanAIWorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageCompletionTime: number;
  humanInterventionRate: number;
  approvalSuccessRate: number;
  modelDeploymentRate: number;
  timestamp: Date;
}

export class HumanLayerMLflowIntegration {
  private workflows: Map<string, MLWorkflow> = new Map();
  private deployments: Map<string, ModelDeployment> = new Map();
  private metrics: HumanAIWorkflowMetrics;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.startWorkflowMonitoring();
  }

  private initializeMetrics(): HumanAIWorkflowMetrics {
    return {
      totalWorkflows: 0,
      activeWorkflows: 0,
      completedWorkflows: 0,
      failedWorkflows: 0,
      averageCompletionTime: 0,
      humanInterventionRate: 0,
      approvalSuccessRate: 0,
      modelDeploymentRate: 0,
      timestamp: new Date()
    };
  }

  /**
   * Create a new ML workflow with human-in-the-loop stages
   */
  async createMLWorkflow(
    name: string,
    description: string,
    config: {
      experimentName: string;
      modelName: string;
      stages: Omit<WorkflowStage, 'id' | 'status' | 'results' | 'approvalRequestId'>[];
      metadata?: Record<string, any>;
    }
  ): Promise<MLWorkflow> {
    try {
      // Create MLflow experiment if it doesn't exist
      let experiment = await enhancedMLflowService.getExperimentByName(config.experimentName);
      if (!experiment) {
        experiment = await enhancedMLflowService.createExperiment(
          config.experimentName,
          `Experiment for workflow: ${name}`,
          { workflow_name: name, created_by: 'humanlayer_integration' }
        );
      }

      // Create workflow
      const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const workflow: MLWorkflow = {
        id: workflowId,
        name,
        description,
        experimentId: experiment.id,
        modelName: config.modelName,
        stages: config.stages.map((stage, index) => ({
          ...stage,
          id: `stage_${index}_${Date.now()}`,
          status: 'pending' as const,
          results: undefined,
          approvalRequestId: undefined
        })),
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: config.metadata || {}
      };

      this.workflows.set(workflowId, workflow);
      this.metrics.totalWorkflows++;

      // Log to MLflow
      await enhancedMLflowService.logWorkflowExecution(
        workflowId,
        0, // No execution time yet
        workflow.stages.length,
        false, // Not completed yet
        { workflow_name: name, stage_count: workflow.stages.length }
      );

      return workflow;

    } catch (error) {
      console.error('Failed to create ML workflow:', error);
      throw error;
    }
  }

  /**
   * Execute a workflow stage by stage with human oversight where needed
   */
  async executeWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    workflow.status = 'running';
    this.metrics.activeWorkflows++;
    const startTime = Date.now();

    try {
      for (const stage of workflow.stages) {
        await this.executeStage(workflow, stage);

        // Check if workflow should continue
        if (workflow.status === 'failed') {
          break;
        }
      }

      // Complete workflow
      if (workflow.status === 'running') {
        workflow.status = 'completed';
        this.metrics.completedWorkflows++;
      }

      // Calculate completion time
      const completionTime = Date.now() - startTime;
      this.updateAverageCompletionTime(completionTime);

      // Log final workflow execution to MLflow
      await enhancedMLflowService.logWorkflowExecution(
        workflowId,
        completionTime,
        workflow.stages.length,
        workflow.status === 'completed',
        {
          workflow_name: workflow.name,
          final_status: workflow.status,
          completion_time_ms: completionTime
        }
      );

    } catch (error) {
      workflow.status = 'failed';
      this.metrics.failedWorkflows++;
      console.error(`Workflow ${workflowId} failed:`, error);
      throw error;
    } finally {
      this.metrics.activeWorkflows--;
      workflow.updatedAt = new Date();
    }
  }

  /**
   * Execute a single workflow stage
   */
  private async executeStage(workflow: MLWorkflow, stage: WorkflowStage): Promise<void> {
    stage.status = 'running';

    try {
      // Execute based on stage type
      switch (stage.type) {
        case 'data_prep':
          await this.executeDataPreparationStage(workflow, stage);
          break;
        case 'training':
          await this.executeTrainingStage(workflow, stage);
          break;
        case 'validation':
          await this.executeValidationStage(workflow, stage);
          break;
        case 'deployment':
          await this.executeDeploymentStage(workflow, stage);
          break;
        case 'approval':
          await this.executeApprovalStage(workflow, stage);
          break;
        case 'monitoring':
          await this.executeMonitoringStage(workflow, stage);
          break;
        default:
          throw new Error(`Unknown stage type: ${stage.type}`);
      }

      stage.status = 'completed';

    } catch (error) {
      stage.status = 'failed';
      workflow.status = 'failed';
      console.error(`Stage ${stage.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Execute data preparation stage
   */
  private async executeDataPreparationStage(workflow: MLWorkflow, stage: WorkflowStage): Promise<void> {
    // Route to appropriate AI service for data preprocessing
    const routingRequest: RoutingRequest = {
      id: `data_prep_${stage.id}`,
      type: 'ai-analysis',
      priority: 'medium',
      requirements: {
        capabilities: ['data-preprocessing', 'feature-engineering'],
        dataSize: stage.config.expectedDataSize || 1000
      },
      payload: {
        operation: 'data_preparation',
        config: stage.config,
        workflowId: workflow.id,
        stageId: stage.id
      },
      metadata: {
        workflowId: workflow.id,
        stageName: stage.name
      }
    };

    const result = await intelligentRouter.routeRequest(routingRequest);

    if (result.success) {
      stage.results = result.executionResult;
    } else {
      throw new Error(`Data preparation failed: ${result.error}`);
    }
  }

  /**
   * Execute training stage
   */
  private async executeTrainingStage(workflow: MLWorkflow, stage: WorkflowStage): Promise<void> {
    // Start MLflow run for training
    const runResponse = await enhancedMLflowService.startRun(workflow.experimentId, {
      run_name: `${workflow.name}_${stage.name}`,
      tags: {
        workflow_id: workflow.id,
        stage_id: stage.id,
        stage_type: 'training'
      }
    });

    try {
      // Route training to appropriate AI service
      const routingRequest: RoutingRequest = {
        id: `training_${stage.id}`,
        type: 'ai-generation',
        priority: 'high',
        requirements: {
          capabilities: ['model-training', 'gpu-acceleration'],
          dataSize: stage.config.trainingDataSize || 10000
        },
        payload: {
          operation: 'model_training',
          config: stage.config,
          workflowId: workflow.id,
          stageId: stage.id,
          mlflowRunId: runResponse.run.info.run_id
        },
        metadata: {
          workflowId: workflow.id,
          mlflowRunId: runResponse.run.info.run_id
        }
      };

      const result = await intelligentRouter.routeRequest(routingRequest);

      if (result.success) {
        stage.results = result.executionResult;

        // Log training metrics to MLflow
        if (stage.results.metrics) {
          await enhancedMLflowService.logToRun(
            runResponse.run.info.run_id,
            stage.results.metrics,
            stage.config.parameters || {},
            {
              training_completed: 'true',
              workflow_id: workflow.id
            }
          );
        }
      } else {
        throw new Error(`Training failed: ${result.error}`);
      }

    } finally {
      // End MLflow run
      await enhancedMLflowService.endRun(runResponse.run.info.run_id);
    }
  }

  /**
   * Execute validation stage
   */
  private async executeValidationStage(workflow: MLWorkflow, stage: WorkflowStage): Promise<void> {
    // Route validation to appropriate AI service
    const routingRequest: RoutingRequest = {
      id: `validation_${stage.id}`,
      type: 'ai-analysis',
      priority: 'medium',
      requirements: {
        capabilities: ['model-validation', 'performance-metrics'],
        dataSize: stage.config.validationDataSize || 1000
      },
      payload: {
        operation: 'model_validation',
        config: stage.config,
        workflowId: workflow.id,
        stageId: stage.id,
        modelResults: workflow.stages.find(s => s.type === 'training')?.results
      },
      metadata: {
        workflowId: workflow.id,
        stageName: stage.name
      }
    };

    const result = await intelligentRouter.routeRequest(routingRequest);

    if (result.success) {
      stage.results = result.executionResult;

      // Check if validation meets thresholds
      if (stage.config.validationThresholds) {
        const meetsThresholds = this.checkValidationThresholds(
          stage.results.metrics,
          stage.config.validationThresholds
        );

        if (!meetsThresholds) {
          // May require human intervention
          stage.status = 'waiting_approval';
          await this.requestValidationApproval(workflow, stage);
          return;
        }
      }
    } else {
      throw new Error(`Validation failed: ${result.error}`);
    }
  }

  /**
   * Execute deployment stage
   */
  private async executeDeploymentStage(workflow: MLWorkflow, stage: WorkflowStage): Promise<void> {
    if (stage.approvalRequired && !stage.approvalRequestId) {
      // Request human approval for deployment
      stage.status = 'waiting_approval';
      await this.requestDeploymentApproval(workflow, stage);
      return;
    }

    // Create model deployment
    const deployment = await this.createModelDeployment(workflow, stage);

    // Route deployment to appropriate service
    const routingRequest: RoutingRequest = {
      id: `deployment_${stage.id}`,
      type: 'workflow',
      priority: 'high',
      requirements: {
        capabilities: ['model-deployment', 'infrastructure-management'],
        reliability: 0.99 // High reliability required for production
      },
      payload: {
        operation: 'model_deployment',
        deploymentConfig: deployment,
        workflowId: workflow.id,
        stageId: stage.id
      },
      metadata: {
        workflowId: workflow.id,
        deploymentId: deployment.id
      }
    };

    const result = await intelligentRouter.routeRequest(routingRequest);

    if (result.success) {
      stage.results = result.executionResult;
      deployment.status = 'deployed';
      deployment.deployedAt = new Date();

      // Transition model to production in MLflow
      await enhancedMLflowService.transitionModelVersion(
        workflow.modelName,
        deployment.version,
        'Production'
      );
    } else {
      deployment.status = 'failed';
      throw new Error(`Deployment failed: ${result.error}`);
    }
  }

  /**
   * Execute approval stage
   */
  private async executeApprovalStage(workflow: MLWorkflow, stage: WorkflowStage): Promise<void> {
    if (!stage.approvalRequestId) {
      await this.requestCustomApproval(workflow, stage);
      stage.status = 'waiting_approval';
      return;
    }

    // Check approval status
    const approvalStatus = await humanLayerService.getApprovalStatus(stage.approvalRequestId);

    if (approvalStatus.status === 'approved') {
      stage.status = 'completed';
      stage.results = { approved: true, approvalDetails: approvalStatus };
    } else if (approvalStatus.status === 'rejected') {
      stage.status = 'failed';
      stage.results = { approved: false, approvalDetails: approvalStatus };
      workflow.status = 'failed';
    } else if (approvalStatus.status === 'expired') {
      // Request new approval
      stage.approvalRequestId = undefined;
      stage.status = 'pending';
    }
    // If still pending, stay in waiting_approval status
  }

  /**
   * Execute monitoring stage
   */
  private async executeMonitoringStage(workflow: MLWorkflow, stage: WorkflowStage): Promise<void> {
    // Set up monitoring for the deployed model
    const monitoringConfig = {
      modelName: workflow.modelName,
      deploymentId: stage.config.deploymentId,
      metrics: stage.config.monitoringMetrics || ['accuracy', 'latency', 'throughput'],
      alertThresholds: stage.config.alertThresholds || {},
      workflowId: workflow.id,
      stageId: stage.id
    };

    // Route monitoring setup
    const routingRequest: RoutingRequest = {
      id: `monitoring_${stage.id}`,
      type: 'scheduled',
      priority: 'low',
      requirements: {
        capabilities: ['monitoring', 'alerting'],
        reliability: 0.95
      },
      payload: {
        operation: 'setup_monitoring',
        config: monitoringConfig,
        workflowId: workflow.id,
        stageId: stage.id
      },
      metadata: {
        workflowId: workflow.id,
        monitoringType: 'model_performance'
      }
    };

    const result = await intelligentRouter.routeRequest(routingRequest);

    if (result.success) {
      stage.results = result.executionResult;
    } else {
      throw new Error(`Monitoring setup failed: ${result.error}`);
    }
  }

  /**
   * Request human approval for validation issues
   */
  private async requestValidationApproval(workflow: MLWorkflow, stage: WorkflowStage): Promise<void> {
    const approvalRequest: HumanApprovalRequest = {
      id: `validation_approval_${stage.id}`,
      type: 'ai_decision',
      title: `Model Validation Review: ${workflow.name}`,
      description: `Model validation metrics do not meet required thresholds. Please review and decide next steps.`,
      context: {
        workflowId: workflow.id,
        workflowName: workflow.name,
        stageName: stage.name,
        validationResults: stage.results,
        thresholds: stage.config.validationThresholds
      },
      options: [
        { label: 'Proceed with deployment', value: 'proceed', recommended: false },
        { label: 'Retrigger training', value: 'retrain' },
        { label: 'Adjust thresholds', value: 'adjust_thresholds' },
        { label: 'Cancel workflow', value: 'cancel' }
      ],
      urgency: 'high',
      timeout: 3600, // 1 hour
      metadata: {
        workflowId: workflow.id,
        stageId: stage.id,
        type: 'validation_review'
      }
    };

    const response = await humanLayerService.requestApproval(approvalRequest);
    stage.approvalRequestId = approvalRequest.id;

    // Handle immediate response if approval service supports it
    if (response.approved) {
      await this.handleValidationApproval(workflow, stage, response);
    }
  }

  /**
   * Request human approval for deployment
   */
  private async requestDeploymentApproval(workflow: MLWorkflow, stage: WorkflowStage): Promise<void> {
    const approvalRequest: HumanApprovalRequest = {
      id: `deployment_approval_${stage.id}`,
      type: 'workflow_approval',
      title: `Model Deployment Approval: ${workflow.name}`,
      description: `Please review and approve deployment of ${workflow.modelName} to production.`,
      context: {
        workflowId: workflow.id,
        workflowName: workflow.name,
        modelName: workflow.modelName,
        validationResults: workflow.stages.find(s => s.type === 'validation')?.results,
        deploymentConfig: stage.config
      },
      options: [
        { label: 'Approve deployment', value: 'approve', recommended: true },
        { label: 'Deploy to staging first', value: 'staging' },
        { label: 'Request changes', value: 'changes' },
        { label: 'Reject deployment', value: 'reject' }
      ],
      urgency: 'critical',
      timeout: 7200, // 2 hours
      metadata: {
        workflowId: workflow.id,
        stageId: stage.id,
        type: 'deployment_approval'
      }
    };

    const response = await humanLayerService.requestApproval(approvalRequest);
    stage.approvalRequestId = approvalRequest.id;

    // Handle immediate response
    if (response.approved) {
      await this.handleDeploymentApproval(workflow, stage, response);
    }
  }

  /**
   * Request custom approval
   */
  private async requestCustomApproval(workflow: MLWorkflow, stage: WorkflowStage): Promise<void> {
    const approvalRequest: HumanApprovalRequest = {
      id: `custom_approval_${stage.id}`,
      type: 'workflow_approval',
      title: stage.config.approvalTitle || `Approval Required: ${stage.name}`,
      description: stage.config.approvalDescription || `Please review and approve: ${stage.name}`,
      context: {
        workflowId: workflow.id,
        stageId: stage.id,
        stageConfig: stage.config,
        workflowContext: workflow.metadata
      },
      options: stage.config.approvalOptions || [
        { label: 'Approve', value: 'approve', recommended: true },
        { label: 'Reject', value: 'reject' },
        { label: 'Request Changes', value: 'changes' }
      ],
      urgency: stage.config.approvalUrgency || 'medium',
      timeout: stage.config.approvalTimeout || 1800, // 30 minutes
      metadata: {
        workflowId: workflow.id,
        stageId: stage.id,
        type: 'custom_approval'
      }
    };

    const response = await humanLayerService.requestApproval(approvalRequest);
    stage.approvalRequestId = approvalRequest.id;

    // Handle immediate response
    if (response.approved) {
      stage.status = 'completed';
      stage.results = { approved: true, approvalDetails: response };
    } else if (response.approved === false) {
      stage.status = 'failed';
      stage.results = { approved: false, approvalDetails: response };
      workflow.status = 'failed';
    }
  }

  /**
   * Handle validation approval response
   */
  private async handleValidationApproval(
    workflow: MLWorkflow,
    stage: WorkflowStage,
    approval: HumanApprovalResponse
  ): Promise<void> {
    switch (approval.selectedOption) {
      case 'proceed':
        stage.status = 'completed';
        break;
      case 'retrain':
        // Reset training stage and continue
        const trainingStage = workflow.stages.find(s => s.type === 'training');
        if (trainingStage) {
          trainingStage.status = 'pending';
          trainingStage.results = undefined;
        }
        stage.status = 'completed';
        break;
      case 'adjust_thresholds':
        // Would need human input for new thresholds
        stage.status = 'completed';
        break;
      case 'cancel':
        workflow.status = 'failed';
        stage.status = 'failed';
        break;
    }
  }

  /**
   * Handle deployment approval response
   */
  private async handleDeploymentApproval(
    workflow: MLWorkflow,
    stage: WorkflowStage,
    approval: HumanApprovalResponse
  ): Promise<void> {
    switch (approval.selectedOption) {
      case 'approve':
        stage.status = 'completed';
        break;
      case 'staging':
        stage.config.environment = 'staging';
        stage.status = 'completed';
        break;
      case 'changes':
        // Would need to collect change requirements
        stage.status = 'pending';
        break;
      case 'reject':
        workflow.status = 'failed';
        stage.status = 'failed';
        break;
    }
  }

  /**
   * Create model deployment
   */
  private async createModelDeployment(workflow: MLWorkflow, stage: WorkflowStage): Promise<ModelDeployment> {
    const trainingStage = workflow.stages.find(s => s.type === 'training');
    const runId = trainingStage?.results?.mlflowRunId;

    if (!runId) {
      throw new Error('No training run ID found for deployment');
    }

    // Create model version in MLflow
    const modelVersion = await enhancedMLflowService.createModelVersion(
      workflow.modelName,
      `runs:/${runId}/model`,
      runId
    );

    const deployment: ModelDeployment = {
      id: `deployment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelName: workflow.modelName,
      version: modelVersion.version,
      workflowId: workflow.id,
      environment: stage.config.environment || 'production',
      status: 'pending',
      approvalStatus: stage.approvalRequired ? 'approved' : 'not_required',
      approvalRequestId: stage.approvalRequestId,
      deploymentConfig: stage.config,
      metrics: {},
      deployedAt: undefined
    };

    this.deployments.set(deployment.id, deployment);
    return deployment;
  }

  /**
   * Check if validation metrics meet thresholds
   */
  private checkValidationThresholds(metrics: Record<string, number>, thresholds: Record<string, number>): boolean {
    for (const [metric, threshold] of Object.entries(thresholds)) {
      const value = metrics[metric];
      if (value === undefined || value < threshold) {
        return false;
      }
    }
    return true;
  }

  /**
   * Update average completion time
   */
  private updateAverageCompletionTime(completionTime: number): void {
    const totalCompleted = this.metrics.completedWorkflows;
    const currentAverage = this.metrics.averageCompletionTime;

    // Calculate new average
    this.metrics.averageCompletionTime =
      (currentAverage * (totalCompleted - 1) + completionTime) / totalCompleted;
  }

  /**
   * Start workflow monitoring
   */
  private startWorkflowMonitoring(): void {
    // Monitor workflows every 30 seconds
    setInterval(async () => {
      await this.monitorWorkflows();
    }, 30000);

    // Update metrics every 5 minutes
    setInterval(() => {
      this.updateMetrics();
    }, 300000);
  }

  /**
   * Monitor running workflows
   */
  private async monitorWorkflows(): Promise<void> {
    for (const [workflowId, workflow] of this.workflows.entries()) {
      if (workflow.status === 'running') {
        // Check for stages waiting for approval
        const waitingStages = workflow.stages.filter(s => s.status === 'waiting_approval');

        for (const stage of waitingStages) {
          if (stage.approvalRequestId) {
            try {
              const approvalStatus = await humanLayerService.getApprovalStatus(stage.approvalRequestId);

              if (approvalStatus.status === 'approved') {
                await this.handleApprovalResponse(workflow, stage, approvalStatus);
              } else if (approvalStatus.status === 'rejected') {
                stage.status = 'failed';
                workflow.status = 'failed';
              } else if (approvalStatus.status === 'expired') {
                // Could retry approval or notify
                console.warn(`Approval expired for stage ${stage.id}`);
              }
            } catch (error) {
              console.error(`Failed to check approval status for stage ${stage.id}:`, error);
            }
          }
        }
      }
    }
  }

  /**
   * Handle approval response
   */
  private async handleApprovalResponse(
    workflow: MLWorkflow,
    stage: WorkflowStage,
    approvalStatus: any
  ): Promise<void> {
    if (stage.type === 'approval') {
      stage.status = 'completed';
      stage.results = { approved: true, approvalDetails: approvalStatus };
    } else if (stage.type === 'deployment') {
      await this.handleDeploymentApproval(workflow, stage, approvalStatus);
    } else if (stage.type === 'validation') {
      await this.handleValidationApproval(workflow, stage, approvalStatus);
    }
  }

  /**
   * Update workflow metrics
   */
  private updateMetrics(): void {
    const workflows = Array.from(this.workflows.values());

    this.metrics.activeWorkflows = workflows.filter(w => w.status === 'running').length;
    this.metrics.completedWorkflows = workflows.filter(w => w.status === 'completed').length;
    this.metrics.failedWorkflows = workflows.filter(w => w.status === 'failed').length;

    // Calculate human intervention rate
    const stagesWithApprovals = workflows.flatMap(w => w.stages).filter(s => s.approvalRequired);
    if (stagesWithApprovals.length > 0) {
      this.metrics.humanInterventionRate = stagesWithApprovals.length / workflows.length;
    }

    // Calculate approval success rate
    const completedApprovals = stagesWithApprovals.filter(s => s.approvalRequestId && s.status === 'completed');
    if (completedApprovals.length > 0) {
      this.metrics.approvalSuccessRate = completedApprovals.length / stagesWithApprovals.length;
    }

    // Calculate model deployment rate
    const deploymentStages = workflows.flatMap(w => w.stages).filter(s => s.type === 'deployment');
    const successfulDeployments = deploymentStages.filter(s => s.status === 'completed');
    if (deploymentStages.length > 0) {
      this.metrics.modelDeploymentRate = successfulDeployments.length / deploymentStages.length;
    }

    this.metrics.timestamp = new Date();
  }

  /**
   * Get workflow metrics
   */
  getMetrics(): HumanAIWorkflowMetrics {
    return { ...this.metrics };
  }

  /**
   * Get all workflows
   */
  getWorkflows(): MLWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): MLWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all deployments
   */
  getDeployments(): ModelDeployment[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Get deployment by ID
   */
  getDeployment(deploymentId: string): ModelDeployment | undefined {
    return this.deployments.get(deploymentId);
  }
}

// Export singleton instance
export const humanLayerMLflowIntegration = new HumanLayerMLflowIntegration();

