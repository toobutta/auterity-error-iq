/**
 * HumanLayer Service for Auterity Unified AI Platform
 * Provides human-in-the-loop capabilities for critical AI operations
 */

import axios from 'axios';
import { z } from 'zod';

// Types and interfaces for HumanLayer integration
export interface HumanLayerConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}

export interface HumanApprovalRequest {
  id: string;
  type: 'code_execution' | 'data_modification' | 'content_publishing' | 'workflow_approval' | 'ai_decision';
  title: string;
  description: string;
  context: Record<string, any>;
  options: Array<{
    label: string;
    value: string;
    recommended?: boolean;
  }>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  timeout: number; // seconds
  metadata: {
    userId?: string;
    workflowId?: string;
    sessionId?: string;
    tags?: string[];
  };
}

export interface HumanApprovalResponse {
  requestId: string;
  approved: boolean;
  selectedOption?: string;
  feedback?: string;
  responseTime: number;
  humanReviewer?: string;
}

export interface HumanLayerMetrics {
  totalRequests: number;
  approvedRequests: number;
  deniedRequests: number;
  pendingRequests: number;
  averageResponseTime: number;
  approvalRate: number;
  timeoutRate: number;
  timestamp: Date;
}

// Validation schemas
const HumanApprovalRequestSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['code_execution', 'data_modification', 'content_publishing', 'workflow_approval', 'ai_decision']),
  title: z.string().min(1),
  description: z.string().min(1),
  context: z.record(z.any()),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
    recommended: z.boolean().optional()
  })),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  timeout: z.number().positive(),
  metadata: z.object({
    userId: z.string().optional(),
    workflowId: z.string().optional(),
    sessionId: z.string().optional(),
    tags: z.array(z.string()).optional()
  })
});

export class HumanLayerService {
  private config: HumanLayerConfig;
  private axiosInstance: any;
  private metrics: HumanLayerMetrics;

