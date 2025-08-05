import { CacheManager } from '../../../src/cache/cacheManager';
import Redis from 'ioredis';

// Mock Redis client
jest.mock('ioredis');

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a mock Redis client
    mockRedisClient = new Redis() as jest.Mocked<Redis>;
    
    // Create a new CacheManager instance with the mock Redis client
    cacheManager = new CacheManager(mockRedisClient);
  });

  describe('set', () => {
    it('should set a value in the cache with TTL', async () => {
      // Setup
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttl = 3600;
      
      // Mock Redis set method
      mockRedisClient.set = jest.fn().mockResolvedValue('OK');
      
      // Execute
      await cacheManager.set(key, value, ttl);
      
      // Verify
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        'EX',
        ttl
      );
    });

    it('should set a value in the cache without TTL', async () => {
      // Setup
      const key = 'test-key';
      const value = { data: 'test-data' };
      
      // Mock Redis set method
      mockRedisClient.set = jest.fn().mockResolvedValue('OK');
      
      // Execute
      await cacheManager.set(key, value);
      
      // Verify
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value)
      );
    });
  });

  describe('get', () => {
    it('should get a value from the cache', async () => {
      // Setup
      const key = 'test-key';
      const cachedValue = { data: 'test-data' };
      
      // Mock Redis get method
      mockRedisClient.get = jest.fn().mockResolvedValue(JSON.stringify(cachedValue));
      
      // Execute
      const result = await cacheManager.get(key);
      
      // Verify
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(cachedValue);
    });

    it('should return null if key does not exist', async () => {
      // Setup
      const key = 'non-existent-key';
      
      // Mock Redis get method to return null
      mockRedisClient.get = jest.fn().mockResolvedValue(null);
      
      // Execute
      const result = await cacheManager.get(key);
      
      // Verify
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a value from the cache', async () => {
      // Setup
      const key = 'test-key';
      
      // Mock Redis del method
      mockRedisClient.del = jest.fn().mockResolvedValue(1);
      
      // Execute
      await cacheManager.delete(key);
      
      // Verify
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
  });

  describe('exists', () => {
    it('should check if a key exists in the cache', async () => {
      // Setup
      const key = 'test-key';
      
      // Mock Redis exists method
      mockRedisClient.exists = jest.fn().mockResolvedValue(1);
      
      // Execute
      const result = await cacheManager.exists(key);
      
      // Verify
      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      // Setup
      const key = 'non-existent-key';
      
      // Mock Redis exists method
      mockRedisClient.exists = jest.fn().mockResolvedValue(0);
      
      // Execute
      const result = await cacheManager.exists(key);
      
      // Verify
      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all keys with the given pattern', async () => {
      // Setup
      const pattern = 'test-*';
      const keys = ['test-1', 'test-2', 'test-3'];
      
      // Mock Redis scan method
      mockRedisClient.scan = jest.fn().mockResolvedValue(['0', keys]);
      mockRedisClient.del = jest.fn().mockResolvedValue(keys.length);
      
      // Execute
      await cacheManager.clear(pattern);
      
      // Verify
      expect(mockRedisClient.scan).toHaveBeenCalledWith(
        expect.any(String),
        'MATCH',
        pattern,
        'COUNT',
        expect.any(Number)
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith(...keys);
    });

    it('should handle empty results when clearing keys', async () => {
      // Setup
      const pattern = 'test-*';
      
      // Mock Redis scan method to return no keys
      mockRedisClient.scan = jest.fn().mockResolvedValue(['0', []]);
      mockRedisClient.del = jest.fn();
      
      // Execute
      await cacheManager.clear(pattern);
      
      // Verify
      expect(mockRedisClient.scan).toHaveBeenCalledWith(
        expect.any(String),
        'MATCH',
        pattern,
        'COUNT',
        expect.any(Number)
      );
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });
});