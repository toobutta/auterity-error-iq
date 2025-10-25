/**
 * Semantic Caching Service
 * Implements intelligent caching based on vector embeddings and semantic similarity
 */

import crypto from "crypto";
import { CacheManager } from "./cache-manager";
import { logger } from "../utils/logger";

export interface SemanticCacheConfig {
  enabled: boolean;
  similarityThreshold: number; // 0.0 - 1.0, higher means more strict matching
  maxCacheSize: number;
  ttlSeconds: number;
  embeddingProvider: "openai" | "local";
  localModelPath?: string;
}

export interface CachedResponse {
  id: string;
  embedding: number[];
  response: any;
  metadata: {
    provider: string;
    model: string;
    timestamp: number;
    hitCount: number;
    lastAccessed: number;
  };
}

export interface SemanticSearchRequest {
  prompt: string;
  provider: string;
  model: string;
  parameters?: Record<string, any>;
}

export class SemanticCache {
  private config: SemanticCacheConfig;
  private cacheManager: CacheManager;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(config: SemanticCacheConfig, cacheManager: CacheManager) {
    this.config = config;
    this.cacheManager = cacheManager;

    if (!this.config.enabled) {
      logger.info("Semantic caching is disabled");
      return;
    }

    logger.info(
      `Semantic cache initialized with threshold: ${this.config.similarityThreshold}`,
    );
  }

  /**
   * Check if a similar cached response exists
   */
  async checkCache(
    request: SemanticSearchRequest,
  ): Promise<CachedResponse | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const queryEmbedding = await this.getEmbedding(request.prompt);
      const cacheKey = this.generateCacheKey(request.provider, request.model);

      // Get all cached responses for this provider/model
      const cachedResponses = await this.getCachedResponses(cacheKey);

      // Find the most similar cached response
      let bestMatch: CachedResponse | null = null;
      let highestSimilarity = 0;

      for (const cached of cachedResponses) {
        const similarity = this.calculateCosineSimilarity(
          queryEmbedding,
          cached.embedding,
        );

        if (
          similarity > this.config.similarityThreshold &&
          similarity > highestSimilarity
        ) {
          highestSimilarity = similarity;
          bestMatch = cached;
        }
      }

      if (bestMatch) {
        // Update access statistics
        bestMatch.metadata.hitCount++;
        bestMatch.metadata.lastAccessed = Date.now();
        await this.updateCachedResponse(cacheKey, bestMatch);

        logger.info(
          `Semantic cache hit with similarity: ${highestSimilarity.toFixed(3)}`,
        );
        return bestMatch;
      }

