/**
 * CrewAI Service Integration for Auterity Workflow Studio
 * Provides intelligent multi-agent collaborative systems
 */

import { z } from 'zod';

// Types for CrewAI integration
export interface AgentCapability {
  name: string;
  description: string;
  parameters?: Record<string, any>;
  required_tools?: string[];
  cost_per_use?: number;
  success_rate?: number;
}

export interface AgentRole {
  name: string;
  description: string;
  capabilities?: AgentCapability[];
  expertise_areas?: string[];
  collaboration_patterns?: string[];
  priority_level?: number;
}

export interface CrewAgent {
  id: string;
  name: string;
  role: AgentRole;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  memory_size?: number;
  current_task?: string;
  performance_score?: number;
  status?: 'idle' | 'busy' | 'error';
  collaboration_history?: Array<{
    task_id: string;
    result: 'success' | 'failure';
    timestamp: Date;
  }>;
}

export interface Task {
  id: string;
  description: string;
  assigned_agent?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority?: number;
  dependencies?: string[];
  estimated_duration?: number;
  actual_duration?: number;
  result?: any;
  error?: string;
  context?: Record<string, any>;
  created_at?: Date;
  completed_at?: Date;
}

export interface Crew {
  id: string;
  name: string;
  description: string;
  agents?: CrewAgent[];
  tasks?: Task[];
  goal?: string;
  status?: 'initialized' | 'active' | 'completed' | 'failed';
  collaboration_strategy?: 'hierarchical' | 'democratic' | 'swarm';
  max_concurrent_tasks?: number;
  created_at?: Date;
  completed_at?: Date;
  performance_metrics?: Record<string, any>;
}

export interface CollaborationResult {
  crew_id: string;
  execution_id: string;
  status: 'completed' | 'failed' | 'partial_success';
  result?: any;
  error?: string;
  execution_time: number;
  task_results?: Array<{
    task_id: string;
    agent_id: string;
    result?: any;
    duration?: number;
    execution_mode?: string;
  }>;
  collaboration_metrics?: Record<string, any>;
  agent_performance?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CrewMetrics {
  total_crews: number;
  active_crews: number;
  completed_crews: number;
  failed_crews: number;
  total_agents: number;
  active_agents: number;
  average_execution_time: number;
  collaboration_efficiency: number;
  agent_utilization_rate: number;
  timestamp: Date;
}

// Zod schemas for validation
const AgentCapabilitySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  parameters: z.record(z.any()).optional(),
  required_tools: z.array(z.string()).optional(),
  cost_per_use: z.number().optional(),
  success_rate: z.number().optional()
});

const AgentRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  capabilities: z.array(AgentCapabilitySchema).optional(),
  expertise_areas: z.array(z.string()).optional(),
  collaboration_patterns: z.array(z.string()).optional(),
  priority_level: z.number().optional()
});

const CrewAgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: AgentRoleSchema,
  model: z.string().optional(),
  temperature: z.number().optional(),
  max_tokens: z.number().optional(),
  memory_size: z.number().optional(),
  current_task: z.string().optional(),
  performance_score: z.number().optional(),
  status: z.enum(['idle', 'busy', 'error']).optional()
});

const TaskSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  priority: z.number().optional(),
  dependencies: z.array(z.string()).optional(),
  estimated_duration: z.number().optional(),
  context: z.record(z.any()).optional()
});

const CrewSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  agents: z.array(CrewAgentSchema).optional(),
  tasks: z.array(TaskSchema).optional(),
  goal: z.string().optional(),
  collaboration_strategy: z.enum(['hierarchical', 'democratic', 'swarm']).optional(),
  max_concurrent_tasks: z.number().optional()
});

