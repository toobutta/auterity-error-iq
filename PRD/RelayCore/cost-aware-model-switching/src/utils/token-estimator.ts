/**
 * Token Estimator Utility
 * 
 * This utility provides functions for estimating token counts for AI model requests.
 */

import { createLogger } from './logger';

const logger = createLogger('token-estimator');

/**
 * Estimates the number of tokens in a string
 * This is a simple approximation - in production, use a proper tokenizer
 * 
 * @param text Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateStringTokens(text: string): number {
  if (!text) return 0;
  
  // Simple approximation: 1 token ≈ 4 characters for English text
  // This is a rough estimate and will vary by language and content
  return Math.ceil(text.length / 4);
}

/**
 * Estimates tokens for a chat message
 * 
 * @param message Chat message object
 * @returns Estimated token count
 */
export function estimateChatMessageTokens(message: any): number {
  if (!message) return 0;
  
  // Base tokens for message metadata (role, etc.)
  let tokens = 4;
  
  // Add tokens for content
  if (message.content) {
    tokens += estimateStringTokens(message.content);
  }
  
  // Add tokens for name if present
  if (message.name) {
    tokens += 1 + estimateStringTokens(message.name);
  }
  
  // Add tokens for function_call if present
  if (message.function_call) {
    tokens += 4; // Base tokens for function call
    
    if (message.function_call.name) {
      tokens += estimateStringTokens(message.function_call.name);
    }
    
    if (message.function_call.arguments) {
      tokens += estimateStringTokens(message.function_call.arguments);
    }
  }
  
  return tokens;
}

/**
 * Estimates tokens for a request
 * 
 * @param content Request content (messages, prompt, etc.)
 * @returns Object with inputTokens and estimatedOutputTokens
 */
export async function estimateTokens(content: any): Promise<{ inputTokens: number, estimatedOutputTokens: number }> {
  try {
    let inputTokens = 0;
    
    // Handle chat messages
    if (content.messages && Array.isArray(content.messages)) {
      // Sum tokens for all messages
      inputTokens = content.messages.reduce((sum, message) => {
        return sum + estimateChatMessageTokens(message);
      }, 0);
    } 
    // Handle text prompt
    else if (content.prompt) {
      inputTokens = estimateStringTokens(content.prompt);
      
      // Add system prompt if present
      if (content.systemPrompt) {
        inputTokens += estimateStringTokens(content.systemPrompt) + 4; // 4 extra tokens for system role
      }
    }
    // Handle system prompt only
    else if (content.systemPrompt) {
      inputTokens = estimateStringTokens(content.systemPrompt) + 4; // 4 extra tokens for system role
    }
    
    // Estimate output tokens based on input tokens
    // This is a very rough estimate and will vary by model and task
    let estimatedOutputTokens = Math.ceil(inputTokens * 1.5);
    
    // Ensure minimum values
    inputTokens = Math.max(1, inputTokens);
    estimatedOutputTokens = Math.max(1, estimatedOutputTokens);
    
    return { inputTokens, estimatedOutputTokens };
  } catch (error) {
    logger.error('Error estimating tokens:', error);
    
    // Return default values if estimation fails
    return { inputTokens: 100, estimatedOutputTokens: 150 };
  }
}

/**
 * Estimates the cost of a request
 * 
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @param inputCost Cost per input token
 * @param outputCost Cost per output token
 * @returns Total estimated cost
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  inputCost: number,
  outputCost: number
): number {
  return (inputTokens * inputCost) + (outputTokens * outputCost);
}