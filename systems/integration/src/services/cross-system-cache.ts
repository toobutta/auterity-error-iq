import { createClient, RedisClientType } from "redis";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

export interface CacheEntry {
  key: string;
  value: any;
  ttl?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  system?: string;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  system?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

export class CrossSystemCache extends EventEmitter {
  private client?: RedisClientType;
  private isConnected = false;
  private localCache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  constructor(
    private url: string = process.env.REDIS_URL || "redis://localhost:6379",
    private localCacheSize: number = 1000,
    private enableLocalCache: boolean = true,
  ) {
    super();
  }

  async initialize(): Promise<void> {
    try {
      this.client = createClient({ url: this.url });

      this.client.on("error", (error) => {

        this.isConnected = false;
        this.emit("connection-error", error);
      });

      this.client.on("connect", () => {

        this.isConnected = true;
        this.emit("connected");
      });

      this.client.on("disconnect", () => {

        this.isConnected = false;
        this.emit("disconnected");
      });

      await this.client.connect();

    } catch (error) {

      // Fallback to local cache only

    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
      }
      this.isConnected = false;

    } catch (error) {

    }
  }

  async set(
    key: string,
    value: any,
    options: CacheOptions = {},
  ): Promise<void> {
    const entry: CacheEntry = {
      key,
      value,
      ttl: options.ttl,
      tags: options.tags,
      system: options.system,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Store in Redis if connected
      if (this.isConnected && this.client) {
        const serializedEntry = JSON.stringify(entry);
        if (options.ttl) {
          await this.client.setEx(key, options.ttl, serializedEntry);
        } else {
          await this.client.set(key, serializedEntry);
        }

        // Store tags for efficient invalidation
        if (options.tags && options.tags.length > 0) {
          for (const tag of options.tags) {
            await this.client.sAdd(`tag:${tag}`, key);
          }
        }

        this.emit("cache-set", { key, entry });
      }

      // Store in local cache
      if (this.enableLocalCache) {
        this.ensureLocalCacheSize();
        this.localCache.set(key, entry);
      }

      this.stats.sets++;
      this.emit("entry-set", entry);
    } catch (error) {

      // Fallback to local cache
      if (this.enableLocalCache) {
        this.localCache.set(key, entry);
      }
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      // Try local cache first
      if (this.enableLocalCache) {
        const localEntry = this.localCache.get(key);
        if (localEntry) {
          this.stats.hits++;
          this.emit("cache-hit", { key, source: "local" });
          return localEntry.value;
        }
      }

      // Try Redis cache
      if (this.isConnected && this.client) {
        const serializedEntry = await this.client.get(key);
        if (serializedEntry) {
          const entry: CacheEntry = JSON.parse(serializedEntry);
          this.stats.hits++;

          // Update local cache
          if (this.enableLocalCache) {
            this.localCache.set(key, entry);
          }

          this.emit("cache-hit", { key, source: "redis" });
          return entry.value;
        }
      }

      this.stats.misses++;
      this.emit("cache-miss", { key });
      return null;
    } catch (error) {

      this.stats.misses++;
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      let deleted = false;

      // Delete from Redis
      if (this.isConnected && this.client) {
        const result = await this.client.del(key);
        if (result > 0) {
          deleted = true;

          // Remove from tag sets
          const entry = await this.getEntry(key);
          if (entry && entry.tags) {
            for (const tag of entry.tags) {
              await this.client.sRem(`tag:${tag}`, key);
            }
          }
        }
      }

      // Delete from local cache
      if (this.enableLocalCache) {
        deleted = deleted || this.localCache.delete(key);
      }

      if (deleted) {
        this.stats.deletes++;
        this.emit("entry-deleted", { key });
      }

      return deleted;
    } catch (error) {

      // Fallback to local cache deletion
      if (this.enableLocalCache) {
        return this.localCache.delete(key);
      }
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      // Clear Redis
      if (this.isConnected && this.client) {
        await this.client.flushAll();
      }

      // Clear local cache
      if (this.enableLocalCache) {
        this.localCache.clear();
      }

      this.emit("cache-cleared");

    } catch (error) {

    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    try {
      let invalidated = 0;

      if (this.isConnected && this.client) {
        // Get all keys with this tag
        const keys = await this.client.sMembers(`tag:${tag}`);

        if (keys.length > 0) {
          // Delete all tagged keys
          const result = await this.client.del(keys);
          invalidated = result;

          // Remove the tag set
          await this.client.del(`tag:${tag}`);
        }

        // Remove from local cache
        if (this.enableLocalCache) {
          for (const key of keys) {
            this.localCache.delete(key);
          }
        }

        this.emit("tag-invalidated", { tag, keys: keys.length });
      }

      return invalidated;
    } catch (error) {

      return 0;
    }
  }

  async invalidateBySystem(system: string): Promise<number> {
    try {
      let invalidated = 0;

      if (this.isConnected && this.client) {
        // Get all keys for this system
        const keys = await this.client.keys(`${system}:*`);

        if (keys.length > 0) {
          const result = await this.client.del(keys);
          invalidated = result;
        }

        // Remove from local cache
        if (this.enableLocalCache) {
          for (const key of keys) {
            this.localCache.delete(key);
          }
        }

        this.emit("system-invalidated", { system, keys: keys.length });
      }

      return invalidated;
    } catch (error) {

      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      // Check local cache first
      if (this.enableLocalCache && this.localCache.has(key)) {
        return true;
      }

      // Check Redis
      if (this.isConnected && this.client) {
        const result = await this.client.exists(key);
        return result === 1;
      }

      return false;
    } catch (error) {

      return false;
    }
  }

  async getEntry(key: string): Promise<CacheEntry | null> {
    try {
      // Try local cache first
      if (this.enableLocalCache) {
        const entry = this.localCache.get(key);
        if (entry) {
          return entry;
        }
      }

      // Try Redis
      if (this.isConnected && this.client) {
        const serializedEntry = await this.client.get(key);
        if (serializedEntry) {
          return JSON.parse(serializedEntry);
        }
      }

      return null;
    } catch (error) {

      return null;
    }
  }

  async getByTag(tag: string): Promise<CacheEntry[]> {
    try {
      const entries: CacheEntry[] = [];

      if (this.isConnected && this.client) {
        const keys = await this.client.sMembers(`tag:${tag}`);

        for (const key of keys) {
          const entry = await this.getEntry(key);
          if (entry) {
            entries.push(entry);
          }
        }
      }

      return entries;
    } catch (error) {

      return [];
    }
  }

  async getBySystem(system: string): Promise<CacheEntry[]> {
    try {
      const entries: CacheEntry[] = [];

      if (this.isConnected && this.client) {
        const keys = await this.client.keys(`${system}:*`);

        for (const key of keys) {
          const entry = await this.getEntry(key);
          if (entry) {
            entries.push(entry);
          }
        }
      }

      return entries;
    } catch (error) {

      return [];
    }
  }

  async setMultiple(
    entries: Array<{ key: string; value: any; options?: CacheOptions }>,
  ): Promise<void> {
    const promises = entries.map(({ key, value, options }) =>
      this.set(key, value, options),
    );
    await Promise.all(promises);
  }

  async getMultiple(keys: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        results.set(key, value);
      }
    }

