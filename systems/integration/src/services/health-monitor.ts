import { EventEmitter } from "events";
import { IntegrationLogger } from "./integration-logger";
import { CrossSystemCache } from "./cross-system-cache";

export interface SystemHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy" | "offline";
  uptime: number;
  lastCheck: string;
  responseTime: number;
  errorRate: number;
  memoryUsage?: number;
  cpuUsage?: number;
  diskUsage?: number;
  customMetrics?: Record<string, any>;
}

export interface HealthCheckResult {
  system: string;
  status: "healthy" | "degraded" | "unhealthy" | "offline";
  timestamp: string;
  duration: number;
  details?: any;
  error?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  system: string;
  metric: string;
  condition: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  cooldown: number; // minutes
  lastTriggered?: string;
}

export class HealthMonitor extends EventEmitter {
  private systems = new Map<string, SystemHealth>();
  private alertRules = new Map<string, AlertRule>();
  private checkIntervals = new Map<string, NodeJS.Timeout>();
  private isMonitoring = false;

  constructor(
    private logger: IntegrationLogger,
    private cache: CrossSystemCache,
    private checkInterval: number = 30000, // 30 seconds
    private enableAlerts: boolean = true,
  ) {
    super();
  }

  async initialize(): Promise<void> {
    this.logger.info(
      "HealthMonitor",
      "initialize",
      "Initializing health monitoring system",
    );

    // Initialize default system monitoring
    await this.registerSystem("integration", "http://localhost:3002/health");
    await this.registerSystem("auterity", "http://localhost:3000/health");
    await this.registerSystem("relaycore", "http://localhost:3001/health");
    await this.registerSystem("neuroweaver", "http://localhost:3003/health");

    // Initialize default alert rules
    this.initializeDefaultAlertRules();

    this.isMonitoring = true;
    this.logger.info(
      "HealthMonitor",
      "initialize",
      "Health monitoring system initialized",
    );
  }

  async registerSystem(
    name: string,
    healthEndpoint: string,
    customConfig?: any,
  ): Promise<void> {
    const system: SystemHealth = {
      name,
      status: "offline",
      uptime: 0,
      lastCheck: new Date().toISOString(),
      responseTime: 0,
      errorRate: 0,
      customMetrics: customConfig,
    };

    this.systems.set(name, system);

    // Start health checking for this system
    await this.startHealthChecks(name);

    this.logger.info(
      "HealthMonitor",
      "registerSystem",
      `Registered system: ${name} at ${healthEndpoint}`,
    );
    this.emit("system-registered", { name, healthEndpoint });
  }

  private async startHealthChecks(systemName: string): Promise<void> {
    const interval = setInterval(async () => {
      await this.performHealthCheck(systemName);
    }, this.checkInterval);

    this.checkIntervals.set(systemName, interval);
    this.logger.debug(
      "HealthMonitor",
      "startHealthChecks",
      `Started health checks for: ${systemName}`,
    );
  }

