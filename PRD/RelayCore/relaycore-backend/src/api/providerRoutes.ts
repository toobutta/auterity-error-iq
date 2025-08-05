import { Application } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { configManager } from '../config/configManager';
import { cacheMiddleware } from '../cache/cacheMiddleware';
import { logger } from '../utils/logger';
import { optimizationMiddleware } from '../optimization/optimizationMiddleware';
import { SteeringService, createSteeringMiddleware } from '../steering';
import path from 'path';

// Setup provider routes
export function setupProviderRoutes(app: Application): void {
  const config = configManager.getConfig();
  
  // Initialize steering service
  const rulesFilePath = path.join(process.cwd(), 'config', 'steering-rules.yaml');
  const steeringService = new SteeringService(rulesFilePath, logger, true);
  
  // Create steering middleware
  const steeringMiddleware = createSteeringMiddleware(steeringService, {
    applyRouting: true,
    applyRejection: true,
    getUserFromRequest: (req) => req.user,
    additionalContext: (req) => ({
      tokenCount: req.body?.prompt?.length ? Math.ceil(req.body.prompt.length / 4) : 0,
      timestamp: new Date().toISOString(),
      clientIp: req.ip,
      userAgent: req.headers['user-agent']
    })
  });
  
  // Setup routes for each enabled provider
  for (const [providerName, providerConfig] of Object.entries(config.providers || {})) {
    const provider = providerConfig as any;
    
    if (!provider.enabled) {
      continue;
    }
    
    logger.info(`Setting up routes for provider: ${providerName}`);
    
    // Create proxy middleware for this provider
    const proxy = createProxyMiddleware({
      target: provider.baseUrl,
      changeOrigin: true,
      pathRewrite: {
        [`^/v1/${providerName}`]: '/v1',
      },
      onProxyReq: (proxyReq, req) => {
        // Check if routing decision was made by steering rules
        const routingDecision = (req as any).routingDecision;
        
        // If routing decision specifies a different provider, don't proceed with this one
        if (routingDecision && routingDecision.provider && routingDecision.provider !== providerName) {
          logger.debug(`Skipping ${providerName} due to routing decision: ${JSON.stringify(routingDecision)}`);
          return;
        }
        
        // Add provider API key
        if (providerName === 'openai') {
          proxyReq.setHeader('Authorization', `Bearer ${provider.apiKey}`);
          
          // Add organization if provided
          if (provider.organization) {
            proxyReq.setHeader('OpenAI-Organization', provider.organization);
          }
        } else if (providerName === 'anthropic') {
          proxyReq.setHeader('x-api-key', provider.apiKey);
          proxyReq.setHeader('anthropic-version', '2023-06-01');
        } else {
          proxyReq.setHeader('Authorization', `Bearer ${provider.apiKey}`);
        }
        
        // Log request
        logger.debug(`Proxying request to ${providerName}: ${req.method} ${req.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add provider header
        proxyRes.headers['x-aihub-provider-used'] = providerName;
        
        // Log response
        logger.debug(`Response from ${providerName}: ${proxyRes.statusCode}`);
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error for ${providerName}:`, err);
        
        res.status(502).json({
          error: {
            type: 'provider_error',
            message: `Error connecting to ${providerName}: ${err.message}`,
            provider: providerName,
          },
        });
      },
    });
    
    // Apply middleware and proxy for each endpoint
    app.use(`/v1/${providerName}`, cacheMiddleware, optimizationMiddleware, steeringMiddleware, proxy);
    
    // Setup provider-specific subdomain if using express-subdomain
    // This would require additional setup with express-subdomain package
    
    logger.info(`Routes for provider ${providerName} configured`);
  }
  
  // Setup a generic endpoint that uses steering rules to determine the provider
  app.use('/v1/ai', cacheMiddleware, optimizationMiddleware, steeringMiddleware, (req, res, next) => {
    const routingDecision = (req as any).routingDecision;
    
    if (!routingDecision || !routingDecision.provider) {
      return res.status(400).json({
        error: {
          type: 'routing_error',
          message: 'No provider specified in routing decision',
        },
      });
    }
    
    const providerName = routingDecision.provider;
    const provider = (config.providers || {})[providerName] as any;
    
    if (!provider || !provider.enabled) {
      return res.status(400).json({
        error: {
          type: 'routing_error',
          message: `Provider ${providerName} not found or not enabled`,
        },
      });
    }
    
    // Create a one-time proxy for this request
    const proxy = createProxyMiddleware({
      target: provider.baseUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/v1/ai': '/v1',
      },
      onProxyReq: (proxyReq, req) => {
        // Add provider API key
        if (providerName === 'openai') {
          proxyReq.setHeader('Authorization', `Bearer ${provider.apiKey}`);
          
          // Add organization if provided
          if (provider.organization) {
            proxyReq.setHeader('OpenAI-Organization', provider.organization);
          }
        } else if (providerName === 'anthropic') {
          proxyReq.setHeader('x-api-key', provider.apiKey);
          proxyReq.setHeader('anthropic-version', '2023-06-01');
        } else {
          proxyReq.setHeader('Authorization', `Bearer ${provider.apiKey}`);
        }
        
        // If model was specified in routing decision, update the request body
        if (routingDecision.model && req.body) {
          req.body.model = routingDecision.model;
          
          // Update the body in the proxy request
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
          proxyReq.end();
        }
        
        // Log request
        logger.debug(`Proxying request to ${providerName} via generic endpoint: ${req.method} ${req.path}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add provider header
        proxyRes.headers['x-aihub-provider-used'] = providerName;
        
        // Log response
        logger.debug(`Response from ${providerName} via generic endpoint: ${proxyRes.statusCode}`);
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error for ${providerName} via generic endpoint:`, err);
        
        res.status(502).json({
          error: {
            type: 'provider_error',
            message: `Error connecting to ${providerName}: ${err.message}`,
            provider: providerName,
          },
        });
      },
    });
    
    // Apply the proxy for this request
    proxy(req, res, next);
  });
}