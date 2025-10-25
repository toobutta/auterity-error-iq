// Small, medium, large workflow fixtures for round-trip tests

export const smallWorkflow = {
  id: "wf-small",
  version: "1.0.0",
  nodes: [
    { id: "n1", type: "start", position: { x: 0, y: 0 }, label: "Start" }
  ],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 }
};

export const mediumWorkflow = {
  id: "wf-medium",
  version: "1.0.0",
  nodes: [
    { id: "n1", type: "start", position: { x: 0, y: 0 }, label: "Start" },
    { id: "n2", type: "process", position: { x: 100, y: 100 }, label: "Process" }
  ],
  edges: [
    { id: "e1", source: "n1", target: "n2", sourceHandle: "out", targetHandle: "in", label: "to process" }
  ],
  viewport: { x: 50, y: 50, zoom: 1.2 }
};

export const largeWorkflow = {
  id: "wf-large",
  version: "1.0.0",
  nodes: Array.from({ length: 20 }, (_, i) => ({
    id: `n${i+1}`,
    type: "node",
    position: { x: i * 50, y: i * 30 },
    label: `Node ${i+1}`
  })),
  edges: Array.from({ length: 19 }, (_, i) => ({
    id: `e${i+1}`,
    source: `n${i+1}`,
    target: `n${i+2}`,
    sourceHandle: "out",
    targetHandle: "in",
    label: `Edge ${i+1}`
  })),
  viewport: { x: 100, y: 100, zoom: 0.8 }
};
