import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('API Integration', () => {
  const API_BASE = 'http://localhost:5055'
  const API_KEY = 'dev-api-key-123'

  it('should fetch health endpoint', async () => {
    const response = await fetch(`${API_BASE}/health`)
    const data = await response.json()
    expect(data.status).toBe('OK')
  })

  it('should export ReactFlow workflow', async () => {
    const sampleRF = {
      id: 'smoke-test',
      name: 'Smoke Test',
      nodes: [{ id: 'n1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Test' } }],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    }

    const response = await fetch(`${API_BASE}/v1/workflows/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(sampleRF)
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('canonical')
    expect(data).toHaveProperty('etag')
  })
})
