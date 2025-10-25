/**
 * n8n Template Node
 * Node for importing and using n8n workflow templates
 * Migrated from auterity-workflow-studio and adapted for auterity-error-iq
 */

import { n8nApiService } from '../../services/n8n/n8nApiService';

// Local type definitions to avoid import issues
export interface NodeData {
  label: string;
  description?: string;
  config: NodeConfig;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  properties?: Record<string, any>;
  category?: string;
  propertyDefinitions?: any[];
  icon?: string;
}

export interface NodeConfig {
  type: string;
  [key: string]: unknown;
}

export interface BaseNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: NodeData;
}

export interface N8nTemplateConfig {
  templateId: string;
  parameters: Record<string, any>;
  outputVariable: string;
  autoImport: boolean;
  cacheTemplate: boolean;
}

export interface NodeStyle {
  backgroundColor: number;
  borderColor: number;
  borderWidth: number;
  borderRadius: number;
  textColor: number;
  fontSize: number;
  fontWeight: string;
  shadow: boolean;
  opacity: number;
}

export class N8nTemplateNode implements BaseNode {
  id: string;
  type: string = 'n8n.template';
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: NodeData;
  style: NodeStyle;
  selected: boolean = false;
  dragging: boolean = false;
  resizing: boolean = false;

  constructor(id: string, position: { x: number; y: number }, config: Partial<N8nTemplateConfig> = {}) {
    this.id = id;
    this.position = position;
    this.size = { width: 320, height: 240 };

    this.data = {
      label: 'n8n Template Import',
      description: 'Import and execute n8n workflow templates with auterity-error-iq integration',
      icon: '📋',
      config: {
        type: 'n8n.template'
      },
      properties: {
        templateId: config.templateId || '',
        parameters: config.parameters || {},
        outputVariable: config.outputVariable || 'templateResult',
        autoImport: config.autoImport ?? true,
        cacheTemplate: config.cacheTemplate ?? true,
      },
      category: 'n8n',
      propertyDefinitions: [
        {
          key: 'templateId',
          label: 'Template ID',
          type: 'text',
          required: true,
          defaultValue: '',
          placeholder: 'template_123456',
          description: 'The ID of the n8n template to import (found in n8n template library)',
          validation: {
            pattern: /^[a-zA-Z0-9_-]+$/,
            message: 'Template ID should contain only letters, numbers, hyphens, and underscores'
          }
        },
        {
          key: 'parameters',
          label: 'Template Parameters',
          type: 'textarea',
          required: false,
          defaultValue: '{}',
          placeholder: '{"key": "value", "input": "{{input}}"}',
          description: 'JSON parameters to pass to the template. Use {{variable}} syntax for dynamic values.',
          validation: {
            custom: (value: string) => {
              try {
                if (value.trim() === '') return true;
                JSON.parse(value);
                return true;
              } catch {
                return false;
              }
            },
            message: 'Parameters must be valid JSON'
          }
        },
        {
          key: 'outputVariable',
          label: 'Output Variable',
          type: 'text',
          required: true,
          defaultValue: 'templateResult',
          description: 'Name of the variable to store the template execution result',
          validation: {
            pattern: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
            message: 'Variable name must be a valid JavaScript identifier'
          }
        },
        {
          key: 'autoImport',
          label: 'Auto Import Template',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Automatically import the template when the node executes'
        },
        {
          key: 'cacheTemplate',
          label: 'Cache Template',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Cache the imported template for better performance on repeated executions'
        }
      ]
    };

    this.style = {
      backgroundColor: 0x10B981,
      borderColor: 0x059669,
      borderWidth: 2,
      borderRadius: 8,
      textColor: 0xffffff,
      fontSize: 12,
      fontWeight: '600',
      shadow: true,
      opacity: 1
    };
  }

  async execute(inputs: Record<string, any>): Promise<Record<string, any>> {
    const properties = this.data.properties || {};
    const { templateId, parameters, outputVariable, autoImport } = properties as any;

    if (!templateId) {
      throw new Error('N8nTemplateNode: Template ID is required. Configure the node first.');
    }

    // Validate template ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(templateId)) {
      throw new Error('N8nTemplateNode: Invalid template ID format. Use only letters, numbers, hyphens, and underscores.');
    }

