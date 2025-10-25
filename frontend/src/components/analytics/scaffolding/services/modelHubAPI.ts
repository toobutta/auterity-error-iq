/**
 * ModelHub API Service - AI/ML Analytics & Optimization
 */

import { MLAnalytics, ModelPerformance, PromptAnalytics, ExperimentResult } from '../types/ml.types';

class ModelHubAPIService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = '/api/modelhub', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`ModelHub API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ML Analytics Overview
  async getMLAnalytics(
    dateRange?: { from: Date; to: Date },
    modelIds?: string[]
  ): Promise<MLAnalytics> {
    const params = new URLSearchParams();

    if (dateRange) {
      if (dateRange.from) params.append('dateFrom', dateRange.from.toISOString());
      if (dateRange.to) params.append('dateTo', dateRange.to.toISOString());
    }
    if (modelIds) {
      modelIds.forEach(id => params.append('modelId', id));
    }

    const queryString = params.toString();
    const endpoint = queryString ? `?${queryString}` : '';

    return this.request(endpoint);
  }

  // Model Performance
  async getModelPerformance(
    modelId?: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<ModelPerformance[]> {
    const params = new URLSearchParams();

    if (modelId) params.append('modelId', modelId);
    if (dateRange) {
      if (dateRange.from) params.append('dateFrom', dateRange.from.toISOString());
      if (dateRange.to) params.append('dateTo', dateRange.to.toISOString());
    }

    const queryString = params.toString();
    const endpoint = `/performance${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Prompt Analytics
  async getPromptAnalytics(
    dateRange?: { from: Date; to: Date },
    tags?: string[]
  ): Promise<PromptAnalytics> {
    const params = new URLSearchParams();

    if (dateRange) {
      if (dateRange.from) params.append('dateFrom', dateRange.from.toISOString());
      if (dateRange.to) params.append('dateTo', dateRange.to.toISOString());
    }
    if (tags) {
      tags.forEach(tag => params.append('tag', tag));
    }

    const queryString = params.toString();
    const endpoint = `/prompts/analytics${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Experiment Results
  async getExperimentResults(
    experimentId?: string,
    status?: string
  ): Promise<ExperimentResult[]> {
    const params = new URLSearchParams();

    if (experimentId) params.append('experimentId', experimentId);
    if (status) params.append('status', status);

    const queryString = params.toString();
    const endpoint = `/experiments${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Track Prompt/Output
  async trackPromptOutput(promptOutputData: {
    prompt: string;
    output: string;
    modelId: string;
    modelVersion?: string;
    tokensUsed: number;
    responseTimeMs: number;
    confidenceScore?: number;
    userRating?: number;
    userFeedback?: string;
    tags?: string[];
    sessionId?: string;
  }): Promise<{ id: string }> {
    return this.request('/prompts/track', {
      method: 'POST',
      body: JSON.stringify(promptOutputData),
    });
  }

  // Submit Feedback
  async submitFeedback(feedbackData: {
    promptOutputId: string;
    rating?: number;
    comment?: string;
    feedbackType: 'rating' | 'comment' | 'correction';
    context?: Record<string, any>;
  }): Promise<{ feedbackId: string }> {
    return this.request('/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  // Model Health Check
  async getModelHealth(modelId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (modelId) params.append('modelId', modelId);

    const queryString = params.toString();
    const endpoint = `/health${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Cost Analysis
  async getCostAnalysis(
    dateRange?: { from: Date; to: Date },
    modelIds?: string[]
  ): Promise<any> {
    const params = new URLSearchParams();

    if (dateRange) {
      if (dateRange.from) params.append('dateFrom', dateRange.from.toISOString());
      if (dateRange.to) params.append('dateTo', dateRange.to.toISOString());
    }
    if (modelIds) {
      modelIds.forEach(id => params.append('modelId', id));
    }

    const queryString = params.toString();
    const endpoint = `/costs${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Optimization Suggestions
  async getOptimizationSuggestions(
    modelId?: string,
    optimizationType?: 'performance' | 'cost' | 'quality'
  ): Promise<any[]> {
    const params = new URLSearchParams();

    if (modelId) params.append('modelId', modelId);
    if (optimizationType) params.append('type', optimizationType);

    const queryString = params.toString();
    const endpoint = `/optimization/suggestions${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Start Model Tuning
  async startModelTuning(tuningConfig: {
    modelId: string;
    tuningType: 'parameter' | 'training' | 'feedback';
    selectedPromptOutputIds: string[];
    parameters?: Record<string, any>;
    sessionName?: string;
    description?: string;
  }): Promise<{ sessionId: string }> {
    return this.request('/tuning/sessions', {
      method: 'POST',
      body: JSON.stringify(tuningConfig),
    });
  }

  // Get Tuning Session Status
  async getTuningSessionStatus(sessionId: string): Promise<any> {
    return this.request(`/tuning/sessions/${sessionId}`);
  }

  // Apply Tuning Results
  async applyTuningResults(sessionId: string): Promise<{ success: boolean }> {
    return this.request(`/tuning/sessions/${sessionId}/apply`, {
      method: 'POST',
    });
  }

  // Model Comparison
  async compareModels(config: {
    modelIds: string[];
    metrics: string[];
    dateRange?: { from: Date; to: Date };
    baselineModel?: string;
  }): Promise<any> {
    return this.request('/models/compare', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Pattern Discovery
  async discoverPatterns(config: {
    promptOutputIds?: string[];
    minOccurrences?: number;
    patternType?: 'template' | 'category' | 'intent';
    dateRange?: { from: Date; to: Date };
  }): Promise<any[]> {
    return this.request('/patterns/discover', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Export ML Data
  async exportMLData(
    format: 'csv' | 'json' | 'pdf',
    dataType: 'prompts' | 'performance' | 'experiments' | 'costs',
    filters?: Record<string, any>
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    params.append('type', dataType);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    const url = `${this.baseUrl}/export?${params}`;
    const response = await fetch(url, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  }

  // Real-time ML Subscription
  async subscribeToMLUpdates(
    callback: (update: any) => void,
    filters?: {
      modelIds?: string[];
      eventTypes?: string[];
    }
  ): Promise<() => void> {
    // WebSocket connection for real-time ML updates
    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/realtime';

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Send subscription filters
        if (filters) {
          ws.send(JSON.stringify({ type: 'subscribe', filters }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          callback(update);
        } catch (error) {
          console.error('Failed to parse ML real-time update:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('ML WebSocket error:', error);
      };

      // Return unsubscribe function
      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('Failed to establish ML WebSocket connection:', error);
      // Fallback to polling
      return this.setupMLPollingFallback(callback, filters);
    }
  }

  private setupMLPollingFallback(
    callback: (update: any) => void,
    filters?: { modelIds?: string[]; eventTypes?: string[] }
  ): () => void {
    const poll = async () => {
      try {
        const analytics = await this.getMLAnalytics();
        callback({
          type: 'ml_analytics_update',
          data: analytics,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('ML polling fallback failed:', error);
      }
    };

    // Poll every 30 seconds
    const intervalId = setInterval(poll, 30000);

    // Initial poll
    poll();

    return () => {
      clearInterval(intervalId);
    };
  }
}

// Singleton instance
export const modelHubAPI = new ModelHubAPIService();
export default modelHubAPI;
