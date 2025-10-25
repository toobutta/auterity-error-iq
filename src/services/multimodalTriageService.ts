/**
 * Multimodal Triage Service
 *
 * Handles voice commands, screenshot analysis, and log dump processing
 * for intelligent incident triage and remediation
 */

import { z } from 'zod';
import { EventEmitter } from 'events';
import { mcpProtocolService, MCPMessage } from './mcpProtocolService';
import { smartTriageService } from './smartTriageService';

// Voice Command Schemas
const VoiceCommandSchema = z.object({
  transcript: z.string(),
  confidence: z.number().min(0).max(1),
  language: z.string().default('en-US'),
  duration: z.number(), // milliseconds
  timestamp: z.date().default(() => new Date()),
  audioData: z.string().optional(), // base64 encoded audio
  speakerId: z.string().optional(),
  keywords: z.array(z.string()).default([])
});

const VoiceIntentSchema = z.object({
  intent: z.enum([
    'investigate_error',
    'check_system_status',
    'restart_service',
    'analyze_logs',
    'create_incident',
    'escalate_issue',
    'run_diagnostics',
    'rollback_changes',
    'notify_team',
    'generate_report'
  ]),
  confidence: z.number().min(0).max(1),
  parameters: z.record(z.unknown()).default({}),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  entities: z.array(z.object({
    type: z.string(),
    value: z.string(),
    confidence: z.number().min(0).max(1),
    position: z.object({
      start: z.number(),
      end: z.number()
    })
  })).default([])
});

// Screenshot Analysis Schemas
const ScreenshotAnalysisSchema = z.object({
  imageData: z.string(), // base64 encoded image
  format: z.enum(['png', 'jpg', 'jpeg', 'webp']),
  dimensions: z.object({
    width: z.number(),
    height: z.number()
  }),
  fileSize: z.number(), // bytes
  timestamp: z.date().default(() => new Date()),
  metadata: z.record(z.unknown()).default({})
});

const VisualAnomalySchema = z.object({
  type: z.enum([
    'error_message',
    'warning_indicator',
    'performance_chart',
    'system_status',
    'resource_usage',
    'network_issue',
    'security_alert',
    'user_interface_error',
    'data_visualization',
    'configuration_issue'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  location: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }),
  description: z.string(),
  suggestedAction: z.string(),
  relatedComponents: z.array(z.string()).default([]),
  evidence: z.object({
    text: z.string().optional(),
    color: z.string().optional(),
    pattern: z.string().optional()
  }).optional()
});

const ScreenshotAnalysisResultSchema = z.object({
  screenshotId: z.string(),
  anomalies: z.array(VisualAnomalySchema),
  overallAssessment: z.object({
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    confidence: z.number().min(0).max(1),
    summary: z.string(),
    recommendedActions: z.array(z.string())
  }),
  processingTime: z.number(), // milliseconds
  aiModelVersion: z.string(),
  analysisTimestamp: z.date().default(() => new Date())
});

// Log Analysis Schemas
const LogDumpSchema = z.object({
  logData: z.string(),
  format: z.enum(['text', 'json', 'xml', 'csv', 'syslog']),
  source: z.string(),
  timestamp: z.date().default(() => new Date()),
  fileSize: z.number(), // bytes
  compression: z.string().optional(), // gzip, zip, etc.
  metadata: z.record(z.unknown()).default({})
});

