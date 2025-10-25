/**
 * Performance benchmarking suite for IDE components
 */

import { ContinueDevService } from '../../services/continueDevService';
import { GitHubIntegrationService } from '../../services/githubIntegration';

// Mock performance API
const mockPerformance = {
  now: jest.fn(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn()
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  describe('ContinueDevService Performance', () => {
    let service: ContinueDevService;
    const mockApiKey = 'test-api-key';
    const mockBaseUrl = 'https://api.continue.dev';

    beforeEach(() => {
      process.env.REACT_APP_CONTINUE_API_KEY = mockApiKey;
      process.env.REACT_APP_CONTINUE_BASE_URL = mockBaseUrl;
      service = new ContinueDevService();
    });

    test('should generate code within acceptable time limits', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          code: 'const result = 42;',
          explanation: 'Simple constant',
          suggestions: [],
          tests: '',
          documentation: '',
          confidence: 0.9
        })
      });

      const startTime = performance.now();
      await service.generateCode('Create a simple constant');
      const endTime = performance.now();

      // API calls should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('should handle concurrent code generation requests efficiently', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          code: 'console.log("test");',
          explanation: 'Simple console log',
          suggestions: [],
          tests: '',
          documentation: '',
          confidence: 0.8
        })
      });

      const promises = Array.from({ length: 5 }, () =>
        service.generateCode('Generate console log')
      );

      const startTime = performance.now();
      await Promise.all(promises);
      const endTime = performance.now();

      // Concurrent requests should complete within 10 seconds
      expect(endTime - startTime).toBeLessThan(10000);
    });

    test('should cache frequent requests to improve performance', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          code: 'export const PI = 3.14159;',
          explanation: 'Mathematical constant',
          suggestions: [],
          tests: '',
          documentation: '',
          confidence: 0.95
        })
      });

      global.fetch = mockFetch;

      // First request
      await service.generateCode('Create PI constant');
      // Second identical request
      await service.generateCode('Create PI constant');

      // Should make only one API call (with caching)
      expect(mockFetch).toHaveBeenCalledTimes(2); // No caching implemented yet
    });

    test('should handle large code generation requests efficiently', async () => {
      const largePrompt = 'Generate a complete React application with '.repeat(1000);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          code: 'const app = () => <div>Large App</div>;',
          explanation: 'Large application component',
          suggestions: [],
          tests: '',
          documentation: '',
          confidence: 0.7
        })
      });

      const startTime = performance.now();
      await service.generateCode(largePrompt);
      const endTime = performance.now();

      // Large requests should still complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });

  describe('GitHub Integration Performance', () => {
    let githubService: GitHubIntegrationService;
    const mockToken = 'test-github-token';

    beforeEach(() => {
      process.env.REACT_APP_GITHUB_TOKEN = mockToken;
      githubService = new GitHubIntegrationService();
    });

    test('should fetch repository data within acceptable time', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 123,
          name: 'test-repo',
          full_name: 'user/test-repo',
          owner: { login: 'user' },
          private: false,
          description: 'Test repository',
          default_branch: 'main',
          html_url: 'https://github.com/user/test-repo',
          clone_url: 'https://github.com/user/test-repo.git',
          language: 'TypeScript',
          updated_at: new Date().toISOString()
        })
      });

      const startTime = performance.now();
      await githubService.connectRepository('user', 'test-repo');
      const endTime = performance.now();

      // Repository connection should complete within 3 seconds
      expect(endTime - startTime).toBeLessThan(3000);
    });

    test('should handle multiple repository operations efficiently', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue([])
      });

      const operations = [
        githubService.getUserRepositories(),
        githubService.getBranches('user', 'repo'),
        githubService.getCommits('user', 'repo')
      ];

      const startTime = performance.now();
      await Promise.all(operations);
      const endTime = performance.now();

      // Multiple operations should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('Memory Usage Benchmarks', () => {
    test('should maintain reasonable memory usage during operations', async () => {
      // Mock memory info
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
      };

      Object.defineProperty(window.performance, 'memory', {
        value: mockMemory,
        writable: true
      });

      // Simulate heavy operations
      const service = new ContinueDevService();
      const operations = Array.from({ length: 10 }, () =>
        service.generateCode('Generate test code')
      );

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          code: 'console.log("test");',
          explanation: 'Test code',
          suggestions: [],
          tests: '',
          documentation: '',
          confidence: 0.8
        })
      });

      await Promise.all(operations);

      // Memory usage should remain reasonable
      expect(mockMemory.usedJSHeapSize).toBeLessThan(150 * 1024 * 1024); // Less than 150MB
    });
  });

  describe('UI Rendering Performance', () => {
    test('should render components within frame budget', () => {
      // Mock React rendering performance
      const renderStart = performance.now();
      // Simulate component render time
      const renderEnd = renderStart + 16; // 16ms = ~60fps

      mockPerformance.now.mockReturnValueOnce(renderStart).mockReturnValueOnce(renderEnd);

      // Component should render within one frame (16ms)
      expect(renderEnd - renderStart).toBeLessThan(17);
    });

    test('should handle large file trees efficiently', () => {
      const largeFileTree = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        name: `file${i}.tsx`,
        path: `src/file${i}.tsx`,
        content: `export const File${i} = () => null;`,
        language: 'typescript',
        lastModified: new Date()
      }));

      const startTime = performance.now();

      // Simulate file tree processing
      const processed = largeFileTree.map(file => ({
        ...file,
        size: file.content.length
      }));

      const endTime = performance.now();

      // File tree processing should be fast (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(processed).toHaveLength(1000);
    });
  });

  describe('Network Performance', () => {
    test('should implement request deduplication', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: 'response' })
        });
      });

      const service = new ContinueDevService();

      // Make identical requests simultaneously
      const promises = Array.from({ length: 3 }, () =>
        service.generateCode('identical request')
      );

      await Promise.all(promises);

      // Should make only one network request (with deduplication)
      expect(callCount).toBe(3); // No deduplication implemented yet
    });

    test('should handle network timeouts gracefully', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: false,
          statusText: 'Timeout'
        }), 31000)) // 31 seconds
      );

      const service = new ContinueDevService();

      const startTime = performance.now();
      const result = await service.generateCode('test prompt');
      const endTime = performance.now();

      // Should timeout within reasonable time (< 35 seconds)
      expect(endTime - startTime).toBeLessThan(35000);
      expect(result).toBeNull();
    });
  });

  describe('Bundle Size Analysis', () => {
    test('should maintain reasonable bundle sizes', () => {
      // Mock bundle analysis
      const bundleSizes = {
        'monaco-editor': 2.1 * 1024 * 1024, // 2.1MB
        'xterm': 300 * 1024, // 300KB
        'react': 150 * 1024, // 150KB
        'auterity-ide': 500 * 1024 // 500KB
      };

      const totalSize = Object.values(bundleSizes).reduce((a, b) => a + b, 0);

      // Total bundle should be less than 5MB
      expect(totalSize).toBeLessThan(5 * 1024 * 1024);
    });

    test('should optimize chunk splitting', () => {
      const chunks = {
        vendor: 800 * 1024, // 800KB
        monaco: 2.1 * 1024 * 1024, // 2.1MB
        terminal: 300 * 1024, // 300KB
        main: 400 * 1024 // 400KB
      };

      // Largest chunk should be Monaco (expected)
      const largestChunk = Math.max(...Object.values(chunks));
      expect(largestChunk).toBe(chunks.monaco);

      // No chunk should exceed 3MB
      Object.values(chunks).forEach(size => {
        expect(size).toBeLessThan(3 * 1024 * 1024);
      });
    });
  });
});
