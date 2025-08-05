import { CacheManager } from '../../../src/cache/cacheManager';
import { SemanticCache } from '../../../src/cache/semanticCache';
import Redis from 'ioredis';

// This is a performance test file that would typically be run separately from unit tests
// It measures the performance of the caching system under load

describe('Cache Performance Tests', () => {
  let cacheManager: CacheManager;
  let semanticCache: SemanticCache;
  let redisClient: Redis;
  
  beforeAll(async () => {
    // Create a real Redis client for performance testing
    // Note: This requires Redis to be running during tests
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB || '1'),
    });
    
    // Clear the test database before starting
    await redisClient.flushdb();
    
    // Create cache instances
    cacheManager = new CacheManager(redisClient);
    semanticCache = new SemanticCache(cacheManager, {
      similarityThreshold: 0.85,
      ttl: 3600,
      namespace: 'perf-test'
    });
  });
  
  afterAll(async () => {
    // Clean up
    await redisClient.flushdb();
    await redisClient.quit();
  });
  
  // Helper function to measure execution time
  const measureExecutionTime = async (fn: () => Promise<any>): Promise<number> => {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert to milliseconds
  };
  
  describe('CacheManager Performance', () => {
    it('should handle bulk set operations efficiently', async () => {
      // Setup - create a large number of items to cache
      const numItems = 1000;
      const items = Array.from({ length: numItems }, (_, i) => ({
        key: `perf-test-key-${i}`,
        value: { data: `test-data-${i}`, timestamp: Date.now() }
      }));
      
      // Measure time to set all items
      const setTime = await measureExecutionTime(async () => {
        for (const item of items) {
          await cacheManager.set(item.key, item.value);
        }
      });
      
      // Log performance metrics
      console.log(`Set ${numItems} items in ${setTime.toFixed(2)}ms (${(setTime / numItems).toFixed(2)}ms per item)`);
      
      // Verify some items were actually set
      const randomIndex = Math.floor(Math.random() * numItems);
      const retrievedValue = await cacheManager.get(`perf-test-key-${randomIndex}`);
      expect(retrievedValue).toEqual(items[randomIndex].value);
      
      // Performance assertion - should be reasonably fast
      // These thresholds might need adjustment based on the test environment
      expect(setTime).toBeLessThan(numItems * 5); // Less than 5ms per item on average
    });
    
    it('should handle bulk get operations efficiently', async () => {
      // Setup - create keys to retrieve
      const numItems = 1000;
      const keys = Array.from({ length: numItems }, (_, i) => `perf-test-key-${i}`);
      
      // Measure time to get all items
      const getTime = await measureExecutionTime(async () => {
        for (const key of keys) {
          await cacheManager.get(key);
        }
      });
      
      // Log performance metrics
      console.log(`Get ${numItems} items in ${getTime.toFixed(2)}ms (${(getTime / numItems).toFixed(2)}ms per item)`);
      
      // Performance assertion
      expect(getTime).toBeLessThan(numItems * 5); // Less than 5ms per item on average
    });
    
    it('should handle cache misses efficiently', async () => {
      // Setup - create keys that don't exist
      const numItems = 1000;
      const keys = Array.from({ length: numItems }, (_, i) => `non-existent-key-${i}`);
      
      // Measure time to attempt to get all non-existent items
      const getMissTime = await measureExecutionTime(async () => {
        for (const key of keys) {
          await cacheManager.get(key);
        }
      });
      
      // Log performance metrics
      console.log(`Get ${numItems} cache misses in ${getMissTime.toFixed(2)}ms (${(getMissTime / numItems).toFixed(2)}ms per miss)`);
      
      // Performance assertion
      expect(getMissTime).toBeLessThan(numItems * 5); // Less than 5ms per miss on average
    });
  });
  
  describe('SemanticCache Performance', () => {
    // Mock the embedding function for testing
    beforeAll(() => {
      // Replace the actual embedding function with a simple mock
      (semanticCache as any).getEmbedding = async (text: string) => {
        // Generate a deterministic "embedding" based on the text
        // This is just for testing and not a real embedding
        const hash = Array.from(text).reduce((acc, char) => {
          return (acc * 31 + char.charCodeAt(0)) % 1000;
        }, 0);
        
        // Create a 128-dimensional vector with some variation
        return Array.from({ length: 128 }, (_, i) => {
          return Math.sin(hash * i * 0.01) * 0.5 + 0.5;
        });
      };
    });
    
    it('should handle semantic cache operations efficiently', async () => {
      // Setup - create a set of prompts
      const numPrompts = 100; // Fewer prompts because semantic operations are more expensive
      const prompts = Array.from({ length: numPrompts }, (_, i) => ({
        text: `What is the capital of country number ${i}?`,
        response: { answer: `The capital of country number ${i} is Capital City ${i}.` }
      }));
      
      // Measure time to set all prompts in semantic cache
      const setTime = await measureExecutionTime(async () => {
        for (const prompt of prompts) {
          await semanticCache.set(prompt.text, prompt.response);
        }
      });
      
      console.log(`Set ${numPrompts} semantic cache items in ${setTime.toFixed(2)}ms (${(setTime / numPrompts).toFixed(2)}ms per item)`);
      
      // Measure time to retrieve similar prompts
      const similarPrompts = prompts.map(p => p.text.replace('What is', 'Tell me'));
      
      const getTime = await measureExecutionTime(async () => {
        for (const prompt of similarPrompts) {
          await semanticCache.get(prompt);
        }
      });
      
      console.log(`Get ${numPrompts} semantic cache items in ${getTime.toFixed(2)}ms (${(getTime / numPrompts).toFixed(2)}ms per item)`);
      
      // Performance assertions
      // Semantic operations are more expensive, so thresholds are higher
      expect(setTime).toBeLessThan(numPrompts * 50); // Less than 50ms per item on average
      expect(getTime).toBeLessThan(numPrompts * 100); // Less than 100ms per item on average
    });
    
    it('should scale reasonably with cache size', async () => {
      // This test measures how retrieval time scales with cache size
      
      // First, clear the semantic cache
      await semanticCache.clear();
      
      // Create prompts in batches and measure retrieval time after each batch
      const batchSizes = [10, 50, 100, 200];
      const retrievalTimes: number[] = [];
      
      for (const batchSize of batchSizes) {
        // Add a batch of prompts
        const prompts = Array.from({ length: batchSize }, (_, i) => ({
          text: `What is the population of city number ${i + 1000}?`,
          response: { answer: `The population of city number ${i + 1000} is ${(i + 1000) * 1000} people.` }
        }));
        
        for (const prompt of prompts) {
          await semanticCache.set(prompt.text, prompt.response);
        }
        
        // Measure retrieval time for a test prompt
        const testPrompt = 'Tell me the population of city number 1050?';
        const retrievalTime = await measureExecutionTime(async () => {
          await semanticCache.get(testPrompt);
        });
        
        retrievalTimes.push(retrievalTime);
        console.log(`Retrieval time with ${batchSize} cached items: ${retrievalTime.toFixed(2)}ms`);
      }
      
      // Check that retrieval time doesn't grow exponentially
      // We expect some growth, but it should be roughly linear or better
      for (let i = 1; i < retrievalTimes.length; i++) {
        const ratio = retrievalTimes[i] / retrievalTimes[i - 1];
        const sizeRatio = batchSizes[i] / batchSizes[i - 1];
        
        console.log(`Scaling factor from ${batchSizes[i-1]} to ${batchSizes[i]} items: ${ratio.toFixed(2)}x (size increased ${sizeRatio}x)`);
        
        // The ratio should be less than the size ratio (ideally much less)
        // This is a loose check - in a real test, you might want to be more precise
        expect(ratio).toBeLessThan(sizeRatio * 2);
      }
    });
  });
});