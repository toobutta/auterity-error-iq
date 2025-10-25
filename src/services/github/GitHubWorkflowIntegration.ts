import { githubIntegrationService } from './GitHubIntegrationService';
import { workflowEngine } from '../workflow/WorkflowEngine';
import { WorkflowTemplate, WorkflowTrigger } from '../../types/workflow';

export interface GitHubWorkflowTrigger extends WorkflowTrigger {
  type: 'github';
  config: {
    event: 'push' | 'pull_request' | 'release' | 'issues' | 'workflow_dispatch';
    repository?: string;
    branch?: string;
    action?: string; // For pull_request and issues events
    workflowId?: number; // For workflow_dispatch events
  };
}

/**
 * GitHub Workflow Integration Service
 * Connects GitHub events to Auterity workflow engine
 */
export class GitHubWorkflowIntegration {
  private activeTriggers: Map<string, GitHubWorkflowTrigger> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Create workflow trigger from GitHub event
   */
  async createWorkflowTrigger(
    workflowId: string,
    triggerConfig: GitHubWorkflowTrigger['config']
  ): Promise<string> {
    const triggerId = `github-${workflowId}-${Date.now()}`;

    const trigger: GitHubWorkflowTrigger = {
      id: triggerId,
      type: 'github',
      workflowId,
      config: triggerConfig,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.activeTriggers.set(triggerId, trigger);

    // Setup webhook if needed
    await this.setupWebhookForTrigger(trigger);

    return triggerId;
  }

  /**
   * Remove workflow trigger
   */
  async removeWorkflowTrigger(triggerId: string): Promise<void> {
    const trigger = this.activeTriggers.get(triggerId);
    if (!trigger) return;

    // Remove webhook if it exists
    if (trigger.config.repository) {
      await this.removeWebhookForTrigger(trigger);
    }

    this.activeTriggers.delete(triggerId);
  }

  /**
   * Get all active triggers
   */
  getActiveTriggers(): GitHubWorkflowTrigger[] {
    return Array.from(this.activeTriggers.values());
  }

  /**
   * Process GitHub webhook payload
   */
  async processWebhookPayload(payload: any): Promise<void> {
    const eventType = this.getEventType(payload);

    // Find matching triggers
    const matchingTriggers = this.findMatchingTriggers(eventType, payload);

    // Execute workflows for matching triggers
    for (const trigger of matchingTriggers) {
      await this.executeWorkflowForTrigger(trigger, payload);
    }
  }

  /**
   * Create workflow template from GitHub repository
   */
  async createWorkflowFromRepository(
    owner: string,
    repo: string,
    templateName: string
  ): Promise<WorkflowTemplate> {
    // Get repository information
    const repository = await githubIntegrationService.getRepository(owner, repo);

    // Get repository contents to analyze structure
    const contents = await githubIntegrationService.getRepositoryContents(owner, repo);

    // Analyze repository structure
    const analysis = await this.analyzeRepositoryStructure(contents);

    // Create workflow template based on analysis
    const template = this.generateWorkflowTemplate(repository, analysis, templateName);

    return template;
  }

  /**
   * Suggest workflows based on repository analysis
   */
  async suggestWorkflows(owner: string, repo: string): Promise<WorkflowTemplate[]> {
    const repository = await githubIntegrationService.getRepository(owner, repo);
    const contents = await githubIntegrationService.getRepositoryContents(owner, repo);
    const analysis = await this.analyzeRepositoryStructure(contents);

    const suggestions: WorkflowTemplate[] = [];

    // Suggest CI/CD workflow
    if (analysis.hasPackageJson || analysis.hasDockerfile) {
      suggestions.push(this.createCIWorkflowTemplate(repository, analysis));
    }

    // Suggest deployment workflow
    if (analysis.hasDockerfile || analysis.hasKubernetes) {
      suggestions.push(this.createDeploymentWorkflowTemplate(repository, analysis));
    }

    // Suggest testing workflow
    if (analysis.hasTests) {
      suggestions.push(this.createTestingWorkflowTemplate(repository, analysis));
    }

    // Suggest documentation workflow
    if (analysis.hasDocs) {
      suggestions.push(this.createDocumentationWorkflowTemplate(repository, analysis));
    }

    return suggestions;
  }

  private setupEventListeners(): void {
    // Listen to GitHub integration service events
    githubIntegrationService.on('push', (payload) => {
      this.processWebhookPayload(payload);
    });

    githubIntegrationService.on('pull_request_update', (payload) => {
      this.processWebhookPayload(payload);
    });

    githubIntegrationService.on('release_published', (payload) => {
      this.processWebhookPayload(payload);
    });

    githubIntegrationService.on('issue_update', (payload) => {
      this.processWebhookPayload(payload);
    });
  }

  private async setupWebhookForTrigger(trigger: GitHubWorkflowTrigger): Promise<void> {
    if (!trigger.config.repository) return;

    const [owner, repo] = trigger.config.repository.split('/');

    try {
      await githubIntegrationService.createWebhook(owner, repo, {
        url: `${process.env.AUTERITY_WEBHOOK_URL}/github`,
        events: [trigger.config.event],
        secret: process.env.GITHUB_WEBHOOK_SECRET
      });
    } catch (error) {
      console.error('Failed to setup webhook for trigger:', error);
    }
  }

  private async removeWebhookForTrigger(trigger: GitHubWorkflowTrigger): Promise<void> {
    // Implementation would depend on webhook management strategy
    // Could store webhook IDs and delete them when removing triggers
  }

  private getEventType(payload: any): string {
    if (payload.pull_request) return 'pull_request';
    if (payload.release) return 'release';
    if (payload.issue) return 'issues';
    if (payload.workflow_run) return 'workflow_run';
    return 'push'; // Default to push
  }

  private findMatchingTriggers(eventType: string, payload: any): GitHubWorkflowTrigger[] {
    const matchingTriggers: GitHubWorkflowTrigger[] = [];

    for (const trigger of this.activeTriggers.values()) {
      if (!trigger.enabled) continue;

      // Check event type match
      if (trigger.config.event !== eventType) continue;

      // Check repository match
      if (trigger.config.repository) {
        const repoFullName = payload.repository?.full_name;
        if (repoFullName !== trigger.config.repository) continue;
      }

      // Check branch match for push events
      if (eventType === 'push' && trigger.config.branch) {
        const branch = payload.ref?.replace('refs/heads/', '');
        if (branch !== trigger.config.branch) continue;
      }

      // Check action match for pull_request and issues
      if ((eventType === 'pull_request' || eventType === 'issues') && trigger.config.action) {
        if (payload.action !== trigger.config.action) continue;
      }

      matchingTriggers.push(trigger);
    }

    return matchingTriggers;
  }

  private async executeWorkflowForTrigger(
    trigger: GitHubWorkflowTrigger,
    payload: any
  ): Promise<void> {
    try {
      // Prepare workflow input data
      const inputData = {
        github: {
          event: payload,
          repository: payload.repository,
          sender: payload.sender,
          action: payload.action
        }
      };

      // Execute workflow
      const result = await workflowEngine.executeWorkflow(trigger.workflowId, inputData);

      console.log(`Workflow ${trigger.workflowId} executed for GitHub trigger:`, result);
    } catch (error) {
      console.error(`Failed to execute workflow ${trigger.workflowId}:`, error);
    }
  }

  private async analyzeRepositoryStructure(contents: any[]): Promise<{
    hasPackageJson: boolean;
    hasDockerfile: boolean;
    hasKubernetes: boolean;
    hasTests: boolean;
    hasDocs: boolean;
    languages: string[];
    frameworks: string[];
  }> {
    const analysis = {
      hasPackageJson: false,
      hasDockerfile: false,
      hasKubernetes: false,
      hasTests: false,
      hasDocs: false,
      languages: [] as string[],
      frameworks: [] as string[]
    };

    // Check for common files and directories
    for (const item of contents) {
      const name = item.name.toLowerCase();

      if (name === 'package.json') analysis.hasPackageJson = true;
      if (name === 'dockerfile') analysis.hasDockerfile = true;
      if (name.includes('k8s') || name.includes('kubernetes')) analysis.hasKubernetes = true;
      if (name.includes('test') || name.includes('spec')) analysis.hasTests = true;
      if (name === 'readme.md' || name === 'docs') analysis.hasDocs = true;

      // Detect languages
      if (name.endsWith('.js') || name.endsWith('.ts')) {
        if (!analysis.languages.includes('javascript')) analysis.languages.push('javascript');
      }
      if (name.endsWith('.py')) {
        if (!analysis.languages.includes('python')) analysis.languages.push('python');
      }
      if (name.endsWith('.java')) {
        if (!analysis.languages.includes('java')) analysis.languages.push('java');
      }
    }

    // Additional analysis could include checking file contents
    // for framework detection, but keeping it simple for now

    return analysis;
  }

  private generateWorkflowTemplate(
    repository: any,
    analysis: any,
    templateName: string
  ): WorkflowTemplate {
    return {
      id: `github-${repository.id}-${Date.now()}`,
      name: templateName,
      description: `Workflow template for ${repository.full_name}`,
      category: 'github-integration',
      steps: this.generateWorkflowSteps(analysis),
      triggers: [],
      variables: {
        repository: repository.full_name,
        branch: 'main'
      },
      metadata: {
        source: 'github',
        repository: repository.full_name,
        generated: true
      }
    };
  }

  private generateWorkflowSteps(analysis: any): any[] {
    const steps = [];

    if (analysis.hasPackageJson) {
      steps.push({
        id: 'install-dependencies',
        name: 'Install Dependencies',
        type: 'command',
        config: {
          command: 'npm install'
        }
      });
    }

    if (analysis.hasTests) {
      steps.push({
        id: 'run-tests',
        name: 'Run Tests',
        type: 'command',
        config: {
          command: 'npm test'
        }
      });
    }

    if (analysis.hasDockerfile) {
      steps.push({
        id: 'build-docker',
        name: 'Build Docker Image',
        type: 'docker',
        config: {
          dockerfile: 'Dockerfile',
          tags: ['latest']
        }
      });
    }

    return steps;
  }

  private createCIWorkflowTemplate(repository: any, analysis: any): WorkflowTemplate {
    const steps = [];

    if (analysis.hasPackageJson) {
      steps.push(
        {
          id: 'checkout',
          name: 'Checkout Code',
          type: 'github',
          config: { action: 'checkout' }
        },
        {
          id: 'install',
          name: 'Install Dependencies',
          type: 'command',
          config: { command: 'npm ci' }
        },
        {
          id: 'lint',
          name: 'Run Linter',
          type: 'command',
          config: { command: 'npm run lint' }
        },
        {
          id: 'test',
          name: 'Run Tests',
          type: 'command',
          config: { command: 'npm test' }
        }
      );
    }

    return {
      id: `ci-${repository.id}`,
      name: 'Continuous Integration',
      description: 'Automated CI pipeline for code quality and testing',
      category: 'ci-cd',
      steps,
      triggers: [{
        type: 'github',
        config: { event: 'push', repository: repository.full_name, branch: 'main' }
      }],
      variables: {},
      metadata: { source: 'github-suggestion', type: 'ci' }
    };
  }

  private createDeploymentWorkflowTemplate(repository: any, analysis: any): WorkflowTemplate {
    const steps = [
      {
        id: 'checkout',
        name: 'Checkout Code',
        type: 'github',
        config: { action: 'checkout' }
      }
    ];

    if (analysis.hasDockerfile) {
      steps.push({
        id: 'build',
        name: 'Build Application',
        type: 'docker',
        config: { dockerfile: 'Dockerfile' }
      });
    }

    steps.push({
      id: 'deploy',
      name: 'Deploy to Production',
      type: 'deployment',
      config: { environment: 'production' }
    });

    return {
      id: `deploy-${repository.id}`,
      name: 'Automated Deployment',
      description: 'Deploy application on code changes',
      category: 'deployment',
      steps,
      triggers: [{
        type: 'github',
        config: { event: 'push', repository: repository.full_name, branch: 'main' }
      }],
      variables: {},
      metadata: { source: 'github-suggestion', type: 'deployment' }
    };
  }

  private createTestingWorkflowTemplate(repository: any, analysis: any): WorkflowTemplate {
    return {
      id: `test-${repository.id}`,
      name: 'Automated Testing',
      description: 'Run comprehensive test suite',
      category: 'testing',
      steps: [
        {
          id: 'checkout',
          name: 'Checkout Code',
          type: 'github',
          config: { action: 'checkout' }
        },
        {
          id: 'install',
          name: 'Install Dependencies',
          type: 'command',
          config: { command: 'npm ci' }
        },
        {
          id: 'unit-tests',
          name: 'Unit Tests',
          type: 'command',
          config: { command: 'npm run test:unit' }
        },
        {
          id: 'integration-tests',
          name: 'Integration Tests',
          type: 'command',
          config: { command: 'npm run test:integration' }
        },
        {
          id: 'e2e-tests',
          name: 'E2E Tests',
          type: 'command',
          config: { command: 'npm run test:e2e' }
        }
      ],
      triggers: [{
        type: 'github',
        config: { event: 'pull_request', repository: repository.full_name }
      }],
      variables: {},
      metadata: { source: 'github-suggestion', type: 'testing' }
    };
  }

  private createDocumentationWorkflowTemplate(repository: any, analysis: any): WorkflowTemplate {
    return {
      id: `docs-${repository.id}`,
      name: 'Documentation Deployment',
      description: 'Build and deploy documentation',
      category: 'documentation',
      steps: [
        {
          id: 'checkout',
          name: 'Checkout Code',
          type: 'github',
          config: { action: 'checkout' }
        },
        {
          id: 'build-docs',
          name: 'Build Documentation',
          type: 'command',
          config: { command: 'npm run docs:build' }
        },
        {
          id: 'deploy-docs',
          name: 'Deploy Documentation',
          type: 'command',
          config: { command: 'npm run docs:deploy' }
        }
      ],
      triggers: [{
        type: 'github',
        config: { event: 'push', repository: repository.full_name, branch: 'docs' }
      }],
      variables: {},
      metadata: { source: 'github-suggestion', type: 'documentation' }
    };
  }
}

// Export singleton instance
export const githubWorkflowIntegration = new GitHubWorkflowIntegration();
