import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { sampleReactFlow, sampleCanonical } from './fixtures.js';

const API_KEY = 'dev-api-key-123';

describe('Workflow API', () => {
  let workflowId: string;

  describe('POST /v1/workflows/export', () => {
    it('should convert ReactFlow to canonical and store it', async () => {
      const response = await request(app)
        .post('/v1/workflows/export')
        .set('x-api-key', API_KEY)
        .send(sampleReactFlow)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('canonical');
      expect(response.body).toHaveProperty('etag');
      expect(response.body.canonical.version).toBe('1.0.0');
      expect(response.body.canonical.nodes).toHaveLength(2);
      expect(response.body.canonical.edges).toHaveLength(1);
      
      workflowId = response.body.id;
    });

    it('should require API key', async () => {
      await request(app)
        .post('/v1/workflows/export')
        .send(sampleReactFlow)
        .expect(401);
    });

    it('should reject invalid data', async () => {
      await request(app)
        .post('/v1/workflows/export')
        .set('x-api-key', API_KEY)
        .send({ invalid: 'data' })
        .expect(400);
    });
  });

  describe('POST /v1/workflows/import', () => {
    it('should validate and store canonical workflow', async () => {
      const response = await request(app)
        .post('/v1/workflows/import')
        .set('x-api-key', API_KEY)
        .send(sampleCanonical)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('studio');
      expect(response.body).toHaveProperty('canonical');
      expect(response.body).toHaveProperty('etag');
    });
  });

  describe('GET /v1/workflows/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/v1/workflows/export')
        .set('x-api-key', API_KEY)
        .send(sampleReactFlow);
      workflowId = response.body.id;
    });

    it('should retrieve workflow with ETag', async () => {
      const response = await request(app)
        .get(`/v1/workflows/${workflowId}`)
        .set('x-api-key', API_KEY)
        .expect(200);

      expect(response.headers).toHaveProperty('etag');
      expect(response.body.id).toBe(workflowId);
    });

    it('should return 404 for non-existent workflow', async () => {
      await request(app)
        .get('/v1/workflows/non-existent')
        .set('x-api-key', API_KEY)
        .expect(404);
    });
  });

  describe('PATCH /v1/workflows/:id', () => {
    let etag: string;

    beforeEach(async () => {
      const exportResponse = await request(app)
        .post('/v1/workflows/export')
        .set('x-api-key', API_KEY)
        .send(sampleReactFlow);
      
      workflowId = exportResponse.body.id;
      etag = exportResponse.body.etag;
    });

    it('should update workflow with valid JSON Patch and ETag', async () => {
      const patch = [
        { op: 'replace', path: '/nodes/0/position/x', value: 200 }
      ];

      const response = await request(app)
        .patch(`/v1/workflows/${workflowId}`)
        .set('x-api-key', API_KEY)
        .set('If-Match', etag)
        .send(patch)
        .expect(200);

      expect(response.headers).toHaveProperty('etag');
      expect(response.body.nodes[0].position.x).toBe(200);
    });

    it('should return 409 for ETag mismatch', async () => {
      const patch = [
        { op: 'replace', path: '/nodes/0/position/x', value: 200 }
      ];

      await request(app)
        .patch(`/v1/workflows/${workflowId}`)
        .set('x-api-key', API_KEY)
        .set('If-Match', 'wrong-etag')
        .send(patch)
        .expect(409);
    });

    it('should require If-Match header', async () => {
      const patch = [
        { op: 'replace', path: '/nodes/0/position/x', value: 200 }
      ];

      await request(app)
        .patch(`/v1/workflows/${workflowId}`)
        .set('x-api-key', API_KEY)
        .send(patch)
        .expect(400);
    });
  });

  describe('GET /health', () => {
    it('should return health status without auth', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });
  });
});
