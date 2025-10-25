/**
 * Comprehensive test suite for ContinueDevService
 */

import { ContinueDevService } from '../../services/continueDevService';

// Mock fetch globally
global.fetch = jest.fn();

describe('ContinueDevService', () => {
  let service: ContinueDevService;
  const mockApiKey = 'test-api-key';
  const mockBaseUrl = 'https://api.continue.dev';

  beforeEach(() => {
    // Reset environment variables
    process.env.REACT_APP_CONTINUE_API_KEY = mockApiKey;
    process.env.REACT_APP_CONTINUE_BASE_URL = mockBaseUrl;

    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();

    // Create service instance
    service = new ContinueDevService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    test('should initialize with correct configuration', () => {
      expect(service.isConfigured()).toBe(true);
    });

    test('should handle missing API key', () => {
      delete process.env.REACT_APP_CONTINUE_API_KEY;
      const newService = new ContinueDevService();
      expect(newService.isConfigured()).toBe(false);
    });
  });

  describe('Code Generation', () => {
    const mockPrompt = 'Create a React component';
    const mockContext = {
      files: [{
        id: '1',
        name: 'App.tsx',
        path: 'src/App.tsx',
        content: 'import React from "react";',
        language: 'typescript',
        lastModified: new Date()
      }]
    };

    test('should generate code successfully', async () => {
      const mockResponse = {
        code: 'const Component = () => <div>Hello</div>;',
        explanation: 'Generated a simple React component',
        suggestions: ['Add TypeScript types', 'Add error handling'],
        tests: 'describe("Component", () => { it("renders", () => {}); });',
        documentation: '/**\n * Simple React component\n */',
        confidence: 0.95
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await service.generateCode(mockPrompt, mockContext);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(`${mockBaseUrl}/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockApiKey}`
        },
        body: JSON.stringify({
          prompt: mockPrompt,
          context: expect.any(Object),
          model: expect.any(String),
          temperature: 0.3,
          max_tokens: 4000
        })
      });
    });

    test('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      const result = await service.generateCode(mockPrompt);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await service.generateCode(mockPrompt);

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should return fallback code when API fails', async () => {
      // Mock API failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await service.generateCode('Create a React component');

      expect(result).toBeDefined();
      expect(result?.code).toContain('fallback');
      expect(result?.explanation).toContain('fallback');
    });
  });

  describe('Code Completions', () => {
    const mockContext = {
      code: 'const component = () => {',
      position: { lineNumber: 1, column: 25 },
      language: 'typescript'
    };

    test('should get completions successfully', async () => {
      const mockCompletions = [
        { label: 'useState', code: 'useState(initialValue)', documentation: 'React hook for state' },
        { label: 'useEffect', code: 'useEffect(() => {}, [])', documentation: 'React hook for effects' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ completions: mockCompletions })
      });

      const result = await service.getCompletions(mockContext);

      expect(result).toEqual(mockCompletions);
      expect(global.fetch).toHaveBeenCalledWith(`${mockBaseUrl}/v1/completions`, expect.any(Object));
    });

    test('should return empty array on API failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await service.getCompletions(mockContext);

      expect(result).toEqual([]);
    });
  });

  describe('Code Analysis', () => {
    const mockCode = 'const x = 1; console.log(x);';

    test('should analyze code successfully', async () => {
      const mockAnalysis = {
        issues: [{
          type: 'warning',
          message: 'Missing semicolon',
          line: 1,
          column: 10,
          severity: 'low'
        }],
        suggestions: [{
          type: 'refactor',
          description: 'Use const for immutable values',
          code: 'const x = 1;',
          impact: 'medium'
        }],
        metrics: {
          complexity: 1,
          maintainability: 95,
          performance: 98
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockAnalysis)
      });

      const result = await service.analyzeCode(mockCode, 'javascript');

      expect(result).toEqual(mockAnalysis);
    });

    test('should return default analysis on failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await service.analyzeCode(mockCode);

      expect(result).toEqual({
        issues: [],
        suggestions: [],
        metrics: {
          complexity: 0,
          maintainability: 0,
          performance: 0
        }
      });
    });
  });

  describe('Test Generation', () => {
    const mockCode = 'function add(a, b) { return a + b; }';

    test('should generate tests successfully', async () => {
      const mockTests = `
describe('add', () => {
  test('should add two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });
});
`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ tests: mockTests })
      });

      const result = await service.generateTests(mockCode, 'javascript');

      expect(result).toBe(mockTests);
    });

    test('should return empty string on failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const result = await service.generateTests(mockCode);

      expect(result).toBe('');
    });
  });
});
