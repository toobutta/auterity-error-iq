const request = require('supertest');
const app = require('./app');

describe('API Tests', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'API is running');
  });

  it('should login and get token', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'password' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should deny access without token', async () => {
    const res = await request(app).get('/api/clickhouse/query?sql=SELECT 1');
    expect(res.statusCode).toEqual(401);
  });
});
