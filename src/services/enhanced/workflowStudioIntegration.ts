/**
 * Workflow Studio Integration Service
 *
 * API-based integration between Auterity Workflow Studio and Error IQ
 * Handles cross-system communication and data synchronization
 */

import { enhancedAIService } from './enhancedAIService';
import { enhancedAIService as errorIQEnhancedAIService } from '../../../auterity-error-iq/frontend/src/services/enhanced/enhancedAIService';

interface WorkflowStudioConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

interface IntegrationMessage {
  id: string;
  type: 'workflow_sync' | 'error_analysis' | 'ai_enhancement' | 'data_exchange';
  source: 'workflow_studio' | 'error_iq';
  payload: any;
  correlationId?: string;
  timestamp: Date;
}

class WorkflowStudioIntegrationService {
  private config: WorkflowStudioConfig;
  private messageQueue: IntegrationMessage[] = [];
  private isConnected = false;

  constructor(config: WorkflowStudioConfig) {
    this.config = config;
  }

  // Establish connection with Workflow Studio
  async connect(): Promise<void> {
    try {
      // Test connection
      const response = await fetch(`${this.config.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.config.timeout
      });

      if (response.ok) {
        this.isConnected = true;
        console.log('✅ Connected to Workflow Studio');
      } else {
        throw new Error(`Connection failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to connect to Workflow Studio:', error);
      throw error;
    }
  }

  // Sync workflow data between systems
  async syncWorkflow(workflowId: string, direction: 'to_studio' | 'from_studio'): Promise<any> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      if (direction === 'to_studio') {
        // Get workflow from Error IQ and send to Workflow Studio
        const workflowData = await this.getWorkflowFromErrorIQ(workflowId);
        return await this.sendToWorkflowStudio('/workflows/sync', workflowData);
      } else {
        // Get workflow from Workflow Studio and import to Error IQ
        const workflowData = await this.getFromWorkflowStudio(`/workflows/${workflowId}`);
        return await this.importToErrorIQ(workflowData);
      }
    } catch (error) {
      console.error('Workflow sync failed:', error);
      throw error;
    }
  }

  // Enhanced AI analysis across systems
  async crossSystemAIAnalysis(data: any, analysisType: string): Promise<any> {
    try {
      // Get AI insights from both systems
      const [studioAnalysis, errorIQAnalysis] = await Promise.allSettled([
        this.requestStudioAIAnalysis(data, analysisType),
        errorIQEnhancedAIService.analyzeError(data, { analysisType: analysisType as any })
      ]);

      // Combine and enhance results
      const combinedResults = {
        workflowStudio: studioAnalysis.status === 'fulfilled' ? studioAnalysis.value : null,
        errorIQ: errorIQAnalysis.status === 'fulfilled' ? errorIQAnalysis.value : null,
        crossSystemInsights: await this.generateCrossSystemInsights(
          studioAnalysis.status === 'fulfilled' ? studioAnalysis.value : null,
          errorIQAnalysis.status === 'fulfilled' ? errorIQAnalysis.value : null
        ),
        timestamp: new Date().toISOString()
      };

      return combinedResults;
    } catch (error) {
      console.error('Cross-system AI analysis failed:', error);
      throw error;
    }
  }

  // Real-time data synchronization
  async syncRealTimeData(dataType: string, data: any): Promise<void> {
    const message: IntegrationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'data_exchange',
      source: 'error_iq',
      payload: { dataType, data },
      timestamp: new Date()
    };

    this.messageQueue.push(message);

    // Send to Workflow Studio via WebSocket or HTTP
    try {
      await this.sendToWorkflowStudio('/realtime/sync', message);
    } catch (error) {
      console.error('Real-time sync failed:', error);
      // Queue for retry
    }
  }

  // Error correlation across systems
  async correlateErrors(errorPattern: any): Promise<any> {
    try {
      // Check both systems for similar error patterns
      const [studioErrors, errorIQErrors] = await Promise.allSettled([
        this.queryWorkflowStudioErrors(errorPattern),
        this.queryErrorIQErrors(errorPattern)
      ]);

      // Use enhanced AI to find correlations
      const correlationAnalysis = await enhancedAIService.generateText(
        `Analyze error correlation between systems: ${JSON.stringify({
          studioErrors: studioErrors.status === 'fulfilled' ? studioErrors.value : [],
          errorIQErrors: errorIQErrors.status === 'fulfilled' ? errorIQErrors.value : []
        })}`,
        { promptName: 'error_correlation_analysis' }
      );

      return {
        correlations: this.analyzeCorrelations(
          studioErrors.status === 'fulfilled' ? studioErrors.value : [],
          errorIQErrors.status === 'fulfilled' ? errorIQErrors.value : []
        ),
        aiAnalysis: correlationAnalysis,
        recommendations: await this.generateCorrelationRecommendations(
          studioErrors.status === 'fulfilled' ? studioErrors.value : [],
          errorIQErrors.status === 'fulfilled' ? errorIQErrors.value : []
        )
      };
    } catch (error) {
      console.error('Error correlation failed:', error);
      throw error;
    }
  }

  private async getWorkflowFromErrorIQ(workflowId: string): Promise<any> {
    // Implementation to get workflow data from Error IQ
    return { workflowId, source: 'error_iq', timestamp: new Date() };
  }

  private async sendToWorkflowStudio(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Workflow Studio API error: ${response.status}`);
    }

    return response.json();
  }

  private async getFromWorkflowStudio(endpoint: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Workflow Studio API error: ${response.status}`);
    }

    return response.json();
  }

  private async importToErrorIQ(data: any): Promise<any> {
    // Implementation to import workflow to Error IQ
    return { success: true, importedId: data.workflowId };
  }

  private async requestStudioAIAnalysis(data: any, analysisType: string): Promise<any> {
    return await this.sendToWorkflowStudio('/ai/analyze', { data, analysisType });
  }

  private async generateCrossSystemInsights(studioResult: any, errorIQResult: any): Promise<any> {
    const prompt = `
Analyze insights from both systems and generate cross-system recommendations:

Workflow Studio Results: ${JSON.stringify(studioResult)}
Error IQ Results: ${JSON.stringify(errorIQResult)}

Provide:
1. Conflicting insights and resolution strategies
2. Complementary insights that enhance each other
3. Unified recommendations
4. Priority actions
`;

    return await enhancedAIService.generateText(prompt, {
      promptName: 'cross_system_insights'
    });
  }

  private async queryWorkflowStudioErrors(pattern: any): Promise<any[]> {
    return await this.sendToWorkflowStudio('/errors/search', pattern);
  }

  private async queryErrorIQErrors(pattern: any): Promise<any[]> {
    // Implementation to search errors in Error IQ
    return [];
  }

  private analyzeCorrelations(studioErrors: any[], errorIQErrors: any[]): any[] {
    // Implementation to find correlations between error sets
    return [];
  }

  private async generateCorrelationRecommendations(studioErrors: any[], errorIQErrors: any[]): Promise<any[]> {
    // Implementation to generate recommendations based on correlations
    return [];
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get integration status
  getStatus(): any {
    return {
      connected: this.isConnected,
      messageQueueLength: this.messageQueue.length,
      config: { ...this.config, apiKey: '***' } // Hide sensitive data
    };
  }
}

// Configuration
const WORKFLOW_STUDIO_CONFIG: WorkflowStudioConfig = {
  baseUrl: import.meta.env.VITE_WORKFLOW_STUDIO_URL || 'http://localhost:3001',
  apiKey: import.meta.env.VITE_WORKFLOW_STUDIO_API_KEY || '',
  timeout: parseInt(import.meta.env.VITE_INTEGRATION_TIMEOUT || '30000')
};

// Singleton instance
export const workflowStudioIntegration = new WorkflowStudioIntegrationService(WORKFLOW_STUDIO_CONFIG);

// Export types
export type { WorkflowStudioConfig, IntegrationMessage };
