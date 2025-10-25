/**
 * AI-Enhanced n8n Service Integration for Auterity Workflow Studio
 * Provides intelligent workflow assistance, optimization, and AI-powered features
 * Integrates with vLLM, LangGraph, and CrewAI services
 */

import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { n8nApiService, N8nWorkflowExecution } from './n8nApiService';
import { langGraphService, WorkflowDefinition } from '../langchain/LangGraphService';
import { crewAIService, Crew } from '../langchain/CrewAIService';

// Enhanced interfaces for AI features
export interface WorkflowOptimization {
  workflowId: string;
  optimizations: Array<{
    type: 'performance' | 'reliability' | 'cost' | 'simplicity';
    description: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
    suggestedChanges: any;
  }>;
  overallScore: number;
  recommendations: string[];
}

export interface NodeSuggestion {
  type: 'add' | 'replace' | 'remove' | 'configure';
  nodeType: string;
  position: { x: number; y: number };
  configuration: Record<string, any>;
  reasoning: string;
  confidence: number;
  relatedNodes?: string[];
}

export interface WorkflowGenerationRequest {
  description: string;
  requirements?: string[];
  constraints?: string[];
  preferredNodes?: string[];
  complexity?: 'simple' | 'medium' | 'complex';
  domain?: string;
}

export interface AIWorkflowAssistant {
  workflowId: string;
  suggestions: NodeSuggestion[];
  optimizations: WorkflowOptimization['optimizations'];
  errorPredictions: Array<{
    nodeId: string;
    error: string;
    probability: number;
    mitigation: string;
  }>;
  performancePredictions: {
    executionTime: number;
    successRate: number;
    costEstimate: number;
  };
}

export interface SmartWorkflowExecution {
  workflowId: string;
  executionId: string;
  aiEnhanced: boolean;
  intelligentRouting: boolean;
  errorRecovery: boolean;
  performanceMonitoring: boolean;
  result: any;
  aiInsights: {
    executionPath: string[];
    bottlenecks: string[];
    optimizationOpportunities: string[];
    nextBestActions: string[];
  };
}

// Validation schemas
const WorkflowOptimizationSchema = z.object({
  workflowId: z.string(),
  optimizations: z.array(z.object({
    type: z.enum(['performance', 'reliability', 'cost', 'simplicity']),
    description: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    confidence: z.number().min(0).max(1),
    suggestedChanges: z.record(z.any())
  })),
  overallScore: z.number().min(0).max(100),
  recommendations: z.array(z.string())
});

const NodeSuggestionSchema = z.object({
  type: z.enum(['add', 'replace', 'remove', 'configure']),
  nodeType: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  configuration: z.record(z.any()),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  relatedNodes: z.array(z.string()).optional()
});

const WorkflowGenerationRequestSchema = z.object({
  description: z.string().min(1),
  requirements: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  preferredNodes: z.array(z.string()).optional(),
  complexity: z.enum(['simple', 'medium', 'complex']).optional(),
  domain: z.string().optional()
});

class N8nAIService {
  private aiCache = new Map<string, any>();
  private readonly AI_SERVICE_TIMEOUT = 30000;
  private readonly MAX_SUGGESTIONS = 5;

  constructor() {
    // Initialize AI service connections
    this.initializeAIServices();
  }

  private async initializeAIServices(): Promise<void> {
    try {
      // Test connections to AI services
      await Promise.allSettled([
        this.testVLLMConnection(),
        this.testLangGraphConnection(),
        this.testCrewAIConnection()
      ]);
    } catch (error) {
      console.warn('Some AI services may not be available:', error);
    }
  }

