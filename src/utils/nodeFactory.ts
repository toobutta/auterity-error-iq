import { StudioNode, NodeType } from '../types/studio';
import { DEFAULT_NODE_STYLES } from '../constants/themes';

export function createNode(
  nodeType: NodeType, 
  position = { x: 100, y: 100 },
  customId?: string
): StudioNode {
  const nodeId = customId || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const style = DEFAULT_NODE_STYLES[nodeType] || DEFAULT_NODE_STYLES.custom;
  
  return {
    id: nodeId,
    type: nodeType,
    position,
    size: { width: 120, height: 60 },
    data: {
      label: getNodeLabel(nodeType),
      description: getNodeDescription(nodeType),
      icon: getNodeIcon(nodeType),
      properties: getDefaultProperties(nodeType),
      category: getCategoryForNodeType(nodeType),
    },
    style,
    selected: false,
    dragging: false,
    resizing: false,
  };
}

function getNodeLabel(nodeType: NodeType): string {
  const labels: Record<NodeType, string> = {
    // Flow Control
    'start': 'Start',
    'end': 'End',
    'decision': 'Decision',
    'condition': 'Condition',
    'switch': 'Switch',
    'loop': 'Loop',
    'parallel': 'Parallel',
    'merge': 'Merge',
    'wait': 'Wait',
    'delay': 'Delay',
    'timer': 'Timer',
    'split': 'Split',

    // Data Processing
    'data-transform': 'Transform',
    'filter': 'Filter',
    'sort': 'Sort',
    'aggregate': 'Aggregate',
    'join': 'Join',
    'split-data': 'Split Data',
    'data-validation': 'Validate',

    // Integration & API
    'api-call': 'API Call',
    'webhook': 'Webhook',
    'http-request': 'HTTP Request',
    'graphql': 'GraphQL',
    'websocket': 'WebSocket',
    'rest-api': 'REST API',

    // Communication
    'email': 'Email',
    'sms': 'SMS',
    'notification': 'Notification',
    'slack': 'Slack',
    'teams': 'Teams',
    'webhook-response': 'Webhook Response',

    // AI/ML
    'ai-model': 'AI Model',
    'text-generation': 'Text Generation',
    'image-processing': 'Image Processing',
    'classification': 'Classification',
    'sentiment-analysis': 'Sentiment Analysis',

    // n8n Integration
    'n8n.trigger': 'n8n Workflow Trigger',
    'n8n.template': 'n8n Template Import',

    // Database & Storage
    'database': 'Database',
    'file-system': 'File System',
    's3-storage': 'S3 Storage',
    'redis': 'Redis',
    'mongodb': 'MongoDB',
    'postgresql': 'PostgreSQL',

    // Business Logic
    'action': 'Action',
    'script': 'Script',
    'function-call': 'Function Call',
    'business-rule': 'Business Rule',
    'validation-rule': 'Validation Rule',

    // Advanced
    'custom': 'Custom',
    'sub-workflow': 'Sub-workflow',
    'error-handler': 'Error Handler',
  };
  return labels[nodeType] || 'Node';
}

function getNodeDescription(nodeType: NodeType): string {
  const descriptions: Record<NodeType, string> = {
    // Flow Control
    'start': 'Start point of the workflow',
    'end': 'End point of the workflow',
    'decision': 'Make a decision based on conditions',
    'condition': 'Check a condition',
    'switch': 'Route based on multiple conditions',
    'loop': 'Repeat a set of actions',
    'parallel': 'Execute multiple branches in parallel',
    'merge': 'Merge parallel branches',
    'wait': 'Wait for a specific condition or time',
    'delay': 'Add a time delay',
    'timer': 'Schedule execution at specific times',
    'split': 'Split workflow into multiple paths',

    // Data Processing
    'data-transform': 'Transform data from one format to another',
    'filter': 'Filter data based on conditions',
    'sort': 'Sort data by specified criteria',
    'aggregate': 'Aggregate data using functions like sum, count, avg',
    'join': 'Join multiple data sources',
    'split-data': 'Split data into multiple parts',
    'data-validation': 'Validate data against rules',

    // Integration & API
    'api-call': 'Call an external API',
    'webhook': 'Receive webhook data',
    'http-request': 'Make HTTP requests',
    'graphql': 'Execute GraphQL queries',
    'websocket': 'Handle WebSocket connections',
    'rest-api': 'REST API operations',

    // Communication
    'email': 'Send email notifications',
    'sms': 'Send SMS messages',
    'notification': 'Send notifications',
    'slack': 'Send Slack messages',
    'teams': 'Send Microsoft Teams messages',
    'webhook-response': 'Send webhook responses',

    // AI/ML
    'ai-model': 'Use AI/ML models',
    'text-generation': 'Generate text using AI',
    'image-processing': 'Process images with AI',
    'classification': 'Classify data using AI',
    'sentiment-analysis': 'Analyze sentiment of text',

    // n8n Integration
    'n8n.trigger': 'Trigger an n8n workflow and get results',
    'n8n.template': 'Import and convert n8n workflow templates',

    // Database & Storage
    'database': 'Database operations',
    'file-system': 'File system operations',
    's3-storage': 'Amazon S3 storage operations',
    'redis': 'Redis cache operations',
    'mongodb': 'MongoDB operations',
    'postgresql': 'PostgreSQL operations',

    // Business Logic
    'action': 'Execute an action or operation',
    'script': 'Run custom scripts',
    'function-call': 'Call custom functions',
    'business-rule': 'Apply business rules',
    'validation-rule': 'Apply validation rules',

    // Advanced
    'custom': 'Custom node',
    'sub-workflow': 'Execute a sub-workflow',
    'error-handler': 'Handle errors and exceptions',
  };
  return descriptions[nodeType] || 'Custom node';
}

