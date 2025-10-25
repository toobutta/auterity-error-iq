/**
 * Enterprise Integration Example
 * Demonstrates how to use the Enterprise Integration Bus with adapters
 * to create comprehensive enterprise-grade integrations
 */

import {
  enterpriseIntegrationBus,
  createRoute,
  registerEndpoint,
  registerProcessor,
  createSaga,
  executeSaga,
  registerCircuitBreaker,
  executeWithCircuitBreaker
} from './EnterpriseIntegrationBus';

import { createDatabaseAdapter, createDatabaseEndpoint } from './adapters/DatabaseAdapter';
import { createMessageQueueAdapter, createMessageQueueEndpoint } from './adapters/MessageQueueAdapter';
import { createAPIAdapter, createAPIEndpoint, createSlackAdapter } from './adapters/APIAdapter';
import { createWorkflowAdapter, createWorkflowEndpoint, SagaWorkflowExecutor } from './adapters/WorkflowAdapter';

import { Message } from './EnterpriseIntegrationBus';

/**
 * Example 1: E-commerce Order Processing Integration
 * Demonstrates order processing with database, message queue, and API integrations
 */
export async function setupEcommerceOrderProcessing() {
  console.log('🚀 Setting up E-commerce Order Processing Integration');

  // 1. Create database adapter for PostgreSQL
  const orderDbAdapter = createDatabaseAdapter({
    type: 'postgresql',
    host: process.env.DB_HOST || 'localhost',
    port: 5432,
    database: 'ecommerce',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  });

  // 2. Create message queue adapter for RabbitMQ
  const messageQueueAdapter = createMessageQueueAdapter({
    type: 'rabbitmq',
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: 5672,
    username: process.env.RABBITMQ_USER || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest'
  });

  // 3. Create API adapter for payment processing
  const paymentAPIAdapter = createAPIAdapter({
    type: 'rest',
    baseUrl: 'https://api.stripe.com/v1',
    timeout: 10000,
    retries: 3,
    auth: {
      type: 'bearer',
      token: process.env.STRIPE_SECRET_KEY || ''
    }
  });

  // 4. Create Slack adapter for notifications
  const slackAdapter = createSlackAdapter(process.env.SLACK_BOT_TOKEN || '');

  // 5. Register endpoints
  const dbEndpoint = createDatabaseEndpoint(
    'order-db',
    'Order Database',
    {
      type: 'postgresql',
      host: process.env.DB_HOST || 'localhost',
      port: 5432,
      database: 'ecommerce',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    [
      { type: 'insert', table: 'orders', data: {} },
      { type: 'update', table: 'orders', query: {}, data: {} },
      { type: 'select', table: 'orders', query: {} }
    ]
  );

  const mqEndpoint = createMessageQueueEndpoint(
    'order-queue',
    'Order Message Queue',
    {
      type: 'rabbitmq',
      host: process.env.RABBITMQ_HOST || 'localhost',
      port: 5672,
      username: process.env.RABBITMQ_USER || 'guest',
      password: process.env.RABBITMQ_PASSWORD || 'guest'
    },
    [
      {
        queue: 'order.created',
        handler: async (message: Message) => {
          console.log('Processing order creation:', message.body);
          await processOrderCreation(message.body);
        }
      },
      {
        queue: 'order.payment',
        handler: async (message: Message) => {
          console.log('Processing payment:', message.body);
          await processPayment(message.body);
        }
      }
    ]
  );

  const paymentEndpoint = createAPIEndpoint(
    'payment-api',
    'Payment Processing API',
    {
      type: 'rest',
      baseUrl: 'https://api.stripe.com/v1',
      timeout: 10000,
      retries: 3,
      auth: {
        type: 'bearer',
        token: process.env.STRIPE_SECRET_KEY || ''
      }
    },
    [
      { type: 'post', endpoint: '/charges' },
      { type: 'get', endpoint: '/charges/{id}' }
    ]
  );

  // Register endpoints
  await registerEndpoint(dbEndpoint);
  await registerEndpoint(mqEndpoint);
  await registerEndpoint(paymentEndpoint);

  // 6. Create custom processors
  await registerProcessor({
    id: 'order-validator',
    type: 'validator',
    name: 'Order Validator',
    config: {
      requiredFields: ['customerId', 'items', 'total'],
      businessRules: ['total > 0', 'items.length > 0']
    },
    process: async (message: Message) => {
      const order = message.body;

      // Validate required fields
      for (const field of this.config.requiredFields) {
        if (!order[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate business rules
      if (order.total <= 0) {
        throw new Error('Order total must be greater than 0');
      }

      if (!order.items || order.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      return message;
    }
  });

  await registerProcessor({
    id: 'order-enricher',
    type: 'enricher',
    name: 'Order Enricher',
    config: {
      enrichCustomerData: true,
      calculateTaxes: true,
      addTimestamp: true
    },
    process: async (message: Message) => {
      const order = message.body;

      // Enrich with customer data
      if (this.config.enrichCustomerData) {
        order.customer = await getCustomerData(order.customerId);
      }

      // Calculate taxes
      if (this.config.calculateTaxes) {
        order.taxes = calculateTaxes(order);
      }

      // Add processing timestamp
      if (this.config.addTimestamp) {
        order.processedAt = new Date().toISOString();
      }

      message.body = order;
      return message;
    }
  });

  // 7. Create integration routes
  await createRoute({
    id: 'order-processing-route',
    name: 'Order Processing Route',
    description: 'Process new orders from creation to fulfillment',
    from: 'order.created',
    to: ['order-db', 'order-queue'],
    processors: ['order-validator', 'order-enricher'],
    errorHandler: 'order-error-handler'
  });

  await createRoute({
    id: 'payment-processing-route',
    name: 'Payment Processing Route',
    description: 'Handle payment processing and confirmations',
    from: 'order.payment',
    to: ['payment-api', 'order-db'],
    processors: [],
    errorHandler: 'payment-error-handler'
  });

  // 8. Create error handling routes
  await createRoute({
    id: 'order-error-handler',
    name: 'Order Error Handler',
    description: 'Handle errors in order processing',
    from: 'order.created.errors',
    to: ['error-notification'],
    processors: ['error-logger'],
    errorHandler: undefined
  });

  // 9. Register circuit breaker for external API calls
  await registerCircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 30000,
    monitoringPeriod: 10000,
    name: 'payment-api-breaker'
  });

  console.log('✅ E-commerce Order Processing Integration Setup Complete');
}

/**
 * Example 2: AI Workflow Orchestration with Saga Pattern
 * Demonstrates complex AI workflows with distributed transactions
 */
export async function setupAIWorkflowOrchestration() {
  console.log('🤖 Setting up AI Workflow Orchestration');

  // 1. Create workflow adapter
  const workflowAdapter = createWorkflowAdapter({
    type: 'temporal',
    baseUrl: process.env.TEMPORAL_BASE_URL,
    namespace: 'ai-workflows'
  });

  // 2. Define AI processing workflow
  const aiProcessingWorkflow = {
    id: 'ai-content-generation',
    name: 'AI Content Generation Workflow',
    version: '1.0',
    steps: [
      {
        id: 'content-analysis',
        name: 'Analyze Content Requirements',
        type: 'activity',
        config: {
          activityName: 'content-analysis',
          inputMapping: { content: 'input.content' }
        },
        timeout: 30000,
        retries: 2
      },
      {
        id: 'generate-text',
        name: 'Generate Text Content',
        type: 'activity',
        config: {
          activityName: 'ai-generation',
          inputMapping: { prompt: 'analysis.suggestedPrompt' }
        },
        timeout: 60000,
        retries: 3
      },
      {
        id: 'quality-check',
        name: 'Quality Assurance Check',
        type: 'activity',
        config: {
          activityName: 'quality-check',
          inputMapping: { content: 'generated.content' }
        },
        timeout: 20000,
        retries: 1
      },
      {
        id: 'publish-content',
        name: 'Publish Content',
        type: 'activity',
        config: {
          activityName: 'content-publishing',
          inputMapping: {
            content: 'generated.content',
            metadata: 'input.metadata'
          }
        },
        timeout: 15000,
        retries: 2,
        compensation: {
          id: 'unpublish-content',
          name: 'Unpublish Content',
          type: 'activity',
          config: {
            activityName: 'content-unpublishing',
            inputMapping: { contentId: 'published.contentId' }
          }
        }
      }
    ],
    timeout: 300000, // 5 minutes
    retries: 1
  };

  // 3. Deploy workflow
  await workflowAdapter.deployWorkflow(aiProcessingWorkflow);

  // 4. Create saga for content generation with rollback
  const contentGenerationSaga = {
    id: 'content-generation-saga',
    name: 'Content Generation Saga',
    steps: [
      {
        id: 'validate-input',
        action: async (context) => {
          const input = context.variables.input;
          if (!input.content || !input.metadata) {
            throw new Error('Invalid input: missing content or metadata');
          }
          return { validated: true };
        }
      },
      {
        id: 'execute-workflow',
        action: async (context) => {
          const sagaExecutor = new SagaWorkflowExecutor(workflowAdapter);
          const result = await sagaExecutor.executeWorkflowInSaga(
            contentGenerationSaga,
            'ai-content-generation',
            context.variables.input
          );
          context.variables.workflowResult = result;
          return result;
        },
        compensation: async (context) => {
          if (context.variables.workflowResult?.contentId) {
            await workflowAdapter.compensateWorkflow(context.variables.workflowResult.contentId);
          }
        }
      },
      {
        id: 'notify-stakeholders',
        action: async (context) => {
          const slackAdapter = createSlackAdapter(process.env.SLACK_BOT_TOKEN || '');
          await slackAdapter.execute({
            type: 'post',
            endpoint: '/chat.postMessage',
            data: {
              channel: '#content-generation',
              text: `Content generation completed: ${context.variables.workflowResult.title}`,
              attachments: [{
                title: context.variables.workflowResult.title,
                text: `Generated ${context.variables.workflowResult.wordCount} words`,
                color: 'good'
              }]
            }
          });
          return { notified: true };
        },
        compensation: async (context) => {
          // Send failure notification
          const slackAdapter = createSlackAdapter(process.env.SLACK_BOT_TOKEN || '');
          await slackAdapter.execute({
            type: 'post',
            endpoint: '/chat.postMessage',
            data: {
              channel: '#content-generation',
              text: 'Content generation failed and was rolled back',
              color: 'danger'
            }
          });
        }
      }
    ],
    compensationSteps: {},
    timeout: 600000 // 10 minutes
  };

  // 5. Execute saga
  const sagaResult = await executeSaga('content-generation-saga', {
    correlationId: `saga_${Date.now()}`,
    variables: {
      input: {
        content: 'Generate a blog post about AI integration patterns',
        metadata: {
          author: 'AI Content Generator',
          category: 'Technology',
          tags: ['AI', 'Integration', 'Automation']
        }
      }
    }
  });

  console.log('✅ AI Workflow Orchestration Setup Complete');
  return sagaResult;
}

/**
 * Example 3: Real-time Data Pipeline with Event Streaming
 * Demonstrates real-time data processing with Kafka and Elasticsearch
 */
export async function setupRealtimeDataPipeline() {
  console.log('📊 Setting up Real-time Data Pipeline');

  // 1. Create Kafka adapter
  const kafkaAdapter = createMessageQueueAdapter({
    type: 'kafka',
    host: process.env.KAFKA_HOST || 'localhost',
    port: 9092,
    auth: process.env.KAFKA_USERNAME ? {
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD || ''
    } : undefined
  });

  // 2. Create Elasticsearch adapter
  const elasticAdapter = createAPIAdapter({
    type: 'rest',
    baseUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    timeout: 10000,
    retries: 2,
    auth: process.env.ELASTICSEARCH_USERNAME ? {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD || ''
    } : undefined
  });

  // 3. Register Kafka consumer for real-time data
  await kafkaAdapter.registerConsumer({
    queue: 'user-events',
    topic: 'user-activity-events',
    groupId: 'data-pipeline-consumer',
    handler: async (message: Message) => {
      console.log('Processing user event:', message.body);

      // Transform and enrich data
      const enrichedData = await enrichUserEvent(message.body);

      // Index to Elasticsearch
      await elasticAdapter.execute({
        type: 'post',
        endpoint: '/user-events/_doc',
        data: {
          ...enrichedData,
          timestamp: new Date().toISOString(),
          processed_at: new Date().toISOString()
        }
      });

      // Publish to downstream topics
      await kafkaAdapter.execute({
        type: 'publish',
        topic: 'processed-user-events',
        message: enrichedData
      });
    }
  });

  // 4. Register Kafka consumer for analytics
  await kafkaAdapter.registerConsumer({
    queue: 'analytics-events',
    topic: 'processed-user-events',
    groupId: 'analytics-consumer',
    handler: async (message: Message) => {
      // Aggregate analytics data
      await aggregateAnalytics(message.body);
    }
  });

  // 5. Create real-time dashboard updates
  await kafkaAdapter.registerConsumer({
    queue: 'dashboard-updates',
    topic: 'processed-user-events',
    groupId: 'dashboard-consumer',
    handler: async (message: Message) => {
      // Update real-time dashboards
      await updateRealtimeDashboard(message.body);
    }
  });

  console.log('✅ Real-time Data Pipeline Setup Complete');
}

/**
 * Example 4: Multi-Cloud Integration with Circuit Breakers
 * Demonstrates resilient multi-cloud integrations
 */
export async function setupMultiCloudIntegration() {
  console.log('☁️ Setting up Multi-Cloud Integration');

  // 1. Create adapters for different cloud providers
  const awsAdapter = createAPIAdapter({
    type: 'rest',
    baseUrl: 'https://api.aws.com',
    timeout: 15000,
    retries: 3,
    auth: {
      type: 'custom',
      customAuth: async (config) => {
        // AWS signature implementation
        return config;
      }
    }
  });

  const azureAdapter = createAPIAdapter({
    type: 'rest',
    baseUrl: 'https://management.azure.com',
    timeout: 15000,
    retries: 3,
    auth: {
      type: 'bearer',
      token: process.env.AZURE_ACCESS_TOKEN || ''
    }
  });

  const gcpAdapter = createAPIAdapter({
    type: 'rest',
    baseUrl: 'https://cloudfunctions.googleapis.com/v1',
    timeout: 15000,
    retries: 3,
    auth: {
      type: 'bearer',
      token: process.env.GCP_ACCESS_TOKEN || ''
    }
  });

  // 2. Register circuit breakers for each cloud provider
  await registerCircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 60000,
    monitoringPeriod: 15000,
    name: 'aws-api-breaker'
  });

  await registerCircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 45000,
    monitoringPeriod: 15000,
    name: 'azure-api-breaker'
  });

  await registerCircuitBreaker({
    failureThreshold: 4,
    recoveryTimeout: 50000,
    monitoringPeriod: 15000,
    name: 'gcp-api-breaker'
  });

  // 3. Create resilient cloud operation function
  const executeCloudOperation = async (provider: string, operation: any) => {
    const breakerName = `${provider}-api-breaker`;
    let adapter: any;

    switch (provider) {
      case 'aws':
        adapter = awsAdapter;
        break;
      case 'azure':
        adapter = azureAdapter;
        break;
      case 'gcp':
        adapter = gcpAdapter;
        break;
      default:
        throw new Error(`Unknown cloud provider: ${provider}`);
    }

    return await executeWithCircuitBreaker(breakerName, async () => {
      return await adapter.execute(operation);
    });
  };

  // 4. Create multi-cloud deployment saga
  const multiCloudDeploymentSaga = {
    id: 'multi-cloud-deployment',
    name: 'Multi-Cloud Application Deployment',
    steps: [
      {
        id: 'validate-deployment',
        action: async (context) => {
          // Validate deployment configuration
          return { validated: true };
        }
      },
      {
        id: 'deploy-aws-resources',
        action: async (context) => {
          const result = await executeCloudOperation('aws', {
            type: 'post',
            endpoint: '/deploy',
            data: context.variables.deploymentConfig.aws
          });
          context.variables.awsDeploymentId = result.deploymentId;
          return result;
        },
        compensation: async (context) => {
          if (context.variables.awsDeploymentId) {
            await executeCloudOperation('aws', {
              type: 'delete',
              endpoint: `/deployments/${context.variables.awsDeploymentId}`
            });
          }
        }
      },
      {
        id: 'deploy-azure-resources',
        action: async (context) => {
          const result = await executeCloudOperation('azure', {
            type: 'post',
            endpoint: '/deploy',
            data: context.variables.deploymentConfig.azure
          });
          context.variables.azureDeploymentId = result.deploymentId;
          return result;
        },
        compensation: async (context) => {
          if (context.variables.azureDeploymentId) {
            await executeCloudOperation('azure', {
              type: 'delete',
              endpoint: `/deployments/${context.variables.azureDeploymentId}`
            });
          }
        }
      },
      {
        id: 'deploy-gcp-resources',
        action: async (context) => {
          const result = await executeCloudOperation('gcp', {
            type: 'post',
            endpoint: '/deploy',
            data: context.variables.deploymentConfig.gcp
          });
          context.variables.gcpDeploymentId = result.deploymentId;
          return result;
        },
        compensation: async (context) => {
          if (context.variables.gcpDeploymentId) {
            await executeCloudOperation('gcp', {
              type: 'delete',
              endpoint: `/deployments/${context.variables.gcpDeploymentId}`
            });
          }
        }
      }
    ],
    compensationSteps: {},
    timeout: 1800000 // 30 minutes
  };

  console.log('✅ Multi-Cloud Integration Setup Complete');
  return multiCloudDeploymentSaga;
}