      logger.debug("No semantic cache match found");
      return null;
    } catch (error) {
      logger.error("Error checking semantic cache:", error);
      return null;
    }
  }

  /**
   * Store a response in the semantic cache
   */
  async storeResponse(
    request: SemanticSearchRequest,
    response: any,
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const embedding = await this.getEmbedding(request.prompt);
      const cacheKey = this.generateCacheKey(request.provider, request.model);

      const cachedResponse: CachedResponse = {
        id: crypto.randomUUID(),
        embedding,
        response,
        metadata: {
          provider: request.provider,
          model: request.model,
          timestamp: Date.now(),
          hitCount: 0,
          lastAccessed: Date.now(),
        },
      };

      await this.addCachedResponse(cacheKey, cachedResponse);
      logger.debug(`Stored response in semantic cache: ${cachedResponse.id}`);
    } catch (error) {
      logger.error("Error storing response in semantic cache:", error);
    }
  }

  /**
   * Generate vector embedding for text
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // Check embedding cache first
    const textHash = crypto.createHash("sha256").update(text).digest("hex");
    if (this.embeddingCache.has(textHash)) {
      return this.embeddingCache.get(textHash)!;
    }

    let embedding: number[];

    if (this.config.embeddingProvider === "openai") {
      embedding = await this.getOpenAIEmbedding(text);
    } else {
      embedding = await this.getLocalEmbedding(text);
    }

    // Cache the embedding
    this.embeddingCache.set(textHash, embedding);

    // Limit embedding cache size
    if (this.embeddingCache.size > 1000) {
      const firstKey = this.embeddingCache.keys().next().value;
      if (firstKey) {
        this.embeddingCache.delete(firstKey);
      }
    }

    return embedding;
  }

  /**
   * Get embedding from OpenAI API
   */
  private async getOpenAIEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-3-small", // Fast and cost-effective
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI embedding API error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        data: Array<{ embedding: number[] }>;
      };
      return data.data[0].embedding;
    } catch (error) {
      logger.error("Error getting OpenAI embedding:", error);
      // Fallback to simple hash-based embedding
      return this.getSimpleEmbedding(text);
    }
  }

  /**
   * Get embedding from local model (placeholder for future implementation)
   */
  private async getLocalEmbedding(text: string): Promise<number[]> {
    // TODO: Implement local embedding model
    // For now, use simple hash-based embedding
    logger.warn("Local embedding not implemented, using simple hash");
    return this.getSimpleEmbedding(text);
  }

  /**
   * Simple hash-based embedding as fallback
   */
  private getSimpleEmbedding(text: string): number[] {
    const hash = crypto.createHash("sha256").update(text).digest();
    const embedding: number[] = [];

    // Convert hash bytes to normalized embedding vector
    for (let i = 0; i < Math.min(hash.length, 384); i++) {
      embedding.push((hash[i] - 128) / 128); // Normalize to [-1, 1]
    }

    // Pad to fixed size if needed
    while (embedding.length < 384) {
      embedding.push(0);
    }

    return embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vector dimensions must match");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Generate cache key for provider/model combination
   */
  private generateCacheKey(provider: string, model: string): string {
    return `semantic_cache:${provider}:${model}`;
  }

  /**
   * Get all cached responses for a cache key
   */
  private async getCachedResponses(
    cacheKey: string,
  ): Promise<CachedResponse[]> {
    try {
      const data = await this.cacheManager.get(cacheKey);
      return data && typeof data === "string" ? JSON.parse(data) : [];
    } catch (error) {
      logger.error("Error getting cached responses:", error);
      return [];
    }
  }

  /**
   * Add a cached response to the store
   */
  private async addCachedResponse(
    cacheKey: string,
    response: CachedResponse,
  ): Promise<void> {
    try {
      const responses = await this.getCachedResponses(cacheKey);
      responses.push(response);

      // Limit cache size and remove old entries
      if (responses.length > this.config.maxCacheSize) {
        responses.sort(
          (a, b) => b.metadata.lastAccessed - a.metadata.lastAccessed,
        );
        responses.splice(this.config.maxCacheSize);
      }

      await this.cacheManager.set(
        cacheKey,
        JSON.stringify(responses),
        this.config.ttlSeconds,
      );
    } catch (error) {
      logger.error("Error adding cached response:", error);
    }
  }

  /**
   * Update an existing cached response
   */
  private async updateCachedResponse(
    cacheKey: string,
    updatedResponse: CachedResponse,
  ): Promise<void> {
    try {
      const responses = await this.getCachedResponses(cacheKey);
      const index = responses.findIndex((r) => r.id === updatedResponse.id);

      if (index !== -1) {
        responses[index] = updatedResponse;
        await this.cacheManager.set(
          cacheKey,
          JSON.stringify(responses),
          this.config.ttlSeconds,
        );
      }
    } catch (error) {
      logger.error("Error updating cached response:", error);
    }
  }

  /**
   * Clear all semantic cache data
   */
  async clearCache(): Promise<void> {
    try {
      // Clear embedding cache
      this.embeddingCache.clear();

      // Clear stored responses (would need to iterate through all keys in production)
      logger.info("Semantic cache cleared");
    } catch (error) {
      logger.error("Error clearing semantic cache:", error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalResponses: number;
    totalHits: number;
    averageSimilarity: number;
    cacheSize: number;
  }> {
    // This would be implemented to scan all cache keys and aggregate stats
    return {
      totalResponses: 0,
      totalHits: 0,
      averageSimilarity: 0,
      cacheSize: this.embeddingCache.size,
    };
  }
}

/**
 * Default semantic cache configuration
 */
export const defaultSemanticCacheConfig: SemanticCacheConfig = {
  enabled: true,
  similarityThreshold: 0.85, // 85% similarity required
  maxCacheSize: 1000,
  ttlSeconds: 3600, // 1 hour
  embeddingProvider: "openai",
};

