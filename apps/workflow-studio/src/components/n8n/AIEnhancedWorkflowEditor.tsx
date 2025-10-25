/**
 * AI-Enhanced n8n Workflow Editor
 * Provides intelligent workflow editing with AI assistance, suggestions, and optimizations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayArrowIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import AIWorkflowAssistant from './AIWorkflowAssistant';
import { n8nAIService, NodeSuggestion } from '../../services/n8n/n8nAIService';
import { n8nApiService } from '../../services/n8n/n8nApiService';

interface AIEnhancedWorkflowEditorProps {
  workflowId?: string;
  initialWorkflow?: any;
  onSave?: (workflow: any) => void;
  onExecute?: (result: any) => void;
  readOnly?: boolean;
}

interface WorkflowCanvas {
  nodes: any[];
  connections: any[];
  viewport: { x: number; y: number; zoom: number };
}

const CanvasContainer = styled(Paper)(({ theme }) => ({
  height: 'calc(100vh - 200px)',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[50],
  border: `2px solid ${theme.palette.grey[200]}`,
}));

const NodeElement = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  minWidth: 120,
  minHeight: 60,
  padding: theme.spacing(1),
  cursor: 'move',
  border: `2px solid ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.dark,
  },
}));

const ConnectionLine = styled('svg')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  zIndex: 1,
});

const AIFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: 1000,
}));

const AIEnhancedWorkflowEditor: React.FC<AIEnhancedWorkflowEditorProps> = ({
  workflowId = 'new-workflow',
  initialWorkflow,
  onSave,
  onExecute,
  readOnly = false
}) => {
  const [workflow, setWorkflow] = useState<WorkflowCanvas>({
    nodes: initialWorkflow?.nodes || [],
    connections: initialWorkflow?.connections || [],
    viewport: { x: 0, y: 0, zoom: 1 }
  });

  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiAssistant, setAiAssistant] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<any>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load AI assistant
  const loadAIAssistant = useCallback(async () => {
    try {
      const assistant = await n8nAIService.getWorkflowAssistant(workflowId);
      setAiAssistant(assistant);
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to load AI assistant', 'error');
    }
  }, [workflowId]);

  useEffect(() => {
    loadAIAssistant();
  }, [loadAIAssistant]);

  // Show snackbar notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle node selection
  const handleNodeClick = (node: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNode(node);
  };

  // Handle canvas click (deselect)
  const handleCanvasClick = () => {
    setSelectedNode(null);
  };

  // Handle drag start
  const handleDragStart = (node: any, event: React.MouseEvent) => {
    if (readOnly) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    setDragging(node);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  // Handle drag
  const handleDrag = useCallback((event: MouseEvent) => {
    if (!dragging || readOnly) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const x = (event.clientX - canvasRect.left - dragOffset.x) / workflow.viewport.zoom;
    const y = (event.clientY - canvasRect.top - dragOffset.y) / workflow.viewport.zoom;

    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === dragging.id
          ? { ...node, position: [x, y] }
          : node
      )
    }));
  }, [dragging, dragOffset, workflow.viewport.zoom, readOnly]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  // Add event listeners for drag
  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dragging, handleDrag, handleDragEnd]);

  // Apply AI suggestion
  const handleApplySuggestion = (suggestion: NodeSuggestion) => {
    if (readOnly) return;

    const newNode = {
      id: `${suggestion.nodeType}_${Date.now()}`,
      type: suggestion.nodeType,
      position: [suggestion.position.x, suggestion.position.y],
      data: suggestion.configuration,
      label: suggestion.nodeType.replace(/n8n-nodes-base\./, ''),
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));

    showSnackbar(`Added ${suggestion.nodeType} node`, 'success');
    setAiDrawerOpen(false);
  };

  // Apply optimization
  const handleApplyOptimization = (optimization: any) => {
    if (readOnly) return;

    // Apply the suggested changes
    if (optimization.suggestedChanges) {
      setWorkflow(prev => ({
        ...prev,
        nodes: prev.nodes.map(node => ({
          ...node,
          data: { ...node.data, ...optimization.suggestedChanges }
        }))
      }));
    }

    showSnackbar(`Applied ${optimization.type} optimization`, 'success');
  };

  // Generate workflow from description
  const handleWorkflowGenerate = (generatedWorkflow: any) => {
    setWorkflow({
      nodes: generatedWorkflow.nodes || [],
      connections: generatedWorkflow.connections || {},
      viewport: workflow.viewport
    });

    showSnackbar('Workflow generated successfully!', 'success');
  };

  // Save workflow
  const handleSave = async () => {
    try {
      const workflowData = {
        id: workflowId,
        name: `AI-Enhanced Workflow ${workflowId}`,
        nodes: workflow.nodes,
        connections: workflow.connections,
        meta: {
          aiEnhanced: true,
          lastModified: new Date().toISOString()
        }
      };

      if (onSave) {
        onSave(workflowData);
      } else {
        // Default save logic (would integrate with n8n API)
        console.log('Saving workflow:', workflowData);
      }

      showSnackbar('Workflow saved successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Failed to save workflow', 'error');
    }
  };

  // Execute workflow
  const handleExecute = async () => {
    if (executing) return;

    setExecuting(true);
    try {
      const result = await n8nAIService.executeWorkflowWithAI({
        workflowId,
        parameters: {
          nodes: workflow.nodes,
          connections: workflow.connections
        }
      });

      if (onExecute) {
        onExecute(result);
      }

      showSnackbar('Workflow executed successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Workflow execution failed', 'error');
    } finally {
      setExecuting(false);
    }
  };

  // Render connection lines
  const renderConnections = () => {
    if (!workflow.connections || Object.keys(workflow.connections).length === 0) {
      return null;
    }

    return (
      <ConnectionLine>
        {Object.entries(workflow.connections).map(([sourceId, connections]) => {
          const sourceNode = workflow.nodes.find(n => n.id === sourceId);
          if (!sourceNode) return null;

          return connections.main?.map((connection: any, index: number) => {
            const targetNode = workflow.nodes.find(n => n.id === connection.node);
            if (!targetNode) return null;

            const sourceX = sourceNode.position[0] + 60; // Half width
            const sourceY = sourceNode.position[1] + 30; // Half height
            const targetX = targetNode.position[0] + 60;
            const targetY = targetNode.position[1] + 30;

            return (
              <line
                key={`${sourceId}-${connection.node}-${index}`}
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
                stroke="#1976d2"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          });
        })}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#1976d2" />
          </marker>
        </defs>
      </ConnectionLine>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <PsychologyIcon color="primary" />
            <Typography variant="h5">AI-Enhanced Workflow Editor</Typography>
            {aiAssistant && (
              <Chip
                size="small"
                label={`${aiAssistant.suggestions.length} AI suggestions`}
                color="primary"
                icon={<LightbulbIcon />}
              />
            )}
          </Box>

          <Box display="flex" gap={1}>
            {!readOnly && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button
                  variant="contained"
                  startIcon={executing ? <CircularProgress size={16} /> : <PlayArrowIcon />}
                  onClick={handleExecute}
                  disabled={executing}
                >
                  {executing ? 'Executing...' : 'Execute'}
                </Button>
              </>
            )}

            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={() => setAiDrawerOpen(true)}
            >
              AI Assistant
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Grid container sx={{ flex: 1 }}>
        {/* Canvas */}
        <Grid item xs={aiDrawerOpen ? 8 : 12}>
          <CanvasContainer ref={canvasRef} onClick={handleCanvasClick}>
            {renderConnections()}

            {workflow.nodes.map((node) => (
              <NodeElement
                key={node.id}
                sx={{
                  left: node.position[0],
                  top: node.position[1],
                  transform: `scale(${workflow.viewport.zoom})`,
                  transformOrigin: 'top left',
                  zIndex: selectedNode?.id === node.id ? 10 : 5,
                  borderColor: selectedNode?.id === node.id ? 'primary.main' : 'primary.light'
                }}
                onClick={(e) => handleNodeClick(node, e)}
                onMouseDown={(e) => handleDragStart(node, e)}
              >
                <Typography variant="subtitle2" noWrap>
                  {node.label || node.type.replace(/n8n-nodes-base\./, '')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {node.type}
                </Typography>
              </NodeElement>
            ))}

            {workflow.nodes.length === 0 && (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
              >
                <SmartToyIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Empty Workflow
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Use the AI Assistant to generate a workflow or add nodes manually
                </Typography>
              </Box>
            )}
          </CanvasContainer>
        </Grid>

        {/* AI Assistant Drawer */}
        <Grid item xs={4}>
          <Drawer
            anchor="right"
            open={aiDrawerOpen}
            onClose={() => setAiDrawerOpen(false)}
            variant="persistent"
            sx={{
              width: aiDrawerOpen ? 400 : 0,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: 400,
                boxSizing: 'border-box',
              },
            }}
          >
            <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">AI Workflow Assistant</Typography>
                <IconButton onClick={() => setAiDrawerOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <AIWorkflowAssistant
                workflowId={workflowId}
                workflowData={workflow}
                onSuggestionApply={handleApplySuggestion}
                onOptimizationApply={handleApplyOptimization}
                onWorkflowGenerate={handleWorkflowGenerate}
              />
            </Box>
          </Drawer>
        </Grid>
      </Grid>

      {/* AI Assistant FAB */}
      {!aiDrawerOpen && (
        <AIFab
          color="primary"
          onClick={() => setAiDrawerOpen(true)}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            }
          }}
        >
          <SmartToyIcon />
        </AIFab>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AIEnhancedWorkflowEditor;