/**
 * Example 5: Enterprise API Gateway with Rate Limiting
 * Demonstrates API gateway patterns with Kong integration
 */
export async function setupEnterpriseAPIGateway() {
  console.log('🚪 Setting up Enterprise API Gateway');

  // 1. Create Kong API Gateway adapter
  const kongAdapter = createAPIAdapter({
    type: 'rest',
    baseUrl: process.env.KONG_ADMIN_URL || 'http://localhost:8001',
    timeout: 10000,
    retries: 3,
    auth: process.env.KONG_ADMIN_TOKEN ? {
      type: 'bearer',
      token: process.env.KONG_ADMIN_TOKEN
    } : undefined
  });

  // 2. Register services in Kong
  const services = [
    {
      name: 'auterity-vllm',
      url: 'http://vllm-server:8001',
      routes: ['/api/v1/ai/vllm/*'],
      plugins: ['rate-limiting', 'request-size-limiting', 'cors']
    },
    {
      name: 'auterity-langgraph',
      url: 'http://langgraph-service:8002',
      routes: ['/api/v1/ai/langgraph/*'],
      plugins: ['rate-limiting', 'cors']
    },
    {
      name: 'auterity-crewai',
      url: 'http://crewai-service:8003',
      routes: ['/api/v1/ai/crewai/*'],
      plugins: ['rate-limiting', 'cors']
    },
    {
      name: 'auterity-workflow-studio',
      url: 'http://workflow-studio:3000',
      routes: ['/api/v1/workflows/*'],
      plugins: ['rate-limiting', 'cors', 'key-auth']
    }
  ];

  for (const service of services) {
    // Register service
    await kongAdapter.execute({
      type: 'post',
      endpoint: '/services',
      data: {
        name: service.name,
        url: service.url
      }
    });

    // Register routes
    for (const route of service.routes) {
      await kongAdapter.execute({
        type: 'post',
        endpoint: `/services/${service.name}/routes`,
        data: {
          paths: [route],
          strip_path: false
        }
      });
    }

    // Configure plugins
    for (const plugin of service.plugins) {
      const pluginConfig = getKongPluginConfig(plugin);
      await kongAdapter.execute({
        type: 'post',
        endpoint: `/services/${service.name}/plugins`,
        data: pluginConfig
      });
    }
  }

  // 3. Create API gateway monitoring route
  await createRoute({
    id: 'api-gateway-monitoring',
    name: 'API Gateway Monitoring',
    description: 'Monitor API gateway requests and responses',
    from: 'kong.requests',
    to: ['monitoring-aggregator'],
    processors: ['request-logger', 'response-metrics'],
    errorHandler: 'gateway-error-handler'
  });

  console.log('✅ Enterprise API Gateway Setup Complete');
}

