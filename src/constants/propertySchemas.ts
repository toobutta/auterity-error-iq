import { NodePropertySchemas, PropertySchema, PropertyGroup, PropertyTemplate } from '../types/properties.js';

export const NODE_PROPERTY_SCHEMAS: NodePropertySchemas = {
  'start': {
    groups: [
      {
        id: 'general',
        label: 'General',
        description: 'Basic node configuration',
        order: 1,
        collapsible: false,
        collapsedByDefault: false,
      },
      {
        id: 'flow',
        label: 'Flow Control',
        description: 'Workflow execution settings',
        order: 2,
        collapsible: true,
        collapsedByDefault: false,
      }
    ],
    properties: [
      {
        id: 'label',
        type: 'text',
        label: 'Node Label',
        description: 'Display name for this start node',
        required: true,
        defaultValue: 'Start',
        validation: [
          { type: 'required', message: 'Label is required' },
          { type: 'max', value: 50, message: 'Label must be less than 50 characters' }
        ],
        group: 'general',
        order: 1,
      },
      {
        id: 'description',
        type: 'textarea',
        label: 'Description',
        description: 'Optional description of this workflow start',
        required: false,
        defaultValue: '',
        validation: [
          { type: 'max', value: 200, message: 'Description must be less than 200 characters' }
        ],
        group: 'general',
        order: 2,
      },
      {
        id: 'autoStart',
        type: 'boolean',
        label: 'Auto Start',
        description: 'Automatically start workflow when triggered',
        required: false,
        defaultValue: true,
        validation: [],
        group: 'flow',
        order: 1,
      },
      {
        id: 'triggerType',
        type: 'select',
        label: 'Trigger Type',
        description: 'How this workflow should be triggered',
        required: true,
        defaultValue: 'manual',
        options: [
          { value: 'manual', label: 'Manual Trigger' },
          { value: 'schedule', label: 'Scheduled' },
          { value: 'webhook', label: 'Webhook' },
          { value: 'api', label: 'API Call' },
          { value: 'event', label: 'Event Based' }
        ],
        validation: [
          { type: 'required', message: 'Trigger type is required' }
        ],
        group: 'flow',
        order: 2,
      },
      {
        id: 'schedule',
        type: 'text',
        label: 'Schedule (Cron)',
        description: 'Cron expression for scheduled triggers',
        required: false,
        defaultValue: '0 0 * * *',
        dependencies: [
          {
            propertyId: 'triggerType',
            condition: { operator: 'equals', value: 'schedule' },
            action: 'show'
          }
        ],
        validation: [
          {
            type: 'pattern',
            value: /^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/,
            message: 'Invalid cron expression'
          }
        ],
        group: 'flow',
        order: 3,
      }
    ],
    templates: [
      {
        id: 'basic-start',
        name: 'Basic Start',
        description: 'Simple manual trigger',
        category: 'Basic',
        properties: {
          label: 'Start',
          autoStart: true,
          triggerType: 'manual'
        }
      },
      {
        id: 'scheduled-start',
        name: 'Scheduled Start',
        description: 'Time-based workflow trigger',
        category: 'Automation',
        properties: {
          label: 'Scheduled Start',
          autoStart: true,
          triggerType: 'schedule',
          schedule: '0 9 * * 1-5'
        }
      },
      {
        id: 'webhook-start',
        name: 'Webhook Start',
        description: 'External webhook trigger',
        category: 'Integration',
        properties: {
          label: 'Webhook Start',
          autoStart: true,
          triggerType: 'webhook'
        }
      }
    ]
  },

  'action': {
    groups: [
      {
        id: 'general',
        label: 'General',
        description: 'Basic action configuration',
        order: 1,
        collapsible: false,
        collapsedByDefault: false,
      },
      {
        id: 'execution',
        label: 'Execution',
        description: 'Action execution settings',
        order: 2,
        collapsible: true,
        collapsedByDefault: false,
      },
      {
        id: 'error-handling',
        label: 'Error Handling',
        description: 'What to do when action fails',
        order: 3,
        collapsible: true,
        collapsedByDefault: true,
      }
    ],
    properties: [
      {
        id: 'label',
        type: 'text',
        label: 'Action Name',
        description: 'Name for this action',
        required: true,
        defaultValue: 'Action',
        validation: [
          { type: 'required', message: 'Action name is required' },
          { type: 'max', value: 50, message: 'Name must be less than 50 characters' }
        ],
        group: 'general',
        order: 1,
      },
      {
        id: 'actionType',
        type: 'select',
        label: 'Action Type',
        description: 'Type of action to perform',
        required: true,
        defaultValue: 'custom',
        options: [
          { value: 'custom', label: 'Custom Action' },
          { value: 'http', label: 'HTTP Request' },
          { value: 'database', label: 'Database Query' },
          { value: 'file', label: 'File Operation' },
          { value: 'email', label: 'Send Email' },
          { value: 'sms', label: 'Send SMS' },
          { value: 'notification', label: 'Send Notification' }
        ],
        validation: [
          { type: 'required', message: 'Action type is required' }
        ],
        group: 'general',
        order: 2,
      },
      {
        id: 'description',
        type: 'textarea',
        label: 'Description',
        description: 'Optional description of what this action does',
        required: false,
        defaultValue: '',
        validation: [
          { type: 'max', value: 500, message: 'Description must be less than 500 characters' }
        ],
        group: 'general',
        order: 3,
      },
      {
        id: 'timeout',
        type: 'number',
        label: 'Timeout (seconds)',
        description: 'Maximum time to wait for action completion',
        required: false,
        defaultValue: 30,
        validation: [
          { type: 'min', value: 1, message: 'Timeout must be at least 1 second' },
          { type: 'max', value: 300, message: 'Timeout cannot exceed 5 minutes' }
        ],
        group: 'execution',
        order: 1,
      },
      {
        id: 'retryCount',
        type: 'number',
        label: 'Retry Count',
        description: 'Number of times to retry on failure',
        required: false,
        defaultValue: 3,
        validation: [
          { type: 'min', value: 0, message: 'Retry count cannot be negative' },
          { type: 'max', value: 10, message: 'Maximum 10 retries allowed' }
        ],
        group: 'execution',
        order: 2,
      },
      {
        id: 'retryDelay',
        type: 'number',
        label: 'Retry Delay (seconds)',
        description: 'Delay between retries',
        required: false,
        defaultValue: 1,
        dependencies: [
          {
            propertyId: 'retryCount',
            condition: { operator: 'greater-than', value: 0 },
            action: 'show'
          }
        ],
        validation: [
          { type: 'min', value: 0.1, message: 'Delay must be at least 0.1 seconds' },
          { type: 'max', value: 60, message: 'Delay cannot exceed 1 minute' }
        ],
        group: 'execution',
        order: 3,
      },
      {
        id: 'continueOnError',
        type: 'boolean',
        label: 'Continue on Error',
        description: 'Continue workflow execution if this action fails',
        required: false,
        defaultValue: false,
        validation: [],
        group: 'error-handling',
        order: 1,
      },
      {
        id: 'errorMessage',
        type: 'textarea',
        label: 'Error Message',
        description: 'Custom error message if action fails',
        required: false,
        defaultValue: '',
        dependencies: [
          {
            propertyId: 'continueOnError',
            condition: { operator: 'equals', value: false },
            action: 'show'
          }
        ],
        validation: [
          { type: 'max', value: 200, message: 'Error message must be less than 200 characters' }
        ],
        group: 'error-handling',
        order: 2,
      }
    ],
    templates: [
      {
        id: 'http-get',
        name: 'HTTP GET Request',
        description: 'Make a GET request to an API',
        category: 'API',
        properties: {
          label: 'HTTP GET',
          actionType: 'http',
          timeout: 30,
          retryCount: 2
        }
      },
      {
        id: 'send-email',
        name: 'Send Email',
        description: 'Send an email notification',
        category: 'Communication',
        properties: {
          label: 'Send Email',
          actionType: 'email',
          timeout: 60,
          retryCount: 1
        }
      },
      {
        id: 'database-query',
        name: 'Database Query',
        description: 'Execute a database query',
        category: 'Data',
        properties: {
          label: 'Database Query',
          actionType: 'database',
          timeout: 30,
          retryCount: 0
        }
      }
    ]
  },

  'decision': {
    groups: [
      {
        id: 'general',
        label: 'General',
        description: 'Basic decision configuration',
        order: 1,
        collapsible: false,
        collapsedByDefault: false,
      },
      {
        id: 'conditions',
        label: 'Conditions',
        description: 'Decision logic and conditions',
        order: 2,
        collapsible: false,
        collapsedByDefault: false,
      }
    ],
    properties: [
      {
        id: 'label',
        type: 'text',
        label: 'Decision Name',
        description: 'Name for this decision point',
        required: true,
        defaultValue: 'Decision',
        validation: [
          { type: 'required', message: 'Decision name is required' },
          { type: 'max', value: 50, message: 'Name must be less than 50 characters' }
        ],
        group: 'general',
        order: 1,
      },
      {
        id: 'expression',
        type: 'textarea',
        label: 'Condition Expression',
        description: 'Expression to evaluate (JavaScript-like syntax)',
        required: true,
        defaultValue: '',
        validation: [
          { type: 'required', message: 'Condition expression is required' }
        ],
        group: 'conditions',
        order: 1,
      },
      {
        id: 'trueLabel',
        type: 'text',
        label: 'True Path Label',
        description: 'Label for the true/yes path',
        required: false,
        defaultValue: 'Yes',
        validation: [
          { type: 'max', value: 20, message: 'Label must be less than 20 characters' }
        ],
        group: 'conditions',
        order: 2,
      },
      {
        id: 'falseLabel',
        type: 'text',
        label: 'False Path Label',
        description: 'Label for the false/no path',
        required: false,
        defaultValue: 'No',
        validation: [
          { type: 'max', value: 20, message: 'Label must be less than 20 characters' }
        ],
        group: 'conditions',
        order: 3,
      },
      {
        id: 'defaultPath',
        type: 'select',
        label: 'Default Path',
        description: 'Default path if expression evaluation fails',
        required: false,
        defaultValue: 'false',
        options: [
          { value: 'true', label: 'True Path' },
          { value: 'false', label: 'False Path' }
        ],
        validation: [],
        group: 'conditions',
        order: 4,
      }
    ],
    templates: [
      {
        id: 'simple-condition',
        name: 'Simple Condition',
        description: 'Basic true/false decision',
        category: 'Basic',
        properties: {
          label: 'Check Condition',
          expression: 'data.value > 0',
          trueLabel: 'Value > 0',
          falseLabel: 'Value ≤ 0'
        }
      },
      {
        id: 'status-check',
        name: 'Status Check',
        description: 'Check API response status',
        category: 'API',
        properties: {
          label: 'Check Status',
          expression: 'response.status === 200',
          trueLabel: 'Success',
          falseLabel: 'Failed'
        }
      }
    ]
  },

  'ai-model': {
    groups: [
      {
        id: 'general',
        label: 'General',
        description: 'AI model basic configuration',
        order: 1,
        collapsible: false,
        collapsedByDefault: false,
      },
      {
        id: 'model',
        label: 'Model Settings',
        description: 'AI model configuration',
        order: 2,
        collapsible: false,
        collapsedByDefault: false,
      },
      {
        id: 'prompt',
        label: 'Prompt & Context',
        description: 'AI prompt and context settings',
        order: 3,
        collapsible: true,
        collapsedByDefault: false,
      }
    ],
    properties: [
      {
        id: 'label',
        type: 'text',
        label: 'AI Action Name',
        description: 'Name for this AI operation',
        required: true,
        defaultValue: 'AI Model',
        validation: [
          { type: 'required', message: 'AI action name is required' },
          { type: 'max', value: 50, message: 'Name must be less than 50 characters' }
        ],
        group: 'general',
        order: 1,
      },
      {
        id: 'model',
        type: 'select',
        label: 'AI Model',
        description: 'Select the AI model to use',
        required: true,
        defaultValue: 'gpt-3.5-turbo',
        options: [
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'claude-2', label: 'Claude 2' },
          { value: 'gemini-pro', label: 'Gemini Pro' }
        ],
        validation: [
          { type: 'required', message: 'AI model is required' }
        ],
        group: 'model',
        order: 1,
      },
      {
        id: 'temperature',
        type: 'slider',
        label: 'Temperature',
        description: 'Controls randomness (0 = deterministic, 1 = creative)',
        required: false,
        defaultValue: 0.7,
        validation: [
          { type: 'min', value: 0, message: 'Temperature must be at least 0' },
          { type: 'max', value: 2, message: 'Temperature cannot exceed 2' }
        ],
        group: 'model',
        order: 2,
      },
      {
        id: 'maxTokens',
        type: 'number',
        label: 'Max Tokens',
        description: 'Maximum response length',
        required: false,
        defaultValue: 1000,
        validation: [
          { type: 'min', value: 1, message: 'Max tokens must be at least 1' },
          { type: 'max', value: 4000, message: 'Max tokens cannot exceed 4000' }
        ],
        group: 'model',
        order: 3,
      },
      {
        id: 'prompt',
        type: 'textarea',
        label: 'Prompt',
        description: 'Instructions for the AI model',
        required: true,
        defaultValue: '',
        validation: [
          { type: 'required', message: 'Prompt is required' },
          { type: 'max', value: 2000, message: 'Prompt must be less than 2000 characters' }
        ],
        group: 'prompt',
        order: 1,
      },
      {
        id: 'context',
        type: 'textarea',
        label: 'Context',
        description: 'Additional context or examples',
        required: false,
        defaultValue: '',
        validation: [
          { type: 'max', value: 1000, message: 'Context must be less than 1000 characters' }
        ],
        group: 'prompt',
        order: 2,
      }
    ],
    templates: [
      {
        id: 'text-summarization',
        name: 'Text Summarization',
        description: 'Summarize text content',
        category: 'Text Processing',
        properties: {
          label: 'Summarize Text',
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          maxTokens: 200,
          prompt: 'Summarize the following text in 2-3 sentences:'
        }
      },
      {
        id: 'sentiment-analysis',
        name: 'Sentiment Analysis',
        description: 'Analyze text sentiment',
        category: 'Analysis',
        properties: {
          label: 'Analyze Sentiment',
          model: 'gpt-3.5-turbo',
          temperature: 0.1,
          maxTokens: 50,
          prompt: 'Analyze the sentiment of this text and respond with only: positive, negative, or neutral.'
        }
      },
      {
        id: 'code-generation',
        name: 'Code Generation',
        description: 'Generate code from description',
        category: 'Development',
        properties: {
          label: 'Generate Code',
          model: 'gpt-4',
          temperature: 0.2,
          maxTokens: 1000,
          prompt: 'Generate clean, well-commented code for the following requirement:'
        }
      }
    ]
  }
};

