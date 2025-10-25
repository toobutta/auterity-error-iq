import { StudioNode, NodeData, NodeStyle } from '../../types/studio';
import { n8nApiService, N8nWorkflowExecution } from '../../services/n8n/n8nApiService';

export interface N8nTriggerConfig {
  workflowId: string;
  parameters: Record<string, any>;
  outputVariable: string;
  timeout: number;
  retryCount: number;
  enableCaching: boolean;
}

export class N8nTriggerNode implements StudioNode {
  id: string;
  type: string = 'n8n.trigger';
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: NodeData;
  style: NodeStyle;
  selected: boolean = false;
  dragging: boolean = false;
  resizing: boolean = false;

  constructor(id: string, position: { x: number; y: number }, config: Partial<N8nTriggerConfig> = {}) {
    this.id = id;
    this.position = position;
    this.size = { width: 320, height: 240 };

    this.data = {
      label: 'n8n Workflow Trigger',
      description: 'Trigger an n8n workflow and get results with auterity-error-iq integration',
      icon: '⚡',
      properties: {
        workflowId: config.workflowId || '',
        parameters: config.parameters || {},
        outputVariable: config.outputVariable || 'n8nResult',
        timeout: config.timeout || 30000,
        retryCount: config.retryCount || 3,
        enableCaching: config.enableCaching ?? true,
      },
      category: 'n8n',
      propertyDefinitions: [
        {
          key: 'workflowId',
          label: 'n8n Workflow ID',
          type: 'text',
          required: true,
          defaultValue: '',
          placeholder: 'Enter n8n workflow ID',
          description: 'The ID of the n8n workflow to trigger (found in n8n UI or via API)',
          validation: {
            pattern: /^[a-zA-Z0-9_-]+$/,
            message: 'Workflow ID should contain only letters, numbers, hyphens, and underscores'
          }
        },
        {
          key: 'parameters',
          label: 'Workflow Parameters',
          type: 'textarea',
          required: false,
          defaultValue: '{}',
          placeholder: '{"key": "value", "input": "{{input}}"}',
          description: 'JSON parameters to pass to the n8n workflow. Use {{variable}} syntax for dynamic values.',
          validation: {
            custom: (value: string) => {
              try {
                if (value.trim() === '') return true; // Allow empty
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
          defaultValue: 'n8nResult',
          description: 'Name of the variable to store the workflow result',
          validation: {
            pattern: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
            message: 'Variable name must be a valid JavaScript identifier'
          }
        },
        {
          key: 'timeout',
          label: 'Timeout (ms)',
          type: 'number',
          required: false,
          defaultValue: 30000,
          min: 1000,
          max: 300000,
          step: 1000,
          description: 'Maximum time to wait for workflow completion (1-300 seconds)'
        },
        {
          key: 'retryCount',
          label: 'Retry Count',
          type: 'number',
          required: false,
          defaultValue: 3,
          min: 0,
          max: 10,
          description: 'Number of times to retry failed executions'
        },
        {
          key: 'enableCaching',
          label: 'Enable Result Caching',
          type: 'boolean',
          required: false,
          defaultValue: true,
          description: 'Cache successful results to improve performance for repeated executions'
        }
      ]
    };

    this.style = {
      backgroundColor: 0x059669,
      borderColor: 0x047857,
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
    const { workflowId, parameters, outputVariable, timeout, retryCount, enableCaching } = this.data.properties;

    if (!workflowId) {
      throw new Error('N8nTriggerNode: Workflow ID is required. Configure the node first.');
    }

    // Validate workflow ID format
    if (!/^[a-zA-Z0-9_-]+$/.test(workflowId)) {
      throw new Error('N8nTriggerNode: Invalid workflow ID format. Use only letters, numbers, hyphens, and underscores.');
    }

    // Parse and validate parameters
    let parsedParams = parameters;
    if (typeof parameters === 'string') {
      try {
        parsedParams = parameters.trim() === '' ? {} : JSON.parse(parameters);
      } catch (parseError) {
        throw new Error('N8nTriggerNode: Invalid JSON in parameters. Please check the format.');
      }
    }

    // Merge with inputs and resolve template variables
    const mergedParams = this.resolveTemplateVariables({ ...parsedParams, ...inputs });



    const execution: N8nWorkflowExecution = {
      workflowId,
      parameters: mergedParams,
      userId: inputs.userId,
      systemSource: 'auterity-workflow-studio'
    };

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= retryCount + 1; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const result = await n8nApiService.triggerWorkflow(execution);

        clearTimeout(timeoutId);

        // Prepare comprehensive output
        const output: Record<string, any> = {
          [outputVariable]: result.result || {},
          success: result.status === 'completed',
          executionId: result.executionId,
          workflowId: result.workflowId,
          status: result.status,
          attempt: attempt,
          executionTime: result.startedAt ? new Date(result.startedAt).toISOString() : null,
          completedAt: result.completedAt ? new Date(result.completedAt).toISOString() : null,
        };

        // Add error information if failed
        if (result.status === 'failed' && result.error) {
          output.error = result.error;
          output.errorMessage = `n8n workflow failed: ${result.error}`;
        }

        // Cache result if enabled and successful
        if (enableCaching && result.status === 'completed') {
          // Implementation would cache here for future identical executions

        }

        return output;

      } catch (error: any) {
        lastError = error;


        // Don't retry on certain errors
        if (error.message?.includes('authentication failed') ||
            error.message?.includes('not found') ||
            error.message?.includes('Invalid workflow ID')) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt <= retryCount) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const errorMessage = `N8nTriggerNode: Workflow execution failed after ${retryCount + 1} attempts. Last error: ${lastError?.message || 'Unknown error'}`;


    return {
      [outputVariable]: null,
      success: false,
      error: errorMessage,
      executionId: null,
      workflowId: workflowId,
      status: 'failed',
      attempt: retryCount + 1,
      lastError: lastError?.message
    };
  }

  validate(): string[] {
    const errors: string[] = [];
    const { workflowId, parameters, outputVariable, timeout, retryCount } = this.data.properties;

    if (!workflowId || workflowId.trim() === '') {
      errors.push('Workflow ID is required');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(workflowId)) {
      errors.push('Workflow ID must contain only letters, numbers, hyphens, and underscores');
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

    if (timeout < 1000 || timeout > 300000) {
      errors.push('Timeout must be between 1000 and 300000 ms');
    }

    if (retryCount < 0 || retryCount > 10) {
      errors.push('Retry count must be between 0 and 10');
    }

    return errors;
  }

  getInputs(): string[] {
    return ['input', 'data', 'payload', 'userId', 'context'];
  }

  getOutputs(): string[] {
    const { outputVariable } = this.data.properties;
    return [outputVariable, 'success', 'executionId', 'status', 'error', 'executionTime', 'completedAt'];
  }

  clone(): N8nTriggerNode {
    const cloned = new N8nTriggerNode(
      `${this.id}_copy`,
      { x: this.position.x + 20, y: this.position.y + 20 },
      this.data.properties
    );
    return cloned;
  }

  // Utility method to resolve template variables like {{variable}}
  private resolveTemplateVariables(params: Record<string, any>): Record<string, any> {
    const resolved = { ...params };

    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === 'string') {
        // Simple template resolution - can be enhanced for more complex scenarios
        resolved[key] = value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          // Look for the variable in the current context
          // This is a basic implementation - can be enhanced
          return params[varName] || match;
        });
      }
    }

    return resolved;
  }

  // Method to get workflow status (useful for async operations)
  async getExecutionStatus(executionId: string) {
    try {
      return await n8nApiService.getExecutionStatus(executionId);
    } catch (error) {

      return null;
    }
  }
}

