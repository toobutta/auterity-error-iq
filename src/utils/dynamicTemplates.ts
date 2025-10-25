// Dynamic Template System for Workflow Studio
import { NodeTemplate, TemplateCategory, StudioNode, Connection } from '../types/studio.js';

// Template Generator Interface
export interface TemplateGenerator {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  parameters: TemplateParameter[];
  generate: (params: Record<string, any>) => NodeTemplate;
}

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: any;
  options?: { value: any; label: string }[];
  validation?: (value: any) => boolean | string;
}

// Dynamic Template Registry
export class DynamicTemplateRegistry {
  private generators = new Map<string, TemplateGenerator>();
  private templates = new Map<string, NodeTemplate>();

  registerGenerator(generator: TemplateGenerator): void {
    this.generators.set(generator.id, generator);
  }

  unregisterGenerator(id: string): void {
    this.generators.delete(id);
  }

  getGenerator(id: string): TemplateGenerator | undefined {
    return this.generators.get(id);
  }

  getAllGenerators(): TemplateGenerator[] {
    return Array.from(this.generators.values());
  }

  getGeneratorsByCategory(category: TemplateCategory): TemplateGenerator[] {
    return this.getAllGenerators().filter(gen => gen.category === category);
  }

  generateTemplate(generatorId: string, params: Record<string, any>): NodeTemplate | null {
    const generator = this.generators.get(generatorId);
    if (!generator) return null;

    try {
      return generator.generate(params);
    } catch (error) {
      console.error(`Failed to generate template ${generatorId}:`, error);
      return null;
    }
  }

  registerTemplate(template: NodeTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): NodeTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): NodeTemplate[] {
    return Array.from(this.templates.values());
  }

  searchTemplates(query: string): NodeTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllTemplates().filter(template =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
}

// Template Builder Utilities
export class TemplateBuilder {
  private nodes: Omit<StudioNode, 'id' | 'selected' | 'dragging' | 'resizing'>[] = [];
  private connections: Omit<Connection, 'id' | 'selected'>[] = [];
  private nodeCounter = 0;

  addNode(node: Omit<StudioNode, 'id' | 'selected' | 'dragging' | 'resizing'>): string {
    const nodeId = `node_${this.nodeCounter++}`;
    this.nodes.push(node);
    return nodeId;
  }

  addConnection(sourceId: string, targetId: string, options?: {
    sourceHandle?: string;
    targetHandle?: string;
    label?: string;
    style?: any;
  }): void {
    this.connections.push({
      sourceId,
      targetId,
      sourceHandle: options?.sourceHandle || 'output',
      targetHandle: options?.targetHandle || 'input',
      label: options?.label,
      style: options?.style || {
        color: 0x3b82f6,
        width: 2,
        opacity: 1,
        animated: false,
        dashed: false,
        arrowSize: 6,
      },
    });
  }

  build(): {
    nodes: Omit<StudioNode, 'id' | 'selected' | 'dragging' | 'resizing'>[];
    connections: Omit<Connection, 'id' | 'selected'>[];
  } {
    return {
      nodes: [...this.nodes],
      connections: [...this.connections],
    };
  }

  reset(): void {
    this.nodes = [];
    this.connections = [];
    this.nodeCounter = 0;
  }
}

