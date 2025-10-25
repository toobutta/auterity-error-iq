// Sample ReactFlow data for testing
export const sampleReactFlow = {
  id: "test-workflow-rf",
  name: "Test Workflow",
  nodes: [
    {
      id: "node-1",
      type: "input",
      position: { x: 100, y: 100 },
      data: { label: "Start Node" }
    },
    {
      id: "node-2", 
      type: "default",
      position: { x: 300, y: 200 },
      data: { label: "Process Node" }
    }
  ],
  edges: [
    {
      id: "edge-1",
      source: "node-1",
      target: "node-2",
      sourceHandle: "output",
      targetHandle: "input",
      label: "Flow 1"
    }
  ],
  viewport: { x: 0, y: 0, zoom: 1 }
};

// Sample canonical workflow for testing
export const sampleCanonical = {
  version: "1.0.0",
  id: "test-workflow-canonical",
  metadata: { name: "Test Canonical Workflow" },
  nodes: [
    {
      id: "node-1",
      type: "input",
      position: { x: 100, y: 100 },
      label: "Start Node",
      data: { custom: "data" }
    },
    {
      id: "node-2",
      type: "process",
      position: { x: 300, y: 200 },
      label: "Process Node"
    }
  ],
  edges: [
    {
      id: "edge-1",
      source: "node-1",
      target: "node-2",
      sourcePort: "output",
      targetPort: "input",
      label: "Flow 1"
    }
  ],
  viewport: { x: 0, y: 0, zoom: 1 }
};
