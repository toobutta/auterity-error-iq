import { Octokit } from '@octokit/core';
import { createOAuthAppAuth } from '@octokit/auth-oauth-app';
import { Webhooks } from '@octokit/webhooks';
import { EventEmitter } from 'events';

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  language: string;
  html_url: string;
  clone_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  forks_count: number;
  archived: boolean;
  disabled: boolean;
}

export interface GitHubWorkflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'disabled_manually' | 'disabled_inactivity';
  created_at: string;
  updated_at: string;
}

export interface GitHubWebhookEvent {
  action: string;
  repository: GitHubRepository;
  sender: any;
  [key: string]: any;
}

/**
 * Comprehensive GitHub Integration Service for Auterity
 * Provides deep integration with GitHub using Octokit SDK
 */
export class GitHubIntegrationService extends EventEmitter {
  private octokit: Octokit | null = null;
  private webhooks: Webhooks | null = null;
  private cache: Map<string, any> = new Map();
  private rateLimitRemaining: number = 5000;
  private rateLimitReset: Date = new Date();

  constructor(
    private clientId?: string,
    private clientSecret?: string,
    private webhookSecret?: string
  ) {
    super();
    this.setupEventHandlers();
  }

  /**
   * Initialize GitHub integration with authentication
   */
  async initialize(accessToken?: string): Promise<void> {
    if (accessToken) {
      this.octokit = new Octokit({
        auth: accessToken,
        userAgent: 'auterity-integration/1.0.0'
      });
    } else if (this.clientId && this.clientSecret) {
      this.octokit = new Octokit({
        authStrategy: createOAuthAppAuth({
          clientId: this.clientId,
          clientSecret: this.clientSecret,
        }),
        userAgent: 'auterity-integration/1.0.0'
      });
    }

    // Setup webhook handler if secret is provided
    if (this.webhookSecret) {
      this.webhooks = new Webhooks({
        secret: this.webhookSecret,
        path: '/webhooks/github'
      });
      this.setupWebhookHandlers();
    }

    // Load initial rate limit status
    await this.updateRateLimitStatus();
  }

  /**
   * Get authenticated user's repositories
   */
  async getUserRepositories(options: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubRepository[]> {
    await this.ensureAuthenticated();

    const cacheKey = `user-repos-${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await this.octokit!.request('GET /user/repos', {
      type: options.type || 'owner',
      sort: options.sort || 'updated',
      direction: options.direction || 'desc',
      per_page: options.per_page || 100,
      page: options.page || 1
    });

    const repositories = response.data;
    this.cache.set(cacheKey, repositories);

    // Cache for 5 minutes
    setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

    return repositories;
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    await this.ensureAuthenticated();

    const cacheKey = `repo-${owner}-${repo}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await this.octokit!.request('GET /repos/{owner}/{repo}', {
      owner,
      repo
    });

    const repository = response.data;
    this.cache.set(cacheKey, repository);

    return repository;
  }

  /**
   * Create a new repository
   */
  async createRepository(name: string, options: {
    description?: string;
    private?: boolean;
    auto_init?: boolean;
    gitignore_template?: string;
    license_template?: string;
  } = {}): Promise<GitHubRepository> {
    await this.ensureAuthenticated();

    const response = await this.octokit!.request('POST /user/repos', {
      name,
      description: options.description,
      private: options.private || false,
      auto_init: options.auto_init || true,
      gitignore_template: options.gitignore_template,
      license_template: options.license_template
    });

    // Clear user repos cache
    this.cache.delete('user-repos-*');

    return response.data;
  }

  /**
   * Get repository workflows (GitHub Actions)
   */
  async getWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
    await this.ensureAuthenticated();

    const response = await this.octokit!.request(
      'GET /repos/{owner}/{repo}/actions/workflows',
      { owner, repo }
    );

    return response.data.workflows;
  }