  private async performHealthCheck(systemName: string): Promise<void> {
    const system = this.systems.get(systemName);
    if (!system) return;

    const startTime = Date.now();

    try {
      const result = await this.checkSystemHealth(systemName);
      const duration = Date.now() - startTime;

      // Update system health
      system.lastCheck = new Date().toISOString();
      system.responseTime = duration;
      system.status = result.status;

      // Calculate uptime (simplified)
      if (result.status === "healthy") {
        system.uptime = Math.min(
          100,
          system.uptime + this.checkInterval / 60000,
        ); // Convert to percentage
      } else {
        system.uptime = Math.max(0, system.uptime - 1);
      }

      // Cache health status
      await this.cache.set(`health:${systemName}`, system, { ttl: 300 }); // 5 minutes

      // Check alert rules
      if (this.enableAlerts) {
        await this.checkAlertRules(systemName, system);
      }

      this.emit("health-check", { system: systemName, result, duration });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        "HealthMonitor",
        "performHealthCheck",
        `Health check failed for ${systemName}: ${errorMessage}`,
      );

      system.status = "unhealthy";
      system.lastCheck = new Date().toISOString();
      system.responseTime = Date.now() - startTime;

      this.emit("health-check-error", { system: systemName, error });
    }
  }

  private async checkSystemHealth(
    systemName: string,
  ): Promise<HealthCheckResult> {
    const system = this.systems.get(systemName);
    if (!system) {
      throw new Error(`System not found: ${systemName}`);
    }

    const startTime = Date.now();

    try {
      // For now, simulate health checks
      // In real implementation, this would make HTTP calls to system health endpoints
      const isHealthy = Math.random() > 0.1; // 90% success rate for demo
      const duration = Date.now() - startTime;

      let status: HealthCheckResult["status"] = "healthy";
      if (!isHealthy) {
        status = Math.random() > 0.5 ? "degraded" : "unhealthy";
      }

      return {
        system: systemName,
        status,
        timestamp: new Date().toISOString(),
        duration,
        details: {
          responseTime: duration,
          memoryUsage: Math.random() * 100,
          cpuUsage: Math.random() * 100,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        system: systemName,
        status: "offline",
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    }
  }

  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: "response-time-high",
        name: "High Response Time",
        system: "all",
        metric: "responseTime",
        condition: "gt",
        threshold: 5000, // 5 seconds
        severity: "medium",
        enabled: true,
        cooldown: 5,
      },
      {
        id: "error-rate-high",
        name: "High Error Rate",
        system: "all",
        metric: "errorRate",
        condition: "gt",
        threshold: 5, // 5%
        severity: "high",
        enabled: true,
        cooldown: 10,
      },
      {
        id: "system-offline",
        name: "System Offline",
        system: "all",
        metric: "status",
        condition: "eq",
        threshold: 0, // status = offline
        severity: "critical",
        enabled: true,
        cooldown: 1,
      },
    ];

    defaultRules.forEach((rule) => {
      this.alertRules.set(rule.id, rule);
    });

    this.logger.info(
      "HealthMonitor",
      "initializeDefaultAlertRules",
      `Initialized ${defaultRules.length} default alert rules`,
    );
  }

  private async checkAlertRules(
    systemName: string,
    system: SystemHealth,
  ): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;
      if (rule.system !== "all" && rule.system !== systemName) continue;

      // Check cooldown
      if (rule.lastTriggered) {
        const lastTrigger = new Date(rule.lastTriggered);
        const cooldownMs = rule.cooldown * 60 * 1000;
        if (Date.now() - lastTrigger.getTime() < cooldownMs) {
          continue;
        }
      }

      const shouldTrigger = this.evaluateAlertRule(rule, system);

      if (shouldTrigger) {
        await this.triggerAlert(rule, system);
        rule.lastTriggered = new Date().toISOString();
      }
    }
  }

  private evaluateAlertRule(rule: AlertRule, system: SystemHealth): boolean {
    const metricValue = this.getMetricValue(system, rule.metric);

    switch (rule.condition) {
      case "gt":
        return metricValue > rule.threshold;
      case "lt":
        return metricValue < rule.threshold;
      case "eq":
        return metricValue === rule.threshold;
      case "gte":
        return metricValue >= rule.threshold;
      case "lte":
        return metricValue <= rule.threshold;
      default:
        return false;
    }
  }

  private getMetricValue(system: SystemHealth, metric: string): number {
    switch (metric) {
      case "responseTime":
        return system.responseTime;
      case "errorRate":
        return system.errorRate;
      case "uptime":
        return system.uptime;
      case "memoryUsage":
        return system.memoryUsage || 0;
      case "cpuUsage":
        return system.cpuUsage || 0;
      case "status":
        return system.status === "offline" ? 0 : 1;
      default:
        return 0;
    }
  }

  private async triggerAlert(
    rule: AlertRule,
    system: SystemHealth,
  ): Promise<void> {
    const alert = {
      id: `alert-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      system: system.name,
      severity: rule.severity,
      message: `${rule.name} triggered for ${system.name}`,
      metric: rule.metric,
      threshold: rule.threshold,
      currentValue: this.getMetricValue(system, rule.metric),
      timestamp: new Date().toISOString(),
    };

    // Log the alert
    this.logger.warn(
      "HealthMonitor",
      "triggerAlert",
      `Alert triggered: ${alert.message}`,
    );

    // Emit alert event
    this.emit("alert-triggered", alert);

    // Cache the alert
    await this.cache.set(`alert:${alert.id}`, alert, { ttl: 3600 }); // 1 hour

    // In a real system, this would send notifications via email, Slack, etc.
  }

  async addAlertRule(rule: Omit<AlertRule, "id">): Promise<string> {
    const id = `rule-${Date.now()}`;
    const newRule: AlertRule = { ...rule, id };

    this.alertRules.set(id, newRule);
    await this.cache.set(`alert-rule:${id}`, newRule);

    this.logger.info(
      "HealthMonitor",
      "addAlertRule",
      `Added alert rule: ${newRule.name}`,
    );
    this.emit("alert-rule-added", newRule);

    return id;
  }

  async removeAlertRule(ruleId: string): Promise<boolean> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    this.alertRules.delete(ruleId);
    await this.cache.delete(`alert-rule:${ruleId}`);

    this.logger.info(
      "HealthMonitor",
      "removeAlertRule",
      `Removed alert rule: ${rule.name}`,
    );
    this.emit("alert-rule-removed", rule);

    return true;
  }

  async getSystemHealth(
    systemName?: string,
  ): Promise<SystemHealth | SystemHealth[]> {
    if (systemName) {
      const system = this.systems.get(systemName);
      if (!system) {
        throw new Error(`System not found: ${systemName}`);
      }
      return system;
    }

    return Array.from(this.systems.values());
  }

  async getAlertRules(): Promise<AlertRule[]> {
    return Array.from(this.alertRules.values());
  }

  async getOverallHealth(): Promise<any> {
    const systems = Array.from(this.systems.values());
    const healthy = systems.filter((s) => s.status === "healthy").length;
    const degraded = systems.filter((s) => s.status === "degraded").length;
    const unhealthy = systems.filter((s) => s.status === "unhealthy").length;
    const offline = systems.filter((s) => s.status === "offline").length;

    const overallStatus =
      offline > 0
        ? "offline"
        : unhealthy > 0
          ? "unhealthy"
          : degraded > 0
            ? "degraded"
            : "healthy";

    return {
      status: overallStatus,
      systemCount: systems.length,
      healthy,
      degraded,
      unhealthy,
      offline,
      timestamp: new Date().toISOString(),
      systems: systems.map((s) => ({
        name: s.name,
        status: s.status,
        responseTime: s.responseTime,
        uptime: s.uptime,
      })),
    };
  }

  async forceHealthCheck(systemName: string): Promise<HealthCheckResult> {
    this.logger.info(
      "HealthMonitor",
      "forceHealthCheck",
      `Forced health check for: ${systemName}`,
    );
    return await this.checkSystemHealth(systemName);
  }

  async stop(): Promise<void> {
    this.isMonitoring = false;

    // Clear all intervals
    for (const [systemName, interval] of this.checkIntervals.entries()) {
      clearInterval(interval);
      this.logger.debug(
        "HealthMonitor",
        "stop",
        `Stopped health checks for: ${systemName}`,
      );
    }

    this.checkIntervals.clear();
    this.logger.info(
      "HealthMonitor",
      "stopMonitoring",
      "Health monitoring stopped",
    );
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.initialize();
    this.logger.info(
      "HealthMonitor",
      "restartMonitoring",
      "Health monitoring restarted",
    );
  }

  // Health check for the monitor itself
  async healthCheck(): Promise<any> {
    return {
      status: this.isMonitoring ? "healthy" : "stopped",
      systems: this.systems.size,
      alertRules: this.alertRules.size,
      checkInterval: this.checkInterval,
      alertsEnabled: this.enableAlerts,
      timestamp: new Date().toISOString(),
    };
  }
}

