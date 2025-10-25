/**
 * Intelligent Router Service for Auterity Unified AI Platform
 * Routes requests between Temporal, n8n, and AI services (vLLM, LangGraph, CrewAI)
 * based on performance, cost, availability, and task requirements
 */

import axios from 'axios';
import { z } from 'zod';

// Service interfaces and types
export interface ServiceEndpoint {
  name: string;
  type: 'temporal' | 'n8n' | 'vllm' | 'langgraph' | 'crewai' | 'openai' | 'anthropic';
  baseUrl: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck: Date;
  responseTime: number;
  costPerRequest: number;
  rateLimitRemaining: number;
  capabilities: string[];
  priority: number; // 1-10, higher is preferred
}

export interface RoutingRequest {
  id: string;
  type: 'workflow' | 'ai-generation' | 'ai-analysis' | 'multi-agent' | 'scheduled' | 'real-time';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requirements: {
    maxLatency?: number; // milliseconds
    maxCost?: number; // per request
    reliability?: number; // 0-1, desired success rate
    capabilities?: string[]; // required capabilities
    dataSize?: number; // estimated data size in MB
    concurrentUsers?: number; // expected concurrent load
  };
  payload: Record<string, any>;
  metadata?: {
    userId?: string;
    sessionId?: string;
    source?: string;
    tags?: string[];
    timeout?: number;
  };
  preferredServices?: string[];
  excludedServices?: string[];
}

export interface RoutingDecision {
  requestId: string;
  selectedService: string;
  fallbackServices: string[];
  reasoning: string;
  estimatedLatency: number;
  estimatedCost: number;
  confidence: number;
  alternatives: Array<{
    service: string;
    score: number;
    reasoning: string;
  }>;
}

export interface RoutingResult {
  requestId: string;
  decision: RoutingDecision;
  executionResult: any;
  actualLatency: number;
  actualCost: number;
  success: boolean;
  error?: string;
  metadata: {
    timestamp: Date;
    routingTime: number;
    retryCount: number;
  };
}

export interface RoutingMetrics {
  totalRequests: number;
  successfulRoutes: number;
  failedRoutes: number;
  averageRoutingTime: number;
  serviceUtilization: Record<string, number>;
  costEfficiency: number;
  successRate: number;
  fallbackUsage: number;
  timestamp: Date;
}

// Validation schemas
const RoutingRequestSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['workflow', 'ai-generation', 'ai-analysis', 'multi-agent', 'scheduled', 'real-time']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  requirements: z.object({
    maxLatency: z.number().optional(),
    maxCost: z.number().optional(),
    reliability: z.number().min(0).max(1).optional(),
    capabilities: z.array(z.string()).optional(),
    dataSize: z.number().optional(),
    concurrentUsers: z.number().optional()
  }),
  payload: z.record(z.any()),
  metadata: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    source: z.string().optional(),
    tags: z.array(z.string()).optional(),
    timeout: z.number().optional()
  }).optional(),
  preferredServices: z.array(z.string()).optional(),
  excludedServices: z.array(z.string()).optional()
});

