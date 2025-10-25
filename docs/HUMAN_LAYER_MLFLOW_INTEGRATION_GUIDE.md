

# HumanLayer

 + MLflow Integration Gui

d

e

#

# Overvie

w

This guide provides comprehensive instructions for leveraging HumanLayer and MLflow within the Auterity Unified AI Platform. The integration enables human-in-the-loop machine learning workflows, combining automated AI processes with human oversight and decision-making

.

#

# Architectur

e

#

## Core Component

s

1. **HumanLayer Servic

e

* * (`src/services/humanLayerService.ts`

)

   - Handles human approval workflow

s

   - Manages critical decision point

s

   - Provides security and compliance control

s

2. **Enhanced MLflow Servic

e

* * (`src/services/enhancedMLflowService.ts`

)

   - Manages ML experiments and run

s

   - Tracks model versions and deployment

s

   - Provides experiment analytic

s

3. **HumanLayer-MLflow Integratio

n

* * (`src/services/humanlayerMLflowIntegration.ts`

)

   - Orchestrates human-AI workflow

s

   - Manages ML pipelines with human oversigh

t

   - Handles model deployment approval

s

4. **Unified Dashboar

d

* * (`frontend/src/components/humanlayer-mlflow/HumanLayerMLflowDashboard.tsx`

)

   - Provides comprehensive monitoring interfac

e

   - Shows workflow progress and approval

s

   - Displays ML experiment result

s

#

# Quick Star

t

#

##

 1. Installation and Set

u

p

```bash

# Install HumanLayer

pip install humanlayer

# Install MLflow

pip install mlflow

# Update Docker Compose

docker-compose -f infrastructure/docker/docker-compose.unified.yml up -d mlflow humanlaye

r

```

#

##

 2. Configurati

o

n

Add to your environment variables:

```

bash

# HumanLayer Configuration

HUMAN_LAYER_BASE_URL=http://humanlayer:8000
HUMAN_LAYER_API_KEY=your_api_key_here

# MLflow Configuration

MLFLOW_BASE_URL=http://mlflow:5000
MLFLOW_TRACKING_URI=http://mlflow:5000

```

#

##

 3. Basic Usa

g

e

```

typescript
import { humanLayerService } from './src/services/humanLayerService';
import { enhancedMLflowService } from './src/services/enhancedMLflowService';
import { humanLayerMLflowIntegration } from './src/services/humanlayerMLflowIntegration';

// Request human approval for critical operations
const approvalRequest = {
  id: 'approval_123',
  type: 'code_execution',
  title: 'Database Schema Change',
  description: 'Please review the database migration script',
  context: { script: 'ALTER TABLE users ADD COLUMN email_verified BOOLEAN;' },
  options: [
    { label: 'Execute', value: 'execute' },
    { label: 'Reject', value: 'reject', recommended: true }
  ],
  urgency: 'critical',
  timeout: 600
};

const approval = await humanLayerService.requestApproval(approvalRequest);

// Log ML experiment
await enhancedMLflowService.logToRun(runId, {
  accuracy: 0.95,

  loss: 0.05

}, {
  model: 'xgboost',
  dataset: 'customer_data'
});

```

#

# HumanLayer Integratio

n

#

## Approval Type

s

The HumanLayer service supports several types of human approvals:

#

###

 1. Code Execution Approv

a

l

```

typescript
const approval = await humanLayerService.requestCodeExecutionApproval(
  codeSnippet,
  'production',
  userId
);

```

#

###

 2. Content Publishing Approv

a

l

```

typescript
const approval = await humanLayerService.requestContentApproval(
  content,
  'social_media',
  userId
);

```

#

###

 3. Workflow Decision Approv

a

l

```

typescript
const approval = await humanLayerService.requestWorkflowApproval(
  workflowId,
  'Deploy model to production?',
  { modelMetrics, riskAssessment }
);

```

#

###

 4. Custom Approva

l

s

```

typescript
const approval = await humanLayerService.requestApproval({
  id: 'custom_123',
  type: 'ai_decision',
  title: 'Custom Approval',
  description: 'Please review this decision',
  context: { customData },
  options: [
    { label: 'Approve', value: 'approve' },
    { label: 'Deny', value: 'deny' }
  ],
  urgency: 'medium',
  timeout: 1800
});

```