  constructor(config: HumanLayerConfig) {
    this.config = config;
    this.metrics = this.initializeMetrics();

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private initializeMetrics(): HumanLayerMetrics {
    return {
      totalRequests: 0,
      approvedRequests: 0,
      deniedRequests: 0,
      pendingRequests: 0,
      averageResponseTime: 0,
      approvalRate: 0,
      timeoutRate: 0,
      timestamp: new Date()
    };
  }

  /**
   * Submit a request for human approval
   */
  async requestApproval(request: HumanApprovalRequest): Promise<HumanApprovalResponse> {
    try {
      // Validate request
      HumanApprovalRequestSchema.parse(request);

      this.metrics.totalRequests++;
      this.metrics.pendingRequests++;

      const response = await this.axiosInstance.post('/api/v1/approvals', request);

      const approvalResponse: HumanApprovalResponse = {
        requestId: request.id,
        approved: response.data.approved,
        selectedOption: response.data.selectedOption,
        feedback: response.data.feedback,
        responseTime: response.data.responseTime,
        humanReviewer: response.data.reviewer
      };

      // Update metrics
      this.metrics.pendingRequests--;
      if (approvalResponse.approved) {
        this.metrics.approvedRequests++;
      } else {
        this.metrics.deniedRequests++;
      }

      this.updateMetrics();

      return approvalResponse;

    } catch (error) {
      console.error('Failed to submit human approval request:', error);
      this.metrics.pendingRequests--;
      throw error;
    }
  }

  /**
   * Get the status of a pending approval request
   */
  async getApprovalStatus(requestId: string): Promise<{ status: string; details?: any }> {
    try {
      const response = await this.axiosInstance.get(`/api/v1/approvals/${requestId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get approval status:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending approval request
   */
  async cancelApproval(requestId: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.delete(`/api/v1/approvals/${requestId}`);
      return response.status === 200;
    } catch (error) {
      console.error('Failed to cancel approval request:', error);
      throw error;
    }
  }

  /**
   * Get human layer metrics
   */
  getMetrics(): HumanLayerMetrics {
    return { ...this.metrics };
  }

  /**
   * Update calculated metrics
   */
  private updateMetrics(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.approvalRate = this.metrics.approvedRequests / this.metrics.totalRequests;
    }
    this.metrics.timestamp = new Date();
  }

  /**
   * Create approval request for critical workflow decisions
   */
  async requestWorkflowApproval(
    workflowId: string,
    decision: string,
    context: Record<string, any>
  ): Promise<HumanApprovalResponse> {
    const request: HumanApprovalRequest = {
      id: `workflow_${workflowId}_${Date.now()}`,
      type: 'workflow_approval',
      title: `Workflow Decision Approval: ${workflowId}`,
      description: `Please review and approve the following workflow decision: ${decision}`,
      context: {
        workflowId,
        decision,
        ...context
      },
      options: [
        { label: 'Approve', value: 'approved', recommended: true },
        { label: 'Reject', value: 'rejected' },
        { label: 'Modify', value: 'modify' }
      ],
      urgency: 'high',
      timeout: 300, // 5 minutes
      metadata: {
        workflowId,
        sessionId: context.sessionId,
        tags: ['workflow', 'automation']
      }
    };

    return this.requestApproval(request);
  }

  /**
   * Create approval request for code execution
   */
  async requestCodeExecutionApproval(
    codeSnippet: string,
    environment: string,
    userId: string
  ): Promise<HumanApprovalResponse> {
    const request: HumanApprovalRequest = {
      id: `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'code_execution',
      title: 'Code Execution Approval Required',
      description: 'Please review the following code before execution',
      context: {
        code: codeSnippet,
        environment,
        securityAnalysis: this.analyzeCodeSecurity(codeSnippet)
      },
      options: [
        { label: 'Execute', value: 'execute', recommended: false },
        { label: 'Reject', value: 'reject' },
        { label: 'Request Changes', value: 'modify' }
      ],
      urgency: 'critical',
      timeout: 600, // 10 minutes
      metadata: {
        userId,
        tags: ['security', 'code-execution']
      }
    };

    return this.requestApproval(request);
  }

  /**
   * Create approval request for content publishing
   */
  async requestContentApproval(
    content: string,
    platform: string,
    userId: string
  ): Promise<HumanApprovalResponse> {
    const request: HumanApprovalRequest = {
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'content_publishing',
      title: 'Content Publishing Approval',
      description: 'Please review content before publishing',
      context: {
        content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
        platform,
        contentAnalysis: this.analyzeContent(content)
      },
      options: [
        { label: 'Publish', value: 'publish' },
        { label: 'Reject', value: 'reject' },
        { label: 'Edit Required', value: 'edit' }
      ],
      urgency: 'medium',
      timeout: 1800, // 30 minutes
      metadata: {
        userId,
        tags: ['content', 'publishing']
      }
    };

    return this.requestApproval(request);
  }

  /**
   * Basic code security analysis
   */
  private analyzeCodeSecurity(code: string): Record<string, any> {
    return {
      hasDangerousFunctions: /(eval|exec|spawn|system)/.test(code),
      hasDatabaseOperations: /(INSERT|UPDATE|DELETE|DROP)/.test(code),
      hasFileOperations: /(writeFile|unlink|chmod)/.test(code),
      riskLevel: this.calculateRiskLevel(code)
    };
  }

  /**
   * Basic content analysis
   */
  private analyzeContent(content: string): Record<string, any> {
    return {
      wordCount: content.split(/\s+/).length,
      hasLinks: /https?:\/\//.test(content),
      hasMentions: /@\w+/.test(content),
      sentiment: this.analyzeSentiment(content)
    };
  }

  /**
   * Calculate risk level for code
   */
  private calculateRiskLevel(code: string): 'low' | 'medium' | 'high' {
    let risk = 0;
    if (/(eval|exec|spawn|system)/.test(code)) risk += 3;
    if (/(INSERT|UPDATE|DELETE|DROP)/.test(code)) risk += 2;
    if (/(writeFile|unlink|chmod)/.test(code)) risk += 2;

    if (risk >= 5) return 'high';
    if (risk >= 2) return 'medium';
    return 'low';
  }

  /**
   * Simple sentiment analysis
   */
  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst'];

    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}

// Default configuration
export const defaultHumanLayerConfig: HumanLayerConfig = {
  baseUrl: process.env.HUMAN_LAYER_BASE_URL || 'http://humanlayer:8000',
  apiKey: process.env.HUMAN_LAYER_API_KEY || '',
  timeout: 30000,
  retryAttempts: 3
};

// Export singleton instance
export const humanLayerService = new HumanLayerService(defaultHumanLayerConfig);

