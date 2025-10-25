import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GitHubAuditLogger } from './GitHubAuditLogger';
import { GitHubConsentService } from './GitHubConsentService';
import { GitHubDataExportService } from './GitHubDataExportService';
import { GitHubComplianceDashboard } from './GitHubComplianceDashboard';
import { GitHubComplianceAutomation } from './GitHubComplianceAutomation';
import { GitHubIntegrationService } from './GitHubIntegrationService';

export interface ComplianceStatus {
  overallCompliance: number;
  components: {
    audit: boolean;
    consent: boolean;
    dataExport: boolean;
    automation: boolean;
  };
  lastChecked: Date;
  nextCheck: Date;
}

export interface ComplianceReport {
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  status: ComplianceStatus;
  metrics: any;
  alerts: any[];
  recommendations: string[];
}

@Injectable()
export class GitHubComplianceManager implements OnModuleInit {
  private readonly logger = new Logger(GitHubComplianceManager.name);
  private complianceStatus: ComplianceStatus;

  constructor(
    private eventEmitter: EventEmitter2,
    private auditLogger: GitHubAuditLogger,
    private consentService: GitHubConsentService,
    private dataExportService: GitHubDataExportService,
    private complianceDashboard: GitHubComplianceDashboard,
    private complianceAutomation: GitHubComplianceAutomation,
    private integrationService: GitHubIntegrationService,
  ) {
    this.initializeComplianceStatus();
  }

  async onModuleInit() {
    // Set up event listeners for compliance monitoring
    this.setupEventListeners();

    // Perform initial compliance check
    await this.performComplianceCheck();

    this.logger.log('GitHub Compliance Manager initialized');
  }

