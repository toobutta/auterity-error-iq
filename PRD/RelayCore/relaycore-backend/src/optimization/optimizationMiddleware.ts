import { Request, Response, NextFunction } from 'express';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';

// Optimization middleware
export const optimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = configManager.getConfig();
    
    // Check if optimization is enabled
    if (!config.optimization?.tokenOptimization?.enabled) {
      return next();
    }
    
    // Get optimization level from header or config
    const optimizationLevel = req.header('X-AIHub-Optimize') || config.optimization.tokenOptimization.level || 'none';
    
    if (optimizationLevel === 'none') {
      return next();
    }
    
    // Apply optimizations based on level
    const optimizationsApplied: Record<string, boolean> = {};
    
    // Clone the request body for processing
    const originalBody = { ...req.body };
    
    // Extract provider from path
    const provider = req.path.split('/')[1]; // First segment after /v1/
    
    // Apply token optimization
    if (config.optimization.tokenOptimization.enabled) {
      applyTokenOptimization(req, optimizationLevel);
      optimizationsApplied.tokenOptimization = true;
    }
    
    // Apply prompt compression
    if (config.optimization.promptCompression?.enabled) {
      applyPromptCompression(req, config.optimization.promptCompression.preserveFormatting);
      optimizationsApplied.promptCompression = true;
    }
    
    // Apply context pruning
    if (config.optimization.contextPruning?.enabled) {
      applyContextPruning(req, config.optimization.contextPruning.maxContextLength);
      optimizationsApplied.contextPruning = true;
    }
    
    // Set optimization headers
    res.setHeader('X-AIHub-Optimizations-Applied', JSON.stringify(optimizationsApplied));
    
    // Calculate token savings
    const originalTokens = estimateTokens(JSON.stringify(originalBody));
    const optimizedTokens = estimateTokens(JSON.stringify(req.body));
    const tokenSavings = originalTokens - optimizedTokens;
    
    if (tokenSavings > 0) {
      res.setHeader('X-AIHub-Token-Savings', tokenSavings);
    }
    
    next();
  } catch (error) {
    logger.error('Optimization error:', error);
    next();
  }
};

// Apply token optimization
function applyTokenOptimization(req: Request, level: string): void {
  // Only process chat completion requests
  if (!req.body.messages || !Array.isArray(req.body.messages)) {
    return;
  }
  
  // Process each message
  req.body.messages = req.body.messages.map((message: any) => {
    // Skip if no content
    if (!message.content) {
      return message;
    }
    
    // Apply different levels of optimization
    switch (level) {
      case 'light':
        // Light optimization: Remove extra whitespace
        message.content = message.content.replace(/\s+/g, ' ').trim();
        break;
        
      case 'moderate':
        // Moderate optimization: Remove extra whitespace and simplify common phrases
        message.content = message.content.replace(/\s+/g, ' ').trim();
        message.content = simplifyCommonPhrases(message.content);
        break;
        
      case 'aggressive':
        // Aggressive optimization: Remove all unnecessary characters and simplify text
        message.content = message.content.replace(/\s+/g, ' ').trim();
        message.content = simplifyCommonPhrases(message.content);
        message.content = removeUnnecessaryWords(message.content);
        break;
    }
    
    return message;
  });
  
  // Optimize system message if present
  const systemMessage = req.body.messages.find((m: any) => m.role === 'system');
  if (systemMessage) {
    systemMessage.content = optimizeSystemMessage(systemMessage.content, level);
  }
}

// Apply prompt compression
function applyPromptCompression(req: Request, preserveFormatting: boolean): void {
  // Only process chat completion requests
  if (!req.body.messages || !Array.isArray(req.body.messages)) {
    return;
  }
  
  // Process each message
  req.body.messages = req.body.messages.map((message: any) => {
    // Skip if no content
    if (!message.content) {
      return message;
    }
    
    // Compress content
    if (preserveFormatting) {
      // Preserve code blocks and important formatting
      message.content = compressWithFormattingPreserved(message.content);
    } else {
      // Aggressive compression
      message.content = message.content.replace(/\s+/g, ' ').trim();
    }
    
    return message;
  });
}