/**
 * Utility functions
 */
async function processOrderCreation(orderData: any) {
  console.log('Processing order creation:', orderData);
  // Implementation here
}

async function processPayment(paymentData: any) {
  console.log('Processing payment:', paymentData);
  // Implementation here
}

async function getCustomerData(customerId: string) {
  // Mock customer data retrieval
  return {
    id: customerId,
    name: 'John Doe',
    email: 'john@example.com',
    address: '123 Main St'
  };
}

function calculateTaxes(order: any) {
  // Simple tax calculation
  return order.total * 0.08; // 8% tax
}

async function enrichUserEvent(event: any) {
  // Add geolocation, device info, etc.
  return {
    ...event,
    enriched_at: new Date().toISOString(),
    user_agent: 'Mozilla/5.0...',
    ip_location: 'New York, NY'
  };
}

async function aggregateAnalytics(event: any) {
  console.log('Aggregating analytics:', event);
  // Implementation here
}

async function updateRealtimeDashboard(event: any) {
  console.log('Updating dashboard:', event);
  // Implementation here
}

function getKongPluginConfig(pluginName: string) {
  const configs: Record<string, any> = {
    'rate-limiting': {
      name: 'rate-limiting',
      config: {
        minute: 1000,
        hour: 10000,
        policy: 'local'
      }
    },
    'request-size-limiting': {
      name: 'request-size-limiting',
      config: {
        allowed_payload_size: 10 * 1024 * 1024 // 10MB
      }
    },
    'cors': {
      name: 'cors',
      config: {
        origins: ['*'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        headers: ['Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version'],
        credentials: true
      }
    },
    'key-auth': {
      name: 'key-auth',
      config: {
        key_names: ['apikey', 'X-API-Key'],
        hide_credentials: true
      }
    }
  };

  return configs[pluginName] || {};
}

/**
 * Main integration setup function
 */
export async function setupCompleteEnterpriseIntegration() {
  console.log('🏗️ Setting up Complete Enterprise Integration Suite');

  try {
    // Setup all integration components
    await setupEcommerceOrderProcessing();
    await setupAIWorkflowOrchestration();
    await setupRealtimeDataPipeline();
    await setupMultiCloudIntegration();
    await setupEnterpriseAPIGateway();

    // Start the integration bus
    console.log('🚀 Starting Enterprise Integration Bus...');

    // Register global error handler
    enterpriseIntegrationBus.on('error', (error) => {
      console.error('Enterprise Integration Bus Error:', error);
    });

    enterpriseIntegrationBus.on('messageProcessed', (event) => {
      console.log('Message processed:', event);
    });

    console.log('✅ Complete Enterprise Integration Suite Ready!');

    return {
      status: 'ready',
      endpoints: enterpriseIntegrationBus.getEndpoints().length,
      routes: enterpriseIntegrationBus.getRoutes().length,
      processors: enterpriseIntegrationBus.getProcessors().length
    };

  } catch (error) {
    console.error('Failed to setup enterprise integration:', error);
    throw error;
  }
}

// Export all examples
export {
  setupEcommerceOrderProcessing,
  setupAIWorkflowOrchestration,
  setupRealtimeDataPipeline,
  setupMultiCloudIntegration,
  setupEnterpriseAPIGateway,
  setupCompleteEnterpriseIntegration
};

