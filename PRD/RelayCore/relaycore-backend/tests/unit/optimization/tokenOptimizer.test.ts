import { TokenOptimizer } from '../../../src/optimization/tokenOptimizer';

describe('TokenOptimizer', () => {
  let tokenOptimizer: TokenOptimizer;

  beforeEach(() => {
    // Create a new TokenOptimizer instance
    tokenOptimizer = new TokenOptimizer();
  });

  describe('optimizePrompt', () => {
    it('should remove redundant whitespace', () => {
      // Setup
      const prompt = 'This   has    multiple    spaces   between   words.';
      const expected = 'This has multiple spaces between words.';
      
      // Execute
      const result = tokenOptimizer.optimizePrompt(prompt);
      
      // Verify
      expect(result).toBe(expected);
    });

    it('should trim leading and trailing whitespace', () => {
      // Setup
      const prompt = '   \n  This has whitespace around it.  \n  ';
      const expected = 'This has whitespace around it.';
      
      // Execute
      const result = tokenOptimizer.optimizePrompt(prompt);
      
      // Verify
      expect(result).toBe(expected);
    });

    it('should preserve code blocks', () => {
      // Setup
      const prompt = `Here is some code:
\`\`\`python
def hello():
    print("Hello,   World!")
\`\`\`
End of code.`;
      
      // Execute
      const result = tokenOptimizer.optimizePrompt(prompt);
      
      // Verify - code block should be preserved
      expect(result).toContain('print("Hello,   World!")');
    });

    it('should optimize text outside of code blocks', () => {
      // Setup
      const prompt = `This   has    extra   spaces.
\`\`\`
This   is   a   code   block.
\`\`\`
This   also   has   extra   spaces.`;
      
      const expected = `This has extra spaces.
\`\`\`
This   is   a   code   block.
\`\`\`
This also has extra spaces.`;
      
      // Execute
      const result = tokenOptimizer.optimizePrompt(prompt);
      
      // Verify
      expect(result).toBe(expected);
    });

    it('should handle multiple code blocks correctly', () => {
      // Setup
      const prompt = `First   paragraph   with   spaces.
\`\`\`python
def func():
    print("Hello   World")
\`\`\`
Middle   paragraph   with   spaces.
\`\`\`javascript
function hello() {
    console.log("Hello   World");
}
\`\`\`
Last   paragraph   with   spaces.`;
      
      const expected = `First paragraph with spaces.
\`\`\`python
def func():
    print("Hello   World")
\`\`\`
Middle paragraph with spaces.
\`\`\`javascript
function hello() {
    console.log("Hello   World");
}
\`\`\`
Last paragraph with spaces.`;
      
      // Execute
      const result = tokenOptimizer.optimizePrompt(prompt);
      
      // Verify
      expect(result).toBe(expected);
    });
  });

  describe('optimizeContextWindow', () => {
    it('should truncate text to fit within token limit', () => {
      // Setup
      const text = 'This is a long text that should be truncated.';
      const tokenLimit = 5; // Assuming each word is roughly one token
      
      // Mock the countTokens method
      (tokenOptimizer as any).countTokens = jest.fn().mockImplementation((text: string) => {
        // Simple implementation that counts words as tokens
        return text.split(/\s+/).length;
      });
      
      // Execute
      const result = tokenOptimizer.optimizeContextWindow(text, tokenLimit);
      
      // Verify
      expect((tokenOptimizer as any).countTokens(result)).toBeLessThanOrEqual(tokenLimit);
      expect(result).toBe('This is a long text');
    });

    it('should preserve important sections marked with special tags', () => {
      // Setup
      const text = 'This is some context. <!-- IMPORTANT --> This is critical information. <!-- /IMPORTANT --> This is more context.';
      const tokenLimit = 5; // Not enough for the full text
      
      // Mock the countTokens method
      (tokenOptimizer as any).countTokens = jest.fn().mockImplementation((text: string) => {
        // Simple implementation that counts words as tokens
        return text.split(/\s+/).length;
      });
      
      // Execute
      const result = tokenOptimizer.optimizeContextWindow(text, tokenLimit);
      
      // Verify
      expect(result).toContain('This is critical information.');
      expect((tokenOptimizer as any).countTokens(result)).toBeLessThanOrEqual(tokenLimit);
    });

    it('should handle empty text', () => {
      // Setup
      const text = '';
      const tokenLimit = 100;
      
      // Execute
      const result = tokenOptimizer.optimizeContextWindow(text, tokenLimit);
      
      // Verify
      expect(result).toBe('');
    });

    it('should return original text if it fits within token limit', () => {
      // Setup
      const text = 'Short text.';
      const tokenLimit = 10;
      
      // Mock the countTokens method
      (tokenOptimizer as any).countTokens = jest.fn().mockReturnValue(2);
      
      // Execute
      const result = tokenOptimizer.optimizeContextWindow(text, tokenLimit);
      
      // Verify
      expect(result).toBe(text);
    });
  });

  describe('countTokens', () => {
    it('should estimate token count based on characters', () => {
      // Setup
      const text = 'This is a test sentence.';
      
      // Execute
      const result = (tokenOptimizer as any).countTokens(text);
      
      // Verify - assuming ~4 characters per token
      const expectedTokens = Math.ceil(text.length / 4);
      expect(result).toBe(expectedTokens);
    });

    it('should handle empty text', () => {
      // Setup
      const text = '';
      
      // Execute
      const result = (tokenOptimizer as any).countTokens(text);
      
      // Verify
      expect(result).toBe(0);
    });
  });
});