import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  removeElements,
  isEdge
} from 'react-flow-renderer';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  IconButton,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Dataset as DatasetIcon,
  Model as ModelIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';
import yaml from 'js-yaml';
import MonacoEditor from 'react-monaco-editor';

// Custom node types
const nodeTypes = {
  datasetNode: DatasetNode,
  modelNode: ModelNode,
  trainingNode: TrainingNode,
  evaluationNode: EvaluationNode,
  deploymentNode: DeploymentNode
};

// Custom node components
function DatasetNode({ data }) {
  return (
    <Paper className="node dataset-node" elevation={3}>
      <Box className="node-header">
        <DatasetIcon />
        <Typography variant="subtitle1">Dataset</Typography>
      </Box>
      <Box className="node-content">
        <Typography variant="body2">{data.label}</Typography>
        <Typography variant="caption">{data.records} records</Typography>
      </Box>
    </Paper>
  );
}

function ModelNode({ data }) {
  return (
    <Paper className="node model-node" elevation={3}>
      <Box className="node-header">
        <ModelIcon />
        <Typography variant="subtitle1">Model</Typography>
      </Box>
      <Box className="node-content">
        <Typography variant="body2">{data.label}</Typography>
        <Typography variant="caption">{data.type}</Typography>
      </Box>
    </Paper>
  );
}

function TrainingNode({ data }) {
  return (
    <Paper className="node training-node" elevation={3}>
      <Box className="node-header">
        <SettingsIcon />
        <Typography variant="subtitle1">Training</Typography>
      </Box>
      <Box className="node-content">
        <Typography variant="body2">{data.method}</Typography>
        <Box className="node-params">
          <Chip label={`Epochs: ${data.epochs}`} size="small" />
          <Chip label={`LR: ${data.learningRate}`} size="small" />
        </Box>
      </Box>
    </Paper>
  );
}

function EvaluationNode({ data }) {
  return (
    <Paper className="node evaluation-node" elevation={3}>
      <Box className="node-header">
        <SpeedIcon />
        <Typography variant="subtitle1">Evaluation</Typography>
      </Box>
      <Box className="node-content">
        <Typography variant="body2">Metrics: {data.metrics.join(', ')}</Typography>
      </Box>
    </Paper>
  );
}

function DeploymentNode({ data }) {
  return (
    <Paper className="node deployment-node" elevation={3}>
      <Box className="node-header">
        <CloudUploadIcon />
        <Typography variant="subtitle1">Deployment</Typography>
      </Box>
      <Box className="node-content">
        <Typography variant="body2">{data.endpoint}</Typography>
        <Typography variant="caption">{data.quantization}</Typography>
      </Box>
    </Paper>
  );
}

