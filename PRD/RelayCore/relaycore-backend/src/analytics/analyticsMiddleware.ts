import { Request, Response, NextFunction } from 'express';
import { trackRequest } from './database';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';

// Analytics middleware
export const analyticsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = configManager.getConfig();
    
    // Check if analytics is enabled
    if (!config.analytics?.enabled) {
      return next();
    }
    
    // Check if sampling is enabled and if this request should be sampled
    if (config.analytics.sampling?.enabled) {
      const samplingRate = config.analytics.sampling.rate || 0.1; // Default to 10% sampling
      if (Math.random() > samplingRate) {
        return next();
      }
    }
    
    // Record request start time
    const requestStartTime = Date.now();
    
    // Extract user ID from authentication
    const userId = req.user?.id || 'anonymous';
    
    // Store request metadata
    const requestMetadata = {
      id: req.id,
      userId,
      provider: req.path.split('/')[2], // Extract provider from path
      model: req.body?.model || 'unknown',
      requestTime: new Date(),
      requestBody: req.body,
    };
    
    // Store response body
    res.locals.responseBody = {};
    
    // Override end function to capture response data
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      // Calculate latency
      const latency = Date.now() - requestStartTime;
      
      // Try to parse response body
      try {
        if (chunk) {
          const body = chunk.toString();
          if (body && body.startsWith('{')) {
            res.locals.responseBody = JSON.parse(body);
          }
        }
      } catch (error) {
        logger.debug('Error parsing response body:', error);
      }
      
      // Extract token counts and other metadata
      const responseBody = res.locals.responseBody || {};
      const inputTokens = calculateInputTokens(req.body, requestMetadata.provider);
      const outputTokens = responseBody.usage?.completion_tokens || 
                          responseBody.usage?.output_tokens || 
                          responseBody.usage?.total_tokens || 0;
      
      // Calculate estimated cost
      const estimatedCost = calculateCost(
        requestMetadata.provider,
        req.body.model,
        inputTokens,
        outputTokens
      );
      
      // Get optimizations applied
      const optimizationsApplied = res.getHeader('X-AIHub-Optimizations-Applied') || '{}';
      
      // Track request in database
      trackRequest({
        userId,
        provider: requestMetadata.provider,
        model: requestMetadata.model,
        inputTokens,
        outputTokens,
        estimatedCost,
        cacheStatus: res.getHeader('X-AIHub-Cache-Status')?.toString() || 'none',
        optimizationsApplied: typeof optimizationsApplied === 'string' ? 
          JSON.parse(optimizationsApplied) : optimizationsApplied,
        requestTime: requestMetadata.requestTime,
        responseTime: new Date(),
        latency,
        statusCode: res.statusCode,
        errorType: res.locals.errorType,
        requestId: req.id,
      }).catch((err) => {
        logger.error('Error tracking request:', err);
      });
      
      // Add analytics headers
      res.setHeader('X-AIHub-Tokens-Input', inputTokens);
      res.setHeader('X-AIHub-Tokens-Output', outputTokens);
      res.setHeader('X-AIHub-Cost', estimatedCost.toFixed(6));
      res.setHeader('X-AIHub-Latency', latency);
      
      // Call original end function
      return originalEnd.apply(this, arguments as any);
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Calculate input tokens
function calculateInputTokens(body: any, provider: string): number {
  try {
    switch (provider) {
      case 'openai':
        return estimateOpenAITokens(body);
      case 'anthropic':
        return estimateAnthropicTokens(body);
      case 'mistral':
        return estimateMistralTokens(body);
      default:
        return estimateGenericTokens(body);
    }
  } catch (error) {
    logger.error('Error calculating input tokens:', error);
    return 0;
  }
}

// Estimate OpenAI tokens
function estimateOpenAITokens(body: any): number {
  // Simple estimation based on message content
  if (!body.messages || !Array.isArray(body.messages)) {
    return 0;
  }
  
  // Estimate 1 token per 4 characters
  return body.messages.reduce((total: number, message: any) => {
    if (message.content) {
      return total + Math.ceil(message.content.length / 4);
    }
    return total;
  }, 0);
}

// Estimate Anthropic tokens
function estimateAnthropicTokens(body: any): number {
  // Similar estimation for Anthropic
  if (!body.messages || !Array.isArray(body.messages)) {
    return 0;
  }
  
  // Estimate 1 token per 4 characters
  return body.messages.reduce((total: number, message: any) => {
    if (message.content) {
      return total + Math.ceil(message.content.length / 4);
    }
    return total;
  }, 0);
}

// Estimate Mistral tokens
function estimateMistralTokens(body: any): number {
  // Similar estimation for Mistral
  if (!body.messages || !Array.isArray(body.messages)) {
    return 0;
  }
  
  // Estimate 1 token per 4 characters
  return body.messages.reduce((total: number, message: any) => {
    if (message.content) {
      return total + Math.ceil(message.content.length / 4);
    }
    return total;
  }, 0);
}

// Estimate generic tokens
function estimateGenericTokens(body: any): number {
  // Generic estimation for any provider
  const bodyString = JSON.stringify(body);
  // Estimate 1 token per 4 characters
  return Math.ceil(bodyString.length / 4);
}

// Calculate cost
function calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
  try {
    const config = configManager.getConfig();
    const providerConfig = config.providers?.[provider];
    
    if (!providerConfig || !providerConfig.models?.[model]) {
      return 0;
    }
    
    const modelConfig = providerConfig.models[model];
    
    const inputCost = (modelConfig.costPerInputToken || 0) * inputTokens;
    const outputCost = (modelConfig.costPerOutputToken || 0) * outputTokens;
    
    return inputCost + outputCost;
  } catch (error) {
    logger.error('Error calculating cost:', error);
    return 0;
  }
}