function getNodeIcon(nodeType: NodeType): string {
  const icons: Record<NodeType, string> = {
    // Flow Control
    'start': '▶️',
    'end': '⏹️',
    'decision': '🔀',
    'condition': '❓',
    'switch': '🔄',
    'loop': '�',
    'parallel': '⚡',
    'merge': '🔗',
    'wait': '⏳',
    'delay': '⏱️',
    'timer': '🕐',
    'split': '✂️',

    // Data Processing
    'data-transform': '🔄',
    'filter': '🔍',
    'sort': '📊',
    'aggregate': '📈',
    'join': '🔗',
    'split-data': '✂️',
    'data-validation': '✅',

    // Integration & API
    'api-call': '🌐',
    'webhook': '📥',
    'http-request': '🔗',
    'graphql': '📊',
    'websocket': '�',
    'rest-api': '�',

    // Communication
    'email': '📧',
    'sms': '📱',
    'notification': '🔔',
    'slack': '💬',
    'teams': '👥',
    'webhook-response': '📤',

    // AI/ML
    'ai-model': '🤖',
    'text-generation': '📝',
    'image-processing': '🖼️',
    'classification': '🏷️',
    'sentiment-analysis': '😊',

    // n8n Integration
    'n8n.trigger': '⚡',
    'n8n.template': '📋',

    // Database & Storage
    'database': '🗄️',
    'file-system': '📁',
    's3-storage': '☁️',
    'redis': '💾',
    'mongodb': '🍃',
    'postgresql': '🐘',

    // Business Logic
    'action': '⚡',
    'script': '📜',
    'function-call': '🔧',
    'business-rule': '�',
    'validation-rule': '✅',

    // Advanced
    'custom': '🛠️',
    'sub-workflow': '📦',
    'error-handler': '🚨',
  };
  return icons[nodeType] || '🔧';
}

