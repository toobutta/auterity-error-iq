import winston from "winston";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  system: string;
  component: string;
  message: string;
  data?: any;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  error?: Error;
  duration?: number;
  statusCode?: number;
}

export interface LogQuery {
  system?: string;
  component?: string;
  level?: string;
  userId?: string;
  correlationId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface LogStats {
  total: number;
  byLevel: Record<string, number>;
  bySystem: Record<string, number>;
  byComponent: Record<string, number>;
  timeRange: {
    start: string;
    end: string;
  };
}

export class IntegrationLogger extends EventEmitter {
  private logger!: winston.Logger;
  private logEntries: LogEntry[] = [];
  private maxEntries = 10000;

  constructor(
    private logLevel: string = process.env.LOG_LEVEL || "info",
    private enableFileLogging: boolean = process.env.ENABLE_FILE_LOGGING ===
      "true",
    private enableConsoleLogging: boolean = process.env
      .ENABLE_CONSOLE_LOGGING !== "false",
  ) {
    super();
    this.initializeLogger();
  }

  private initializeLogger(): void {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.enableConsoleLogging) {
      transports.push(
        new winston.transports.Console({
          level: this.logLevel,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? JSON.stringify(meta, null, 2)
                : "";
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            }),
          ),
        }),
      );
    }

    // File transport
    if (this.enableFileLogging) {
      transports.push(
        new winston.transports.File({
          filename: "logs/integration.log",
          level: this.logLevel,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        }),
      );

      // Error log file
      transports.push(
        new winston.transports.File({
          filename: "logs/integration-error.log",
          level: "error",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 3,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: this.logLevel,
      transports,
    });

  }

  private createLogEntry(
    level: string,
    system: string,
    component: string,
    message: string,
    data?: any,
    correlationId?: string,
    userId?: string,
    sessionId?: string,
    error?: Error,
    duration?: number,
    statusCode?: number,
  ): LogEntry {
    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      system,
      component,
      message,
      data,
      correlationId,
      userId,
      sessionId,
      error,
      duration,
      statusCode,
    };

    return entry;
  }

  private storeLogEntry(entry: LogEntry): void {
    this.logEntries.push(entry);

    // Maintain max entries limit
    if (this.logEntries.length > this.maxEntries) {
      this.logEntries = this.logEntries.slice(-this.maxEntries);
    }

    this.emit("log-entry", entry);
  }

  async info(
    system: string,
    component: string,
    message: string,
    data?: any,
    correlationId?: string,
  ): Promise<void> {
    const entry = this.createLogEntry(
      "info",
      system,
      component,
      message,
      data,
      correlationId,
    );
    this.storeLogEntry(entry);

    this.logger.info(message, {
      system,
      component,
      data,
      correlationId,
      id: entry.id,
    });
  }

  async warn(
    system: string,
    component: string,
    message: string,
    data?: any,
    correlationId?: string,
  ): Promise<void> {
    const entry = this.createLogEntry(
      "warn",
      system,
      component,
      message,
      data,
      correlationId,
    );
    this.storeLogEntry(entry);

    this.logger.warn(message, {
      system,
      component,
      data,
      correlationId,
      id: entry.id,
    });
  }

  async error(
    system: string,
    component: string,
    message: string,
    error?: Error,
    data?: any,
    correlationId?: string,
  ): Promise<void> {
    const entry = this.createLogEntry(
      "error",
      system,
      component,
      message,
      data,
      correlationId,
      undefined,
      undefined,
      error,
    );
    this.storeLogEntry(entry);

    this.logger.error(message, {
      system,
      component,
      error: error?.message,
      stack: error?.stack,
      data,
      correlationId,
      id: entry.id,
    });
  }

  async debug(
    system: string,
    component: string,
    message: string,
    data?: any,
    correlationId?: string,
  ): Promise<void> {
    const entry = this.createLogEntry(
      "debug",
      system,
      component,
      message,
      data,
      correlationId,
    );
    this.storeLogEntry(entry);

    this.logger.debug(message, {
      system,
      component,
      data,
      correlationId,
      id: entry.id,
    });
  }

  // HTTP request logging
  async logHttpRequest(
    system: string,
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
    correlationId?: string,
    error?: Error,
  ): Promise<void> {
    const level =
      statusCode >= 400 ? "error" : statusCode >= 300 ? "warn" : "info";
    const message = `HTTP ${method} ${url} - ${statusCode} (${duration}ms)`;

    const entry = this.createLogEntry(
      level,
      system,
      "http",
      message,
      { method, url, statusCode, duration },
      correlationId,
      userId,
      undefined,
      error,
      duration,
      statusCode,
    );

    this.storeLogEntry(entry);

    const logData = {
      system,
      component: "http",
      method,
      url,
      statusCode,
      duration,
      userId,
      correlationId,
      id: entry.id,
    };

    if (level === "error") {
      this.logger.error(message, logData);
    } else if (level === "warn") {
      this.logger.warn(message, logData);
    } else {
      this.logger.info(message, logData);
    }
  }

  // System integration logging
  async logSystemIntegration(
    sourceSystem: string,
    targetSystem: string,
    operation: string,
    success: boolean,
    duration?: number,
    error?: Error,
    data?: any,
    correlationId?: string,
  ): Promise<void> {
    const level = success ? "info" : "error";
    const status = success ? "SUCCESS" : "FAILED";
    const message = `System Integration: ${sourceSystem} -> ${targetSystem} [${operation}] - ${status}`;

    const entry = this.createLogEntry(
      level,
      "integration",
      "system-integration",
      message,
      {
        sourceSystem,
        targetSystem,
        operation,
        success,
        ...data,
      },
      correlationId,
      undefined,
      undefined,
      error,
      duration,
    );

    this.storeLogEntry(entry);

    const logData = {
      system: "integration",
      component: "system-integration",
      sourceSystem,
      targetSystem,
      operation,
      success,
      duration,
      data,
      correlationId,
      id: entry.id,
    };

    if (success) {
      this.logger.info(message, logData);
    } else {
      this.logger.error(message, {
        ...logData,
        error: error?.message,
        stack: error?.stack,
      });
    }
  }

  // Message bus logging
  async logMessageBus(
    operation: "publish" | "subscribe" | "request" | "broadcast",
    routingKey: string,
    success: boolean,
    duration?: number,
    error?: Error,
    data?: any,
    correlationId?: string,
  ): Promise<void> {
    const level = success ? "debug" : "error";
    const status = success ? "SUCCESS" : "FAILED";
    const message = `Message Bus: ${operation.toUpperCase()} ${routingKey} - ${status}`;

    const entry = this.createLogEntry(
      level,
      "integration",
      "message-bus",
      message,
      {
        operation,
        routingKey,
        success,
        ...data,
      },
      correlationId,
      undefined,
      undefined,
      error,
      duration,
    );

    this.storeLogEntry(entry);

    const logData = {
      system: "integration",
      component: "message-bus",
      operation,
      routingKey,
      success,
      duration,
      data,
      correlationId,
      id: entry.id,
    };

    if (success) {
      this.logger.debug(message, logData);
    } else {
      this.logger.error(message, {
        ...logData,
        error: error?.message,
        stack: error?.stack,
      });
    }
  }

  // Cache operation logging
  async logCacheOperation(
    operation: "get" | "set" | "delete" | "invalidate",
    key: string,
    success: boolean,
    duration?: number,
    error?: Error,
    data?: any,
    correlationId?: string,
  ): Promise<void> {
    const level = success ? "debug" : "warn";
    const status = success ? "HIT" : operation === "get" ? "MISS" : "FAILED";
    const message = `Cache: ${operation.toUpperCase()} ${key} - ${status}`;

    const entry = this.createLogEntry(
      level,
      "integration",
      "cache",
      message,
      {
        operation,
        key,
        success,
        ...data,
      },
      correlationId,
      undefined,
      undefined,
      error,
      duration,
    );

    this.storeLogEntry(entry);

    const logData = {
      system: "integration",
      component: "cache",
      operation,
      key,
      success,
      duration,
      data,
      correlationId,
      id: entry.id,
    };

    if (success) {
      this.logger.debug(message, logData);
    } else {
      this.logger.warn(message, { ...logData, error: error?.message });
    }
  }

  // Query logs
  async queryLogs(query: LogQuery): Promise<LogEntry[]> {
    let filtered = [...this.logEntries];

    if (query.system) {
      filtered = filtered.filter((entry) => entry.system === query.system);
    }

    if (query.component) {
      filtered = filtered.filter(
        (entry) => entry.component === query.component,
      );
    }

    if (query.level) {
      filtered = filtered.filter((entry) => entry.level === query.level);
    }

    if (query.userId) {
      filtered = filtered.filter((entry) => entry.userId === query.userId);
    }

    if (query.correlationId) {
      filtered = filtered.filter(
        (entry) => entry.correlationId === query.correlationId,
      );
    }

    if (query.startDate) {
      const startDate = new Date(query.startDate);
      filtered = filtered.filter(
        (entry) => new Date(entry.timestamp) >= startDate,
      );
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      filtered = filtered.filter(
        (entry) => new Date(entry.timestamp) <= endDate,
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const start = Math.max(0, offset);
    const end = Math.min(filtered.length, start + limit);

    return filtered.slice(start, end);
  }

  // Get log statistics
  async getLogStats(timeRange?: {
    start: string;
    end: string;
  }): Promise<LogStats> {
    let filtered = [...this.logEntries];

    if (timeRange) {
      const startDate = new Date(timeRange.start);
      const endDate = new Date(timeRange.end);
      filtered = filtered.filter(
        (entry) =>
          new Date(entry.timestamp) >= startDate &&
          new Date(entry.timestamp) <= endDate,
      );
    }

    const stats: LogStats = {
      total: filtered.length,
      byLevel: {},
      bySystem: {},
      byComponent: {},
      timeRange: {
        start:
          timeRange?.start ||
          new Date(
            filtered[filtered.length - 1]?.timestamp || Date.now(),
          ).toISOString(),
        end:
          timeRange?.end ||
          new Date(filtered[0]?.timestamp || Date.now()).toISOString(),
      },
    };

    filtered.forEach((entry) => {
      // Count by level
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;

      // Count by system
      stats.bySystem[entry.system] = (stats.bySystem[entry.system] || 0) + 1;

      // Count by component
      stats.byComponent[entry.component] =
        (stats.byComponent[entry.component] || 0) + 1;
    });

    return stats;
  }

  // Get recent logs
  async getRecentLogs(limit: number = 100): Promise<LogEntry[]> {
    return [...this.logEntries]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  }

  // Get error logs
  async getErrorLogs(limit: number = 100): Promise<LogEntry[]> {
    return [...this.logEntries]
      .filter((entry) => entry.level === "error")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  }

  // Clear logs (for testing or maintenance)
  async clearLogs(): Promise<void> {
    this.logEntries = [];
    this.emit("logs-cleared");

  }

  // Export logs
  async exportLogs(query?: LogQuery): Promise<LogEntry[]> {
    const logs = query ? await this.queryLogs(query) : [...this.logEntries];
    return logs;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const stats = await this.getLogStats();

    return {
      status: "healthy",
      entries: this.logEntries.length,
      maxEntries: this.maxEntries,
      logLevel: this.logLevel,
      transports: {
        console: this.enableConsoleLogging,
        file: this.enableFileLogging,
      },
      recentStats: stats,
      timestamp: new Date().toISOString(),
    };
  }

  // Performance monitoring
  async logPerformance(
    system: string,
    component: string,
    operation: string,
    duration: number,
    success: boolean,
    data?: any,
    correlationId?: string,
  ): Promise<void> {
    const level = success ? "debug" : "warn";
    const message = `Performance: ${operation} - ${duration}ms`;

    const entry = this.createLogEntry(
      level,
      system,
      component,
      message,
      {
        operation,
        duration,
        success,
        ...data,
      },
      correlationId,
      undefined,
      undefined,
      undefined,
      duration,
    );

    this.storeLogEntry(entry);

    const logData = {
      system,
      component,
      operation,
      duration,
      success,
      data,
      correlationId,
      id: entry.id,
    };

    if (success) {
      this.logger.debug(message, logData);
    } else {
      this.logger.warn(message, logData);
    }
  }

  // Get logs by correlation ID (useful for tracing requests)
  async getTraceLogs(correlationId: string): Promise<LogEntry[]> {
    return this.logEntries
      .filter((entry) => entry.correlationId === correlationId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
  }

  // Alert on high error rates
  async checkErrorRate(windowMinutes: number = 5): Promise<any> {
    const windowMs = windowMinutes * 60 * 1000;
    const since = new Date(Date.now() - windowMs);

    const recentLogs = this.logEntries.filter(
      (entry) => new Date(entry.timestamp) >= since,
    );

    const errors = recentLogs.filter((entry) => entry.level === "error");
    const errorRate =
      recentLogs.length > 0 ? (errors.length / recentLogs.length) * 100 : 0;

    return {
      windowMinutes,
      totalLogs: recentLogs.length,
      errorCount: errors.length,
      errorRate: Math.round(errorRate * 100) / 100,
      isHigh: errorRate > 5, // 5% threshold
    };
  }
}

