import { describe, it, expect } from 'vitest'
import { WorkflowSchema, reactflowToCanonical, canonicalToReactflow } from '@auterity/workflow-contracts'

describe('Contracts Integration', () => {
  const sampleWorkflow = {
    id: 'test-workflow',
    name: 'Test',
    nodes: [
      {
        id: 'node-1',
        type: 'start',
        position: { x: 100, y: 200 },
        data: { label: 'Start Node' }
      }
    ],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 }
  }

  it('should validate workflow with Zod schema', () => {
    const canonical = reactflowToCanonical(sampleWorkflow)
    const result = WorkflowSchema.safeParse(canonical)
    expect(result.success).toBe(true)
  })

  it('should round-trip convert RF → Canonical → RF', () => {
    const canonical = reactflowToCanonical(sampleWorkflow)
    const backToRF = canonicalToReactflow(canonical)
    expect(backToRF.id).toBe(sampleWorkflow.id)
    expect(backToRF.nodes.length).toBe(1)
    expect(backToRF.nodes[0].position.x).toBe(100)
  })
})
