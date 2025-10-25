// n8n API Service: Handles REST API interactions for specialized features.
// Error-free: Includes validation, error handling, and caching.

import axios from 'axios';
import { z } from 'zod';
import { n8nConfig } from './n8nConfig';

// Validation schemas
const WorkflowExecutionSchema = z.object({
  workflowId: z.string(),
  parameters: z.record(z.any()).optional(),
});

const TemplateResponseSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.record(z.any()),
  })),
});

class N8nApiService {
  private cache = new Map<string, any>();

  // Specialized Feature: Trigger n8n workflow
  async triggerWorkflow(workflowId: string, parameters: Record<string, any> = {}) {
    try {
      const validated = WorkflowExecutionSchema.parse({ workflowId, parameters });
      const cacheKey = `trigger-${workflowId}-${JSON.stringify(parameters)}`;
      if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

      const response = await axios.post(
        `${n8nConfig.apiUrl}/workflows/${validated.workflowId}/execute`,
        { parameters: validated.parameters },
        { headers: { 'X-N8N-API-KEY': n8nConfig.apiKey } }
      );

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('n8n triggerWorkflow error:', error);
      throw new Error('Failed to trigger n8n workflow');
    }
  }

  // Specialized Feature: Import n8n template
  async importTemplate(templateId: string) {
    try {
      const cacheKey = `template-${templateId}`;
      if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

      const response = await axios.get(
        `${n8nConfig.apiUrl}/workflows/templates/${templateId}`,
        { headers: { 'X-N8N-API-KEY': n8nConfig.apiKey } }
      );

      const validated = TemplateResponseSchema.parse(response.data);
      this.cache.set(cacheKey, validated);
      return validated;
    } catch (error) {
      console.error('n8n importTemplate error:', error);
      throw new Error('Failed to import n8n template');
    }
  }
}

export const n8nApiService = new N8nApiService();
