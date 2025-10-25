/**
 * Intelligent Router Usage Examples
 * Demonstrates how to use the intelligent routing system
 */

import { intelligentRouter, RoutingRequest } from './intelligentRouter';

/**
 * Example 1: AI Text Generation with Intelligent Routing
 * The router will automatically choose the best service based on requirements
 */
export async function exampleAITextGeneration() {
  const request: RoutingRequest = {
    id: 'gen_' + Date.now(),
    type: 'ai-generation',
    priority: 'high',
    requirements: {
      maxLatency: 5000, // 5 seconds max
      maxCost: 0.01,    // Max $0.01 per request
      reliability: 0.95, // 95% success rate required
      capabilities: ['text-generation', 'fast-inference']
    },
    payload: {
      prompt: 'Write a short story about AI taking over the world',
      temperature: 0.8,
      maxTokens: 500
    },
    metadata: {
      userId: 'user123',
      source: 'web-app',
      tags: ['creative', 'storytelling']
    },
    preferredServices: ['vllm', 'openai'], // Prefer these services
    excludedServices: ['anthropic'] // Don't use this one
  };

  try {
    const result = await intelligentRouter.routeRequest(request);

    console.log('Routing Decision:', {
      selectedService: result.decision.selectedService,
      reasoning: result.decision.reasoning,
      confidence: result.decision.confidence,
      estimatedCost: result.decision.estimatedCost
    });

    if (result.success) {
      console.log('Generated Text:', result.executionResult);
      console.log('Actual Cost:', result.actualCost);
      console.log('Actual Latency:', result.actualLatency);
    } else {
      console.error('Request failed:', result.error);
    }

    return result;
  } catch (error) {
    console.error('Routing failed:', error);
  }
}

/**
 * Example 2: Workflow Execution with Cost Optimization
 * Router chooses the most cost-effective service that meets requirements
 */
export async function exampleWorkflowExecution() {
  const request: RoutingRequest = {
    id: 'wf_' + Date.now(),
    type: 'workflow',
    priority: 'medium',
    requirements: {
      maxCost: 0.005,   // Very cost-sensitive
      reliability: 0.99, // High reliability required
      capabilities: ['workflow-orchestration', 'fault-tolerance']
    },
    payload: {
      workflowId: 'data-processing-workflow',
      input: {
        dataSource: 's3://my-bucket/data.csv',
        processingSteps: ['validate', 'transform', 'aggregate'],
        outputFormat: 'json'
      }
    },
    metadata: {
      userId: 'user456',
      sessionId: 'session_abc123',
      tags: ['data-processing', 'batch-job']
    }
  };

  const result = await intelligentRouter.routeRequest(request);

  console.log('Workflow Routing:', {
    service: result.decision.selectedService,
    costSavings: (0.02 - result.actualCost) / 0.02 * 100 + '% vs expensive service',
    alternatives: result.decision.alternatives.map(alt => `${alt.service}: ${alt.score}`)
  });

  return result;
}

/**
 * Example 3: Real-time Request with Low Latency Requirements
 * Router prioritizes speed over cost for time-sensitive requests
 */
export async function exampleRealTimeRequest() {
  const request: RoutingRequest = {
    id: 'rt_' + Date.now(),
    type: 'real-time',
    priority: 'critical',
    requirements: {
      maxLatency: 1000, // Must respond within 1 second
      capabilities: ['fast-inference', 'low-latency']
    },
    payload: {
      query: 'What is the capital of France?',
      context: 'Geography quiz application'
    },
    metadata: {
      userId: 'quiz_user_789',
      source: 'mobile-app',
      timeout: 2000 // 2 second total timeout
    },
    preferredServices: ['vllm'], // Prefer fastest service
    excludedServices: ['temporal', 'n8n'] // Exclude slower orchestration services
  };

  const startTime = Date.now();
  const result = await intelligentRouter.routeRequest(request);
  const totalTime = Date.now() - startTime;

  console.log('Real-time Performance:', {
    totalTime: `${totalTime}ms`,
    routingTime: `${result.metadata.routingTime}ms`,
    executionTime: `${result.actualLatency}ms`,
    service: result.decision.selectedService
  });

  return result;
}

/**
 * Example 4: Multi-Agent Collaboration with Intelligent Fallback
 * Router handles complex tasks with multiple fallback options
 */
export async function exampleMultiAgentCollaboration() {
  const request: RoutingRequest = {
    id: 'crew_' + Date.now(),
    type: 'multi-agent',
    priority: 'high',
    requirements: {
      reliability: 0.95,
      capabilities: ['multi-agent', 'collaboration', 'specialized-roles']
    },
    payload: {
      crewId: 'content-creation-crew',
      task: 'Create a comprehensive marketing campaign for a new AI product',
      context: {
        productName: 'AI Assistant Pro',
        targetAudience: 'enterprise developers',
        campaignGoals: ['brand awareness', 'lead generation', 'product adoption'],
        budget: 50000,
        timeline: '3 months'
      }
    },
    metadata: {
      userId: 'marketing_team_101',
      source: 'marketing-platform',
      tags: ['marketing', 'campaign', 'ai-product']
    }
  };

  const result = await intelligentRouter.routeRequest(request);

  console.log('Multi-Agent Execution:', {
    primaryService: result.decision.selectedService,
    fallbacksAvailable: result.decision.fallbackServices.length,
    confidence: result.decision.confidence,
    reasoning: result.decision.reasoning
  });

  if (!result.success && result.decision.fallbackServices.length > 0) {
    console.log('Attempting fallback to:', result.decision.fallbackServices[0]);
    // Could implement automatic fallback logic here
  }

  return result;
}

