/**
 * Redis cache module
 */

import Redis from 'ioredis';
import { createLogger } from './utils/logger';

const logger = createLogger('cache');

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<void> {
  return new Promise((resolve, reject) => {
    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
      resolve();
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
      reject(error);
    });
  });
}

/**
 * Set a value in the cache
 * 
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds (optional)
 */
export async function set(key: string, value: any, ttl?: number): Promise<void> {
  try {
    const serializedValue = JSON.stringify(value);
    
    if (ttl) {
      await redisClient.set(key, serializedValue, 'EX', ttl);
    } else {
      await redisClient.set(key, serializedValue);
    }
    
    logger.debug(`Cache set: ${key}`);
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Get a value from the cache
 * 
 * @param key Cache key
 * @returns Cached value or null if not found
 */
export async function get<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    
    if (!value) {
      logger.debug(`Cache miss: ${key}`);
      return null;
    }
    
    logger.debug(`Cache hit: ${key}`);
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Delete a value from the cache
 * 
 * @param key Cache key
 */
export async function del(key: string): Promise<void> {
  try {
    await redisClient.del(key);
    logger.debug(`Cache delete: ${key}`);
  } catch (error) {
    logger.error(`Cache delete error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Clear all values from the cache
 */
export async function clear(): Promise<void> {
  try {
    await redisClient.flushall();
    logger.info('Cache cleared');
  } catch (error) {
    logger.error('Cache clear error:', error);
    throw error;
  }
}

/**
 * Close the Redis connection
 */
export async function closeRedis(): Promise<void> {
  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
    throw error;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Closing Redis connection...');
  await closeRedis();
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM. Closing Redis connection...');
  await closeRedis();
});