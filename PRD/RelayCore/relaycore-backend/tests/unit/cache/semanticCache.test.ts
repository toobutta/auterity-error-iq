import { SemanticCache } from '../../../src/cache/semanticCache';
import { CacheManager } from '../../../src/cache/cacheManager';

// Mock CacheManager
jest.mock('../../../src/cache/cacheManager');

describe('SemanticCache', () => {
  let semanticCache: SemanticCache;
  let mockCacheManager: jest.Mocked<CacheManager>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a mock CacheManager
    mockCacheManager = new CacheManager() as jest.Mocked<CacheManager>;
    
    // Create a new SemanticCache instance with the mock CacheManager
    semanticCache = new SemanticCache(mockCacheManager, {
      similarityThreshold: 0.85,
      ttl: 3600,
      namespace: 'test'
    });
  });

  describe('set', () => {
    it('should store a prompt and response in the cache', async () => {
      // Setup
      const prompt = 'What is the capital of France?';
      const response = { text: 'The capital of France is Paris.' };
      const embedding = [0.1, 0.2, 0.3, 0.4];
      
      // Mock the embedding function
      (semanticCache as any).getEmbedding = jest.fn().mockResolvedValue(embedding);
      
      // Mock CacheManager set method
      mockCacheManager.set = jest.fn().mockResolvedValue(undefined);
      
      // Execute
      await semanticCache.set(prompt, response);
      
      // Verify
      expect((semanticCache as any).getEmbedding).toHaveBeenCalledWith(prompt);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('test:semantic:'),
        {
          prompt,
          response,
          embedding,
          timestamp: expect.any(Number)
        },
        3600
      );
    });
  });

  describe('get', () => {
    it('should return a cached response for a similar prompt', async () => {
      // Setup
      const prompt = 'What is the capital of France?';
      const similarPrompt = 'Tell me the capital of France';
      const cachedResponse = { text: 'The capital of France is Paris.' };
      const embedding = [0.1, 0.2, 0.3, 0.4];
      const similarEmbedding = [0.11, 0.21, 0.29, 0.39]; // Similar to embedding
      
      // Mock the embedding function
      (semanticCache as any).getEmbedding = jest.fn()
        .mockResolvedValueOnce(embedding) // For the stored embedding
        .mockResolvedValueOnce(similarEmbedding); // For the query embedding
      
      // Mock the similarity function to return high similarity
      (semanticCache as any).calculateCosineSimilarity = jest.fn().mockReturnValue(0.95);
      
      // Mock CacheManager methods
      mockCacheManager.keys = jest.fn().mockResolvedValue(['test:semantic:12345']);
      mockCacheManager.get = jest.fn().mockResolvedValue({
        prompt: similarPrompt,
        response: cachedResponse,
        embedding,
        timestamp: Date.now()
      });
      
      // Execute
      const result = await semanticCache.get(prompt);
      
      // Verify
      expect((semanticCache as any).getEmbedding).toHaveBeenCalledWith(prompt);
      expect(mockCacheManager.keys).toHaveBeenCalledWith('test:semantic:*');
      expect(mockCacheManager.get).toHaveBeenCalledWith('test:semantic:12345');
      expect((semanticCache as any).calculateCosineSimilarity).toHaveBeenCalledWith(
        similarEmbedding,
        embedding
      );
      expect(result).toEqual({
        response: cachedResponse,
        similarity: 0.95,
        originalPrompt: similarPrompt
      });
    });

    it('should return null when no similar prompt is found', async () => {
      // Setup
      const prompt = 'What is the capital of Germany?';
      const embedding = [0.5, 0.6, 0.7, 0.8];
      const cachedEmbedding = [0.1, 0.2, 0.3, 0.4]; // Not similar to embedding
      
      // Mock the embedding function
      (semanticCache as any).getEmbedding = jest.fn()
        .mockResolvedValueOnce(embedding) // For the query embedding
        .mockResolvedValueOnce(cachedEmbedding); // For the stored embedding
      
      // Mock the similarity function to return low similarity
      (semanticCache as any).calculateCosineSimilarity = jest.fn().mockReturnValue(0.5);
      
      // Mock CacheManager methods
      mockCacheManager.keys = jest.fn().mockResolvedValue(['test:semantic:12345']);
      mockCacheManager.get = jest.fn().mockResolvedValue({
        prompt: 'What is the capital of France?',
        response: { text: 'The capital of France is Paris.' },
        embedding: cachedEmbedding,
        timestamp: Date.now()
      });
      
      // Execute
      const result = await semanticCache.get(prompt);
      
      // Verify
      expect((semanticCache as any).getEmbedding).toHaveBeenCalledWith(prompt);
      expect(mockCacheManager.keys).toHaveBeenCalledWith('test:semantic:*');
      expect(mockCacheManager.get).toHaveBeenCalledWith('test:semantic:12345');
      expect((semanticCache as any).calculateCosineSimilarity).toHaveBeenCalledWith(
        embedding,
        cachedEmbedding
      );
      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all cached items', async () => {
      // Setup
      mockCacheManager.clear = jest.fn().mockResolvedValue(undefined);
      
      // Execute
      await semanticCache.clear();
      
      // Verify
      expect(mockCacheManager.clear).toHaveBeenCalledWith('test:semantic:*');
    });
  });

  describe('calculateCosineSimilarity', () => {
    it('should calculate cosine similarity between two vectors', () => {
      // Setup
      const vec1 = [1, 2, 3];
      const vec2 = [4, 5, 6];
      
      // Execute
      const similarity = (semanticCache as any).calculateCosineSimilarity(vec1, vec2);
      
      // Verify - expected value calculated manually
      // cosine similarity = (1*4 + 2*5 + 3*6) / (sqrt(1^2 + 2^2 + 3^2) * sqrt(4^2 + 5^2 + 6^2))
      // = 32 / (sqrt(14) * sqrt(77)) ≈ 0.9746
      expect(similarity).toBeCloseTo(0.9746, 4);
    });

    it('should handle zero vectors', () => {
      // Setup
      const vec1 = [0, 0, 0];
      const vec2 = [1, 2, 3];
      
      // Execute
      const similarity = (semanticCache as any).calculateCosineSimilarity(vec1, vec2);
      
      // Verify - should return 0 for zero vector
      expect(similarity).toBe(0);
    });
  });
});