/**
 * Example 5: Batch Processing with Resource Optimization
 * Router optimizes for cost and throughput in batch scenarios
 */
export async function exampleBatchProcessing() {
  const requests: RoutingRequest[] = [];

  // Create multiple similar requests for batch processing
  for (let i = 0; i < 10; i++) {
    requests.push({
      id: `batch_${i}_${Date.now()}`,
      type: 'ai-analysis',
      priority: 'low',
      requirements: {
        maxCost: 0.002, // Cost-sensitive for batch processing
        dataSize: 1, // 1MB per request
        concurrentUsers: 10 // Expecting concurrent load
      },
      payload: {
        content: `Analyze sentiment of customer review ${i}: [review content here]`,
        analysisType: 'sentiment'
      },
      metadata: {
        userId: 'batch_processor',
        source: 'analytics-pipeline',
        tags: ['batch', 'sentiment-analysis']
      }
    });
  }

  // Process batch with intelligent routing
  const results = await Promise.all(
    requests.map(request => intelligentRouter.routeRequest(request))
  );

  // Analyze batch results
  const serviceDistribution = results.reduce((acc, result) => {
    acc[result.decision.selectedService] = (acc[result.decision.selectedService] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCost = results.reduce((sum, result) => sum + result.actualCost, 0);
  const averageLatency = results.reduce((sum, result) => sum + result.actualLatency, 0) / results.length;

  console.log('Batch Processing Results:', {
    totalRequests: results.length,
    serviceDistribution,
    totalCost: `$${totalCost.toFixed(4)}`,
    averageLatency: `${averageLatency.toFixed(0)}ms`,
    successRate: `${(results.filter(r => r.success).length / results.length * 100).toFixed(1)}%`
  });

  return results;
}

/**
 * Example 6: Monitoring and Analytics
 * Demonstrates how to monitor router performance
 */
export async function exampleMonitoring() {
  // Get current metrics
  const metrics = intelligentRouter.getMetrics();
  const serviceHealth = intelligentRouter.getServiceHealth();
  const routingStats = intelligentRouter.getRoutingStats();

  console.log('Router Metrics:', {
    totalRequests: metrics.totalRequests,
    successRate: `${(metrics.successRate * 100).toFixed(1)}%`,
    averageRoutingTime: `${metrics.averageRoutingTime.toFixed(0)}ms`,
    serviceUtilization: metrics.serviceUtilization
  });

  console.log('Service Health:');
  serviceHealth.forEach(service => {
    console.log(`  ${service.name}: ${service.health} (${service.responseTime}ms)`);
  });

  console.log('Routing Statistics:', {
    topPerformingServices: Object.entries(routingStats.servicePerformance)
      .sort(([,a], [,b]) => b.avgLatency - a.avgLatency)
      .slice(0, 3)
      .map(([service, stats]) => `${service}: ${stats.avgLatency.toFixed(0)}ms avg`)
  });

  return {
    metrics,
    serviceHealth,
    routingStats
  };
}

/**
 * Example 7: Custom Routing Strategy
 * Demonstrates how to implement custom routing logic
 */
export async function exampleCustomRouting() {
  // Custom routing based on time of day
  const currentHour = new Date().getHours();
  const isBusinessHours = currentHour >= 9 && currentHour <= 17;

  const request: RoutingRequest = {
    id: 'custom_' + Date.now(),
    type: 'ai-generation',
    priority: 'medium',
    requirements: {
      maxCost: isBusinessHours ? 0.02 : 0.005, // More expensive during business hours
      capabilities: ['text-generation']
    },
    payload: {
      prompt: 'Generate a business report summary',
      temperature: 0.3,
      maxTokens: 300
    },
    metadata: {
      userId: 'business_user',
      source: 'enterprise-app',
      tags: ['business', 'report']
    },
    // Dynamic service preference based on time
    preferredServices: isBusinessHours
      ? ['openai', 'anthropic'] // Premium services during business hours
      : ['vllm', 'n8n'] // Cost-effective services off-hours
  };

  const result = await intelligentRouter.routeRequest(request);

  console.log('Time-based Routing:', {
    timeOfDay: isBusinessHours ? 'business hours' : 'off-hours',
    selectedService: result.decision.selectedService,
    reasoning: result.decision.reasoning,
    costOptimization: !isBusinessHours
  });

  return result;
}

/**
 * Main example runner
 */
export async function runAllExamples() {
  console.log('🚀 Running Intelligent Router Examples...\n');

  try {
    console.log('📝 Example 1: AI Text Generation');
    await exampleAITextGeneration();
    console.log('');

    console.log('⚡ Example 2: Workflow Execution');
    await exampleWorkflowExecution();
    console.log('');

    console.log('⚡ Example 3: Real-time Request');
    await exampleRealTimeRequest();
    console.log('');

    console.log('🤖 Example 4: Multi-Agent Collaboration');
    await exampleMultiAgentCollaboration();
    console.log('');

    console.log('📊 Example 5: Batch Processing');
    await exampleBatchProcessing();
    console.log('');

    console.log('📈 Example 6: Monitoring');
    await exampleMonitoring();
    console.log('');

    console.log('🎯 Example 7: Custom Routing');
    await exampleCustomRouting();
    console.log('');

    console.log('✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Export for use in other modules
export {
  exampleAITextGeneration,
  exampleWorkflowExecution,
  exampleRealTimeRequest,
  exampleMultiAgentCollaboration,
  exampleBatchProcessing,
  exampleMonitoring,
  exampleCustomRouting,
  runAllExamples
};