// Apply context pruning
function applyContextPruning(req: Request, maxContextLength: number): void {
  // Only process chat completion requests
  if (!req.body.messages || !Array.isArray(req.body.messages)) {
    return;
  }
  
  // Count total tokens in all messages
  let totalTokens = 0;
  const messageTokens: number[] = [];
  
  for (const message of req.body.messages) {
    const tokens = estimateTokens(message.content || '');
    messageTokens.push(tokens);
    totalTokens += tokens;
  }
  
  // If total tokens exceed max context length, prune messages
  if (totalTokens > maxContextLength) {
    // Keep system message and last few user/assistant exchanges
    const systemMessages = req.body.messages.filter((m: any) => m.role === 'system');
    const nonSystemMessages = req.body.messages.filter((m: any) => m.role !== 'system');
    
    // Always keep the last user message
    const lastUserMessage = findLastMessage(nonSystemMessages, 'user');
    
    // Calculate how many tokens we need to remove
    const tokensToRemove = totalTokens - maxContextLength;
    let tokensRemoved = 0;
    
    // Remove oldest messages first until we've removed enough tokens
    const messagesToKeep = [];
    
    // Start from the end (most recent) and work backwards
    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
      const message = nonSystemMessages[i];
      
      // Always keep the last user message
      if (message === lastUserMessage) {
        messagesToKeep.unshift(message);
        continue;
      }
      
      const messageToken = estimateTokens(message.content || '');
      
      // If we've removed enough tokens, keep the rest of the messages
      if (tokensRemoved >= tokensToRemove) {
        messagesToKeep.unshift(message);
      } else {
        // Otherwise, remove this message
        tokensRemoved += messageToken;
      }
    }
    
    // Combine system messages with kept messages
    req.body.messages = [...systemMessages, ...messagesToKeep];
  }
}

// Helper function to find the last message of a specific role
function findLastMessage(messages: any[], role: string): any {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === role) {
      return messages[i];
    }
  }
  return null;
}

// Helper function to estimate tokens in text
function estimateTokens(text: string): number {
  // Simple estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// Helper function to simplify common phrases
function simplifyCommonPhrases(text: string): string {
  const replacements: Record<string, string> = {
    'in order to': 'to',
    'due to the fact that': 'because',
    'for the purpose of': 'for',
    'in the event that': 'if',
    'in the process of': 'while',
    'on the basis of': 'from',
    'with regard to': 'about',
    'with the exception of': 'except',
    'at this point in time': 'now',
    'it is important to note that': '',
    'it should be noted that': '',
    'please be advised that': '',
  };
  
  let result = text;
  
  for (const [phrase, replacement] of Object.entries(replacements)) {
    result = result.replace(new RegExp(phrase, 'gi'), replacement);
  }
  
  return result;
}

// Helper function to remove unnecessary words
function removeUnnecessaryWords(text: string): string {
  const unnecessaryWords = [
    'very', 'really', 'quite', 'basically', 'actually', 'simply',
    'just', 'in my opinion', 'I think', 'I believe', 'sort of',
    'kind of', 'perhaps', 'maybe', 'definitely', 'certainly',
    'probably', 'obviously', 'clearly', 'of course',
  ];
  
  let result = text;
  
  for (const word of unnecessaryWords) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }
  
  // Clean up double spaces
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

// Helper function to optimize system message
function optimizeSystemMessage(text: string, level: string): string {
  // Common verbose system messages and their optimized versions
  const systemMessageReplacements: Record<string, string> = {
    'You are a helpful assistant that provides information and answers questions accurately and thoroughly.': 'You are a helpful assistant.',
    'You are ChatGPT, a large language model trained by OpenAI, based on the GPT-4 architecture.': 'You are ChatGPT.',
    'You are Claude, a helpful AI assistant created by Anthropic.': 'You are Claude.',
  };
  
  // Only apply aggressive optimization to system messages
  if (level === 'aggressive') {
    for (const [verbose, concise] of Object.entries(systemMessageReplacements)) {
      if (text.includes(verbose)) {
        return text.replace(verbose, concise);
      }
    }
  }
  
  return text;
}

// Helper function to compress text while preserving formatting
function compressWithFormattingPreserved(text: string): string {
  // Split by code blocks
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks = text.match(codeBlockRegex) || [];
  const textParts = text.split(codeBlockRegex);
  
  // Compress text parts
  const compressedTextParts = textParts.map(part => part.replace(/\s+/g, ' ').trim());
  
  // Recombine text with code blocks
  let result = '';
  for (let i = 0; i < compressedTextParts.length; i++) {
    result += compressedTextParts[i];
    if (i < codeBlocks.length) {
      result += codeBlocks[i];
    }
  }
  
  return result;
}