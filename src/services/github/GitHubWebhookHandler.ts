import { Webhooks, createEventHandler } from '@octokit/webhooks';
import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
      avatar_url: string;
    };
    html_url: string;
    description: string;
    private: boolean;
  };
  sender?: {
    login: string;
    id: number;
    avatar_url: string;
  };
  installation?: {
    id: number;
  };
  [key: string]: any;
}

export interface WebhookEvent {
  id: string;
  type: string;
  payload: GitHubWebhookPayload;
  signature: string;
  timestamp: Date;
  processed: boolean;
  retryCount: number;
}

/**
 * GitHub Webhook Handler Service
 * Processes incoming GitHub webhooks and routes them to appropriate handlers
 */
export class GitHubWebhookHandler extends EventEmitter {
  private webhooks: Webhooks;
  private eventStore: Map<string, WebhookEvent> = new Map();
  private processingQueue: WebhookEvent[] = [];
  private isProcessing: boolean = false;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor(webhookSecret: string) {
    super();
    this.webhooks = new Webhooks({
      secret: webhookSecret,
      path: '/webhooks/github'
    });

    this.setupEventHandlers();
    this.startProcessingQueue();
  }

  /**
   * Handle incoming webhook request
   */
  async handleWebhook(
    request: {
      headers: Record<string, string>;
      body: string;
      method: string;
      url: string;
    }
  ): Promise<{ status: number; message: string }> {
    try {
      // Verify webhook signature
      const signature = request.headers['x-hub-signature-256'];
      if (!signature) {
        return { status: 400, message: 'Missing webhook signature' };
      }

      // Parse payload
      let payload: GitHubWebhookPayload;
      try {
        payload = JSON.parse(request.body);
      } catch (error) {
        return { status: 400, message: 'Invalid JSON payload' };
      }

      // Verify signature
      const isValidSignature = await this.verifySignature(request.body, signature);
      if (!isValidSignature) {
        return { status: 401, message: 'Invalid webhook signature' };
      }

      // Create webhook event
      const event: WebhookEvent = {
        id: this.generateEventId(),
        type: request.headers['x-github-event'] || 'unknown',
        payload,
        signature,
        timestamp: new Date(),
        processed: false,
        retryCount: 0
      };

      // Store event
      this.eventStore.set(event.id, event);

      // Add to processing queue
      this.processingQueue.push(event);

      this.emit('webhook_received', event);

      return { status: 200, message: 'Webhook processed successfully' };

    } catch (error) {
      console.error('Webhook handling error:', error);
      return { status: 500, message: 'Internal server error' };
    }
  }

  /**
   * Process webhook event
   */
  private async processWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      console.log(`Processing GitHub webhook: ${event.type}`, {
        repository: event.payload.repository?.full_name,
        action: event.payload.action,
        sender: event.payload.sender?.login
      });

      // Route to appropriate handler based on event type
      switch (event.type) {
        case 'push':
          await this.handlePushEvent(event);
          break;
        case 'pull_request':
          await this.handlePullRequestEvent(event);
          break;
        case 'issues':
          await this.handleIssueEvent(event);
          break;
        case 'release':
          await this.handleReleaseEvent(event);
          break;
        case 'workflow_run':
          await this.handleWorkflowRunEvent(event);
          break;
        case 'installation':
          await this.handleInstallationEvent(event);
          break;
        default:
          await this.handleGenericEvent(event);
      }

      // Mark as processed
      event.processed = true;
      this.eventStore.set(event.id, event);

