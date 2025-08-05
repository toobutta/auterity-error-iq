import {
  estimateStringTokens,
  estimateChatMessageTokens,
  estimateTokens,
  estimateCost
} from '../../src/utils/token-estimator';

describe('Token Estimator', () => {
  describe('estimateStringTokens', () => {
    it('should return 0 for empty string', () => {
      expect(estimateStringTokens('')).toBe(0);
    });

    it('should return 0 for null or undefined', () => {
      expect(estimateStringTokens(null as any)).toBe(0);
      expect(estimateStringTokens(undefined as any)).toBe(0);
    });

    it('should estimate tokens based on character count', () => {
      expect(estimateStringTokens('Hello')).toBe(2); // 5 chars / 4 = 1.25, ceil to 2
      expect(estimateStringTokens('Hello world')).toBe(3); // 11 chars / 4 = 2.75, ceil to 3
      expect(estimateStringTokens('This is a longer sentence to test token estimation.')).toBe(12); // 47 chars / 4 = 11.75, ceil to 12
    });
  });

  describe('estimateChatMessageTokens', () => {
    it('should return 0 for null or undefined message', () => {
      expect(estimateChatMessageTokens(null as any)).toBe(0);
      expect(estimateChatMessageTokens(undefined as any)).toBe(0);
    });

    it('should count base tokens for message metadata', () => {
      expect(estimateChatMessageTokens({ role: 'user' })).toBe(4); // Base tokens for message metadata
    });

    it('should count tokens for content', () => {
      expect(estimateChatMessageTokens({ 
        role: 'user', 
        content: 'Hello world' 
      })).toBe(7); // 4 base + 3 for content
    });

    it('should count tokens for name', () => {
      expect(estimateChatMessageTokens({ 
        role: 'user', 
        name: 'John',
        content: 'Hello' 
      })).toBe(8); // 4 base + 2 for content + 1 for name presence + 1 for name
    });

    it('should count tokens for function_call', () => {
      expect(estimateChatMessageTokens({ 
        role: 'assistant', 
        function_call: {
          name: 'get_weather',
          arguments: '{"location": "New York"}'
        }
      })).toBe(14); // 4 base + 4 for function_call + 3 for name + 3 for arguments
    });

    it('should handle complex messages', () => {
      expect(estimateChatMessageTokens({ 
        role: 'assistant', 
        name: 'AI',
        content: 'I will check the weather for you.',
        function_call: {
          name: 'get_weather',
          arguments: '{"location": "New York", "units": "celsius"}'
        }
      })).toBe(25); // 4 base + 8 for content + 1 for name presence + 1 for name + 4 for function_call + 3 for name + 4 for arguments
    });
  });

  describe('estimateTokens', () => {
    it('should handle chat messages', async () => {
      const result = await estimateTokens({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello, how are you?' },
          { role: 'assistant', content: 'I am doing well, thank you for asking!' }
        ]
      });

      expect(result).toHaveProperty('inputTokens');
      expect(result).toHaveProperty('estimatedOutputTokens');
      expect(result.inputTokens).toBeGreaterThan(0);
      expect(result.estimatedOutputTokens).toBeGreaterThan(0);
    });

    it('should handle text prompt', async () => {
      const result = await estimateTokens({
        prompt: 'Explain quantum computing in simple terms.'
      });

      expect(result).toHaveProperty('inputTokens');
      expect(result).toHaveProperty('estimatedOutputTokens');
      expect(result.inputTokens).toBeGreaterThan(0);
      expect(result.estimatedOutputTokens).toBeGreaterThan(0);
    });

    it('should handle system prompt', async () => {
      const result = await estimateTokens({
        systemPrompt: 'You are a quantum physics expert.'
      });

      expect(result).toHaveProperty('inputTokens');
      expect(result).toHaveProperty('estimatedOutputTokens');
      expect(result.inputTokens).toBeGreaterThan(0);
      expect(result.estimatedOutputTokens).toBeGreaterThan(0);
    });

    it('should handle combined prompts', async () => {
      const result = await estimateTokens({
        prompt: 'Explain quantum computing in simple terms.',
        systemPrompt: 'You are a quantum physics expert.'
      });

      expect(result).toHaveProperty('inputTokens');
      expect(result).toHaveProperty('estimatedOutputTokens');
      expect(result.inputTokens).toBeGreaterThan(0);
      expect(result.estimatedOutputTokens).toBeGreaterThan(0);
    });

    it('should return default values on error', async () => {
      // Force an error by passing invalid content
      const result = await estimateTokens({
        messages: 'not an array' as any
      });

      expect(result).toHaveProperty('inputTokens');
      expect(result).toHaveProperty('estimatedOutputTokens');
      expect(result.inputTokens).toBe(100); // Default value
      expect(result.estimatedOutputTokens).toBe(150); // Default value
    });
  });

  describe('estimateCost', () => {
    it('should calculate cost based on tokens and rates', () => {
      expect(estimateCost(100, 200, 0.0001, 0.0002)).toBe(0.05); // (100 * 0.0001) + (200 * 0.0002)
      expect(estimateCost(500, 1000, 0.00001, 0.00003)).toBe(0.035); // (500 * 0.00001) + (1000 * 0.00003)
      expect(estimateCost(0, 0, 0.0001, 0.0002)).toBe(0); // No tokens, no cost
    });

    it('should handle large numbers', () => {
      expect(estimateCost(10000, 20000, 0.000001, 0.000002)).toBe(0.05); // (10000 * 0.000001) + (20000 * 0.000002)
    });
  });
});