function getDefaultProperties(nodeType: NodeType): Record<string, any> {
  const defaultProps: Record<NodeType, Record<string, any>> = {
    // Flow Control
    'start': {},
    'end': {},
    'decision': {
      conditions: [],
      defaultPath: 'false',
    },
    'condition': {
      expression: '',
      trueLabel: 'True',
      falseLabel: 'False',
    },
    'switch': {
      expression: '',
      cases: [],
      defaultCase: '',
    },
    'loop': {
      type: 'for',
      iterations: 10,
      condition: '',
    },
    'parallel': {
      branches: 2,
      waitForAll: true,
    },
    'merge': {
      strategy: 'first',
    },
    'wait': {
      condition: '',
      timeout: 30000,
    },
    'delay': {
      duration: 1000,
      unit: 'milliseconds',
    },
    'timer': {
      schedule: '',
      timezone: 'UTC',
    },
    'split': {
      conditions: [],
    },

    // Data Processing
    'data-transform': {
      transformation: '',
      inputFormat: 'json',
      outputFormat: 'json',
    },
    'filter': {
      conditions: [],
      operator: 'AND',
    },
    'sort': {
      field: '',
      order: 'asc',
    },
    'aggregate': {
      groupBy: [],
      functions: [],
    },
    'join': {
      type: 'inner',
      leftField: '',
      rightField: '',
    },
    'split-data': {
      delimiter: ',',
      maxParts: 10,
    },
    'data-validation': {
      rules: [],
      strict: false,
    },

    // Integration & API
    'api-call': {
      url: '',
      method: 'GET',
      headers: {},
      timeout: 30000,
    },
    'webhook': {
      endpoint: '',
      secret: '',
    },
    'http-request': {
      url: '',
      method: 'GET',
      headers: {},
      body: '',
      timeout: 30000,
    },
    'graphql': {
      endpoint: '',
      query: '',
      variables: {},
    },
    'websocket': {
      url: '',
      protocol: '',
    },
    'rest-api': {
      baseUrl: '',
      endpoints: [],
    },

    // Communication
    'email': {
      to: '',
      subject: '',
      body: '',
      attachments: [],
    },
    'sms': {
      to: '',
      message: '',
    },
    'notification': {
      title: '',
      message: '',
      type: 'info',
      channels: [],
    },
    'slack': {
      channel: '',
      message: '',
      attachments: [],
    },
    'teams': {
      channel: '',
      message: '',
      attachments: [],
    },
    'webhook-response': {
      statusCode: 200,
      headers: {},
      body: '',
    },

    // AI/ML
    'ai-model': {
      model: '',
      prompt: '',
      temperature: 0.7,
    },
    'text-generation': {
      model: 'gpt-3.5-turbo',
      prompt: '',
      maxTokens: 1000,
      temperature: 0.7,
    },
    'image-processing': {
      operation: 'analyze',
      model: '',
      imageUrl: '',
    },
    'classification': {
      model: '',
      labels: [],
      confidence: 0.8,
    },
    'sentiment-analysis': {
      model: '',
      text: '',
      language: 'en',
    },

    // n8n Integration
    'n8n.trigger': {
      workflowId: '',
      parameters: {},
      outputVariable: 'n8nResult',
      timeout: 30000,
    },
    'n8n.template': {
      templateId: '',
      convertToNodes: true,
      outputVariable: 'importedNodes',
    },

    // Database & Storage
    'database': {
      operation: 'select',
      table: '',
      query: '',
    },
    'file-system': {
      operation: 'read',
      path: '',
    },
    's3-storage': {
      operation: 'upload',
      bucket: '',
      key: '',
      region: 'us-east-1',
    },
    'redis': {
      operation: 'get',
      key: '',
      value: '',
    },
    'mongodb': {
      operation: 'find',
      collection: '',
      query: {},
    },
    'postgresql': {
      operation: 'select',
      table: '',
      query: '',
    },

    // Business Logic
    'action': {
      actionType: 'custom',
      timeout: 30000,
      retryCount: 3,
    },
    'script': {
      language: 'javascript',
      code: '',
      timeout: 30000,
    },
    'function-call': {
      functionName: '',
      parameters: {},
    },
    'business-rule': {
      ruleName: '',
      conditions: [],
      actions: [],
    },
    'validation-rule': {
      field: '',
      rule: '',
      message: '',
    },

    // Advanced
    'custom': {},
    'sub-workflow': {
      workflowId: '',
      inputs: {},
    },
    'error-handler': {
      catchType: 'all',
      retryCount: 3,
      fallbackAction: '',
    },
  };
  return defaultProps[nodeType] || {};
}

function getCategoryForNodeType(nodeType: NodeType): string {
  const categoryMap: Record<string, NodeType[]> = {
    'flow-control': ['start', 'end', 'decision', 'condition', 'switch', 'loop', 'parallel', 'merge', 'wait', 'delay', 'timer', 'split'],
    'data-processing': ['data-transform', 'filter', 'sort', 'aggregate', 'join', 'split-data', 'data-validation'],
    'integration': ['api-call', 'webhook', 'http-request', 'graphql', 'websocket', 'rest-api', 'n8n.trigger', 'n8n.template'],
    'communication': ['email', 'sms', 'notification', 'slack', 'teams', 'webhook-response'],
    'ai-ml': ['ai-model', 'text-generation', 'image-processing', 'classification', 'sentiment-analysis'],
    'database-storage': ['database', 'file-system', 's3-storage', 'redis', 'mongodb', 'postgresql'],
    'business-logic': ['action', 'script', 'function-call', 'business-rule', 'validation-rule'],
    'advanced': ['custom', 'sub-workflow', 'error-handler'],
  };

  for (const [category, types] of Object.entries(categoryMap)) {
    if (types.includes(nodeType)) {
      return category;
    }
  }
  return 'custom';
}
