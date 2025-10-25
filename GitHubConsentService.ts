import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GitHubAuditLogger } from './GitHubAuditLogger';
import { GitHubDataExportService } from './GitHubDataExportService';

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'github_integration' | 'data_processing' | 'marketing';
  consentVersion: string;
  grantedAt: Date;
  withdrawnAt?: Date;
  ipAddress: string;
  userAgent: string;
  consentDetails: ConsentDetails;
  auditTrail: ConsentAuditEntry[];
}

export interface ConsentDetails {
  purpose: string;
  dataCategories: string[];
  retentionPeriod: string;
  thirdParties: string[];
  legalBasis: 'consent' | 'contract' | 'legitimate_interest' | 'legal_obligation';
}

export interface ConsentAuditEntry {
  timestamp: Date;
  action: 'granted' | 'withdrawn' | 'updated';
  reason?: string;
  performedBy: string;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class GitHubConsentService {
  private readonly logger = new Logger(GitHubConsentService.name);

  constructor(
    @InjectRepository(ConsentRecord)
    private consentRepository: Repository<ConsentRecord>,
    private eventEmitter: EventEmitter2,
    private auditLogger: GitHubAuditLogger,
    private dataExportService: GitHubDataExportService,
  ) {}

  /**
   * Grant consent for GitHub integration
   */
  async grantConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    consentDetails: ConsentDetails,
    context: {
      ipAddress: string;
      userAgent: string;
      performedBy: string;
    },
  ): Promise<ConsentRecord> {
    try {
      // Check for existing active consent
      const existingConsent = await this.consentRepository.findOne({
        where: { userId, consentType, withdrawnAt: null },
      });

      if (existingConsent) {
        throw new Error(`Active consent already exists for ${consentType}`);
      }

      // Create new consent record
      const consentRecord: ConsentRecord = {
        id: this.generateConsentId(),
        userId,
        consentType,
        consentVersion: '1.0',
        grantedAt: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        consentDetails,
        auditTrail: [
          {
            timestamp: new Date(),
            action: 'granted',
            performedBy: context.performedBy,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
        ],
      };

      const savedConsent = await this.consentRepository.save(consentRecord);

      // Log audit event
      await this.auditLogger.logConsentEvent({
        userId,
        action: 'consent_granted',
        consentType,
        details: consentDetails,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      // Emit consent granted event
      this.eventEmitter.emit('github.consent.granted', {
        userId,
        consentType,
        consentId: savedConsent.id,
      });

      this.logger.log(`Consent granted for user ${userId} - ${consentType}`);
      return savedConsent;
    } catch (error) {
      this.logger.error(`Failed to grant consent for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Withdraw consent for GitHub integration
   */
  async withdrawConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    reason: string,
    context: {
      ipAddress: string;
      userAgent: string;
      performedBy: string;
    },
  ): Promise<void> {
    try {
      const consent = await this.consentRepository.findOne({
        where: { userId, consentType, withdrawnAt: null },
      });

      if (!consent) {
        throw new Error(`No active consent found for ${consentType}`);
      }

      // Update consent record
      consent.withdrawnAt = new Date();
      consent.auditTrail.push({
        timestamp: new Date(),
        action: 'withdrawn',
        reason,
        performedBy: context.performedBy,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      await this.consentRepository.save(consent);

      // Log audit event
      await this.auditLogger.logConsentEvent({
        userId,
        action: 'consent_withdrawn',
        consentType,
        reason,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      // Emit consent withdrawn event
      this.eventEmitter.emit('github.consent.withdrawn', {
        userId,
        consentType,
        consentId: consent.id,
        reason,
      });

      // Initiate data deletion if required
      if (consentType === 'github_integration') {
        await this.handleIntegrationWithdrawal(userId, reason, context);
      }

      this.logger.log(`Consent withdrawn for user ${userId} - ${consentType}`);
    } catch (error) {
      this.logger.error(`Failed to withdraw consent for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Check if user has active consent
   */
  async hasActiveConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
  ): Promise<boolean> {
    try {
      const consent = await this.consentRepository.findOne({
        where: { userId, consentType, withdrawnAt: null },
      });
      return !!consent;
    } catch (error) {
      this.logger.error(`Failed to check consent for user ${userId}`, error);
      return false;
    }
  }

  /**
   * Get user's consent history
   */
  async getConsentHistory(
    userId: string,
    consentType?: ConsentRecord['consentType'],
  ): Promise<ConsentRecord[]> {
    try {
      const where: any = { userId };
      if (consentType) {
        where.consentType = consentType;
      }

      return await this.consentRepository.find({
        where,
        order: { grantedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to get consent history for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Update consent details (for consent version updates)
   */
  async updateConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    updates: Partial<ConsentDetails>,
    context: {
      ipAddress: string;
      userAgent: string;
      performedBy: string;
    },
  ): Promise<ConsentRecord> {
    try {
      const consent = await this.consentRepository.findOne({
        where: { userId, consentType, withdrawnAt: null },
      });

      if (!consent) {
        throw new Error(`No active consent found for ${consentType}`);
      }

      // Update consent details
      consent.consentDetails = { ...consent.consentDetails, ...updates };
      consent.auditTrail.push({
        timestamp: new Date(),
        action: 'updated',
        performedBy: context.performedBy,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      const updatedConsent = await this.consentRepository.save(consent);

      // Log audit event
      await this.auditLogger.logConsentEvent({
        userId,
        action: 'consent_updated',
        consentType,
        details: updates,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      this.logger.log(`Consent updated for user ${userId} - ${consentType}`);
      return updatedConsent;
    } catch (error) {
      this.logger.error(`Failed to update consent for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get consent statistics for compliance reporting
   */
  async getConsentStatistics(): Promise<{
    totalConsents: number;
    activeConsents: number;
    withdrawnConsents: number;
    consentByType: Record<string, number>;
  }> {
    try {
      const [totalConsents, activeConsents, withdrawnConsents] = await Promise.all([
        this.consentRepository.count(),
        this.consentRepository.count({ where: { withdrawnAt: null } }),
        this.consentRepository.count({ where: { withdrawnAt: { $ne: null } } }),
      ]);

      // Get consent counts by type
      const consentByTypeResult = await this.consentRepository
        .createQueryBuilder('consent')
        .select('consent.consentType', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('consent.consentType')
        .getRawMany();

      const consentByType = consentByTypeResult.reduce((acc, row) => {
        acc[row.type] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>);

      return {
        totalConsents,
        activeConsents,
        withdrawnConsents,
        consentByType,
      };
    } catch (error) {
      this.logger.error('Failed to get consent statistics', error);
      throw error;
    }
  }

  /**
   * Handle integration withdrawal (data cleanup)
   */
  private async handleIntegrationWithdrawal(
    userId: string,
    reason: string,
    context: {
      ipAddress: string;
      userAgent: string;
      performedBy: string;
    },
  ): Promise<void> {
    try {
      // Initiate data export before deletion (GDPR requirement)
      await this.dataExportService.initiateDataExport(userId, {
        includeAuditLogs: true,
        includeIntegrationData: true,
        reason: `Consent withdrawal: ${reason}`,
        requestedBy: context.performedBy,
      });

      // Emit event for integration cleanup
      this.eventEmitter.emit('github.integration.cleanup', {
        userId,
        reason,
        initiatedBy: context.performedBy,
      });

      this.logger.log(`Integration withdrawal handled for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to handle integration withdrawal for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Generate unique consent ID
   */
  private generateConsentId(): string {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