    return results;
  }

  async deleteMultiple(keys: string[]): Promise<number> {
    let deleted = 0;

    for (const key of keys) {
      if (await this.delete(key)) {
        deleted++;
      }
    }

    return deleted;
  }

  // Cache warming for frequently accessed data
  async warmCache(keys: string[]): Promise<void> {

    for (const key of keys) {
      // This would typically fetch from the database or external source
      // For now, we'll just mark it as a cache warming operation
      this.emit("cache-warming", { key });
    }
  }

  // Cache statistics and monitoring
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate =
      totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      size: this.localCache.size,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  async getRedisInfo(): Promise<any> {
    if (!this.isConnected || !this.client) {
      return { status: "disconnected" };
    }

    try {
      const info = await this.client.info();
      const redisInfo = info as any; // Redis INFO command returns string keys
      return {
        status: "connected",
        version: redisInfo.redis_version,
        uptime: redisInfo.uptime_in_seconds,
        memory: redisInfo.used_memory_human,
        connections: redisInfo.connected_clients,
        commands: redisInfo.total_commands_processed,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return { status: "error", error: errorMessage };
    }
  }

  // Local cache management
  private ensureLocalCacheSize(): void {
    if (this.localCache.size >= this.localCacheSize) {
      // Remove oldest entries (simple LRU-like behavior)
      const entries = Array.from(this.localCache.entries());
      const toRemove = Math.floor(this.localCacheSize * 0.1); // Remove 10%

      for (let i = 0; i < toRemove; i++) {
        const [key] = entries[i];
        this.localCache.delete(key);
      }
    }
  }

  // Health check
  async healthCheck(): Promise<any> {
    const stats = this.getStats();
    const redisInfo = await this.getRedisInfo();

    return {
      status: this.isConnected ? "healthy" : "degraded",
      redis: redisInfo,
      localCache: {
        size: this.localCache.size,
        maxSize: this.localCacheSize,
      },
      performance: stats,
      timestamp: new Date().toISOString(),
    };
  }

  // Cache synchronization between systems
  async syncWithSystem(system: string, data: any): Promise<void> {
    const syncKey = `sync:${system}:${Date.now()}`;
    await this.set(syncKey, data, {
      ttl: 300, // 5 minutes
      tags: ["sync", system],
      system,
    });

    this.emit("system-sync", { system, key: syncKey });
  }

  // Cache invalidation patterns
  async invalidateUserData(userId: string): Promise<number> {
    return this.invalidateByTag(`user:${userId}`);
  }

  async invalidateWorkflowData(workflowId: string): Promise<number> {
    return this.invalidateByTag(`workflow:${workflowId}`);
  }

  async invalidateModelData(modelId: string): Promise<number> {
    return this.invalidateByTag(`model:${modelId}`);
  }

  // Pattern-based operations
  async getPattern(pattern: string): Promise<string[]> {
    if (!this.isConnected || !this.client) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {

      return [];
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const result = await this.client.del(keys);
        this.stats.deletes += result;
        return result;
      }
      return 0;
    } catch (error) {

      return 0;
    }
  }

  // Add missing method for integration
  async getStatus(): Promise<any> {
    const stats = this.getStats();
    return {
      status: this.isConnected ? "healthy" : "disconnected",
      connection: this.isConnected ? "connected" : "disconnected",
      localCacheSize: this.localCache.size,
      stats,
      timestamp: new Date().toISOString(),
    };
  }
}