export class CrewAIService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = '/api/v1/ai/crewai', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Create a new collaborative crew
   */
  async createCrew(crew: Crew): Promise<{ crew_id: string }> {
    // Validate input
    const validatedCrew = CrewSchema.parse(crew);

    const response = await fetch(`${this.baseUrl}/crews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
      body: JSON.stringify(validatedCrew),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create crew: ${error.detail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Execute a crew collaboration
   */
  async executeCrew(
    crewId: string,
    inputData: Record<string, any>,
    options?: {
      context?: Record<string, any>;
      metadata?: Record<string, any>;
      onProgress?: (result: Partial<CollaborationResult>) => void;
    }
  ): Promise<CollaborationResult> {
    const payload = {
      input_data: inputData,
      context: options?.context || {},
      metadata: options?.metadata || {}
    };

    const response = await fetch(`${this.baseUrl}/crews/${crewId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to execute crew: ${error.detail || response.statusText}`);
    }

    const result = await response.json();

    // Notify progress callback if provided
    if (options?.onProgress) {
      options.onProgress(result);
    }

    return result;
  }

  /**
   * Get crew details
   */
  async getCrew(crewId: string): Promise<Crew & { metrics?: any }> {
    const response = await fetch(`${this.baseUrl}/crews/${crewId}`, {
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get crew: ${error.detail || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * List all crews
   */
  async listCrews(): Promise<Array<{
    id: string;
    name: string;
    status: string;
    agent_count: number;
    task_count: number;
    created_at: string;
  }>> {
    const response = await fetch(`${this.baseUrl}/crews`, {
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to list crews: ${error.detail || response.statusText}`);
    }

    const data = await response.json();
    return data.crews || [];
  }

  /**
   * Delete a crew
   */
  async deleteCrew(crewId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/crews/${crewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to delete crew: ${error.detail || response.statusText}`);
    }
  }

  /**
   * Get agent pool information
   */
  async getAgents(): Promise<Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    performance_score: number;
    current_task?: string;
  }>> {
    const response = await fetch(`${this.baseUrl}/agents`, {
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get agents: ${error.detail || response.statusText}`);
    }

    const data = await response.json();
    return data.agents || [];
  }

  /**
   * Get service metrics
   */
  async getMetrics(): Promise<CrewMetrics> {
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
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    active_crews: number;
    total_crews: number;
    total_agents: number;
    active_agents: number;
  }> {
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
   * Create pre-built crew templates
   */
  async createTemplate(templateName: string): Promise<Crew> {
    const templates: Record<string, () => Crew> = {
      'content-creation': () => ({
        id: `template-${Date.now()}`,
        name: 'AI Content Creation Crew',
        description: 'Multi-agent team for comprehensive content creation and optimization',
        goal: 'Create high-quality, SEO-optimized content with research and editing',
        collaboration_strategy: 'hierarchical',
        max_concurrent_tasks: 3,
        agents: [
          {
            id: 'researcher',
            name: 'Research Specialist',
            role: {
              name: 'Research Analyst',
              description: 'Expert at gathering and analyzing information',
              capabilities: [
                {
                  name: 'web_research',
                  description: 'Research topics using web sources',
                  required_tools: ['web_search', 'data_analysis']
                },
                {
                  name: 'market_analysis',
                  description: 'Analyze market trends and audience preferences'
                }
              ],
              expertise_areas: ['research', 'data_analysis', 'market_intelligence'],
              collaboration_patterns: ['delegate_to_writer', 'consult_with_editor']
            },
            model: 'gpt-4',
            temperature: 0.3
          },
          {
            id: 'writer',
            name: 'Content Writer',
            role: {
              name: 'Creative Writer',
              description: 'Skilled at creating engaging and informative content',
              capabilities: [
                {
                  name: 'content_creation',
                  description: 'Write articles, blog posts, and marketing copy'
                },
                {
                  name: 'tone_adaptation',
                  description: 'Adapt writing style to target audience'
                }
              ],
              expertise_areas: ['creative_writing', 'copywriting', 'content_strategy'],
              collaboration_patterns: ['receive_from_researcher', 'delegate_to_editor']
            },
            model: 'claude-3-sonnet-20240229',
            temperature: 0.7
          },
          {
            id: 'editor',
            name: 'Content Editor',
            role: {
              name: 'Quality Assurance Editor',
              description: 'Expert at refining and optimizing content quality',
              capabilities: [
                {
                  name: 'content_editing',
                  description: 'Edit for grammar, clarity, and engagement'
                },
                {
                  name: 'seo_optimization',
                  description: 'Optimize content for search engines'
                },
                {
                  name: 'fact_checking',
                  description: 'Verify accuracy of information and claims'
                }
              ],
              expertise_areas: ['editing', 'seo', 'quality_assurance'],
              collaboration_patterns: ['receive_from_writer', 'final_approval']
            },
            model: 'gpt-4',
            temperature: 0.2
          }
        ],
        tasks: [
          {
            id: 'research_topic',
            description: 'Research the given topic comprehensively including market trends, audience preferences, and key insights',
            priority: 1,
            estimated_duration: 1800  // 30 minutes
          },
          {
            id: 'create_outline',
            description: 'Create a detailed content outline based on research findings',
            priority: 2,
            dependencies: ['research_topic'],
            estimated_duration: 900  // 15 minutes
          },
          {
            id: 'write_draft',
            description: 'Write the initial content draft following the approved outline',
            priority: 3,
            dependencies: ['create_outline'],
            estimated_duration: 2700  // 45 minutes
          },
          {
            id: 'edit_content',
            description: 'Edit and polish the content for clarity, engagement, and SEO optimization',
            priority: 4,
            dependencies: ['write_draft'],
            estimated_duration: 1800  // 30 minutes
          },
          {
            id: 'final_review',
            description: 'Final review and quality assurance check',
            priority: 5,
            dependencies: ['edit_content'],
            estimated_duration: 900  // 15 minutes
          }
        ]
      }),

      'data-analysis': () => ({
        id: `template-${Date.now()}`,
        name: 'Data Analysis Crew',
        description: 'Multi-agent team for comprehensive data analysis and insights generation',
        goal: 'Analyze datasets and generate actionable business insights',
        collaboration_strategy: 'democratic',
        max_concurrent_tasks: 4,
        agents: [
          {
            id: 'data_engineer',
            name: 'Data Engineer',
            role: {
              name: 'Data Pipeline Specialist',
              description: 'Expert at data extraction, transformation, and loading',
              capabilities: [
                {
                  name: 'data_extraction',
                  description: 'Extract data from various sources'
                },
                {
                  name: 'data_cleaning',
                  description: 'Clean and preprocess data'
                }
              ],
              expertise_areas: ['etl', 'data_engineering', 'database_management']
            },
            model: 'gpt-4',
            temperature: 0.1
          },
          {
            id: 'analyst',
            name: 'Data Analyst',
            role: {
              name: 'Business Intelligence Analyst',
              description: 'Expert at statistical analysis and visualization',
              capabilities: [
                {
                  name: 'statistical_analysis',
                  description: 'Perform statistical tests and modeling'
                },
                {
                  name: 'data_visualization',
                  description: 'Create charts and dashboards'
                }
              ],
              expertise_areas: ['statistics', 'data_visualization', 'business_intelligence']
            },
            model: 'claude-3-sonnet-20240229',
            temperature: 0.3
          },
          {
            id: 'ml_engineer',
            name: 'ML Engineer',
            role: {
              name: 'Machine Learning Specialist',
              description: 'Expert at building and deploying ML models',
              capabilities: [
                {
                  name: 'model_training',
                  description: 'Train machine learning models'
                },
                {
                  name: 'feature_engineering',
                  description: 'Create and select model features'
                }
              ],
              expertise_areas: ['machine_learning', 'deep_learning', 'model_deployment']
            },
            model: 'gpt-4',
            temperature: 0.2
          }
        ],
        tasks: [
          {
            id: 'extract_data',
            description: 'Extract and load data from source systems',
            priority: 1,
            estimated_duration: 1200
          },
          {
            id: 'clean_data',
            description: 'Clean and preprocess the extracted data',
            priority: 2,
            dependencies: ['extract_data'],
            estimated_duration: 1800
          },
          {
            id: 'exploratory_analysis',
            description: 'Perform exploratory data analysis and identify patterns',
            priority: 3,
            dependencies: ['clean_data'],
            estimated_duration: 2400
          },
          {
            id: 'build_model',
            description: 'Build and train predictive models',
            priority: 4,
            dependencies: ['exploratory_analysis'],
            estimated_duration: 3600
          },
          {
            id: 'generate_insights',
            description: 'Generate actionable business insights from analysis',
            priority: 5,
            dependencies: ['build_model', 'exploratory_analysis'],
            estimated_duration: 1800
          }
        ]
      }),

      'customer-service': () => ({
        id: `template-${Date.now()}`,
        name: 'Customer Service Crew',
        description: 'AI-powered customer service and support team',
        goal: 'Provide intelligent customer support with quick resolution',
        collaboration_strategy: 'swarm',
        max_concurrent_tasks: 5,
        agents: [
          {
            id: 'triage_agent',
            name: 'Triage Specialist',
            role: {
              name: 'Issue Classifier',
              description: 'Expert at quickly classifying and routing customer issues',
              capabilities: [
                {
                  name: 'issue_classification',
                  description: 'Categorize customer issues and determine priority'
                },
                {
                  name: 'sentiment_analysis',
                  description: 'Analyze customer sentiment and urgency'
                }
              ],
              expertise_areas: ['customer_service', 'issue_routing', 'sentiment_analysis']
            },
            model: 'gpt-3.5-turbo',
            temperature: 0.1
          },
          {
            id: 'technical_agent',
            name: 'Technical Support',
            role: {
              name: 'Technical Specialist',
              description: 'Expert at resolving technical issues and providing solutions',
              capabilities: [
                {
                  name: 'troubleshooting',
                  description: 'Diagnose and resolve technical problems'
                },
                {
                  name: 'solution_providing',
                  description: 'Provide step-by-step solutions to customers'
                }
              ],
              expertise_areas: ['technical_support', 'troubleshooting', 'product_knowledge']
            },
            model: 'gpt-4',
            temperature: 0.3
          },
          {
            id: 'billing_agent',
            name: 'Billing Specialist',
            role: {
              name: 'Billing Support',
              description: 'Expert at handling billing inquiries and account issues',
              capabilities: [
                {
                  name: 'billing_inquiry',
                  description: 'Handle billing questions and disputes'
                },
                {
                  name: 'account_management',
                  description: 'Manage customer accounts and subscriptions'
                }
              ],
              expertise_areas: ['billing', 'accounting', 'customer_accounts']
            },
            model: 'claude-3-sonnet-20240229',
            temperature: 0.2
          }
        ],
        tasks: [
          {
            id: 'classify_issue',
            description: 'Classify the customer issue and determine priority level',
            priority: 1,
            estimated_duration: 300
          },
          {
            id: 'gather_context',
            description: 'Gather additional context about the customer and their issue',
            priority: 2,
            dependencies: ['classify_issue'],
            estimated_duration: 600
          },
          {
            id: 'provide_solution',
            description: 'Provide appropriate solution based on issue classification',
            priority: 3,
            dependencies: ['classify_issue', 'gather_context'],
            estimated_duration: 900
          },
          {
            id: 'follow_up',
            description: 'Follow up to ensure customer satisfaction and issue resolution',
            priority: 4,
            dependencies: ['provide_solution'],
            estimated_duration: 600
          }
        ]
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
export const crewAIService = new CrewAIService();

// Export utility functions
export const createCrewTemplate = (templateName: string) =>
  crewAIService.createTemplate(templateName);

