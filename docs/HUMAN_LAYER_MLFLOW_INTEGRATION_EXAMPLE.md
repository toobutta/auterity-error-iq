

# HumanLayer

 + MLflow Integration Examp

l

e

This document provides a complete working example of using the HumanLayer and MLflow integration within the Auterity platform.

#

# Scenario: Customer Churn Prediction Pipelin

e

We'll build a complete ML pipeline that includes human oversight at critical decision points, combining automated ML processes with human expertise.

#

# Complete Implementatio

n

#

##

 1. Setup and Configurati

o

n

```typescript
// src/examples/customerChurnPipeline.ts
import { humanLayerMLflowIntegration } from '../services/humanlayerMLflowIntegration';
import { HumanLayerMLflowDashboard } from '../components/humanlayer-mlflow/HumanLayerMLflowDashboard'

;

/*

* * Customer Churn Prediction Pipeline with Human Oversigh

t

 * This example demonstrates a complete ML workflow with human-in-the-loo

p
 */

export class CustomerChurnPipeline {
  private workflowId: string | null = null;

  /*

* * Initialize the customer churn prediction pipelin

e
   */

  async initialize() {
    console.log('🚀 Initializing Customer Churn Prediction Pipeline');

    const workflow = await humanLayerMLflowIntegration.createMLWorkflow(
      'Customer Churn Prediction Pipeline',
      'End-to-end ML pipeline for predicting customer churn with human oversight',

      {
        experimentName: 'customer_churn_prediction_v3',
        modelName: 'churn_predictor',
        stages: [
          {
            name: 'Data Acquisition & Validation',
            type: 'data_prep',
            config: {
              dataSource: 'customer_database',
              validationRules: {
                requiredColumns: ['customer_id', 'tenure', 'monthly_charges', 'total_charges'],
                dataQualityChecks: ['null_check', 'duplicate_check', 'outlier_detection']
              },
              expectedDataSize: 10000
            },
            approvalRequired: false,
            dependencies: []
          },
          {
            name: 'Feature Engineering',
            type: 'data_prep',
            config: {
              features: [
                'tenure_months',
                'monthly_charges',
                'total_charges',
                'contract_type_encoded',
                'payment_method_encoded',
                'churn_risk_score'
              ],
              transformations: [
                'log_transform_charges',
                'encode_categorical_features',
                'create_interaction_features'
              ]
            },
            approvalRequired: false,
            dependencies: ['Data Acquisition & Validation']
          },
          {
            name: 'Model Training',
            type: 'training',
            config: {
              algorithm: 'xgboost',
              parameters: {
                max_depth: 6,
                learning_rate: 0.1,

                n_estimators: 100,
                subsample: 0.8,

                colsample_bytree: 0.8

              },
              crossValidation: {
                folds: 5,
                metrics: ['accuracy', 'precision', 'recall', 'f1_score', 'auc']
              },
              earlyStopping: {
                rounds: 20,
                metric: 'auc',
                maximize: true
              }
            },
            approvalRequired: false,
            dependencies: ['Feature Engineering']
          },
          {
            name: 'Model Validation & Quality Assurance',
            type: 'validation',
            config: {
              validationDataset: 'holdout_set.csv',
              validationThresholds: {
                accuracy: 0.85,

                precision: 0.80,

                recall: 0.75,

                auc: 0.90,

                business_impact_score: 0.82

              },
              fairnessChecks: {
                protectedAttributes: ['gender', 'age_group', 'geographic_region'],
                fairnessMetrics: ['demographic_parity', 'equal_opportunity']
              },
              stabilityTests: {
                featureDriftThreshold: 0.1,

                predictionDriftThreshold: 0.15

              }
            },
            approvalRequired: true,
            dependencies: ['Model Training']
          },
          {
            name: 'Production Deployment Approval',
            type: 'approval',
            config: {
              approvalTitle: 'Customer Churn Model Deployment to Production',
              approvalDescription: `
                The customer churn prediction model has passed all validation checks.
                Please review the following before approving production deployment:

                • Model Performance: Meets all accuracy thresholds
                • Business Impact: Expected 15% improvement in churn prevention
                • Risk Assessment: Low risk of unintended consequences
                • Compliance: Passes all regulatory requirements
                • Fallback Plan: Previous model remains active during transition
              `,
              approvalOptions: [
                { label: 'Deploy to Production', value: 'deploy_production', recommended: true },
                { label: 'Deploy to Staging First', value: 'deploy_staging' },
                { label: 'Request Additional Testing', value: 'additional_testing' },
                { label: 'Reject

 - Requires Changes', value: 'reject_changes' }

              ],
              approvalUrgency: 'high',
              approvalTimeout: 7200 // 2 hours
            },
            approvalRequired: true,
            dependencies: ['Model Validation & Quality Assurance']
          },
          {
            name: 'Production Deployment',
            type: 'deployment',
            config: {
              environment: 'production',
              deploymentStrategy: 'blue_green',
              trafficSplit: {
                newModel: 10, // Start with 10% traffic
                oldModel: 90,
                rampUpSchedule: 'gradual_24h'
              },
              monitoring: {
                metrics: ['accuracy', 'latency', 'throughput'],
                alerts: {
                  performanceDrop: 0.05, // 5% drop triggers alert

                  latencyIncrease: 100 // 100ms increase triggers alert
                }
              },
              rollbackPlan: {
                automaticRollback: true,
                rollbackThreshold: 0.10, // Rollback if performance drops 10%

                rollbackTimeWindow: 3600 // 1 hour monitoring window
              }
            },
            approvalRequired: true,
            dependencies: ['Production Deployment Approval']
          },
          {
            name: 'Production Monitoring & Optimization',
            type: 'monitoring',
            config: {
              monitoringMetrics: [
                'model_accuracy',
                'prediction_latency',
                'feature_drift',
                'prediction_drift',
                'business_impact_kpis'
              ],
              alertThresholds: {
                accuracy_drop: 0.05,

                latency_increase: 50,
                feature_drift: 0.15,

                prediction_drift: 0.20

              },
              optimizationTriggers: {
                retrainingThreshold: 0.10, // Trigger retraining if accuracy drops 10%

                modelUpdateFrequency: 'weekly',
                a_b_testing_enabled: true
              },
              reporting: {
                dashboardUpdates: 'daily',
                stakeholderReports: 'weekly',
                complianceAudits: 'monthly'
              }
            },
            approvalRequired: false,
            dependencies: ['Production Deployment']
          }
        ],
        metadata: {
          businessOwner: 'Customer Success Team',
          technicalOwner: 'ML Engineering Team',
          complianceOfficer: 'Data Protection Officer',
          priority: 'high',
          expectedBusinessValue: '$2.5M annual retention improvement',

          regulatoryRequirements: ['GDPR', 'CCPA'],
          riskLevel: 'medium'
        }
      }
    );

    this.workflowId = workflow.id;
    console.log(`✅ Pipeline initialized with workflow ID: ${this.workflowId}`);

    return workflow;
  }

  /*

* * Execute the complete pipelin

e
   */

  async execute() {
    if (!this.workflowId) {
      throw new Error('Pipeline not initialized. Call initialize() first.');
    }

    console.log('▶️ Starting Customer Churn Prediction Pipeline execution');

    try {
      await humanLayerMLflowIntegration.executeWorkflow(this.workflowId);
      console.log('✅ Pipeline execution completed successfully');
    } catch (error) {
      console.error('❌ Pipeline execution failed:', error);

      // Handle pipeline failure with human intervention
      await this.handlePipelineFailure(error);
    }
  }

  /*

* * Monitor pipeline progres

s
   */

  async monitor() {
    if (!this.workflowId) {
      return;
    }

    const workflow = humanLayerMLflowIntegration.getWorkflow(this.workflowId);
    if (!workflow) {
      return;
    }

    console.log(`📊 Pipeline Status: ${workflow.status}`);
    console.log('📋 Stage Progress:');

    workflow.stages.forEach((stage, index) => {
      const statusIcon = {
        'pending': '⏳',
        'running': '🔄',
        'completed': '✅',
        'failed': '❌',
        'waiting_approval': '👤'
      }[stage.status] || '❓';

      console.log(`  ${index

 + 1}. ${statusIcon} ${stage.name

}

 - ${stage.status}`)

;

      if (stage.status === 'waiting_approval' && stage.approvalRequestId) {
        console.log(`     🔗 Approval Request: ${stage.approvalRequestId}`);
      }

      if (stage.results) {
        this.displayStageResults(stage);
      }
    });
  }

  /*

* * Handle pipeline failure with human interventio

n
   */

  private async handlePipelineFailure(error: any) {
    console.log('🔧 Handling pipeline failure with human intervention');

    const failureAnalysis = await this.analyzePipelineFailure(error);
    const workflow = humanLayerMLflowIntegration.getWorkflow(this.workflowId!);

    // Request human intervention
    await humanLayerService.requestWorkflowApproval(
      this.workflowId!,
      'Pipeline Execution Failed

 - Human Intervention Required',

      {
        error: error.message,
        failureStage: workflow?.stages.find(s => s.status === 'failed')?.name,
        failureAnalysis,
        suggestedActions: [
          'Retry failed stage',
          'Modify pipeline configuration',
          'Skip failed stage and continue',
          'Cancel pipeline execution'
        ],
        impact: failureAnalysis.impact,
        recommendations: failureAnalysis.recommendations
      }
    );
  }

  /*

* * Analyze pipeline failur

e
   */

  private async analyzePipelineFailure(error: any) {
    // Implement failure analysis logic
    return {
      rootCause: this.determineRootCause(error),
      impact: this.assessImpact(error),
      recommendations: this.generateRecoveryRecommendations(error),
      severity: this.calculateSeverity(error)
    };
  }

  /*

* * Display stage result

s
   */

  private displayStageResults(stage: any) {
    switch (stage.type) {
      case 'training':
        if (stage.results?.metrics) {
          console.log(`     📈 Training Metrics: Accuracy: ${(stage.results.metrics.accuracy

 * 100).toFixed(2)}%`);

        }
        break;
      case 'validation':
        if (stage.results?.validationResults) {
          console.log(`     ✅ Validation: ${stage.results.validationResults.passed ? 'PASSED' : 'FAILED'}`);
        }
        break;
      case 'deployment':
        if (stage.results?.deploymentStatus) {
          console.log(`     🚀 Deployment: ${stage.results.deploymentStatus}`);
        }
        break;
    }
  }

  /*

* * Get pipeline metric

s
   */

  getMetrics() {
    return humanLayerMLflowIntegration.getMetrics();
  }

  /*

* * Get current workflow statu

s
   */

  getStatus() {
    if (!this.workflowId) {
      return null;
    }
    return humanLayerMLflowIntegration.getWorkflow(this.workflowId);
  }
}

// Usage example
export async function runCustomerChurnPipeline() {
  const pipeline = new CustomerChurnPipeline();

  // Initialize pipeline
  await pipeline.initialize();

  // Start monitoring
  const monitoringInterval = setInterval(() => {
    pipeline.monitor();
  }, 10000); // Monitor every 10 seconds

  // Execute pipeline
  await pipeline.execute();

  // Stop monitoring
  clearInterval(monitoringInterval);

  // Display final metrics
  const metrics = pipeline.getMetrics();
  console.log('📊 Final Pipeline Metrics:');
  console.log(`   • Total Workflows: ${metrics.totalWorkflows}`);
  console.log(`   • Success Rate: ${(metrics.completedWorkflows / metrics.totalWorkflows

 * 100).toFixed(1)}%`);

  console.log(`   • Human Intervention Rate: ${(metrics.humanInterventionRate

 * 100).toFixed(1)}%`);

  console.log(`   • Average Completion Time: ${formatDuration(metrics.averageCompletionTime)}`);
}

// React Component Example
export const CustomerChurnPipelineDashboard: React.FC = () => {
  const [pipeline, setPipeline] = useState<CustomerChurnPipeline | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const startPipeline = async () => {
    setIsRunning(true);
    const newPipeline = new CustomerChurnPipeline();
    setPipeline(newPipeline);

    try {
      await newPipeline.initialize();
      await newPipeline.execute();
    } catch (error) {
      console.error('Pipeline execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-2">

          Customer Churn Prediction Pipeline
        </h1>
        <p className="text-gray-600">

          ML pipeline with human-in-the-loop oversight for responsible AI deployment

        </p>
      </div>

      {/

* Control Panel */}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pipeline Control</h2>

            <p className="text-sm text-gray-600">

              {pipeline ? 'Pipeline initialized and ready' : 'Initialize pipeline to begin'}
            </p>
          </div>
          <button
            onClick={startPipeline}
            disabled={isRunning}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"

          >
            {isRunning ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">

                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path

>

                </svg>
                Running Pipeline...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /

>

                </svg>
                Start Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      {/

* Pipeline Status */}

      {pipeline && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Status</h2>

          <div className="space-y-3">

            {pipeline.getStatus()?.stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">

                <div className="flex items-center space-x-3">

                  <div className={`w-3 h-3 rounded-full ${

                    stage.status === 'completed' ? 'bg-green-500' :

                    stage.status === 'running' ? 'bg-blue-500' :

                    stage.status === 'failed' ? 'bg-red-500' :

                    stage.status === 'waiting_approval' ? 'bg-yellow-500' :

                    'bg-gray-400'

                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{stage.name}</div>

                    <div className="text-sm text-gray-600 capitalize">{stage.status.replace('_', ' ')}</div>

                  </div>
                </div>
                {stage.approvalRequired && (
                  <div className="text-sm text-gray-600">

                    {stage.approvalRequestId ? 'Approval Requested' : 'Approval Required'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/

* HumanLaye

r

 + MLflow Dashboard */}

      <HumanLayerMLflowDashboard
        className="bg-white rounded-lg shadow-sm border border-gray-200"

        refreshInterval={30000}
      />
    </div>
  );
};

// Utility functions
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function determineRootCause(error: any): string {
  if (error.message.includes('validation')) return 'Data validation failed';
  if (error.message.includes('training')) return 'Model training failed';
  if (error.message.includes('deployment')) return 'Deployment failed';
  return 'Unknown error';
}

function assessImpact(error: any): string {
  // Implement impact assessment logic
  return 'Medium impact

 - pipeline can be restarted';

}

function generateRecoveryRecommendations(error: any): string[] {
  return [
    'Check input data quality',
    'Verify model parameters',
    'Review approval requirements',
    'Contact technical support if needed'
  ];
}

function calculateSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
  if (error.message.includes('security')) return 'critical';
  if (error.message.includes('deployment')) return 'high';
  if (error.message.includes('training')) return 'medium';
  return 'low';
}

