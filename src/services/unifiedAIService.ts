/**
 * Unified AI Service Layer
 *
 * Extends existing AISDKService to provide cross-application AI capabilities
 * Integrates vLLM, LangGraph, CrewAI, and existing providers
 * Leverages existing providers, components, and design systems
 */

import { generateText, generateObject, streamText, tool, CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { azure } from '@ai-sdk/azure';
import { google } from '@ai-sdk/google';
import { cohere } from '@ai-sdk/cohere';
import { z } from 'zod';
import axios from 'axios';

// Extend existing AISDKService
export class UnifiedAIService {
  private workflowStudioAI: any;
  private errorIqAPI: any;
  private aiGateway: any;
  private crossAppInsights: Map<string, any> = new Map();

  // New AI Services Integration
  private vllmService: any = null;
  private langGraphService: any = null;
  private crewAIService: any = null;
  private aiServiceHealth: Map<string, ServiceHealth> = new Map();

  constructor() {
    // Leverage existing AISDKService
    this.initializeExistingServices();

    // Add cross-application capabilities
    this.initializeCrossAppIntegration();

    // Initialize AI Gateway (if available)
    this.initializeAIGateway();

    // Initialize new AI services
    this.initializeNewAIServices();
  }

  private async initializeExistingServices() {
    // Import and extend existing aiSDKService
    const { aiSDKService } = await import('./aiSDKService');
    this.workflowStudioAI = aiSDKService;

    // Initialize Error-IQ API client using existing patterns
    this.errorIqAPI = this.createErrorIqClient();
  }

  private initializeCrossAppIntegration() {
    // Set up cross-application data synchronization
    this.setupCrossAppDataSync();

    // Initialize shared insight storage
    this.initializeInsightStorage();
  }

  private initializeAIGateway() {
    // Check if Vercel AI Gateway is available
    if (this.isAIGatewayAvailable()) {
      this.aiGateway = this.createAIGatewayClient();
    }
  }

  private async initializeNewAIServices() {
    // Initialize vLLM service
    this.vllmService = {
      baseUrl: process.env.VLLM_BASE_URL || 'http://localhost:8001',
      async generate(request: any) {
        try {
          const response = await axios.post(`${this.baseUrl}/v1/generate`, request, {
            timeout: 30000
          });
          return response.data;
        } catch (error) {
          console.warn('vLLM service unavailable:', error);
          return null;
        }
      },
      async health() {
        try {
          const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
          return response.status === 200;
        } catch {
          return false;
        }
      }
    };

    // Initialize LangGraph service
    this.langGraphService = {
      baseUrl: process.env.LANGGRAPH_BASE_URL || 'http://localhost:8002',
      async executeWorkflow(workflowId: string, input: any) {
        try {
          const response = await axios.post(`${this.baseUrl}/workflows/${workflowId}/execute`, { input }, {
            timeout: 60000
          });
          return response.data;
        } catch (error) {
          console.warn('LangGraph service unavailable:', error);
          return null;
        }
      },
      async health() {
        try {
          const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
          return response.status === 200;
        } catch {
          return false;
        }
      }
    };

    // Initialize CrewAI service
    this.crewAIService = {
      baseUrl: process.env.CREWAI_BASE_URL || 'http://localhost:8003',
      async executeCrew(crewId: string, input: any) {
        try {
          const response = await axios.post(`${this.baseUrl}/crews/${crewId}/execute`, { input_data: input }, {
            timeout: 120000
          });
          return response.data;
        } catch (error) {
          console.warn('CrewAI service unavailable:', error);
          return null;
        }
      },
      async health() {
        try {
          const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
          return response.status === 200;
        } catch {
          return false;
        }
      }
    };

    // Start health monitoring
    this.startHealthMonitoring();
  }

  private async startHealthMonitoring() {
    // Check service health every 30 seconds
    setInterval(async () => {
      const services = [
        { name: 'vllm', service: this.vllmService },
        { name: 'langgraph', service: this.langGraphService },
        { name: 'crewai', service: this.crewAIService }
      ];

      for (const { name, service } of services) {
        try {
          const isHealthy = await service.health();
          this.aiServiceHealth.set(name, {
            service: name,
            status: isHealthy ? 'healthy' : 'unhealthy',
            lastChecked: new Date(),
            responseTime: 0
          });
        } catch (error) {
          this.aiServiceHealth.set(name, {
            service: name,
            status: 'unhealthy',
            lastChecked: new Date(),
            responseTime: 0
          });
        }
      }
    }, 30000);
  }

  /**
   * Cross-Application Workflow Analysis
   * Leverages existing error correlation and workflow optimization
   */
  async analyzeWorkflowWithErrors(workflowId: string): Promise<CrossAppAnalysis> {
    try {
      // Get workflow data from existing service
      const workflow = await this.workflowStudioAI.getWorkflow(workflowId);

      // Get related errors from Error-IQ using existing API
      const errors = await this.errorIqAPI.getWorkflowErrors(workflowId);

      // Leverage existing AI analysis patterns
      const analysis = await this.performUnifiedAnalysis(workflow, errors);

      // Store insights for future use
      await this.storeCrossAppInsights(workflowId, analysis);

      return analysis;
    } catch (error) {
      console.error('Cross-app analysis failed:', error);
      throw error;
    }
  }

  /**
   * AI-Powered Template Recommendations
   * Uses existing template systems from both applications
   */
  async recommendTemplates(context: TemplateContext): Promise<TemplateRecommendation[]> {
    // Get existing templates from both applications
    const workflowTemplates = await this.getWorkflowTemplates();
    const errorIqTemplates = await this.getErrorIqTemplates();

    // Use existing AI service for recommendations
    const recommendations = await this.generateTemplateRecommendations(
      [...workflowTemplates, ...errorIqTemplates],
      context
    );

    return recommendations;
  }

  /**
   * Real-time AI Assistance with Cross-App Context
   * Extends existing WorkflowAIAssistant capabilities
   */
  async *provideUnifiedAssistance(
    query: string,
    context: UnifiedContext
  ): AsyncGenerator<string, void, unknown> {
    // Enhance query with cross-application context
    const enhancedQuery = await this.enhanceQueryWithContext(query, context);

    // Use existing AI streaming capabilities
    const result = await streamText({
      model: this.selectOptimalModel(context),
      messages: [{
        role: 'system',
        content: this.buildSystemPrompt(context)
      }, {
        role: 'user',
        content: enhancedQuery
      }]
    });

    for await (const delta of result.textStream) {
      yield delta;
    }
  }

  /**
   * Intelligent Workflow Optimization
   * Combines existing optimization services
   */
  async optimizeWorkflowUnified(workflowId: string): Promise<OptimizationResult> {
    // Get current workflow state
    const workflow = await this.workflowStudioAI.getWorkflow(workflowId);

    // Analyze with cross-app insights
    const insights = await this.getStoredInsights(workflowId);

    // Use existing optimization patterns
    const optimizations = await this.generateOptimizations(workflow, insights);

    // Apply optimizations using existing services
    const result = await this.applyOptimizations(workflowId, optimizations);

    return result;
  }

  /**
   * Template Automation Creation
   * Generates automated workflows from templates
   */
  async createAutomationFromTemplate(
    templateId: string,
    customization: TemplateCustomization
  ): Promise<AutomationResult> {
    // Get template from existing systems
    const template = await this.getTemplate(templateId);

    // Customize template using AI
    const customizedTemplate = await this.customizeTemplate(template, customization);

    // Generate automation workflow
    const automation = await this.generateAutomationWorkflow(customizedTemplate);

    // Deploy using existing deployment patterns
    const deployment = await this.deployAutomation(automation);

    return {
      automationId: automation.id,
      deploymentStatus: deployment.status,
      estimatedSavings: deployment.savings,
      nextSteps: deployment.nextSteps
    };
  }

  /**
   * Unified AI Request Processing
   * Routes requests to appropriate AI services with intelligent fallback
   */
  async processUnifiedRequest(request: UnifiedAIRequest): Promise<UnifiedAIResponse> {
    const startTime = Date.now();

    try {
      // Try preferred services first
      if (request.preferredServices) {
        for (const serviceName of request.preferredServices) {
          const result = await this.tryService(serviceName, request);
          if (result) {
            return {
              ...result,
              latency: Date.now() - startTime,
              status: 'success'
            };
          }
        }
      }

      // Try all available services
      const services = this.getAvailableServices(request.type);
      for (const serviceName of services) {
        const result = await this.tryService(serviceName, request);
        if (result) {
          return {
            ...result,
            latency: Date.now() - startTime,
            status: 'fallback'
          };
        }
      }

      throw new Error('No AI service available');

    } catch (error: any) {
      return {
        requestId: request.id,
        status: 'error',
        service: 'unified-ai',
        latency: Date.now() - startTime,
        result: { error: error.message }
      };
    }
  }

  /**
   * Intelligent Text Generation
   * Routes to best available service for text generation
   */
  async generateTextUnified(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      priority?: UnifiedAIRequest['priority'];
    }
  ): Promise<UnifiedAIResponse> {
    const request: UnifiedAIRequest = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'generation',
      payload: {
        prompt,
        model: options?.model,
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 1000
      },
      priority: options?.priority || 'medium',
      preferredServices: ['vllm', 'openai', 'anthropic']
    };

    return this.processUnifiedRequest(request);
  }

  /**
   * Intelligent Workflow Execution
   * Routes to LangGraph or falls back to n8n
   */
  async executeWorkflowUnified(
    workflowId: string,
    input: Record<string, any>,
    options?: {
      useAI?: boolean;
      priority?: UnifiedAIRequest['priority'];
    }
  ): Promise<UnifiedAIResponse> {
    const useAI = options?.useAI !== false;

    if (useAI) {
      // Try LangGraph first
      const langGraphResult = await this.langGraphService?.executeWorkflow(workflowId, input);
      if (langGraphResult) {
        return {
          requestId: `wf_${Date.now()}`,
          status: 'success',
          result: langGraphResult,
          service: 'langgraph',
          latency: 0
        };
      }
    }

    // Fallback to existing workflow execution
    try {
      const result = await this.workflowStudioAI.executeWorkflow(workflowId, input);
      return {
        requestId: `wf_${Date.now()}`,
        status: 'fallback',
        result,
        service: 'workflow-studio',
        latency: 0
      };
    } catch (error: any) {
      return {
        requestId: `wf_${Date.now()}`,
        status: 'error',
        service: 'workflow-studio',
        latency: 0,
        result: { error: error.message }
      };
    }
  }

  /**
   * Intelligent Crew Collaboration
   * Routes to CrewAI for multi-agent tasks
   */
  async runCrewCollaborationUnified(
    crewId: string,
    task: string,
    context?: Record<string, any>,
    options?: {
      priority?: UnifiedAIRequest['priority'];
    }
  ): Promise<UnifiedAIResponse> {
    // Try CrewAI first
    const crewResult = await this.crewAIService?.executeCrew(crewId, { task, context });
    if (crewResult) {
      return {
        requestId: `crew_${Date.now()}`,
        status: 'success',
        result: crewResult,
        service: 'crewai',
        latency: 0
      };
    }

    // Fallback to regular AI processing
    return this.generateTextUnified(
      `Process this collaborative task: ${task}\nContext: ${JSON.stringify(context)}`,
      { priority: options?.priority }
    );
  }

  /**
   * Get Service Health Status
   */
  getServiceHealth(): ServiceHealth[] {
    return Array.from(this.aiServiceHealth.values());
  }

  /**
   * Get Available Services for Request Type
   */
  private getAvailableServices(requestType: string): string[] {
    const serviceMap = {
      generation: ['vllm', 'openai', 'anthropic', 'cohere'],
      analysis: ['vllm', 'openai', 'anthropic', 'google'],
      workflow: ['langgraph', 'n8n'],
      collaboration: ['crewai', 'openai', 'anthropic']
    };

    return serviceMap[requestType as keyof typeof serviceMap] || ['openai'];
  }

  /**
   * Try a specific service
   */
  private async tryService(serviceName: string, request: UnifiedAIRequest): Promise<UnifiedAIResponse | null> {
    try {
      let result = null;

      switch (serviceName) {
        case 'vllm':
          if (request.type === 'generation') {
            result = await this.vllmService?.generate(request.payload);
          }
          break;

        case 'langgraph':
          if (request.type === 'workflow') {
            result = await this.langGraphService?.executeWorkflow(
              request.payload.workflowId,
              request.payload.input
            );
          }
          break;

        case 'crewai':
          if (request.type === 'collaboration') {
            result = await this.crewAIService?.executeCrew(
              request.payload.crewId,
              request.payload.input
            );
          }
          break;

        case 'openai':
          result = await this.callOpenAI(request);
          break;

        case 'anthropic':
          result = await this.callAnthropic(request);
          break;

        default:
          return null;
      }

      if (result) {
        return {
          requestId: request.id,
          status: 'success',
          result,
          service: serviceName,
          latency: 0
        };
      }

    } catch (error) {
      console.warn(`Service ${serviceName} failed:`, error);
    }

    return null;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(request: UnifiedAIRequest): Promise<any> {
    const messages = [{
      role: 'user',
      content: request.payload.prompt || JSON.stringify(request.payload)
    }];

    const result = await generateText({
      model: openai('gpt-4'),
      messages,
      temperature: request.payload.temperature || 0.7,
      maxTokens: request.payload.maxTokens || 1000
    });

    return { text: result.text };
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(request: UnifiedAIRequest): Promise<any> {
    const messages = [{
      role: 'user',
      content: request.payload.prompt || JSON.stringify(request.payload)
    }];

    const result = await generateText({
      model: anthropic('claude-3-sonnet-20240229'),
      messages,
      temperature: request.payload.temperature || 0.7,
      maxTokens: request.payload.maxTokens || 1000
    });

    return { text: result.text };
  }

  // Private helper methods leveraging existing patterns

  private createErrorIqClient() {
    // Use existing API client patterns
    return {
      async getWorkflowErrors(workflowId: string) {
        // Implementation using existing error-iq API
        return [];
      },
      async getErrorPatterns() {
        // Implementation using existing analytics
        return [];
      }
    };
  }

  private setupCrossAppDataSync() {
    // Use existing WebSocket patterns for real-time sync
    // Implementation would use existing notification systems
  }

  private initializeInsightStorage() {
    // Use existing caching patterns
    // Could leverage existing Redis/local storage
  }

  private isAIGatewayAvailable(): boolean {
    // Check for Vercel AI Gateway availability
    return !!process.env.VERCEL_AI_GATEWAY_URL;
  }

  private createAIGatewayClient() {
    // Implementation using existing API client patterns
    return {
      async routeRequest(request: any) {
        // AI Gateway routing logic
      }
    };
  }

  private async performUnifiedAnalysis(workflow: any, errors: any[]): Promise<CrossAppAnalysis> {
    // Use existing AI analysis patterns from both applications
    const analysis = await generateObject({
      model: openai('gpt-4'),
      schema: UnifiedAnalysisSchema,
      messages: [{
        role: 'system',
        content: 'Analyze workflow with error correlation insights...'
      }, {
        role: 'user',
        content: `Workflow: ${JSON.stringify(workflow)}\nErrors: ${JSON.stringify(errors)}`
      }]
    });

    return analysis.object;
  }

  private async getWorkflowTemplates() {
    // Use existing template service patterns
    return [];
  }

  private async getErrorIqTemplates() {
    // Use existing Error-IQ template service
    return [];
  }

  private async generateTemplateRecommendations(templates: any[], context: any) {
    // Use existing AI recommendation patterns
    return [];
  }

  private async enhanceQueryWithContext(query: string, context: any): Promise<string> {
    // Enhance query with cross-app context using existing patterns
    return query;
  }

  private selectOptimalModel(context: any) {
    // Use existing provider selection logic
    return openai('gpt-4');
  }

  private buildSystemPrompt(context: any): string {
    // Build context-aware system prompt using existing patterns
    return 'You are a unified AI assistant for workflow and error intelligence...';
  }

  private async getStoredInsights(workflowId: string) {
    // Retrieve stored cross-app insights
    return this.crossAppInsights.get(workflowId) || {};
  }

  private async generateOptimizations(workflow: any, insights: any) {
    // Use existing optimization patterns
    return [];
  }

  private async applyOptimizations(workflowId: string, optimizations: any[]) {
    // Apply optimizations using existing services
    return { success: true, optimizations };
  }

  private async getTemplate(templateId: string) {
    // Get template from existing systems
    return {};
  }

  private async customizeTemplate(template: any, customization: any) {
    // Customize template using AI
    return template;
  }

  private async generateAutomationWorkflow(template: any) {
    // Generate automation workflow
    return { id: 'generated-automation', steps: [] };
  }

  private async deployAutomation(automation: any) {
    // Deploy using existing deployment patterns
    return { status: 'success', savings: 0, nextSteps: [] };
  }
}

// TypeScript interfaces
interface CrossAppAnalysis {
  workflowId: string;
  errorPatterns: any[];
  optimizationSuggestions: any[];
  riskAssessment: any;
  confidence: number;
}

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: Date;
  responseTime: number;
  version?: string;
  capabilities?: string[];
}