// Default property schemas for other node types
const createDefaultSchema = (nodeType: string, label: string): NodePropertySchemas[string] => ({
  groups: [
    {
      id: 'general',
      label: 'General',
      description: 'Basic node configuration',
      order: 1,
      collapsible: false,
      collapsedByDefault: false,
    }
  ],
  properties: [
    {
      id: 'label',
      type: 'text',
      label: 'Node Label',
      description: 'Display name for this node',
      required: true,
      defaultValue: label,
      validation: [
        { type: 'required', message: 'Label is required' },
        { type: 'max', value: 50, message: 'Label must be less than 50 characters' }
      ],
      group: 'general',
      order: 1,
    },
    {
      id: 'description',
      type: 'textarea',
      label: 'Description',
      description: 'Optional description of this node',
      required: false,
      defaultValue: '',
      validation: [
        { type: 'max', value: 200, message: 'Description must be less than 200 characters' }
      ],
      group: 'general',
      order: 2,
    }
  ],
  templates: [
    {
      id: `${nodeType}-basic`,
      name: `Basic ${label}`,
      description: `Simple ${label.toLowerCase()} configuration`,
      category: 'Basic',
      properties: {
        label: label,
        description: ''
      }
    }
  ]
});

// Add default schemas for remaining node types
const remainingTypes = ['end', 'loop', 'parallel', 'merge', 'api-call', 'webhook', 'database', 'file-system', 'email', 'sms', 'notification', 'data-transform'];
remainingTypes.forEach(type => {
  if (!NODE_PROPERTY_SCHEMAS[type]) {
    const label = type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    NODE_PROPERTY_SCHEMAS[type] = createDefaultSchema(type, label);
  }
});
