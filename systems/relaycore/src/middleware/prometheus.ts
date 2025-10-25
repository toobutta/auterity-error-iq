/**
 * Prometheus metrics middleware for RelayCore
 */

import { Request, Response, NextFunction } from "express";
import promClient from "prom-client";

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// HTTP Metrics
const httpRequestsTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route"],
  registers: [register],
});

// AI-specific metrics
const aiRequestsTotal = new promClient.Counter({
  name: "ai_requests_total",
  help: "Total AI requests processed",
  labelNames: ["provider", "model", "status"],
  registers: [register],
});

const aiRequestCost = new promClient.Counter({
  name: "ai_request_cost_total",
  help: "Total cost of AI requests in dollars",
  labelNames: ["provider", "model"],
  registers: [register],
});

const aiResponseTokens = new promClient.Histogram({
  name: "ai_response_tokens",
  help: "Number of tokens in AI responses",
  labelNames: ["provider", "model"],
  registers: [register],
});

export const prometheusMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.path === "/metrics") {
    res.set("Content-Type", register.contentType);
    res.end(register.metrics());
    return;
  }

  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();

    httpRequestDuration.labels(req.method, route).observe(duration);
  });

  next();
};

export const recordAIRequest = (
  provider: string,
  model: string,
  cost: number,
  tokens: number,
  success: boolean,
) => {
  const status = success ? "success" : "failed";
  aiRequestsTotal.labels(provider, model, status).inc();

  if (success) {
    aiRequestCost.labels(provider, model).inc(cost);
    aiResponseTokens.labels(provider, model).observe(tokens);
  }
};

export { register };

