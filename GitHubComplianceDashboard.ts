import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GitHubAuditLogger } from './GitHubAuditLogger';
import { GitHubConsentService } from './GitHubConsentService';
import { GitHubDataExportService } from './GitHubDataExportService';

export interface ComplianceMetrics {
  overallScore: number;
  consentCompliance: number;
  auditCompliance: number;
  dataRetentionCompliance: number;
  securityCompliance: number;
  lastUpdated: Date;
}

export interface ComplianceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  affectedUsers: number;
  recommendedAction: string;
  createdAt: Date;
  resolvedAt?: Date;
  status: 'active' | 'resolved' | 'dismissed';
}

export interface ComplianceReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: ComplianceMetrics;
  alerts: ComplianceAlert[];
  consentSummary: {
    totalConsents: number;
    activeConsents: number;
    withdrawnConsents: number;
    consentByType: Record<string, number>;
  };
  auditSummary: {
    totalEvents: number;
    complianceEvents: number;
    securityEvents: number;
    errorEvents: number;
  };
  dataExportSummary: {
    pendingExports: number;
    completedExports: number;
    failedExports: number;
  };
}

@Injectable()
export class GitHubComplianceDashboard {
  private readonly logger = new Logger(GitHubComplianceDashboard.name);
  private complianceMetrics: ComplianceMetrics;
  private activeAlerts: ComplianceAlert[] = [];

  constructor(
    @InjectRepository(ComplianceAlert)
    private alertRepository: Repository<ComplianceAlert>,
    private eventEmitter: EventEmitter2,
    private auditLogger: GitHubAuditLogger,
    private consentService: GitHubConsentService,
    private dataExportService: GitHubDataExportService,
  ) {
    this.initializeMetrics();
  }

