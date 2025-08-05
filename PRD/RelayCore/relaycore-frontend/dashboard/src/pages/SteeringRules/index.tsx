import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Chip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Refresh as RefreshIcon,
  PlayArrow as TestIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useApi } from '../../hooks/useApi';
import { SteeringRule, SteeringRuleSet } from './types';
import RuleEditor from './RuleEditor';
import TestRuleDialog from './TestRuleDialog';

const SteeringRules: React.FC = () => {
  const [ruleSet, setRuleSet] = useState<SteeringRuleSet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<SteeringRule | null>(null);
  const [isNewRule, setIsNewRule] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [testDialogOpen, setTestDialogOpen] = useState<boolean>(false);
  const [testingRule, setTestingRule] = useState<SteeringRule | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const api = useApi();

  // Fetch rules on component mount
  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/steering');
      setRuleSet(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching steering rules:', err);
      setError('Failed to load steering rules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    const newRule: SteeringRule = {
      id: '',
      name: 'New Rule',
      description: '',
      priority: ruleSet?.rules.length ? Math.max(...ruleSet.rules.map(r => r.priority)) + 10 : 10,
      enabled: true,
      conditions: [
        {
          field: 'request.body.prompt',
          operator: 'contains',
          value: ''
        }
      ],
      operator: 'and',
      actions: [
        {
          type: 'route',
          params: {
            provider: 'openai',
            model: 'gpt-3.5-turbo'
          }
        }
      ],
      continue: true,
      tags: []
    };

    setEditingRule(newRule);
    setIsNewRule(true);
    setDialogOpen(true);
  };

  const handleEditRule = (rule: SteeringRule) => {
    setEditingRule({ ...rule });
    setIsNewRule(false);
    setDialogOpen(true);
  };

  const handleTestRule = (rule: SteeringRule) => {
    setTestingRule({ ...rule });
    setTestDialogOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await api.delete(`/admin/steering/${ruleId}`);
      showSnackbar('Rule deleted successfully', 'success');
      fetchRules();
    } catch (err) {
      console.error('Error deleting rule:', err);
      showSnackbar('Failed to delete rule', 'error');
    }
  };

  const handleToggleRule = async (rule: SteeringRule) => {
    try {
      const updatedRule = { ...rule, enabled: !rule.enabled };
      await api.put(`/admin/steering/${rule.id}`, updatedRule);
      showSnackbar(`Rule ${updatedRule.enabled ? 'enabled' : 'disabled'} successfully`, 'success');
      fetchRules();
    } catch (err) {
      console.error('Error toggling rule:', err);
      showSnackbar('Failed to update rule', 'error');
    }
  };

  const handleSaveRule = async (rule: SteeringRule) => {
    try {
      if (isNewRule) {
        await api.post('/admin/steering', rule);
        showSnackbar('Rule created successfully', 'success');
      } else {
        await api.put(`/admin/steering/${rule.id}`, rule);
        showSnackbar('Rule updated successfully', 'success');
      }
      setDialogOpen(false);
      fetchRules();
    } catch (err) {
      console.error('Error saving rule:', err);
      showSnackbar('Failed to save rule', 'error');
    }
  };

  const handleMovePriority = async (ruleId: string, direction: 'up' | 'down') => {
    if (!ruleSet) return;

    const rules = [...ruleSet.rules];
    const index = rules.findIndex(r => r.id === ruleId);
    
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
      // Swap priorities with the rule above
      const temp = rules[index - 1].priority;
      rules[index - 1].priority = rules[index].priority;
      rules[index].priority = temp;
    } else if (direction === 'down' && index < rules.length - 1) {
      // Swap priorities with the rule below
      const temp = rules[index + 1].priority;
      rules[index + 1].priority = rules[index].priority;
      rules[index].priority = temp;
    } else {
      return; // No change needed
    }

    try {
      // Update priorities on the server
      await api.post('/admin/steering/priorities', {
        priorities: rules.map(r => ({ id: r.id, priority: r.priority }))
      });
      
      showSnackbar('Rule priority updated', 'success');
      fetchRules();
    } catch (err) {
      console.error('Error updating rule priorities:', err);
      showSnackbar('Failed to update rule priorities', 'error');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !ruleSet) return;

    const rules = [...ruleSet.rules];
    const [reorderedItem] = rules.splice(result.source.index, 1);
    rules.splice(result.destination.index, 0, reorderedItem);

    // Reassign priorities
    const updatedRules = rules.map((rule, index) => ({
      ...rule,
      priority: (index + 1) * 10
    }));

    try {
      // Update priorities on the server
      await api.post('/admin/steering/priorities', {
        priorities: updatedRules.map(r => ({ id: r.id, priority: r.priority }))
      });
      
      showSnackbar('Rule priorities updated', 'success');
      fetchRules();
    } catch (err) {
      console.error('Error updating rule priorities:', err);
      showSnackbar('Failed to update rule priorities', 'error');
    }
  };

  const handleReloadRules = async () => {
    try {
      await api.post('/admin/steering/reload');
      showSnackbar('Rules reloaded successfully', 'success');
      fetchRules();
    } catch (err) {
      console.error('Error reloading rules:', err);
      showSnackbar('Failed to reload rules', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading steering rules...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={fetchRules} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Steering Rules</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={handleReloadRules}
            sx={{ mr: 2 }}
          >
            Reload Rules
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleCreateRule}
          >
            Add Rule
          </Button>
        </Box>
      </Box>

      <Paper elevation={2}>
        <TableContainer>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="rules-table">
              {(provided) => (
                <Table {...provided.droppableProps} ref={provided.innerRef}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="5%">Priority</TableCell>
                      <TableCell width="20%">Name</TableCell>
                      <TableCell width="30%">Description</TableCell>
                      <TableCell width="15%">Tags</TableCell>
                      <TableCell width="10%">Enabled</TableCell>
                      <TableCell width="20%">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ruleSet?.rules.map((rule, index) => (
                      <Draggable key={rule.id} draggableId={rule.id} index={index}>
                        {(provided) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{ 
                              backgroundColor: rule.enabled ? 'inherit' : 'rgba(0, 0, 0, 0.04)',
                              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
                            }}
                          >
                            <TableCell>{rule.priority}</TableCell>
                            <TableCell>{rule.name}</TableCell>
                            <TableCell>{rule.description}</TableCell>
                            <TableCell>
                              {rule.tags?.map(tag => (
                                <Chip 
                                  key={tag} 
                                  label={tag} 
                                  size="small" 
                                  sx={{ mr: 0.5, mb: 0.5 }} 
                                />
                              ))}
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={rule.enabled} 
                                onChange={() => handleToggleRule(rule)}
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Edit rule">
                                <IconButton onClick={() => handleEditRule(rule)} size="small">
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Test rule">
                                <IconButton onClick={() => handleTestRule(rule)} size="small">
                                  <TestIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete rule">
                                <IconButton onClick={() => handleDeleteRule(rule.id)} size="small">
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Move up">
                                <span>
                                  <IconButton 
                                    onClick={() => handleMovePriority(rule.id, 'up')} 
                                    size="small"
                                    disabled={index === 0}
                                  >
                                    <ArrowUpIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Move down">
                                <span>
                                  <IconButton 
                                    onClick={() => handleMovePriority(rule.id, 'down')} 
                                    size="small"
                                    disabled={index === ruleSet.rules.length - 1}
                                  >
                                    <ArrowDownIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                </Table>
              )}
            </Droppable>
          </DragDropContext>
        </TableContainer>
      </Paper>

      {/* Default Actions Section */}
      <Box mt={4}>
        <Typography variant="h5" mb={2}>Default Actions</Typography>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="body1" mb={2}>
            These actions will be applied if no rules match the request.
          </Typography>
          {/* Display default actions here */}
          {ruleSet?.defaultActions?.map((action, index) => (
            <Chip 
              key={index}
              label={`${action.type}: ${action.type === 'route' ? action.params.provider : 'custom'}`}
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
          <Box mt={2}>
            <Button 
              variant="outlined" 
              onClick={() => {
                // Handle editing default actions
              }}
            >
              Edit Default Actions
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Rule Editor Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {isNewRule ? 'Create New Rule' : 'Edit Rule'}
        </DialogTitle>
        <DialogContent>
          {editingRule && (
            <RuleEditor 
              rule={editingRule} 
              onChange={setEditingRule}
              isNew={isNewRule}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => editingRule && handleSaveRule(editingRule)} 
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Rule Dialog */}
      <TestRuleDialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        rule={testingRule}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SteeringRules;