```

#

##

 2. Dashboard Integrati

o

n

```

tsx
// src/pages/CustomerChurnPipelinePage.tsx
import React from 'react';
import { CustomerChurnPipelineDashboard } from '../examples/customerChurnPipeline';

export const CustomerChurnPipelinePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      <CustomerChurnPipelineDashboard />
    </div>
  );
};

```

#

##

 3. API Integrati

o

n

```

typescript
// src/api/customerChurnPipeline.ts
import express from 'express';
import { CustomerChurnPipeline } from '../examples/customerChurnPipeline';

const router = express.Router();
const activePipelines = new Map<string, CustomerChurnPipeline>();

// Start pipeline
router.post('/start', async (req, res) => {
  try {
    const pipeline = new CustomerChurnPipeline();
    await pipeline.initialize();

    const pipelineId = Date.now().toString();
    activePipelines.set(pipelineId, pipeline);

    // Start execution asynchronously
    pipeline.execute().catch(console.error);

    res.json({
      success: true,
      pipelineId,
      message: 'Customer churn pipeline started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get pipeline status
router.get('/:pipelineId/status', (req, res) => {
  const { pipelineId } = req.params;
  const pipeline = activePipelines.get(pipelineId);

  if (!pipeline) {
    return res.status(404).json({
      success: false,
      error: 'Pipeline not found'
    });
  }

  const status = pipeline.getStatus();
  const metrics = pipeline.getMetrics();

  res.json({
    success: true,
    status,
    metrics
  });
});

// Get pipeline metrics
router.get('/:pipelineId/metrics', (req, res) => {
  const { pipelineId } = req.params;
  const pipeline = activePipelines.get(pipelineId);

  if (!pipeline) {
    return res.status(404).json({
      success: false,
      error: 'Pipeline not found'
    });
  }

  res.json({
    success: true,
    metrics: pipeline.getMetrics()
  });
});

// Stop pipeline
router.post('/:pipelineId/stop', (req, res) => {
  const { pipelineId } = req.params;
  const pipeline = activePipelines.get(pipelineId);

  if (!pipeline) {
    return res.status(404).json({
      success: false,
      error: 'Pipeline not found'
    });
  }

  // Note: In a real implementation, you'd need to implement pipeline stopping
  activePipelines.delete(pipelineId);

  res.json({
    success: true,
    message: 'Pipeline stopped successfully'
  });
});

export default router;

```

#

##

 4. Monitoring and Alerti

n

g

```

typescript
// src/services/pipelineMonitoring.ts
import { humanLayerMLflowIntegration } from './humanlayerMLflowIntegration';
import { advancedMonitoringService } from './advancedMonitoringService';

export class PipelineMonitoringService {
  private alertThresholds = {
    maxPipelineDuration: 3600000, // 1 hour
    maxFailedStages: 2,
    minApprovalSuccessRate: 0.8,

    maxPendingApprovals: 5
  };

  startMonitoring() {
    // Monitor pipeline health every 5 minutes
    setInterval(() => {
      this.checkPipelineHealth();
    }, 300000);

    // Monitor approvals every 2 minutes
    setInterval(() => {
      this.checkApprovalHealth();
    }, 120000);
  }

  private async checkPipelineHealth() {
    const metrics = humanLayerMLflowIntegration.getMetrics();

    // Check pipeline duration
    if (metrics.averageCompletionTime > this.alertThresholds.maxPipelineDuration) {
      await this.createAlert(
        'Pipeline Performance Degradation',
        `Average pipeline completion time (${formatDuration(metrics.averageCompletionTime)}) exceeds threshold`,
        'warning'
      );
    }

    // Check failure rate
    const failureRate = metrics.failedWorkflows / metrics.totalWorkflows;
    if (failureRate > 0.2) { // 20% failure rate

      await this.createAlert(
        'High Pipeline Failure Rate',
        `Pipeline failure rate is ${(failureRate

 * 100).toFixed(1)}%, above acceptable threshold`,

        'error'
      );
    }

    // Check human intervention rate
    if (metrics.humanInterventionRate > 0.5) { // 50% intervention rate

      await this.createAlert(
        'High Human Intervention Required',
        `Human intervention rate is ${(metrics.humanInterventionRate

 * 100).toFixed(1)}%, consider automation improvements`,

        'info'
      );
    }
  }

  private async checkApprovalHealth() {
    const humanLayerMetrics = humanLayerService.getMetrics();

    // Check pending approvals
    if (humanLayerMetrics.pendingRequests > this.alertThresholds.maxPendingApprovals) {
      await this.createAlert(
        'Too Many Pending Approvals',
        `${humanLayerMetrics.pendingRequests} approvals are pending review`,
        'warning'
      );
    }

    // Check approval success rate
    if (humanLayerMetrics.approvalRate < this.alertThresholds.minApprovalSuccessRate) {
      await this.createAlert(
        'Low Approval Success Rate',
        `Approval success rate is ${(humanLayerMetrics.approvalRate

 * 100).toFixed(1)}%, below acceptable threshold`,

        'warning'
      );
    }

    // Check response times
    if (humanLayerMetrics.averageResponseTime > 1800000) { // 30 minutes
      await this.createAlert(
        'Slow Approval Response Times',
        `Average approval response time is ${formatDuration(humanLayerMetrics.averageResponseTime)}`,
        'info'
      );
    }
  }

  private async createAlert(title: string, description: string, severity: 'info' | 'warning' | 'error') {
    // Log to monitoring service
    await advancedMonitoringService.recordEvent({
      id: `pipeline_alert_${Date.now()}`,
      timestamp: new Date(),
      level: severity,
      service: 'pipeline_monitoring',
      component: 'health_check',
      operation: 'alert_generation',
      status: 'success',
      metadata: {
        alertTitle: title,
        alertDescription: description,
        alertSeverity: severity
      }
    });

    // In a real implementation, this would also send notifications
    console.log(`🚨 ${severity.toUpperCase()}: ${title}`);
    console.log(`   ${description}`);
  }
}

// Start monitoring
export const pipelineMonitoringService = new PipelineMonitoringService();
pipelineMonitoringService.startMonitoring();

```

#

##

 5. Testi

n

g

```

typescript
// tests/integration/customerChurnPipeline.test.ts
import { CustomerChurnPipeline } from '../../src/examples/customerChurnPipeline';
import { humanLayerMLflowIntegration } from '../../src/services/humanlayerMLflowIntegration';

describe('Customer Churn Pipeline Integration', () => {
  let pipeline: CustomerChurnPipeline;

  beforeEach(() => {
    pipeline = new CustomerChurnPipeline();
  });

  test('should initialize pipeline successfully', async () => {
    const workflow = await pipeline.initialize();

    expect(workflow).toBeDefined();
    expect(workflow.name).toBe('Customer Churn Prediction Pipeline');
    expect(workflow.stages).toHaveLength(7); // All stages created
  });

  test('should execute pipeline with proper stage progression', async () => {
    await pipeline.initialize();

    // Mock successful execution
    await pipeline.execute();

    const status = pipeline.getStatus();
    expect(status?.status).toBe('completed');
  });

  test('should handle pipeline failure gracefully', async () => {
    await pipeline.initialize();

    // Mock a failure scenario
    const mockError = new Error('Model training failed');

    // Spy on error handling
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Simulate failure handling
    await expect(pipeline.execute()).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Pipeline execution failed')
    );

    consoleSpy.mockRestore();
  });

  test('should provide comprehensive metrics', async () => {
    await pipeline.initialize();

    const metrics = pipeline.getMetrics();

    expect(metrics).toHaveProperty('totalWorkflows');
    expect(metrics).toHaveProperty('completedWorkflows');
    expect(metrics).toHaveProperty('failedWorkflows');
    expect(metrics).toHaveProperty('humanInterventionRate');
    expect(metrics).toHaveProperty('averageCompletionTime');
  });

  test('should integrate with MLflow properly', async () => {
    const workflow = await pipeline.initialize();

    // Verify MLflow experiment creation
    const experiments = await enhancedMLflowService.getExperiments();
    const pipelineExperiment = experiments.find(
      exp => exp.name === 'customer_churn_prediction_v3'
    );

    expect(pipelineExperiment).toBeDefined();
    expect(workflow.experimentId).toBe(pipelineExperiment?.id);
  });

  test('should handle human approvals correctly', async () => {
    await pipeline.initialize();

    // Find approval stage
    const status = pipeline.getStatus();
    const approvalStage = status?.stages.find(
      stage => stage.type === 'approval'
    );

    expect(approvalStage).toBeDefined();
    expect(approvalStage?.approvalRequired).toBe(true);
  });
});

// E2E Test
describe('Customer Churn Pipeline E2E', () => {
  test('should complete full pipeline with all integrations', async () => {
    const pipeline = new CustomerChurnPipeline();

    // Initialize
    await pipeline.initialize();

    // Execute
    await pipeline.execute();

    // Verify final state
    const finalStatus = pipeline.getStatus();
    expect(finalStatus?.status).toBe('completed');

    // Verify all stages completed
    const completedStages = finalStatus?.stages.filter(
      stage => stage.status === 'completed'
    );
    expect(completedStages).toHaveLength(7);

    // Verify MLflow integration
    const metrics = pipeline.getMetrics();
    expect(metrics.modelDeploymentRate).toBeGreaterThan(0);

    // Verify monitoring
    expect(metrics.humanInterventionRate).toBeDefined();
    expect(metrics.averageCompletionTime).toBeGreaterThan(0);
  }, 300000); // 5 minute timeout for E2E test
});

```

#

# Configuration File

s

#

## Docker Compose Configuratio

n

```

yaml

# docker-compose.customer-churn.ym

l

version: '3.8

'

services:
  customer-churn-pipeline:

    build:
      context: .
      dockerfile: systems/customer-churn/Dockerfile

    environment:

      - HUMAN_LAYER_BASE_URL=http://humanlayer:800

0

      - HUMAN_LAYER_API_KEY=${HUMAN_LAYER_API_KEY

}

      - MLFLOW_BASE_URL=http://mlflow:500

0

      - MLFLOW_TRACKING_URI=http://mlflow:5000

    depends_on:

      - mlflo

w

      - humanlayer

    volumes:

      - ./data:/app/dat

a

      - ./models:/app/model

s

  mlflow:
    image: python:3.9-sli

m

    command: mlflow server --host 0.0.0.0 --port 5000 --backend-store-uri postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/mlflow --default-artifact-root /mlflow/artifact

s

    environment:

      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

    ports:

      - "5000:5000"

    volumes:

      - mlflow_data:/mlflow/artifacts

    depends_on:

      - postgre

s

  humanlayer:
    image: humanlayer/humanlayer:latest
    environment:

      - HUMAN_LAYER_API_KEY=${HUMAN_LAYER_API_KEY

}

      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/humanlayer

    ports:

      - "8000:8000"

    depends_on:

      - postgre

s

  postgres:
    image: postgres:13
    environment:

      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD

}

      - POSTGRES_DB=mlflow

    volumes:

      - postgres_data:/var/lib/postgresql/dat

a

volumes:
  mlflow_data:
  postgres_data:

```

#

## Environment Configuratio

n

```

bash

# .env.customer-chu

r

n

# HumanLayer Configuration

HUMAN_LAYER_BASE_URL=http://humanlayer:8000
HUMAN_LAYER_API_KEY=your_humanlayer_api_key_here

# MLflow Configuration

MLFLOW_BASE_URL=http://mlflow:5000
MLFLOW_TRACKING_URI=http://mlflow:5000

# Database Configuration

POSTGRES_PASSWORD=your_secure_password_here

# Pipeline Configuration

CUSTOMER_CHURN_DATA_PATH=/app/data
CUSTOMER_CHURN_MODELS_PATH=/app/models
PIPELINE_MONITORING_INTERVAL=30000
PIPELINE_MAX_EXECUTION_TIME=3600000

```

#

# Deployment and Operation

s

#

## Production Deploymen

t

```

typescript
// scripts/deploy-customer-churn-pipeline.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function deployCustomerChurnPipeline() {
  try {
    console.log('🚀 Starting Customer Churn Pipeline deployment');

    // Build Docker images
    console.log('📦 Building Docker images...');
    await execAsync('docker-compose -f docker-compose.customer-churn.yml build')

;

    // Deploy to staging
    console.log('🎭 Deploying to staging environment...');
    await execAsync('docker-compose -f docker-compose.customer-churn.yml --profile staging up -d')

;

    // Run health checks
    console.log('🔍 Running health checks...');
    await runHealthChecks();

    // Run integration tests
    console.log('🧪 Running integration tests...');
    await runIntegrationTests();

    // Deploy to production
    console.log('🎯 Deploying to production environment...');
    await execAsync('docker-compose -f docker-compose.customer-churn.yml --profile production up -d')

;

    // Configure monitoring
    console.log('📊 Configuring monitoring and alerting...');
    await configureMonitoring();

    console.log('✅ Customer Churn Pipeline deployed successfully');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    await rollbackDeployment();
    throw error;
  }
}

async function runHealthChecks() {
  // Implement health checks for all services
  const services = ['mlflow', 'humanlayer', 'customer-churn-pipeline']

;

  for (const service of services) {
    const health = await checkServiceHealth(service);
    if (!health) {
      throw new Error(`Health check failed for service: ${service}`);
    }
  }
}

async function runIntegrationTests() {
  // Run integration tests
  await execAsync('npm run test:integration:customer-churn');

}

async function configureMonitoring() {
  // Configure monitoring and alerting
  await execAsync('npm run configure:monitoring:customer-churn');

}

async function rollbackDeployment() {
  console.log('🔄 Rolling back deployment...');
  try {
    await execAsync('docker-compose -f docker-compose.customer-churn.yml down');

  } catch (rollbackError) {
    console.error('Rollback failed:', rollbackError);
  }
}

```

#

## Monitoring Dashboar

d

```

typescript
// src/components/monitoring/CustomerChurnMonitoringDashboard.tsx
import React, { useEffect, useState } from 'react';
import { humanLayerMLflowIntegration } from '../../services/humanlayerMLflowIntegration';
import { pipelineMonitoringService } from '../../services/pipelineMonitoring';

export const CustomerChurnMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const loadMetrics = async () => {
      const pipelineMetrics = humanLayerMLflowIntegration.getMetrics();
      // Load monitoring alerts
      const monitoringAlerts = await loadMonitoringAlerts();

      setMetrics(pipelineMetrics);
      setAlerts(monitoringAlerts);
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">

      <h1 className="text-3xl font-bold text-gray-900 mb-8">

        Customer Churn Pipeline Monitoring
      </h1>

      {/

* Key Metrics */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        <div className="bg-white rounded-lg shadow p-6">

          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pipeline Success Rate</h3>

          <div className="text-3xl font-bold text-green-600">

            {metrics ? ((metrics.completedWorkflows / metrics.totalWorkflows)

 * 100).toFixed(1) : 0}%

          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">

          <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Completion Time</h3>

          <div className="text-3xl font-bold text-blue-600">

            {metrics ? formatDuration(metrics.averageCompletionTime) : 'N/A'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">

          <h3 className="text-lg font-semibold text-gray-900 mb-2">Human Intervention Rate</h3>

          <div className="text-3xl font-bold text-orange-600">

            {metrics ? (metrics.humanInterventionRate

 * 100).toFixed(1) : 0}%

          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">

          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Pipelines</h3>

          <div className="text-3xl font-bold text-purple-600">

            {metrics ? metrics.activeWorkflows : 0}
          </div>
        </div>
      </div>

      {/

* Active Alerts */}

      <div className="bg-white rounded-lg shadow mb-8">

        <div className="px-6 py-4 border-b border-gray-200">

          <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>

        </div>
        <div className="p-6">

          {alerts.length === 0 ? (
            <p className="text-gray-600">No active alerts</p>

          ) : (
            <div className="space-y-4">

              {alerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${

                  alert.severity === 'critical' ? 'border-red-500 bg-red-50' :

                  alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :

                  'border-blue-500 bg-blue-50'

                }`}>
                  <div className="flex items-center justify-between">

                    <div>
                      <h3 className="font-medium text-gray-900">{alert.title}</h3>

                      <p className="text-sm text-gray-600">{alert.description}</p>

                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${

                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :

                      alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :

                      'bg-blue-100 text-blue-800'

                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/

* Pipeline Stages Status */}

      <div className="bg-white rounded-lg shadow">

        <div className="px-6 py-4 border-b border-gray-200">

          <h2 className="text-lg font-semibold text-gray-900">Pipeline Stages</h2>

        </div>
        <div className="p-6">

          <div className="space-y-4">

            {[
              'Data Acquisition & Validation',
              'Feature Engineering',
              'Model Training',
              'Model Validation & Quality Assurance',
              'Production Deployment Approval',
              'Production Deployment',
              'Production Monitoring & Optimization'
            ].map((stage, index) => (
              <div key={stage} className="flex items-center justify-between p-4 bg-gray-50 rounded">

                <div className="flex items-center space-x-4">

                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">

                    <span className="text-sm font-medium text-blue-600">{inde

x

 + 1}</span>

                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{stage}</div>

                    <div className="text-sm text-gray-600">Stage {inde

x

 + 1} of 7</div>

                  </div>
                </div>
                <div className="flex items-center space-x-2">

                  <div className="w-3 h-3 rounded-full bg-green-500"></div>

                  <span className="text-sm text-gray-600">Completed</span>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

async function loadMonitoringAlerts(): Promise<any[]> {
  // Implement alert loading logic
  return [];
}

```

#

# Summar

y

This comprehensive example demonstrates how to:

1. **Create Human-AI Workflows**: Combine automated ML processes with human oversig

h

t

2. **Manage Approvals**: Handle critical decision points with human interventi

o

n

3. **Track Experiments**: Use MLflow for comprehensive experiment tracki

n

g

4. **Monitor Performance**: Real-time monitoring and alerti

n

g

5. **Deploy Safely**: Production deployment with rollback capabiliti

e

s

6. **Maintain Compliance**: Built-in compliance and security chec

k

s

The Customer Churn Prediction Pipeline showcases the power of the HumanLayer

 + MLflow integration for responsible AI deployment, combining the best of automated machine learning with human expertise and oversight

.

