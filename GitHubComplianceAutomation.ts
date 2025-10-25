import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GitHubAuditLogger } from './GitHubAuditLogger';
import { GitHubConsentService } from './GitHubConsentService';
import { GitHubDataExportService } from './GitHubDataExportService';
import { GitHubComplianceDashboard } from './GitHubComplianceDashboard';
import { GitHubIntegrationService } from './GitHubIntegrationService';

export interface ComplianceWorkflow {
  id: string;
  name: string;
  description: string;
  triggers: ComplianceTrigger[];
  actions: ComplianceAction[];
  schedule?: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface ComplianceTrigger {
  type: 'schedule' | 'event' | 'metric' | 'alert';
  condition: string;
  threshold?: number;
  eventType?: string;
}

export interface ComplianceAction {
  type: 'alert' | 'remediate' | 'report' | 'notify' | 'cleanup';
  target: string;
  parameters: Record<string, any>;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'gdpr' | 'security' | 'audit' | 'consent';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: string;
  actions: ComplianceAction[];
  enabled: boolean;
  lastTriggered?: Date;
}

@Injectable()
export class GitHubComplianceAutomation {
  private readonly logger = new Logger(GitHubComplianceAutomation.name);
  private workflows: Map<string, ComplianceWorkflow> = new Map();
  private rules: Map<string, ComplianceRule> = new Map();