  /**
   * Get current compliance metrics
   */
  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    await this.updateComplianceMetrics();
    return this.complianceMetrics;
  }

  /**
   * Get active compliance alerts
   */
  async getActiveAlerts(): Promise<ComplianceAlert[]> {
    return await this.alertRepository.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Generate compliance report for a specific period
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
  ): Promise<ComplianceReport> {
    try {
      const [consentStats, auditSummary, exportSummary] = await Promise.all([
        this.consentService.getConsentStatistics(),
        this.getAuditSummary(startDate, endDate),
        this.getDataExportSummary(),
      ]);

      const alerts = await this.alertRepository.find({
        where: {
          createdAt: MoreThan(startDate),
          createdAt: LessThan(endDate),
        },
        order: { createdAt: 'DESC' },
      });

      const metrics = await this.calculatePeriodMetrics(startDate, endDate);

      return {
        period: { startDate, endDate },
        metrics,
        alerts,
        consentSummary: consentStats,
        auditSummary,
        dataExportSummary: exportSummary,
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report', error);
      throw error;
    }
  }

  /**
   * Resolve a compliance alert
   */
  async resolveAlert(
    alertId: string,
    resolution: string,
    resolvedBy: string,
  ): Promise<void> {
    try {
      const alert = await this.alertRepository.findOne({
        where: { id: alertId, status: 'active' },
      });

      if (!alert) {
        throw new Error(`Alert ${alertId} not found or already resolved`);
      }

      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.description += `\n\nResolved: ${resolution} (by ${resolvedBy})`;

      await this.alertRepository.save(alert);

      // Log resolution
      await this.auditLogger.logComplianceEvent({
        action: 'alert_resolved',
        alertId,
        resolution,
        resolvedBy,
      });

      this.logger.log(`Compliance alert ${alertId} resolved by ${resolvedBy}`);
    } catch (error) {
      this.logger.error(`Failed to resolve alert ${alertId}`, error);
      throw error;
    }
  }

  /**
   * Scheduled compliance monitoring (runs daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async performDailyComplianceCheck(): Promise<void> {
    try {
      this.logger.log('Starting daily compliance check...');

      await this.updateComplianceMetrics();
      await this.checkConsentCompliance();
      await this.checkAuditCompliance();
      await this.checkDataRetentionCompliance();
      await this.checkSecurityCompliance();

      this.logger.log('Daily compliance check completed');
    } catch (error) {
      this.logger.error('Daily compliance check failed', error);
    }
  }

  /**
   * Real-time compliance monitoring for events
   */
  async handleComplianceEvent(event: {
    type: string;
    userId?: string;
    details: any;
  }): Promise<void> {
    try {
      switch (event.type) {
        case 'consent_granted':
          await this.handleConsentGranted(event);
          break;
        case 'consent_withdrawn':
          await this.handleConsentWithdrawn(event);
          break;
        case 'data_export_completed':
          await this.handleDataExportCompleted(event);
          break;
        case 'security_violation':
          await this.handleSecurityViolation(event);
          break;
        default:
          this.logger.warn(`Unknown compliance event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle compliance event ${event.type}`, error);
    }
  }

  /**
   * Initialize compliance metrics
   */
  private initializeMetrics(): void {
    this.complianceMetrics = {
      overallScore: 0,
      consentCompliance: 0,
      auditCompliance: 0,
      dataRetentionCompliance: 0,
      securityCompliance: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Update compliance metrics
   */
  private async updateComplianceMetrics(): Promise<void> {
    try {
      const [consentScore, auditScore, retentionScore, securityScore] = await Promise.all([
        this.calculateConsentCompliance(),
        this.calculateAuditCompliance(),
        this.calculateDataRetentionCompliance(),
        this.calculateSecurityCompliance(),
      ]);

      this.complianceMetrics = {
        overallScore: Math.round((consentScore + auditScore + retentionScore + securityScore) / 4),
        consentCompliance: consentScore,
        auditCompliance: auditScore,
        dataRetentionCompliance: retentionScore,
        securityCompliance: securityScore,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to update compliance metrics', error);
    }
  }

  /**
   * Calculate consent compliance score
   */
  private async calculateConsentCompliance(): Promise<number> {
    try {
      const stats = await this.consentService.getConsentStatistics();
      const consentRate = stats.activeConsents / Math.max(stats.totalConsents, 1);
      return Math.round(consentRate * 100);
    } catch (error) {
      this.logger.error('Failed to calculate consent compliance', error);
      return 0;
    }
  }

  /**
   * Calculate audit compliance score
   */
  private async calculateAuditCompliance(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const auditSummary = await this.getAuditSummary(thirtyDaysAgo, new Date());
      const auditRate = auditSummary.complianceEvents / Math.max(auditSummary.totalEvents, 1);
      return Math.round(auditRate * 100);
    } catch (error) {
      this.logger.error('Failed to calculate audit compliance', error);
      return 0;
    }
  }

  /**
   * Calculate data retention compliance score
   */
  private async calculateDataRetentionCompliance(): Promise<number> {
    // Implementation would check data retention policies
    // For now, return a placeholder score
    return 85;
  }

  /**
   * Calculate security compliance score
   */
  private async calculateSecurityCompliance(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const auditSummary = await this.getAuditSummary(thirtyDaysAgo, new Date());
      const securityRate = 1 - (auditSummary.errorEvents / Math.max(auditSummary.totalEvents, 1));
      return Math.round(securityRate * 100);
    } catch (error) {
      this.logger.error('Failed to calculate security compliance', error);
      return 0;
    }
  }

  /**
   * Check consent compliance and create alerts
   */
  private async checkConsentCompliance(): Promise<void> {
    try {
      const stats = await this.consentService.getConsentStatistics();

      // Alert if consent withdrawal rate is high
      const withdrawalRate = stats.withdrawnConsents / Math.max(stats.totalConsents, 1);
      if (withdrawalRate > 0.1) { // More than 10% withdrawals
        await this.createAlert({
          type: 'warning',
          title: 'High Consent Withdrawal Rate',
          description: `${Math.round(withdrawalRate * 100)}% of users have withdrawn consent. Review user experience and privacy practices.`,
          affectedUsers: stats.withdrawnConsents,
          recommendedAction: 'Review privacy notice and user communication strategies',
        });
      }
    } catch (error) {
      this.logger.error('Failed to check consent compliance', error);
    }
  }

  /**
   * Check audit compliance and create alerts
   */
  private async checkAuditCompliance(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const auditSummary = await this.getAuditSummary(sevenDaysAgo, new Date());

      // Alert if audit logging is below threshold
      if (auditSummary.totalEvents < 1000) { // Arbitrary threshold
        await this.createAlert({
          type: 'warning',
          title: 'Low Audit Activity',
          description: 'Audit event volume is below expected levels. Verify audit logging is functioning correctly.',
          affectedUsers: 0,
          recommendedAction: 'Check audit logging configuration and system health',
        });
      }
    } catch (error) {
      this.logger.error('Failed to check audit compliance', error);
    }
  }

  /**
   * Check data retention compliance
   */
  private async checkDataRetentionCompliance(): Promise<void> {
    // Implementation would check for data older than retention policies
    // and create alerts for non-compliant data
  }

  /**
   * Check security compliance
   */
  private async checkSecurityCompliance(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const auditSummary = await this.getAuditSummary(sevenDaysAgo, new Date());

      // Alert on high error rates
      const errorRate = auditSummary.errorEvents / Math.max(auditSummary.totalEvents, 1);
      if (errorRate > 0.05) { // More than 5% errors
        await this.createAlert({
          type: 'critical',
          title: 'High Error Rate Detected',
          description: `${Math.round(errorRate * 100)}% of operations are failing. Immediate investigation required.`,
          affectedUsers: 0,
          recommendedAction: 'Review error logs and system performance',
        });
      }
    } catch (error) {
      this.logger.error('Failed to check security compliance', error);
    }
  }

  /**
   * Create a new compliance alert
   */
  private async createAlert(alertData: Omit<ComplianceAlert, 'id' | 'createdAt' | 'status'>): Promise<void> {
    try {
      const alert: ComplianceAlert = {
        id: this.generateAlertId(),
        ...alertData,
        createdAt: new Date(),
        status: 'active',
      };

      await this.alertRepository.save(alert);
      this.activeAlerts.push(alert);

      // Emit alert event
      this.eventEmitter.emit('github.compliance.alert', alert);

      this.logger.log(`Compliance alert created: ${alert.title}`);
    } catch (error) {
      this.logger.error('Failed to create compliance alert', error);
    }
  }

  /**
   * Handle consent granted event
   */
  private async handleConsentGranted(event: any): Promise<void> {
    // Update metrics and check for improvements
    await this.updateComplianceMetrics();
  }

  /**
   * Handle consent withdrawn event
   */
  private async handleConsentWithdrawn(event: any): Promise<void> {
    await this.updateComplianceMetrics();

    // Check if this triggers any alerts
    await this.checkConsentCompliance();
  }

  /**
   * Handle data export completed event
   */
  private async handleDataExportCompleted(event: any): Promise<void> {
    await this.updateComplianceMetrics();
  }

  /**
   * Handle security violation event
   */
  private async handleSecurityViolation(event: any): Promise<void> {
    await this.createAlert({
      type: 'critical',
      title: 'Security Violation Detected',
      description: `Security violation detected for user ${event.userId}: ${event.details.description}`,
      affectedUsers: 1,
      recommendedAction: 'Review security logs and take appropriate action',
    });
  }

  /**
   * Get audit summary for a period
   */
  private async getAuditSummary(startDate: Date, endDate: Date): Promise<{
    totalEvents: number;
    complianceEvents: number;
    securityEvents: number;
    errorEvents: number;
  }> {
    // Implementation would query audit logs
    // For now, return placeholder data
    return {
      totalEvents: 5000,
      complianceEvents: 4500,
      securityEvents: 200,
      errorEvents: 300,
    };
  }

  /**
   * Get data export summary
   */
  private async getDataExportSummary(): Promise<{
    pendingExports: number;
    completedExports: number;
    failedExports: number;
  }> {
    // Implementation would query data export records
    return {
      pendingExports: 5,
      completedExports: 150,
      failedExports: 2,
    };
  }

  /**
   * Calculate period-specific metrics
   */
  private async calculatePeriodMetrics(startDate: Date, endDate: Date): Promise<ComplianceMetrics> {
    // Implementation would calculate metrics for the specific period
    return this.complianceMetrics;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
