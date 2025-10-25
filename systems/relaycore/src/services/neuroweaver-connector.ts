/**
 * RelayCore NeuroWeaver Connector
 * Handles communication with NeuroWeaver performance monitoring
 */

import axios from "axios";
import { logger } from "../utils/logger";

export interface PerformanceFeedback {
  modelId: string;
  requestId: string;
  accuracy: number;
  latency: number;
  userSatisfaction?: number;
  contextMatch: number;
}

export interface ModelSwitchRequest {
  currentModel: string;
  targetModel?: string;
  reason: string;
  switchType: "immediate" | "gradual";
}

export class NeuroWeaverConnector {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl =
      process.env.NEUROWEAVER_API_URL || "http://neuroweaver-backend:8001";
    this.apiKey = process.env.NEUROWEAVER_API_KEY || "";
  }

  async sendPerformanceFeedback(feedback: PerformanceFeedback): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/performance/models/${feedback.modelId}/metrics`,
        {
          accuracy_score: feedback.accuracy,
          latency_ms: feedback.latency,
          throughput_rps: 1.0, // Calculated elsewhere
          cost_per_request: 0.001, // Calculated elsewhere
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        },
      );

      logger.debug(`Performance feedback sent for model ${feedback.modelId}`);
    } catch (error) {
      logger.error(`Failed to send performance feedback: ${error}`);
      // Don't throw - performance feedback is non-critical
    }
  }

  async requestModelSwitch(
    switchRequest: ModelSwitchRequest,
  ): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/performance/models/${switchRequest.currentModel}/switch`,
        {
          target_model: switchRequest.targetModel,
          reason: switchRequest.reason,
          switch_type: switchRequest.switchType,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      logger.info(
        `Model switch requested: ${switchRequest.currentModel} -> ${switchRequest.targetModel}`,
      );
      return response.data.success;
    } catch (error) {
      logger.error(`Failed to request model switch: ${error}`);
      return false;
    }
  }

  async getModelHealth(modelId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/performance/models/${modelId}/health`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 5000,
        },
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to get model health for ${modelId}: ${error}`);
      return null;
    }
  }

  async updateModelThresholds(
    modelId: string,
    thresholds: {
      min_accuracy: number;
      max_latency_ms: number;
      min_throughput_rps: number;
      max_cost_per_request: number;
    },
  ): Promise<boolean> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/api/v1/performance/models/${modelId}/thresholds`,
        thresholds,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        },
      );

      logger.info(`Updated thresholds for model ${modelId}`);
      return response.data.success;
    } catch (error) {
      logger.error(`Failed to update thresholds for ${modelId}: ${error}`);
      return false;
    }
  }
}