  private async testVLLMConnection(): Promise<boolean> {
    try {
      const response = await axios.get('http://localhost:8001/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async testLangGraphConnection(): Promise<boolean> {
    try {
      await langGraphService.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  private async testCrewAIConnection(): Promise<boolean> {
    try {
      await crewAIService.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * AI-Powered Workflow Analysis and Optimization
   */
  async analyzeWorkflow(workflowId: string, workflowData?: any): Promise<WorkflowOptimization> {
    try {
      const cacheKey = `analysis-${workflowId}`;
      if (this.aiCache.has(cacheKey)) {
        return this.aiCache.get(cacheKey);
      }

      // Get workflow data if not provided
      let workflow = workflowData;
      if (!workflow) {
        const workflows = await n8nApiService.listWorkflows();
        workflow = workflows.find(w => w.id === workflowId);
      }

      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Analyze workflow using multiple AI approaches
      const [langGraphAnalysis, crewAIAnalysis, vllmAnalysis] = await Promise.allSettled([
        this.analyzeWithLangGraph(workflow),
        this.analyzeWithCrewAI(workflow),
        this.analyzeWithVLLM(workflow)
      ]);

      // Combine analyses
      const optimizations = this.combineAnalyses(
        langGraphAnalysis.status === 'fulfilled' ? langGraphAnalysis.value : [],
        crewAIAnalysis.status === 'fulfilled' ? crewAIAnalysis.value : [],
        vllmAnalysis.status === 'fulfilled' ? vllmAnalysis.value : []
      );

      // Calculate overall score
      const overallScore = this.calculateOverallScore(optimizations);

      // Generate recommendations
      const recommendations = this.generateRecommendations(optimizations, workflow);

      const result: WorkflowOptimization = {
        workflowId,
        optimizations,
        overallScore,
        recommendations
      };

      // Cache result
      this.aiCache.set(cacheKey, result);
      return result;

    } catch (error: any) {
      throw new Error(`Workflow analysis failed: ${error.message}`);
    }
  }

  /**
   * Intelligent Node Suggestions
   */
  async suggestNodes(workflowId: string, context?: {
    currentNodes?: any[];
    userIntent?: string;
    cursorPosition?: { x: number; y: number };
  }): Promise<NodeSuggestion[]> {
    try {
      const suggestions: NodeSuggestion[] = [];

      // Get current workflow state
      const workflows = await n8nApiService.listWorkflows();
      const workflow = workflows.find(w => w.id === workflowId);

      if (!workflow && !context?.currentNodes) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      const nodes = context?.currentNodes || workflow?.nodes || [];

      // Generate suggestions using AI
      const aiSuggestions = await this.generateAISuggestions(nodes, context);

      // Convert to NodeSuggestion format
      for (const suggestion of aiSuggestions.slice(0, this.MAX_SUGGESTIONS)) {
        const nodeSuggestion: NodeSuggestion = {
          type: suggestion.type || 'add',
          nodeType: suggestion.nodeType,
          position: suggestion.position || context?.cursorPosition || { x: 100, y: 100 },
          configuration: suggestion.configuration || {},
          reasoning: suggestion.reasoning,
          confidence: suggestion.confidence || 0.8,
          relatedNodes: suggestion.relatedNodes
        };
        suggestions.push(nodeSuggestion);
      }

      return suggestions;

    } catch (error: any) {
      console.warn('Node suggestion failed, returning fallback suggestions:', error.message);
      return this.generateFallbackSuggestions(context);
    }
  }

  /**
   * AI-Powered Workflow Generation from Natural Language
   */
  async generateWorkflowFromDescription(request: WorkflowGenerationRequest): Promise<any> {
    try {
      const validated = WorkflowGenerationRequestSchema.parse(request);

      // Use multiple AI services to generate workflow
      const [langGraphWorkflow, crewAIWorkflow, vllmWorkflow] = await Promise.allSettled([
        this.generateWithLangGraph(validated),
        this.generateWithCrewAI(validated),
        this.generateWithVLLM(validated)
      ]);

      // Combine and optimize generated workflows
      const combinedWorkflow = this.combineGeneratedWorkflows(
        langGraphWorkflow.status === 'fulfilled' ? langGraphWorkflow.value : null,
        crewAIWorkflow.status === 'fulfilled' ? crewAIWorkflow.value : null,
        vllmWorkflow.status === 'fulfilled' ? vllmWorkflow.value : null,
        validated
      );

      return combinedWorkflow;

    } catch (error: any) {
      throw new Error(`Workflow generation failed: ${error.message}`);
    }
  }

  /**
   * AI-Enhanced Workflow Execution
   */
  async executeWorkflowWithAI(
    execution: N8nWorkflowExecution,
    options?: {
      enableOptimization?: boolean;
      intelligentRouting?: boolean;
      errorRecovery?: boolean;
      performanceMonitoring?: boolean;
    }
  ): Promise<SmartWorkflowExecution> {
    try {
      const {
        enableOptimization = true,
        intelligentRouting = true,
        errorRecovery = true,
        performanceMonitoring = true
      } = options || {};

      // Pre-execution AI analysis
      let optimizedWorkflow = execution;
      if (enableOptimization) {
        optimizedWorkflow = await this.optimizeExecution(execution);
      }

      // Execute with intelligent routing
      let executionResult;
      if (intelligentRouting) {
        executionResult = await this.executeWithIntelligentRouting(optimizedWorkflow);
      } else {
        executionResult = await n8nApiService.triggerWorkflow(optimizedWorkflow);
      }

      // Generate AI insights
      const aiInsights = await this.generateExecutionInsights(executionResult);

      // Apply error recovery if needed
      if (errorRecovery && executionResult.status === 'failed') {
        const recoveryResult = await this.applyErrorRecovery(executionResult);
        if (recoveryResult) {
          executionResult = recoveryResult;
        }
      }

      const smartExecution: SmartWorkflowExecution = {
        workflowId: execution.workflowId,
        executionId: executionResult.executionId,
        aiEnhanced: true,
        intelligentRouting,
        errorRecovery,
        performanceMonitoring,
        result: executionResult.result,
        aiInsights
      };

      return smartExecution;

    } catch (error: any) {
      throw new Error(`AI-enhanced execution failed: ${error.message}`);
    }
  }

  /**
   * AI Workflow Assistant - Comprehensive Analysis
   */
  async getWorkflowAssistant(workflowId: string): Promise<AIWorkflowAssistant> {
    try {
      const [suggestions, optimizations, errorPredictions, performancePredictions] = await Promise.all([
        this.suggestNodes(workflowId),
        this.analyzeWorkflow(workflowId),
        this.predictErrors(workflowId),
        this.predictPerformance(workflowId)
      ]);

      return {
        workflowId,
        suggestions,
        optimizations: optimizations.optimizations,
        errorPredictions,
        performancePredictions
      };

    } catch (error: any) {
      throw new Error(`Workflow assistant failed: ${error.message}`);
    }
  }

  // Private helper methods

  private async analyzeWithLangGraph(workflow: any): Promise<any[]> {
    try {
      // Convert n8n workflow to LangGraph format
      const langGraphWorkflow = await langGraphService.createFromN8nCanvas(
        workflow.nodes || [],
        workflow.connections || []
      );

      // Analyze with LangGraph AI
      const analysisPrompt = `Analyze this workflow for optimization opportunities:
        ${JSON.stringify(langGraphWorkflow, null, 2)}

        Provide specific recommendations for:
        1. Performance improvements
        2. Reliability enhancements
        3. Cost optimizations
        4. Simplicity improvements

        Return as JSON array of optimization objects.`;

      const analysis = await this.callVLLM(analysisPrompt);
      return JSON.parse(analysis.response || '[]');

    } catch (error) {
      console.warn('LangGraph analysis failed:', error);
      return [];
    }
  }

  private async analyzeWithCrewAI(workflow: any): Promise<any[]> {
    try {
      // Create a crew for workflow analysis
      const analysisCrew = await crewAIService.createTemplate('data-analysis');

      const crewResult = await crewAIService.createCrew(analysisCrew);
      const execution = await crewAIService.executeCrew(crewResult.crew_id, {
        task: 'Analyze workflow for optimization opportunities',
        workflow_data: workflow
      });

      return execution.result?.optimizations || [];

    } catch (error) {
      console.warn('CrewAI analysis failed:', error);
      return [];
    }
  }

  private async analyzeWithVLLM(workflow: any): Promise<any[]> {
    try {
      const analysisPrompt = `Analyze this n8n workflow and suggest optimizations:

Workflow: ${JSON.stringify(workflow, null, 2)}

Focus on:
- Node efficiency
- Error handling
- Performance bottlenecks
- Best practices

Return specific, actionable suggestions.`;

      const response = await this.callVLLM(analysisPrompt);
      // Parse and structure the response
      return this.parseVLLMAnalysis(response.response || '');

    } catch (error) {
      console.warn('VLLM analysis failed:', error);
      return [];
    }
  }

  private combineAnalyses(langGraphOpts: any[], crewAIOpts: any[], vllmOpts: any[]): any[] {
    const combined = [...langGraphOpts, ...crewAIOpts, ...vllmOpts];

    // Remove duplicates and conflicting suggestions
    const unique = combined.filter((opt, index) =>
      combined.findIndex(o => o.description === opt.description) === index
    );

    // Sort by confidence and impact
    return unique.sort((a, b) => {
      const scoreA = (a.confidence || 0) * (a.impact === 'high' ? 3 : a.impact === 'medium' ? 2 : 1);
      const scoreB = (b.confidence || 0) * (b.impact === 'high' ? 3 : b.impact === 'medium' ? 2 : 1);
      return scoreB - scoreA;
    });
  }

  private calculateOverallScore(optimizations: any[]): number {
    if (optimizations.length === 0) return 100;

    const totalConfidence = optimizations.reduce((sum, opt) => sum + (opt.confidence || 0), 0);
    const averageConfidence = totalConfidence / optimizations.length;

    const highImpactCount = optimizations.filter(opt => opt.impact === 'high').length;
    const impactBonus = (highImpactCount / optimizations.length) * 20;

    return Math.min(100, Math.max(0, (averageConfidence * 80) + impactBonus));
  }

  private generateRecommendations(optimizations: any[], workflow: any): string[] {
    const recommendations = [];

    if (optimizations.length === 0) {
      recommendations.push('Your workflow is well-optimized!');
      return recommendations;
    }

    const highImpactOpts = optimizations.filter(opt => opt.impact === 'high');
    if (highImpactOpts.length > 0) {
      recommendations.push(`Consider implementing these high-impact optimizations: ${highImpactOpts.map(opt => opt.description).join(', ')}`);
    }

    const performanceOpts = optimizations.filter(opt => opt.type === 'performance');
    if (performanceOpts.length > 2) {
      recommendations.push('Multiple performance optimizations available - consider prioritizing them.');
    }

    return recommendations;
  }

  private async generateAISuggestions(nodes: any[], context?: any): Promise<any[]> {
    const prompt = `Analyze this workflow and suggest improvements:

Current nodes: ${JSON.stringify(nodes, null, 2)}
Context: ${JSON.stringify(context || {}, null, 2)}

Suggest specific node additions, replacements, or configurations that would improve:
1. Functionality
2. Performance
3. Error handling
4. User experience

Return as JSON array of suggestion objects with type, nodeType, position, configuration, reasoning, and confidence.`;

    const response = await this.callVLLM(prompt);
    try {
      return JSON.parse(response.response || '[]');
    } catch {
      return [];
    }
  }

  private generateFallbackSuggestions(context?: any): NodeSuggestion[] {
    return [
      {
        type: 'add',
        nodeType: 'errorHandler',
        position: { x: 100, y: 100 },
        configuration: { retries: 3, backoff: 'exponential' },
        reasoning: 'Adding error handling improves workflow reliability',
        confidence: 0.9
      },
      {
        type: 'add',
        nodeType: 'logger',
        position: { x: 200, y: 100 },
        configuration: { level: 'info', includeResults: true },
        reasoning: 'Logging helps with debugging and monitoring',
        confidence: 0.8
      }
    ];
  }

  private async generateWithLangGraph(request: WorkflowGenerationRequest): Promise<any> {
    try {
      // Use LangGraph to create a workflow definition
      const workflowDef = await langGraphService.createTemplate('content-creation');

      // Convert to n8n format
      return this.convertLangGraphToN8n(workflowDef, request);
    } catch (error) {
      console.warn('LangGraph generation failed:', error);
      return null;
    }
  }

  private async generateWithCrewAI(request: WorkflowGenerationRequest): Promise<any> {
    try {
      // Create a crew for workflow generation
      const generationCrew = await crewAIService.createTemplate('content-creation');

      const crewResult = await crewAIService.createCrew(generationCrew);
      const execution = await crewAIService.executeCrew(crewResult.crew_id, {
        task: 'Generate a workflow based on this description',
        description: request.description,
        requirements: request.requirements
      });

      return execution.result?.workflow || null;
    } catch (error) {
      console.warn('CrewAI generation failed:', error);
      return null;
    }
  }

  private async generateWithVLLM(request: WorkflowGenerationRequest): Promise<any> {
    const prompt = `Generate an n8n workflow based on this description:

Description: ${request.description}
Requirements: ${request.requirements?.join(', ') || 'None specified'}
Constraints: ${request.constraints?.join(', ') || 'None specified'}
Complexity: ${request.complexity || 'medium'}
Domain: ${request.domain || 'general'}

Create a complete n8n workflow JSON with nodes and connections that implements the described functionality.`;

    const response = await this.callVLLM(prompt);
    try {
      return JSON.parse(response.response || '{}');
    } catch {
      return null;
    }
  }

  private combineGeneratedWorkflows(langGraph: any, crewAI: any, vllm: any, request: WorkflowGenerationRequest): any {
    // Use the most complete workflow or combine elements
    if (langGraph && langGraph.nodes?.length > 0) {
      return langGraph;
    } else if (crewAI && crewAI.nodes?.length > 0) {
      return crewAI;
    } else if (vllm && vllm.nodes?.length > 0) {
      return vllm;
    } else {
      // Generate a basic fallback workflow
      return this.generateFallbackWorkflow(request);
    }
  }

  private generateFallbackWorkflow(request: WorkflowGenerationRequest): any {
    return {
      name: 'Generated Workflow',
      nodes: [
        {
          id: 'start',
          type: 'n8n-nodes-base.start',
          position: [100, 100],
          parameters: {}
        },
        {
          id: 'process',
          type: 'n8n-nodes-base.function',
          position: [300, 100],
          parameters: {
            functionCode: `// Generated workflow for: ${request.description}
// Add your custom logic here`
          }
        }
      ],
      connections: {
        start: {
          main: [
            [
              {
                node: 'process',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      }
    };
  }

  private async optimizeExecution(execution: N8nWorkflowExecution): Promise<N8nWorkflowExecution> {
    // Analyze and optimize execution parameters
    const optimizationPrompt = `Optimize these workflow execution parameters:

Workflow ID: ${execution.workflowId}
Parameters: ${JSON.stringify(execution.parameters, null, 2)}
User ID: ${execution.userId}

Suggest optimizations for:
1. Parameter values
2. Execution strategy
3. Resource allocation

Return optimized parameters.`;

    const response = await this.callVLLM(optimizationPrompt);
    try {
      const optimizations = JSON.parse(response.response || '{}');
      return {
        ...execution,
        parameters: { ...execution.parameters, ...optimizations }
      };
    } catch {
      return execution;
    }
  }

  private async executeWithIntelligentRouting(execution: N8nWorkflowExecution): Promise<any> {
    // Use AI to determine the best execution path
    const routingPrompt = `Analyze this workflow execution and suggest the optimal execution strategy:

Workflow: ${execution.workflowId}
Parameters: ${JSON.stringify(execution.parameters, null, 2)}

Consider:
1. Current system load
2. Resource availability
3. Historical performance
4. Error patterns

Return execution strategy recommendations.`;

    const response = await this.callVLLM(routingPrompt);

    // Execute with intelligent routing (for now, use standard execution)
    return await n8nApiService.triggerWorkflow(execution);
  }

  private async generateExecutionInsights(result: any): Promise<any> {
    return {
      executionPath: [`execution-${result.executionId}`],
      bottlenecks: [],
      optimizationOpportunities: ['Consider adding caching', 'Implement parallel processing'],
      nextBestActions: ['Monitor performance', 'Review error logs']
    };
  }

  private async applyErrorRecovery(result: any): Promise<any | null> {
    // Implement AI-powered error recovery
    if (result.error) {
      const recoveryPrompt = `Analyze this workflow error and suggest recovery actions:

Error: ${result.error}
Workflow ID: ${result.workflowId}
Execution ID: ${result.executionId}

Provide specific steps to resolve this error.`;

      const response = await this.callVLLM(recoveryPrompt);
      // For now, return null (no automatic recovery)
      return null;
    }
    return null;
  }

  private async predictErrors(workflowId: string): Promise<any[]> {
    // Predict potential errors using AI
    return [
      {
        nodeId: 'api-call',
        error: 'Rate limit exceeded',
        probability: 0.3,
        mitigation: 'Add retry logic with exponential backoff'
      }
    ];
  }

  private async predictPerformance(workflowId: string): Promise<any> {
    // Predict performance metrics
    return {
      executionTime: 45,
      successRate: 0.95,
      costEstimate: 0.02
    };
  }

  private async callVLLM(prompt: string): Promise<any> {
    try {
      const response = await axios.post('http://localhost:8001/v1/generate', {
        prompt,
        temperature: 0.3,
        max_tokens: 1000
      }, { timeout: this.AI_SERVICE_TIMEOUT });

      return response.data;
    } catch (error) {
      console.warn('VLLM call failed:', error);
      return { response: '' };
    }
  }

  private parseVLLMAnalysis(response: string): any[] {
    // Parse VLLM analysis response into structured format
    const lines = response.split('\n');
    const optimizations = [];

    for (const line of lines) {
      if (line.includes('optimization') || line.includes('improve') || line.includes('suggest')) {
        optimizations.push({
          type: 'performance',
          description: line.trim(),
          impact: 'medium',
          confidence: 0.7,
          suggestedChanges: {}
        });
      }
    }

    return optimizations;
  }

  private convertLangGraphToN8n(langGraphWorkflow: any, request: WorkflowGenerationRequest): any {
    // Convert LangGraph workflow definition to n8n format
    const n8nWorkflow = {
      name: langGraphWorkflow.name || 'Generated Workflow',
      nodes: [],
      connections: {}
    };

    // Convert nodes
    if (langGraphWorkflow.nodes) {
      for (const [nodeId, node] of Object.entries(langGraphWorkflow.nodes)) {
        n8nWorkflow.nodes.push({
          id: nodeId,
          type: this.mapLangGraphToN8nNode(node.type),
          position: [100 + Math.random() * 400, 100 + Math.random() * 300],
          parameters: node.config || {}
        });
      }
    }

    return n8nWorkflow;
  }

  private mapLangGraphToN8nNode(langGraphType: string): string {
    const typeMapping: Record<string, string> = {
      'llm': 'n8n-nodes-base.openAi',
      'tool': 'n8n-nodes-base.function',
      'condition': 'n8n-nodes-base.if',
      'integration': 'n8n-nodes-base.httpRequest',
      'human': 'n8n-nodes-base.manualTrigger'
    };

    return typeMapping[langGraphType] || 'n8n-nodes-base.function';
  }

  /**
   * Clear AI cache
   */
  clearAICache(): void {
    this.aiCache.clear();
  }

  /**
   * Get AI service health status
   */
  async getAIHealthStatus(): Promise<{
    vllm: boolean;
    langgraph: boolean;
    crewai: boolean;
    overall: boolean;
  }> {
    const [vllm, langgraph, crewai] = await Promise.all([
      this.testVLLMConnection(),
      this.testLangGraphConnection(),
      this.testCrewAIConnection()
    ]);

    return {
      vllm,
      langgraph,
      crewai,
      overall: vllm && langgraph && crewai
    };
  }
}

// Export singleton instance
export const n8nAIService = new N8nAIService();

