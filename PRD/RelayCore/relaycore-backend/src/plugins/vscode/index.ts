import { Application, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { configManager } from '../../config/configManager';
import { logger } from '../../utils/logger';
import { Plugin } from '../pluginManager';

// VS Code plugin
const VSCodePlugin: Plugin = {
  name: 'vscode',
  version: '1.0.0',
  
  initialize: (app: Application) => {
    logger.info('Initializing VS Code plugin');
    
    const config = configManager.getConfig();
    const pluginConfig = config.plugins?.vscode || {};
    
    // Register VS Code specific routes
    app.post('/v1/vscode/completions', async (req: Request, res: Response) => {
      try {
        // Get default model from config
        const defaultModel = pluginConfig.defaultModel || 'gpt-3.5-turbo';
        const defaultMaxTokens = pluginConfig.maxTokens || 2048;
        const defaultTemperature = pluginConfig.temperature || 0.7;
        
        // Get provider for the model
        const provider = getProviderForModel(defaultModel, config);
        
        if (!provider) {
          return res.status(400).json({
            error: {
              type: 'invalid_request_error',
              message: `No provider found for model: ${defaultModel}`,
            },
          });
        }
        
        // Prepare request body
        const requestBody = {
          model: req.body.model || defaultModel,
          messages: req.body.messages || [
            { role: 'system', content: 'You are a helpful coding assistant.' },
            { role: 'user', content: req.body.prompt || '' },
          ],
          temperature: req.body.temperature || defaultTemperature,
          max_tokens: req.body.max_tokens || defaultMaxTokens,
        };
        
        // Forward to appropriate provider
        const providerUrl = config.providers?.[provider]?.baseUrl;
        
        if (!providerUrl) {
          return res.status(400).json({
            error: {
              type: 'invalid_request_error',
              message: `Provider URL not configured for: ${provider}`,
            },
          });
        }
        
        // Create proxy middleware for this request
        const proxy = createProxyMiddleware({
          target: providerUrl,
          changeOrigin: true,
          pathRewrite: {
            '^/v1/vscode/completions': '/v1/chat/completions',
          },
          onProxyReq: (proxyReq, req) => {
            // Add provider API key
            const apiKey = config.providers?.[provider]?.apiKey;
            
            if (provider === 'openai') {
              proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
            } else if (provider === 'anthropic') {
              proxyReq.setHeader('x-api-key', apiKey);
              proxyReq.setHeader('anthropic-version', '2023-06-01');
            } else {
              proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
            }
            
            // Replace request body
            const bodyData = JSON.stringify(requestBody);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            
            // Write new body
            proxyReq.write(bodyData);
            proxyReq.end();
          },
          onProxyRes: (proxyRes, req, res) => {
            // Add VS Code plugin headers
            proxyRes.headers['x-vscode-plugin'] = 'true';
          },
        });
        
        // Execute proxy for this request
        proxy(req, res, (err) => {
          if (err) {
            logger.error('VS Code plugin proxy error:', err);
            res.status(500).json({
              error: {
                type: 'internal_error',
                message: 'Error forwarding request to provider',
              },
            });
          }
        });
      } catch (error) {
        logger.error('VS Code plugin error:', error);
        res.status(500).json({
          error: {
            type: 'internal_error',
            message: 'An unexpected error occurred',
          },
        });
      }
    });
    
    // Register VS Code plugin info endpoint
    app.get('/v1/vscode/info', (req: Request, res: Response) => {
      res.json({
        name: 'VS Code Plugin',
        version: '1.0.0',
        defaultModel: pluginConfig.defaultModel || 'gpt-3.5-turbo',
        maxTokens: pluginConfig.maxTokens || 2048,
        temperature: pluginConfig.temperature || 0.7,
      });
    });
    
    logger.info('VS Code plugin initialized');
  },
  
  shutdown: async () => {
    logger.info('Shutting down VS Code plugin');
    // No cleanup needed
  },
};

// Helper function to get provider for model
function getProviderForModel(model: string, config: any): string | null {
  for (const [provider, providerConfig] of Object.entries(config.providers || {})) {
    if ((providerConfig as any).models?.[model]) {
      return provider;
    }
  }
  
  // Default to OpenAI for GPT models
  if (model.startsWith('gpt-')) {
    return 'openai';
  }
  
  // Default to Anthropic for Claude models
  if (model.startsWith('claude-')) {
    return 'anthropic';
  }
  
  // Default to Mistral for Mistral models
  if (model.startsWith('mistral-')) {
    return 'mistral';
  }
  
  return null;
}

export default VSCodePlugin;