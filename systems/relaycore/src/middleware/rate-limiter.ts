/**
 * Advanced Rate Limiting & Throttling Middleware
 * Implements intelligent rate limiting with per-provider, per-user, and global limits
 */

import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { CacheManager } from "../services/cache-manager";

export interface RateLimitConfig {
  global: {
    requests: number;
    window: number;
    burst: number;
  };
  perProvider: Record<
    string,
    {
      requests: number;
      window: number;
      burst: number;
    }
  >;
  perUser: {
    requests: number;
    window: number;
  };
  emergency: {
    enabled: boolean;
    threshold: number;
  };
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class IntelligentRateLimiter {
  private cacheManager: CacheManager;
  private config: RateLimitConfig;
  private emergencyMode: boolean = false;

  constructor(config: RateLimitConfig, cacheManager: CacheManager) {
    this.config = config;
    this.cacheManager = cacheManager;

    // Monitor system load for emergency mode
    this.monitorSystemLoad();
  }

  /**
   * Check rate limit for incoming request
   */
  async checkRateLimit(req: Request): Promise<RateLimitResult> {
    const userId = this.getUserId(req);
    const provider = this.getProvider(req);
    const ip = req.ip || "127.0.0.1";

    // Check global rate limit
    const globalLimit = await this.checkGlobalLimit(ip);
    if (!globalLimit.allowed) {
      return globalLimit;
    }

    // Check per-user rate limit
    if (userId) {
      const userLimit = await this.checkUserLimit(userId);
      if (!userLimit.allowed) {
        return userLimit;
      }
    }

    // Check per-provider rate limit
    if (provider) {
      const providerLimit = await this.checkProviderLimit(
        provider,
        userId || ip,
      );
      if (!providerLimit.allowed) {
        return providerLimit;
      }
    }

    return { allowed: true, limit: 0, remaining: 0, resetTime: 0 };
  }

  /**
   * Check global rate limit
   */
  private async checkGlobalLimit(ip: string): Promise<RateLimitResult> {
    const key = `rate_limit:global:${ip}`;
    const limit = this.emergencyMode
      ? Math.floor(this.config.global.requests * 0.5)
      : this.config.global.requests;

    return this.performRateLimitCheck(key, limit, this.config.global.window);
  }

  /**
   * Check per-user rate limit
   */
  private async checkUserLimit(userId: string): Promise<RateLimitResult> {
    const key = `rate_limit:user:${userId}`;
    return this.performRateLimitCheck(
      key,
      this.config.perUser.requests,
      this.config.perUser.window,
    );
  }

  /**
   * Check per-provider rate limit
   */
  private async checkProviderLimit(
    provider: string,
    identifier: string,
  ): Promise<RateLimitResult> {
    const providerConfig = this.config.perProvider[provider];
    if (!providerConfig) {
      return { allowed: true, limit: 0, remaining: 0, resetTime: 0 };
    }

    const key = `rate_limit:provider:${provider}:${identifier}`;
    return this.performRateLimitCheck(
      key,
      providerConfig.requests,
      providerConfig.window,
    );
  }

  /**
   * Perform token bucket algorithm rate limit check
   */
  private async performRateLimitCheck(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const window = Math.floor(now / windowMs);
      const cacheKey = `${key}:${window}`;

      // Get current count from cache
      let count = (await this.cacheManager.get(cacheKey)) as number;
      if (!count) {
        count = 0;
      }

      if (count >= limit) {
        const resetTime = (window + 1) * windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        return {
          allowed: false,
          limit,
          remaining: 0,
          resetTime,
          retryAfter,
        };
      }

      // Increment counter
      const newCount = count + 1;
      await this.cacheManager.set(
        cacheKey,
        newCount,
        Math.ceil(windowMs / 1000),
      );

      return {
        allowed: true,
        limit,
        remaining: limit - newCount,
        resetTime: (window + 1) * windowMs,
      };
    } catch (error) {
      logger.error("Rate limit check failed:", error);
      // Fail open - allow request if rate limiting fails
      return { allowed: true, limit: 0, remaining: 0, resetTime: 0 };
    }
  }

  /**
   * Monitor system load for emergency mode
   */
  private monitorSystemLoad(): void {
    if (!this.config.emergency.enabled) return;

    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      if (memPercentage > this.config.emergency.threshold) {
        if (!this.emergencyMode) {
          this.emergencyMode = true;
          logger.warn(
            `Emergency mode activated: Memory usage ${memPercentage.toFixed(1)}%`,
          );
        }
      } else if (
        this.emergencyMode &&
        memPercentage < this.config.emergency.threshold * 0.8
      ) {
        this.emergencyMode = false;
        logger.info("Emergency mode deactivated");
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Extract user ID from request
   */
  private getUserId(req: Request): string | null {
    return (req as any).user?.id || null;
  }

  /**
   * Extract provider from request
   */
  private getProvider(req: Request): string | null {
    // Extract from URL path or request body
    const pathMatch = req.path.match(/\/api\/v1\/ai\/(\w+)/);
    if (pathMatch) return pathMatch[1];

    return req.body?.provider || null;
  }
}

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(
  config: RateLimitConfig,
  cacheManager: CacheManager,
) {
  const rateLimiter = new IntelligentRateLimiter(config, cacheManager);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await rateLimiter.checkRateLimit(req);

      // Set rate limit headers
      res.set({
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetTime.toString(),
      });

      if (!result.allowed) {
        if (result.retryAfter) {
          res.set("Retry-After", result.retryAfter.toString());
        }

        return res.status(429).json({
          success: false,
          error: {
            message: "Too many requests, please try again later",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: result.retryAfter,
          },
        });
      }

      next();
    } catch (error) {
      logger.error("Rate limit middleware error:", error);
      // Fail open - continue processing if rate limiting fails
      next();
    }
  };
}

/**
 * Create speed limiting middleware for gradual slowdown
 */
export function createSpeedLimitMiddleware(
  windowMs: number = 60000,
  delayAfter: number = 50,
) {
  return slowDown({
    windowMs,
    delayAfter,
    delayMs: (hits) => hits * 100, // Increase delay by 100ms for each request after delayAfter
    maxDelayMs: 5000, // Maximum delay of 5 seconds
    skipSuccessfulRequests: true,
    skipFailedRequests: true,
  });
}

/**
 * Default rate limit configuration
 */
export const defaultRateLimitConfig: RateLimitConfig = {
  global: {
    requests: 1000,
    window: 60000, // 1 minute
    burst: 50,
  },
  perProvider: {
    openai: {
      requests: 100,
      window: 60000,
      burst: 10,
    },
    anthropic: {
      requests: 80,
      window: 60000,
      burst: 8,
    },
    neuroweaver: {
      requests: 200,
      window: 60000,
      burst: 20,
    },
  },
  perUser: {
    requests: 500,
    window: 60000,
  },
  emergency: {
    enabled: true,
    threshold: 85, // Activate when memory usage > 85%
  },
};