#

## Approval Monitorin

g

```

typescript
// Get approval status
const status = await humanLayerService.getApprovalStatus(requestId);

// Cancel pending approval
await humanLayerService.cancelApproval(requestId);

// Get service metrics
const metrics = humanLayerService.getMetrics();

```

#

# MLflow Integratio

n

#

## Experiment Managemen

t

```

typescript
// Create experiment
const experiment = await enhancedMLflowService.createExperiment(
  'customer_churn_prediction',
  'Predicting customer churn using ML models',
  { team: 'data_science', priority: 'high' }
);

// Get all experiments
const experiments = await enhancedMLflowService.getExperiments();

// Get runs for experiment
const runs = await enhancedMLflowService.getExperimentRuns(experimentId);

```

#

## Model Versionin

g

```

typescript
// Create model version
const version = await enhancedMLflowService.createModelVersion(
  'churn_predictor',
  'runs:/run_id/model',
  runId
);

// Transition model stage
await enhancedMLflowService.transitionModelVersion(
  'churn_predictor',
  '1',
  'Production'
);

// Compare model versions
const comparison = await enhancedMLflowService.compareModelVersions(
  'churn_predictor',
  '1',
  '2'
);

```

#

## Workflow Loggin

g

```

typescript
// Log workflow execution
await enhancedMLflowService.logWorkflowExecution(
  workflowId,
  executionTime,
  nodeCount,
  success,
  { workflowName, stage: 'training' }
);

```

#

# Human-AI Workflow Integrati

o

n

#

## Creating ML Workflow

s

```

typescript
const workflow = await humanLayerMLflowIntegration.createMLWorkflow(
  'Customer Churn Prediction Pipeline',
  'End-to-end ML pipeline with human oversight',

  {
    experimentName: 'churn_prediction_v2',
    modelName: 'churn_predictor',
    stages: [
      {
        name: 'Data Preparation',
        type: 'data_prep',
        config: { dataset: 'customer_data.csv' },
        approvalRequired: false
      },
      {
        name: 'Model Training',
        type: 'training',
        config: {
          algorithm: 'xgboost',
          parameters: { max_depth: 6, learning_rate: 0.1 }

        },
        approvalRequired: false
      },
      {
        name: 'Model Validation',
        type: 'validation',
        config: {
          validationThresholds: { accuracy: 0.85, precision: 0.80 },

          testDataset: 'validation_data.csv'
        },
        approvalRequired: true
      },
      {
        name: 'Production Deployment',
        type: 'deployment',
        config: { environment: 'production' },
        approvalRequired: true
      },
      {
        name: 'Performance Monitoring',
        type: 'monitoring',
        config: { metrics: ['accuracy', 'latency'] },
        approvalRequired: false
      }
    ]
  }
);

```

#

## Executing Workflow

s

```

typescript
// Execute workflow
await humanLayerMLflowIntegration.executeWorkflow(workflowId);

// Get workflow status
const workflow = humanLayerMLflowIntegration.getWorkflow(workflowId);

// Get all workflows
const workflows = humanLayerMLflowIntegration.getWorkflows();

// Get integration metrics
const metrics = humanLayerMLflowIntegration.getMetrics();

```

#

# Dashboard Integratio

n

#

## Using the Unified Dashboar

d

```

tsx
import { HumanLayerMLflowDashboard } from './components/humanlayer-mlflow/HumanLayerMLflowDashboard'

;

function App() {
  return (
    <div className="min-h-screen bg-gray-50">

      <HumanLayerMLflowDashboard
        className="max-w-7xl mx-auto py-6 px-4"

        refreshInterval={30000}
      />
    </div>
  );
}

```

#

## Dashboard Feature

s

- **Overview Tab**: Key metrics and recent activit

y

- **Human Approvals Tab**: Manage pending approval

s

- **ML Experiments Tab**: View experiments and run

s

- **Analytics Tab**: Performance metrics and trend

s

#

# Advanced Configuratio

n

#

## Custom Approval Workflow

s