  /**
   * Trigger a GitHub Actions workflow
   */
  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: number,
    inputs?: Record<string, any>
  ): Promise<void> {
    await this.ensureAuthenticated();

    await this.octokit!.request(
      'POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches',
      {
        owner,
        repo,
        workflow_id: workflowId,
        inputs: inputs || {}
      }
    );
  }

  /**
   * Get workflow runs
   */
  async getWorkflowRuns(owner: string, repo: string, options: {
    workflow_id?: number;
    status?: 'completed' | 'in_progress' | 'queued';
    per_page?: number;
    page?: number;
  } = {}): Promise<any[]> {
    await this.ensureAuthenticated();

    const response = await this.octokit!.request(
      'GET /repos/{owner}/{repo}/actions/runs',
      {
        owner,
        repo,
        workflow_id: options.workflow_id,
        status: options.status,
        per_page: options.per_page || 30,
        page: options.page || 1
      }
    );

    return response.data.workflow_runs;
  }

  /**
   * Create webhook for repository
   */
  async createWebhook(
    owner: string,
    repo: string,
    config: {
      url: string;
      content_type?: 'json' | 'form';
      secret?: string;
      events?: string[];
    }
  ): Promise<any> {
    await this.ensureAuthenticated();

    const response = await this.octokit!.request(
      'POST /repos/{owner}/{repo}/hooks',
      {
        owner,
        repo,
        name: 'web',
        active: true,
        events: config.events || ['push', 'pull_request', 'release'],
        config: {
          url: config.url,
          content_type: config.content_type || 'json',
          secret: config.secret || this.webhookSecret
        }
      }
    );

    return response.data;
  }

  /**
   * Search repositories
   */
  async searchRepositories(query: string, options: {
    sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
    order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<GitHubRepository[]> {
    await this.ensureAuthenticated();

    const response = await this.octokit!.request('GET /search/repositories', {
      q: query,
      sort: options.sort || 'updated',
      order: options.order || 'desc',
      per_page: options.per_page || 30,
      page: options.page || 1
    });

    return response.data.items;
  }

  /**
   * Get repository contents
   */
  async getRepositoryContents(
    owner: string,
    repo: string,
    path: string = '',
    ref?: string
  ): Promise<any[]> {
    await this.ensureAuthenticated();

    const response = await this.octokit!.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      {
        owner,
        repo,
        path,
        ref
      }
    );

    return Array.isArray(response.data) ? response.data : [response.data];
  }

  /**
   * Create or update file in repository
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string = 'main',
    sha?: string
  ): Promise<any> {
    await this.ensureAuthenticated();

    const response = await this.octokit!.request(
      'PUT /repos/{owner}/{repo}/contents/{path}',
      {
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha
      }
    );

    return response.data;
  }

  /**
   * Get GitHub CLI command suggestions
   */
  getCLISuggestions(action: string, context?: any): string[] {
    const suggestions: string[] = [];

    switch (action) {
      case 'clone':
        if (context?.repository) {
          suggestions.push(`gh repo clone ${context.repository.full_name}`);
        }
        break;
      case 'create-pr':
        suggestions.push('gh pr create --title "Description" --body "Details"');
        break;
      case 'view-issues':
        if (context?.repository) {
          suggestions.push(`gh issue list --repo ${context.repository.full_name}`);
        }
        break;
      case 'run-workflow':
        if (context?.workflow) {
          suggestions.push(`gh workflow run ${context.workflow.name}`);
        }
        break;
    }

    return suggestions;
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(payload: any, signature?: string): Promise<void> {
    if (!this.webhooks) {
      throw new Error('Webhooks not initialized');
    }

    // Verify signature if provided
    if (signature && this.webhookSecret) {
      const expectedSignature = require('crypto')
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload), 'utf8')
        .digest('hex');

      if (!require('crypto').timingSafeEqual(
        Buffer.from(signature.replace('sha256=', '')),
        Buffer.from(expectedSignature)
      )) {
        throw new Error('Invalid webhook signature');
      }
    }

    // Emit event for processing
    this.emit('webhook', payload);
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(): Promise<{
    remaining: number;
    reset: Date;
    limit: number;
  }> {
    await this.ensureAuthenticated();

    const response = await this.octokit!.request('GET /rate_limit');
    const rate = response.data.rate;

    return {
      remaining: rate.remaining,
      reset: new Date(rate.reset * 1000),
      limit: rate.limit
    };
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.octokit) {
      throw new Error('GitHub integration not initialized. Call initialize() first.');
    }

    // Check rate limit
    if (this.rateLimitRemaining < 100) {
      const now = new Date();
      if (now < this.rateLimitReset) {
        throw new Error(`Rate limit exceeded. Resets at ${this.rateLimitReset}`);
      }
    }
  }

  private async updateRateLimitStatus(): Promise<void> {
    if (!this.octokit) return;

    try {
      const status = await this.getRateLimitStatus();
      this.rateLimitRemaining = status.remaining;
      this.rateLimitReset = status.reset;
    } catch (error) {
      console.warn('Failed to update rate limit status:', error);
    }
  }

  private setupEventHandlers(): void {
    this.on('webhook', (payload: GitHubWebhookEvent) => {
      this.handleWebhookEvent(payload);
    });
  }

  private setupWebhookHandlers(): void {
    if (!this.webhooks) return;

    // Push events
    this.webhooks.on('push', ({ payload }) => {
      this.emit('push', payload);
    });

    // Pull request events
    this.webhooks.on('pull_request', ({ payload }) => {
      this.emit('pull_request', payload);
    });

    // Release events
    this.webhooks.on('release', ({ payload }) => {
      this.emit('release', payload);
    });

    // Issues events
    this.webhooks.on('issues', ({ payload }) => {
      this.emit('issue', payload);
    });
  }

  private async handleWebhookEvent(payload: GitHubWebhookEvent): Promise<void> {
    // Log webhook event
    console.log(`GitHub webhook: ${payload.action} on ${payload.repository?.full_name}`);

    // Emit specific event types
    switch (payload.action) {
      case 'push':
        this.emit('repository_push', payload);
        break;
      case 'opened':
      case 'closed':
      case 'reopened':
        if (payload.pull_request) {
          this.emit('pull_request_update', payload);
        } else if (payload.issue) {
          this.emit('issue_update', payload);
        }
        break;
      case 'published':
        this.emit('release_published', payload);
        break;
    }
  }
}

// Export singleton instance
export const githubIntegrationService = new GitHubIntegrationService();
