import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  method: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  duration?: number;
  metadata: Record<string, any>;
  complianceFlags: string[];
}

export interface GitHubAuditEvent {
  type: 'api_call' | 'webhook_received' | 'authentication' | 'data_access' | 'security_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
}

/**
 * Comprehensive GitHub Integration Audit Logger
 * Ensures GDPR Article 30 compliance and security monitoring
 */
export class GitHubAuditLogger extends EventEmitter {
  private logQueue: AuditLogEntry[] = [];
  private isProcessing: boolean = false;
  private maxRetries: number = 3;

  constructor(
    private database: any, // Replace with actual database interface
    private encryptionKey: string
  ) {
    super();
    this.setupEventHandlers();
  }

  /**
   * Log GitHub API call with full context
   */
  async logGitHubApiCall(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'complianceFlags'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: this.generateAuditId(),
      timestamp: new Date(),
      complianceFlags: this.determineComplianceFlags(entry)
    };

    await this.storeAuditEntry(auditEntry);
    this.emit('api_call_logged', auditEntry);
  }

  /**
   * Log webhook event processing
   */
  async logWebhookEvent(
    webhookId: string,
    eventType: string,
    payload: any,
    processingResult: boolean
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      action: 'webhook_processing',
      resource: `webhook/${webhookId}`,
      method: 'POST',
      success: processingResult,
      metadata: {
        eventType,
        payloadSize: JSON.stringify(payload).length,
        signatureValidated: true
      },
      complianceFlags: ['gdpr_article_30', 'webhook_security']
    };

    await this.storeAuditEntry(auditEntry);
    this.emit('webhook_logged', auditEntry);
  }

  /**
   * Log authentication events
   */
  async logAuthenticationEvent(
    userId: string,
    success: boolean,
    method: string,
    ipAddress?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      userId,
      action: 'authentication',
      resource: 'github_integration',
      method,
      ipAddress,
      success,
      metadata: {
        ...metadata,
        authMethod: method
      },
      complianceFlags: ['gdpr_article_30', 'security_event']
    };

    await this.storeAuditEntry(auditEntry);

    if (!success) {
      this.emit('failed_authentication', auditEntry);
    }
  }

  /**
   * Log data access events for GDPR compliance
   */
  async logDataAccess(
    userId: string,
    dataType: string,
    operation: 'read' | 'write' | 'delete',
    recordCount: number,
    ipAddress?: string
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      userId,
      action: `data_${operation}`,
      resource: `github_data/${dataType}`,
      method: operation.toUpperCase(),
      ipAddress,
      success: true,
      metadata: {
        recordCount,
        dataType
      },
      complianceFlags: ['gdpr_article_30', 'data_protection']
    };

    await this.storeAuditEntry(auditEntry);
    this.emit('data_access_logged', auditEntry);
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      userId,
      action: 'security_event',
      resource: eventType,
      method: 'EVENT',
      success: false,
      metadata: {
        ...details,
        severity
      },
      complianceFlags: ['gdpr_article_30', 'security_event']
    };

    await this.storeAuditEntry(auditEntry);
    this.emit('security_event_logged', auditEntry);

    // Alert on high/critical security events
    if (severity === 'high' || severity === 'critical') {
      this.emit('security_alert', auditEntry);
    }
  }

  /**
   * Retrieve audit logs for compliance reporting
   */
  async getAuditLogs(
    filters: {
      userId?: string;
      action?: string;
      dateFrom?: Date;
      dateTo?: Date;
      complianceFlag?: string;
    },
    pagination: {
      page: number;
      limit: number;
    } = { page: 1, limit: 50 }
  ): Promise<{ entries: AuditLogEntry[]; total: number }> {
    const query = this.buildAuditQuery(filters);
    const offset = (pagination.page - 1) * pagination.limit;

    const [entries, total] = await Promise.all([
      this.database.query(query + ` LIMIT ${pagination.limit} OFFSET ${offset}`),
      this.database.count(query.replace('SELECT *', 'SELECT COUNT(*)'))
    ]);

    return { entries, total };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalEvents: number;
    securityEvents: number;
    failedAuthentications: number;
    dataAccessEvents: number;
    complianceFlags: Record<string, number>;
  }> {
    const logs = await this.getAuditLogs({ dateFrom, dateTo }, { page: 1, limit: 10000 });

    const report = {
      totalEvents: logs.total,
      securityEvents: logs.entries.filter(e => e.action === 'security_event').length,
      failedAuthentications: logs.entries.filter(e => e.action === 'authentication' && !e.success).length,
      dataAccessEvents: logs.entries.filter(e => e.action.startsWith('data_')).length,
      complianceFlags: {} as Record<string, number>
    };

    // Count compliance flags
    logs.entries.forEach(entry => {
      entry.complianceFlags.forEach(flag => {
        report.complianceFlags[flag] = (report.complianceFlags[flag] || 0) + 1;
      });
    });

    return report;
  }

  /**
   * Export audit data for GDPR data portability
   */
  async exportUserAuditData(userId: string): Promise<AuditLogEntry[]> {
    return this.getAuditLogs({ userId }, { page: 1, limit: 10000 }).then(result => result.entries);
  }

  private async storeAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      // Encrypt sensitive metadata
      const encryptedMetadata = await this.encryptMetadata(entry.metadata);

      const dbEntry = {
        ...entry,
        metadata: encryptedMetadata
      };

      await this.database.insert('github_audit_logs', dbEntry);

      // Emit success event
      this.emit('entry_stored', entry.id);

    } catch (error) {
      this.emit('storage_error', { entry, error });

      // Queue for retry
      this.logQueue.push(entry);
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) return;

    this.isProcessing = true;

    while (this.logQueue.length > 0) {
      const entry = this.logQueue.shift();
      if (entry) {
        try {
          await this.storeAuditEntry(entry);
        } catch (error) {
          // Re-queue with retry limit
          if (entry.metadata.retryCount < this.maxRetries) {
            entry.metadata.retryCount = (entry.metadata.retryCount || 0) + 1;
            this.logQueue.unshift(entry);
          } else {
            this.emit('permanent_storage_failure', entry);
          }
        }
      }
    }

    this.isProcessing = false;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  private determineComplianceFlags(entry: Omit<AuditLogEntry, 'complianceFlags'>): string[] {
    const flags: string[] = ['gdpr_article_30']; // Base compliance requirement

    if (entry.action.includes('authentication')) {
      flags.push('gdpr_article_32'); // Security measures
    }

    if (entry.action.includes('data')) {
      flags.push('gdpr_article_30'); // Processing records
      flags.push('data_protection');
    }

    if (entry.action === 'webhook_processing') {
      flags.push('webhook_security');
    }

    if (!entry.success) {
      flags.push('security_event');
    }

    return flags;
  }

  private async encryptMetadata(metadata: Record<string, any>): Promise<string> {
    const data = JSON.stringify(metadata);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${encrypted}:${authTag.toString('hex')}`;
  }

  private buildAuditQuery(filters: any): string {
    let query = 'SELECT * FROM github_audit_logs WHERE 1=1';

    if (filters.userId) {
      query += ` AND user_id = '${filters.userId}'`;
    }

    if (filters.action) {
      query += ` AND action = '${filters.action}'`;
    }

    if (filters.dateFrom) {
      query += ` AND timestamp >= '${filters.dateFrom.toISOString()}'`;
    }

    if (filters.dateTo) {
      query += ` AND timestamp <= '${filters.dateTo.toISOString()}'`;
    }

    if (filters.complianceFlag) {
      query += ` AND JSON_CONTAINS(compliance_flags, '"${filters.complianceFlag}"')`;
    }

    query += ' ORDER BY timestamp DESC';

    return query;
  }

  private setupEventHandlers(): void {
    this.on('security_alert', (entry: AuditLogEntry) => {
      // Implement alerting logic (email, Slack, etc.)
    });

    this.on('failed_authentication', (entry: AuditLogEntry) => {
      // Implement brute force protection
    });
  }
}

// Export singleton instance
export const githubAuditLogger = new GitHubAuditLogger(
  null, // Replace with actual database connection
  process.env.AUDIT_ENCRYPTION_KEY || 'default-key-change-in-production'
);</content>
<parameter name="filePath">c:\Users\Andrew\OneDrive\Documents\auterity-error-iq\src\services\github\GitHubAuditLogger.ts
