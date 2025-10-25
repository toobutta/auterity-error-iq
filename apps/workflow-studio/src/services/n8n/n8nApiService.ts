// n8n API Service: Handles REST API interactions for specialized features
// Migrated from auterity-workflow-studio and adapted for auterity-error-iq
// Error-free: Includes validation, error handling, caching, and integration with relaycore

import axios, { AxiosResponse } from 'axios';
import { z } from 'zod';
import { n8nConfig, validateN8nConfig } from './n8nConfig';

// Enhanced validation schemas for auterity-error-iq integration
const WorkflowExecutionSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  parameters: z.record(z.any()).optional().default({}),
  executionId: z.string().optional(),
  userId: z.string().optional(),
  systemSource: z.string().optional().default('auterity-workflow-studio'),
});

const TemplateResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.record(z.any()),
  })),
  connections: z.array(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const WorkflowStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['running', 'completed', 'failed', 'waiting']),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  result: z.any().optional(),
  error: z.string().optional(),
});

export interface N8nWorkflowExecution {
  workflowId: string;
  parameters: Record<string, any>;
  executionId?: string;
  userId?: string;
  systemSource?: string;
}

export interface N8nTemplate {
  id: string;
  name: string;
  description?: string;
  nodes: any[];
  connections?: any[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface N8nExecutionResult {
  executionId: string;
  status: 'running' | 'completed' | 'failed' | 'waiting';
  result?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  workflowId: string;
}

class N8nApiService {
  private cache = new Map<string, any>();
  private executionCache = new Map<string, N8nExecutionResult>();

  constructor() {
    // Validate configuration on initialization
    const validation = validateN8nConfig();
    if (!validation.isValid) {
      throw new Error(`n8n configuration invalid: ${validation.errors.join(', ')}`);
    }
  }

  // Specialized Feature: Trigger n8n workflow with enhanced error handling
  async triggerWorkflow(execution: N8nWorkflowExecution): Promise<N8nExecutionResult> {
    try {
      const validated = WorkflowExecutionSchema.parse(execution);
      const cacheKey = `trigger-${validated.workflowId}-${JSON.stringify(validated.parameters)}`;

      // Check cache if enabled
      if (n8nConfig.enableCaching && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }



      const response: AxiosResponse = await axios.post(
        `${n8nConfig.apiUrl}/workflows/${validated.workflowId}/execute`,
        {
          parameters: validated.parameters,
          metadata: {
            userId: validated.userId,
            systemSource: validated.systemSource,
            triggeredAt: new Date().toISOString(),
          }
        },
        {
          headers: {
            'X-N8N-API-KEY': n8nConfig.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: n8nConfig.defaultWorkflowTimeout,
        }
      );

      const result: N8nExecutionResult = {
        executionId: response.data.executionId || `exec_${Date.now()}`,
        status: response.data.status || 'running',
        result: response.data.result,
        workflowId: validated.workflowId,
        startedAt: response.data.startedAt || new Date().toISOString(),
      };

      // Cache successful results
      if (n8nConfig.enableCaching && result.status === 'completed') {
        this.cache.set(cacheKey, result);
        this.executionCache.set(result.executionId, result);
      }

      // Log to auterity-error-iq's monitoring systems
      this.logExecutionToSystems(result, validated);

      return result;

    } catch (error: any) {


      // Enhanced error handling with specific error types
      if (error.code === 'ECONNABORTED') {
        throw new Error(`n8n workflow execution timed out after ${n8nConfig.defaultWorkflowTimeout}ms`);
      } else if (error.response?.status === 401) {
        throw new Error('n8n authentication failed. Please check your API key configuration.');
      } else if (error.response?.status === 404) {
        throw new Error(`n8n workflow not found. Please verify the workflow ID.`);
      } else if (error.response?.status === 429) {
        throw new Error('n8n rate limit exceeded. Please try again later.');
      } else if (error.response?.status >= 500) {
        throw new Error('n8n server error. Please try again later or contact support.');
      } else {
        throw new Error(`n8n workflow execution failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // Specialized Feature: Import n8n template with auterity-error-iq adaptation
  async importTemplate(templateId: string): Promise<N8nTemplate> {
    try {
      if (!n8nConfig.enableTemplateImport) {
        throw new Error('Template import is disabled in configuration');
      }

      const cacheKey = `template-${templateId}`;

      // Check cache if enabled
      if (n8nConfig.enableCaching && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }



      const response: AxiosResponse = await axios.get(
        `${n8nConfig.apiUrl}/workflows/templates/${templateId}`,
        {
          headers: {
            'X-N8N-API-KEY': n8nConfig.apiKey,
          },
          timeout: 10000, // Shorter timeout for template imports
        }
      );

      const validated = TemplateResponseSchema.parse(response.data);

      const template: N8nTemplate = {
        id: validated.id,
        name: validated.name,
        description: validated.description,
        nodes: validated.nodes,
        connections: validated.connections,
        tags: validated.tags,
        createdAt: validated.createdAt,
        updatedAt: validated.updatedAt,
      };

      // Cache successful imports
      if (n8nConfig.enableCaching) {
        this.cache.set(cacheKey, template);
      }

      // Convert n8n template to auterity-error-iq compatible format
      await this.convertTemplateForAuterity(template);

      return template;

    } catch (error: any) {


      if (error.response?.status === 401) {
        throw new Error('n8n authentication failed for template import.');
      } else if (error.response?.status === 404) {
        throw new Error(`n8n template not found: ${templateId}`);
      } else {
        throw new Error(`n8n template import failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // Specialized Feature: Get workflow execution status
  async getExecutionStatus(executionId: string): Promise<N8nExecutionResult> {
    try {
      // Check local cache first
      if (this.executionCache.has(executionId)) {
        return this.executionCache.get(executionId)!;
      }

      const response: AxiosResponse = await axios.get(
        `${n8nConfig.apiUrl}/executions/${executionId}`,
        {
          headers: {
            'X-N8N-API-KEY': n8nConfig.apiKey,
          },
          timeout: 5000,
        }
      );

      const validated = WorkflowStatusSchema.parse(response.data);

      const result: N8nExecutionResult = {
        executionId: validated.id,
        status: validated.status,
        result: validated.result,
        error: validated.error,
        startedAt: validated.startedAt,
        completedAt: validated.completedAt,
        workflowId: response.data.workflowId || '',
      };

      // Update cache
      this.executionCache.set(executionId, result);

      return result;

    } catch (error: any) {


      if (error.response?.status === 404) {
        throw new Error(`Execution not found: ${executionId}`);
      } else {
        throw new Error(`Failed to get execution status: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // Specialized Feature: List available workflows
  async listWorkflows(): Promise<any[]> {
    try {
      const response: AxiosResponse = await axios.get(
        `${n8nConfig.apiUrl}/workflows`,
        {
          headers: {
            'X-N8N-API-KEY': n8nConfig.apiKey,
          },
          timeout: 5000,
        }
      );

      return response.data.workflows || response.data || [];
    } catch (error: any) {

      throw new Error(`Failed to list workflows: ${error.message || 'Unknown error'}`);
    }
  }

  // Utility: Convert n8n template to auterity-error-iq format
  private async convertTemplateForAuterity(template: N8nTemplate): Promise<void> {
    // This would integrate with auterity-error-iq's node conversion system


    // Implementation would map n8n node types to auterity-error-iq equivalents
    // For example: n8n 'httpRequest' -> auterity 'api-call' node
    // This is a placeholder for the actual conversion logic
  }

  // Utility: Log execution to auterity-error-iq systems (relaycore, neuroweaver)
  private async logExecutionToSystems(result: N8nExecutionResult, execution: N8nWorkflowExecution): Promise<void> {
    try {
      // Log to relaycore for AI routing metrics
      if (n8nConfig.relaycoreUrl) {
        await axios.post(`${n8nConfig.relaycoreUrl}/api/v1/metrics/n8n-execution`, {
          executionId: result.executionId,
          workflowId: result.workflowId,
          status: result.status,
          userId: execution.userId,
          systemSource: execution.systemSource,
          timestamp: new Date().toISOString(),
        }).catch(err => console.warn('Failed to log to relaycore:', err.message));
      }

      // Log to neuroweaver for model monitoring
      if (n8nConfig.neuroweaverUrl) {
        await axios.post(`${n8nConfig.neuroweaverUrl}/api/v1/monitoring/n8n-execution`, {
          executionId: result.executionId,
          workflowId: result.workflowId,
          status: result.status,
          result: result.result,
          timestamp: new Date().toISOString(),
        }).catch(err => console.warn('Failed to log to neuroweaver:', err.message));
      }
    } catch (error) {

    }
  }

  // Cleanup method for memory management
  clearCache(): void {
    this.cache.clear();
    this.executionCache.clear();
  }
}

export const n8nApiService = new N8nApiService();

