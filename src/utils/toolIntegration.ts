// Tool Integration System for Workflow Studio
import { StudioNode, NodeData, PropertyType } from '../types/studio.js';

// Tool Definition Interface
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, any>) => Promise<any>;
  validate?: (params: Record<string, any>) => { valid: boolean; errors: string[] };
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: { value: any; label: string }[];
  schema?: any; // JSON schema for complex objects
}

// Tool Execution Context
export interface ToolExecutionContext {
  workflowId: string;
  nodeId: string;
  executionId: string;
  variables: Record<string, any>;
  previousResults: Record<string, any>;
}

// Tool Registry
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  unregisterTool(id: string): void {
    this.tools.delete(id);
  }

  getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(category: string): ToolDefinition[] {
    return this.getAllTools().filter(tool => tool.category === category);
  }

  searchTools(query: string): ToolDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllTools().filter(tool =>
      tool.name.toLowerCase().includes(lowercaseQuery) ||
      tool.description.toLowerCase().includes(lowercaseQuery) ||
      tool.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  async executeTool(
    toolId: string,
    params: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<any> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    // Validate parameters
    if (tool.validate) {
      const validation = tool.validate(params);
      if (!validation.valid) {
        throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
      }
    }

    try {
      return await tool.execute(params);
    } catch (error) {
      console.error(`Tool execution failed for ${toolId}:`, error);
      throw error;
    }
  }
}