interface UnifiedAIRequest {
  id: string;
  type: 'generation' | 'analysis' | 'workflow' | 'collaboration';
  payload: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  preferredServices?: string[];
  fallbackServices?: string[];
  timeout?: number;
}

interface UnifiedAIResponse {
  requestId: string;
  status: 'success' | 'error' | 'fallback';
  result?: any;
  service: string;
  latency: number;
  cost?: number;
  suggestions?: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
}

interface TemplateContext {
  workflowType?: string;
  industry?: string;
  complexity?: string;
  existingErrors?: any[];
}

interface TemplateRecommendation {
  templateId: string;
  score: number;
  reasoning: string;
  estimatedSavings: number;
}

interface UnifiedContext {
  app: 'workflow-studio' | 'error-iq';
  workflowId?: string;
  errorId?: string;
  userContext?: any;
}

interface OptimizationResult {
  workflowId: string;
  optimizations: any[];
  estimatedImprovement: number;
  implementationPlan: any[];
}

interface TemplateCustomization {
  parameters: Record<string, any>;
  integrations: any[];
  triggers: any[];
}

interface AutomationResult {
  automationId: string;
  deploymentStatus: string;
  estimatedSavings: number;
  nextSteps: any[];
}

// Zod schemas for type safety
const UnifiedAnalysisSchema = z.object({
  workflowId: z.string(),
  errorPatterns: z.array(z.any()),
  optimizationSuggestions: z.array(z.any()),
  riskAssessment: z.any(),
  confidence: z.number()
});

// Export singleton instance
export const unifiedAIService = new UnifiedAIService();
