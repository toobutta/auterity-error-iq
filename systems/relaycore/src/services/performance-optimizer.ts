/**
 * Performance Optimizer Service
 * Implements automated performance tuning across all systems
 */

import { Pool } from "pg";
import { logger } from "../utils/logger";
import { DatabaseConnection } from "./database";
import { CacheManager } from "./cache-manager";

export interface PerformanceMetric {
  system: "autmatrix" | "relaycore" | "neuroweaver";
  type: "response_time" | "cost" | "accuracy" | "throughput";
  value: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface MetricsSummary {
  averageResponseTime: number;
  p95ResponseTime: number;
  averageCost: number;
  throughput: number;
  accuracy: number;
  timeframe: {
    start: string;
    end: string;
  };
}

export interface AlertCondition {
  metricType: string;
  threshold: number;
  operator: "gt" | "lt" | "eq" | "gte" | "lte";
  duration: number; // seconds
  name: string;
}

export interface AlertId {
  id: string;
  name: string;
}

export interface OptimizationTrigger {
  metricType: string;
  threshold: number;
  action: "cache" | "scale" | "downgrade" | "optimize_db";
}

export interface OptimizationResult {
  applied: boolean;
  action: string;
  target: string;
  expectedImprovement: number;
}

export class PerformanceOptimizer {
  private db: Pool;
  private cacheManager: CacheManager;
  private activeAlerts: Map<
    string,
    { condition: AlertCondition; triggeredAt: Date }
  > = new Map();

  constructor() {
    this.db = DatabaseConnection.getPool();
    this.cacheManager = new CacheManager();

    // Set up periodic optimization check
    setInterval(() => this.checkForOptimizationOpportunities(), 60000); // Every minute
  }

  /**
   * Track a performance metric
   * Stores metrics for analysis and optimization
   */
  async trackMetric(metric: PerformanceMetric): Promise<void> {
    try {
      // Store metric in database
      const query = `
        INSERT INTO performance_metrics (
          system, metric_type, value, timestamp, metadata
        ) VALUES ($1, $2, $3, $4, $5)
      `;

      await this.db.query(query, [
        metric.system,
        metric.type,
        metric.value,
        metric.timestamp || new Date(),
        JSON.stringify(metric.metadata),
      ]);

      // Check if this metric triggers any alerts
      await this.checkAlertConditions(metric);
    } catch (error) {
      logger.error("Error tracking performance metric:", error);
    }
  }

  /**
   * Get metrics summary for a timeframe
   * Provides aggregated performance data for analysis
   */
  async getMetrics(timeframe: {
    start: string;
    end: string;
  }): Promise<MetricsSummary> {
    try {
      const { start, end } = timeframe;

      // Get average response time
      const responseTimeQuery = `
        SELECT
          AVG(value) as avg_response_time,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95_response_time
        FROM
          performance_metrics
        WHERE
          metric_type = 'response_time'
          AND timestamp >= $1 AND timestamp <= $2
      `;

      const responseTimeResult = await this.db.query(responseTimeQuery, [
        start,
        end,
      ]);

      // Get average cost
      const costQuery = `
        SELECT
          AVG(value) as avg_cost
        FROM
          performance_metrics
        WHERE
          metric_type = 'cost'
          AND timestamp >= $1 AND timestamp <= $2
      `;

      const costResult = await this.db.query(costQuery, [start, end]);

      // Get throughput (requests per minute)
      const throughputQuery = `
        SELECT
          COUNT(*) / (EXTRACT(EPOCH FROM ($2::timestamp - $1::timestamp)) / 60) as throughput
        FROM
          performance_metrics
        WHERE
          metric_type = 'response_time'
          AND timestamp >= $1 AND timestamp <= $2
      `;

      const throughputResult = await this.db.query(throughputQuery, [
        start,
        end,
      ]);

      // Get accuracy
      const accuracyQuery = `
        SELECT
          AVG(value) as avg_accuracy
        FROM
          performance_metrics
        WHERE
          metric_type = 'accuracy'
          AND timestamp >= $1 AND timestamp <= $2
      `;

      const accuracyResult = await this.db.query(accuracyQuery, [start, end]);

      return {
        averageResponseTime: parseFloat(
          responseTimeResult.rows[0]?.avg_response_time || "0",
        ),
        p95ResponseTime: parseFloat(
          responseTimeResult.rows[0]?.p95_response_time || "0",
        ),
        averageCost: parseFloat(costResult.rows[0]?.avg_cost || "0"),
        throughput: parseFloat(throughputResult.rows[0]?.throughput || "0"),
        accuracy: parseFloat(accuracyResult.rows[0]?.avg_accuracy || "0"),
        timeframe: {
          start,
          end,
        },
      };
    } catch (error) {
      logger.error("Error getting metrics summary:", error);

      // Return empty summary
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        averageCost: 0,
        throughput: 0,
        accuracy: 0,
        timeframe: {
          start: timeframe.start,
          end: timeframe.end,
        },
      };
    }
  }