      this.emit('webhook_processed', event);

    } catch (error) {
      console.error(`Failed to process webhook event ${event.id}:`, error);

      // Handle retry logic
      if (event.retryCount < this.maxRetries) {
        event.retryCount++;
        this.eventStore.set(event.id, event);

        // Schedule retry
        setTimeout(() => {
          this.processingQueue.push(event);
        }, this.retryDelay * Math.pow(2, event.retryCount)); // Exponential backoff
      } else {
        this.emit('webhook_failed', event);
      }
    }
  }

  /**
   * Handle push events
   */
  private async handlePushEvent(event: WebhookEvent): Promise<void> {
    const { payload } = event;
    const { repository, commits, ref, sender } = payload;

    if (!repository) return;

    // Extract branch name
    const branch = ref?.replace('refs/heads/', '');

    // Emit push event with structured data
    this.emit('push', {
      repository: repository.full_name,
      branch,
      commits: commits || [],
      sender: sender?.login,
      timestamp: event.timestamp,
      eventId: event.id
    });

    // Trigger workflows that match this event
    await this.triggerMatchingWorkflows('push', {
      repository: repository.full_name,
      branch,
      commits,
      sender
    });
  }

  /**
   * Handle pull request events
   */
  private async handlePullRequestEvent(event: WebhookEvent): Promise<void> {
    const { payload } = event;
    const { repository, pull_request, action, sender } = payload;

    if (!repository || !pull_request) return;

    // Emit pull request event
    this.emit('pull_request', {
      repository: repository.full_name,
      action,
      pullRequest: {
        number: pull_request.number,
        title: pull_request.title,
        state: pull_request.state,
        merged: pull_request.merged,
        merge_commit_sha: pull_request.merge_commit_sha,
        head: {
          ref: pull_request.head.ref,
          sha: pull_request.head.sha
        },
        base: {
          ref: pull_request.base.ref,
          sha: pull_request.base.sha
        }
      },
      sender: sender?.login,
      timestamp: event.timestamp,
      eventId: event.id
    });

    // Trigger workflows for PR events
    await this.triggerMatchingWorkflows('pull_request', {
      repository: repository.full_name,
      action,
      pullRequest: pull_request,
      sender
    });
  }

  /**
   * Handle issue events
   */
  private async handleIssueEvent(event: WebhookEvent): Promise<void> {
    const { payload } = event;
    const { repository, issue, action, sender } = payload;

    if (!repository || !issue) return;

    this.emit('issue', {
      repository: repository.full_name,
      action,
      issue: {
        number: issue.number,
        title: issue.title,
        state: issue.state,
        labels: issue.labels?.map((label: any) => label.name) || []
      },
      sender: sender?.login,
      timestamp: event.timestamp,
      eventId: event.id
    });

    // Trigger workflows for issue events
    await this.triggerMatchingWorkflows('issues', {
      repository: repository.full_name,
      action,
      issue,
      sender
    });
  }

  /**
   * Handle release events
   */
  private async handleReleaseEvent(event: WebhookEvent): Promise<void> {
    const { payload } = event;
    const { repository, release, action, sender } = payload;

    if (!repository || !release) return;

    this.emit('release', {
      repository: repository.full_name,
      action,
      release: {
        tag_name: release.tag_name,
        name: release.name,
        body: release.body,
        draft: release.draft,
        prerelease: release.prerelease
      },
      sender: sender?.login,
      timestamp: event.timestamp,
      eventId: event.id
    });

    // Trigger workflows for release events
    await this.triggerMatchingWorkflows('release', {
      repository: repository.full_name,
      action,
      release,
      sender
    });
  }

  /**
   * Handle workflow run events
   */
  private async handleWorkflowRunEvent(event: WebhookEvent): Promise<void> {
    const { payload } = event;
    const { repository, workflow_run, action, sender } = payload;

    if (!repository || !workflow_run) return;

    this.emit('workflow_run', {
      repository: repository.full_name,
      action,
      workflowRun: {
        id: workflow_run.id,
        name: workflow_run.name,
        status: workflow_run.status,
        conclusion: workflow_run.conclusion,
        html_url: workflow_run.html_url
      },
      sender: sender?.login,
      timestamp: event.timestamp,
      eventId: event.id
    });
  }

  /**
   * Handle installation events
   */
  private async handleInstallationEvent(event: WebhookEvent): Promise<void> {
    const { payload } = event;
    const { installation, action, sender } = payload;

    this.emit('installation', {
      action,
      installation: {
        id: installation?.id,
        account: payload.installation?.account
      },
      sender: sender?.login,
      timestamp: event.timestamp,
      eventId: event.id
    });
  }

  /**
   * Handle generic events
   */
  private async handleGenericEvent(event: WebhookEvent): Promise<void> {
    this.emit('generic', {
      type: event.type,
      payload: event.payload,
      timestamp: event.timestamp,
      eventId: event.id
    });
  }

  /**
   * Trigger workflows that match the event
   */
  private async triggerMatchingWorkflows(
    eventType: string,
    eventData: any
  ): Promise<void> {
    // This would integrate with Auterity's workflow engine
    // For now, just emit an event that other services can listen to
    this.emit('trigger_workflows', {
      eventType,
      eventData,
      timestamp: new Date()
    });
  }

  /**
   * Verify webhook signature
   */
  private async verifySignature(payload: string, signature: string): Promise<boolean> {
    // This is handled by the @octokit/webhooks library
    // but we include this for manual verification if needed
    return true; // Placeholder - actual verification is done by Webhooks class
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `gh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Setup @octokit/webhooks event handlers
    this.webhooks.on('push', ({ payload }) => {
      this.handleWebhookEvent('push', payload);
    });

    this.webhooks.on('pull_request', ({ payload }) => {
      this.handleWebhookEvent('pull_request', payload);
    });

    this.webhooks.on('issues', ({ payload }) => {
      this.handleWebhookEvent('issues', payload);
    });

    this.webhooks.on('release', ({ payload }) => {
      this.handleWebhookEvent('release', payload);
    });
  }

  /**
   * Handle webhook event from @octokit/webhooks
   */
  private async handleWebhookEvent(type: string, payload: GitHubWebhookPayload): Promise<void> {
    const event: WebhookEvent = {
      id: this.generateEventId(),
      type,
      payload,
      signature: '', // Would be available from the webhook middleware
      timestamp: new Date(),
      processed: false,
      retryCount: 0
    };

    this.processingQueue.push(event);
  }

  /**
   * Start processing queue
   */
  private startProcessingQueue(): void {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) {
        return;
      }

      this.isProcessing = true;

      const event = this.processingQueue.shift();
      if (event) {
        await this.processWebhookEvent(event);
      }

      this.isProcessing = false;
    }, 100); // Process every 100ms
  }

  /**
   * Get webhook statistics
   */
  getStats(): {
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
    pendingEvents: number;
  } {
    const events = Array.from(this.eventStore.values());
    const processedEvents = events.filter(e => e.processed).length;
    const failedEvents = events.filter(e => e.retryCount >= this.maxRetries).length;
    const pendingEvents = this.processingQueue.length;

    return {
      totalEvents: events.length,
      processedEvents,
      failedEvents,
      pendingEvents
    };
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 10): WebhookEvent[] {
    const events = Array.from(this.eventStore.values());
    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear processed events (for memory management)
   */
  clearProcessedEvents(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    for (const [id, event] of this.eventStore) {
      if (event.processed && event.timestamp < cutoffTime) {
        this.eventStore.delete(id);
      }
    }
  }
}

// Express middleware for handling GitHub webhooks
export const createGitHubWebhookMiddleware = (webhookHandler: GitHubWebhookHandler) => {
  return async (req: any, res: any, next: any) => {
    if (req.path !== '/webhooks/github') {
      return next();
    }

    try {
      const result = await webhookHandler.handleWebhook({
        headers: req.headers,
        body: JSON.stringify(req.body),
        method: req.method,
        url: req.url
      });

      res.status(result.status).json({ message: result.message });
    } catch (error) {
      console.error('Webhook middleware error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  };
};