  /**
   * Get current compliance status
   */
  async getComplianceStatus(): Promise<ComplianceStatus> {
    await this.updateComplianceStatus();
    return this.complianceStatus;
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    startDate?: Date,
    endDate?: Date,
  ): Promise<ComplianceReport> {
    try {
      const reportPeriod = {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: endDate || new Date(),
      };

      const [status, metrics, alerts] = await Promise.all([
        this.getComplianceStatus(),
        this.complianceDashboard.getComplianceMetrics(),
        this.complianceDashboard.getActiveAlerts(),
      ]);

      const recommendations = await this.generateRecommendations(status, alerts);

      return {
        generatedAt: new Date(),
        period: reportPeriod,
        status,
        metrics,
        alerts,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive compliance check
   */
  async performComplianceCheck(): Promise<ComplianceStatus> {
    try {
      this.logger.log('Performing comprehensive compliance check...');

      const [auditStatus, consentStatus, exportStatus, automationStatus] = await Promise.all([
        this.checkAuditCompliance(),
        this.checkConsentCompliance(),
        this.checkDataExportCompliance(),
        this.checkAutomationCompliance(),
      ]);

      const overallCompliance = this.calculateOverallCompliance([
        auditStatus,
        consentStatus,
        exportStatus,
        automationStatus,
      ]);

      this.complianceStatus = {
        overallCompliance,
        components: {
          audit: auditStatus,
          consent: consentStatus,
          dataExport: exportStatus,
          automation: automationStatus,
        },
        lastChecked: new Date(),
        nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next check in 24 hours
      };

      // Log compliance check
      await this.auditLogger.logComplianceEvent({
        action: 'compliance_check_completed',
        overallScore: overallCompliance,
        componentStatus: this.complianceStatus.components,
      });

      this.logger.log(`Compliance check completed: ${overallCompliance}%`);
      return this.complianceStatus;
    } catch (error) {
      this.logger.error('Failed to perform compliance check', error);
      throw error;
    }
  }

  /**
   * Handle user consent for GitHub integration
   */
  async handleUserConsent(
    userId: string,
    consentType: 'github_integration' | 'data_processing',
    context: {
      ipAddress: string;
      userAgent: string;
      performedBy: string;
    },
  ): Promise<void> {
    try {
      const consentDetails = {
        purpose: `Enable ${consentType.replace('_', ' ')} for enhanced functionality`,
        dataCategories: ['account_data', 'repository_data', 'activity_data'],
        retentionPeriod: '90_days',
        thirdParties: ['GitHub Inc.'],
        legalBasis: 'consent' as const,
      };

      await this.consentService.grantConsent(userId, consentType, consentDetails, context);

      // Emit consent granted event for automation
      this.eventEmitter.emit('github.consent.granted', {
        userId,
        consentType,
        details: consentDetails,
      });

      this.logger.log(`Consent granted for user ${userId} - ${consentType}`);
    } catch (error) {
      this.logger.error(`Failed to handle consent for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Handle consent withdrawal
   */
  async handleConsentWithdrawal(
    userId: string,
    consentType: 'github_integration' | 'data_processing',
    reason: string,
    context: {
      ipAddress: string;
      userAgent: string;
      performedBy: string;
    },
  ): Promise<void> {
    try {
      await this.consentService.withdrawConsent(userId, consentType, reason, context);

      // Emit consent withdrawn event for automation
      this.eventEmitter.emit('github.consent.withdrawn', {
        userId,
        consentType,
        reason,
      });

      this.logger.log(`Consent withdrawn for user ${userId} - ${consentType}`);
    } catch (error) {
      this.logger.error(`Failed to withdraw consent for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Initiate data export for GDPR compliance
   */
  async initiateDataExport(
    userId: string,
    context: {
      ipAddress: string;
      userAgent: string;
      performedBy: string;
    },
  ): Promise<string> {
    try {
      const exportRequest = await this.dataExportService.initiateDataExport(userId, {
        includeAuditLogs: true,
        includeIntegrationData: true,
        reason: 'User requested data export',
        requestedBy: context.performedBy,
      });

      // Log data export initiation
      await this.auditLogger.logComplianceEvent({
        action: 'data_export_initiated',
        userId,
        exportId: exportRequest.id,
        requestedBy: context.performedBy,
      });

      this.logger.log(`Data export initiated for user ${userId}`);
      return exportRequest.id;
    } catch (error) {
      this.logger.error(`Failed to initiate data export for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get compliance recommendations
   */
  private async generateRecommendations(
    status: ComplianceStatus,
    alerts: any[],
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (status.overallCompliance < 80) {
      recommendations.push('Overall compliance is below 80%. Immediate attention required.');
    }

    if (!status.components.audit) {
      recommendations.push('Audit logging compliance needs improvement. Verify audit configuration.');
    }

    if (!status.components.consent) {
      recommendations.push('Consent management needs attention. Review consent workflows.');
    }

    if (!status.components.dataExport) {
      recommendations.push('Data export processes need optimization. Check export service health.');
    }

    if (!status.components.automation) {
      recommendations.push('Compliance automation is not functioning properly. Review automation rules.');
    }

    if (alerts.length > 0) {
      recommendations.push(`${alerts.length} active compliance alerts require attention.`);
    }

    return recommendations;
  }

  /**
   * Check audit compliance
   */
  private async checkAuditCompliance(): Promise<boolean> {
    try {
      // Implementation would verify audit logging is working
      const metrics = await this.complianceDashboard.getComplianceMetrics();
      return metrics.auditCompliance >= 80;
    } catch (error) {
      this.logger.error('Failed to check audit compliance', error);
      return false;
    }
  }

  /**
   * Check consent compliance
   */
  private async checkConsentCompliance(): Promise<boolean> {
    try {
      const stats = await this.consentService.getConsentStatistics();
      const consentRate = stats.activeConsents / Math.max(stats.totalConsents, 1);
      return consentRate >= 0.9; // 90% consent rate
    } catch (error) {
      this.logger.error('Failed to check consent compliance', error);
      return false;
    }
  }

  /**
   * Check data export compliance
   */
  private async checkDataExportCompliance(): Promise<boolean> {
    try {
      // Implementation would check data export service health
      return true; // Placeholder
    } catch (error) {
      this.logger.error('Failed to check data export compliance', error);
      return false;
    }
  }

  /**
   * Check automation compliance
   */
  private async checkAutomationCompliance(): Promise<boolean> {
    try {
      // Implementation would check automation workflows
      return true; // Placeholder
    } catch (error) {
      this.logger.error('Failed to check automation compliance', error);
      return false;
    }
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallCompliance(components: boolean[]): number {
    const compliantComponents = components.filter(Boolean).length;
    return Math.round((compliantComponents / components.length) * 100);
  }

  /**
   * Update compliance status
   */
  private async updateComplianceStatus(): Promise<void> {
    if (Date.now() - this.complianceStatus.lastChecked.getTime() > 60 * 60 * 1000) { // 1 hour
      await this.performComplianceCheck();
    }
  }

  /**
   * Initialize compliance status
   */
  private initializeComplianceStatus(): void {
    this.complianceStatus = {
      overallCompliance: 0,
      components: {
        audit: false,
        consent: false,
        dataExport: false,
        automation: false,
      },
      lastChecked: new Date(0),
      nextCheck: new Date(),
    };
  }

  /**
   * Set up event listeners for compliance monitoring
   */
  private setupEventListeners(): void {
    // Listen for GitHub API calls
    this.eventEmitter.on('github.api.call', (event) => {
      this.complianceAutomation.handleComplianceEvent(event);
    });

    // Listen for consent events
    this.eventEmitter.on('github.consent.*', (event) => {
      this.complianceAutomation.handleComplianceEvent(event);
    });

    // Listen for data export events
    this.eventEmitter.on('github.data.export.*', (event) => {
      this.complianceAutomation.handleComplianceEvent(event);
    });

    // Listen for security events
    this.eventEmitter.on('github.security.*', (event) => {
      this.complianceAutomation.handleComplianceEvent(event);
    });
  }
}
