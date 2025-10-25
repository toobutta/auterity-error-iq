/**
 * Cost Optimization Dashboard Component
 * Real-time cost monitoring, alerts, and optimization recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  MonetizationOn as MonetizationOnIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import {
  costOptimizationEngine,
  costTrackingIntegration,
  type CostAnalysis,
  type CostRecommendation,
  type Budget
} from '../../services/costOptimizationEngine';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CostOptimizationDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<CostRecommendation[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState<any>(null);
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<CostRecommendation | null>(null);
  const [optimizationDialog, setOptimizationDialog] = useState(false);

  const [newBudget, setNewBudget] = useState({
    name: '',
    amount: 0,
    currency: 'USD',
    period: 'monthly' as const,
    alertThreshold: 80,
    service: '',
    userId: '',
    teamId: ''
  });

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      // Load cost analysis
      const analysis = await costOptimizationEngine.getCostAnalysis(startDate, endDate);
      setCostAnalysis(analysis);

      // Load budgets
      const budgetList = costOptimizationEngine.getBudgets();
      setBudgets(budgetList);

      // Load recommendations
      const recs = await costOptimizationEngine.getResourceOptimization();
      setRecommendations(analysis.recommendations);

      // Load alerts
      const costAlerts = await costTrackingIntegration.generateCostAlerts();
      setAlerts(costAlerts);

      // Load real-time metrics
      const metrics = await costTrackingIntegration.getRealtimeCostMetrics('24h');
      setRealtimeMetrics(metrics);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Create new budget
  const handleCreateBudget = async () => {
    try {
      await costOptimizationEngine.createBudget({
        ...newBudget,
        startDate: new Date(),
        isActive: true
      });

      setBudgetDialog(false);
      setNewBudget({
        name: '',
        amount: 0,
        currency: 'USD',
        period: 'monthly',
        alertThreshold: 80,
        service: '',
        userId: '',
        teamId: ''
      });

      loadDashboardData();
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  // Apply optimization recommendation
  const handleApplyOptimization = async (recommendation: CostRecommendation) => {
    try {
      const result = await costOptimizationEngine.applyOptimization(recommendation.id);

      if (result.success) {
        alert(`Optimization applied successfully!\nSavings: $${result.estimatedSavings.toFixed(2)}\nChanges: ${result.appliedChanges.join(', ')}`);
        loadDashboardData();
      } else {
        alert('Failed to apply optimization');
      }
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      alert('Failed to apply optimization');
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon />;
      case 'high': return <WarningIcon />;
      case 'medium': return <WarningIcon />;
      case 'low': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (loading && !costAnalysis) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Cost Optimization Dashboard
        </Typography>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading cost analysis and optimization data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <MonetizationOnIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">
              Cost Optimization Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor costs, optimize spending, and maximize efficiency
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setBudgetDialog(true)}
          >
            Create Budget
          </Button>
        </Box>
      </Box>

      {/* Cost Overview Cards */}
      {costAnalysis && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Cost (30 days)
                </Typography>
                <Typography variant="h4" color="primary">
                  {formatCurrency(costAnalysis.totalCost)}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  {costAnalysis.trends.dailyGrowth >= 0 ? (
                    <TrendingUpIcon color="error" fontSize="small" />
                  ) : (
                    <TrendingDownIcon color="success" fontSize="small" />
                  )}
                  <Typography variant="body2" color={costAnalysis.trends.dailyGrowth >= 0 ? 'error' : 'success'} ml={0.5}>
                    {Math.abs(costAnalysis.trends.dailyGrowth).toFixed(1)}% vs yesterday
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Projected Monthly
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {formatCurrency(costAnalysis.trends.projectedMonthly)}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Based on current trends
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Active Budgets
                </Typography>
                <Typography variant="h4" color="info.main">
                  {budgets.filter(b => b.isActive).length}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {budgets.filter(b => b.isActive && b.currentSpent >= b.amount * b.alertThreshold / 100).length} near limit
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Optimization Score
                </Typography>
                <Typography variant="h4" color="success.main">
                  {Math.round(costAnalysis.overallScore)}%
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Overall efficiency rating
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Active Alerts
          </Typography>
          <Grid container spacing={2}>
            {alerts.map((alert, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Alert
                  severity={getSeverityColor(alert.severity)}
                  icon={getSeverityIcon(alert.severity)}
                >
                  <Typography variant="subtitle2">{alert.title}</Typography>
                  <Typography variant="body2">{alert.message}</Typography>
                  {alert.suggestedActions && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Suggested actions:
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {alert.suggestedActions.slice(0, 2).map((action, idx) => (
                          <li key={idx}>
                            <Typography variant="caption">{action}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Alert>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Cost Analysis" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Service Breakdown" icon={<MonetizationOnIcon />} iconPosition="start" />
          <Tab label="Optimization" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="Budgets" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>

        {/* Cost Analysis Tab */}
        <TabPanel value={tabValue} index={0}>
          {costAnalysis && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cost Trend (Last 30 Days)
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={costAnalysis.breakdown.byTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
                      />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <RechartsTooltip
                        labelFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
                        formatter={(value: number) => [formatCurrency(value), 'Cost']}
                      />
                      <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cost by Service
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(costAnalysis.breakdown.byService).map(([service, cost]) => ({
                          name: service,
                          value: cost
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(costAnalysis.breakdown.byService).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Anomalies Detected
                  </Typography>
                  {costAnalysis.anomalies.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No significant cost anomalies detected in the last 30 days.
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Expected Cost</TableCell>
                            <TableCell>Actual Cost</TableCell>
                            <TableCell>Deviation</TableCell>
                            <TableCell>Reason</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {costAnalysis.anomalies.map((anomaly, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(anomaly.timestamp).toLocaleDateString()}</TableCell>
                              <TableCell>{formatCurrency(anomaly.expectedCost)}</TableCell>
                              <TableCell>{formatCurrency(anomaly.actualCost)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${(anomaly.deviation * 100).toFixed(1)}%`}
                                  color="warning"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{anomaly.reason}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Service Breakdown Tab */}
        <TabPanel value={tabValue} index={1}>
          {costAnalysis && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Service Cost Comparison
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={Object.entries(costAnalysis.breakdown.byService).map(([service, cost]) => ({
                      service,
                      cost
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="service" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="cost" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cost by Operation Type
                  </Typography>
                  <List>
                    {Object.entries(costAnalysis.breakdown.byOperation).map(([operation, cost]) => (
                      <ListItem key={operation}>
                        <ListItemText
                          primary={operation}
                          secondary={formatCurrency(cost)}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cost Efficiency Metrics
                  </Typography>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Overall Efficiency Score: <strong>{Math.round(costAnalysis.overallScore)}%</strong>
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Daily Growth Rate: <strong>{costAnalysis.trends.dailyGrowth.toFixed(2)}%</strong>
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Weekly Growth Rate: <strong>{costAnalysis.trends.weeklyGrowth.toFixed(2)}%</strong>
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Projected Monthly: <strong>{formatCurrency(costAnalysis.trends.projectedMonthly)}</strong>
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Optimization Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  AI Cost Optimization Recommendations
                </Typography>
                {recommendations.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No optimization recommendations available at this time.
                  </Typography>
                ) : (
                  <Box>
                    {recommendations.map((rec, index) => (
                      <Accordion key={index}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box display="flex" alignItems="center" gap={2} width="100%">
                            <Typography variant="subtitle1">
                              {rec.title}
                            </Typography>
                            <Chip
                              label={`${rec.priority}`}
                              color={getPriorityColor(rec.priority)}
                              size="small"
                            />
                            <Typography variant="body2" color="success.main">
                              Potential Savings: {formatCurrency(rec.potentialSavings)}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" paragraph>
                            {rec.description}
                          </Typography>

                          <Typography variant="subtitle2" gutterBottom>
                            Implementation Effort: {rec.implementationEffort}
                          </Typography>

                          <Typography variant="subtitle2" gutterBottom>
                            Affected Services: {rec.affectedServices.join(', ')}
                          </Typography>

                          <Typography variant="subtitle2" gutterBottom>
                            Action Items:
                          </Typography>
                          <List dense>
                            {rec.actionItems.map((action, idx) => (
                              <ListItem key={idx}>
                                <ListItemText
                                  primary={action.action}
                                  secondary={`${action.impact} (${action.timeline})`}
                                />
                              </ListItem>
                            ))}
                          </List>

                          <Box mt={2}>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleApplyOptimization(rec)}
                              startIcon={<PlayArrowIcon />}
                            >
                              Apply Optimization
                            </Button>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Budgets Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Cost Budgets & Alerts
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Budget Name</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Current Spent</TableCell>
                        <TableCell>Usage %</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {budgets.map((budget) => {
                        const usagePercentage = (budget.currentSpent / budget.amount) * 100;
                        const isNearLimit = usagePercentage >= budget.alertThreshold;
                        const isOverLimit = usagePercentage >= 100;

                        return (
                          <TableRow key={budget.id}>
                            <TableCell>{budget.name}</TableCell>
                            <TableCell>{formatCurrency(budget.amount, budget.currency)}</TableCell>
                            <TableCell>{formatCurrency(budget.currentSpent, budget.currency)}</TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(usagePercentage, 100)}
                                  color={isOverLimit ? 'error' : isNearLimit ? 'warning' : 'success'}
                                  sx={{ width: 60 }}
                                />
                                <Typography variant="body2">
                                  {usagePercentage.toFixed(1)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{budget.period}</TableCell>
                            <TableCell>
                              <Chip
                                label={budget.isActive ? 'Active' : 'Inactive'}
                                color={budget.isActive ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Budget Creation Dialog */}
      <Dialog open={budgetDialog} onClose={() => setBudgetDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Budget</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Budget Name"
                value={newBudget.name}
                onChange={(e) => setNewBudget(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={newBudget.amount}
                onChange={(e) => setNewBudget(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={newBudget.currency}
                  label="Currency"
                  onChange={(e) => setNewBudget(prev => ({ ...prev, currency: e.target.value }))}
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={newBudget.period}
                  label="Period"
                  onChange={(e) => setNewBudget(prev => ({ ...prev, period: e.target.value as any }))}
                >
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Alert Threshold (%)"
                type="number"
                value={newBudget.alertThreshold}
                onChange={(e) => setNewBudget(prev => ({ ...prev, alertThreshold: parseInt(e.target.value) || 80 }))}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service (optional)"
                value={newBudget.service}
                onChange={(e) => setNewBudget(prev => ({ ...prev, service: e.target.value }))}
                placeholder="e.g., openai, vllm, langgraph"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBudgetDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBudget}
            variant="contained"
            disabled={!newBudget.name || newBudget.amount <= 0}
          >
            Create Budget
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CostOptimizationDashboard;

