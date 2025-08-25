/**
 * Enterprise API Gateway
 * Centralized API management, security, and rate limiting
 */

import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { createProxyMiddleware } from "http-proxy-middleware";
import { promisify } from "util";
import Redis from "ioredis";
import { logger } from "./src/utils/logger";

export interface GatewayConfig {
  port: number;
  jwt_secret: string;
  redis_url: string;
  rate_limits: {
    global: { windowMs: number; max: number };
    api: { windowMs: number; max: number };
    auth: { windowMs: number; max: number };
  };
  cors_origins: string[];
  upstream_services: {
    [key: string]: {
      url: string;
      health_check: string;
      timeout: number;
    };
  };
}

export class EnterpriseAPIGateway {
  private app: express.Application;
  private redis: Redis;
  private config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.config = config;
    this.app = express();
    this.redis = new Redis(config.redis_url);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      }),
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: this.config.cors_origins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
      }),
    );

    // JSON parsing
    this.app.use(express.json({ limit: "10mb" }));

    // Global rate limiting
    this.app.use(
      "/",
      rateLimit({
        windowMs: this.config.rate_limits.global.windowMs,
        max: this.config.rate_limits.global.max,
        message: "Too many requests from this IP",
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );

    // API-specific rate limiting
    this.app.use(
      "/api/",
      rateLimit({
        windowMs: this.config.rate_limits.api.windowMs,
        max: this.config.rate_limits.api.max,
        message: "Too many API requests",
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );

    // Authentication rate limiting
    this.app.use(
      "/auth/",
      rateLimit({
        windowMs: this.config.rate_limits.auth.windowMs,
        max: this.config.rate_limits.auth.max,
        message: "Too many authentication attempts",
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );

    // JWT Authentication middleware
    this.app.use("/api/", this.authenticateJWT.bind(this));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        timestamp: new Date().toISOString(),
      });
      next();
    });
  }

  private async authenticateJWT(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void> {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers["x-api-key"] as string;

    // Allow API key authentication
    if (apiKey) {
      const isValid = await this.validateAPIKey(apiKey);
      if (isValid) {
        (req as any).user = { apiKey, type: "api_key" };
        return next();
      }
    }

    // JWT authentication
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, this.config.jwt_secret);
          (req as any).user = decoded;
          return next();
        } catch (error) {
          logger.warn("Invalid JWT token", { error: error.message });
        }
      }
    }

    res.status(401).json({
      error: "Unauthorized",
      message: "Valid JWT token or API key required",
    });
  }

  private async validateAPIKey(apiKey: string): Promise<boolean> {
    try {
      const cached = await this.redis.get(`api_key:${apiKey}`);
      if (cached) {
        return cached === "valid";
      }

      // In a real implementation, validate against database
      // For now, accept any key starting with 'ak_'
      const isValid = apiKey.startsWith("ak_") && apiKey.length >= 32;

      // Cache the result for 5 minutes
      await this.redis.setex(
        `api_key:${apiKey}`,
        300,
        isValid ? "valid" : "invalid",
      );

      return isValid;
    } catch (error) {
      logger.error("Error validating API key", { error: error.message });
      return false;
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        uptime: process.uptime(),
      });
    });

    // Gateway management endpoints
    this.setupManagementRoutes();

    // Proxy routes to upstream services
    this.setupProxyRoutes();
  }

  private setupManagementRoutes(): void {
    // Rate limit information
    this.app.get("/api/gateway/rate-limits", (req, res) => {
      res.json({
        global: this.config.rate_limits.global,
        api: this.config.rate_limits.api,
        auth: this.config.rate_limits.auth,
      });
    });

    // Service status
    this.app.get("/api/gateway/services", async (req, res) => {
      const services = {};

      for (const [name, config] of Object.entries(
        this.config.upstream_services,
      )) {
        try {
          // Use AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(
            () => controller.abort(),
            config.timeout,
          );

          const response = await fetch(config.health_check, {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          services[name] = {
            status: response.ok ? "healthy" : "unhealthy",
            url: config.url,
            response_time: Date.now() - Date.now(), // Simplified
          };
        } catch (error) {
          services[name] = {
            status: "error",
            url: config.url,
            error: error.message,
          };
        }
      }

      res.json({ services });
    });

    // Gateway metrics
    this.app.get("/api/gateway/metrics", async (req, res) => {
      try {
        const metrics = await this.collectMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: "Failed to collect metrics" });
      }
    });
  }

  private setupProxyRoutes(): void {
    // AutoMatrix (Workflow Engine)
    this.app.use(
      "/api/v1/workflows",
      createProxyMiddleware({
        target:
          this.config.upstream_services.autmatrix?.url ||
          "http://localhost:8000",
        changeOrigin: true,
        pathRewrite: { "^/api/v1/workflows": "/api/v1/workflows" },
        onError: (err, req, res) => {
          logger.error("AutoMatrix proxy error", { error: err.message });
          res.status(502).json({ error: "Service temporarily unavailable" });
        },
      }),
    );

    // RelayCore (AI Router)
    this.app.use(
      "/api/v1/ai",
      createProxyMiddleware({
        target:
          this.config.upstream_services.relaycore?.url ||
          "http://localhost:3001",
        changeOrigin: true,
        pathRewrite: { "^/api/v1/ai": "/api/v1" },
        onError: (err, req, res) => {
          logger.error("RelayCore proxy error", { error: err.message });
          res.status(502).json({ error: "AI service temporarily unavailable" });
        },
      }),
    );

    // NeuroWeaver (Model Training)
    this.app.use(
      "/api/v1/models",
      createProxyMiddleware({
        target:
          this.config.upstream_services.neuroweaver?.url ||
          "http://localhost:8080",
        changeOrigin: true,
        pathRewrite: { "^/api/v1/models": "/api/v1/models" },
        onError: (err, req, res) => {
          logger.error("NeuroWeaver proxy error", { error: err.message });
          res
            .status(502)
            .json({ error: "Model service temporarily unavailable" });
        },
      }),
    );
  }

  private async collectMetrics(): Promise<any> {
    const [totalRequests, errorRate, avgResponseTime] = await Promise.all([
      this.redis.get("metrics:total_requests") || "0",
      this.redis.get("metrics:error_rate") || "0",
      this.redis.get("metrics:avg_response_time") || "0",
    ]);

    return {
      total_requests: parseInt(totalRequests),
      error_rate: parseFloat(errorRate),
      avg_response_time: parseFloat(avgResponseTime),
      timestamp: new Date().toISOString(),
    };
  }

  public start(): void {
    this.app.listen(this.config.port, () => {
      logger.info(`Enterprise API Gateway started on port ${this.config.port}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Default configuration
export const defaultGatewayConfig: GatewayConfig = {
  port: parseInt(process.env.GATEWAY_PORT || "3000"),
  jwt_secret: process.env.JWT_SECRET || "your-secret-key",
  redis_url: process.env.REDIS_URL || "redis://localhost:6379",
  rate_limits: {
    global: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 per 15 minutes
    api: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 per 15 minutes
    auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 per 15 minutes
  },
  cors_origins: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://app.auterity.com",
  ],
  upstream_services: {
    autmatrix: {
      url: "http://localhost:8000",
      health_check: "http://localhost:8000/health",
      timeout: 5000,
    },
    relaycore: {
      url: "http://localhost:3001",
      health_check: "http://localhost:3001/health",
      timeout: 5000,
    },
    neuroweaver: {
      url: "http://localhost:8080",
      health_check: "http://localhost:8080/health",
      timeout: 5000,
    },
  },
};