class IntelligentRouter {
  private services: Map<string, ServiceEndpoint> = new Map();
  private routingHistory: RoutingResult[] = [];
  private metrics: RoutingMetrics;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.initializeServices();
    this.startHealthMonitoring();
  }

  /**
   * Initialize available services
   */
  private initializeServices(): void {
    // Define all available services with their characteristics
    const serviceConfigs = [
      {
        name: 'temporal',
        type: 'temporal' as const,
        baseUrl: process.env.TEMPORAL_BASE_URL || 'http://localhost:7233',
        costPerRequest: 0.001, // Very low cost for orchestration
        capabilities: ['workflow-orchestration', 'fault-tolerance', 'scheduling', 'long-running'],
        priority: 9
      },
      {
        name: 'n8n',
        type: 'n8n' as const,
        baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
        costPerRequest: 0.002, // Low cost for visual workflows
        capabilities: ['visual-workflows', 'no-code', 'integrations', 'api-calls'],
        priority: 8
      },
      {
        name: 'vllm',
        type: 'vllm' as const,
        baseUrl: process.env.VLLM_BASE_URL || 'http://localhost:8001',
        costPerRequest: 0.01, // Higher cost for GPU inference
        capabilities: ['text-generation', 'fast-inference', 'batch-processing', 'gpu-accelerated'],
        priority: 10
      },
      {
        name: 'langgraph',
        type: 'langgraph' as const,
        baseUrl: process.env.LANGGRAPH_BASE_URL || 'http://localhost:8002',
        costPerRequest: 0.005, // Medium cost for orchestration
        capabilities: ['workflow-orchestration', 'ai-decisions', 'complex-flows', 'state-management'],
        priority: 9
      },
      {
        name: 'crewai',
        type: 'crewai' as const,
        baseUrl: process.env.CREWAI_BASE_URL || 'http://localhost:8003',
        costPerRequest: 0.008, // Medium-high cost for multi-agent
        capabilities: ['multi-agent', 'collaboration', 'specialized-roles', 'complex-tasks'],
        priority: 8
      },
      {
        name: 'openai',
        type: 'openai' as const,
        baseUrl: 'https://api.openai.com/v1',
        costPerRequest: 0.02, // High cost for API calls
        capabilities: ['text-generation', 'analysis', 'conversational', 'multimodal'],
        priority: 7
      },
      {
        name: 'anthropic',
        type: 'anthropic' as const,
        baseUrl: 'https://api.anthropic.com',
        costPerRequest: 0.015, // Medium-high cost
        capabilities: ['text-generation', 'analysis', 'safe-ai', 'long-context'],
        priority: 7
      }
    ];

    // Initialize services with default health status
    for (const config of serviceConfigs) {
      this.services.set(config.name, {
        ...config,
        health: 'unknown',
        lastHealthCheck: new Date(),
        responseTime: 0,
        rateLimitRemaining: 1000
      });
    }
  }

  /**
   * Route a request to the most appropriate service
   */
  async routeRequest(request: RoutingRequest): Promise<RoutingResult> {
    const startTime = Date.now();

    try {
      // Validate request
      const validatedRequest = RoutingRequestSchema.parse(request);

      // Make routing decision
      const decision = await this.makeRoutingDecision(validatedRequest);

      // Execute request on selected service
      const executionResult = await this.executeOnService(decision.selectedService, validatedRequest);

      const routingTime = Date.now() - startTime;
      const result: RoutingResult = {
        requestId: request.id,
        decision,
        executionResult,
        actualLatency: executionResult.latency || 0,
        actualCost: decision.estimatedCost,
        success: !executionResult.error,
        error: executionResult.error,
        metadata: {
          timestamp: new Date(),
          routingTime,
          retryCount: 0
        }
      };

      // Store result for analytics
      this.routingHistory.push(result);
      this.updateMetrics(result);

      // Limit history size
      if (this.routingHistory.length > 10000) {
        this.routingHistory = this.routingHistory.slice(-5000);
      }

      return result;

    } catch (error: any) {
      const routingTime = Date.now() - startTime;
      const result: RoutingResult = {
        requestId: request.id,
        decision: {
          requestId: request.id,
          selectedService: 'none',
          fallbackServices: [],
          reasoning: 'Routing failed',
          estimatedLatency: 0,
          estimatedCost: 0,
          confidence: 0,
          alternatives: []
        },
        executionResult: null,
        actualLatency: routingTime,
        actualCost: 0,
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date(),
          routingTime,
          retryCount: 0
        }
      };

      this.updateMetrics(result);
      return result;
    }
  }

  /**
   * Make intelligent routing decision
   */
  private async makeRoutingDecision(request: RoutingRequest): Promise<RoutingDecision> {
    const availableServices = this.getAvailableServices(request);
    const serviceScores = new Map<string, { score: number; reasoning: string }>();

    // Score each available service
    for (const service of availableServices) {
      const score = this.calculateServiceScore(service, request);
      serviceScores.set(service.name, score);
    }

    // Sort services by score
    const sortedServices = Array.from(serviceScores.entries())
      .sort(([, a], [, b]) => b.score - a.score);

    if (sortedServices.length === 0) {
      throw new Error('No suitable services available');
    }

    const bestService = sortedServices[0];
    const serviceEndpoint = this.services.get(bestService[0]);

    if (!serviceEndpoint) {
      throw new Error('Selected service not found');
    }

    // Generate alternatives
    const alternatives = sortedServices.slice(1, 4).map(([serviceName, scoreData]) => ({
      service: serviceName,
      score: scoreData.score,
      reasoning: scoreData.reasoning
    }));

    return {
      requestId: request.id,
      selectedService: bestService[0],
      fallbackServices: alternatives.map(alt => alt.service),
      reasoning: bestService[1].reasoning,
      estimatedLatency: serviceEndpoint.responseTime,
      estimatedCost: serviceEndpoint.costPerRequest,
      confidence: Math.min(bestService[1].score / 100, 0.95),
      alternatives
    };
  }

  /**
   * Calculate score for a service based on request requirements
   */
  private calculateServiceScore(service: ServiceEndpoint, request: RoutingRequest): { score: number; reasoning: string } {
    let score = service.priority * 10; // Base score from priority
    const reasons: string[] = [];

    // Health bonus
    if (service.health === 'healthy') {
      score += 20;
      reasons.push('Service is healthy');
    } else if (service.health === 'degraded') {
      score += 5;
      reasons.push('Service is degraded but available');
    } else {
      score -= 50;
      reasons.push('Service health is unknown or unhealthy');
    }

    // Response time consideration
    if (request.requirements.maxLatency && service.responseTime > request.requirements.maxLatency) {
      score -= 30;
      reasons.push(`Response time (${service.responseTime}ms) exceeds limit (${request.requirements.maxLatency}ms)`);
    } else if (service.responseTime < 1000) {
      score += 15;
      reasons.push('Fast response time');
    }

    // Cost consideration
    if (request.requirements.maxCost && service.costPerRequest > request.requirements.maxCost) {
      score -= 25;
      reasons.push(`Cost (${service.costPerRequest}) exceeds budget (${request.requirements.maxCost})`);
    } else if (service.costPerRequest < 0.005) {
      score += 10;
      reasons.push('Cost-effective service');
    }

    // Capability matching
    if (request.requirements.capabilities) {
      const matchingCapabilities = request.requirements.capabilities.filter(cap =>
        service.capabilities.includes(cap)
      );
      const capabilityScore = (matchingCapabilities.length / request.requirements.capabilities.length) * 40;
      score += capabilityScore;
      reasons.push(`${matchingCapabilities.length}/${request.requirements.capabilities.length} capabilities match`);
    }

    // Type-specific scoring
    score += this.getTypeSpecificScore(service, request);
    reasons.push(...this.getTypeSpecificReasons(service, request));

    // Priority consideration
    if (request.priority === 'critical') {
      score += 20; // Prioritize reliability for critical requests
    } else if (request.priority === 'high') {
      score += 10;
    }

    // Preferred services bonus
    if (request.preferredServices?.includes(service.name)) {
      score += 25;
      reasons.push('Preferred service');
    }

    // Excluded services penalty
    if (request.excludedServices?.includes(service.name)) {
      score -= 100;
      reasons.push('Excluded service');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasoning: reasons.join('; ')
    };
  }

  /**
   * Get type-specific scoring adjustments
   */
  private getTypeSpecificScore(service: ServiceEndpoint, request: RoutingRequest): number {
    switch (request.type) {
      case 'workflow':
        if (service.type === 'temporal' || service.type === 'langgraph') return 15;
        if (service.type === 'n8n') return 10;
        break;

      case 'ai-generation':
        if (service.type === 'vllm') return 20;
        if (service.type === 'openai' || service.type === 'anthropic') return 15;
        break;

      case 'ai-analysis':
        if (service.type === 'vllm' || service.type === 'openai') return 15;
        if (service.type === 'anthropic') return 10;
        break;

      case 'multi-agent':
        if (service.type === 'crewai') return 25;
        if (service.type === 'temporal') return 10;
        break;

      case 'scheduled':
        if (service.type === 'temporal') return 20;
        if (service.type === 'n8n') return 10;
        break;

      case 'real-time':
        if (service.responseTime < 500) return 20;
        if (service.responseTime < 1000) return 10;
        break;
    }

    return 0;
  }

  /**
   * Get type-specific reasoning
   */
  private getTypeSpecificReasons(service: ServiceEndpoint, request: RoutingRequest): string[] {
    const reasons: string[] = [];

    switch (request.type) {
      case 'workflow':
        if (service.type === 'temporal') reasons.push('Optimized for workflow orchestration');
        if (service.type === 'langgraph') reasons.push('AI-powered workflow execution');
        if (service.type === 'n8n') reasons.push('Visual workflow platform');
        break;

      case 'ai-generation':
        if (service.type === 'vllm') reasons.push('GPU-accelerated text generation');
        if (service.type === 'openai' || service.type === 'anthropic') reasons.push('High-quality AI models');
        break;

      case 'multi-agent':
        if (service.type === 'crewai') reasons.push('Specialized for multi-agent collaboration');
        break;
    }

    return reasons;
  }

  /**
   * Get available services for a request
   */
  private getAvailableServices(request: RoutingRequest): ServiceEndpoint[] {
    return Array.from(this.services.values())
      .filter(service => service.health !== 'unhealthy')
      .filter(service => !request.excludedServices?.includes(service.name));
  }

  /**
   * Execute request on selected service
   */
  private async executeOnService(serviceName: string, request: RoutingRequest): Promise<any> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const startTime = Date.now();

    try {
      switch (service.type) {
        case 'temporal':
          return await this.executeTemporal(request, service);
        case 'n8n':
          return await this.executeN8n(request, service);
        case 'vllm':
          return await this.executeVLLM(request, service);
        case 'langgraph':
          return await this.executeLangGraph(request, service);
        case 'crewai':
          return await this.executeCrewAI(request, service);
        case 'openai':
          return await this.executeOpenAI(request, service);
        case 'anthropic':
          return await this.executeAnthropic(request, service);
        default:
          throw new Error(`Unsupported service type: ${service.type}`);
      }
    } catch (error: any) {
      return {
        error: error.message,
        latency: Date.now() - startTime,
        service: serviceName
      };
    }
  }

  /**
   * Execute on Temporal service
   */
  private async executeTemporal(request: RoutingRequest, service: ServiceEndpoint): Promise<any> {
    // Import temporal service dynamically to avoid circular dependencies
    const { temporalService } = await import('../apps/workflow-studio/src/services/enterprise/TemporalService');

    const workflow = await temporalService.startWorkflow(
      `routed-workflow-${request.id}`,
      request.type === 'workflow' ? 'ai-processing' : 'scheduled',
      request.payload,
      {
        priority: request.priority,
        timeout: request.metadata?.timeout
      }
    );

    return {
      workflowId: workflow,
      status: 'started',
      latency: 0
    };
  }

  /**
   * Execute on n8n service
   */
  private async executeN8n(request: RoutingRequest, service: ServiceEndpoint): Promise<any> {
    const { n8nApiService } = await import('../apps/workflow-studio/src/services/n8n/n8nApiService');

    const result = await n8nApiService.triggerWorkflow({
      workflowId: request.payload.workflowId || 'default-workflow',
      parameters: request.payload,
      userId: request.metadata?.userId
    });

    return result;
  }

  /**
   * Execute on vLLM service
   */
  private async executeVLLM(request: RoutingRequest, service: ServiceEndpoint): Promise<any> {
    const response = await axios.post(`${service.baseUrl}/v1/generate`, {
      prompt: request.payload.prompt,
      temperature: request.payload.temperature || 0.7,
      max_tokens: request.payload.maxTokens || 1000
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data;
  }

  /**
   * Execute on LangGraph service
   */
  private async executeLangGraph(request: RoutingRequest, service: ServiceEndpoint): Promise<any> {
    const response = await axios.post(`${service.baseUrl}/workflows/${request.payload.workflowId}/execute`, {
      input: request.payload.input
    }, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data;
  }

  /**
   * Execute on CrewAI service
   */
  private async executeCrewAI(request: RoutingRequest, service: ServiceEndpoint): Promise<any> {
    const response = await axios.post(`${service.baseUrl}/crews/${request.payload.crewId}/execute`, {
      input_data: request.payload.input
    }, {
      timeout: 120000,
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data;
  }

  /**
   * Execute on OpenAI service
   */
  private async executeOpenAI(request: RoutingRequest, service: ServiceEndpoint): Promise<any> {
    const response = await axios.post(`${service.baseUrl}/chat/completions`, {
      model: request.payload.model || 'gpt-4',
      messages: [{ role: 'user', content: request.payload.prompt }],
      temperature: request.payload.temperature || 0.7,
      max_tokens: request.payload.maxTokens || 1000
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    return response.data.choices[0].message.content;
  }

  /**
   * Execute on Anthropic service
   */
  private async executeAnthropic(request: RoutingRequest, service: ServiceEndpoint): Promise<any> {
    const response = await axios.post(`${service.baseUrl}/v1/messages`, {
      model: request.payload.model || 'claude-3-sonnet-20240229',
      max_tokens: request.payload.maxTokens || 1000,
      messages: [{ role: 'user', content: request.payload.prompt }]
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    return response.data.content[0].text;
  }

  /**
   * Start health monitoring for all services
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.checkServiceHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check health of all services
   */
  private async checkServiceHealth(): Promise<void> {
    for (const [name, service] of this.services.entries()) {
      try {
        const startTime = Date.now();

        let isHealthy = false;
        switch (service.type) {
          case 'temporal':
          case 'n8n':
          case 'vllm':
          case 'langgraph':
          case 'crewai':
            isHealthy = await this.checkHTTPHealth(service.baseUrl);
            break;
          case 'openai':
            isHealthy = !!process.env.OPENAI_API_KEY;
            break;
          case 'anthropic':
            isHealthy = !!process.env.ANTHROPIC_API_KEY;
            break;
        }

        const responseTime = Date.now() - startTime;

        this.services.set(name, {
          ...service,
          health: isHealthy ? 'healthy' : 'unhealthy',
          lastHealthCheck: new Date(),
          responseTime
        });

      } catch (error) {
        this.services.set(name, {
          ...service,
          health: 'unhealthy',
          lastHealthCheck: new Date(),
          responseTime: 0
        });
      }
    }
  }

  /**
   * Check HTTP-based service health
   */
  private async checkHTTPHealth(baseUrl: string): Promise<boolean> {
    try {
      const response = await axios.get(`${baseUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): RoutingMetrics {
    return {
      totalRequests: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      averageRoutingTime: 0,
      serviceUtilization: {},
      costEfficiency: 1.0,
      successRate: 1.0,
      fallbackUsage: 0,
      timestamp: new Date()
    };
  }

  /**
   * Update metrics based on routing result
   */
  private updateMetrics(result: RoutingResult): void {
    this.metrics.totalRequests++;

    if (result.success) {
      this.metrics.successfulRoutes++;
    } else {
      this.metrics.failedRoutes++;
    }

    // Update routing time (exponential moving average)
    const routingTime = result.metadata.routingTime;
    const alpha = 0.1;
    this.metrics.averageRoutingTime = this.metrics.averageRoutingTime * (1 - alpha) + routingTime * alpha;

    // Update service utilization
    const service = result.decision.selectedService;
    this.metrics.serviceUtilization[service] = (this.metrics.serviceUtilization[service] || 0) + 1;

    // Update success rate
    const alpha2 = 0.05;
    this.metrics.successRate = this.metrics.successRate * (1 - alpha2) + (result.success ? 1 : 0) * alpha2;

    // Update fallback usage
    if (result.decision.fallbackServices.length > 0 && result.decision.selectedService !== result.decision.fallbackServices[0]) {
      this.metrics.fallbackUsage += 1;
    }

    this.metrics.timestamp = new Date();
  }

  /**
   * Get comprehensive routing metrics
   */
  getMetrics(): RoutingMetrics {
    return { ...this.metrics };
  }

  /**
   * Get service health status
   */
  getServiceHealth(): ServiceEndpoint[] {
    return Array.from(this.services.values());
  }

  /**
   * Get routing history
   */
  getRoutingHistory(limit: number = 50): RoutingResult[] {
    return this.routingHistory.slice(-limit);
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    servicePerformance: Record<string, { avgLatency: number; successRate: number; usage: number }>;
    requestTypeDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
  } {
    const servicePerformance: Record<string, { avgLatency: number; successRate: number; usage: number }> = {};
    const requestTypeDistribution: Record<string, number> = {};
    const priorityDistribution: Record<string, number> = {};

    // Calculate service performance
    for (const result of this.routingHistory.slice(-1000)) { // Last 1000 requests
      const service = result.decision.selectedService;

      if (!servicePerformance[service]) {
        servicePerformance[service] = { avgLatency: 0, successRate: 0, usage: 0 };
      }

      servicePerformance[service].usage++;
      servicePerformance[service].avgLatency = (servicePerformance[service].avgLatency + result.actualLatency) / 2;
      servicePerformance[service].successRate = (servicePerformance[service].successRate + (result.success ? 1 : 0)) / 2;

      // Update distributions
      if (result.decision.requestId) {
        const request = this.routingHistory.find(r => r.requestId === result.decision.requestId);
        if (request) {
          // This would need access to original request type and priority
          // For now, we'll use placeholders
        }
      }
    }

    return {
      servicePerformance,
      requestTypeDistribution,
      priorityDistribution
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Export singleton instance
export const intelligentRouter = new IntelligentRouter();

// Export types
export type { RoutingRequest, RoutingDecision, RoutingResult, RoutingMetrics, ServiceEndpoint };

// Cleanup on process exit
process.on('exit', () => {
  intelligentRouter.cleanup();
});

process.on('SIGINT', () => {
  intelligentRouter.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  intelligentRouter.cleanup();
  process.exit(0);
});

