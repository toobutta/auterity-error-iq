import { useState } from 'react';
import { WorkflowSchema } from '@auterity/workflow-contracts';
import { getCanonical } from '../services/api.js';

export function useCanonical() {
  const [workflow, setWorkflow] = useState<any|null>(null);
  const [etag, setEtag] = useState<string|undefined>(undefined);

  async function load(id: string) {
    const { json, etag } = await getCanonical(id);
    const parsed = WorkflowSchema.safeParse(json);
    if (!parsed.success) {
      throw parsed.error;
    }
    setWorkflow(parsed.data);
    setEtag(etag);
  }

  return { workflow, etag, load, setWorkflow };
}