// Pre-built Template Generators
export const createApiIntegrationGenerator = (): TemplateGenerator => ({
  id: 'api-integration',
  name: 'API Integration Workflow',
  description: 'Generate a workflow for integrating with external APIs',
  category: 'integration',
  parameters: [
    {
      name: 'apiName',
      type: 'string',
      label: 'API Name',
      description: 'Name of the API to integrate with',
      required: true,
    },
    {
      name: 'method',
      type: 'select',
      label: 'HTTP Method',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
      ],
      defaultValue: 'GET',
    },
    {
      name: 'includeAuth',
      type: 'boolean',
      label: 'Include Authentication',
      defaultValue: false,
    },
    {
      name: 'includeErrorHandling',
      type: 'boolean',
      label: 'Include Error Handling',
      defaultValue: true,
    },
  ],
  generate: (params) => {
    const builder = new TemplateBuilder();

    // Start node
    const startNode = builder.addNode({
      type: 'start',
      position: { x: 100, y: 100 },
      size: { width: 120, height: 60 },
      data: {
        label: 'Start',
        category: 'flow-control',
        properties: {},
      },
      style: {
        backgroundColor: 0x10b981,
        borderColor: 0x059669,
        borderWidth: 2,
        borderRadius: 20,
        textColor: 0xffffff,
        fontSize: 14,
        fontWeight: 'bold',
        shadow: true,
        opacity: 1,
      },
    });

    // API Call node
    const apiNode = builder.addNode({
      type: 'api-call',
      position: { x: 300, y: 100 },
      size: { width: 120, height: 60 },
      data: {
        label: `${params.method} ${params.apiName}`,
        category: 'integration',
        properties: {
          method: params.method,
          url: `https://api.${params.apiName.toLowerCase()}.com/v1/endpoint`,
          headers: params.includeAuth ? { 'Authorization': 'Bearer {{token}}' } : {},
        },
      },
      style: {
        backgroundColor: 0x3b82f6,
        borderColor: 0x2563eb,
        borderWidth: 2,
        borderRadius: 8,
        textColor: 0xffffff,
        fontSize: 14,
        fontWeight: 'normal',
        shadow: true,
        opacity: 1,
      },
    });

    // Decision node for error handling
    let decisionNode: string | undefined;
    if (params.includeErrorHandling) {
      decisionNode = builder.addNode({
        type: 'decision',
        position: { x: 500, y: 100 },
        size: { width: 120, height: 60 },
        data: {
          label: 'Check Response',
          category: 'flow-control',
          properties: {
            condition: 'response.statusCode >= 200 && response.statusCode < 300',
          },
        },
        style: {
          backgroundColor: 0xf59e0b,
          borderColor: 0xd97706,
          borderWidth: 2,
          borderRadius: 8,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'normal',
          shadow: true,
          opacity: 1,
        },
      });

      // Success and error handling nodes
      const successNode = builder.addNode({
        type: 'data-transform',
        position: { x: 700, y: 50 },
        size: { width: 120, height: 60 },
        data: {
          label: 'Process Response',
          category: 'data-processing',
          properties: {},
        },
        style: {
          backgroundColor: 0x10b981,
          borderColor: 0x059669,
          borderWidth: 2,
          borderRadius: 8,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'normal',
          shadow: true,
          opacity: 1,
        },
      });

      const errorNode = builder.addNode({
        type: 'notification',
        position: { x: 700, y: 150 },
        size: { width: 120, height: 60 },
        data: {
          label: 'Send Error Alert',
          category: 'communication',
          properties: {
            message: `API call to ${params.apiName} failed`,
          },
        },
        style: {
          backgroundColor: 0xef4444,
          borderColor: 0xdc2626,
          borderWidth: 2,
          borderRadius: 8,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'normal',
          shadow: true,
          opacity: 1,
        },
      });

      // End node
      const endNode = builder.addNode({
        type: 'end',
        position: { x: 900, y: 100 },
        size: { width: 120, height: 60 },
        data: {
          label: 'End',
          category: 'flow-control',
          properties: {},
        },
        style: {
          backgroundColor: 0x64748b,
          borderColor: 0x475569,
          borderWidth: 2,
          borderRadius: 20,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'bold',
          shadow: true,
          opacity: 1,
        },
      });

      // Connect nodes
      builder.addConnection(startNode, apiNode);
      builder.addConnection(apiNode, decisionNode!);
      builder.addConnection(decisionNode!, successNode, { label: 'Success' });
      builder.addConnection(decisionNode!, errorNode, { label: 'Error' });
      builder.addConnection(successNode, endNode);
      builder.addConnection(errorNode, endNode);
    } else {
      // Simple flow without error handling
      const processNode = builder.addNode({
        type: 'data-transform',
        position: { x: 500, y: 100 },
        size: { width: 120, height: 60 },
        data: {
          label: 'Process Response',
          category: 'data-processing',
          properties: {},
        },
        style: {
          backgroundColor: 0x10b981,
          borderColor: 0x059669,
          borderWidth: 2,
          borderRadius: 8,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'normal',
          shadow: true,
          opacity: 1,
        },
      });

      const endNode = builder.addNode({
        type: 'end',
        position: { x: 700, y: 100 },
        size: { width: 120, height: 60 },
        data: {
          label: 'End',
          category: 'flow-control',
          properties: {},
        },
        style: {
          backgroundColor: 0x64748b,
          borderColor: 0x475569,
          borderWidth: 2,
          borderRadius: 20,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'bold',
          shadow: true,
          opacity: 1,
        },
      });

      builder.addConnection(startNode, apiNode);
      builder.addConnection(apiNode, processNode);
      builder.addConnection(processNode, endNode);
    }

    const { nodes, connections } = builder.build();

    return {
      id: `api-integration-${Date.now()}`,
      name: `${params.apiName} Integration`,
      description: `Generated workflow for integrating with ${params.apiName} API`,
      category: 'integration',
      icon: '🔗',
      tags: ['api', 'integration', params.apiName.toLowerCase()],
      nodes,
      connections,
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Dynamic Generator',
      version: '1.0.0',
    };
  },
});

