/**
 * AI-Powered Template Generator
 *
 * Leverages Vercel AI SDK patterns to generate deployable workflow templates
 * Creates customer-ready templates based on Vercel cookbook recipes
 */

import { generateText, generateObject, streamText, tool, CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Template generation schemas based on Vercel patterns
const VercelTemplateSchema = z.object({
  name: z.string(),
  description: z.string(),
  framework: z.enum(['nextjs', 'svelte', 'vue', 'react']),
  aiFeatures: z.array(z.string()),
  deployment: z.object({
    platform: z.enum(['vercel', 'netlify', 'railway']),
    aiGateway: z.boolean(),
    edgeFunctions: z.boolean()
  }),
  components: z.array(z.object({
    name: z.string(),
    type: z.enum(['chatbot', 'rag', 'tools', 'streaming', 'generative-ui']),
    aiSdkPattern: z.string(),
    implementation: z.string()
  })),
  apiRoutes: z.array(z.object({
    path: z.string(),
    method: z.string(),
    aiFunction: z.string(),
    description: z.string()
  })),
  environment: z.record(z.string(), z.string()),
  dependencies: z.record(z.string(), z.string())
});

const WorkflowTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['chatbot', 'rag', 'automation', 'data-processing', 'custom']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedTime: z.number(),
  vercelTemplate: VercelTemplateSchema,
  workflowSteps: z.array(z.object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    config: z.record(z.any()),
    position: z.object({ x: z.number(), y: z.number() })
  })),
  connections: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    label: z.string().optional()
  })),
  customizationOptions: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'select', 'boolean', 'number']),
    required: z.boolean(),
    default: z.any(),
    description: z.string()
  }))
});

export class TemplateGenerator {
  private vercelPatterns: Map<string, any> = new Map();

  constructor() {
    this.initializeVercelPatterns();
  }

  private initializeVercelPatterns() {
    // Vercel AI SDK Cookbook Patterns
    this.vercelPatterns.set('chatbot', {
      components: ['useChat', 'MessageList', 'ChatInput'],
      apiRoutes: ['/api/chat'],
      aiSdkPattern: 'useChat',
      dependencies: {
        '@ai-sdk/react': '^2.0.28',
        'ai': '^5.0.28'
      }
    });

    this.vercelPatterns.set('rag', {
      components: ['DocumentUpload', 'SearchInterface', 'ResultsDisplay'],
      apiRoutes: ['/api/embeddings', '/api/search'],
      aiSdkPattern: 'generateEmbeddings + similarity search',
      dependencies: {
        '@ai-sdk/openai': '^2.0.23',
        'langchain': '^0.3.31'
      }
    });

    this.vercelPatterns.set('streaming', {
      components: ['StreamingText', 'ProgressIndicator'],
      apiRoutes: ['/api/stream-text'],
      aiSdkPattern: 'streamText',
      dependencies: {
        '@ai-sdk/react': '^2.0.28'
      }
    });

    this.vercelPatterns.set('generative-ui', {
      components: ['GenerativeCanvas', 'DynamicComponents'],
      apiRoutes: ['/api/generate-ui'],
      aiSdkPattern: 'streamUI',
      dependencies: {
        '@ai-sdk/react': '^2.0.28',
        'react': '^18.2.0'
      }
    });

    this.vercelPatterns.set('tools', {
      components: ['ToolSelector', 'ToolResults'],
      apiRoutes: ['/api/tools'],
      aiSdkPattern: 'tool calling',
      dependencies: {
        'ai': '^5.0.28',
        'zod': '^4.1.5'
      }
    });
  }

