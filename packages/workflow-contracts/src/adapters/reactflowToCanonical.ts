import { Edge, Node, Workflow, WorkflowSchema } from "../index.js";

export function reactflowToCanonical(rf: Workflow): typeof WorkflowSchema._type {
  return {
    version: "1.0.0",
    id: rf.id,
    metadata: {},
    nodes: rf.nodes.map((n: Node) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      position: n.position,
      size: n.size,
      data: n.data,
      ports: n.ports,
    })),
    edges: rf.edges.map((e: Edge) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourcePort: (e as any).sourceHandle,
      targetPort: (e as any).targetHandle,
      label: e.label,
      routing: e.routing,
    })),
    viewport: rf.viewport,
  };
}
