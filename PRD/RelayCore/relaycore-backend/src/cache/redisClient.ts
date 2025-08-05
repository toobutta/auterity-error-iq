import Redis from 'ioredis';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';

// Redis client instance
let redisClient: Redis | null = null;

// Connect to Redis
export async function connectRedis(): Promise<Redis> {
  try {
    const config = configManager.getCacheConfig();
    
    // Create Redis client
    redisClient = new Redis({
      host: config.redis?.host || process.env.REDIS_HOST || 'localhost',
      port: config.redis?.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config.redis?.password || process.env.REDIS_PASSWORD || undefined,
      db: config.redis?.db || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    
    // Handle Redis events
    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });
    
    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });
    
    redisClient.on('reconnecting', () => {
      logger.info('Reconnecting to Redis');
    });
    
    // Test connection
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

// Get Redis client
export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  
  return redisClient;
}

// Close Redis connection
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

// Cache operations

// Set cache value with TTL
export async function setCache(key: string, value: any, ttl: number = 3600): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    logger.error('Error setting cache:', error);
    throw error;
  }
}

// Get cache value
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    
    if (!value) {
      return null;
    }
    
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('Error getting cache:', error);
    throw error;
  }
}

// Delete cache value
export async function deleteCache(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    logger.error('Error deleting cache:', error);
    throw error;
  }
}

// Clear all cache
export async function clearCache(): Promise<void> {
  try {
    const client = getRedisClient();
    await client.flushdb();
  } catch (error) {
    logger.error('Error clearing cache:', error);
    throw error;
  }
}

// Get cache stats
export async function getCacheStats(): Promise<any> {
  try {
    const client = getRedisClient();
    const info = await client.info('memory');
    const dbSize = await client.dbsize();
    
    return {
      size: dbSize,
      memory: info,
    };
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    throw error;
  }
}