```

typescript
// Create custom approval workflow
const customApproval = {
  id: 'compliance_check',
  type: 'ai_decision',
  title: 'Regulatory Compliance Check',
  description: 'AI model requires compliance review before deployment',
  context: {
    modelType: 'financial_prediction',
    regulations: ['GDPR', 'SOX'],
    riskLevel: 'high'
  },
  options: [
    { label: 'Compliant

 - Proceed', value: 'compliant' },

    { label: 'Requires Changes', value: 'changes' },
    { label: 'Reject Deployment', value: 'reject' }
  ],
  urgency: 'critical',
  timeout: 3600,
  metadata: {
    department: 'compliance',
    reviewer: 'chief_risk_officer'
  }
};

```

#

## MLflow Model Registry Integratio

n

```

typescript
// Advanced model management
const modelRegistry = {
  registerModel: async (name, description) => {
    return await enhancedMLflowService.createModelVersion(name, description);
  },

  promoteToStaging: async (name, version) => {
    return await enhancedMLflowService.transitionModelVersion(
      name,
      version,
      'Staging'
    );
  },

  promoteToProduction: async (name, version, approvalRequired = true) => {
    if (approvalRequired) {
      // Request human approval before promotion
      await humanLayerService.requestWorkflowApproval(
        `model_promotion_${name}_${version}`,
        `Promote ${name} v${version} to production`,
        { modelName: name, version, environment: 'production' }
      );
    }

    return await enhancedMLflowService.transitionModelVersion(
      name,
      version,
      'Production'
    );
  }
};

```

#

# Security and Complianc

e

#

## Approval Auditin

g

```

typescript
// Get approval audit trail
const auditTrail = await humanLayerService.getApprovalAuditTrail(
  requestId,
  { includeComments: true, includeMetadata: true }
);

// Security analysis for code approvals
const securityAnalysis = await humanLayerService.analyzeCodeSecurity(code);

// Content compliance checking
const complianceCheck = await humanLayerService.checkContentCompliance(
  content,
  ['hate_speech', 'confidential_data']
);

```

#

## Access Contro

l

```

typescript
// Role-based approval routing

const approvalRouting = {
  code_execution: ['senior_developer', 'security_team'],
  content_publishing: ['content_team', 'legal'],
  model_deployment: ['ml_engineer', 'product_manager', 'compliance_officer']
};

// Approval escalation
const escalationRules = {
  timeout: 'escalate_to_manager',
  rejection: 'notify_stakeholders',
  high_risk: 'require_c_level_approval'
};

```

#

# Monitoring and Analytic

s

#

## Performance Metric

s

```

typescript
// Get comprehensive metrics
const humanLayerMetrics = humanLayerService.getMetrics();
const mlflowMetrics = await enhancedMLflowService.getMetrics();
const workflowMetrics = humanLayerMLflowIntegration.getMetrics();

// Combined analytics
const analytics = {
  approvalEfficiency: {
    averageResponseTime: humanLayerMetrics.averageResponseTime,
    approvalRate: humanLayerMetrics.approvalRate,
    timeoutRate: humanLayerMetrics.timeoutRate
  },
  mlPerformance: {
    totalExperiments: mlflowMetrics.totalExperiments,
    activeRuns: mlflowMetrics.activeRuns,
    productionModels: mlflowMetrics.productionModels
  },
  workflowEfficiency: {
    humanInterventionRate: workflowMetrics.humanInterventionRate,
    modelDeploymentRate: workflowMetrics.modelDeploymentRate,
    averageCompletionTime: workflowMetrics.averageCompletionTime
  }
};

```

#

## Alert Configuratio

n

```

typescript
// Configure alerts
const alertConfig = {
  approvalTimeouts: {
    threshold: 300, // 5 minutes
    notificationChannels: ['email', 'slack'],
    escalationPolicy: 'manager_escalation'
  },
  mlExperimentFailures: {
    threshold: 3, // consecutive failures
    notificationChannels: ['email', 'pagerduty'],
    autoRetry: true
  },
  deploymentApprovals: {
    pendingThreshold: 10, // pending approvals
    notificationChannels: ['slack', 'dashboard'],
    priorityEscalation: true
  }
};

```

#

# Troubleshootin

g

#

