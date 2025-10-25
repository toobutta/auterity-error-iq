/**
 * RelayCore Metrics Collector
 * Collects and stores metrics for AI requests, performance, and costs
 */

import { logger } from "../utils/logger";
import { DatabaseConnection } from "./database";
import {
  AIRequest,
  AIResponse,
  RoutingDecision,
  MetricsData,
} from "../models/request";

export interface SystemMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_latency: number;
  total_cost: number;
  requests_by_provider: Record<string, number>;
  requests_by_model: Record<string, number>;
  error_rate: number;
  uptime_percentage: number;
}

export interface ProviderMetrics {
  provider: string;
  total_requests: number;
  successful_requests: number;
  average_latency: number;
  average_cost: number;
  error_rate: number;
  models: Record<
    string,
    {
      requests: number;
      average_latency: number;
      average_cost: number;
      success_rate: number;
    }
  >;
}

export class MetricsCollector {
  private metricsBuffer: MetricsData[] = [];
  private bufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  private startTime = Date.now();

  constructor() {
    this.startPeriodicFlush();
    logger.info("Metrics Collector initialized");
  }

  async recordRequest(
    request: AIRequest,
    response: AIResponse,
    decision: RoutingDecision,
  ): Promise<void> {
    try {
      const metricsData: MetricsData = {
        request_id: request.id,
        user_id: request.user_id,
        system_source: request.system_source,
        provider: response.provider,
        model: response.model_used,
        prompt_tokens: this.estimateTokens(request.prompt),
        completion_tokens: this.estimateTokens(response.content),
        total_tokens:
          this.estimateTokens(request.prompt) +
          this.estimateTokens(response.content),
        cost: response.cost,
        latency_ms: response.latency,
        success: true,
        timestamp: new Date(),
        routing_decision: decision,
      };

      this.metricsBuffer.push(metricsData);

      // Flush buffer if it's full
      if (this.metricsBuffer.length >= this.bufferSize) {
        await this.flushMetrics();
      }

      logger.debug(`Recorded metrics for request ${request.id}`);
    } catch (error) {
      logger.error("Failed to record request metrics:", error);
    }
  }

  async recordError(
    requestId: string,
    error: Error,
    latency: number,
  ): Promise<void> {
    try {
      const metricsData: MetricsData = {
        request_id: requestId,
        user_id: undefined,
        system_source: "unknown",
        provider: "unknown",
        model: "unknown",
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        cost: 0,
        latency_ms: latency,
        success: false,
        error_type: error.constructor.name,
        error_message: error.message,
        timestamp: new Date(),
        routing_decision: {
          provider: "unknown",
          model: "unknown",
          estimated_cost: 0,
          expected_latency: 0,
          confidence_score: 0,
          reasoning: "Request failed",
          routing_rules_applied: [],
        },
      };

      this.metricsBuffer.push(metricsData);
      logger.debug(`Recorded error metrics for request ${requestId}`);
    } catch (err) {
      logger.error("Failed to record error metrics:", err);
    }
  }

