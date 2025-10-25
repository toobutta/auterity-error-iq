import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import { authenticateApiKey, errorHandler } from './middleware/auth.js';
import { createWorkflowRoutes } from './routes/workflows.js';
import { ValidationService } from './services/validation.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.isDevelopment ? false : undefined
}));

// CORS
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'If-Match']
}));

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// OpenAPI documentation at /docs
app.use('/docs', (req, res, next) => {
  const validator = new ValidationService();
  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'Auterity Workflow API',
      version: '1.0.0',
      description: 'REST API for workflow export/import with canonical schema validation'
    },
    servers: [
      { url: `http://localhost:${config.port}`, description: 'Development server' }
    ],
    paths: {
      '/v1/workflows/export': {
        post: {
          summary: 'Export ReactFlow workflow to canonical format',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', description: 'ReactFlow workflow data' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Canonical workflow with ID and ETag',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      canonical: { $ref: '#/components/schemas/Workflow' },
                      etag: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Validation error' }
          }
        }
      },
      '/v1/workflows/import': {
        post: {
          summary: 'Import canonical workflow',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Workflow' }
              }
            }
          },
          responses: {
            '200': {
              description: 'Imported workflow in studio format',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      studio: { type: 'object' },
                      canonical: { $ref: '#/components/schemas/Workflow' },
                      etag: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/v1/workflows/{id}': {
        get: {
          summary: 'Get workflow by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: 'Canonical workflow',
              headers: {
                'ETag': { schema: { type: 'string' } }
              },
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Workflow' }
                }
              }
            },
            '404': { description: 'Workflow not found' }
          }
        },
        patch: {
          summary: 'Update workflow with JSON Patch',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'If-Match', in: 'header', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { type: 'object' }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Updated workflow' },
            '409': { description: 'ETag mismatch' }
          }
        }
      }
    },
    components: {
      schemas: {
        Workflow: validator.getJsonSchema()
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      }
    },
    security: [{ ApiKeyAuth: [] }]
  };
  
  swaggerUi.setup(openApiSpec)(req, res, next);
}, swaggerUi.serve);

// Protected routes (require API key)
app.use('/v1/workflows', authenticateApiKey, createWorkflowRoutes());

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const server = app.listen(config.port, () => {
  console.log(`🚀 Workflow API running on http://localhost:${config.port}`);
  console.log(`📖 API docs available at http://localhost:${config.port}/docs`);
  console.log(`🔑 Use x-api-key: ${config.apiKey} for development`);
});

export default app;