const LogAnomalySchema = z.object({
  type: z.enum([
    'error',
    'warning',
    'exception',
    'timeout',
    'resource_exhaustion',
    'security_event',
    'performance_degradation',
    'configuration_error',
    'network_issue',
    'database_issue'
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  timestamp: z.string(),
  lineNumber: z.number().optional(),
  message: z.string(),
  stackTrace: z.string().optional(),
  context: z.record(z.unknown()).default({}),
  pattern: z.string(),
  frequency: z.number().default(1),
  relatedLogs: z.array(z.number()).default([]) // line numbers
});

const LogAnalysisResultSchema = z.object({
  logDumpId: z.string(),
  anomalies: z.array(LogAnomalySchema),
  patterns: z.array(z.object({
    pattern: z.string(),
    frequency: z.number(),
    severity: z.string(),
    description: z.string()
  })),
  summary: z.object({
    totalLines: z.number(),
    errorCount: z.number(),
    warningCount: z.number(),
    uniqueErrors: z.number(),
    timeRange: z.object({
      start: z.string(),
      end: z.string()
    }),
    affectedComponents: z.array(z.string())
  }),
  recommendations: z.array(z.string()),
  processingTime: z.number(), // milliseconds
  analysisTimestamp: z.date().default(() => new Date())
});

// Combined Multimodal Analysis
const MultimodalAnalysisResultSchema = z.object({
  sessionId: z.string(),
  voiceAnalysis: z.object({
    command: VoiceCommandSchema,
    intent: VoiceIntentSchema,
    extractedInfo: z.record(z.unknown())
  }).optional(),
  screenshotAnalysis: ScreenshotAnalysisResultSchema.optional(),
  logAnalysis: LogAnalysisResultSchema.optional(),
  integratedAssessment: z.object({
    overallSeverity: z.enum(['low', 'medium', 'high', 'critical']),
    confidence: z.number().min(0).max(1),
    summary: z.string(),
    rootCause: z.string().optional(),
    impact: z.object({
      affectedSystems: z.array(z.string()),
      affectedUsers: z.number().optional(),
      businessImpact: z.string()
    }),
    timeline: z.object({
      detection: z.date(),
      escalation: z.date().optional(),
      resolution: z.date().optional()
    })
  }),
  recommendedActions: z.array(z.object({
    id: z.string(),
    type: z.enum(['immediate', 'short_term', 'long_term', 'preventive']),
    description: z.string(),
    priority: z.number().min(1).max(5),
    estimatedTime: z.number(), // minutes
    requiredResources: z.array(z.string()),
    successCriteria: z.string(),
    rollbackPlan: z.string().optional()
  })),
  automatedResponses: z.array(z.object({
    action: z.string(),
    status: z.enum(['pending', 'executing', 'completed', 'failed']),
    result: z.string().optional(),
    timestamp: z.date().default(() => new Date())
  })).default([])
});

// Types
export type VoiceCommand = z.infer<typeof VoiceCommandSchema>;
export type VoiceIntent = z.infer<typeof VoiceIntentSchema>;
export type ScreenshotAnalysis = z.infer<typeof ScreenshotAnalysisSchema>;
export type VisualAnomaly = z.infer<typeof VisualAnomalySchema>;
export type ScreenshotAnalysisResult = z.infer<typeof ScreenshotAnalysisResultSchema>;
export type LogDump = z.infer<typeof LogDumpSchema>;
export type LogAnomaly = z.infer<typeof LogAnomalySchema>;
export type LogAnalysisResult = z.infer<typeof LogAnalysisResultSchema>;
export type MultimodalAnalysisResult = z.infer<typeof MultimodalAnalysisResultSchema>;

export interface MultimodalTriageConfig {
  enableVoiceCommands: boolean;
  enableScreenshotAnalysis: boolean;
  enableLogDumpProcessing: boolean;
  maxProcessingTime: number; // milliseconds
  confidenceThreshold: number; // minimum confidence for actions
  autoExecuteHighConfidence: boolean;
  supportedLanguages: string[];
  maxFileSize: number; // bytes
  aiModelEndpoint: string;
  voiceProcessingEnabled: boolean;
  visualProcessingEnabled: boolean;
  logProcessingEnabled: boolean;
}

export class MultimodalTriageService extends EventEmitter {
  private config: MultimodalTriageConfig;
  private activeSessions: Map<string, MultimodalAnalysisResult> = new Map();
  private processingQueue: Array<{
    id: string;
    type: 'voice' | 'screenshot' | 'log';
    data: any;
    timestamp: Date;
    priority: number;
  }> = [];
  private isProcessing = false;

  constructor(config: MultimodalTriageConfig) {
    super();
    this.config = config;
  }

  // ===== VOICE COMMAND PROCESSING =====

  /**
   * Process voice command for triage
   */
  async processVoiceCommand(command: VoiceCommand): Promise<VoiceIntent> {
    try {
      const validatedCommand = VoiceCommandSchema.parse(command);

      // Send to AI service for intent recognition
      const intentAnalysis = await this.callAIService('analyze_voice_intent', {
        transcript: validatedCommand.transcript,
        confidence: validatedCommand.confidence,
        language: validatedCommand.language,
        keywords: validatedCommand.keywords,
        context: {
          timestamp: validatedCommand.timestamp,
          speakerId: validatedCommand.speakerId
        }
      });

      const intent: VoiceIntent = {
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence,
        parameters: intentAnalysis.parameters,
        urgency: intentAnalysis.urgency,
        entities: intentAnalysis.entities
      };

      this.emit('voice:processed', { command: validatedCommand, intent });
      return intent;

    } catch (error) {
      console.error('Voice command processing failed:', error);
      throw error;
    }
  }

  /**
   * Convert voice command to actionable triage item
   */
  async voiceCommandToTriageItem(
    command: VoiceCommand,
    intent: VoiceIntent,
    tenantId: string
  ): Promise<any> {
    // Create triage item based on voice intent
    const triageContent = this.formatVoiceCommandForTriage(command, intent);

    const triageItem = {
      title: `Voice Command: ${intent.intent}`,
      description: triageContent,
      content: JSON.stringify({ command, intent }),
      priority: this.mapUrgencyToPriority(intent.urgency),
      source: {
        type: 'voice',
        id: `voice_${Date.now()}`,
        user_id: command.speakerId || 'unknown',
        session_id: `voice_session_${Date.now()}`,
        timestamp: command.timestamp
      },
      context: {
        voice_command: command,
        intent_analysis: intent,
        urgency: intent.urgency,
        entities: intent.entities
      },
      tags: ['voice_command', intent.intent, `urgency_${intent.urgency}`]
    };

    // Submit to smart triage service
    const triageDecision = await smartTriageService.triageItem(
      triageContent,
      triageItem.context,
      tenantId
    );

    // Auto-execute high confidence actions
    if (this.config.autoExecuteHighConfidence && triageDecision.confidence_score >= this.config.confidenceThreshold) {
      await this.executeVoiceAction(intent, triageDecision);
    }

    this.emit('voice:triage_created', { command, intent, triage: triageItem, decision: triageDecision });
    return { triageItem, decision: triageDecision };
  }

  private formatVoiceCommandForTriage(command: VoiceCommand, intent: VoiceIntent): string {
    let content = `Voice Command: "${command.transcript}"\n`;
    content += `Intent: ${intent.intent} (confidence: ${(intent.confidence * 100).toFixed(1)}%)\n`;
    content += `Urgency: ${intent.urgency}\n`;

    if (intent.entities.length > 0) {
      content += `Entities: ${intent.entities.map(e => `${e.type}: ${e.value}`).join(', ')}\n`;
    }

    if (Object.keys(intent.parameters).length > 0) {
      content += `Parameters: ${JSON.stringify(intent.parameters)}\n`;
    }

    return content;
  }

  private mapUrgencyToPriority(urgency: string): string {
    switch (urgency) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private async executeVoiceAction(intent: VoiceIntent, triageDecision: any): Promise<void> {
    // Execute automated actions based on voice intent
    switch (intent.intent) {
      case 'investigate_error':
        await this.investigateError(intent.parameters);
        break;
      case 'check_system_status':
        await this.checkSystemStatus(intent.parameters);
        break;
      case 'restart_service':
        await this.restartService(intent.parameters);
        break;
      case 'analyze_logs':
        await this.analyzeLogs(intent.parameters);
        break;
      case 'create_incident':
        await this.createIncident(intent.parameters);
        break;
      case 'notify_team':
        await this.notifyTeam(intent.parameters);
        break;
      default:
        console.log(`No automated action for intent: ${intent.intent}`);
    }
  }

  // ===== SCREENSHOT ANALYSIS =====

  /**
   * Analyze screenshot for anomalies and issues
   */
  async analyzeScreenshot(screenshot: ScreenshotAnalysis): Promise<ScreenshotAnalysisResult> {
    try {
      const validatedScreenshot = ScreenshotAnalysisSchema.parse(screenshot);

      // Validate file size
      if (validatedScreenshot.fileSize > this.config.maxFileSize) {
        throw new Error(`Screenshot file size exceeds maximum: ${validatedScreenshot.fileSize} > ${this.config.maxFileSize}`);
      }

      // Send to AI service for visual analysis
      const analysisResult = await this.callAIService('analyze_screenshot', {
        imageData: validatedScreenshot.imageData,
        format: validatedScreenshot.format,
        dimensions: validatedScreenshot.dimensions,
        metadata: validatedScreenshot.metadata,
        analysisConfig: {
          detectErrors: true,
          detectWarnings: true,
          detectPerformanceIssues: true,
          detectSecurityIssues: true,
          confidenceThreshold: this.config.confidenceThreshold
        }
      });

      const result: ScreenshotAnalysisResult = {
        screenshotId: `screenshot_${Date.now()}`,
        anomalies: analysisResult.anomalies,
        overallAssessment: analysisResult.overallAssessment,
        processingTime: analysisResult.processingTime,
        aiModelVersion: analysisResult.aiModelVersion,
        analysisTimestamp: new Date()
      };

      this.emit('screenshot:analyzed', { screenshot: validatedScreenshot, result });
      return result;

    } catch (error) {
      console.error('Screenshot analysis failed:', error);
      throw error;
    }
  }

  /**
   * Convert screenshot analysis to triage item
   */
  async screenshotToTriageItem(
    screenshot: ScreenshotAnalysis,
    analysis: ScreenshotAnalysisResult,
    tenantId: string
  ): Promise<any> {
    const triageContent = this.formatScreenshotForTriage(screenshot, analysis);

    const triageItem = {
      title: `Screenshot Analysis: ${analysis.overallAssessment.severity} severity issue`,
      description: triageContent,
      content: JSON.stringify({ screenshot, analysis }),
      priority: this.mapSeverityToPriority(analysis.overallAssessment.severity),
      source: {
        type: 'screenshot',
        id: analysis.screenshotId,
        user_id: 'system', // Could be enhanced to track user
        session_id: `screenshot_session_${Date.now()}`,
        timestamp: screenshot.timestamp
      },
      context: {
        screenshot: screenshot,
        analysis: analysis,
        anomalies: analysis.anomalies,
        severity: analysis.overallAssessment.severity
      },
      tags: ['screenshot', analysis.overallAssessment.severity, 'visual_analysis']
    };

    // Submit to smart triage service
    const triageDecision = await smartTriageService.triageItem(
      triageContent,
      triageItem.context,
      tenantId
    );

    this.emit('screenshot:triage_created', { screenshot, analysis, triage: triageItem, decision: triageDecision });
    return { triageItem, decision: triageDecision };
  }

  private formatScreenshotForTriage(
    screenshot: ScreenshotAnalysis,
    analysis: ScreenshotAnalysisResult
  ): string {
    let content = `Screenshot Analysis Report\n`;
    content += `Severity: ${analysis.overallAssessment.severity}\n`;
    content += `Confidence: ${(analysis.overallAssessment.confidence * 100).toFixed(1)}%\n`;
    content += `Summary: ${analysis.overallAssessment.summary}\n\n`;

    if (analysis.anomalies.length > 0) {
      content += `Detected Anomalies:\n`;
      analysis.anomalies.forEach((anomaly, index) => {
        content += `${index + 1}. ${anomaly.type} (${anomaly.severity}): ${anomaly.description}\n`;
        content += `   Suggested Action: ${anomaly.suggestedAction}\n`;
        if (anomaly.relatedComponents.length > 0) {
          content += `   Related Components: ${anomaly.relatedComponents.join(', ')}\n`;
        }
        content += `\n`;
      });
    }

    if (analysis.overallAssessment.recommendedActions.length > 0) {
      content += `Recommended Actions:\n`;
      analysis.overallAssessment.recommendedActions.forEach((action, index) => {
        content += `${index + 1}. ${action}\n`;
      });
    }

    return content;
  }

  private mapSeverityToPriority(severity: string): string {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  // ===== LOG DUMP PROCESSING =====

  /**
   * Process log dump for anomaly detection
   */
  async processLogDump(logDump: LogDump): Promise<LogAnalysisResult> {
    try {
      const validatedLogDump = LogDumpSchema.parse(logDump);

      // Validate file size
      if (validatedLogDump.fileSize > this.config.maxFileSize) {
        throw new Error(`Log dump file size exceeds maximum: ${validatedLogDump.fileSize} > ${this.config.maxFileSize}`);
      }

      // Send to AI service for log analysis
      const analysisResult = await this.callAIService('analyze_logs', {
        logData: validatedLogDump.logData,
        format: validatedLogDump.format,
        source: validatedLogDump.source,
        metadata: validatedLogDump.metadata,
        analysisConfig: {
          detectErrors: true,
          detectWarnings: true,
          detectPatterns: true,
          extractEntities: true,
          confidenceThreshold: this.config.confidenceThreshold
        }
      });

      const result: LogAnalysisResult = {
        logDumpId: `logdump_${Date.now()}`,
        anomalies: analysisResult.anomalies,
        patterns: analysisResult.patterns,
        summary: analysisResult.summary,
        recommendations: analysisResult.recommendations,
        processingTime: analysisResult.processingTime,
        analysisTimestamp: new Date()
      };

      this.emit('logs:analyzed', { logDump: validatedLogDump, result });
      return result;

    } catch (error) {
      console.error('Log dump processing failed:', error);
      throw error;
    }
  }

  /**
   * Convert log analysis to triage item
   */
  async logDumpToTriageItem(
    logDump: LogDump,
    analysis: LogAnalysisResult,
    tenantId: string
  ): Promise<any> {
    const triageContent = this.formatLogAnalysisForTriage(logDump, analysis);

    // Determine priority based on most severe anomaly
    const highestSeverity = analysis.anomalies.reduce((max, anomaly) =>
      ['low', 'medium', 'high', 'critical'].indexOf(anomaly.severity) >
      ['low', 'medium', 'high', 'critical'].indexOf(max) ? anomaly.severity : max,
      'low'
    );

    const triageItem = {
      title: `Log Analysis: ${analysis.anomalies.length} anomalies detected`,
      description: triageContent,
      content: JSON.stringify({ logDump, analysis }),
      priority: this.mapSeverityToPriority(highestSeverity),
      source: {
        type: 'log_dump',
        id: analysis.logDumpId,
        user_id: 'system',
        session_id: `log_session_${Date.now()}`,
        timestamp: logDump.timestamp
      },
      context: {
        logDump: logDump,
        analysis: analysis,
        anomalyCount: analysis.anomalies.length,
        highestSeverity: highestSeverity,
        affectedComponents: analysis.summary.affectedComponents
      },
      tags: ['log_analysis', highestSeverity, 'anomaly_detection', ...analysis.summary.affectedComponents]
    };

    // Submit to smart triage service
    const triageDecision = await smartTriageService.triageItem(
      triageContent,
      triageItem.context,
      tenantId
    );

    this.emit('logs:triage_created', { logDump, analysis, triage: triageItem, decision: triageDecision });
    return { triageItem, decision: triageDecision };
  }

  private formatLogAnalysisForTriage(
    logDump: LogDump,
    analysis: LogAnalysisResult
  ): string {
    let content = `Log Analysis Report - ${logDump.source}\n`;
    content += `Time Range: ${analysis.summary.timeRange.start} to ${analysis.summary.timeRange.end}\n`;
    content += `Total Lines: ${analysis.summary.totalLines}\n`;
    content += `Errors: ${analysis.summary.errorCount}, Warnings: ${analysis.summary.warningCount}\n`;
    content += `Unique Errors: ${analysis.summary.uniqueErrors}\n`;
    content += `Affected Components: ${analysis.summary.affectedComponents.join(', ')}\n\n`;

    if (analysis.anomalies.length > 0) {
      content += `Top Anomalies:\n`;
      // Show top 5 most critical anomalies
      const topAnomalies = analysis.anomalies
        .sort((a, b) => ['low', 'medium', 'high', 'critical'].indexOf(b.severity) -
                        ['low', 'medium', 'high', 'critical'].indexOf(a.severity))
        .slice(0, 5);

      topAnomalies.forEach((anomaly, index) => {
        content += `${index + 1}. ${anomaly.type} (${anomaly.severity}): ${anomaly.message}\n`;
        if (anomaly.lineNumber) {
          content += `   Line ${anomaly.lineNumber}: ${anomaly.timestamp}\n`;
        }
        content += `\n`;
      });
    }

    if (analysis.patterns.length > 0) {
      content += `Detected Patterns:\n`;
      analysis.patterns.slice(0, 3).forEach((pattern, index) => {
        content += `${index + 1}. ${pattern.pattern} (${pattern.frequency} occurrences)\n`;
        content += `   ${pattern.description}\n\n`;
      });
    }

    if (analysis.recommendations.length > 0) {
      content += `Recommendations:\n`;
      analysis.recommendations.forEach((recommendation, index) => {
        content += `${index + 1}. ${recommendation}\n`;
      });
    }

    return content;
  }

  // ===== COMBINED MULTIMODAL ANALYSIS =====

  /**
   * Perform comprehensive multimodal triage analysis
   */
  async performMultimodalAnalysis(
    voiceCommand?: VoiceCommand,
    screenshot?: ScreenshotAnalysis,
    logDump?: LogDump,
    tenantId: string = 'default_tenant'
  ): Promise<MultimodalAnalysisResult> {
    const sessionId = `multimodal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const analysisResult: MultimodalAnalysisResult = {
      sessionId,
      integratedAssessment: {
        overallSeverity: 'low',
        confidence: 0,
        summary: '',
        impact: {
          affectedSystems: [],
          businessImpact: 'Unknown'
        },
        timeline: {
          detection: new Date()
        }
      },
      recommendedActions: [],
      automatedResponses: []
    };

    try {
      // Process each modality in parallel
      const analysisPromises: Promise<any>[] = [];

      if (voiceCommand && this.config.enableVoiceCommands) {
        analysisPromises.push(
          this.processVoiceCommand(voiceCommand).then(intent => ({
            type: 'voice',
            command: voiceCommand,
            intent
          }))
        );
      }

      if (screenshot && this.config.enableScreenshotAnalysis) {
        analysisPromises.push(
          this.analyzeScreenshot(screenshot).then(result => ({
            type: 'screenshot',
            screenshot,
            analysis: result
          }))
        );
      }

      if (logDump && this.config.enableLogDumpProcessing) {
        analysisPromises.push(
          this.processLogDump(logDump).then(result => ({
            type: 'log',
            logDump,
            analysis: result
          }))
        );
      }

      // Wait for all analyses to complete
      const results = await Promise.allSettled(analysisPromises);

      // Process results and integrate assessments
      const successfulResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);

      // Extract voice analysis
      const voiceResult = successfulResults.find(r => r.type === 'voice');
      if (voiceResult) {
        analysisResult.voiceAnalysis = {
          command: voiceResult.command,
          intent: voiceResult.intent,
          extractedInfo: voiceResult.intent.parameters
        };
      }

      // Extract screenshot analysis
      const screenshotResult = successfulResults.find(r => r.type === 'screenshot');
      if (screenshotResult) {
        analysisResult.screenshotAnalysis = screenshotResult.analysis;
      }

      // Extract log analysis
      const logResult = successfulResults.find(r => r.type === 'log');
      if (logResult) {
        analysisResult.logAnalysis = logResult.analysis;
      }

      // Perform integrated assessment
      analysisResult.integratedAssessment = this.integrateAssessments(
        voiceResult,
        screenshotResult,
        logResult
      );

      // Generate recommended actions
      analysisResult.recommendedActions = this.generateMultimodalActions(
        analysisResult.integratedAssessment,
        successfulResults
      );

      // Execute automated responses if enabled
      if (this.config.autoExecuteHighConfidence &&
          analysisResult.integratedAssessment.confidence >= this.config.confidenceThreshold) {
        analysisResult.automatedResponses = await this.executeAutomatedResponses(
          analysisResult.recommendedActions
        );
      }

      // Store session
      this.activeSessions.set(sessionId, analysisResult);

      this.emit('multimodal:analysis_complete', analysisResult);
      return analysisResult;

    } catch (error) {
      console.error('Multimodal analysis failed:', error);
      analysisResult.integratedAssessment.summary = `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return analysisResult;
    }
  }

  private integrateAssessments(
    voiceResult?: any,
    screenshotResult?: any,
    logResult?: any
  ): MultimodalAnalysisResult['integratedAssessment'] {
    const severities = [];
    const confidences = [];
    const summaries = [];
    const affectedSystems = new Set<string>();

    // Analyze voice intent
    if (voiceResult) {
      severities.push(this.mapUrgencyToSeverity(voiceResult.intent.urgency));
      confidences.push(voiceResult.intent.confidence);
      summaries.push(`Voice command indicates ${voiceResult.intent.intent} with ${voiceResult.intent.urgency} urgency`);

      // Extract affected systems from voice entities
      voiceResult.intent.entities.forEach((entity: any) => {
        if (entity.type === 'system' || entity.type === 'service' || entity.type === 'component') {
          affectedSystems.add(entity.value);
        }
      });
    }

    // Analyze screenshot anomalies
    if (screenshotResult) {
      severities.push(this.mapSeverityStringToNumber(screenshotResult.analysis.overallAssessment.severity));
      confidences.push(screenshotResult.analysis.overallAssessment.confidence);
      summaries.push(screenshotResult.analysis.overallAssessment.summary);

      screenshotResult.analysis.anomalies.forEach((anomaly: any) => {
        anomaly.relatedComponents.forEach((component: string) => affectedSystems.add(component));
      });
    }

    // Analyze log anomalies
    if (logResult) {
      const highestSeverity = logResult.analysis.anomalies.reduce((max: string, anomaly: any) =>
        ['low', 'medium', 'high', 'critical'].indexOf(anomaly.severity) >
        ['low', 'medium', 'high', 'critical'].indexOf(max) ? anomaly.severity : max,
        'low'
      );
      severities.push(this.mapSeverityStringToNumber(highestSeverity));
      confidences.push(0.8); // Assume good confidence for log analysis
      summaries.push(`${logResult.analysis.anomalies.length} anomalies detected in logs`);

      logResult.analysis.summary.affectedComponents.forEach((component: string) =>
        affectedSystems.add(component)
      );
    }

    // Calculate integrated assessment
    const overallSeverity = this.calculateOverallSeverity(severities);
    const avgConfidence = confidences.length > 0 ?
      confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length : 0;

    const integratedSummary = summaries.length > 0 ?
      summaries.join('. ') : 'No issues detected';

    return {
      overallSeverity: this.mapSeverityNumberToString(overallSeverity),
      confidence: avgConfidence,
      summary: integratedSummary,
      impact: {
        affectedSystems: Array.from(affectedSystems),
        businessImpact: this.assessBusinessImpact(overallSeverity, Array.from(affectedSystems))
      },
      timeline: {
        detection: new Date()
      }
    };
  }

  private generateMultimodalActions(
    assessment: MultimodalAnalysisResult['integratedAssessment'],
    results: any[]
  ): MultimodalAnalysisResult['recommendedActions'] {
    const actions: MultimodalAnalysisResult['recommendedActions'] = [];

    // Generate actions based on severity
    switch (assessment.overallSeverity) {
      case 'critical':
        actions.push({
          id: 'immediate_escalation',
          type: 'immediate',
          description: 'Escalate to on-call engineer immediately',
          priority: 5,
          estimatedTime: 5,
          requiredResources: ['on_call_engineer', 'incident_manager'],
          successCriteria: 'Issue escalated and acknowledged within 5 minutes'
        });
        actions.push({
          id: 'system_isolation',
          type: 'immediate',
          description: 'Isolate affected systems to prevent spread',
          priority: 5,
          estimatedTime: 15,
          requiredResources: ['infrastructure_team'],
          successCriteria: 'Affected systems isolated successfully'
        });
        break;

      case 'high':
        actions.push({
          id: 'rapid_investigation',
          type: 'immediate',
          description: 'Begin rapid investigation of root cause',
          priority: 4,
          estimatedTime: 30,
          requiredResources: ['devops_engineer'],
          successCriteria: 'Root cause identified or investigation plan established'
        });
        break;

      case 'medium':
        actions.push({
          id: 'scheduled_investigation',
          type: 'short_term',
          description: 'Schedule investigation during next business hours',
          priority: 3,
          estimatedTime: 120,
          requiredResources: ['development_team'],
          successCriteria: 'Issue documented and investigation scheduled'
        });
        break;

      case 'low':
        actions.push({
          id: 'monitoring_increase',
          type: 'short_term',
          description: 'Increase monitoring on affected systems',
          priority: 2,
          estimatedTime: 60,
          requiredResources: ['monitoring_team'],
          successCriteria: 'Enhanced monitoring implemented'
        });
        break;
    }

    // Add modality-specific actions
    results.forEach(result => {
      switch (result.type) {
        case 'voice':
          if (result.intent.intent === 'restart_service') {
            actions.push({
              id: 'service_restart',
              type: 'immediate',
              description: 'Restart requested service',
              priority: 4,
              estimatedTime: 10,
              requiredResources: ['devops_engineer'],
              successCriteria: 'Service restarted successfully'
            });
          }
          break;

        case 'screenshot':
          result.analysis.anomalies.forEach((anomaly: any, index: number) => {
            if (anomaly.suggestedAction) {
              actions.push({
                id: `screenshot_action_${index}`,
                type: 'short_term',
                description: anomaly.suggestedAction,
                priority: this.mapSeverityToPriorityNumber(anomaly.severity),
                estimatedTime: 30,
                requiredResources: ['development_team'],
                successCriteria: `Action completed: ${anomaly.suggestedAction}`
              });
            }
          });
          break;

        case 'log':
          result.analysis.recommendations.forEach((rec: string, index: number) => {
            actions.push({
              id: `log_recommendation_${index}`,
              type: 'short_term',
              description: rec,
              priority: 3,
              estimatedTime: 60,
              requiredResources: ['development_team'],
              successCriteria: `Recommendation implemented: ${rec}`
            });
          });
          break;
      }
    });

    return actions.sort((a, b) => b.priority - a.priority);
  }

  private async executeAutomatedResponses(
    actions: MultimodalAnalysisResult['recommendedActions']
  ): Promise<MultimodalAnalysisResult['automatedResponses']> {
    const responses: MultimodalAnalysisResult['automatedResponses'] = [];

    // Execute only high-priority immediate actions
    const executableActions = actions.filter(action =>
      action.type === 'immediate' && action.priority >= 4
    );

    for (const action of executableActions) {
      try {
        // Send to MCP agents for execution
        const executionResult = await this.executeActionViaMCP(action);

        responses.push({
          action: action.description,
          status: executionResult.success ? 'completed' : 'failed',
          result: executionResult.message,
          timestamp: new Date()
        });

      } catch (error) {
        responses.push({
          action: action.description,
          status: 'failed',
          result: error instanceof Error ? error.message : 'Execution failed',
          timestamp: new Date()
        });
      }
    }

    return responses;
  }

  private async executeActionViaMCP(action: MultimodalAnalysisResult['recommendedActions'][0]): Promise<{
    success: boolean;
    message: string;
  }> {
    // Find appropriate agent for action execution
    const agents = mcpProtocolService.getAgents().filter(agent =>
      agent.status === 'ACTIVE' &&
      agent.capabilities.some(cap =>
        cap.name.includes('execution') ||
        cap.name.includes('automation') ||
        cap.name.includes(action.description.toLowerCase().split(' ')[0])
      )
    );

    if (agents.length === 0) {
      return { success: false, message: 'No suitable agent found for execution' };
    }

    const primaryAgent = agents[0];

    try {
      const message: Omit<MCPMessage, 'id' | 'timestamp'> = {
        type: 'request',
        method: 'execute_action',
        params: {
          actionId: action.id,
          actionDescription: action.description,
          priority: action.priority,
          requiredResources: action.requiredResources,
          successCriteria: action.successCriteria
        }
      };

      await mcpProtocolService.sendMessage(primaryAgent.id, message);

      return { success: true, message: `Action sent to agent ${primaryAgent.name}` };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  }

  // ===== UTILITY METHODS =====

  private async callAIService(endpoint: string, data: any): Promise<any> {
    // This would integrate with the AI SDK service
    // For now, return mock responses
    console.log(`Calling AI service: ${endpoint}`, data);

    // Mock AI service responses
    switch (endpoint) {
      case 'analyze_voice_intent':
        return {
          intent: 'investigate_error',
          confidence: 0.85,
          parameters: { system: 'database', error_type: 'connection' },
          urgency: 'high',
          entities: [
            { type: 'system', value: 'database', confidence: 0.9, position: { start: 0, end: 8 } }
          ]
        };

      case 'analyze_screenshot':
        return {
          anomalies: [
            {
              type: 'error_message',
              severity: 'high',
              confidence: 0.92,
              location: { x: 100, y: 200, width: 300, height: 50 },
              description: 'Database connection error detected',
              suggestedAction: 'Check database connectivity and restart connection pool',
              relatedComponents: ['database', 'connection_pool']
            }
          ],
          overallAssessment: {
            severity: 'high',
            confidence: 0.88,
            summary: 'Critical database connectivity issue detected in UI',
            recommendedActions: [
              'Investigate database connection pool',
              'Check database server status',
              'Review recent database migrations'
            ]
          },
          processingTime: 1250,
          aiModelVersion: 'visual-analysis-v2.1'
        };

      case 'analyze_logs':
        return {
          anomalies: [
            {
              type: 'error',
              severity: 'critical',
              timestamp: '2025-01-15T10:30:15Z',
              lineNumber: 1250,
              message: 'Database connection timeout after 30 seconds',
              pattern: 'timeout.*database',
              frequency: 15
            }
          ],
          patterns: [
            {
              pattern: 'Connection timeout',
              frequency: 23,
              severity: 'high',
              description: 'Recurring database connection timeouts'
            }
          ],
          summary: {
            totalLines: 5000,
            errorCount: 45,
            warningCount: 120,
            uniqueErrors: 12,
            timeRange: {
              start: '2025-01-15T10:00:00Z',
              end: '2025-01-15T11:00:00Z'
            },
            affectedComponents: ['database', 'api_gateway', 'user_service']
          },
          recommendations: [
            'Increase database connection pool size',
            'Implement connection retry logic',
            'Add circuit breaker pattern',
            'Monitor database performance metrics'
          ],
          processingTime: 890
        };

      default:
        throw new Error(`Unknown AI service endpoint: ${endpoint}`);
    }
  }

  private mapUrgencyToSeverity(urgency: string): number {
    switch (urgency) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private mapSeverityStringToNumber(severity: string): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  private mapSeverityNumberToString(severity: number): 'low' | 'medium' | 'high' | 'critical' {
    if (severity >= 4) return 'critical';
    if (severity >= 3) return 'high';
    if (severity >= 2) return 'medium';
    return 'low';
  }

  private mapSeverityToPriorityNumber(severity: string): number {
    switch (severity) {
      case 'critical': return 5;
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 2;
      default: return 3;
    }
  }

  private calculateOverallSeverity(severities: number[]): number {
    if (severities.length === 0) return 1;
    // Use weighted average with higher weight for more severe issues
    const weightedSum = severities.reduce((sum, severity) => sum + severity * severity, 0);
    const totalWeight = severities.reduce((sum, severity) => sum + severity, 0);
    return totalWeight > 0 ? weightedSum / totalWeight : 1;
  }

  private assessBusinessImpact(severity: number, affectedSystems: string[]): string {
    if (severity >= 4) {
      return affectedSystems.length > 3 ?
        'Critical: Multiple systems affected, potential service outage' :
        'Critical: Core system affected, immediate business impact';
    }
    if (severity >= 3) {
      return affectedSystems.length > 2 ?
        'High: Multiple systems degraded, reduced service capacity' :
        'High: Important system affected, degraded performance';
    }
    if (severity >= 2) {
      return 'Medium: System performance impacted, monitor closely';
    }
    return 'Low: Minor issue detected, no immediate business impact';
  }

  // ===== ACTION EXECUTION METHODS =====

  private async investigateError(parameters: any): Promise<void> {
    console.log('Executing: Investigate error', parameters);
    // Implementation would send to appropriate agent
  }

  private async checkSystemStatus(parameters: any): Promise<void> {
    console.log('Executing: Check system status', parameters);
    // Implementation would query system health
  }

  private async restartService(parameters: any): Promise<void> {
    console.log('Executing: Restart service', parameters);
    // Implementation would send restart command to agent
  }

  private async analyzeLogs(parameters: any): Promise<void> {
    console.log('Executing: Analyze logs', parameters);
    // Implementation would trigger log analysis
  }

  private async createIncident(parameters: any): Promise<void> {
    console.log('Executing: Create incident', parameters);
    // Implementation would create incident in ticketing system
  }

  private async notifyTeam(parameters: any): Promise<void> {
    console.log('Executing: Notify team', parameters);
    // Implementation would send notifications
  }

  // ===== PUBLIC API METHODS =====

  /**
   * Get active multimodal sessions
   */
  getActiveSessions(): Map<string, MultimodalAnalysisResult> {
    return this.activeSessions;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): MultimodalAnalysisResult | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Clean up old sessions
   */
  cleanupSessions(maxAgeHours: number = 24): number {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const sessionTime = new Date(session.integratedAssessment.timeline.detection).getTime();
      if (sessionTime < cutoffTime) {
        this.activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

// Export singleton instance with default configuration
export const multimodalTriageService = new MultimodalTriageService({
  enableVoiceCommands: true,
  enableScreenshotAnalysis: true,
  enableLogDumpProcessing: true,
  maxProcessingTime: 30000, // 30 seconds
  confidenceThreshold: 0.8,
  autoExecuteHighConfidence: true,
  supportedLanguages: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  aiModelEndpoint: 'http://localhost:8000/ai',
  voiceProcessingEnabled: true,
  visualProcessingEnabled: true,
  logProcessingEnabled: true
});