  /**
   * Set an alert condition
   * Configures automated monitoring for performance issues
   */
  async setAlert(condition: AlertCondition): Promise<AlertId> {
    try {
      // Store alert condition in database
      const query = `
        INSERT INTO performance_alerts (
          name, metric_type, threshold, operator, duration
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const result = await this.db.query(query, [
        condition.name,
        condition.metricType,
        condition.threshold,
        condition.operator,
        condition.duration,
      ]);

      const alertId = result.rows[0].id;

      logger.info(`Alert condition set: ${condition.name} (${alertId})`);

      return {
        id: alertId,
        name: condition.name,
      };
    } catch (error) {
      logger.error("Error setting alert condition:", error);
      throw error;
    }
  }

  /**
   * Optimize automatically based on a trigger
   * Implements self-healing performance optimizations
   */
  async optimizeAutomatically(
    trigger: OptimizationTrigger,
  ): Promise<OptimizationResult> {
    try {
      switch (trigger.action) {
        case "cache":
          return await this.applyCachingOptimization(trigger);

        case "scale":
          return await this.applyScalingOptimization(trigger);

        case "downgrade":
          return await this.applyModelDowngradeOptimization(trigger);

        case "optimize_db":
          return await this.applyDatabaseOptimization(trigger);

        default:
          return {
            applied: false,
            action: "unknown",
            target: "none",
            expectedImprovement: 0,
          };
      }
    } catch (error) {
      logger.error("Error applying automatic optimization:", error);

      return {
        applied: false,
        action: trigger.action,
        target: trigger.metricType,
        expectedImprovement: 0,
      };
    }
  }

  /**
   * Check for optimization opportunities
   * Periodically analyzes metrics for potential improvements
   */
  private async checkForOptimizationOpportunities(): Promise<void> {
    try {
      // Get recent performance metrics
      const timeframe = {
        start: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Last 15 minutes
        end: new Date().toISOString(),
      };

      const metrics = await this.getMetrics(timeframe);

      // Check for high response times
      if (metrics.p95ResponseTime > 500) {
        // 500ms threshold
        logger.info(
          `High p95 response time detected: ${metrics.p95ResponseTime}ms, applying caching optimization`,
        );

        await this.optimizeAutomatically({
          metricType: "response_time",
          threshold: 500,
          action: "cache",
        });
      }

      // Check for high costs
      if (metrics.averageCost > 0.05) {
        // $0.05 per request threshold
        logger.info(
          `High average cost detected: $${metrics.averageCost}, applying model downgrade optimization`,
        );

        await this.optimizeAutomatically({
          metricType: "cost",
          threshold: 0.05,
          action: "downgrade",
        });
      }

      // Check for low throughput
      if (metrics.throughput > 0 && metrics.throughput < 10) {
        // Less than 10 RPM
        logger.info(
          `Low throughput detected: ${metrics.throughput} RPM, checking database performance`,
        );

        await this.optimizeAutomatically({
          metricType: "throughput",
          threshold: 10,
          action: "optimize_db",
        });
      }
    } catch (error) {
      logger.error("Error checking for optimization opportunities:", error);
    }
  }

  /**
   * Check if a metric triggers any alert conditions
   */
  private async checkAlertConditions(metric: PerformanceMetric): Promise<void> {
    try {
      // Get all alert conditions for this metric type
      const query = `
        SELECT * FROM performance_alerts
        WHERE metric_type = $1
      `;

      const result = await this.db.query(query, [metric.type]);

      for (const alertCondition of result.rows) {
        const condition: AlertCondition = {
          metricType: alertCondition.metric_type,
          threshold: parseFloat(alertCondition.threshold),
          operator: alertCondition.operator,
          duration: alertCondition.duration,
          name: alertCondition.name,
        };

        // Check if condition is met
        const isTriggered = this.evaluateCondition(metric.value, condition);

        if (isTriggered) {
          const alertId = `${condition.name}-${condition.metricType}`;

          // Check if this alert is already active
          if (!this.activeAlerts.has(alertId)) {
            // New alert
            this.activeAlerts.set(alertId, {
              condition,
              triggeredAt: new Date(),
            });

            // Log alert
            logger.warn(
              `Performance alert triggered: ${condition.name} - ${metric.type} ${this.getOperatorSymbol(condition.operator)} ${condition.threshold}`,
            );

            // Store alert in database
            await this.db.query(
              `
              INSERT INTO performance_alert_history (
                alert_id, metric_type, threshold, value, triggered_at
              ) VALUES ($1, $2, $3, $4, $5)
            `,
              [
                alertId,
                metric.type,
                condition.threshold,
                metric.value,
                new Date(),
              ],
            );
          }
        } else {
          // Check if we need to clear an active alert
          const alertId = `${condition.name}-${condition.metricType}`;

          if (this.activeAlerts.has(alertId)) {
            // Clear alert
            this.activeAlerts.delete(alertId);

            // Log alert cleared
            logger.info(
              `Performance alert cleared: ${condition.name} - ${metric.type} is now within threshold`,
            );

            // Update alert history
            await this.db.query(
              `
              UPDATE performance_alert_history
              SET resolved_at = $1
              WHERE alert_id = $2 AND resolved_at IS NULL
            `,
              [new Date(), alertId],
            );
          }
        }
      }
    } catch (error) {
      logger.error("Error checking alert conditions:", error);
    }
  }

  /**
   * Evaluate if a value meets an alert condition
   */
  private evaluateCondition(value: number, condition: AlertCondition): boolean {
    switch (condition.operator) {
      case "gt":
        return value > condition.threshold;
      case "lt":
        return value < condition.threshold;
      case "eq":
        return value === condition.threshold;
      case "gte":
        return value >= condition.threshold;
      case "lte":
        return value <= condition.threshold;
      default:
        return false;
    }
  }

  /**
   * Get operator symbol for logging
   */
  private getOperatorSymbol(operator: string): string {
    switch (operator) {
      case "gt":
        return ">";
      case "lt":
        return "<";
      case "eq":
        return "=";
      case "gte":
        return ">=";
      case "lte":
        return "<=";
      default:
        return operator;
    }
  }

  /**
   * Apply caching optimization
   */
  private async applyCachingOptimization(
    trigger: OptimizationTrigger,
  ): Promise<OptimizationResult> {
    try {
      // Identify frequently accessed data
      const query = `
        SELECT
          path,
          COUNT(*) as access_count,
          AVG(response_time) as avg_response_time
        FROM
          api_request_logs
        WHERE
          timestamp > NOW() - INTERVAL '1 hour'
          AND method = 'GET'
        GROUP BY
          path
        HAVING
          COUNT(*) > 10
          AND AVG(response_time) > $1
        ORDER BY
          access_count DESC
        LIMIT 5
      `;

      const result = await this.db.query(query, [trigger.threshold]);

      if (result.rows.length === 0) {
        return {
          applied: false,
          action: "cache",
          target: "none",
          expectedImprovement: 0,
        };
      }

      // Apply caching to frequently accessed endpoints
      let totalImprovement = 0;
      const cachedPaths: string[] = [];

      for (const row of result.rows) {
        const path = row.path;
        const avgResponseTime = parseFloat(row.avg_response_time);
        const accessCount = parseInt(row.access_count);

        // Add to cache configuration
        await this.db.query(
          `
          INSERT INTO cache_config (path, ttl_seconds, enabled)
          VALUES ($1, 300, true)
          ON CONFLICT (path) DO UPDATE SET
            ttl_seconds = 300,
            enabled = true
        `,
          [path],
        );

        // Estimate improvement (assume 90% reduction in response time for cached requests)
        const expectedImprovement =
          (avgResponseTime * 0.9 * accessCount) / accessCount;
        totalImprovement += expectedImprovement;

        cachedPaths.push(path);

        logger.info(
          `Applied caching optimization to path: ${path}, expected improvement: ${expectedImprovement.toFixed(2)}ms per request`,
        );
      }

      return {
        applied: true,
        action: "cache",
        target: cachedPaths.join(", "),
        expectedImprovement: totalImprovement / result.rows.length,
      };
    } catch (error) {
      logger.error("Error applying caching optimization:", error);

      return {
        applied: false,
        action: "cache",
        target: "error",
        expectedImprovement: 0,
      };
    }
  }

  /**
   * Apply scaling optimization
   */
  private async applyScalingOptimization(
    trigger: OptimizationTrigger,
  ): Promise<OptimizationResult> {
    try {
      // This would typically interact with Kubernetes or other scaling systems
      // For now, we'll simulate the optimization

      logger.info(
        `Scaling optimization triggered for ${trigger.metricType} > ${trigger.threshold}`,
      );

      // Determine which service to scale
      const serviceToScale = await this.identifyServiceToScale(
        trigger.metricType,
      );

      if (!serviceToScale) {
        return {
          applied: false,
          action: "scale",
          target: "none",
          expectedImprovement: 0,
        };
      }

      // Log the scaling action (in a real system, this would call the scaling API)
      logger.info(
        `Scaling service ${serviceToScale} to handle high ${trigger.metricType}`,
      );

      // Estimate improvement (assume 30% improvement from scaling)
      const expectedImprovement = 0.3;

      return {
        applied: true,
        action: "scale",
        target: serviceToScale,
        expectedImprovement: expectedImprovement,
      };
    } catch (error) {
      logger.error("Error applying scaling optimization:", error);

      return {
        applied: false,
        action: "scale",
        target: "error",
        expectedImprovement: 0,
      };
    }
  }

  /**
   * Apply model downgrade optimization
   */
  private async applyModelDowngradeOptimization(
    trigger: OptimizationTrigger,
  ): Promise<OptimizationResult> {
    try {
      // Identify expensive model usage
      const query = `
        SELECT
          metadata->>'modelId' as model_id,
          COUNT(*) as usage_count,
          AVG(amount) as avg_cost
        FROM
          budget_usage_records
        WHERE
          timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY
          metadata->>'modelId'
        HAVING
          AVG(amount) > $1
        ORDER BY
          avg_cost DESC
        LIMIT 3
      `;

      const result = await this.db.query(query, [trigger.threshold]);

      if (result.rows.length === 0) {
        return {
          applied: false,
          action: "downgrade",
          target: "none",
          expectedImprovement: 0,
        };
      }

      // Define model downgrades
      const modelDowngrades: Record<
        string,
        { model: string; savingsFactor: number }
      > = {
        "gpt-4": { model: "gpt-4-turbo", savingsFactor: 0.7 },
        "gpt-4-turbo": { model: "gpt-3.5-turbo", savingsFactor: 0.85 },
        "claude-3-opus": { model: "claude-3-sonnet", savingsFactor: 0.5 },
        "claude-3-sonnet": { model: "claude-3-haiku", savingsFactor: 0.8 },
        "mistral-large": { model: "mistral-small", savingsFactor: 0.75 },
      };

      // Apply downgrades
      let totalSavings = 0;
      const downgradedModels: string[] = [];

      for (const row of result.rows) {
        const modelId = row.model_id;
        const avgCost = parseFloat(row.avg_cost);
        const usageCount = parseInt(row.usage_count);

        if (modelDowngrades[modelId]) {
          const downgrade = modelDowngrades[modelId];

          // Update steering rules to prefer cheaper model
          await this.db.query(
            `
            INSERT INTO model_steering_rules (
              source_model, target_model, priority, reason
            ) VALUES ($1, $2, 100, 'Cost optimization')
            ON CONFLICT (source_model) DO UPDATE SET
              target_model = $2,
              priority = 100,
              reason = 'Cost optimization'
          `,
            [modelId, downgrade.model],
          );

          // Calculate savings
          const expectedSavings =
            avgCost * downgrade.savingsFactor * usageCount;
          totalSavings += expectedSavings;

          downgradedModels.push(`${modelId} → ${downgrade.model}`);

          logger.info(
            `Applied model downgrade: ${modelId} → ${downgrade.model}, expected savings: $${expectedSavings.toFixed(4)} per hour`,
          );
        }
      }

      return {
        applied: downgradedModels.length > 0,
        action: "downgrade",
        target: downgradedModels.join(", "),
        expectedImprovement: totalSavings,
      };
    } catch (error) {
      logger.error("Error applying model downgrade optimization:", error);

      return {
        applied: false,
        action: "downgrade",
        target: "error",
        expectedImprovement: 0,
      };
    }
  }

  /**
   * Apply database optimization
   */
  private async applyDatabaseOptimization(
    trigger: OptimizationTrigger,
  ): Promise<OptimizationResult> {
    try {
      // Identify slow queries
      const query = `
        SELECT
          query_text,
          calls,
          total_time / calls as avg_time,
          rows / calls as avg_rows
        FROM
          pg_stat_statements
        WHERE
          total_time / calls > $1
          AND calls > 10
        ORDER BY
          total_time / calls DESC
        LIMIT 5
      `;

      const result = await this.db.query(query, [50]); // 50ms threshold

      if (result.rows.length === 0) {
        return {
          applied: false,
          action: "optimize_db",
          target: "none",
          expectedImprovement: 0,
        };
      }

      // Apply optimizations
      let totalImprovement = 0;
      const optimizedQueries: string[] = [];

      for (const row of result.rows) {
        const queryText = row.query_text;
        const avgTime = parseFloat(row.avg_time);
        const calls = parseInt(row.calls);

        // Log slow query for manual optimization
        logger.warn(
          `Slow query detected (${avgTime.toFixed(2)}ms): ${queryText.substring(0, 100)}...`,
        );

        // Store for later analysis
        await this.db.query(
          `
          INSERT INTO slow_query_log (
            query_text, avg_time, calls, detected_at
          ) VALUES ($1, $2, $3, NOW())
        `,
          [queryText, avgTime, calls],
        );

        // Add query hints where possible
        if (this.canAddQueryHints(queryText)) {
          const optimizedQuery = this.addQueryHints(queryText);

          // Store optimized version
          await this.db.query(
            `
            INSERT INTO query_optimizations (
              original_query, optimized_query, created_at
            ) VALUES ($1, $2, NOW())
          `,
            [queryText, optimizedQuery],
          );

          // Estimate improvement (assume 40% reduction in query time)
          const expectedImprovement = avgTime * 0.4 * calls;
          totalImprovement += expectedImprovement;

          optimizedQueries.push(queryText.substring(0, 50) + "...");
        }
      }

      return {
        applied: optimizedQueries.length > 0,
        action: "optimize_db",
        target: `${optimizedQueries.length} queries`,
        expectedImprovement: totalImprovement,
      };
    } catch (error) {
      logger.error("Error applying database optimization:", error);

      return {
        applied: false,
        action: "optimize_db",
        target: "error",
        expectedImprovement: 0,
      };
    }
  }

  /**
   * Identify which service to scale based on metrics
   */
  private async identifyServiceToScale(
    metricType: string,
  ): Promise<string | null> {
    try {
      // Get metrics by system
      const query = `
        SELECT
          system,
          AVG(value) as avg_value
        FROM
          performance_metrics
        WHERE
          metric_type = $1
          AND timestamp > NOW() - INTERVAL '15 minutes'
        GROUP BY
          system
        ORDER BY
          avg_value DESC
      `;

      const result = await this.db.query(query, [metricType]);

      if (result.rows.length === 0) {
        return null;
      }

      // Return the system with the highest metric value
      return result.rows[0].system;
    } catch (error) {
      logger.error("Error identifying service to scale:", error);
      return null;
    }
  }

  /**
   * Check if query hints can be added to a query
   */
  private canAddQueryHints(query: string): boolean {
    // Simple check for SELECT queries that might benefit from hints
    return (
      query.trim().toUpperCase().startsWith("SELECT") &&
      (query.includes("JOIN") || query.includes("WHERE"))
    );
  }

  /**
   * Add query hints to optimize performance
   */
  private addQueryHints(query: string): string {
    // This is a simplified version - in reality, this would be much more sophisticated

    // Add index hints for JOINs
    let optimized = query.replace(
      /JOIN\s+(\w+)\s+ON/gi,
      "JOIN $1 /*+ INDEX($1) */ ON",
    );

    // Add parallel hints for large queries
    if (
      query.includes("COUNT(*)") ||
      query.includes("SUM(") ||
      query.includes("AVG(")
    ) {
      optimized = `/*+ PARALLEL(4) */ ${optimized}`;
    }

    return optimized;
  }
}

