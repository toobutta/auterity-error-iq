import { Workflow, WorkflowSchema } from "../index.js";

export function canonicalToReactflow(c: typeof WorkflowSchema._type): Workflow {
  return {
    version: c.version,
    id: c.id,
    nodes: c.nodes.map((n: any) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      position: n.position,
      size: n.size,
      data: n.data,
      ports: n.ports,
    })),
    edges: c.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourcePort,
      targetHandle: e.targetPort,
      label: e.label,
      routing: e.routing,
    })),
    viewport: c.viewport,
    metadata: c.metadata,
  };
}