  constructor(
    private eventEmitter: EventEmitter2,
    private auditLogger: GitHubAuditLogger,
    private consentService: GitHubConsentService,
    private dataExportService: GitHubDataExportService,
    private complianceDashboard: GitHubComplianceDashboard,
    private integrationService: GitHubIntegrationService,
  ) {
    this.initializeDefaultWorkflows();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default compliance workflows
   */
  private initializeDefaultWorkflows(): void {
    const workflows: ComplianceWorkflow[] = [
      {
        id: 'daily-compliance-check',
        name: 'Daily Compliance Check',
        description: 'Perform comprehensive compliance assessment daily',
        triggers: [
          {
            type: 'schedule',
            condition: '0 2 * * *', // Daily at 2 AM
          },
        ],
        actions: [
          {
            type: 'report',
            target: 'compliance-dashboard',
            parameters: { reportType: 'daily-summary' },
          },
          {
            type: 'alert',
            target: 'compliance-team',
            parameters: { alertType: 'compliance-violations' },
          },
        ],
        enabled: true,
      },
      {
        id: 'consent-withdrawal-handling',
        name: 'Consent Withdrawal Handling',
        description: 'Handle user consent withdrawals automatically',
        triggers: [
          {
            type: 'event',
            eventType: 'github.consent.withdrawn',
          },
        ],
        actions: [
          {
            type: 'cleanup',
            target: 'user-data',
            parameters: { includeAuditLogs: true },
          },
          {
            type: 'notify',
            target: 'user',
            parameters: { notificationType: 'consent-withdrawn' },
          },
          {
            type: 'report',
            target: 'compliance-dashboard',
            parameters: { reportType: 'consent-withdrawal' },
          },
        ],
        enabled: true,
      },
      {
        id: 'security-incident-response',
        name: 'Security Incident Response',
        description: 'Automated response to security incidents',
        triggers: [
          {
            type: 'alert',
            condition: 'security-violation',
          },
        ],
        actions: [
          {
            type: 'remediate',
            target: 'security-controls',
            parameters: { action: 'isolate-affected-resources' },
          },
          {
            type: 'alert',
            target: 'security-team',
            parameters: { priority: 'high' },
          },
          {
            type: 'notify',
            target: 'affected-users',
            parameters: { notificationType: 'security-incident' },
          },
        ],
        enabled: true,
      },
      {
        id: 'data-retention-enforcement',
        name: 'Data Retention Enforcement',
        description: 'Automatically clean up data beyond retention periods',
        triggers: [
          {
            type: 'schedule',
            condition: '0 3 * * 0', // Weekly on Sunday at 3 AM
          },
        ],
        actions: [
          {
            type: 'cleanup',
            target: 'expired-data',
            parameters: { retentionPolicy: 'gdpr-compliant' },
          },
          {
            type: 'report',
            target: 'compliance-dashboard',
            parameters: { reportType: 'data-retention' },
          },
        ],
        enabled: true,
      },
    ];

    workflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  /**
   * Initialize default compliance rules
   */
  private initializeDefaultRules(): void {
    const rules: ComplianceRule[] = [
      {
        id: 'consent-missing',
        name: 'Missing User Consent',
        description: 'Alert when GitHub integration is used without valid consent',
        category: 'gdpr',
        severity: 'high',
        condition: 'userHasActiveConsent == false && githubApiCallDetected == true',
        actions: [
          {
            type: 'alert',
            target: 'compliance-team',
            parameters: { severity: 'high' },
          },
          {
            type: 'remediate',
            target: 'integration',
            parameters: { action: 'suspend-integration' },
          },
        ],
        enabled: true,
      },
      {
        id: 'audit-log-missing',
        name: 'Missing Audit Logs',
        description: 'Alert when audit logging fails for GitHub operations',
        category: 'audit',
        severity: 'medium',
        condition: 'githubApiCallDetected == true && auditLogCreated == false',
        actions: [
          {
            type: 'alert',
            target: 'devops-team',
            parameters: { severity: 'medium' },
          },
          {
            type: 'remediate',
            target: 'audit-system',
            parameters: { action: 'verify-configuration' },
          },
        ],
        enabled: true,
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Alert when GitHub API error rate exceeds threshold',
        category: 'security',
        severity: 'high',
        condition: 'errorRate > 0.05',
        actions: [
          {
            type: 'alert',
            target: 'engineering-team',
            parameters: { severity: 'high' },
          },
          {
            type: 'remediate',
            target: 'rate-limiting',
            parameters: { action: 'increase-limits' },
          },
        ],
        enabled: true,
      },
      {
        id: 'data-export-overdue',
        name: 'Overdue Data Export',
        description: 'Alert when data export requests are not processed within SLA',
        category: 'gdpr',
        severity: 'medium',
        condition: 'dataExportRequestAge > 30',
        actions: [
          {
            type: 'alert',
            target: 'compliance-team',
            parameters: { severity: 'medium' },
          },
          {
            type: 'remediate',
            target: 'data-export-service',
            parameters: { action: 'prioritize-request' },
          },
        ],
        enabled: true,
      },
    ];

    rules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Execute compliance workflows based on triggers
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async executeScheduledWorkflows(): Promise<void> {
    try {
      const now = new Date();

      for (const [id, workflow] of this.workflows) {
        if (!workflow.enabled) continue;

        const shouldExecute = this.shouldExecuteWorkflow(workflow, now);
        if (shouldExecute) {
          await this.executeWorkflow(workflow);
          workflow.lastRun = now;
        }
      }
    } catch (error) {
      this.logger.error('Failed to execute scheduled workflows', error);
    }
  }

  /**
   * Handle compliance events and trigger workflows/rules
   */
  async handleComplianceEvent(event: {
    type: string;
    userId?: string;
    details: any;
  }): Promise<void> {
    try {
      // Check rules that match the event
      for (const [id, rule] of this.rules) {
        if (!rule.enabled) continue;

        if (this.ruleMatchesEvent(rule, event)) {
          await this.executeRule(rule, event);
          rule.lastTriggered = new Date();
        }
      }

      // Check workflows that match the event
      for (const [id, workflow] of this.workflows) {
        if (!workflow.enabled) continue;

        if (this.workflowMatchesEvent(workflow, event)) {
          await this.executeWorkflow(workflow, event);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to handle compliance event ${event.type}`, error);
    }
  }

  /**
   * Execute a compliance workflow
   */
  private async executeWorkflow(
    workflow: ComplianceWorkflow,
    event?: any,
  ): Promise<void> {
    try {
      this.logger.log(`Executing workflow: ${workflow.name}`);

      for (const action of workflow.actions) {
        await this.executeAction(action, event);
      }

      // Log workflow execution
      await this.auditLogger.logComplianceEvent({
        action: 'workflow_executed',
        workflowId: workflow.id,
        workflowName: workflow.name,
        event: event?.type,
      });
    } catch (error) {
      this.logger.error(`Failed to execute workflow ${workflow.id}`, error);
      throw error;
    }
  }

  /**
   * Execute a compliance rule
   */
  private async executeRule(
    rule: ComplianceRule,
    event: any,
  ): Promise<void> {
    try {
      this.logger.log(`Executing rule: ${rule.name}`);

      for (const action of rule.actions) {
        await this.executeAction(action, event);
      }

      // Log rule execution
      await this.auditLogger.logComplianceEvent({
        action: 'rule_triggered',
        ruleId: rule.id,
        ruleName: rule.name,
        event: event.type,
        severity: rule.severity,
      });
    } catch (error) {
      this.logger.error(`Failed to execute rule ${rule.id}`, error);
      throw error;
    }
  }

  /**
   * Execute a compliance action
   */
  private async executeAction(
    action: ComplianceAction,
    event?: any,
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'alert':
          await this.executeAlertAction(action, event);
          break;
        case 'remediate':
          await this.executeRemediateAction(action, event);
          break;
        case 'report':
          await this.executeReportAction(action, event);
          break;
        case 'notify':
          await this.executeNotifyAction(action, event);
          break;
        case 'cleanup':
          await this.executeCleanupAction(action, event);
          break;
        default:
          this.logger.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to execute action ${action.type}`, error);
    }
  }

  /**
   * Execute alert action
   */
  private async executeAlertAction(
    action: ComplianceAction,
    event?: any,
  ): Promise<void> {
    // Implementation would send alerts to the specified target
    this.logger.log(`Sending alert to ${action.target}: ${JSON.stringify(action.parameters)}`);
  }

  /**
   * Execute remediation action
   */
  private async executeRemediateAction(
    action: ComplianceAction,
    event?: any,
  ): Promise<void> {
    switch (action.target) {
      case 'integration':
        if (action.parameters.action === 'suspend-integration') {
          await this.integrationService.suspendIntegration(event.userId);
        }
        break;
      case 'audit-system':
        if (action.parameters.action === 'verify-configuration') {
          await this.auditLogger.verifyConfiguration();
        }
        break;
      case 'rate-limiting':
        if (action.parameters.action === 'increase-limits') {
          await this.integrationService.adjustRateLimits();
        }
        break;
      case 'data-export-service':
        if (action.parameters.action === 'prioritize-request') {
          await this.dataExportService.prioritizeExport(event.userId);
        }
        break;
      default:
        this.logger.warn(`Unknown remediation target: ${action.target}`);
    }
  }

  /**
   * Execute report action
   */
  private async executeReportAction(
    action: ComplianceAction,
    event?: any,
  ): Promise<void> {
    if (action.target === 'compliance-dashboard') {
      if (action.parameters.reportType === 'daily-summary') {
        const report = await this.complianceDashboard.generateComplianceReport(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
        );
        // Implementation would send report to dashboard
        this.logger.log(`Generated daily compliance report: ${report.metrics.overallScore}%`);
      }
    }
  }

  /**
   * Execute notification action
   */
  private async executeNotifyAction(
    action: ComplianceAction,
    event?: any,
  ): Promise<void> {
    // Implementation would send notifications
    this.logger.log(`Sending notification to ${action.target}: ${action.parameters.notificationType}`);
  }

  /**
   * Execute cleanup action
   */
  private async executeCleanupAction(
    action: ComplianceAction,
    event?: any,
  ): Promise<void> {
    if (action.target === 'user-data') {
      await this.dataExportService.cleanupUserData(event.userId, action.parameters);
    } else if (action.target === 'expired-data') {
      await this.performDataRetentionCleanup();
    }
  }

  /**
   * Check if workflow should execute based on schedule
   */
  private shouldExecuteWorkflow(
    workflow: ComplianceWorkflow,
    now: Date,
  ): boolean {
    if (!workflow.schedule) return false;

    // Simple cron-like check (in production, use a proper cron parser)
    const scheduleParts = workflow.schedule.split(' ');
    if (scheduleParts.length !== 5) return false;

    const [minute, hour, day, month, dayOfWeek] = scheduleParts;

    return (
      (minute === '*' || parseInt(minute) === now.getMinutes()) &&
      (hour === '*' || parseInt(hour) === now.getHours()) &&
      (day === '*' || parseInt(day) === now.getDate()) &&
      (month === '*' || parseInt(month) === now.getMonth() + 1) &&
      (dayOfWeek === '*' || parseInt(dayOfWeek) === now.getDay())
    );
  }

  /**
   * Check if rule matches event
   */
  private ruleMatchesEvent(
    rule: ComplianceRule,
    event: any,
  ): boolean {
    // Simple condition evaluation (in production, use a proper expression evaluator)
    switch (rule.condition) {
      case 'userHasActiveConsent == false && githubApiCallDetected == true':
        return !event.details.hasConsent && event.type === 'github.api.call';
      case 'githubApiCallDetected == true && auditLogCreated == false':
        return event.type === 'github.api.call' && !event.details.auditLogged;
      case 'errorRate > 0.05':
        return event.details.errorRate > 0.05;
      case 'dataExportRequestAge > 30':
        return event.details.requestAge > 30;
      default:
        return false;
    }
  }

  /**
   * Check if workflow matches event
   */
  private workflowMatchesEvent(
    workflow: ComplianceWorkflow,
    event: any,
  ): boolean {
    return workflow.triggers.some(trigger =>
      trigger.type === 'event' && trigger.eventType === event.type,
    );
  }

  /**
   * Perform data retention cleanup
   */
  private async performDataRetentionCleanup(): Promise<void> {
    // Implementation would clean up expired data according to retention policies
    this.logger.log('Performing data retention cleanup');
  }

  /**
   * Get all workflows
   */
  getWorkflows(): ComplianceWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get all rules
   */
  getRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Enable/disable workflow
   */
  setWorkflowEnabled(id: string, enabled: boolean): void {
    const workflow = this.workflows.get(id);
    if (workflow) {
      workflow.enabled = enabled;
    }
  }

  /**
   * Enable/disable rule
   */
  setRuleEnabled(id: string, enabled: boolean): void {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = enabled;
    }
  }
}
