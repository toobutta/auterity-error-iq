/**
 * AI Workflow Assistant Component for n8n
 * Provides intelligent workflow analysis, optimization suggestions, and AI-powered assistance
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  SmartToy as SmartToyIcon
} from '@mui/icons-material';
import { n8nAIService, AIWorkflowAssistant, NodeSuggestion } from '../../services/n8n/n8nAIService';

interface AIWorkflowAssistantProps {
  workflowId: string;
  workflowData?: any;
  onSuggestionApply?: (suggestion: NodeSuggestion) => void;
  onOptimizationApply?: (optimization: any) => void;
  onWorkflowGenerate?: (description: string) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const AIWorkflowAssistant: React.FC<AIWorkflowAssistantProps> = ({
  workflowId,
  workflowData,
  onSuggestionApply,
  onOptimizationApply,
  onWorkflowGenerate
}) => {
  const [assistant, setAssistant] = useState<AIWorkflowAssistant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [aiHealth, setAiHealth] = useState<any>(null);
  const [generationDialog, setGenerationDialog] = useState(false);
  const [generationRequest, setGenerationRequest] = useState({
    description: '',
    complexity: 'medium' as 'simple' | 'medium' | 'complex',
    domain: ''
  });

  // Load AI assistant data
  const loadAssistant = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const assistantData = await n8nAIService.getWorkflowAssistant(workflowId);
      setAssistant(assistantData);

      // Check AI service health
      const health = await n8nAIService.getAIHealthStatus();
      setAiHealth(health);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI assistant');
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    loadAssistant();
  }, [loadAssistant]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Apply node suggestion
  const handleApplySuggestion = (suggestion: NodeSuggestion) => {
    onSuggestionApply?.(suggestion);
  };

  // Apply optimization
  const handleApplyOptimization = (optimization: any) => {
    onOptimizationApply?.(optimization);
  };

  // Generate workflow from description
  const handleGenerateWorkflow = async () => {
    if (!generationRequest.description.trim()) return;

    try {
      const generatedWorkflow = await n8nAIService.generateWorkflowFromDescription({
        description: generationRequest.description,
        complexity: generationRequest.complexity,
        domain: generationRequest.domain || undefined
      });

      onWorkflowGenerate?.(generatedWorkflow);
      setGenerationDialog(false);
      setGenerationRequest({ description: '', complexity: 'medium', domain: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to generate workflow');
    }
  };

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <SmartToyIcon color="primary" />
            <Typography variant="h6">AI Workflow Assistant</Typography>
          </Box>
          <LinearProgress sx={{ mt: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Analyzing workflow with AI...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2">{error}</Typography>
        <Button size="small" onClick={loadAssistant} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!assistant) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            No AI assistant data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <SmartToyIcon color="primary" />
            <Typography variant="h6">AI Workflow Assistant</Typography>
            {aiHealth && (
              <Chip
                size="small"
                label={aiHealth.overall ? 'AI Services Online' : 'Some AI Services Offline'}
                color={aiHealth.overall ? 'success' : 'warning'}
              />
            )}
          </Box>
          <Box>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadAssistant}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<SmartToyIcon />}
              onClick={() => setGenerationDialog(true)}
            >
              Generate Workflow
            </Button>
          </Box>
        </Box>

        {/* AI Health Status */}
        {aiHealth && !aiHealth.overall && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Some AI services are offline. Limited functionality available.
            </Typography>
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Suggestions" icon={<LightbulbIcon />} iconPosition="start" />
            <Tab label="Optimizations" icon={<TrendingUpIcon />} iconPosition="start" />
            <Tab label="Predictions" icon={<WarningIcon />} iconPosition="start" />
            <Tab label="Performance" icon={<BuildIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            AI Node Suggestions
          </Typography>
          {assistant.suggestions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No suggestions available at this time.
            </Typography>
          ) : (
            <List>
              {assistant.suggestions.map((suggestion, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <LightbulbIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} {suggestion.nodeType}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${Math.round(suggestion.confidence * 100)}%`}
                          color={getConfidenceColor(suggestion.confidence)}
                        />
                      </Box>
                    }
                    secondary={suggestion.reasoning}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleApplySuggestion(suggestion)}
                  >
                    Apply
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Workflow Optimizations
          </Typography>
          {assistant.optimizations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No optimizations available.
            </Typography>
          ) : (
            <Box>
              {assistant.optimizations.map((optimization, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <Typography variant="subtitle2">
                        {optimization.type.charAt(0).toUpperCase() + optimization.type.slice(1)} Optimization
                      </Typography>
                      <Chip
                        size="small"
                        label={optimization.impact}
                        color={getImpactColor(optimization.impact)}
                      />
                      <Chip
                        size="small"
                        label={`${Math.round(optimization.confidence * 100)}%`}
                        color={getConfidenceColor(optimization.confidence)}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" paragraph>
                      {optimization.description}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleApplyOptimization(optimization)}
                    >
                      Apply Optimization
                    </Button>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Error Predictions & Mitigations
          </Typography>
          {assistant.errorPredictions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No error predictions available.
            </Typography>
          ) : (
            <List>
              {assistant.errorPredictions.map((prediction, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          Node: {prediction.nodeId}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${Math.round(prediction.probability * 100)}%`}
                          color="warning"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="error">
                          {prediction.error}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mitigation: {prediction.mitigation}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Performance Predictions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {Math.round(assistant.performancePredictions.executionTime)}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Estimated Execution Time
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {Math.round(assistant.performancePredictions.successRate * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  ${assistant.performancePredictions.costEstimate.toFixed(4)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Estimated Cost
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </CardContent>

      {/* Workflow Generation Dialog */}
      <Dialog open={generationDialog} onClose={() => setGenerationDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToyIcon />
            Generate Workflow with AI
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Describe the workflow you want to create"
              placeholder="e.g., Create a workflow that monitors social media mentions, analyzes sentiment, and sends alerts when sentiment drops below a threshold"
              value={generationRequest.description}
              onChange={(e) => setGenerationRequest(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Complexity</InputLabel>
                  <Select
                    value={generationRequest.complexity}
                    label="Complexity"
                    onChange={(e) => setGenerationRequest(prev => ({
                      ...prev,
                      complexity: e.target.value as 'simple' | 'medium' | 'complex'
                    }))}
                  >
                    <MenuItem value="simple">Simple</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="complex">Complex</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Domain (optional)"
                  placeholder="e.g., e-commerce, healthcare, finance"
                  value={generationRequest.domain}
                  onChange={(e) => setGenerationRequest(prev => ({ ...prev, domain: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerationDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateWorkflow}
            variant="contained"
            disabled={!generationRequest.description.trim()}
            startIcon={<SmartToyIcon />}
          >
            Generate Workflow
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AIWorkflowAssistant;