    try {


      // Import template if auto-import is enabled
      let template;
      if (autoImport) {
        template = await n8nApiService.importTemplate(templateId);

      }

      // Prepare parameters with template variable resolution
      const resolvedParams = this.resolveTemplateVariables(parameters, inputs);

      // Execute the template (this would typically create a workflow from the template and execute it)
      const executionResult = await this.executeTemplate(templateId, resolvedParams);

      const output = {
        [outputVariable]: executionResult,
        success: true,
        templateId: templateId,
        executionId: executionResult.executionId || `exec_${Date.now()}`,
        template: autoImport ? template : null,
        parameters: resolvedParams,
        executedAt: new Date().toISOString()
      };


      return output;

    } catch (error: any) {


      const errorMessage = `N8nTemplateNode: Template execution failed: ${error.message || 'Unknown error'}`;

      return {
        [outputVariable]: null,
        success: false,
        error: errorMessage,
        templateId: templateId,
        executedAt: new Date().toISOString()
      };
    }
  }

  validate(): string[] {
    const errors: string[] = [];
    const properties = this.data.properties || {};
    const { templateId, parameters, outputVariable } = properties as any;

    if (!templateId || templateId.trim() === '') {
      errors.push('Template ID is required');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(templateId)) {
      errors.push('Template ID must contain only letters, numbers, hyphens, and underscores');
    }

    if (typeof parameters === 'string') {
      try {
        if (parameters.trim() !== '') {
          JSON.parse(parameters);
        }
      } catch {
        errors.push('Parameters must be valid JSON');
      }
    }

    if (!outputVariable || outputVariable.trim() === '') {
      errors.push('Output variable name is required');
    } else if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(outputVariable)) {
      errors.push('Output variable name must be a valid JavaScript identifier');
    }

    return errors;
  }

  getInputs(): string[] {
    return ['input', 'data', 'payload', 'userId', 'context', 'templateParams'];
  }

  getOutputs(): string[] {
    const properties = this.data.properties || {};
    const { outputVariable } = properties as any;
    return [outputVariable, 'success', 'templateId', 'executionId', 'error', 'executedAt'];
  }

  clone(): N8nTemplateNode {
    const cloned = new N8nTemplateNode(
      `${this.id}_copy`,
      { x: this.position.x + 20, y: this.position.y + 20 },
      this.data.properties
    );
    return cloned;
  }

  // Utility method to resolve template variables like {{variable}}
  private resolveTemplateVariables(params: Record<string, any>, inputs: Record<string, any>): Record<string, any> {
    const resolved = { ...params };

    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === 'string') {
        // Simple template resolution - can be enhanced for more complex scenarios
        resolved[key] = value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          // Look for the variable in inputs first, then in the current context
          return inputs[varName] || params[varName] || match;
        });
      }
    }

    return resolved;
  }

  // Execute template by creating a workflow and running it
  private async executeTemplate(templateId: string, parameters: Record<string, any>): Promise<any> {
    try {
      // This would typically:
      // 1. Create a workflow from the template
      // 2. Execute the workflow with the provided parameters
      // 3. Return the execution results

      // For now, simulate template execution
      const executionId = `template_exec_${Date.now()}`;

      // Simulate workflow creation from template
      const workflowId = await this.createWorkflowFromTemplate(templateId);

      // Execute the created workflow
      const result = await n8nApiService.triggerWorkflow({
        workflowId,
        parameters,
        systemSource: 'auterity-workflow-studio-template'
      });

      return {
        executionId,
        workflowId,
        result: result.result,
        status: result.status,
        templateId
      };

    } catch (error) {

      throw error;
    }
  }

  // Create a workflow from template
  private async createWorkflowFromTemplate(templateId: string): Promise<string> {
    // This would integrate with n8n's template system to create a workflow
    // For now, return a mock workflow ID
    return `workflow_from_template_${templateId}_${Date.now()}`;
  }

  // Get template information
  async getTemplateInfo(): Promise<any> {
    const properties = this.data.properties || {};
    const { templateId } = properties as any;

    if (!templateId) {
      throw new Error('Template ID is required to get template information');
    }

    try {
      return await n8nApiService.importTemplate(templateId);
    } catch (error) {

      return null;
    }
  }
}

export default N8nTemplateNode;

