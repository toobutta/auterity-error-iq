import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { getCache, setCache } from './redisClient';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';

// Cache middleware
export const cacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = configManager.getCacheConfig();
    
    // Check if caching is enabled
    if (!config.enabled) {
      return next();
    }
    
    // Check cache control header
    const cacheControl = req.header('X-AIHub-Cache') || 'use';
    
    if (cacheControl === 'bypass') {
      // Skip cache
      res.setHeader('X-AIHub-Cache-Status', 'bypass');
      return next();
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(req);
    
    // Set cache key header
    res.setHeader('X-AIHub-Cache-Key', cacheKey);
    
    // Check cache for existing response
    if (cacheControl !== 'update') {
      try {
        const cachedResponse = await getCache(cacheKey);
        
        if (cachedResponse) {
          // Add cache headers
          res.setHeader('X-AIHub-Cache-Status', 'hit');
          
          // Return cached response
          return res.status(200).json(cachedResponse);
        }
        
        // Check for similarity cache if enabled
        if (config.similarityCache?.enabled) {
          const similarResponse = await findSimilarCachedRequest(req, config.similarityCache.threshold || 0.92);
          
          if (similarResponse) {
            // Add cache headers
            res.setHeader('X-AIHub-Cache-Status', 'similarity-hit');
            res.setHeader('X-AIHub-Cache-Similarity', similarResponse.similarity.toString());
            
            // Return similar response
            return res.status(200).json(similarResponse.response);
          }
        }
      } catch (error) {
        logger.error('Cache error:', error);
        // Continue without cache
      }
    }
    
    // No cache hit, continue to next middleware
    res.setHeader('X-AIHub-Cache-Status', 'miss');
    
    // Store original send function
    const originalSend = res.send;
    
    // Override send function to cache response
    res.send = function(body) {
      // Only cache successful responses
      if (res.statusCode === 200 && cacheControl !== 'bypass') {
        const ttl = parseInt(req.header('X-AIHub-Cache-TTL') || config.ttl?.toString() || '3600');
        
        try {
          // Parse body if it's a string
          const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
          
          // Store in cache
          setCache(cacheKey, responseBody, ttl).catch((err) => {
            logger.error('Cache storage error:', err);
          });
          
          // Store embedding for similarity search if enabled
          if (config.similarityCache?.enabled) {
            storeCacheEmbedding(req, cacheKey, responseBody).catch((err) => {
              logger.error('Cache embedding storage error:', err);
            });
          }
        } catch (error) {
          logger.error('Cache storage error:', error);
        }
      }
      
      // Call original send function
      return originalSend.call(this, body);
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Generate cache key from request
function generateCacheKey(req: Request): string {
  // Create a deterministic representation of the request
  const requestData = {
    path: req.path,
    body: req.body,
    headers: {
      // Include only relevant headers
      'content-type': req.headers['content-type'],
    },
  };
  
  // Generate hash of request data
  const hash = createHash('sha256')
    .update(JSON.stringify(requestData))
    .digest('hex');
  
  return `relaycore:cache:${hash}`;
}

// Find similar cached request
// This is a placeholder implementation
// In a real implementation, this would use embeddings to find similar requests
async function findSimilarCachedRequest(req: Request, similarityThreshold: number): Promise<{ response: any; similarity: number } | null> {
  // This is a placeholder implementation
  // In a real implementation, this would:
  // 1. Generate an embedding for the current request
  // 2. Find similar embeddings in the cache
  // 3. Return the most similar response if above threshold
  
  // For now, return null to indicate no similar request found
  return null;
}

// Store cache embedding for similarity search
// This is a placeholder implementation
async function storeCacheEmbedding(req: Request, cacheKey: string, responseBody: any): Promise<void> {
  // This is a placeholder implementation
  // In a real implementation, this would:
  // 1. Generate an embedding for the request
  // 2. Store the embedding with the cache key
  
  // For now, do nothing
}