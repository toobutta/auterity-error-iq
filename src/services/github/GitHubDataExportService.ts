import { githubAuditLogger } from '../services/github/GitHubAuditLogger';
import { GitHubIntegrationService } from '../services/github/GitHubIntegrationService';

export interface DataExportRequest {
  userId: string;
  requestId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dataTypes: string[];
  format: 'json' | 'csv' | 'pdf';
  includeAuditLogs: boolean;
  completionDeadline: Date;
}

export interface ExportedData {
  userProfile: any;
  githubIntegrations: any[];
  repositories: any[];
  workflows: any[];
  auditLogs?: any[];
  exportMetadata: {
    exportedAt: Date;
    dataTypes: string[];
    recordCounts: Record<string, number>;
    retention: string;
  };
}

/**
 * GDPR Data Portability Service for GitHub Integrations
 * Enables users to export their data in machine-readable format
 */
export class GitHubDataExportService {
  constructor(
    private githubService: GitHubIntegrationService,
    private database: any // Replace with actual database interface
  ) {}

  /**
   * Initiate data export request
   */
  async initiateDataExport(
    userId: string,
    dataTypes: string[] = ['all'],
    format: 'json' | 'csv' | 'pdf' = 'json',
    includeAuditLogs: boolean = true
  ): Promise<string> {
    const requestId = this.generateRequestId();
    const completionDeadline = new Date();
    completionDeadline.setDate(completionDeadline.getDate() + 30); // 30 days to complete

    const exportRequest: DataExportRequest = {
      userId,
      requestId,
      requestedAt: new Date(),
      status: 'pending',
      dataTypes,
      format,
      includeAuditLogs,
      completionDeadline
    };

    await this.database.insert('data_export_requests', exportRequest);

    // Log the export request
    await githubAuditLogger.logDataAccess(
      userId,
      'export_request',
      'read',
      1
    );

    // Start processing asynchronously
    this.processDataExport(exportRequest);

    return requestId;
  }

  /**
   * Get export request status
   */
  async getExportStatus(requestId: string): Promise<DataExportRequest | null> {
    return this.database.findOne('data_export_requests', { requestId });
  }

  /**
   * Get user's exported data
   */
  async getExportedData(requestId: string): Promise<ExportedData | null> {
    const request = await this.getExportStatus(requestId);
    if (!request || request.status !== 'completed') {
      return null;
    }

    return this.database.findOne('exported_data', { requestId });
  }

