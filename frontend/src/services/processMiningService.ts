import { apiClient } from './apiClient';

export interface ProcessMiningRequest {
  days_back?: number;
  min_support?: number;
  min_confidence?: number;
}

export interface ProcessPattern {
  pattern_id: string;
  pattern_type: string;
  steps: string[];
  frequency: number;
  avg_duration: number;
  success_rate: number;
  confidence: number;
  support: number;
  first_seen: string;
  last_seen: string;
  metadata: Record<string, any>;
}

export interface BottleneckAnalysis {
  step_name: string;
  avg_duration: number;
  max_duration: number;
  frequency: number;
  impact_score: number;
  recommendations: string[];
}

export interface ProcessMiningResponse {
  workflow_id: string;
  analysis_period: any;
  total_executions: number;
  patterns_discovered: ProcessPattern[];
  bottlenecks: BottleneckAnalysis[];
  efficiency_score: number;
  optimization_opportunities: string[];
  generated_at: string;
}

export class ProcessMiningService {
  private baseUrl = '/process-mining';

  async analyzeWorkflow(
    workflowId: string,
    request: ProcessMiningRequest = {}
  ): Promise<ProcessMiningResponse> {
    try {
      const response = await apiClient.post(
        `${this.baseUrl}/analyze/${workflowId}`,
        request
      );
      return response.data;
    } catch (error) {

      throw new Error('Failed to analyze workflow patterns');
    }
  }

  async getCachedAnalysis(workflowId: string): Promise<ProcessMiningResponse | null> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/analyze/${workflowId}/cached`
      );
      return response.data || null;
    } catch (error) {

      return null;
    }
  }

  async getHealthStatus(): Promise<{ status: string; service: string; version: string }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {

      throw new Error('Process mining service unavailable');
    }
  }

  // Utility methods for data transformation
  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  }

  formatFrequency(count: number, total: number): string {
    const percentage = ((count / total) * 100).toFixed(1);
    return `${count} (${percentage}%)`;
  }

  getEfficiencyColor(score: number): string {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  }

  getEfficiencyBadge(score: number): 'default' | 'secondary' | 'destructive' {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'destructive';
  }

  getPatternTypeColor(type: string): string {
    switch (type.toLowerCase()) {
      case 'sequence':
        return 'bg-blue-100 text-blue-800';
      case 'parallel':
        return 'bg-green-100 text-green-800';
      case 'choice':
        return 'bg-yellow-100 text-yellow-800';
      case 'loop':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getBottleneckSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  getBottleneckSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
}


