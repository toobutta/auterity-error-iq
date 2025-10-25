/**
 * Cache Manager Service
 * Provides distributed caching for performance optimization across all systems
 */

import Redis from "ioredis";
import { logger } from "../utils/logger";

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memoryUsage: number;
  uptime: number;
}

export class CacheManager {
  private redis: Redis;
  private localCache: Map<string, { value: any; expiry: number }> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor() {
    // Initialize Redis connection
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on("error", (err) => {
      logger.error("Redis connection error:", err);
    });

    this.redis.on("connect", () => {
      logger.info("Connected to Redis cache");
    });

    // Set up periodic cleanup of local cache
    setInterval(() => this.cleanupLocalCache(), 60000); // Every minute
  }

  /**
   * Get a value from cache
   * Uses two-level caching (local memory + Redis) for optimal performance
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Check local cache first for ultra-fast retrieval
      const localValue = this.getFromLocalCache<T>(key);
      if (localValue !== null) {
        this.stats.hits++;
        return localValue;
      }

      // If not in local cache, check Redis
      const value = await this.redis.get(key);

      if (value === null) {
        this.stats.misses++;
        return null;
      }

      // Parse the value
      const parsed = JSON.parse(value) as T;

      // Store in local cache for future fast access
      const ttl = await this.redis.ttl(key);
      if (ttl > 0) {
        this.setInLocalCache(key, parsed, ttl);
      }

      this.stats.hits++;
      return parsed;
    } catch (error) {
      logger.error("Error getting from cache:", error);

      // Fallback to local cache in case of Redis error
      const localValue = this.getFromLocalCache<T>(key);
      if (localValue !== null) {
        return localValue;
      }

      return null;
    }
  }

  /**
   * Set a value in cache
   * Updates both local and Redis caches
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      // Store in Redis
      const serialized = JSON.stringify(value);
      await this.redis.set(key, serialized, "EX", ttl);

      // Also store in local cache
      this.setInLocalCache(key, value, ttl);
    } catch (error) {
      logger.error("Error setting cache:", error);

      // Still update local cache even if Redis fails
      this.setInLocalCache(key, value, ttl);
    }
  }

  /**
   * Invalidate cache entries matching a pattern
   * Supports wildcard invalidation for related keys
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      // Find all keys matching the pattern in Redis
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        // Delete from Redis
        await this.redis.del(...keys);

        // Also remove from local cache
        for (const key of keys) {
          this.localCache.delete(key);
        }

        logger.info(
          `Invalidated ${keys.length} cache keys matching pattern: ${pattern}`,
        );
      }
    } catch (error) {
      logger.error("Error invalidating cache:", error);

      // Try to invalidate local cache even if Redis fails
      for (const key of this.localCache.keys()) {
        if (this.matchesPattern(key, pattern)) {
          this.localCache.delete(key);
        }
      }
    }
  }

  /**
   * Get cache statistics
   * Provides metrics for monitoring cache performance
   */
  async getStats(): Promise<CacheStats> {
    try {
      // Get Redis info
      const info = await this.redis.info();

      // Parse Redis info
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
      const keysMatch = info.match(/keys=(\d+)/);

      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;
      const uptime = uptimeMatch ? parseInt(uptimeMatch[1]) : 0;
      const redisKeys = keysMatch ? parseInt(keysMatch[1]) : 0;

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: redisKeys + this.localCache.size,
        memoryUsage,
        uptime,
      };
    } catch (error) {
      logger.error("Error getting cache stats:", error);

      // Return basic stats if Redis info fails
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: this.localCache.size,
        memoryUsage: 0,
        uptime: 0,
      };
    }
  }

  /**
   * Get a value from local cache
   */
  private getFromLocalCache<T>(key: string): T | null {
    const cached = this.localCache.get(key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (cached.expiry < Date.now()) {
      this.localCache.delete(key);
      return null;
    }

    return cached.value as T;
  }

  /**
   * Set a value in local cache
   */
  private setInLocalCache<T>(key: string, value: T, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.localCache.set(key, { value, expiry });
  }

  /**
   * Clean up expired entries in local cache
   */
  private cleanupLocalCache(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, cached] of this.localCache.entries()) {
      if (cached.expiry < now) {
        this.localCache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  /**
   * Check if a key matches a pattern
   * Supports * wildcard for pattern matching
   */
  private matchesPattern(key: string, pattern: string): boolean {
    // Convert Redis pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".")
      .replace(/\[([^\]]+)\]/g, "[$1]");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }
}