// Tool Node Factory
export class ToolNodeFactory {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  createToolNode(
    toolId: string,
    position: { x: number; y: number },
    customConfig?: Partial<NodeData>
  ): Omit<StudioNode, 'id' | 'selected' | 'dragging' | 'resizing'> {
    const tool = this.registry.getTool(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    return {
      type: 'tool-execution',
      position,
      size: { width: 140, height: 70 },
      data: {
        label: tool.name,
        description: tool.description,
        icon: tool.icon,
        category: 'tool-integration',
        properties: {
          toolId,
          parameters: tool.parameters.reduce((acc, param) => {
            acc[param.name] = param.defaultValue || null;
            return acc;
          }, {} as Record<string, any>),
        },
        propertyDefinitions: tool.parameters.map(param => ({
          key: param.name,
          label: param.label,
          type: param.type as PropertyType,
          description: param.description,
          required: param.required,
          defaultValue: param.defaultValue,
          options: param.options,
          validation: param.schema,
        })),
        ...customConfig,
      },
      style: {
        backgroundColor: 0x6366f1,
        borderColor: 0x4f46e5,
        borderWidth: 2,
        borderRadius: 8,
        textColor: 0xffffff,
        fontSize: 12,
        fontWeight: 'normal',
        shadow: true,
        opacity: 1,
      },
    };
  }

  getAvailableToolNodes(): Array<{
    toolId: string;
    name: string;
    category: string;
    nodeTemplate: Omit<StudioNode, 'id' | 'selected' | 'dragging' | 'resizing'>;
  }> {
    return this.registry.getAllTools().map(tool => ({
      toolId: tool.id,
      name: tool.name,
      category: tool.category,
      nodeTemplate: this.createToolNode(tool.id, { x: 0, y: 0 }),
    }));
  }
}

// Built-in Tool Definitions

// File System Tools
export const createFileSystemTools = (): ToolDefinition[] => [
  {
    id: 'read-file',
    name: 'Read File',
    description: 'Read the contents of a file from the file system',
    category: 'file-system',
    icon: '📄',
    parameters: [
      {
        name: 'filePath',
        type: 'string',
        label: 'File Path',
        description: 'Absolute path to the file to read',
        required: true,
      },
      {
        name: 'encoding',
        type: 'string',
        label: 'Encoding',
        defaultValue: 'utf8',
        options: [
          { value: 'utf8', label: 'UTF-8' },
          { value: 'ascii', label: 'ASCII' },
          { value: 'base64', label: 'Base64' },
        ],
      },
    ],
    execute: async (params) => {
      // This would integrate with the actual file system API
      // For now, return a mock response
      return {
        content: `Mock content of ${params.filePath}`,
        encoding: params.encoding,
        size: 1024,
      };
    },
  },
  {
    id: 'write-file',
    name: 'Write File',
    description: 'Write content to a file on the file system',
    category: 'file-system',
    icon: '✏️',
    parameters: [
      {
        name: 'filePath',
        type: 'string',
        label: 'File Path',
        description: 'Absolute path where to write the file',
        required: true,
      },
      {
        name: 'content',
        type: 'string',
        label: 'Content',
        description: 'Content to write to the file',
        required: true,
      },
      {
        name: 'encoding',
        type: 'string',
        label: 'Encoding',
        defaultValue: 'utf8',
      },
    ],
    execute: async (params) => {
      // Mock file write operation
      return {
        success: true,
        filePath: params.filePath,
        bytesWritten: params.content.length,
      };
    },
  },
  {
    id: 'list-directory',
    name: 'List Directory',
    description: 'List contents of a directory',
    category: 'file-system',
    icon: '📁',
    parameters: [
      {
        name: 'directoryPath',
        type: 'string',
        label: 'Directory Path',
        description: 'Path to the directory to list',
        required: true,
      },
      {
        name: 'recursive',
        type: 'boolean',
        label: 'Recursive',
        description: 'Include subdirectories',
        defaultValue: false,
      },
    ],
    execute: async (params) => {
      // Mock directory listing
      return {
        path: params.directoryPath,
        items: [
          { name: 'file1.txt', type: 'file', size: 1024 },
          { name: 'file2.js', type: 'file', size: 2048 },
          { name: 'subdir', type: 'directory' },
        ],
      };
    },
  },
];

// HTTP/API Tools
export const createHttpTools = (): ToolDefinition[] => [
  {
    id: 'http-request',
    name: 'HTTP Request',
    description: 'Make an HTTP request to a web service',
    category: 'http',
    icon: '🌐',
    parameters: [
      {
        name: 'method',
        type: 'string',
        label: 'HTTP Method',
        required: true,
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'DELETE', label: 'DELETE' },
          { value: 'PATCH', label: 'PATCH' },
        ],
      },
      {
        name: 'url',
        type: 'string',
        label: 'URL',
        description: 'The URL to make the request to',
        required: true,
      },
      {
        name: 'headers',
        type: 'object',
        label: 'Headers',
        description: 'HTTP headers as key-value pairs',
        schema: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      {
        name: 'body',
        type: 'string',
        label: 'Request Body',
        description: 'Request body (for POST/PUT/PATCH)',
      },
      {
        name: 'timeout',
        type: 'number',
        label: 'Timeout (ms)',
        defaultValue: 30000,
      },
    ],
    execute: async (params) => {
      // Mock HTTP request
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { message: 'Mock API response' },
        responseTime: 150,
      };
    },
  },
  {
    id: 'webhook-trigger',
    name: 'Webhook Trigger',
    description: 'Trigger a webhook with custom payload',
    category: 'http',
    icon: '🪝',
    parameters: [
      {
        name: 'webhookUrl',
        type: 'string',
        label: 'Webhook URL',
        required: true,
      },
      {
        name: 'payload',
        type: 'object',
        label: 'Payload',
        description: 'Data to send in the webhook',
        required: true,
      },
      {
        name: 'method',
        type: 'string',
        label: 'HTTP Method',
        defaultValue: 'POST',
        options: [
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
        ],
      },
    ],
    execute: async (params) => {
      // Mock webhook trigger
      return {
        success: true,
        webhookUrl: params.webhookUrl,
        status: 200,
        response: { received: true, timestamp: new Date().toISOString() },
      };
    },
  },
];

// Data Processing Tools
export const createDataProcessingTools = (): ToolDefinition[] => [
  {
    id: 'json-transform',
    name: 'JSON Transform',
    description: 'Transform JSON data using JSONPath or custom logic',
    category: 'data-processing',
    icon: '🔄',
    parameters: [
      {
        name: 'input',
        type: 'object',
        label: 'Input Data',
        description: 'JSON data to transform',
        required: true,
      },
      {
        name: 'transformation',
        type: 'string',
        label: 'Transformation',
        description: 'JSONPath expression or transformation logic',
        required: true,
      },
      {
        name: 'outputFormat',
        type: 'string',
        label: 'Output Format',
        options: [
          { value: 'json', label: 'JSON' },
          { value: 'xml', label: 'XML' },
          { value: 'csv', label: 'CSV' },
        ],
        defaultValue: 'json',
      },
    ],
    execute: async (params) => {
      // Mock JSON transformation
      return {
        original: params.input,
        transformed: { ...params.input, transformed: true, timestamp: new Date().toISOString() },
        format: params.outputFormat,
      };
    },
  },
  {
    id: 'data-validation',
    name: 'Data Validation',
    description: 'Validate data against a schema or custom rules',
    category: 'data-processing',
    icon: '✅',
    parameters: [
      {
        name: 'data',
        type: 'object',
        label: 'Data to Validate',
        required: true,
      },
      {
        name: 'schema',
        type: 'object',
        label: 'Validation Schema',
        description: 'JSON schema for validation',
        required: true,
      },
      {
        name: 'strictMode',
        type: 'boolean',
        label: 'Strict Mode',
        description: 'Fail on any validation error',
        defaultValue: true,
      },
    ],
    execute: async (params) => {
      // Mock data validation
      return {
        valid: true,
        errors: [],
        warnings: [],
        validatedAt: new Date().toISOString(),
      };
    },
  },
];