// Main Workflow Builder Component
function WorkflowBuilder() {
  // State for flow elements (nodes and edges)
  const [elements, setElements] = useState([]);
  
  // State for sidebar drawer
  const [drawerOpen, setDrawerOpen] = useState(true);
  
  // State for node configuration panel
  const [selectedNode, setSelectedNode] = useState(null);
  
  // State for YAML editor
  const [yamlContent, setYamlContent] = useState('');
  const [yamlError, setYamlError] = useState(null);
  
  // State for tabs
  const [activeTab, setActiveTab] = useState(0);
  
  // State for templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // State for notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Reference to the flow instance
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // Load templates on component mount
  useEffect(() => {
    // In a real implementation, fetch templates from API
    const mockTemplates = [
      {
        id: 'fine-tuning',
        name: 'Fine-Tuning Workflow',
        description: 'Standard fine-tuning workflow with QLoRA',
        category: 'training',
        elements: [
          {
            id: 'dataset-1',
            type: 'datasetNode',
            position: { x: 100, y: 100 },
            data: { label: 'Training Dataset', records: 10000 }
          },
          {
            id: 'model-1',
            type: 'modelNode',
            position: { x: 100, y: 250 },
            data: { label: 'Mistral-7B', type: 'Base Model' }
          },
          {
            id: 'training-1',
            type: 'trainingNode',
            position: { x: 350, y: 175 },
            data: { method: 'QLoRA', epochs: 3, learningRate: '2e-4' }
          },
          {
            id: 'evaluation-1',
            type: 'evaluationNode',
            position: { x: 600, y: 175 },
            data: { metrics: ['accuracy', 'f1'] }
          },
          {
            id: 'deployment-1',
            type: 'deploymentNode',
            position: { x: 850, y: 175 },
            data: { endpoint: 'vLLM', quantization: 'int8' }
          },
          {
            id: 'dataset-1-to-training-1',
            source: 'dataset-1',
            target: 'training-1',
            animated: true
          },
          {
            id: 'model-1-to-training-1',
            source: 'model-1',
            target: 'training-1',
            animated: true
          },
          {
            id: 'training-1-to-evaluation-1',
            source: 'training-1',
            target: 'evaluation-1',
            animated: true
          },
          {
            id: 'evaluation-1-to-deployment-1',
            source: 'evaluation-1',
            target: 'deployment-1',
            animated: true
          }
        ]
      },
      {
        id: 'automotive',
        name: 'Automotive Industry Kit',
        description: 'Specialized workflow for automotive applications',
        category: 'vertical-kits',
        elements: [
          {
            id: 'dataset-1',
            type: 'datasetNode',
            position: { x: 100, y: 100 },
            data: { label: 'Dealership QA', records: 5000 }
          },
          {
            id: 'model-1',
            type: 'modelNode',
            position: { x: 100, y: 250 },
            data: { label: 'Mistral-7B', type: 'Base Model' }
          },
          {
            id: 'training-1',
            type: 'trainingNode',
            position: { x: 350, y: 175 },
            data: { method: 'QLoRA', epochs: 3, learningRate: '2e-4' }
          },
          {
            id: 'evaluation-1',
            type: 'evaluationNode',
            position: { x: 600, y: 175 },
            data: { metrics: ['accuracy', 'f1'] }
          },
          {
            id: 'deployment-1',
            type: 'deploymentNode',
            position: { x: 850, y: 175 },
            data: { endpoint: 'vLLM', quantization: 'int8' }
          },
          {
            id: 'dataset-1-to-training-1',
            source: 'dataset-1',
            target: 'training-1',
            animated: true
          },
          {
            id: 'model-1-to-training-1',
            source: 'model-1',
            target: 'training-1',
            animated: true
          },
          {
            id: 'training-1-to-evaluation-1',
            source: 'training-1',
            target: 'evaluation-1',
            animated: true
          },
          {
            id: 'evaluation-1-to-deployment-1',
            source: 'evaluation-1',
            target: 'deployment-1',
            animated: true
          }
        ]
      }
    ];
    
    setTemplates(mockTemplates);
  }, []);
  
  // Handle node selection
  const onElementClick = (event, element) => {
    if (!isEdge(element)) {
      setSelectedNode(element);
    }
  };
  
  // Handle node drag
  const onNodeDragStop = (event, node) => {
    // Update node position in state
    const updatedElements = elements.map(el => {
      if (el.id === node.id) {
        return { ...el, position: node.position };
      }
      return el;
    });
    setElements(updatedElements);
  };
  
  // Handle connection between nodes
  const onConnect = (params) => {
    setElements(els => addEdge({ ...params, animated: true }, els));
  };
  
  // Handle element removal
  const onElementsRemove = (elementsToRemove) => {
    setElements(els => removeElements(elementsToRemove, els));
  };
  
  // Handle drag over for new node creation
  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };
  
  // Handle drop for new node creation
  const onDrop = (event) => {
    event.preventDefault();
    
    if (!reactFlowInstance) return;
    
    const nodeType = event.dataTransfer.getData('application/reactflow/type');
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });
    
    // Create new node based on type
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: `${nodeType}Node`,
      position,
      data: getDefaultDataForNodeType(nodeType)
    };
    
    setElements(els => els.concat(newNode));
  };
  
  // Get default data for new nodes
  const getDefaultDataForNodeType = (type) => {
    switch (type) {
      case 'dataset':
        return { label: 'New Dataset', records: 0 };
      case 'model':
        return { label: 'New Model', type: 'Base Model' };
      case 'training':
        return { method: 'QLoRA', epochs: 3, learningRate: '2e-4' };
      case 'evaluation':
        return { metrics: ['accuracy'] };
      case 'deployment':
        return { endpoint: 'vLLM', quantization: 'none' };
      default:
        return {};
    }
  };
  
  // Update node data
  const updateNodeData = (data) => {
    if (!selectedNode) return;
    
    const updatedElements = elements.map(el => {
      if (el.id === selectedNode.id) {
        return { ...el, data: { ...el.data, ...data } };
      }
      return el;
    });
    
    setElements(updatedElements);
  };
  
  // Generate YAML from workflow
  const generateYaml = () => {
    try {
      // Extract nodes by type
      const datasetNodes = elements.filter(el => el.type === 'datasetNode');
      const modelNodes = elements.filter(el => el.type === 'modelNode');
      const trainingNodes = elements.filter(el => el.type === 'trainingNode');
      const evaluationNodes = elements.filter(el => el.type === 'evaluationNode');
      const deploymentNodes = elements.filter(el => el.type === 'deploymentNode');
      
      // Build YAML structure
      const yamlObj = {
        task: 'fine-tune',
        model: modelNodes.length > 0 ? modelNodes[0].data.label : '',
        method: trainingNodes.length > 0 ? trainingNodes[0].data.method : 'QLoRA',
        dataset: datasetNodes.length > 0 ? datasetNodes[0].data.label : '',
        parameters: {
          epochs: trainingNodes.length > 0 ? trainingNodes[0].data.epochs : 3,
          learning_rate: trainingNodes.length > 0 ? trainingNodes[0].data.learningRate : '2e-4',
        },
        evaluation: {
          metrics: evaluationNodes.length > 0 ? evaluationNodes[0].data.metrics : ['accuracy'],
        },
        deployment: {
          endpoint_type: deploymentNodes.length > 0 ? deploymentNodes[0].data.endpoint : 'vLLM',
          quantization: deploymentNodes.length > 0 ? deploymentNodes[0].data.quantization : 'none',
        }
      };
      
      // Convert to YAML
      const yamlString = yaml.dump(yamlObj);
      setYamlContent(yamlString);
      setYamlError(null);
      
      // Switch to YAML tab
      setActiveTab(1);
      
      return yamlString;
    } catch (error) {
      console.error('Error generating YAML:', error);
      setYamlError(error.message);
      return null;
    }
  };
  
  // Parse YAML to workflow
  const parseYaml = (yamlString) => {
    try {
      const yamlObj = yaml.load(yamlString);
      
      // Create nodes from YAML
      const nodes = [];
      let position = { x: 100, y: 100 };
      
      // Dataset node
      if (yamlObj.dataset) {
        nodes.push({
          id: 'dataset-1',
          type: 'datasetNode',
          position: { ...position },
          data: { label: yamlObj.dataset, records: 0 }
        });
        position.y += 150;
      }
      
      // Model node
      if (yamlObj.model) {
        nodes.push({
          id: 'model-1',
          type: 'modelNode',
          position: { ...position },
          data: { label: yamlObj.model, type: 'Base Model' }
        });
        position = { x: 350, y: 175 };
      }
      
      // Training node
      if (yamlObj.method) {
        nodes.push({
          id: 'training-1',
          type: 'trainingNode',
          position: { ...position },
          data: { 
            method: yamlObj.method, 
            epochs: yamlObj.parameters?.epochs || 3, 
            learningRate: yamlObj.parameters?.learning_rate || '2e-4' 
          }
        });
        position.x += 250;
      }
      
      // Evaluation node
      if (yamlObj.evaluation?.metrics) {
        nodes.push({
          id: 'evaluation-1',
          type: 'evaluationNode',
          position: { ...position },
          data: { metrics: yamlObj.evaluation.metrics }
        });
        position.x += 250;
      }
      
      // Deployment node
      if (yamlObj.deployment?.endpoint_type) {
        nodes.push({
          id: 'deployment-1',
          type: 'deploymentNode',
          position: { ...position },
          data: { 
            endpoint: yamlObj.deployment.endpoint_type, 
            quantization: yamlObj.deployment.quantization || 'none' 
          }
        });
      }
      
      // Create edges
      const edges = [];
      if (nodes.length > 1) {
        for (let i = 0; i < nodes.length - 1; i++) {
          if (nodes[i].id === 'dataset-1' && nodes[i+1].id !== 'training-1') {
            continue;
          }
          if (nodes[i].id === 'model-1' && nodes[i+1].id !== 'training-1') {
            continue;
          }
          
          edges.push({
            id: `${nodes[i].id}-to-${nodes[i+1].id}`,
            source: nodes[i].id,
            target: nodes[i+1].id,
            animated: true
          });
        }
        
        // Special case for dataset and model to training
        const datasetNode = nodes.find(n => n.id === 'dataset-1');
        const modelNode = nodes.find(n => n.id === 'model-1');
        const trainingNode = nodes.find(n => n.id === 'training-1');
        
        if (datasetNode && trainingNode) {
          edges.push({
            id: 'dataset-1-to-training-1',
            source: 'dataset-1',
            target: 'training-1',
            animated: true
          });
        }
        
        if (modelNode && trainingNode) {
          edges.push({
            id: 'model-1-to-training-1',
            source: 'model-1',
            target: 'training-1',
            animated: true
          });
        }
      }
      
      // Set elements
      setElements([...nodes, ...edges]);
      setYamlError(null);
      
      // Switch to Flow tab
      setActiveTab(0);
      
      setNotification({
        open: true,
        message: 'YAML successfully parsed to workflow',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error parsing YAML:', error);
      setYamlError(error.message);
      
      setNotification({
        open: true,
        message: `Error parsing YAML: ${error.message}`,
        severity: 'error'
      });
    }
  };
  
  // Apply template
  const applyTemplate = (template) => {
    setElements(template.elements);
    setSelectedTemplate(template);
    
    setNotification({
      open: true,
      message: `Applied template: ${template.name}`,
      severity: 'success'
    });
  };
  
  // Save workflow
  const saveWorkflow = () => {
    const yaml = generateYaml();
    if (!yaml) return;
    
    // In a real implementation, save to backend
    console.log('Saving workflow:', yaml);
    
    setNotification({
      open: true,
      message: 'Workflow saved successfully',
      severity: 'success'
    });
  };
  
  // Launch workflow
  const launchWorkflow = () => {
    const yaml = generateYaml();
    if (!yaml) return;
    
    // In a real implementation, send to backend for execution
    console.log('Launching workflow:', yaml);
    
    setNotification({
      open: true,
      message: 'Workflow launched successfully',
      severity: 'success'
    });
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Render node configuration panel based on selected node type
  const renderNodeConfig = () => {
    if (!selectedNode) return null;
    
    const nodeData = selectedNode.data;
    
    switch (selectedNode.type) {
      case 'datasetNode':
        return (
          <Box className="node-config">
            <Typography variant="h6">Dataset Configuration</Typography>
            <TextField
              label="Dataset Name"
              value={nodeData.label}
              onChange={(e) => updateNodeData({ label: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Record Count"
              type="number"
              value={nodeData.records}
              onChange={(e) => updateNodeData({ records: parseInt(e.target.value) })}
              fullWidth
              margin="normal"
            />
          </Box>
        );
        
      case 'modelNode':
        return (
          <Box className="node-config">
            <Typography variant="h6">Model Configuration</Typography>
            <TextField
              label="Model Name"
              value={nodeData.label}
              onChange={(e) => updateNodeData({ label: e.target.value })}
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Model Type</InputLabel>
              <Select
                value={nodeData.type}
                onChange={(e) => updateNodeData({ type: e.target.value })}
              >
                <MenuItem value="Base Model">Base Model</MenuItem>
                <MenuItem value="Fine-tuned Model">Fine-tuned Model</MenuItem>
                <MenuItem value="Custom Model">Custom Model</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
        
      case 'trainingNode':
        return (
          <Box className="node-config">
            <Typography variant="h6">Training Configuration</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Method</InputLabel>
              <Select
                value={nodeData.method}
                onChange={(e) => updateNodeData({ method: e.target.value })}
              >
                <MenuItem value="QLoRA">QLoRA</MenuItem>
                <MenuItem value="LoRA">LoRA</MenuItem>
                <MenuItem value="full-finetune">Full Fine-tuning</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Epochs"
              type="number"
              value={nodeData.epochs}
              onChange={(e) => updateNodeData({ epochs: parseInt(e.target.value) })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Learning Rate"
              value={nodeData.learningRate}
              onChange={(e) => updateNodeData({ learningRate: e.target.value })}
              fullWidth
              margin="normal"
            />
          </Box>
        );
        
      case 'evaluationNode':
        return (
          <Box className="node-config">
            <Typography variant="h6">Evaluation Configuration</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Metrics</InputLabel>
              <Select
                multiple
                value={nodeData.metrics}
                onChange={(e) => updateNodeData({ metrics: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="accuracy">Accuracy</MenuItem>
                <MenuItem value="f1">F1 Score</MenuItem>
                <MenuItem value="precision">Precision</MenuItem>
                <MenuItem value="recall">Recall</MenuItem>
                <MenuItem value="rouge">ROUGE</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
        
      case 'deploymentNode':
        return (
          <Box className="node-config">
            <Typography variant="h6">Deployment Configuration</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Endpoint Type</InputLabel>
              <Select
                value={nodeData.endpoint}
                onChange={(e) => updateNodeData({ endpoint: e.target.value })}
              >
                <MenuItem value="vLLM">vLLM</MenuItem>
                <MenuItem value="Triton">Triton</MenuItem>
                <MenuItem value="TensorRT">TensorRT</MenuItem>
                <MenuItem value="ONNX">ONNX</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Quantization</InputLabel>
              <Select
                value={nodeData.quantization}
                onChange={(e) => updateNodeData({ quantization: e.target.value })}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="int8">INT8</MenuItem>
                <MenuItem value="int4">INT4</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Box className="workflow-builder">
      <Box className="workflow-header">
        <Typography variant="h5">Workflow Builder</Typography>
        <Box className="workflow-actions">
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveWorkflow}
          >
            Save
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={launchWorkflow}
          >
            Launch
          </Button>
        </Box>
      </Box>
      
      <Box className="workflow-content">
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          className="workflow-drawer"
        >
          <Box className="drawer-header">
            <Typography variant="h6">Components</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          
          <Typography variant="subtitle1" className="drawer-section-title">
            Node Types
          </Typography>
          <List>
            <ListItem
              button
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow/type', 'dataset');
              }}
            >
              <ListItemIcon>
                <DatasetIcon />
              </ListItemIcon>
              <ListItemText primary="Dataset" />
            </ListItem>
            <ListItem
              button
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow/type', 'model');
              }}
            >
              <ListItemIcon>
                <ModelIcon />
              </ListItemIcon>
              <ListItemText primary="Model" />
            </ListItem>
            <ListItem
              button
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow/type', 'training');
              }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Training" />
            </ListItem>
            <ListItem
              button
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow/type', 'evaluation');
              }}
            >
              <ListItemIcon>
                <SpeedIcon />
              </ListItemIcon>
              <ListItemText primary="Evaluation" />
            </ListItem>
            <ListItem
              button
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow/type', 'deployment');
              }}
            >
              <ListItemIcon>
                <CloudUploadIcon />
              </ListItemIcon>
              <ListItemText primary="Deployment" />
            </ListItem>
          </List>
          
          <Divider />
          
          <Typography variant="subtitle1" className="drawer-section-title">
            Templates
          </Typography>
          <List>
            {templates.map(template => (
              <ListItem
                button
                key={template.id}
                onClick={() => applyTemplate(template)}
                selected={selectedTemplate?.id === template.id}
              >
                <ListItemIcon>
                  {template.category === 'training' ? <SettingsIcon /> : <StorageIcon />}
                </ListItemIcon>
                <ListItemText 
                  primary={template.name} 
                  secondary={template.description}
                />
              </ListItem>
            ))}
          </List>
        </Drawer>
        
        <Box className="workflow-main">
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            className="workflow-tabs"
          >
            <Tab label="Flow" icon={<MemoryIcon />} />
            <Tab label="YAML" icon={<CodeIcon />} />
          </Tabs>
          
          <Box className="tab-content">
            {activeTab === 0 && (
              <Box className="flow-container">
                <div className="reactflow-wrapper" ref={reactFlowWrapper}>
                  <ReactFlowProvider>
                    <ReactFlow
                      elements={elements}
                      nodeTypes={nodeTypes}
                      onElementClick={onElementClick}
                      onElementsRemove={onElementsRemove}
                      onConnect={onConnect}
                      onNodeDragStop={onNodeDragStop}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onLoad={setReactFlowInstance}
                      snapToGrid={true}
                      snapGrid={[15, 15]}
                    >
                      <Controls />
                      <MiniMap
                        nodeStrokeColor={(n) => {
                          if (n.type === 'datasetNode') return '#0041d0';
                          if (n.type === 'modelNode') return '#ff0072';
                          if (n.type === 'trainingNode') return '#1a192b';
                          if (n.type === 'evaluationNode') return '#00a400';
                          return '#eee';
                        }}
                        nodeColor={(n) => {
                          if (n.type === 'datasetNode') return '#d0e1ff';
                          if (n.type === 'modelNode') return '#ffcce3';
                          if (n.type === 'trainingNode') return '#e6e6e9';
                          if (n.type === 'evaluationNode') return '#c3e6cb';
                          return '#fff';
                        }}
                      />
                      <Background color="#aaa" gap={16} />
                    </ReactFlow>
                  </ReactFlowProvider>
                </div>
              </Box>
            )}
            
            {activeTab === 1 && (
              <Box className="yaml-container">
                <Box className="yaml-actions">
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={generateYaml}
                  >
                    Generate YAML
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckIcon />}
                    onClick={() => parseYaml(yamlContent)}
                  >
                    Apply YAML
                  </Button>
                </Box>
                {yamlError && (
                  <Alert severity="error" className="yaml-error">
                    {yamlError}
                  </Alert>
                )}
                <MonacoEditor
                  width="100%"
                  height="600px"
                  language="yaml"
                  theme="vs-dark"
                  value={yamlContent}
                  onChange={setYamlContent}
                  options={{
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    automaticLayout: true,
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
        
        <Drawer
          variant="persistent"
          anchor="right"
          open={!!selectedNode}
          className="config-drawer"
        >
          <Box className="drawer-header">
            <Typography variant="h6">Node Configuration</Typography>
            <IconButton onClick={() => setSelectedNode(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          
          {renderNodeConfig()}
          
          {selectedNode && (
            <Box className="drawer-actions">
              <Button
                variant="contained"
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  onElementsRemove([selectedNode]);
                  setSelectedNode(null);
                }}
              >
                Delete Node
              </Button>
            </Box>
          )}
        </Drawer>
      </Box>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default WorkflowBuilder;