  /**
   * Process data export asynchronously
   */
  private async processDataExport(request: DataExportRequest): Promise<void> {
    try {
      // Update status to processing
      await this.database.update(
        'data_export_requests',
        { requestId: request.requestId },
        { status: 'processing' }
      );

      // Collect all user data
      const exportedData = await this.collectUserData(request);

      // Store the exported data
      await this.database.insert('exported_data', {
        requestId: request.requestId,
        userId: request.userId,
        data: exportedData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      // Update request status
      await this.database.update(
        'data_export_requests',
        { requestId: request.requestId },
        { status: 'completed' }
      );

      // Log successful export
      await githubAuditLogger.logDataAccess(
        request.userId,
        'data_export',
        'read',
        exportedData.exportMetadata.recordCounts.total || 0
      );

    } catch (error) {
      console.error('Data export failed:', error);

      // Update status to failed
      await this.database.update(
        'data_export_requests',
        { requestId: request.requestId },
        { status: 'failed' }
      );

      // Log the failure
      await githubAuditLogger.logSecurityEvent(
        'data_export_failure',
        'medium',
        {
          requestId: request.requestId,
          userId: request.userId,
          error: error.message
        },
        request.userId
      );
    }
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(request: DataExportRequest): Promise<ExportedData> {
    const data: ExportedData = {
      userProfile: null,
      githubIntegrations: [],
      repositories: [],
      workflows: [],
      auditLogs: [],
      exportMetadata: {
        exportedAt: new Date(),
        dataTypes: request.dataTypes,
        recordCounts: {},
        retention: '30 days'
      }
    };

    // Collect user profile
    if (request.dataTypes.includes('all') || request.dataTypes.includes('profile')) {
      data.userProfile = await this.getUserProfile(request.userId);
      data.exportMetadata.recordCounts.profile = 1;
    }

    // Collect GitHub integrations
    if (request.dataTypes.includes('all') || request.dataTypes.includes('integrations')) {
      data.githubIntegrations = await this.getUserIntegrations(request.userId);
      data.exportMetadata.recordCounts.integrations = data.githubIntegrations.length;
    }

    // Collect repositories
    if (request.dataTypes.includes('all') || request.dataTypes.includes('repositories')) {
      data.repositories = await this.getUserRepositories(request.userId);
      data.exportMetadata.recordCounts.repositories = data.repositories.length;
    }

    // Collect workflows
    if (request.dataTypes.includes('all') || request.dataTypes.includes('workflows')) {
      data.workflows = await this.getUserWorkflows(request.userId);
      data.exportMetadata.recordCounts.workflows = data.workflows.length;
    }

    // Collect audit logs
    if (request.includeAuditLogs) {
      data.auditLogs = await githubAuditLogger.exportUserAuditData(request.userId);
      data.exportMetadata.recordCounts.auditLogs = data.auditLogs.length;
    }

    // Calculate total records
    data.exportMetadata.recordCounts.total = Object.values(data.exportMetadata.recordCounts)
      .reduce((sum, count) => sum + count, 0);

    return data;
  }

  /**
   * Get user profile data
   */
  private async getUserProfile(userId: string): Promise<any> {
    const user = await this.database.findOne('users', { id: userId });
    if (!user) return null;

    // Remove sensitive fields
    const { password, ...profile } = user;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      createdAt: profile.createdAt,
      lastLogin: profile.lastLogin,
      preferences: profile.preferences || {}
    };
  }

  /**
   * Get user's GitHub integrations
   */
  private async getUserIntegrations(userId: string): Promise<any[]> {
    try {
      const integrations = await this.database.find('github_integrations', { userId });

      return integrations.map(integration => ({
        id: integration.id,
        type: integration.type,
        createdAt: integration.createdAt,
        lastSync: integration.lastSync,
        permissions: integration.permissions,
        repositories: integration.repositories || [],
        settings: integration.settings || {}
      }));
    } catch (error) {
      console.error('Failed to get user integrations:', error);
      return [];
    }
  }

  /**
   * Get user's repositories
   */
  private async getUserRepositories(userId: string): Promise<any[]> {
    try {
      const repositories = await this.database.find('github_repositories', { userId });

      return repositories.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        language: repo.language,
        size: repo.size,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count
      }));
    } catch (error) {
      console.error('Failed to get user repositories:', error);
      return [];
    }
  }

  /**
   * Get user's workflows
   */
  private async getUserWorkflows(userId: string): Promise<any[]> {
    try {
      const workflows = await this.database.find('github_workflows', { userId });

      return workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at,
        runs: workflow.runs || []
      }));
    } catch (error) {
      console.error('Failed to get user workflows:', error);
      return [];
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired export data
   */
  async cleanupExpiredExports(): Promise<void> {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 30);

    await this.database.delete('exported_data', {
      expiresAt: { $lt: expiredDate }
    });

    await this.database.delete('data_export_requests', {
      completionDeadline: { $lt: expiredDate },
      status: { $ne: 'completed' }
    });
  }

  /**
   * Get export statistics for compliance reporting
   */
  async getExportStatistics(
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalRequests: number;
    completedRequests: number;
    failedRequests: number;
    averageCompletionTime: number;
  }> {
    const requests = await this.database.find('data_export_requests', {
      requestedAt: { $gte: dateFrom, $lte: dateTo }
    });

    const completed = requests.filter(r => r.status === 'completed');
    const failed = requests.filter(r => r.status === 'failed');

    const averageCompletionTime = completed.length > 0
      ? completed.reduce((sum, r) => {
          const completedAt = r.completedAt || r.updatedAt;
          return sum + (completedAt.getTime() - r.requestedAt.getTime());
        }, 0) / completed.length
      : 0;

    return {
      totalRequests: requests.length,
      completedRequests: completed.length,
      failedRequests: failed.length,
      averageCompletionTime
    };
  }
}

// Export singleton instance
export const githubDataExportService = new GitHubDataExportService(
  null, // Replace with actual GitHubIntegrationService instance
  null  // Replace with actual database connection
);</content>
<parameter name="filePath">c:\Users\Andrew\OneDrive\Documents\auterity-error-iq\src\services\github\GitHubDataExportService.ts