// AI/ML Tools
export const createAITools = (): ToolDefinition[] => [
  {
    id: 'text-analysis',
    name: 'Text Analysis',
    description: 'Analyze text using natural language processing',
    category: 'ai-ml',
    icon: '📝',
    parameters: [
      {
        name: 'text',
        type: 'string',
        label: 'Text to Analyze',
        required: true,
      },
      {
        name: 'analysisType',
        type: 'string',
        label: 'Analysis Type',
        options: [
          { value: 'sentiment', label: 'Sentiment Analysis' },
          { value: 'entities', label: 'Entity Recognition' },
          { value: 'keywords', label: 'Keyword Extraction' },
          { value: 'summary', label: 'Text Summarization' },
        ],
        defaultValue: 'sentiment',
      },
      {
        name: 'language',
        type: 'string',
        label: 'Language',
        defaultValue: 'en',
      },
    ],
    execute: async (params) => {
      // Mock AI analysis
      return {
        analysisType: params.analysisType,
        result: {
          sentiment: params.analysisType === 'sentiment' ? 'positive' : undefined,
          entities: params.analysisType === 'entities' ? ['entity1', 'entity2'] : undefined,
          keywords: params.analysisType === 'keywords' ? ['keyword1', 'keyword2'] : undefined,
          summary: params.analysisType === 'summary' ? 'Mock summary of the text' : undefined,
        },
        confidence: 0.85,
        processingTime: 200,
      };
    },
  },
  {
    id: 'image-processing',
    name: 'Image Processing',
    description: 'Process and analyze images',
    category: 'ai-ml',
    icon: '🖼️',
    parameters: [
      {
        name: 'imageUrl',
        type: 'string',
        label: 'Image URL',
        description: 'URL of the image to process',
        required: true,
      },
      {
        name: 'operations',
        type: 'array',
        label: 'Operations',
        description: 'Image processing operations to perform',
        defaultValue: ['analyze'],
      },
    ],
    execute: async (params) => {
      // Mock image processing
      return {
        imageUrl: params.imageUrl,
        operations: params.operations,
        results: {
          dimensions: { width: 1920, height: 1080 },
          format: 'jpeg',
          analysis: {
            objects: ['person', 'car'],
            colors: ['red', 'blue'],
            text: 'Sample text detected',
          },
        },
        processingTime: 500,
      };
    },
  },
];

// Global Tool Registry Instance
export const globalToolRegistry = new ToolRegistry();

// Register built-in tools
const allTools = [
  ...createFileSystemTools(),
  ...createHttpTools(),
  ...createDataProcessingTools(),
  ...createAITools(),
];

allTools.forEach(tool => globalToolRegistry.registerTool(tool));

// Tool Node Factory Instance
export const toolNodeFactory = new ToolNodeFactory(globalToolRegistry);

// Workflow Tool Integration
export class WorkflowToolExecutor {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  async executeWorkflowTool(
    toolId: string,
    parameters: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<any> {
    return this.registry.executeTool(toolId, parameters, context);
  }

  async executeNodeTools(
    nodes: StudioNode[],
    context: ToolExecutionContext
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const node of nodes) {
      if (node.data.category === 'tool-integration' && node.data.properties?.toolId) {
        try {
          const toolResult = await this.executeWorkflowTool(
            node.data.properties.toolId,
            node.data.properties.parameters || {},
            { ...context, nodeId: node.id }
          );
          results[node.id] = toolResult;
        } catch (error) {
          results[node.id] = { error: error instanceof Error ? error.message : String(error) };
        }
      }
    }

    return results;
  }
}

export const workflowToolExecutor = new WorkflowToolExecutor(globalToolRegistry);
