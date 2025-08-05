import React, { useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab, TextField, Divider } from '@mui/material';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node components
const ModelNode = ({ data }: { data: any }) => {
  return (
    <Box
      sx={{
        padding: 1,
        borderRadius: 1,
        backgroundColor: '#e3f2fd',
        border: '1px solid #90caf9',
        width: 180,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
        {data.label}
      </Typography>
      <Typography variant="caption" display="block">
        Type: {data.modelType}
      </Typography>
      <Typography variant="caption" display="block">
        Parameters: {data.parameters}
      </Typography>
    </Box>
  );
};

const DatasetNode = ({ data }: { data: any }) => {
  return (
    <Box
      sx={{
        padding: 1,
        borderRadius: 1,
        backgroundColor: '#e8f5e9',
        border: '1px solid #a5d6a7',
        width: 180,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
        {data.label}
      </Typography>
      <Typography variant="caption" display="block">
        Records: {data.records}
      </Typography>
      <Typography variant="caption" display="block">
        Format: {data.format}
      </Typography>
    </Box>
  );
};

const ProcessNode = ({ data }: { data: any }) => {
  return (
    <Box
      sx={{
        padding: 1,
        borderRadius: 1,
        backgroundColor: '#fff3e0',
        border: '1px solid #ffcc80',
        width: 180,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
        {data.label}
      </Typography>
      <Typography variant="caption" display="block">
        Operation: {data.operation}
      </Typography>
      <Typography variant="caption" display="block">
        Config: {data.config}
      </Typography>
    </Box>
  );
};

const OutputNode = ({ data }: { data: any }) => {
  return (
    <Box
      sx={{
        padding: 1,
        borderRadius: 1,
        backgroundColor: '#f3e5f5',
        border: '1px solid #ce93d8',
        width: 180,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
        {data.label}
      </Typography>
      <Typography variant="caption" display="block">
        Type: {data.outputType}
      </Typography>
      <Typography variant="caption" display="block">
        Destination: {data.destination}
      </Typography>
    </Box>
  );
};

// Define node types
const nodeTypes: NodeTypes = {
  modelNode: ModelNode,
  datasetNode: DatasetNode,
  processNode: ProcessNode,
  outputNode: OutputNode,
};

// Initial nodes and edges
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'datasetNode',
    position: { x: 100, y: 100 },
    data: { label: 'Service Records Dataset', records: '10,000', format: 'JSONL' },
  },
  {
    id: '2',
    type: 'processNode',
    position: { x: 400, y: 100 },
    data: { label: 'Data Preprocessing', operation: 'Clean & Transform', config: 'Standard' },
  },
  {
    id: '3',
    type: 'modelNode',
    position: { x: 700, y: 100 },
    data: { label: 'Service Advisor Model', modelType: 'Mistral-7B', parameters: 'QLoRA' },
  },
  {
    id: '4',
    type: 'outputNode',
    position: { x: 1000, y: 100 },
    data: { label: 'Deployment Endpoint', outputType: 'API', destination: 'Production' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

export default function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [tabValue, setTabValue] = useState(0);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
    },
    []
  );

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const addNewNode = (type: string) => {
    const newNode: Node = {
      id: (nodes.length + 1).toString(),
      type: type,
      position: { x: 100, y: 200 + nodes.length * 50 },
      data: {
        label: `New ${type.replace('Node', '')}`,
        ...(type === 'modelNode' && { modelType: 'Default', parameters: 'Standard' }),
        ...(type === 'datasetNode' && { records: '0', format: 'JSONL' }),
        ...(type === 'processNode' && { operation: 'Process', config: 'Default' }),
        ...(type === 'outputNode' && { outputType: 'API', destination: 'Test' }),
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <Layout title="Workflow Builder">
      <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
        {/* Left sidebar - Components */}
        <Paper
          sx={{
            width: 250,
            p: 2,
            mr: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Components
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Drag & drop or click to add
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mb: 1, justifyContent: 'flex-start', backgroundColor: '#e3f2fd' }}
              onClick={() => addNewNode('modelNode')}
            >
              Model
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mb: 1, justifyContent: 'flex-start', backgroundColor: '#e8f5e9' }}
              onClick={() => addNewNode('datasetNode')}
            >
              Dataset
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mb: 1, justifyContent: 'flex-start', backgroundColor: '#fff3e0' }}
              onClick={() => addNewNode('processNode')}
            >
              Process
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mb: 1, justifyContent: 'flex-start', backgroundColor: '#f3e5f5' }}
              onClick={() => addNewNode('outputNode')}
            >
              Output
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Templates
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Button variant="outlined" fullWidth sx={{ mb: 1, justifyContent: 'flex-start' }}>
            Service Advisor
          </Button>
          <Button variant="outlined" fullWidth sx={{ mb: 1, justifyContent: 'flex-start' }}>
            Sales Assistant
          </Button>
          <Button variant="outlined" fullWidth sx={{ mb: 1, justifyContent: 'flex-start' }}>
            Parts Inventory
          </Button>
          <Button variant="outlined" fullWidth sx={{ mb: 1, justifyContent: 'flex-start' }}>
            Dealership Operations
          </Button>
        </Paper>

        {/* Main flow area */}
        <Box sx={{ flexGrow: 1, height: '100%', border: '1px solid #ddd', borderRadius: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background color="#f8f8f8" gap={16} />
          </ReactFlow>
        </Box>

        {/* Right sidebar - Properties */}
        <Paper
          sx={{
            width: 300,
            p: 2,
            ml: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Properties
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {selectedNode ? (
            <>
              <TextField
                label="Name"
                variant="outlined"
                size="small"
                fullWidth
                margin="normal"
                value={selectedNode.data.label}
              />

              {selectedNode.type === 'modelNode' && (
                <>
                  <TextField
                    label="Model Type"
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    value={selectedNode.data.modelType}
                  />
                  <TextField
                    label="Parameters"
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    value={selectedNode.data.parameters}
                  />
                </>
              )}

              {selectedNode.type === 'datasetNode' && (
                <>
                  <TextField
                    label="Records"
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    value={selectedNode.data.records}
                  />
                  <TextField
                    label="Format"
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    value={selectedNode.data.format}
                  />
                </>
              )}

              {selectedNode.type === 'processNode' && (
                <>
                  <TextField
                    label="Operation"
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    value={selectedNode.data.operation}
                  />
                  <TextField
                    label="Config"
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    value={selectedNode.data.config}
                  />
                </>
              )}

              {selectedNode.type === 'outputNode' && (
                <>
                  <TextField
                    label="Output Type"
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    value={selectedNode.data.outputType}
                  />
                  <TextField
                    label="Destination"
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    value={selectedNode.data.destination}
                  />
                </>
              )}

              <Box sx={{ mt: 2 }}>
                <Button variant="contained" color="primary" sx={{ mr: 1 }}>
                  Update
                </Button>
                <Button variant="outlined" color="error">
                  Delete
                </Button>
              </Box>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select a node to view and edit its properties
            </Typography>
          )}

          <Box sx={{ mt: 4 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Workflow" />
              <Tab label="YAML" />
            </Tabs>
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', mt: 1 }}>
              {tabValue === 0 ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Workflow Settings
                  </Typography>
                  <TextField
                    label="Workflow Name"
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    defaultValue="Service Advisor Workflow"
                  />
                  <TextField
                    label="Description"
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    multiline
                    rows={2}
                    defaultValue="Workflow for training and deploying a service advisor model"
                  />
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" color="primary">
                      Save Workflow
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    YAML Configuration
                  </Typography>
                  <TextField
                    variant="outlined"
                    size="small"
                    fullWidth
                    margin="normal"
                    multiline
                    rows={10}
                    defaultValue={`workflow:
  name: Service Advisor Workflow
  version: 1.0.0
  nodes:
    - id: 1
      type: dataset
      name: Service Records Dataset
      config:
        records: 10,000
        format: JSONL
    - id: 2
      type: process
      name: Data Preprocessing
      config:
        operation: Clean & Transform
        config: Standard
    - id: 3
      type: model
      name: Service Advisor Model
      config:
        modelType: Mistral-7B
        parameters: QLoRA
    - id: 4
      type: output
      name: Deployment Endpoint
      config:
        outputType: API
        destination: Production
  edges:
    - source: 1
      target: 2
    - source: 2
      target: 3
    - source: 3
      target: 4`}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" color="primary">
                      Apply YAML
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
}