  async getSystemMetrics(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<SystemMetrics> {
    try {
      const whereClause = timeRange ? "WHERE timestamp BETWEEN $1 AND $2" : "";
      const params = timeRange ? [timeRange.start, timeRange.end] : [];

      const query = `
        SELECT
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE success = true) as successful_requests,
          COUNT(*) FILTER (WHERE success = false) as failed_requests,
          AVG(latency_ms) as average_latency,
          SUM(cost) as total_cost,
          AVG(CASE WHEN success = false THEN 1.0 ELSE 0.0 END) as error_rate
        FROM ai_request_metrics
        ${whereClause}
      `;

      const result = await DatabaseConnection.query(query, params);
      const row = result.rows[0];

      // Get provider and model breakdowns
      const providerQuery = `
        SELECT provider, COUNT(*) as count
        FROM ai_request_metrics
        ${whereClause}
        GROUP BY provider
      `;
      const providerResult = await DatabaseConnection.query(
        providerQuery,
        params,
      );

      const modelQuery = `
        SELECT model, COUNT(*) as count
        FROM ai_request_metrics
        ${whereClause}
        GROUP BY model
      `;
      const modelResult = await DatabaseConnection.query(modelQuery, params);

      const uptime = this.calculateUptime();

      return {
        total_requests: parseInt(row.total_requests) || 0,
        successful_requests: parseInt(row.successful_requests) || 0,
        failed_requests: parseInt(row.failed_requests) || 0,
        average_latency: parseFloat(row.average_latency) || 0,
        total_cost: parseFloat(row.total_cost) || 0,
        requests_by_provider: Object.fromEntries(
          providerResult.rows.map((r: any) => [r.provider, parseInt(r.count)]),
        ),
        requests_by_model: Object.fromEntries(
          modelResult.rows.map((r: any) => [r.model, parseInt(r.count)]),
        ),
        error_rate: parseFloat(row.error_rate) || 0,
        uptime_percentage: uptime,
      };
    } catch (error) {
      logger.error("Failed to get system metrics:", error);
      throw error;
    }
  }

  async getProviderMetrics(
    provider: string,
    timeRange?: { start: Date; end: Date },
  ): Promise<ProviderMetrics> {
    try {
      const whereClause = timeRange
        ? "WHERE provider = $1 AND timestamp BETWEEN $2 AND $3"
        : "WHERE provider = $1";
      const params = timeRange
        ? [provider, timeRange.start, timeRange.end]
        : [provider];

      const query = `
        SELECT
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE success = true) as successful_requests,
          AVG(latency_ms) as average_latency,
          AVG(cost) as average_cost,
          AVG(CASE WHEN success = false THEN 1.0 ELSE 0.0 END) as error_rate
        FROM ai_request_metrics
        ${whereClause}
      `;

      const result = await DatabaseConnection.query(query, params);
      const row = result.rows[0];

      // Get model-specific metrics
      const modelQuery = `
        SELECT
          model,
          COUNT(*) as requests,
          AVG(latency_ms) as average_latency,
          AVG(cost) as average_cost,
          AVG(CASE WHEN success = true THEN 1.0 ELSE 0.0 END) as success_rate
        FROM ai_request_metrics
        ${whereClause}
        GROUP BY model
      `;

      const modelResult = await DatabaseConnection.query(modelQuery, params);

      return {
        provider,
        total_requests: parseInt(row.total_requests) || 0,
        successful_requests: parseInt(row.successful_requests) || 0,
        average_latency: parseFloat(row.average_latency) || 0,
        average_cost: parseFloat(row.average_cost) || 0,
        error_rate: parseFloat(row.error_rate) || 0,
        models: Object.fromEntries(
          modelResult.rows.map((r: any) => [
            r.model,
            {
              requests: parseInt(r.requests),
              average_latency: parseFloat(r.average_latency),
              average_cost: parseFloat(r.average_cost),
              success_rate: parseFloat(r.success_rate),
            },
          ]),
        ),
      };
    } catch (error) {
      logger.error(`Failed to get metrics for provider ${provider}:`, error);
      throw error;
    }
  }

  async getCostAnalysis(timeRange?: { start: Date; end: Date }): Promise<{
    total_cost: number;
    cost_by_provider: Record<string, number>;
    cost_by_user: Record<string, number>;
    cost_trend: Array<{ date: string; cost: number }>;
  }> {
    try {
      const whereClause = timeRange ? "WHERE timestamp BETWEEN $1 AND $2" : "";
      const params = timeRange ? [timeRange.start, timeRange.end] : [];

      // Total cost
      const totalQuery = `SELECT SUM(cost) as total_cost FROM ai_request_metrics ${whereClause}`;
      const totalResult = await DatabaseConnection.query(totalQuery, params);

      // Cost by provider
      const providerQuery = `
        SELECT provider, SUM(cost) as cost
        FROM ai_request_metrics
        ${whereClause}
        GROUP BY provider
      `;
      const providerResult = await DatabaseConnection.query(
        providerQuery,
        params,
      );

      // Cost by user
      const userQuery = `
        SELECT user_id, SUM(cost) as cost
        FROM ai_request_metrics
        ${whereClause}
        WHERE user_id IS NOT NULL
        GROUP BY user_id
      `;
      const userResult = await DatabaseConnection.query(userQuery, params);

      // Cost trend (daily)
      const trendQuery = `
        SELECT
          DATE(timestamp) as date,
          SUM(cost) as cost
        FROM ai_request_metrics
        ${whereClause}
        GROUP BY DATE(timestamp)
        ORDER BY date
      `;
      const trendResult = await DatabaseConnection.query(trendQuery, params);

      return {
        total_cost: parseFloat(totalResult.rows[0]?.total_cost) || 0,
        cost_by_provider: Object.fromEntries(
          providerResult.rows.map((r: any) => [r.provider, parseFloat(r.cost)]),
        ),
        cost_by_user: Object.fromEntries(
          userResult.rows.map((r: any) => [r.user_id, parseFloat(r.cost)]),
        ),
        cost_trend: trendResult.rows.map((r: any) => ({
          date: r.date,
          cost: parseFloat(r.cost),
        })),
      };
    } catch (error) {
      logger.error("Failed to get cost analysis:", error);
      throw error;
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const values = this.metricsBuffer.map((m) => [
        m.request_id,
        m.user_id,
        m.system_source,
        m.provider,
        m.model,
        m.prompt_tokens,
        m.completion_tokens,
        m.total_tokens,
        m.cost,
        m.latency_ms,
        m.success,
        m.error_type,
        m.error_message,
        m.timestamp,
        JSON.stringify(m.routing_decision),
      ]);

      const query = `
        INSERT INTO ai_request_metrics (
          request_id, user_id, system_source, provider, model,
          prompt_tokens, completion_tokens, total_tokens, cost, latency_ms,
          success, error_type, error_message, timestamp, routing_decision
        ) VALUES ${values.map((_, i) => `($${i * 15 + 1}, $${i * 15 + 2}, $${i * 15 + 3}, $${i * 15 + 4}, $${i * 15 + 5}, $${i * 15 + 6}, $${i * 15 + 7}, $${i * 15 + 8}, $${i * 15 + 9}, $${i * 15 + 10}, $${i * 15 + 11}, $${i * 15 + 12}, $${i * 15 + 13}, $${i * 15 + 14}, $${i * 15 + 15})`).join(", ")}
      `;

      await DatabaseConnection.query(query, values.flat());

      logger.debug(
        `Flushed ${this.metricsBuffer.length} metrics records to database`,
      );
      this.metricsBuffer = [];
    } catch (error) {
      logger.error("Failed to flush metrics to database:", error);
      // Keep metrics in buffer for retry
    }
  }

  private startPeriodicFlush(): void {
    setInterval(async () => {
      await this.flushMetrics();
    }, this.flushInterval);
  }

  private estimateTokens(text: string): number {
    // Simple token estimation (roughly 4 characters per token)
    return Math.ceil(text.length / 4);
  }

  private calculateUptime(): number {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeHours = uptimeMs / (1000 * 60 * 60);
    // Assume 99.9% uptime for now - in production this would be calculated from actual downtime
    return Math.min(99.9, (uptimeHours / (uptimeHours + 0.001)) * 100);
  }

  async shutdown(): Promise<void> {
    logger.info("Shutting down metrics collector...");
    await this.flushMetrics();
    logger.info("Metrics collector shutdown complete");
  }
}