export const createDataPipelineGenerator = (): TemplateGenerator => ({
  id: 'data-pipeline',
  name: 'Data Pipeline Workflow',
  description: 'Generate a data processing pipeline with configurable stages',
  category: 'data-pipeline',
  parameters: [
    {
      name: 'pipelineName',
      type: 'string',
      label: 'Pipeline Name',
      required: true,
    },
    {
      name: 'stages',
      type: 'multiselect',
      label: 'Processing Stages',
      options: [
        { value: 'extract', label: 'Data Extraction' },
        { value: 'transform', label: 'Data Transformation' },
        { value: 'validate', label: 'Data Validation' },
        { value: 'load', label: 'Data Loading' },
        { value: 'monitor', label: 'Monitoring' },
      ],
      defaultValue: ['extract', 'transform', 'load'],
    },
    {
      name: 'dataSource',
      type: 'select',
      label: 'Data Source',
      options: [
        { value: 'database', label: 'Database' },
        { value: 'api', label: 'API' },
        { value: 'file', label: 'File' },
        { value: 'stream', label: 'Stream' },
      ],
      defaultValue: 'database',
    },
  ],
  generate: (params) => {
    const builder = new TemplateBuilder();
    const stages = params.stages || ['extract', 'transform', 'load'];

    let x = 100;
    const y = 100;
    const nodeSpacing = 200;

    // Start node
    const startNode = builder.addNode({
      type: 'start',
      position: { x, y },
      size: { width: 120, height: 60 },
      data: {
        label: 'Start Pipeline',
        category: 'flow-control',
        properties: {},
      },
      style: {
        backgroundColor: 0x10b981,
        borderColor: 0x059669,
        borderWidth: 2,
        borderRadius: 20,
        textColor: 0xffffff,
        fontSize: 14,
        fontWeight: 'bold',
        shadow: true,
        opacity: 1,
      },
    });

    let previousNode = startNode;
    const createdNodes: string[] = [startNode];

    // Add stages based on selection
    if (stages.includes('extract')) {
      x += nodeSpacing;
      const extractNode = builder.addNode({
        type: 'data-transform',
        position: { x, y },
        size: { width: 120, height: 60 },
        data: {
          label: 'Extract Data',
          category: 'data-processing',
          properties: {
            source: params.dataSource,
            query: 'SELECT * FROM source_table',
          },
        },
        style: {
          backgroundColor: 0x3b82f6,
          borderColor: 0x2563eb,
          borderWidth: 2,
          borderRadius: 8,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'normal',
          shadow: true,
          opacity: 1,
        },
      });
      builder.addConnection(previousNode, extractNode);
      previousNode = extractNode;
      createdNodes.push(extractNode);
    }

    if (stages.includes('transform')) {
      x += nodeSpacing;
      const transformNode = builder.addNode({
        type: 'data-transform',
        position: { x, y },
        size: { width: 120, height: 60 },
        data: {
          label: 'Transform Data',
          category: 'data-processing',
          properties: {
            operations: ['clean', 'normalize', 'aggregate'],
          },
        },
        style: {
          backgroundColor: 0x8b5cf6,
          borderColor: 0x7c3aed,
          borderWidth: 2,
          borderRadius: 8,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'normal',
          shadow: true,
          opacity: 1,
        },
      });
      builder.addConnection(previousNode, transformNode);
      previousNode = transformNode;
      createdNodes.push(transformNode);
    }

    if (stages.includes('validate')) {
      x += nodeSpacing;
      const validateNode = builder.addNode({
        type: 'data-validation',
        position: { x, y },
        size: { width: 120, height: 60 },
        data: {
          label: 'Validate Data',
          category: 'data-processing',
          properties: {
            rules: ['not-null', 'range-check', 'format-validation'],
          },
        },
        style: {
          backgroundColor: 0xf59e0b,
          borderColor: 0xd97706,
          borderWidth: 2,
          borderRadius: 8,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'normal',
          shadow: true,
          opacity: 1,
        },
      });
      builder.addConnection(previousNode, validateNode);
      previousNode = validateNode;
      createdNodes.push(validateNode);
    }

    if (stages.includes('load')) {
      x += nodeSpacing;
      const loadNode = builder.addNode({
        type: 'data-transform',
        position: { x, y },
        size: { width: 120, height: 60 },
        data: {
          label: 'Load Data',
          category: 'data-processing',
          properties: {
            destination: 'target_database',
            mode: 'upsert',
          },
        },
        style: {
          backgroundColor: 0x10b981,
          borderColor: 0x059669,
          borderWidth: 2,
          borderRadius: 8,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'normal',
          shadow: true,
          opacity: 1,
        },
      });
      builder.addConnection(previousNode, loadNode);
      previousNode = loadNode;
      createdNodes.push(loadNode);
    }

    if (stages.includes('monitor')) {
      x += nodeSpacing;
      const monitorNode = builder.addNode({
        type: 'api-call',
        position: { x, y },
        size: { width: 120, height: 60 },
        data: {
          label: 'Monitor Pipeline',
          category: 'monitoring',
          properties: {
            metrics: ['processing_time', 'error_rate', 'throughput'],
          },
        },
        style: {
          backgroundColor: 0x64748b,
          borderColor: 0x475569,
          borderWidth: 2,
          borderRadius: 8,
          textColor: 0xffffff,
          fontSize: 14,
          fontWeight: 'normal',
          shadow: true,
          opacity: 1,
        },
      });
      builder.addConnection(previousNode, monitorNode);
      previousNode = monitorNode;
      createdNodes.push(monitorNode);
    }

    // End node
    x += nodeSpacing;
    const endNode = builder.addNode({
      type: 'end',
      position: { x, y },
      size: { width: 120, height: 60 },
      data: {
        label: 'Pipeline Complete',
        category: 'flow-control',
        properties: {},
      },
      style: {
        backgroundColor: 0x64748b,
        borderColor: 0x475569,
        borderWidth: 2,
        borderRadius: 20,
        textColor: 0xffffff,
        fontSize: 14,
        fontWeight: 'bold',
        shadow: true,
        opacity: 1,
      },
    });
    builder.addConnection(previousNode, endNode);

    const { nodes, connections } = builder.build();

    return {
      id: `data-pipeline-${Date.now()}`,
      name: params.pipelineName,
      description: `Generated data pipeline with stages: ${stages.join(', ')}`,
      category: 'data-pipeline',
      icon: '🔄',
      tags: ['data', 'pipeline', ...stages],
      nodes,
      connections,
      viewport: { x: 0, y: 0, zoom: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Dynamic Generator',
      version: '1.0.0',
    };
  },
});

// Global registry instance
export const dynamicTemplateRegistry = new DynamicTemplateRegistry();

// Register built-in generators
dynamicTemplateRegistry.registerGenerator(createApiIntegrationGenerator());
dynamicTemplateRegistry.registerGenerator(createDataPipelineGenerator());
