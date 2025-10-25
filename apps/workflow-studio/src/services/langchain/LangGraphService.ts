/**
 * LangGraph Service Integration for Auterity Workflow Studio
 * Provides AI-powered workflow orchestration with intelligent decision making
 */

import { z } from 'zod';

// Types for LangGraph integration
export interface WorkflowNode {
  id: string;
  type: 'llm' | 'tool' | 'condition' | 'integration' | 'human' | 'decision';
  config: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WorkflowEdge {
  source: string;
  target: string;
  condition?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowDefinition {
  workflowId: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: Record<string, any>;
}

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  result?: any;
  error?: string;
  executionPath: string[];
  executionTime: number;
  decisionTime: number;
  nodeExecutions: Array<{
    nodeId: string;
    nodeType: string;
    executionTime: number;
    status: 'success' | 'failed';
    result?: any;
    error?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  averageExecutionTime: number;
  averageDecisionTime: number;
  successRate: number;
  nodeTypeUsage: Record<string, number>;
  workflowTypes: Record<string, number>;
}

// Zod schemas for validation
const WorkflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['llm', 'tool', 'condition', 'integration', 'human', 'decision']),
  config: z.record(z.any()),
  metadata: z.record(z.any()).optional()
});

const WorkflowEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  condition: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const WorkflowDefinitionSchema = z.object({
  workflowId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  metadata: z.record(z.any()).optional()
});

