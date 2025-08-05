import request from 'supertest';
import { app } from '../../src/app';
import { query } from '../../src/database';
import { v4 as uuidv4 } from 'uuid';

// Mock database queries
jest.mock('../../src/database', () => ({
  query: jest.fn(),
  transaction: jest.fn()
}));

describe('Model Selection API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/models/select', () => {
    it('should select a model based on request content', async () => {
      // Mock database responses
      (query as jest.Mock).mockImplementation((sql, params) => {
        if (sql.includes('budget_configs')) {
          return {
            rows: [{
              id: uuidv4(),
              limit_amount: '1000.00',
              current_spend: '200.00',
              warning_threshold: '70.00',
              critical_threshold: '90.00'
            }]
          };
        } else if (sql.includes('cost_tracking')) {
          return {
            rows: [{
              total_cost: '200.00'
            }]
          };
        } else if (sql.includes('model_cost_profiles')) {
          return {
            rows: [
              {
                id: uuidv4(),
                provider: 'OpenAI',
                model: 'gpt-4-turbo',
                input_token_cost: '0.00001',
                output_token_cost: '0.00003',
                currency: 'USD',
                average_latency: 500,
                throughput: 1000,
                capabilities: '{"text-generation": true, "code-generation": true}',
                alternatives: '{}',
                updated_at: new Date().toISOString(),
                enabled: true
              },
              {
                id: uuidv4(),
                provider: 'OpenAI',
                model: 'gpt-3.5-turbo',
                input_token_cost: '0.0000015',
                output_token_cost: '0.000002',
                currency: 'USD',
                average_latency: 300,
                throughput: 2000,
                capabilities: '{"text-generation": true, "code-generation": true}',
                alternatives: '{}',
                updated_at: new Date().toISOString(),
                enabled: true
              }
            ]
          };
        } else {
          return { rows: [] };
        }
      });

      // Test request
      const response = await request(app)
        .post('/api/v1/models/select')
        .send({
          requestId: uuidv4(),
          content: {
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: 'Hello, how are you?' }
            ]
          },
          metadata: {
            userId: 'user-123',
            organizationId: 'org-123',
            teamId: 'team-123',
            taskType: 'general-chat',
            qualityRequirement: 'standard',
            budgetPriority: 'balanced'
          },
          constraints: {
            preferredModel: 'gpt-4-turbo',
            maxCost: 0.1
          }
        });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('selectedModel');
      expect(response.body).toHaveProperty('alternatives');
      expect(response.body).toHaveProperty('reasoning');
      expect(response.body).toHaveProperty('estimatedCost');
      expect(response.body).toHaveProperty('budgetImpact');
      expect(response.body).toHaveProperty('fallbackChain');
    });

    it('should enforce budget constraints', async () => {
      // Mock database responses for budget exceeded scenario
      (query as jest.Mock).mockImplementation((sql, params) => {
        if (sql.includes('budget_configs')) {
          return {
            rows: [{
              id: uuidv4(),
              limit_amount: '1000.00',
              current_spend: '990.00',
              warning_threshold: '70.00',
              critical_threshold: '90.00'
            }]
          };
        } else if (sql.includes('cost_tracking')) {
          return {
            rows: [{
              total_cost: '990.00'
            }]
          };
        } else if (sql.includes('model_cost_profiles')) {
          return {
            rows: [
              {
                id: uuidv4(),
                provider: 'OpenAI',
                model: 'gpt-4-turbo',
                input_token_cost: '0.00001',
                output_token_cost: '0.00003',
                currency: 'USD',
                average_latency: 500,
                throughput: 1000,
                capabilities: '{"text-generation": true, "code-generation": true}',
                alternatives: '{}',
                updated_at: new Date().toISOString(),
                enabled: true
              },
              {
                id: uuidv4(),
                provider: 'OpenAI',
                model: 'gpt-3.5-turbo',
                input_token_cost: '0.0000015',
                output_token_cost: '0.000002',
                currency: 'USD',
                average_latency: 300,
                throughput: 2000,
                capabilities: '{"text-generation": true, "code-generation": true}',
                alternatives: '{}',
                updated_at: new Date().toISOString(),
                enabled: true
              }
            ]
          };
        } else {
          return { rows: [] };
        }
      });

      // Test request
      const response = await request(app)
        .post('/api/v1/models/select')
        .send({
          requestId: uuidv4(),
          content: {
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: 'Hello, how are you?' }
            ]
          },
          metadata: {
            userId: 'user-123',
            organizationId: 'org-123',
            teamId: 'team-123',
            taskType: 'general-chat',
            qualityRequirement: 'standard',
            budgetPriority: 'balanced'
          },
          constraints: {
            preferredModel: 'gpt-4-turbo',
            maxCost: 0.1
          }
        });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('selectedModel');
      // Should select cheaper model due to budget constraints
      expect(response.body.selectedModel).toBe('gpt-3.5-turbo');
      expect(response.body.budgetImpact.status).toBe('critical');
    });

    it('should handle fallback chains', async () => {
      // Mock database responses
      (query as jest.Mock).mockImplementation((sql, params) => {
        if (sql.includes('model_cost_profiles WHERE model =')) {
          return {
            rows: [
              {
                id: uuidv4(),
                provider: 'OpenAI',
                model: 'gpt-4-turbo',
                input_token_cost: '0.00001',
                output_token_cost: '0.00003',
                currency: 'USD',
                average_latency: 500,
                throughput: 1000,
                capabilities: '{"text-generation": true, "code-generation": true}',
                alternatives: '{}',
                updated_at: new Date().toISOString(),
                enabled: true
              }
            ]
          };
        } else if (sql.includes('model_cost_profiles WHERE enabled')) {
          return {
            rows: [
              {
                id: uuidv4(),
                provider: 'OpenAI',
                model: 'gpt-4-turbo',
                input_token_cost: '0.00001',
                output_token_cost: '0.00003',
                currency: 'USD',
                average_latency: 500,
                throughput: 1000,
                capabilities: '{"text-generation": true, "code-generation": true}',
                alternatives: '{}',
                updated_at: new Date().toISOString(),
                enabled: true
              },
              {
                id: uuidv4(),
                provider: 'OpenAI',
                model: 'gpt-3.5-turbo',
                input_token_cost: '0.0000015',
                output_token_cost: '0.000002',
                currency: 'USD',
                average_latency: 300,
                throughput: 2000,
                capabilities: '{"text-generation": true, "code-generation": true}',
                alternatives: '{}',
                updated_at: new Date().toISOString(),
                enabled: true
              },
              {
                id: uuidv4(),
                provider: 'Anthropic',
                model: 'claude-3-sonnet',
                input_token_cost: '0.000003',
                output_token_cost: '0.000015',
                currency: 'USD',
                average_latency: 400,
                throughput: 1200,
                capabilities: '{"text-generation": true, "code-generation": true}',
                alternatives: '{}',
                updated_at: new Date().toISOString(),
                enabled: true
              }
            ]
          };
        } else {
          return { rows: [] };
        }
      });

      // Test request
      const response = await request(app)
        .get('/api/v1/models/fallbacks/gpt-4-turbo');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('model');
      expect(response.body).toHaveProperty('fallbackChain');
      expect(response.body.model).toBe('gpt-4-turbo');
      expect(response.body.fallbackChain).toBeInstanceOf(Array);
      expect(response.body.fallbackChain.length).toBe(2);
    });
  });

  describe('POST /api/v1/models/estimate', () => {
    it('should estimate cost for a request', async () => {
      // Mock database responses
      (query as jest.Mock).mockImplementation((sql, params) => {
        if (sql.includes('model_cost_profiles')) {
          return {
            rows: [
              {
                id: uuidv4(),
                provider: 'OpenAI',
                model: 'gpt-4-turbo',
                input_token_cost: '0.00001',
                output_token_cost: '0.00003',
                currency: 'USD',
                average_latency: 500,
                throughput: 1000,
                capabilities: '{"text-generation": true, "code-generation": true}',
                alternatives: '{}',
                updated_at: new Date().toISOString(),
                enabled: true
              },
              {
                id: uuidv4(),
                provider: 'OpenAI',
                model: 'gpt-3.5-turbo',
                input_token_cost: '0.0000015',
                output_token_cost: '0.000002',
                currency: 'USD',
                average_latency: 300,
                throughput: 2000,
                capabilities: '{"text-generation": true, "code-generation": true}',
                alternatives: '{}',
                updated_at: new Date().toISOString(),
                enabled: true
              }
            ]
          };
        } else {
          return { rows: [] };
        }
      });

      // Test request
      const response = await request(app)
        .post('/api/v1/models/estimate')
        .send({
          content: {
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: 'Hello, how are you?' }
            ]
          },
          models: ['gpt-4-turbo', 'gpt-3.5-turbo']
        });

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('estimates');
      expect(response.body.estimates).toBeInstanceOf(Array);
      expect(response.body.estimates.length).toBe(2);
      expect(response.body.estimates[0]).toHaveProperty('modelId');
      expect(response.body.estimates[0]).toHaveProperty('provider');
      expect(response.body.estimates[0]).toHaveProperty('inputTokens');
      expect(response.body.estimates[0]).toHaveProperty('estimatedOutputTokens');
      expect(response.body.estimates[0]).toHaveProperty('cost');
    });
  });
});