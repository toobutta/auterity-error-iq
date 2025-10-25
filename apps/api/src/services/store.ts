import { Workflow } from '@auterity/workflow-contracts';
import crypto from 'crypto';
import { applyPatch, Operation } from 'fast-json-patch';

interface StoredWorkflow {
  workflow: Workflow;
  etag: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowStore {
  private workflows = new Map<string, StoredWorkflow>();

  private generateETag(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  store(workflow: Workflow): StoredWorkflow {
    const now = new Date();
    const etag = this.generateETag(workflow);
    
    const stored: StoredWorkflow = {
      workflow,
      etag,
      createdAt: now,
      updatedAt: now
    };
    
    this.workflows.set(workflow.id, stored);
    return stored;
  }

  get(id: string): StoredWorkflow | undefined {
    return this.workflows.get(id);
  }

  patch(id: string, operations: Operation[], ifMatch?: string): StoredWorkflow {
    const stored = this.workflows.get(id);
    if (!stored) {
      throw new Error('Workflow not found');
    }

    if (ifMatch && stored.etag !== ifMatch) {
      const error = new Error('ETag mismatch');
      (error as any).type = 'etag_mismatch';
      throw error;
    }

    // Apply JSON Patch
    const patched = applyPatch(stored.workflow, operations, false, false).newDocument;
    
    // Update the stored workflow
    const newEtag = this.generateETag(patched);
    const updatedStored: StoredWorkflow = {
      workflow: patched,
      etag: newEtag,
      createdAt: stored.createdAt,
      updatedAt: new Date()
    };
    
    this.workflows.set(id, updatedStored);
    return updatedStored;
  }

  list(): StoredWorkflow[] {
    return Array.from(this.workflows.values());
  }

  delete(id: string): boolean {
    return this.workflows.delete(id);
  }
}
