import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Typography,
  Divider,
  IconButton,
  Chip,
  Grid,
  Paper,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { 
  SteeringRule, 
  RuleCondition, 
  RuleAction,
  FIELD_OPTIONS,
  OPERATOR_OPTIONS,
  ACTION_TYPE_OPTIONS,
  PROVIDER_OPTIONS,
  MODEL_OPTIONS,
  TRANSFORMATION_OPERATION_OPTIONS,
  LOG_LEVEL_OPTIONS
} from './types';

interface RuleEditorProps {
  rule: SteeringRule;
  onChange: (rule: SteeringRule) => void;
  isNew: boolean;
}

const RuleEditor: React.FC<RuleEditorProps> = ({ rule, onChange, isNew }) => {
  // Update rule with new values
  const updateRule = (updates: Partial<SteeringRule>) => {
    onChange({ ...rule, ...updates });
  };

  // Handle condition changes
  const handleConditionChange = (index: number, updates: Partial<RuleCondition>) => {
    const newConditions = [...rule.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    updateRule({ conditions: newConditions });
  };

  // Add a new condition
  const addCondition = () => {
    const newCondition: RuleCondition = {
      field: 'request.body.prompt',
      operator: 'contains',
      value: ''
    };
    updateRule({ conditions: [...rule.conditions, newCondition] });
  };

  // Remove a condition
  const removeCondition = (index: number) => {
    const newConditions = [...rule.conditions];
    newConditions.splice(index, 1);
    updateRule({ conditions: newConditions });
  };

  // Handle action changes
  const handleActionChange = (index: number, updates: Partial<RuleAction>) => {
    const newActions = [...rule.actions];
    newActions[index] = { ...newActions[index], ...updates };
    updateRule({ actions: newActions });
  };

  // Handle action params changes
  const handleActionParamsChange = (index: number, updates: Partial<RuleAction['params']>) => {
    const newActions = [...rule.actions];
    newActions[index] = { 
      ...newActions[index], 
      params: { ...newActions[index].params, ...updates } 
    };
    updateRule({ actions: newActions });
  };

  // Add a new action
  const addAction = () => {
    const newAction: RuleAction = {
      type: 'route',
      params: {
        provider: 'openai',
        model: 'gpt-3.5-turbo'
      }
    };
    updateRule({ actions: [...rule.actions, newAction] });
  };

  // Remove an action
  const removeAction = (index: number) => {
    const newActions = [...rule.actions];
    newActions.splice(index, 1);
    updateRule({ actions: newActions });
  };

  // Handle tags changes
  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = event.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
    updateRule({ tags: tagsArray });
  };

  // Generate ID if new rule
  React.useEffect(() => {
    if (isNew && !rule.id) {
      updateRule({ id: uuidv4() });
    }
  }, [isNew, rule.id]);

  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Basic Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Rule Name"
                value={rule.name}
                onChange={(e) => updateRule({ name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Priority"
                type="number"
                value={rule.priority}
                onChange={(e) => updateRule({ priority: parseInt(e.target.value) })}
                fullWidth
                required
                helperText="Lower numbers have higher priority"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={rule.description || ''}
                onChange={(e) => updateRule({ description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tags (comma-separated)"
                value={rule.tags?.join(', ') || ''}
                onChange={handleTagsChange}
                fullWidth
                helperText="E.g., routing, optimization, premium"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={rule.enabled}
                      onChange={(e) => updateRule({ enabled: e.target.checked })}
                    />
                  }
                  label="Enabled"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={rule.continue}
                      onChange={(e) => updateRule({ continue: e.target.checked })}
                    />
                  }
                  label="Continue to next rule"
                />
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Conditions */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">Conditions</Typography>
            <FormControl component="fieldset">
              <Box display="flex" alignItems="center">
                <Typography variant="body2" mr={1}>Operator:</Typography>
                <Select
                  value={rule.operator}
                  onChange={(e) => updateRule({ operator: e.target.value as 'and' | 'or' })}
                  size="small"
                >
                  <MenuItem value="and">AND</MenuItem>
                  <MenuItem value="or">OR</MenuItem>
                </Select>
              </Box>
            </FormControl>
          </Box>
          
          {rule.conditions.map((condition, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, position: 'relative' }}>
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8 }}
                onClick={() => removeCondition(index)}
                disabled={rule.conditions.length <= 1}
              >
                <DeleteIcon />
              </IconButton>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Field</InputLabel>
                    <Select
                      value={condition.field}
                      label="Field"
                      onChange={(e) => handleConditionChange(index, { field: e.target.value })}
                    >
                      {FIELD_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={condition.operator}
                      label="Operator"
                      onChange={(e) => handleConditionChange(index, { operator: e.target.value as RuleCondition['operator'] })}
                    >
                      {OPERATOR_OPTIONS.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  {condition.operator !== 'exists' && condition.operator !== 'not_exists' && (
                    <TextField
                      label="Value"
                      value={condition.value !== undefined ? condition.value : ''}
                      onChange={(e) => {
                        let value: string | number | boolean = e.target.value;
                        
                        // Convert to number if appropriate
                        if (['gt', 'lt', 'gte', 'lte'].includes(condition.operator) && !isNaN(Number(value))) {
                          value = Number(value);
                        }
                        
                        // Convert to array if 'in' or 'not_in'
                        if (['in', 'not_in'].includes(condition.operator)) {
                          value = value.toString().split(',').map(v => v.trim());
                        }
                        
                        handleConditionChange(index, { value });
                      }}
                      fullWidth
                      helperText={
                        ['in', 'not_in'].includes(condition.operator) 
                          ? 'Comma-separated values' 
                          : undefined
                      }
                    />
                  )}
                </Grid>
              </Grid>
            </Paper>
          ))}
          
          <Button
            startIcon={<AddIcon />}
            onClick={addCondition}
            variant="outlined"
            fullWidth
          >
            Add Condition
          </Button>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Actions</Typography>
          
          {rule.actions.map((action, index) => (
            <Accordion key={index} defaultExpanded={true} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  {ACTION_TYPE_OPTIONS.find(opt => opt.value === action.type)?.label || action.type}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box position="relative">
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: 0, right: 0 }}
                    onClick={() => removeAction(index)}
                    disabled={rule.actions.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Action Type</InputLabel>
                        <Select
                          value={action.type}
                          label="Action Type"
                          onChange={(e) => handleActionChange(index, { type: e.target.value as RuleAction['type'] })}
                        >
                          {ACTION_TYPE_OPTIONS.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Route Action Parameters */}
                    {action.type === 'route' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Provider</InputLabel>
                            <Select
                              value={action.params.provider || ''}
                              label="Provider"
                              onChange={(e) => handleActionParamsChange(index, { provider: e.target.value })}
                            >
                              {PROVIDER_OPTIONS.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Model</InputLabel>
                            <Select
                              value={action.params.model || ''}
                              label="Model"
                              onChange={(e) => handleActionParamsChange(index, { model: e.target.value })}
                            >
                              {(action.params.provider && MODEL_OPTIONS[action.params.provider] || []).map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </>
                    )}
                    
                    {/* Transform Action Parameters */}
                    {action.type === 'transform' && (
                      <>
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Field"
                            value={action.params.transformation?.field || ''}
                            onChange={(e) => handleActionParamsChange(index, { 
                              transformation: { 
                                ...action.params.transformation,
                                field: e.target.value 
                              } 
                            })}
                            fullWidth
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth>
                            <InputLabel>Operation</InputLabel>
                            <Select
                              value={action.params.transformation?.operation || 'replace'}
                              label="Operation"
                              onChange={(e) => handleActionParamsChange(index, { 
                                transformation: { 
                                  ...action.params.transformation,
                                  operation: e.target.value as 'replace' | 'append' | 'prepend' | 'delete'
                                } 
                              })}
                            >
                              {TRANSFORMATION_OPERATION_OPTIONS.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        {action.params.transformation?.operation !== 'delete' && (
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Value"
                              value={action.params.transformation?.value || ''}
                              onChange={(e) => handleActionParamsChange(index, { 
                                transformation: { 
                                  ...action.params.transformation,
                                  value: e.target.value 
                                } 
                              })}
                              fullWidth
                            />
                          </Grid>
                        )}
                      </>
                    )}
                    
                    {/* Inject Action Parameters */}
                    {action.type === 'inject' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Field"
                            value={action.params.context?.field || ''}
                            onChange={(e) => handleActionParamsChange(index, { 
                              context: { 
                                ...action.params.context,
                                field: e.target.value 
                              } 
                            })}
                            fullWidth
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Value"
                            value={action.params.context?.value || ''}
                            onChange={(e) => handleActionParamsChange(index, { 
                              context: { 
                                ...action.params.context,
                                value: e.target.value 
                              } 
                            })}
                            fullWidth
                          />
                        </Grid>
                      </>
                    )}
                    
                    {/* Reject Action Parameters */}
                    {action.type === 'reject' && (
                      <>
                        <Grid item xs={12} md={8}>
                          <TextField
                            label="Message"
                            value={action.params.message || ''}
                            onChange={(e) => handleActionParamsChange(index, { message: e.target.value })}
                            fullWidth
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                          <TextField
                            label="Status Code"
                            type="number"
                            value={action.params.status || 400}
                            onChange={(e) => handleActionParamsChange(index, { status: parseInt(e.target.value) })}
                            fullWidth
                          />
                        </Grid>
                      </>
                    )}
                    
                    {/* Log Action Parameters */}
                    {action.type === 'log' && (
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Log Level</InputLabel>
                          <Select
                            value={action.params.level || 'info'}
                            label="Log Level"
                            onChange={(e) => handleActionParamsChange(index, { level: e.target.value as 'debug' | 'info' | 'warn' | 'error' })}
                          >
                            {LOG_LEVEL_OPTIONS.map(option => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
          
          <Button
            startIcon={<AddIcon />}
            onClick={addAction}
            variant="outlined"
            fullWidth
          >
            Add Action
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RuleEditor;