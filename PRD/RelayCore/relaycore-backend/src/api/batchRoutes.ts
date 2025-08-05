import { Application, Request, Response } from 'express';
import { Queue, Worker } from 'bullmq';
import axios from 'axios';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';
import { ApiError } from '../core/middleware/errorHandler';

// Initialize batch queue
let batchQueue: Queue | null = null;
let batchWorker: Worker | null = null;

// Setup batch routes
export function setupBatchRoutes(app: Application): void {
  const config = configManager.getConfig();
  
  // Check if batch processing is enabled
  if (!config.batch?.enabled) {
    logger.info('Batch processing is disabled');
    return;
  }
  
  logger.info('Setting up batch processing routes');
  
  // Initialize batch queue
  batchQueue = new Queue('batch-requests', {
    connection: {
      host: config.batch.queue?.redis?.host || config.cache?.redis?.host || 'localhost',
      port: config.batch.queue?.redis?.port || config.cache?.redis?.port || 6379,
      password: config.batch.queue?.redis?.password || config.cache?.redis?.password,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });
  
  // Create batch worker
  batchWorker = new Worker('batch-requests', async (job) => {
    const { provider, model, requests } = job.data;
    
    // Process batch based on provider
    switch (provider) {
      case 'openai':
        return processOpenAIBatch(model, requests);
      case 'anthropic':
        return processAnthropicBatch(model, requests);
      case 'mistral':
        return processMistralBatch(model, requests);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }, {
    connection: {
      host: config.batch.queue?.redis?.host || config.cache?.redis?.host || 'localhost',
      port: config.batch.queue?.redis?.port || config.cache?.redis?.port || 6379,
      password: config.batch.queue?.redis?.password || config.cache?.redis?.password,
    },
    concurrency: config.batch.queue?.concurrency || 5,
  });
  
  // Handle worker events
  batchWorker.on('completed', (job, result) => {
    logger.info(`Batch job ${job.id} completed`);
  });
  
  batchWorker.on('failed', (job, err) => {
    logger.error(`Batch job ${job?.id} failed:`, err);
  });
  
  // Batch submission endpoint
  app.post('/v1/batch', async (req: Request, res: Response) => {
    try {
      const { provider, model, requests, options } = req.body;
      
      // Validate request
      if (!provider || !model || !requests || !Array.isArray(requests)) {
        throw new ApiError(400, 'Invalid batch request', 'invalid_request_error');
      }
      
      // Check if provider is supported
      const providerConfig = config.providers?.[provider];
      if (!providerConfig || !providerConfig.enabled) {
        throw new ApiError(400, `Provider ${provider} is not supported`, 'invalid_request_error');
      }
      
      // Check if model is supported
      const modelConfig = (providerConfig as any).models?.[model];
      if (!modelConfig || !modelConfig.enabled) {
        throw new ApiError(400, `Model ${model} is not supported for provider ${provider}`, 'invalid_request_error');
      }
      
      // Add batch job to queue
      const job = await batchQueue.add('process-batch', {
        provider,
        model,
        requests,
        options,
        userId: req.user?.id,
      }, {
        priority: getPriorityValue(options?.priority),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      });
      
      // Return job ID for status checking
      res.status(202).json({
        batch_id: job.id,
        status: 'queued',
        queue_position: await job.getPosition(),
        estimated_completion: new Date(Date.now() + (requests.length * 500)),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          error: {
            type: error.type,
            message: error.message,
          },
        });
      } else {
        logger.error('Batch processing error:', error);
        res.status(500).json({
          error: {
            type: 'internal_error',
            message: 'Failed to process batch request',
          },
        });
      }
    }
  });
  
  // Batch status endpoint
  app.get('/v1/batch/:batchId', async (req: Request, res: Response) => {
    try {
      const { batchId } = req.params;
      
      // Get job from queue
      const job = await batchQueue.getJob(batchId);
      
      if (!job) {
        throw new ApiError(404, 'Batch not found', 'not_found_error');
      }
      
      // Check if user has access to this batch
      if (job.data.userId && job.data.userId !== req.user?.id) {
        throw new ApiError(403, 'You do not have access to this batch', 'permission_denied_error');
      }
      
      // Get job state and progress
      const state = await job.getState();
      const progress = job.progress || 0;
      
      // Return job status
      res.status(200).json({
        batch_id: job.id,
        status: state,
        progress,
        result: job.returnvalue,
        error: job.failedReason,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          error: {
            type: error.type,
            message: error.message,
          },
        });
      } else {
        logger.error('Batch status error:', error);
        res.status(500).json({
          error: {
            type: 'internal_error',
            message: 'Failed to get batch status',
          },
        });
      }
    }
  });
  
  // Batch cancellation endpoint
  app.delete('/v1/batch/:batchId', async (req: Request, res: Response) => {
    try {
      const { batchId } = req.params;
      
      // Get job from queue
      const job = await batchQueue.getJob(batchId);
      
      if (!job) {
        throw new ApiError(404, 'Batch not found', 'not_found_error');
      }
      
      // Check if user has access to this batch
      if (job.data.userId && job.data.userId !== req.user?.id) {
        throw new ApiError(403, 'You do not have access to this batch', 'permission_denied_error');
      }
      
      // Remove job from queue
      await job.remove();
      
      // Return success
      res.status(200).json({
        batch_id: batchId,
        status: 'cancelled',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          error: {
            type: error.type,
            message: error.message,
          },
        });
      } else {
        logger.error('Batch cancellation error:', error);
        res.status(500).json({
          error: {
            type: 'internal_error',
            message: 'Failed to cancel batch',
          },
        });
      }
    }
  });
  
  logger.info('Batch processing routes configured');
}

