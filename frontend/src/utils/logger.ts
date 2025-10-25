/**
 * Frontend logging utility with structured logging and correlation ID support
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

export interface LoggerConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  minLogLevel: LogLevel;
  maxLogEntries: number;
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number;
}

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushTimer?: ReturnType<typeof setInterval>;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableConsoleLogging: import.meta.env.DEV === true,
      enableRemoteLogging: import.meta.env.PROD === true,
      minLogLevel:
        import.meta.env.DEV === true ? LogLevel.DEBUG : LogLevel.INFO,
      maxLogEntries: 1000,
      remoteEndpoint: "/api/logs",
      batchSize: 10,
      flushInterval: 5000,
      ...config,
    };

    // Set up periodic flushing
    if (this.config.enableRemoteLogging) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }

    // Flush logs before page unload
    window.addEventListener("beforeunload", () => {
      this.flush();
    });
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];
    const currentLevelIndex = levels.indexOf(this.config.minLogLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    correlationId?: string,
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      correlationId,
      context,
      component:
        typeof context?.component === "string" ? context.component : undefined,
      action: typeof context?.action === "string" ? context.action : undefined,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  private getUserId(): string | undefined {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user).id : undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string | undefined {
    return sessionStorage.getItem("sessionId") || undefined;
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Remove old entries if buffer is full
    if (this.logBuffer.length > this.config.maxLogEntries) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxLogEntries);
    }

    // Auto-flush if batch size reached
    if (
      this.config.enableRemoteLogging &&
      this.logBuffer.length >= this.config.batchSize
    ) {
      this.flush();
    }
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsoleLogging) return;

    const logData = {
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      correlationId: entry.correlationId,
      component: entry.component,
      action: entry.action,
      ...entry.context,
    };

    switch (entry.level) {
      case LogLevel.DEBUG:

        break;
      case LogLevel.INFO:
        console.info("[INFO]", logData);
        break;
      case LogLevel.WARN:

        break;
      case LogLevel.ERROR:

        break;
    }
  }

  public debug(
    message: string,
    context?: Record<string, unknown>,
    correlationId?: string,
  ): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.createLogEntry(
      LogLevel.DEBUG,
      message,
      context,
      correlationId,
    );
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  public info(
    message: string,
    context?: Record<string, unknown>,
    correlationId?: string,
  ): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.createLogEntry(
      LogLevel.INFO,
      message,
      context,
      correlationId,
    );
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  public warn(
    message: string,
    context?: Record<string, unknown>,
    correlationId?: string,
  ): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.createLogEntry(
      LogLevel.WARN,
      message,
      context,
      correlationId,
    );
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  public error(
    message: string,
    context?: Record<string, unknown>,
    correlationId?: string,
  ): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry = this.createLogEntry(
      LogLevel.ERROR,
      message,
      context,
      correlationId,
    );
    this.logToConsole(entry);
    this.addToBuffer(entry);
  }

  public logUserAction(
    action: string,
    component: string,
    context?: Record<string, unknown>,
  ): void {
    this.info(`User action: ${action}`, {
      component,
      action,
      ...context,
    });
  }

  public logApiCall(
    method: string,
    url: string,
    status?: number,
    duration?: number,
    correlationId?: string,
  ): void {
    const level = status && status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API ${method} ${url} - ${status || "pending"}`;

    if (level === LogLevel.ERROR) {
      this.error(
        message,
        {
          component: "ApiClient",
          action: "api_call",
          method,
          url,
          status,
          duration,
        },
        correlationId,
      );
    } else {
      this.info(
        message,
        {
          component: "ApiClient",
          action: "api_call",
          method,
          url,
          status,
          duration,
        },
        correlationId,
      );
    }
  }

  public logWorkflowEvent(
    event: string,
    workflowId: string,
    executionId?: string,
    context?: Record<string, unknown>,
  ): void {
    this.info(`Workflow ${event}`, {
      component: "WorkflowEngine",
      action: event,
      workflowId,
      executionId,
      ...context,
    });
  }

  public async flush(): Promise<void> {
    if (
      !this.config.enableRemoteLogging ||
      this.logBuffer.length === 0 ||
      !this.config.remoteEndpoint
    ) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Send logs to backend
      const response = await fetch(this.config.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({ logs: logsToSend }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send logs: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      // If sending fails, put logs back in buffer (but don't log the error to avoid recursion)
      this.logBuffer.unshift(...logsToSend);
      console.error(
        "Failed to send logs to server:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  public getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  public clearBuffer(): void {
    this.logBuffer = [];
  }

  public filterLogs(filter: {
    level?: LogLevel;
    component?: string;
    action?: string;
    correlationId?: string;
    startTime?: Date;
    endTime?: Date;
  }): LogEntry[] {
    return this.logBuffer.filter((entry) => {
      if (filter.level && entry.level !== filter.level) return false;
      if (filter.component && entry.component !== filter.component)
        return false;
      if (filter.action && entry.action !== filter.action) return false;
      if (filter.correlationId && entry.correlationId !== filter.correlationId)
        return false;
      if (filter.startTime && entry.timestamp < filter.startTime) return false;
      if (filter.endTime && entry.timestamp > filter.endTime) return false;
      return true;
    });
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (
  message: string,
  context?: Record<string, unknown>,
  correlationId?: string,
) => logger.debug(message, context, correlationId);

export const logInfo = (
  message: string,
  context?: Record<string, unknown>,
  correlationId?: string,
) => logger.info(message, context, correlationId);

export const logWarn = (
  message: string,
  context?: Record<string, unknown>,
  correlationId?: string,
) => logger.warn(message, context, correlationId);

export const logError = (
  message: string,
  context?: Record<string, unknown>,
  correlationId?: string,
) => logger.error(message, context, correlationId);

export const logUserAction = (
  action: string,
  component: string,
  context?: Record<string, unknown>,
) => logger.logUserAction(action, component, context);

export const logApiCall = (
  method: string,
  url: string,
  status?: number,
  duration?: number,
  correlationId?: string,
) => logger.logApiCall(method, url, status, duration, correlationId);

export const logWorkflowEvent = (
  event: string,
  workflowId: string,
  executionId?: string,
  context?: Record<string, unknown>,
) => logger.logWorkflowEvent(event, workflowId, executionId, context);