export class LangGraphService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = '/api/v1/ai/langgraph', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Create a new AI-powered workflow
   */
  async createWorkflow(workflow: WorkflowDefinition): Promise<{ workflowId: string }> {
    // Validate input
    const validatedWorkflow = WorkflowDefinitionSchema.parse(workflow);

    const response = await fetch(`${this.baseUrl}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
      body: JSON.stringify(validatedWorkflow),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create workflow: ${error.detail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Execute a workflow with intelligent orchestration
   */
  async executeWorkflow(
    workflowId: string,
    input: Record<string, any>,
    options?: {
      context?: Record<string, any>;
      metadata?: Record<string, any>;
      onProgress?: (execution: Partial<WorkflowExecution>) => void;
    }
  ): Promise<WorkflowExecution> {
    const payload = {
      input,
      context: options?.context || {},
      metadata: options?.metadata || {}
    };

    const response = await fetch(`${this.baseUrl}/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to execute workflow: ${error.detail || response.statusText}`);
    }

    const result = await response.json();

    // Notify progress callback if provided
    if (options?.onProgress) {
      options.onProgress(result);
    }

    return result;
  }

  /**
   * Get workflow details
   */
  async getWorkflow(workflowId: string): Promise<WorkflowDefinition & { metrics?: any }> {
    const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get workflow: ${error.detail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<Array<{ id: string; nodeCount: number; edgeCount: number; createdAt: string }>> {
    const response = await fetch(`${this.baseUrl}/workflows`, {
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to list workflows: ${error.detail || response.statusText}`);
    }

    const data = await response.json();
    return data.workflows || [];
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/workflows/${workflowId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to delete workflow: ${error.detail || response.statusText}`);
    }
  }

  /**
   * Get service metrics
   */
  async getMetrics(): Promise<WorkflowMetrics> {
    const response = await fetch(`${this.baseUrl}/metrics`, {
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get metrics: ${error.detail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; activeWorkflows: number; totalWorkflows: number }> {
    const response = await fetch(`${this.baseUrl}/health`, {
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create workflow from n8n canvas
   */
  async createFromN8nCanvas(nodes: any[], edges: any[]): Promise<WorkflowDefinition> {
    // Convert n8n nodes to LangGraph format
    const convertedNodes = nodes.map(node => ({
      id: node.id,
      type: this.mapN8nNodeType(node.type),
      config: node.data || {},
      metadata: {
        position: node.position,
        n8nType: node.type,
        name: node.data?.label || node.type
      }
    }));

    const convertedEdges = edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      condition: edge.data?.condition,
      metadata: {
        n8nEdgeId: edge.id
      }
    }));

    const workflow: WorkflowDefinition = {
      workflowId: `n8n-${Date.now()}`,
      name: 'Converted from n8n',
      description: 'Workflow created from n8n canvas',
      nodes: convertedNodes,
      edges: convertedEdges,
      metadata: {
        source: 'n8n',
        convertedAt: new Date().toISOString()
      }
    };

    return workflow;
  }

  /**
   * Map n8n node types to LangGraph node types
   */
  private mapN8nNodeType(n8nType: string): WorkflowNode['type'] {
    const typeMapping: Record<string, WorkflowNode['type']> = {
      'openai': 'llm',
      'anthropic': 'llm',
      'httpRequest': 'integration',
      'webhook': 'integration',
      'scheduleTrigger': 'integration',
      'emailSend': 'tool',
      'set': 'condition',
      'switch': 'condition',
      'wait': 'human',
      'manualTrigger': 'human'
    };

    return typeMapping[n8nType] || 'tool';
  }

  /**
   * Create pre-built workflow templates
   */
  async createTemplate(templateName: string): Promise<WorkflowDefinition> {
    const templates: Record<string, () => WorkflowDefinition> = {
      'content-generation': () => ({
        workflowId: `template-${Date.now()}`,
        name: 'AI Content Generation Pipeline',
        description: 'Multi-step content creation with AI optimization',
        nodes: [
          {
            id: 'research',
            type: 'llm',
            config: {
              prompt: 'Research the topic: {{topic}}',
              model: 'gpt-4',
              temperature: 0.3,
              maxTokens: 1000
            },
            metadata: { label: 'Research Phase' }
          },
          {
            id: 'validate',
            type: 'condition',
            config: {
              condition: 'research_quality > 0.8'
            },
            metadata: { label: 'Quality Check' }
          },
          {
            id: 'generate',
            type: 'llm',
            config: {
              prompt: 'Create content based on research: {{research}}',
              model: 'claude-3',
              temperature: 0.7,
              maxTokens: 2000
            },
            metadata: { label: 'Content Generation' }
          },
          {
            id: 'edit',
            type: 'llm',
            config: {
              prompt: 'Edit and polish the content: {{content}}',
              model: 'gpt-4',
              temperature: 0.2,
              maxTokens: 1500
            },
            metadata: { label: 'Editing Phase' }
          }
        ],
        edges: [
          { source: 'research', target: 'validate' },
          { source: 'validate', target: 'generate', condition: 'passed' },
          { source: 'generate', target: 'edit' }
        ],
        metadata: {
          template: 'content-generation',
          category: 'content',
          complexity: 'medium'
        }
      }),

      'data-analysis': () => ({
        workflowId: `template-${Date.now()}`,
        name: 'AI Data Analysis Pipeline',
        description: 'Intelligent data processing and insights generation',
        nodes: [
          {
            id: 'extract',
            type: 'integration',
            config: {
              type: 'database',
              query: 'SELECT * FROM {{table}}'
            },
            metadata: { label: 'Data Extraction' }
          },
          {
            id: 'analyze',
            type: 'llm',
            config: {
              prompt: 'Analyze this dataset and identify key insights: {{data}}',
              model: 'gpt-4',
              temperature: 0.1,
              maxTokens: 1500
            },
            metadata: { label: 'AI Analysis' }
          },
          {
            id: 'visualize',
            type: 'tool',
            config: {
              type: 'chart',
              data: '{{analysis}}'
            },
            metadata: { label: 'Visualization' }
          }
        ],
        edges: [
          { source: 'extract', target: 'analyze' },
          { source: 'analyze', target: 'visualize' }
        ],
        metadata: {
          template: 'data-analysis',
          category: 'analytics',
          complexity: 'medium'
        }
      }),

      'customer-support': () => ({
        workflowId: `template-${Date.now()}`,
        name: 'AI Customer Support Workflow',
        description: 'Intelligent customer inquiry processing',
        nodes: [
          {
            id: 'classify',
            type: 'llm',
            config: {
              prompt: 'Classify this customer inquiry: {{inquiry}}',
              model: 'gpt-3.5-turbo',
              temperature: 0.1,
              maxTokens: 200
            },
            metadata: { label: 'Inquiry Classification' }
          },
          {
            id: 'route',
            type: 'decision',
            config: {
              decision_prompt: 'Route to appropriate department based on: {{classification}}',
              options: ['billing', 'technical', 'general']
            },
            metadata: { label: 'Smart Routing' }
          },
          {
            id: 'respond',
            type: 'llm',
            config: {
              prompt: 'Generate response for {{department}} inquiry: {{inquiry}}',
              model: 'claude-3',
              temperature: 0.7,
              maxTokens: 1000
            },
            metadata: { label: 'AI Response' }
          }
        ],
        edges: [
          { source: 'classify', target: 'route' },
          { source: 'route', target: 'respond' }
        ],
        metadata: {
          template: 'customer-support',
          category: 'support',
          complexity: 'advanced'
        }
      })
    };

    const templateFn = templates[templateName];
    if (!templateFn) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return templateFn();
  }
}

// Export singleton instance
export const langGraphService = new LangGraphService();

// Export utility functions
export const createWorkflowFromN8n = (nodes: any[], edges: any[]) =>
  langGraphService.createFromN8nCanvas(nodes, edges);

export const createWorkflowTemplate = (templateName: string) =>
  langGraphService.createTemplate(templateName);