## Common Issue

s

#

### HumanLayer Connection Issue

s

```

typescript
// Check service health
try {
  const health = await humanLayerService.checkHealth();
  console.log('HumanLayer status:', health);
} catch (error) {
  console.error('HumanLayer connection failed:', error);
  // Fallback to alternative approval mechanism
}

```

#

### MLflow Tracking Issue

s

```

typescript
// Verify MLflow connection
try {
  await enhancedMLflowService.testConnection();
  console.log('MLflow connection successful');
} catch (error) {
  console.error('MLflow connection failed:', error);
  // Switch to local logging
}

```

#

### Workflow Execution Failure

s

```

typescript
// Handle workflow failures gracefully
const workflow = humanLayerMLflowIntegration.getWorkflow(workflowId);
if (workflow.status === 'failed') {
  // Analyze failure
  const failureAnalysis = await analyzeWorkflowFailure(workflow);

  // Request human intervention if needed
  if (failureAnalysis.requiresHumanIntervention) {
    await humanLayerService.requestWorkflowApproval(
      workflowId,
      'Workflow failed

 - human intervention required',

      failureAnalysis
    );
  }
}

```

#

# Best Practice

s

#

##

 1. Approval Desi

g

n

- Keep approval requests focused and actionabl

e

- Provide clear context and option

s

- Set appropriate timeouts based on urgenc

y

- Use escalation policies for critical approval

s

#

##

 2. ML Experiment Tracki

n

g

- Log all relevant parameters and metric

s

- Use consistent naming convention

s

- Tag experiments with metadat

a

- Implement proper model versionin

g

#

##

 3. Workflow Orchestrati

o

n

- Design workflows with clear stage

s

- Implement proper error handlin

g

- Use human oversight for critical decision

s

- Monitor performance and optimiz

e

#

##

 4. Security Consideratio

n

s

- Validate all inputs and context

s

- Implement proper access control

s

- Audit all approval decision

s

- Use encryption for sensitive dat

a

#

# API Referenc

e

#

## HumanLayer Servic

e

```

typescript
interface HumanLayerService {
  requestApproval(request: HumanApprovalRequest): Promise<HumanApprovalResponse>;
  getApprovalStatus(requestId: string): Promise<ApprovalStatus>;
  cancelApproval(requestId: string): Promise<boolean>;
  getMetrics(): HumanLayerMetrics;
  analyzeCodeSecurity(code: string): SecurityAnalysis;
  checkContentCompliance(content: string, policies: string[]): ComplianceResult;
}

```

#

## Enhanced MLflow Servic

e

```

typescript
interface EnhancedMLflowService {
  getExperiments(): Promise<Experiment[]>;
  createExperiment(name: string, description?: string): Promise<Experiment>;
  getExperimentRuns(experimentId: string): Promise<Run[]>;
  logToRun(runId: string, metrics: Record<string, number>, parameters: Record<string, string>): Promise<void>;
  createModelVersion(name: string, source: string, runId: string): Promise<ModelVersion>;
  transitionModelVersion(name: string, version: string, stage: Stage): Promise<ModelVersion>;
  getMetrics(): Promise<MLflowMetrics>;
}

```

#

## HumanLayer-MLflow Integrati

o

n

```

typescript
interface HumanLayerMLflowIntegration {
  createMLWorkflow(name: string, description: string, config: WorkflowConfig): Promise<MLWorkflow>;
  executeWorkflow(workflowId: string): Promise<void>;
  getWorkflow(workflowId: string): MLWorkflow | undefined;
  getWorkflows(): MLWorkflow[];
  getMetrics(): HumanAIWorkflowMetrics;
}

```

#

# Conclusio

n

The HumanLayer

 + MLflow integration provides a powerful framework for human-in-the-loop machine learning workflows. By combining automated AI processes with human oversight, you can ensure

:

- **Quality Control**: Human review of critical decision

s

- **Compliance**: Regulatory and security approval

s

- **Transparency**: Full audit trail of decisions and action

s

- **Reliability**: Human intervention for edge cases and failure

s

- **Performance**: Optimized ML workflows with human feedbac

k

This integration enables responsible AI deployment while maintaining the benefits of automation and scale.