// Process OpenAI batch
async function processOpenAIBatch(model: string, requests: any[]): Promise<any[]> {
  const config = configManager.getConfig();
  const openaiConfig = config.providers?.openai;
  
  if (!openaiConfig) {
    throw new Error('OpenAI configuration not found');
  }
  
  // OpenAI doesn't have a native batch API, so process sequentially
  const results = [];
  
  for (const request of requests) {
    try {
      const response = await axios.post(`${openaiConfig.baseUrl}/v1/chat/completions`, {
        model,
        messages: request.messages,
        ...request.parameters,
      }, {
        headers: {
          'Authorization': `Bearer ${openaiConfig.apiKey}`,
          'Content-Type': 'application/json',
          ...(openaiConfig.organization ? { 'OpenAI-Organization': openaiConfig.organization } : {}),
        },
      });
      
      results.push({
        id: request.id,
        status: 'success',
        result: response.data,
      });
    } catch (error) {
      results.push({
        id: request.id,
        status: 'error',
        error: error.response?.data || error.message,
      });
    }
  }
  
  return results;
}

// Process Anthropic batch
async function processAnthropicBatch(model: string, requests: any[]): Promise<any> {
  const config = configManager.getConfig();
  const anthropicConfig = config.providers?.anthropic;
  
  if (!anthropicConfig) {
    throw new Error('Anthropic configuration not found');
  }
  
  // Process sequentially for now
  const results = [];
  
  for (const request of requests) {
    try {
      const response = await axios.post(`${anthropicConfig.baseUrl}/v1/messages`, {
        model,
        messages: request.messages,
        ...request.parameters,
      }, {
        headers: {
          'x-api-key': anthropicConfig.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      });
      
      results.push({
        id: request.id,
        status: 'success',
        result: response.data,
      });
    } catch (error) {
      results.push({
        id: request.id,
        status: 'error',
        error: error.response?.data || error.message,
      });
    }
  }
  
  return results;
}

// Process Mistral batch
async function processMistralBatch(model: string, requests: any[]): Promise<any[]> {
  const config = configManager.getConfig();
  const mistralConfig = config.providers?.mistral;
  
  if (!mistralConfig) {
    throw new Error('Mistral configuration not found');
  }
  
  // Process sequentially
  const results = [];
  
  for (const request of requests) {
    try {
      const response = await axios.post(`${mistralConfig.baseUrl}/v1/chat/completions`, {
        model,
        messages: request.messages,
        ...request.parameters,
      }, {
        headers: {
          'Authorization': `Bearer ${mistralConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      results.push({
        id: request.id,
        status: 'success',
        result: response.data,
      });
    } catch (error) {
      results.push({
        id: request.id,
        status: 'error',
        error: error.response?.data || error.message,
      });
    }
  }
  
  return results;
}

// Get priority value
function getPriorityValue(priority: string | undefined): number {
  switch (priority) {
    case 'high':
      return 1;
    case 'low':
      return 3;
    case 'normal':
    default:
      return 2;
  }
}