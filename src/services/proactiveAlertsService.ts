/**
 * Proactive Alerts Service
 *
 * AI-powered proactive alerting system with Copilot suggestions
 * Predicts issues, generates intelligent notifications, and provides actionable remediation
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import { aiSDKService } from './aiSDKService';
import { unifiedOrchestrator } from './unifiedOrchestrator';
import { smartTriageService } from './smartTriageService';
import { playbookService } from './playbookService';

// Alert Schemas
const AlertSeveritySchema = z.enum(['low', 'medium', 'high', 'critical', 'info']);

const AlertCategorySchema = z.enum([
  'performance',
  'security',
  'availability',
  'capacity',
  'configuration',
  'data_quality',
  'user_experience',
  'system_health',
  'business_impact',
  'custom'
]);

const AlertTriggerSchema = z.object({
  type: z.enum([
    'metric_threshold',
    'pattern_detection',
    'anomaly_detection',
    'predictive_analysis',
    'correlation_analysis',
    'time_based',
    'event_based',
    'composite_condition'
  ]),
  conditions: z.record(z.unknown()).default({}),
  threshold: z.number().optional(),
  timeWindow: z.object({
    duration: z.number(), // milliseconds
    sliding: z.boolean().default(true)
  }).optional(),
  cooldown: z.number().default(300000), // 5 minutes default cooldown
  enabled: z.boolean().default(true)
});

const CopilotSuggestionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'immediate_action',
    'investigation',
    'remediation',
    'optimization',
    'monitoring',
    'escalation',
    'documentation'
  ]),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  impact: z.object({
    severity_reduction: z.number().min(0).max(1), // How much it reduces severity
    time_to_resolution: z.number(), // Minutes saved
    cost_savings: z.number(), // USD saved
    automation_potential: z.number().min(0).max(1)
  }),
  implementation: z.object({
    steps: z.array(z.string()),
    required_resources: z.array(z.string()),
    estimated_time: z.number(), // minutes
    risk_level: z.enum(['low', 'medium', 'high']),
    rollback_plan: z.array(z.string()).default([])
  }),
  prerequisites: z.array(z.string()).default([]),
  success_criteria: z.array(z.string()).default([]),
  related_alerts: z.array(z.string()).default([]),
  generated_at: z.date().default(() => new Date()),
  expires_at: z.date().optional()
});

const ProactiveAlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: AlertCategorySchema,
  severity: AlertSeveritySchema,
  status: z.enum([
    'active',
    'acknowledged',
    'resolved',
    'suppressed',
    'expired',
    'false_positive'
  ]).default('active'),
  priority: z.number().min(1).max(5).default(3),

  // Alert details
  source: z.object({
    system: z.string(),
    component: z.string(),
    instance: z.string().optional(),
    location: z.string().optional()
  }),
  trigger: AlertTriggerSchema,
  context: z.record(z.unknown()).default({}),

  // AI-powered content
  ai_analysis: z.object({
    root_cause_probability: z.number().min(0).max(1),
    predicted_impact: z.string(),
    time_to_incident: z.number().optional(), // minutes until incident
    affected_users: z.number().optional(),
    business_value_at_risk: z.number().optional() // USD
  }).optional(),

  // Copilot suggestions
  copilot_suggestions: z.array(CopilotSuggestionSchema).default([]),

  // Response tracking
  responses: z.array(z.object({
    id: z.string(),
    type: z.enum(['acknowledge', 'suppress', 'resolve', 'escalate', 'implement_suggestion']),
    user_id: z.string(),
    timestamp: z.date().default(() => new Date()),
    suggestion_id: z.string().optional(),
    notes: z.string().optional(),
    effectiveness: z.number().min(0).max(1).optional()
  })).default([]),

  // Metadata
  tags: z.array(z.string()).default([]),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  acknowledged_at: z.date().optional(),
  resolved_at: z.date().optional(),
  expires_at: z.date().optional(),

  // Correlation
  correlated_alerts: z.array(z.string()).default([]),
  parent_alert_id: z.string().optional(),

  // Notification settings
  notification_channels: z.array(z.object({
    type: z.enum(['email', 'slack', 'teams', 'webhook', 'sms', 'push']),
    recipients: z.array(z.string()),
    template: z.string().optional(),
    enabled: z.boolean().default(true)
  })).default([])
});

// Types
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;
export type AlertCategory = z.infer<typeof AlertCategorySchema>;
export type AlertTrigger = z.infer<typeof AlertTriggerSchema>;
export type CopilotSuggestion = z.infer<typeof CopilotSuggestionSchema>;
export type ProactiveAlert = z.infer<typeof ProactiveAlertSchema>;

export interface AlertMetrics {
  total_alerts: number;
  active_alerts: number;
  resolved_alerts: number;
  false_positives: number;
  average_resolution_time: number; // minutes
  alert_accuracy: number; // percentage
  suggestion_adoption_rate: number;
  cost_savings_from_prevention: number; // USD
  alerts_by_category: Record<AlertCategory, number>;
  alerts_by_severity: Record<AlertSeverity, number>;
}

export interface AlertGenerationRequest {
  trigger_type: string;
  context: Record<string, unknown>;
  severity?: AlertSeverity;
  category?: AlertCategory;
  source?: {
    system: string;
    component: string;
    instance?: string;
    location?: string;
  };
}

export class ProactiveAlertsService extends EventEmitter {
  private alerts: Map<string, ProactiveAlert> = new Map();
  private alertPatterns: Map<string, AlertTrigger> = new Map();
  private suggestionCache: Map<string, CopilotSuggestion[]> = new Map();
  private activeMonitors: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.initializeDefaultPatterns();
    this.startMonitoring();
  }

  // ===== ALERT GENERATION =====

  /**
   * Generate a proactive alert based on detected conditions
   */
  async generateAlert(request: AlertGenerationRequest): Promise<ProactiveAlert> {
    const alertId = this.generateId('alert');

    // Analyze context with AI to determine alert details
    const aiAnalysis = await this.performAIAnalysis(request);

    // Generate Copilot suggestions
    const copilotSuggestions = await this.generateCopilotSuggestions(
      request,
      aiAnalysis
    );

    const alert: ProactiveAlert = {
      id: alertId,
      title: this.generateAlertTitle(request, aiAnalysis),
      description: this.generateAlertDescription(request, aiAnalysis),
      category: request.category || this.determineCategory(request),
      severity: request.severity || this.determineSeverity(aiAnalysis),
      status: 'active',
      priority: this.calculatePriority(aiAnalysis),
      source: request.source || {
        system: 'unknown',
        component: 'unknown'
      },
      trigger: this.createTriggerFromRequest(request),
      context: request.context,
      ai_analysis: aiAnalysis,
      copilot_suggestions: copilotSuggestions,
      tags: this.generateTags(request, aiAnalysis),
      notification_channels: this.generateNotificationChannels(request, aiAnalysis)
    };

    // Validate and store alert
    const validatedAlert = ProactiveAlertSchema.parse(alert);
    this.alerts.set(validatedAlert.id, validatedAlert);

    this.emit('alert:generated', validatedAlert);
    return validatedAlert;
  }

  /**
   * Generate alert from system metrics
   */
  async generateMetricAlert(
    metricName: string,
    currentValue: number,
    threshold: number,
    context: Record<string, unknown>
  ): Promise<ProactiveAlert | null> {
    // Check if this metric breach should trigger an alert
    const patternKey = `metric_${metricName}`;
    const pattern = this.alertPatterns.get(patternKey);

    if (!pattern || !pattern.enabled) {
      return null;
    }

    const request: AlertGenerationRequest = {
      trigger_type: 'metric_threshold',
      context: {
        ...context,
        metric_name: metricName,
        current_value: currentValue,
        threshold,
        breach_percentage: ((currentValue - threshold) / threshold) * 100
      }
    };

    return this.generateAlert(request);
  }

  /**
   * Generate alert from anomaly detection
   */
  async generateAnomalyAlert(
    anomalyType: string,
    confidence: number,
    affectedSystems: string[],
    context: Record<string, unknown>
  ): Promise<ProactiveAlert | null> {
    if (confidence < 0.7) {
      return null; // Not confident enough
    }

    const request: AlertGenerationRequest = {
      trigger_type: 'anomaly_detection',
      context: {
        ...context,
        anomaly_type: anomalyType,
        confidence,
        affected_systems: affectedSystems
      }
    };

    return this.generateAlert(request);
  }

  // ===== AI ANALYSIS =====

  private async performAIAnalysis(request: AlertGenerationRequest): Promise<ProactiveAlert['ai_analysis']> {
    try {
      const analysisPrompt = this.buildAnalysisPrompt(request);

      const aiResponse = await aiSDKService.generateObject({
        model: await aiSDKService.getProviders().includes('openai') ?
          aiSDKService.setProvider('openai') : aiSDKService.getProviders()[0],
        schema: z.object({
          root_cause_probability: z.number().min(0).max(1),
          predicted_impact: z.string(),
          time_to_incident: z.number().optional(),
          affected_users: z.number().optional(),
          business_value_at_risk: z.number().optional()
        }),
        messages: [
          {
            role: 'system',
            content: 'You are an expert system analyst. Analyze the provided alert conditions and predict potential impacts, root causes, and business effects.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      });

      return aiResponse.object;

    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        root_cause_probability: 0.5,
        predicted_impact: 'Unable to analyze impact due to processing error'
      };
    }
  }

  private buildAnalysisPrompt(request: AlertGenerationRequest): string {
    let prompt = `Analyze the following alert conditions and provide insights:\n\n`;

    prompt += `Trigger Type: ${request.trigger_type}\n`;
    prompt += `Context: ${JSON.stringify(request.context, null, 2)}\n\n`;

    prompt += `Please provide:\n`;
    prompt += `1. Root cause probability (0-1)\n`;
    prompt += `2. Predicted business impact\n`;
    prompt += `3. Time until potential incident (if applicable)\n`;
    prompt += `4. Number of affected users (if applicable)\n`;
    prompt += `5. Business value at risk in USD (if applicable)\n\n`;

    prompt += `Consider:\n`;
    prompt += `- System dependencies and cascading effects\n`;
    prompt += `- User experience impact\n`;
    prompt += `- Business process interruption\n`;
    prompt += `- Recovery time and costs\n`;

    return prompt;
  }

  // ===== COPILOT SUGGESTIONS =====

  private async generateCopilotSuggestions(
    request: AlertGenerationRequest,
    aiAnalysis?: ProactiveAlert['ai_analysis']
  ): Promise<CopilotSuggestion[]> {
    try {
      const suggestionsPrompt = this.buildSuggestionsPrompt(request, aiAnalysis);

      const aiResponse = await aiSDKService.generateObject({
        model: await aiSDKService.getProviders().includes('openai') ?
          aiSDKService.setProvider('openai') : aiSDKService.getProviders()[0],
        schema: z.object({
          suggestions: z.array(z.object({
            type: z.string(),
            title: z.string(),
            description: z.string(),
            confidence: z.number().min(0).max(1),
            impact: z.object({
              severity_reduction: z.number().min(0).max(1),
              time_to_resolution: z.number(),
              cost_savings: z.number(),
              automation_potential: z.number().min(0).max(1)
            }),
            implementation: z.object({
              steps: z.array(z.string()),
              required_resources: z.array(z.string()),
              estimated_time: z.number(),
              risk_level: z.string(),
              rollback_plan: z.array(z.string())
            }),
            prerequisites: z.array(z.string()),
            success_criteria: z.array(z.string())
          }))
        }),
        messages: [
          {
            role: 'system',
            content: 'You are an expert DevOps engineer and system administrator. Generate actionable suggestions for resolving system alerts and preventing incidents.'
          },
          {
            role: 'user',
            content: suggestionsPrompt
          }
        ]
      });

      const suggestions = aiResponse.object.suggestions.map(suggestion => ({
        id: this.generateId('suggestion'),
        type: suggestion.type as CopilotSuggestion['type'],
        title: suggestion.title,
        description: suggestion.description,
        confidence: suggestion.confidence,
        impact: suggestion.impact,
        implementation: {
          ...suggestion.implementation,
          risk_level: suggestion.implementation.risk_level as 'low' | 'medium' | 'high'
        },
        prerequisites: suggestion.prerequisites,
        success_criteria: suggestion.success_criteria,
        generated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }));

      return suggestions;

    } catch (error) {
      console.error('Copilot suggestions generation failed:', error);
      return [];
    }
  }

  private buildSuggestionsPrompt(
    request: AlertGenerationRequest,
    aiAnalysis?: ProactiveAlert['ai_analysis']
  ): string {
    let prompt = `Generate actionable suggestions to resolve and prevent the following alert:\n\n`;

    prompt += `Trigger Type: ${request.trigger_type}\n`;
    prompt += `Context: ${JSON.stringify(request.context, null, 2)}\n`;

    if (aiAnalysis) {
      prompt += `AI Analysis: ${JSON.stringify(aiAnalysis, null, 2)}\n`;
    }

    prompt += `\nGenerate 3-5 specific, actionable suggestions with:\n`;
    prompt += `1. Clear implementation steps\n`;
    prompt += `2. Required resources and time estimates\n`;
    prompt += `3. Risk assessment and rollback plans\n`;
    prompt += `4. Success criteria\n`;
    prompt += `5. Expected impact and cost savings\n\n`;

    prompt += `Focus on:\n`;
    prompt += `- Immediate remediation actions\n`;
    prompt += `- Preventive measures\n`;
    prompt += `- Monitoring improvements\n`;
    prompt += `- Automation opportunities\n`;

    return prompt;
  }

  // ===== ALERT MANAGEMENT =====

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string, notes?: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledged_at = new Date();
    alert.updated_at = new Date();
    alert.responses.push({
      id: this.generateId('response'),
      type: 'acknowledge',
      user_id: userId,
      timestamp: new Date(),
      notes
    });

    this.alerts.set(alertId, alert);
    this.emit('alert:acknowledged', { alert, userId, notes });

    return true;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, userId: string, notes?: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert || !['active', 'acknowledged'].includes(alert.status)) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolved_at = new Date();
    alert.updated_at = new Date();
    alert.responses.push({
      id: this.generateId('response'),
      type: 'resolve',
      user_id: userId,
      timestamp: new Date(),
      notes
    });

    this.alerts.set(alertId, alert);
    this.emit('alert:resolved', { alert, userId, notes });

    return true;
  }

  /**
   * Implement a Copilot suggestion
   */
  async implementSuggestion(
    alertId: string,
    suggestionId: string,
    userId: string,
    effectiveness?: number
  ): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    const suggestion = alert.copilot_suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return false;

    alert.responses.push({
      id: this.generateId('response'),
      type: 'implement_suggestion',
      user_id: userId,
      timestamp: new Date(),
      suggestion_id: suggestionId,
      effectiveness
    });

    // Update suggestion effectiveness if provided
    if (effectiveness !== undefined) {
      suggestion.confidence = effectiveness; // Update confidence based on actual effectiveness
    }

    alert.updated_at = new Date();
    this.alerts.set(alertId, alert);

    this.emit('suggestion:implemented', { alert, suggestion, userId, effectiveness });

    return true;
  }

  /**
   * Suppress an alert
   */
  async suppressAlert(alertId: string, userId: string, duration: number, reason: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'active') {
      return false;
    }

    alert.status = 'suppressed';
    alert.expires_at = new Date(Date.now() + duration);
    alert.updated_at = new Date();
    alert.responses.push({
      id: this.generateId('response'),
      type: 'suppress',
      user_id: userId,
      timestamp: new Date(),
      notes: `Suppressed for ${duration}ms: ${reason}`
    });

    this.alerts.set(alertId, alert);
    this.emit('alert:suppressed', { alert, userId, duration, reason });

    return true;
  }

  // ===== ALERT MONITORING =====

  /**
   * Start monitoring for alert conditions
   */
  private startMonitoring(): void {
    // Monitor system metrics
    this.startMetricMonitoring();

    // Monitor for patterns
    this.startPatternMonitoring();

    // Monitor for correlations
    this.startCorrelationMonitoring();

    // Clean up expired alerts
    this.startCleanupMonitoring();
  }

  private startMetricMonitoring(): void {
    // Monitor key system metrics
    const metrics = [
      { name: 'cpu_usage', threshold: 85, interval: 60000 }, // 1 minute
      { name: 'memory_usage', threshold: 90, interval: 60000 },
      { name: 'disk_usage', threshold: 95, interval: 300000 }, // 5 minutes
      { name: 'error_rate', threshold: 5, interval: 120000 }, // 2 minutes
      { name: 'response_time', threshold: 2000, interval: 60000 }
    ];

    metrics.forEach(metric => {
      const monitorId = `metric_${metric.name}`;
      const interval = setInterval(async () => {
        // Mock metric values (in real implementation, get from monitoring system)
        const currentValue = this.getMockMetricValue(metric.name);

        if (currentValue > metric.threshold) {
          await this.generateMetricAlert(
            metric.name,
            currentValue,
            metric.threshold,
            {
              system: 'monitoring',
              component: 'metrics',
              timestamp: new Date(),
              interval: metric.interval
            }
          );
        }
      }, metric.interval);

      this.activeMonitors.set(monitorId, interval);
    });
  }

  private startPatternMonitoring(): void {
    // Monitor for error patterns
    const patternMonitor = setInterval(async () => {
      // Mock pattern detection (in real implementation, analyze logs/events)
      const patterns = this.detectErrorPatterns();

      for (const pattern of patterns) {
        if (pattern.frequency > 10 && pattern.severity === 'high') {
          await this.generateAnomalyAlert(
            'error_pattern',
            0.85,
            pattern.affectedSystems,
            {
              pattern: pattern.pattern,
              frequency: pattern.frequency,
              time_window: '1h',
              examples: pattern.examples
            }
          );
        }
      }
    }, 300000); // 5 minutes

    this.activeMonitors.set('pattern_monitor', patternMonitor);
  }

  private startCorrelationMonitoring(): void {
    // Monitor for correlated events
    const correlationMonitor = setInterval(async () => {
      // Mock correlation detection
      const correlations = this.detectCorrelations();

      for (const correlation of correlations) {
        if (correlation.confidence > 0.8) {
          await this.generateAlert({
            trigger_type: 'correlation_analysis',
            context: {
              correlation_type: correlation.type,
              events: correlation.events,
              confidence: correlation.confidence,
              time_window: correlation.timeWindow
            },
            severity: 'high',
            category: 'system_health'
          });
        }
      }
    }, 600000); // 10 minutes

    this.activeMonitors.set('correlation_monitor', correlationMonitor);
  }

  private startCleanupMonitoring(): void {
    // Clean up expired and resolved alerts
    const cleanupMonitor = setInterval(() => {
      const now = new Date();

      for (const [alertId, alert] of this.alerts.entries()) {
        // Remove expired alerts
        if (alert.expires_at && alert.expires_at < now) {
          this.alerts.delete(alertId);
          this.emit('alert:expired', alert);
        }

        // Remove old resolved alerts (older than 30 days)
        if (alert.status === 'resolved' && alert.resolved_at) {
          const daysSinceResolved = (now.getTime() - alert.resolved_at.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceResolved > 30) {
            this.alerts.delete(alertId);
          }
        }
      }
    }, 3600000); // 1 hour

    this.activeMonitors.set('cleanup_monitor', cleanupMonitor);
  }

  // ===== NOTIFICATION SYSTEM =====

  /**
   * Send alert notifications
   */
  async sendAlertNotifications(alert: ProactiveAlert): Promise<void> {
    for (const channel of alert.notification_channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        console.error(`Failed to send notification via ${channel.type}:`, error);
      }
    }
  }

  private async sendNotification(
    channel: ProactiveAlert['notification_channels'][0],
    alert: ProactiveAlert
  ): Promise<void> {
    const notificationContent = this.buildNotificationContent(channel, alert);

    // Mock notification sending (in real implementation, integrate with actual services)
    console.log(`Sending ${channel.type} notification:`, {
      recipients: channel.recipients,
      subject: notificationContent.subject,
      body: notificationContent.body,
      alertId: alert.id
    });

    // Here you would integrate with actual notification services:
    // - Email: SendGrid, AWS SES, etc.
    // - Slack: Slack Web API
    // - Teams: Microsoft Teams API
    // - SMS: Twilio, AWS SNS
    // - Push: Firebase, etc.
  }

  private buildNotificationContent(
    channel: ProactiveAlert['notification_channels'][0],
    alert: ProactiveAlert
  ): { subject: string; body: string } {
    const severity = alert.severity.toUpperCase();
    const category = alert.category.replace('_', ' ').toUpperCase();

    let subject = `[${severity}] ${category} Alert: ${alert.title}`;

    let body = `🚨 **${severity} ${category} Alert**\n\n`;
    body += `**${alert.title}**\n\n`;
    body += `${alert.description}\n\n`;

    if (alert.ai_analysis) {
      body += `**AI Analysis:**\n`;
      body += `- Root Cause Probability: ${(alert.ai_analysis.root_cause_probability * 100).toFixed(1)}%\n`;
      body += `- Predicted Impact: ${alert.ai_analysis.predicted_impact}\n`;

      if (alert.ai_analysis.time_to_incident) {
        body += `- Time to Incident: ${alert.ai_analysis.time_to_incident} minutes\n`;
      }

      if (alert.ai_analysis.business_value_at_risk) {
        body += `- Business Value at Risk: $${alert.ai_analysis.business_value_at_risk}\n`;
      }

      body += `\n`;
    }

    if (alert.copilot_suggestions.length > 0) {
      body += `**Copilot Suggestions:**\n`;
      alert.copilot_suggestions.slice(0, 3).forEach((suggestion, index) => {
        body += `${index + 1}. ${suggestion.title} (${(suggestion.confidence * 100).toFixed(1)}% confidence)\n`;
        body += `   ${suggestion.description}\n`;
        body += `   Est. Time: ${suggestion.implementation.estimated_time} min\n\n`;
      });
    }

    body += `**Alert Details:**\n`;
    body += `- Source: ${alert.source.system}/${alert.source.component}\n`;
    body += `- Created: ${alert.created_at.toLocaleString()}\n`;
    body += `- Priority: ${alert.priority}/5\n`;
    body += `- Tags: ${alert.tags.join(', ')}\n\n`;

    body += `**Actions:**\n`;
    body += `• Acknowledge Alert\n`;
    body += `• View Full Details\n`;
    body += `• Implement Suggestions\n`;

    return { subject, body };
  }

  // ===== UTILITY METHODS =====

  private initializeDefaultPatterns(): void {
    // Initialize default alert patterns
    const defaultPatterns: Record<string, AlertTrigger> = {
      'high_cpu_usage': {
        type: 'metric_threshold',
        conditions: { metric: 'cpu_usage', operator: '>', threshold: 85 },
        threshold: 85,
        cooldown: 300000,
        enabled: true
      },
      'high_memory_usage': {
        type: 'metric_threshold',
        conditions: { metric: 'memory_usage', operator: '>', threshold: 90 },
        threshold: 90,
        cooldown: 300000,
        enabled: true
      },
      'error_rate_spike': {
        type: 'metric_threshold',
        conditions: { metric: 'error_rate', operator: '>', threshold: 5 },
        threshold: 5,
        timeWindow: { duration: 300000, sliding: true }, // 5 minutes
        cooldown: 600000,
        enabled: true
      },
      'response_time_degradation': {
        type: 'metric_threshold',
        conditions: { metric: 'response_time', operator: '>', threshold: 2000 },
        threshold: 2000,
        cooldown: 300000,
        enabled: true
      }
    };

    Object.entries(defaultPatterns).forEach(([key, pattern]) => {
      this.alertPatterns.set(key, pattern);
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertTitle(request: AlertGenerationRequest, aiAnalysis?: ProactiveAlert['ai_analysis']): string {
    if (request.trigger_type === 'metric_threshold') {
      return `High ${request.context.metric_name} Detected`;
    }
    if (request.trigger_type === 'anomaly_detection') {
      return `${request.context.anomaly_type} Anomaly Detected`;
    }
    if (aiAnalysis?.predicted_impact) {
      return aiAnalysis.predicted_impact;
    }
    return `System Alert: ${request.trigger_type}`;
  }

  private generateAlertDescription(request: AlertGenerationRequest, aiAnalysis?: ProactiveAlert['ai_analysis']): string {
    let description = `Alert triggered by ${request.trigger_type}`;

    if (request.context.metric_name) {
      description += `: ${request.context.metric_name} = ${request.context.current_value}`;
    }

    if (aiAnalysis?.predicted_impact) {
      description += `. ${aiAnalysis.predicted_impact}`;
    }

    return description;
  }

  private determineCategory(request: AlertGenerationRequest): AlertCategory {
    if (request.trigger_type === 'metric_threshold') {
      const metric = request.context.metric_name as string;
      if (metric.includes('cpu') || metric.includes('memory')) return 'performance';
      if (metric.includes('error')) return 'availability';
      if (metric.includes('security')) return 'security';
    }
    return 'system_health';
  }

  private determineSeverity(aiAnalysis?: ProactiveAlert['ai_analysis']): AlertSeverity {
    if (!aiAnalysis) return 'medium';

    if (aiAnalysis.root_cause_probability > 0.8) return 'critical';
    if (aiAnalysis.root_cause_probability > 0.6) return 'high';
    if (aiAnalysis.root_cause_probability > 0.4) return 'medium';
    return 'low';
  }

  private calculatePriority(aiAnalysis?: ProactiveAlert['ai_analysis']): number {
    if (!aiAnalysis) return 3;

    let priority = 3;

    if (aiAnalysis.business_value_at_risk && aiAnalysis.business_value_at_risk > 10000) {
      priority += 2;
    }

    if (aiAnalysis.time_to_incident && aiAnalysis.time_to_incident < 30) {
      priority += 1;
    }

    return Math.min(priority, 5);
  }

  private createTriggerFromRequest(request: AlertGenerationRequest): AlertTrigger {
    return {
      type: request.trigger_type as AlertTrigger['type'],
      conditions: request.context,
      enabled: true
    };
  }

  private generateTags(request: AlertGenerationRequest, aiAnalysis?: ProactiveAlert['ai_analysis']): string[] {
    const tags = [request.trigger_type];

    if (request.context.metric_name) {
      tags.push(request.context.metric_name as string);
    }

    if (aiAnalysis?.predicted_impact) {
      tags.push('ai_analyzed');
    }

    return tags;
  }

  private generateNotificationChannels(
    request: AlertGenerationRequest,
    aiAnalysis?: ProactiveAlert['ai_analysis']
  ): ProactiveAlert['notification_channels'] {
    const channels: ProactiveAlert['notification_channels'] = [
      {
        type: 'email',
        recipients: ['admin@company.com', 'devops@company.com'],
        enabled: true
      }
    ];

    // Add additional channels based on severity
    const severity = this.determineSeverity(aiAnalysis);
    if (severity === 'critical') {
      channels.push({
        type: 'slack',
        recipients: ['#alerts', '#devops'],
        enabled: true
      });
    }

    return channels;
  }

  // Mock data methods (replace with real monitoring integration)
  private getMockMetricValue(metricName: string): number {
    const baseValues: Record<string, number> = {
      cpu_usage: 45,
      memory_usage: 60,
      disk_usage: 30,
      error_rate: 2,
      response_time: 800
    };

    const baseValue = baseValues[metricName] || 50;
    // Add some random variation
    return baseValue + (Math.random() - 0.5) * 20;
  }

  private detectErrorPatterns(): Array<{
    pattern: string;
    frequency: number;
    severity: string;
    affectedSystems: string[];
    examples: string[];
  }> {
    // Mock pattern detection
    return [
      {
        pattern: 'Connection timeout',
        frequency: 15,
        severity: 'high',
        affectedSystems: ['database', 'api_gateway'],
        examples: ['Timeout after 30s', 'Connection pool exhausted']
      }
    ];
  }

  private detectCorrelations(): Array<{
    type: string;
    events: string[];
    confidence: number;
    timeWindow: string;
  }> {
    // Mock correlation detection
    return [
      {
        type: 'cascading_failure',
        events: ['high_cpu', 'memory_pressure', 'response_timeout'],
        confidence: 0.85,
        timeWindow: '5m'
      }
    ];
  }

  // ===== PUBLIC API =====

  /**
   * Get all alerts with filtering
   */
  async getAlerts(filter?: {
    status?: ProactiveAlert['status'];
    severity?: AlertSeverity;
    category?: AlertCategory;
    source_system?: string;
    limit?: number;
  }): Promise<ProactiveAlert[]> {
    let alerts = Array.from(this.alerts.values());

    if (filter) {
      if (filter.status) {
        alerts = alerts.filter(a => a.status === filter.status);
      }
      if (filter.severity) {
        alerts = alerts.filter(a => a.severity === filter.severity);
      }
      if (filter.category) {
        alerts = alerts.filter(a => a.category === filter.category);
      }
      if (filter.source_system) {
        alerts = alerts.filter(a => a.source.system === filter.source_system);
      }
    }

    alerts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    if (filter?.limit) {
      alerts = alerts.slice(0, filter.limit);
    }

    return alerts;
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string): Promise<ProactiveAlert | null> {
    return this.alerts.get(alertId) || null;
  }

  /**
   * Get alert metrics
   */
  async getAlertMetrics(): Promise<AlertMetrics> {
    const alerts = Array.from(this.alerts.values());
    const resolved = alerts.filter(a => a.status === 'resolved');
    const falsePositives = alerts.filter(a => a.status === 'false_positive');

    const totalResolutionTime = resolved.reduce((sum, alert) => {
      if (alert.resolved_at && alert.created_at) {
        return sum + (alert.resolved_at.getTime() - alert.created_at.getTime());
      }
      return sum;
    }, 0);

    const averageResolutionTime = resolved.length > 0 ?
      totalResolutionTime / resolved.length / (1000 * 60) : 0; // minutes

    const alertAccuracy = alerts.length > 0 ?
      (alerts.length - falsePositives.length) / alerts.length : 1;

    const suggestionResponses = alerts.flatMap(a => a.responses)
      .filter(r => r.type === 'implement_suggestion' && r.effectiveness);

    const suggestionAdoptionRate = suggestionResponses.length > 0 ?
      suggestionResponses.reduce((sum, r) => sum + (r.effectiveness || 0), 0) / suggestionResponses.length : 0;

    const alertsByCategory: Record<AlertCategory, number> = {} as any;
    const alertsBySeverity: Record<AlertSeverity, number> = {} as any;

    // Initialize counters
    Object.values(AlertCategorySchema.enum).forEach(cat => {
      alertsByCategory[cat] = 0;
    });
    Object.values(AlertSeveritySchema.enum).forEach(sev => {
      alertsBySeverity[sev] = 0;
    });

    // Count alerts
    alerts.forEach(alert => {
      alertsByCategory[alert.category]++;
      alertsBySeverity[alert.severity]++;
    });

    return {
      total_alerts: alerts.length,
      active_alerts: alerts.filter(a => a.status === 'active').length,
      resolved_alerts: resolved.length,
      false_positives: falsePositives.length,
      average_resolution_time: averageResolutionTime,
      alert_accuracy: alertAccuracy,
      suggestion_adoption_rate: suggestionAdoptionRate,
      cost_savings_from_prevention: 0, // Would be calculated from actual prevention data
      alerts_by_category: alertsByCategory,
      alerts_by_severity: alertsBySeverity
    };
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    // Clear all monitors
    for (const [monitorId, interval] of this.activeMonitors.entries()) {
      clearInterval(interval);
    }
    this.activeMonitors.clear();

    // Clear alerts and patterns
    this.alerts.clear();
    this.alertPatterns.clear();
    this.suggestionCache.clear();

    this.removeAllListeners();
  }
}

// Export singleton instance
export const proactiveAlertsService = new ProactiveAlertsService();
