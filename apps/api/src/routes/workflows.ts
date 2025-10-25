import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  WorkflowSchema, 
  Workflow, 
  reactflowToCanonical, 
  canonicalToReactflow 
} from '@auterity/workflow-contracts';
import { ValidationService } from '../services/validation.js';
import { WorkflowStore } from '../services/store.js';

export function createWorkflowRoutes() {
  const router = Router();
  const validator = new ValidationService();
  const store = new WorkflowStore();

  // POST /v1/workflows/export - Convert ReactFlow to Canonical
  router.post('/export', (req: Request, res: Response) => {
    try {
      const reactFlowData = req.body;
      
      // Convert ReactFlow to Canonical
      const canonical = reactflowToCanonical(reactFlowData);
      
      // Validate canonical format
      const validation = validator.validateWithZod(canonical);
      if (!validation.success) {
        const error = new Error('Validation failed');
        (error as any).type = 'validation';
        (error as any).errors = validation.error.issues;
        throw error;
      }
      
      // Store the canonical workflow
      const stored = store.store(validation.data);
      
      res.status(200).json({
        id: stored.workflow.id,
        canonical: stored.workflow,
        etag: stored.etag
      });
    } catch (error: any) {
      if (error.type === 'validation') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      res.status(500).json({ error: 'Export failed' });
    }
  });

  // POST /v1/workflows/import - Store canonical workflow for import
  router.post('/import', (req: Request, res: Response) => {
    try {
      const canonicalData = req.body;
      
      // Validate canonical format
      const validation = validator.validateWithZod(canonicalData);
      if (!validation.success) {
        const error = new Error('Validation failed');
        (error as any).type = 'validation';
        (error as any).errors = validation.error.issues;
        throw error;
      }
      
      // Store the workflow
      const stored = store.store(validation.data);
      
      // Convert to studio format (could be customized)
      const studioFormat = canonicalToReactflow(validation.data);
      
      res.status(200).json({
        id: stored.workflow.id,
        studio: studioFormat,
        canonical: stored.workflow,
        etag: stored.etag
      });
    } catch (error: any) {
      if (error.type === 'validation') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      res.status(500).json({ error: 'Import failed' });
    }
  });

  // GET /v1/workflows/:id - Retrieve canonical workflow
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stored = store.get(id);
      
      if (!stored) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      res.set('ETag', stored.etag);
      res.status(200).json(stored.workflow);
    } catch (error) {
      res.status(500).json({ error: 'Retrieval failed' });
    }
  });

  // PATCH /v1/workflows/:id - JSON Patch with ETag
  router.patch('/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ifMatch = req.headers['if-match'] as string;
      const operations = req.body;
      
      if (!ifMatch) {
        return res.status(400).json({ error: 'If-Match header required' });
      }
      
      const stored = store.patch(id, operations, ifMatch);
      
      // Validate patched result
      const validation = validator.validateWithZod(stored.workflow);
      if (!validation.success) {
        // Rollback by restoring from backup if needed
        return res.status(400).json({
          error: 'Patch resulted in invalid workflow',
          details: validation.error.issues
        });
      }
      
      res.set('ETag', stored.etag);
      res.status(200).json(stored.workflow);
    } catch (error: any) {
      if (error.type === 'etag_mismatch') {
        return res.status(409).json({ error: 'ETag mismatch - resource has been modified' });
      }
      if (error.message === 'Workflow not found') {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      res.status(500).json({ error: 'Patch failed' });
    }
  });

  // GET /v1/workflows - List all workflows
  router.get('/', (req: Request, res: Response) => {
    try {
      const workflows = store.list().map(stored => ({
        id: stored.workflow.id,
        version: stored.workflow.version,
        metadata: stored.workflow.metadata,
        nodeCount: stored.workflow.nodes.length,
        edgeCount: stored.workflow.edges.length,
        etag: stored.etag,
        updatedAt: stored.updatedAt
      }));
      
      res.status(200).json({ workflows });
    } catch (error) {
      res.status(500).json({ error: 'List failed' });
    }
  });

  return router;
}