  /**
   * Generate a complete workflow template from natural language
   */
  async generateTemplateFromDescription(
    description: string,
    category: string = 'custom'
  ): Promise<z.infer<typeof WorkflowTemplateSchema>> {
    const templateSpec = await this.analyzeDescription(description);
    const vercelTemplate = await this.createVercelTemplate(templateSpec);
    const workflowStructure = await this.generateWorkflowStructure(templateSpec);

    return {
      id: `template-${Date.now()}`,
      name: templateSpec.name,
      description: templateSpec.description,
      category: category as any,
      difficulty: templateSpec.difficulty,
      estimatedTime: templateSpec.estimatedTime,
      vercelTemplate,
      workflowSteps: workflowStructure.steps,
      connections: workflowStructure.connections,
      customizationOptions: templateSpec.customizationOptions
    };
  }

  /**
   * Create Vercel-optimized template using AI SDK patterns
   */
  async createVercelTemplate(spec: any): Promise<z.infer<typeof VercelTemplateSchema>> {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `You are an expert in Vercel AI SDK patterns. Create a complete Vercel template
        that implements the requested functionality using best practices from the AI SDK cookbook.`
      },
      {
        role: 'user',
        content: `Create a Vercel template for: ${JSON.stringify(spec, null, 2)}

        Include:
        - Framework choice (Next.js preferred)
        - AI SDK components and patterns
        - API routes for AI functionality
        - Deployment configuration
        - Environment variables
        - Dependencies

        Use patterns from Vercel AI SDK cookbook.`
      }
    ];

    const result = await generateObject({
      model: openai('gpt-4'),
      schema: VercelTemplateSchema,
      messages
    });

    return result.object;
  }

  /**
   * Generate workflow structure from template spec
   */
  private async generateWorkflowStructure(spec: any) {
    // Create workflow nodes based on Vercel patterns
    const steps = [];
    const connections = [];

    // Add AI processing nodes based on patterns
    spec.aiPatterns.forEach((pattern: string, index: number) => {
      const patternConfig = this.vercelPatterns.get(pattern);

      if (patternConfig) {
        // Create input node
        steps.push({
          id: `input-${index}`,
          type: 'input',
          name: `${pattern} Input`,
          config: {},
          position: { x: 100, y: index * 150 + 100 }
        });

        // Create AI processing node
        steps.push({
          id: `ai-${pattern}-${index}`,
          type: 'ai_process',
          name: `${pattern} Processing`,
          config: {
            aiSdkPattern: patternConfig.aiSdkPattern,
            components: patternConfig.components,
            apiRoutes: patternConfig.apiRoutes
          },
          position: { x: 300, y: index * 150 + 100 }
        });

        // Create output node
        steps.push({
          id: `output-${index}`,
          type: 'output',
          name: `${pattern} Output`,
          config: {},
          position: { x: 500, y: index * 150 + 100 }
        });

        // Create connections
        connections.push(
          {
            id: `conn-input-${index}`,
            source: `input-${index}`,
            target: `ai-${pattern}-${index}`,
            label: 'Process'
          },
          {
            id: `conn-output-${index}`,
            source: `ai-${pattern}-${index}`,
            target: `output-${index}`,
            label: 'Result'
          }
        );
      }
    });

    return { steps, connections };
  }

  /**
   * Analyze natural language description to extract template requirements
   */
  private async analyzeDescription(description: string) {
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: `Analyze the description and extract:
        - Template name and description
        - Required AI patterns (chatbot, RAG, streaming, tools, etc.)
        - Difficulty level
        - Estimated implementation time
        - Customization options needed`
      },
      {
        role: 'user',
        content: `Analyze this template description: "${description}"`
      }
    ];

    const result = await generateObject({
      model: openai('gpt-4'),
      schema: z.object({
        name: z.string(),
        description: z.string(),
        aiPatterns: z.array(z.string()),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
        estimatedTime: z.number(),
        customizationOptions: z.array(z.any())
      }),
      messages
    });

    return result.object;
  }

  /**
   * Generate deployment-ready code for Vercel template
   */
  async generateVercelCode(template: z.infer<typeof VercelTemplateSchema>): Promise<string> {
    const code = await generateText({
      model: openai('gpt-4'),
      prompt: `Generate complete, deployment-ready code for this Vercel template:
      ${JSON.stringify(template, null, 2)}

      Include:
      - package.json with dependencies
      - API routes
      - React components
      - vercel.json configuration
      - Environment variables

      Use Vercel AI SDK patterns and best practices.`
    });

    return code.text;
  }

  /**
   * Create customer-customizable template with fillable options
   */
  async createCustomizableTemplate(
    baseTemplate: z.infer<typeof WorkflowTemplateSchema>,
    customerRequirements: any
  ): Promise<z.infer<typeof WorkflowTemplateSchema>> {
    // Customize template based on customer needs
    const customized = { ...baseTemplate };

    // Apply customer customizations
    if (customerRequirements.branding) {
      customized.vercelTemplate = await this.applyBranding(
        customized.vercelTemplate,
        customerRequirements.branding
      );
    }

    if (customerRequirements.integrations) {
      customized = await this.addIntegrations(
        customized,
        customerRequirements.integrations
      );
    }

    return customized;
  }

  /**
   * Apply customer branding to template
   */
  private async applyBranding(
    template: z.infer<typeof VercelTemplateSchema>,
    branding: any
  ): Promise<z.infer<typeof VercelTemplateSchema>> {
    const branded = { ...template };

    // Add branding customization options
    branded.customizationOptions = [
      {
        name: 'primaryColor',
        type: 'text' as const,
        required: false,
        default: branding.primaryColor || '#3b82f6',
        description: 'Primary brand color'
      },
      {
        name: 'logoUrl',
        type: 'text' as const,
        required: false,
        default: branding.logoUrl || '',
        description: 'Company logo URL'
      },
      {
        name: 'companyName',
        type: 'text' as const,
        required: false,
        default: branding.companyName || '',
        description: 'Company name for branding'
      }
    ];

    return branded;
  }

  /**
   * Add third-party integrations to template
   */
  private async addIntegrations(
    template: z.infer<typeof WorkflowTemplateSchema>,
    integrations: any[]
  ): Promise<z.infer<typeof WorkflowTemplateSchema>> {
    const enhanced = { ...template };

    integrations.forEach(integration => {
      // Add integration-specific workflow steps
      const integrationStep = {
        id: `integration-${integration.type}-${Date.now()}`,
        type: 'integration',
        name: `${integration.type} Integration`,
        config: {
          service: integration.service,
          action: integration.action,
          credentials: integration.credentials
        },
        position: { x: 600, y: enhanced.workflowSteps.length * 150 + 100 }
      };

      enhanced.workflowSteps.push(integrationStep);

      // Add connection from last step to integration
      const lastStep = enhanced.workflowSteps[enhanced.workflowSteps.length - 2];
      if (lastStep) {
        enhanced.connections.push({
          id: `conn-integration-${integration.type}`,
          source: lastStep.id,
          target: integrationStep.id,
          label: integration.action
        });
      }
    });

    return enhanced;
  }

  /**
   * Generate deployment package for customer
   */
  async generateDeploymentPackage(
    template: z.infer<typeof WorkflowTemplateSchema>
  ): Promise<{
    code: string;
    instructions: string;
    environment: Record<string, string>;
  }> {
    const code = await this.generateVercelCode(template.vercelTemplate);

    const instructions = await generateText({
      model: openai('gpt-4'),
      prompt: `Create deployment instructions for this Vercel template:
      ${JSON.stringify(template, null, 2)}

      Include:
      - Setup steps
      - Environment variable configuration
      - Deployment commands
      - Customization options
      - Testing instructions`
    });

    return {
      code,
      instructions: instructions.text,
      environment: template.vercelTemplate.environment
    };
  }

  /**
   * Get available Vercel patterns for template creation
   */
  getAvailablePatterns(): string[] {
    return Array.from(this.vercelPatterns.keys());
  }

  /**
   * Get pattern details for UI display
   */
  getPatternDetails(pattern: string): any {
    return this.vercelPatterns.get(pattern);
  }
}

// Export singleton instance
export const templateGenerator = new TemplateGenerator();
