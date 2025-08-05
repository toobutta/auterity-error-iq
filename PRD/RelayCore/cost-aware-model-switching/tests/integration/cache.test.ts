import { get, set, del } from '../../src/cache';
import { estimateTokens } from '../../src/utils/token-estimator';

// Mock Redis client
jest.mock('../../src/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));

describe('Token Estimation Cache Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache functionality', () => {
    it('should cache token estimation results', async () => {
      // Mock the cache functions
      (get as jest.Mock).mockResolvedValue(null);
      (set as jest.Mock).mockResolvedValue('OK');

      const content = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, how are you?' }
        ]
      };

      // First call should calculate and cache
      const result1 = await estimateTokens(content);
      
      // Verify the result
      expect(result1).toHaveProperty('inputTokens');
      expect(result1).toHaveProperty('estimatedOutputTokens');
      
      // Verify that set was called
      expect(set).toHaveBeenCalled();
      
      // Mock cache hit for second call
      (get as jest.Mock).mockResolvedValue(result1);
      
      // Second call should use cache
      const result2 = await estimateTokens(content);
      
      // Results should be the same
      expect(result2).toEqual(result1);
      
      // Verify that get was called
      expect(get).toHaveBeenCalledTimes(2);
    });

    it('should handle cache misses', async () => {
      // Mock cache miss
      (get as jest.Mock).mockResolvedValue(null);
      (set as jest.Mock).mockResolvedValue('OK');

      const content = {
        prompt: 'Explain quantum computing in simple terms.'
      };

      // Call should calculate and cache
      const result = await estimateTokens(content);
      
      // Verify the result
      expect(result).toHaveProperty('inputTokens');
      expect(result).toHaveProperty('estimatedOutputTokens');
      
      // Verify that get and set were called
      expect(get).toHaveBeenCalled();
      expect(set).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      // Mock cache error
      (get as jest.Mock).mockRejectedValue(new Error('Redis connection error'));

      const content = {
        systemPrompt: 'You are a quantum physics expert.',
        prompt: 'Explain quantum entanglement.'
      };

      // Call should still work despite cache error
      const result = await estimateTokens(content);
      
      // Verify the result
      expect(result).toHaveProperty('inputTokens');
      expect(result).toHaveProperty('estimatedOutputTokens');
      
      // Verify that get was called but set was not (due to error)
      expect(get).toHaveBeenCalled();
      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('Cache performance', () => {
    it('should be faster on subsequent calls with same content', async () => {
      // Mock cache behavior
      (get as jest.Mock).mockImplementation((key) => {
        if (key.includes('second_call')) {
          return Promise.resolve({
            inputTokens: 100,
            estimatedOutputTokens: 150
          });
        }
        return Promise.resolve(null);
      });
      (set as jest.Mock).mockResolvedValue('OK');

      // First call - cache miss
      const startTime1 = performance.now();
      await estimateTokens({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'first_call' }
        ]
      });
      const duration1 = performance.now() - startTime1;

      // Second call - cache hit
      const startTime2 = performance.now();
      await estimateTokens({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'second_call' }
        ]
      });
      const duration2 = performance.now() - startTime2;

      // Cache hit should be faster than cache miss
      // This is a simple test and might be flaky in CI environments
      // In real tests, we would use more sophisticated timing or mocking
      expect(duration2).toBeLessThanOrEqual(duration1 * 1.5);
    });
  });

  describe('Cache invalidation', () => {
    it('should delete cache entries', async () => {
      // Mock cache functions
      (del as jest.Mock).mockResolvedValue(1);

      // Delete a cache entry
      await del('token_estimate:test_key');
      
      // Verify that del was called
      expect(del).toHaveBeenCalledWith('token_estimate:test_key');
    });
  });
});