import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API endpoints
export const handlers = [
  // Health check
  rest.get('/api/health', (req, res, ctx) => {
    return res(ctx.json({ status: 'ok', timestamp: new Date().toISOString() }));
  }),

  // Workflows API
  rest.get('/api/workflows', (req, res, ctx) => {
    return res(ctx.json({
      workflows: [
        {
          id: 'workflow-1',
          name: 'Sample Workflow',
          version: '1.0.0',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ],
      total: 1,
      page: 1,
      limit: 10
    }));
  }),

  rest.post('/api/workflows', async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.json({
      id: `workflow-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
      status: 'draft'
    }));
  }),

  rest.get('/api/workflows/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(ctx.json({
      id,
      name: 'Sample Workflow',
      version: '1.0.0',
      nodes: [],
      edges: [],
      metadata: {}
    }));
  }),

  // AI Service mocks
  rest.post('/api/ai/generate', async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.json({
      response: `Mock AI response for: ${body.prompt}`,
      model: 'gpt-4',
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30
      }
    }));
  }),

  // User API
  rest.get('/api/user/profile', (req, res, ctx) => {
    return res(ctx.json({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      role: 'admin',
      preferences: {}
    }));
  })
];

// Setup MSW server
export const server = setupServer(...handlers);
