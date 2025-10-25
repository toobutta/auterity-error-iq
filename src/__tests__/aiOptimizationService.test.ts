import { describe, it, expect } from 'vitest';
import { aiOptimizationService } from '../services/aiOptimizationService.js';

const mockWorkflow: any = {
  id: 'wf-test-1',
  nodes: [
    { id: 'n1', type: 'action' },
    { id: 'n2', type: 'action' },
    { id: 'n3', type: 'condition' }
  ],
  edges: [
    { from: 'n1', to: 'n2' },
    { from: 'n2', to: 'n3' }
  ]
};

describe('AI Optimization Service (smoke tests)', () => {
  it('optimizes a workflow and returns an OptimizationResult-like shape', async () => {
    const result = await aiOptimizationService.optimizeWorkflow(mockWorkflow);
    expect(result).toHaveProperty('workflowId', mockWorkflow.id);
    expect(result).toHaveProperty('improvements');
    expect(typeof result.confidence).toBe('number');
    expect(Array.isArray(result.appliedOptimizations)).toBe(true);
  });

  it('predicts workflow performance', async () => {
    const prediction = await aiOptimizationService.predictWorkflowPerformance(mockWorkflow);
    expect(prediction).toHaveProperty('workflowId', mockWorkflow.id);
    expect(typeof prediction.predictedExecutionTime).toBe('number');
    expect(prediction.predictedExecutionTime).toBeGreaterThanOrEqual(0);
  });
});
