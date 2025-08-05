import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  Autorenew as AutorenewIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DateRangePicker } from '@mui/lab';

// Mock data for the dashboard
const mockCostData = [
  { date: '2025-07-01', training: 12.45, inference: 8.32, storage: 2.10, total: 22.87 },
  { date: '2025-07-02', training: 15.20, inference: 9.15, storage: 2.10, total: 26.45 },
  { date: '2025-07-03', training: 8.75, inference: 10.22, storage: 2.15, total: 21.12 },
  { date: '2025-07-04', training: 5.30, inference: 11.45, storage: 2.15, total: 18.90 },
  { date: '2025-07-05', training: 0.00, inference: 12.78, storage: 2.20, total: 14.98 },
  { date: '2025-07-06', training: 22.50, inference: 9.65, storage: 2.20, total: 34.35 },
  { date: '2025-07-07', training: 18.30, inference: 8.92, storage: 2.25, total: 29.47 },
  { date: '2025-07-08', training: 14.75, inference: 10.35, storage: 2.25, total: 27.35 },
  { date: '2025-07-09', training: 11.20, inference: 11.78, storage: 2.30, total: 25.28 },
  { date: '2025-07-10', training: 9.85, inference: 12.45, storage: 2.30, total: 24.60 },
  { date: '2025-07-11', training: 7.50, inference: 13.20, storage: 2.35, total: 23.05 },
  { date: '2025-07-12', training: 5.25, inference: 14.75, storage: 2.35, total: 22.35 },
  { date: '2025-07-13', training: 3.10, inference: 15.30, storage: 2.40, total: 20.80 },
  { date: '2025-07-14', training: 18.90, inference: 12.65, storage: 2.40, total: 33.95 },
  { date: '2025-07-15', training: 22.45, inference: 10.85, storage: 2.45, total: 35.75 },
  { date: '2025-07-16', training: 17.30, inference: 11.20, storage: 2.45, total: 30.95 },
  { date: '2025-07-17', training: 12.75, inference: 12.85, storage: 2.50, total: 28.10 },
  { date: '2025-07-18', training: 8.90, inference: 13.45, storage: 2.50, total: 24.85 },
  { date: '2025-07-19', training: 5.65, inference: 14.20, storage: 2.55, total: 22.40 },
  { date: '2025-07-20', training: 3.30, inference: 15.75, storage: 2.55, total: 21.60 },
  { date: '2025-07-21', training: 19.85, inference: 13.30, storage: 2.60, total: 35.75 },
  { date: '2025-07-22', training: 24.50, inference: 11.85, storage: 2.60, total: 38.95 },
  { date: '2025-07-23', training: 20.30, inference: 12.45, storage: 2.65, total: 35.40 },
  { date: '2025-07-24', training: 15.75, inference: 13.20, storage: 2.65, total: 31.60 },
  { date: '2025-07-25', training: 11.90, inference: 14.75, storage: 2.70, total: 29.35 },
  { date: '2025-07-26', training: 8.65, inference: 15.30, storage: 2.70, total: 26.65 },
  { date: '2025-07-27', training: 5.30, inference: 16.85, storage: 2.75, total: 24.90 },
  { date: '2025-07-28', training: 21.85, inference: 14.30, storage: 2.75, total: 38.90 },
  { date: '2025-07-29', training: 26.50, inference: 12.85, storage: 2.80, total: 42.15 },
  { date: '2025-07-30', training: 22.30, inference: 13.45, storage: 2.80, total: 38.55 },
  { date: '2025-07-31', training: 17.75, inference: 14.20, storage: 2.85, total: 34.80 }
];

const mockPerformanceData = [
  { date: '2025-07-01', latency: 125, throughput: 450, success_rate: 99.2 },
  { date: '2025-07-02', latency: 130, throughput: 445, success_rate: 99.1 },
  { date: '2025-07-03', latency: 128, throughput: 460, success_rate: 99.3 },
  { date: '2025-07-04', latency: 122, throughput: 470, success_rate: 99.4 },
  { date: '2025-07-05', latency: 118, throughput: 480, success_rate: 99.5 },
  { date: '2025-07-06', latency: 115, throughput: 485, success_rate: 99.6 },
  { date: '2025-07-07', latency: 110, throughput: 490, success_rate: 99.7 },
  { date: '2025-07-08', latency: 105, throughput: 500, success_rate: 99.8 },
  { date: '2025-07-09', latency: 100, throughput: 510, success_rate: 99.9 },
  { date: '2025-07-10', latency: 98, throughput: 515, success_rate: 99.9 },
  { date: '2025-07-11', latency: 95, throughput: 520, success_rate: 99.9 },
  { date: '2025-07-12', latency: 92, throughput: 525, success_rate: 99.9 },
  { date: '2025-07-13', latency: 90, throughput: 530, success_rate: 99.9 },
  { date: '2025-07-14', latency: 88, throughput: 535, success_rate: 99.9 },
  { date: '2025-07-15', latency: 85, throughput: 540, success_rate: 99.9 },
  { date: '2025-07-16', latency: 82, throughput: 545, success_rate: 99.9 },
  { date: '2025-07-17', latency: 80, throughput: 550, success_rate: 99.9 },
  { date: '2025-07-18', latency: 78, throughput: 555, success_rate: 99.9 },
  { date: '2025-07-19', latency: 75, throughput: 560, success_rate: 99.9 },
  { date: '2025-07-20', latency: 72, throughput: 565, success_rate: 99.9 },
  { date: '2025-07-21', latency: 70, throughput: 570, success_rate: 99.9 },
  { date: '2025-07-22', latency: 68, throughput: 575, success_rate: 99.9 },
  { date: '2025-07-23', latency: 65, throughput: 580, success_rate: 99.9 },
  { date: '2025-07-24', latency: 62, throughput: 585, success_rate: 99.9 },
  { date: '2025-07-25', latency: 60, throughput: 590, success_rate: 99.9 },
  { date: '2025-07-26', latency: 58, throughput: 595, success_rate: 99.9 },
  { date: '2025-07-27', latency: 55, throughput: 600, success_rate: 99.9 },
  { date: '2025-07-28', latency: 52, throughput: 605, success_rate: 99.9 },
  { date: '2025-07-29', latency: 50, throughput: 610, success_rate: 99.9 },
  { date: '2025-07-30', latency: 48, throughput: 615, success_rate: 99.9 },
  { date: '2025-07-31', latency: 45, throughput: 620, success_rate: 99.9 }
];

const mockModels = [
  {
    id: 'model-1',
    name: 'Mistral-7B-Automotive',
    type: 'Fine-tuned',
    base_model: 'Mistral-7B',
    specialization: 'Automotive',
    status: 'active',
    deployment: {
      endpoint: 'vLLM',
      quantization: 'int8',
      instance_type: 'g4dn.xlarge',
      instance_count: 1
    },
    performance: {
      latency_p50: 85,
      latency_p90: 120,
      latency_p99: 180,
      throughput: 540,
      success_rate: 99.9
    },
    cost: {
      hourly: 0.75,
      daily: 18.0,
      monthly: 540.0
    },
    drift: {
      status: 'normal',
      last_checked: '2025-07-31T12:00:00Z'
    }
  },
  {
    id: 'model-2',
    name: 'Llama-7B-Sales',
    type: 'Fine-tuned',
    base_model: 'Llama-7B',
    specialization: 'Sales',
    status: 'active',
    deployment: {
      endpoint: 'Triton',
      quantization: 'int4',
      instance_type: 'g4dn.xlarge',
      instance_count: 1
    },
    performance: {
      latency_p50: 65,
      latency_p90: 95,
      latency_p99: 150,
      throughput: 620,
      success_rate: 99.8
    },
    cost: {
      hourly: 0.60,
      daily: 14.4,
      monthly: 432.0
    },
    drift: {
      status: 'warning',
      last_checked: '2025-07-31T12:00:00Z'
    }
  },
  {
    id: 'model-3',
    name: 'GPT-J-6B-Service',
    type: 'Fine-tuned',
    base_model: 'GPT-J-6B',
    specialization: 'Service',
    status: 'active',
    deployment: {
      endpoint: 'TensorRT',
      quantization: 'int8',
      instance_type: 'g4dn.xlarge',
      instance_count: 1
    },
    performance: {
      latency_p50: 75,
      latency_p90: 110,
      latency_p99: 165,
      throughput: 580,
      success_rate: 99.7
    },
    cost: {
      hourly: 0.55,
      daily: 13.2,
      monthly: 396.0
    },
    drift: {
      status: 'alert',
      last_checked: '2025-07-31T12:00:00Z'
    }
  },
  {
    id: 'model-4',
    name: 'Mistral-7B-Parts',
    type: 'Fine-tuned',
    base_model: 'Mistral-7B',
    specialization: 'Parts',
    status: 'inactive',
    deployment: {
      endpoint: 'vLLM',
      quantization: 'int8',
      instance_type: 'g4dn.xlarge',
      instance_count: 0
    },
    performance: {
      latency_p50: 90,
      latency_p90: 125,
      latency_p99: 190,
      throughput: 520,
      success_rate: 99.6
    },
    cost: {
      hourly: 0.0,
      daily: 0.0,
      monthly: 0.0
    },
    drift: {
      status: 'unknown',
      last_checked: '2025-07-25T12:00:00Z'
    }
  }
];

const mockDriftAlerts = [
  {
    id: 'drift-1',
    model_id: 'model-3',
    model_name: 'GPT-J-6B-Service',
    severity: 'high',
    type: 'data_drift',
    description: 'Input distribution has significantly changed over the past 24 hours',
    detected_at: '2025-07-31T08:15:00Z',
    metrics: {
      drift_score: 0.82,
      p_value: 0.001,
      feature: 'input_text'
    },
    status: 'open',
    recommended_action: 'Retrain model with recent data'
  },
  {
    id: 'drift-2',
    model_id: 'model-2',
    model_name: 'Llama-7B-Sales',
    severity: 'medium',
    type: 'performance_drift',
    description: 'Latency has increased by 15% over the past week',
    detected_at: '2025-07-30T14:22:00Z',
    metrics: {
      drift_score: 0.65,
      previous_latency: 55,
      current_latency: 65
    },
    status: 'open',
    recommended_action: 'Consider scaling up instances or optimizing model'
  },
  {
    id: 'drift-3',
    model_id: 'model-1',
    model_name: 'Mistral-7B-Automotive',
    severity: 'low',
    type: 'accuracy_drift',
    description: 'Slight decrease in accuracy metrics observed',
    detected_at: '2025-07-29T09:45:00Z',
    metrics: {
      drift_score: 0.35,
      previous_accuracy: 0.92,
      current_accuracy: 0.89
    },
    status: 'resolved',
    recommended_action: 'Monitor for further changes',
    resolution: 'Accuracy returned to normal levels after temporary fluctuation'
  }
];

const mockOptimizationRecommendations = [
  {
    id: 'opt-1',
    model_id: 'model-2',
    model_name: 'Llama-7B-Sales',
    type: 'quantization',
    description: 'Current model is using INT4 quantization. Consider testing INT3 quantization for 25% cost reduction with minimal accuracy impact.',
    estimated_savings: {
      monthly: 108.0,
      percentage: 25
    },
    estimated_impact: {
      latency: '+5%',
      accuracy: '-0.5%'
    },
    complexity: 'medium',
    status: 'recommended'
  },
  {
    id: 'opt-2',
    model_id: 'model-1',
    model_name: 'Mistral-7B-Automotive',
    type: 'caching',
    description: 'Implement response caching for frequently asked questions to reduce inference costs.',
    estimated_savings: {
      monthly: 162.0,
      percentage: 30
    },
    estimated_impact: {
      latency: '-40%',
      throughput: '+25%'
    },
    complexity: 'low',
    status: 'recommended'
  },
  {
    id: 'opt-3',
    model_id: 'model-3',
    model_name: 'GPT-J-6B-Service',
    type: 'distillation',
    description: 'Create a distilled 1.5B parameter model for common service queries.',
    estimated_savings: {
      monthly: 198.0,
      percentage: 50
    },
    estimated_impact: {
      latency: '-60%',
      accuracy: '-3%'
    },
    complexity: 'high',
    status: 'in_progress'
  },
  {
    id: 'opt-4',
    model_id: 'all',
    model_name: 'All Models',
    type: 'autoscaling',
    description: 'Implement time-based autoscaling to reduce instances during low-traffic periods.',
    estimated_savings: {
      monthly: 275.0,
      percentage: 20
    },
    estimated_impact: {
      availability: 'Maintained',
      cost_efficiency: '+20%'
    },
    complexity: 'medium',
    status: 'recommended'
  }
];

// CostGuard Dashboard Component
function CostGuardDashboard() {
  // State for active tab
  const [activeTab, setActiveTab] = useState(0);
  
  // State for date range
  const [dateRange, setDateRange] = useState({
    start: '2025-07-01',
    end: '2025-07-31'
  });
  
  // State for filtered data
  const [filteredCostData, setFilteredCostData] = useState(mockCostData);
  const [filteredPerformanceData, setFilteredPerformanceData] = useState(mockPerformanceData);
  
  // State for model filter
  const [selectedModel, setSelectedModel] = useState('all');
  
  // State for drift detection dialog
  const [driftDialogOpen, setDriftDialogOpen] = useState(false);
  const [selectedDrift, setSelectedDrift] = useState(null);
  
  // State for optimization dialog
  const [optimizationDialogOpen, setOptimizationDialogOpen] = useState(false);
  const [selectedOptimization, setSelectedOptimization] = useState(null);
  
  // State for loading
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate summary metrics
  const totalMonthlyCost = filteredCostData.reduce((sum, day) => sum + day.total, 0).toFixed(2);
  const avgDailyCost = (filteredCostData.reduce((sum, day) => sum + day.total, 0) / filteredCostData.length).toFixed(2);
  const trainingCost = filteredCostData.reduce((sum, day) => sum + day.training, 0).toFixed(2);
  const inferenceCost = filteredCostData.reduce((sum, day) => sum + day.inference, 0).toFixed(2);
  const storageCost = filteredCostData.reduce((sum, day) => sum + day.storage, 0).toFixed(2);
  
  const avgLatency = (filteredPerformanceData.reduce((sum, day) => sum + day.latency, 0) / filteredPerformanceData.length).toFixed(1);
  const avgThroughput = (filteredPerformanceData.reduce((sum, day) => sum + day.throughput, 0) / filteredPerformanceData.length).toFixed(0);
  const avgSuccessRate = (filteredPerformanceData.reduce((sum, day) => sum + day.success_rate, 0) / filteredPerformanceData.length).toFixed(1);
  
  // Filter data when date range changes
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const filteredCost = mockCostData.filter(
        item => item.date >= dateRange.start && item.date <= dateRange.end
      );
      
      const filteredPerformance = mockPerformanceData.filter(
        item => item.date >= dateRange.start && item.date <= dateRange.end
      );
      
      setFilteredCostData(filteredCost);
      setFilteredPerformanceData(filteredPerformance);
      setIsLoading(false);
    }, 500);
  }, [dateRange]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle date range change
  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end });
  };
  
  // Handle model filter change
  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
  };
  
  // Handle drift alert click
  const handleDriftClick = (drift) => {
    setSelectedDrift(drift);
    setDriftDialogOpen(true);
  };
  
  // Handle optimization recommendation click
  const handleOptimizationClick = (optimization) => {
    setSelectedOptimization(optimization);
    setOptimizationDialogOpen(true);
  };
  
  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return '#d32f2f';
      case 'medium':
        return '#f57c00';
      case 'low':
        return '#388e3c';
      default:
        return '#757575';
    }
  };
  
  // Get drift status color
  const getDriftStatusColor = (status) => {
    switch (status) {
      case 'alert':
        return '#d32f2f';
      case 'warning':
        return '#f57c00';
      case 'normal':
        return '#388e3c';
      default:
        return '#757575';
    }
  };
  
  // Get optimization status color
  const getOptimizationStatusColor = (status) => {
    switch (status) {
      case 'implemented':
        return '#388e3c';
      case 'in_progress':
        return '#1976d2';
      case 'recommended':
        return '#f57c00';
      default:
        return '#757575';
    }
  };
  
  // Get complexity color
  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'high':
        return '#d32f2f';
      case 'medium':
        return '#f57c00';
      case 'low':
        return '#388e3c';
      default:
        return '#757575';
    }
  };
  
  // Render cost overview tab
  const renderCostOverview = () => {
    return (
      <Box>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Total Cost (Period)
                </Typography>
                <Typography variant="h4">${totalMonthlyCost}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Avg. Daily: ${avgDailyCost}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Training Cost
                </Typography>
                <Typography variant="h4">${trainingCost}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {((trainingCost / totalMonthlyCost) * 100).toFixed(1)}% of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Inference Cost
                </Typography>
                <Typography variant="h4">${inferenceCost}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {((inferenceCost / totalMonthlyCost) * 100).toFixed(1)}% of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Storage Cost
                </Typography>
                <Typography variant="h4">${storageCost}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {((storageCost / totalMonthlyCost) * 100).toFixed(1)}% of total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Cost Trend Chart */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Cost Trend" 
                action={
                  <IconButton>
                    <DownloadIcon />
                  </IconButton>
                }
              />
              <Divider />
              <CardContent>
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredCostData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="training" 
                        stackId="1"
                        stroke="#8884d8" 
                        fill="#8884d8" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="inference" 
                        stackId="1"
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="storage" 
                        stackId="1"
                        stroke="#ffc658" 
                        fill="#ffc658" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Cost Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Cost Breakdown" />
              <Divider />
              <CardContent>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Training', value: parseFloat(trainingCost) },
                          { name: 'Inference', value: parseFloat(inferenceCost) },
                          { name: 'Storage', value: parseFloat(storageCost) }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#8884d8" />
                        <Cell fill="#82ca9d" />
                        <Cell fill="#ffc658" />
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Cost by Model */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Cost by Model" />
              <Divider />
              <CardContent>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mockModels.filter(model => model.status === 'active')}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="cost.daily" name="Daily Cost ($)" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Optimization Recommendations */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Cost Optimization Recommendations" 
                subheader="Potential monthly savings: $743.00"
              />
              <Divider />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>Recommendation</TableCell>
                      <TableCell>Est. Savings</TableCell>
                      <TableCell>Impact</TableCell>
                      <TableCell>Complexity</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockOptimizationRecommendations.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>{rec.model_name}</TableCell>
                        <TableCell>{rec.description}</TableCell>
                        <TableCell>
                          ${rec.estimated_savings.monthly} ({rec.estimated_savings.percentage}%)
                        </TableCell>
                        <TableCell>
                          {Object.entries(rec.estimated_impact).map(([key, value]) => (
                            <div key={key}>
                              {key}: {value}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={rec.complexity} 
                            size="small"
                            style={{ backgroundColor: getComplexityColor(rec.complexity), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={rec.status.replace('_', ' ')} 
                            size="small"
                            style={{ backgroundColor: getOptimizationStatusColor(rec.status), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleOptimizationClick(rec)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render performance monitoring tab
  const renderPerformanceMonitoring = () => {
    return (
      <Box>
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Average Latency
                </Typography>
                <Typography variant="h4">{avgLatency} ms</Typography>
                <Typography variant="body2" color="textSecondary">
                  P50 across all models
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Average Throughput
                </Typography>
                <Typography variant="h4">{avgThroughput} req/min</Typography>
                <Typography variant="body2" color="textSecondary">
                  Across all models
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Success Rate
                </Typography>
                <Typography variant="h4">{avgSuccessRate}%</Typography>
                <Typography variant="body2" color="textSecondary">
                  Across all models
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Latency Trend Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Latency Trend" 
                action={
                  <IconButton>
                    <DownloadIcon />
                  </IconButton>
                }
              />
              <Divider />
              <CardContent>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredPerformanceData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="latency" 
                        stroke="#8884d8" 
                        name="Latency (ms)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Throughput Trend Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader 
                title="Throughput Trend" 
                action={
                  <IconButton>
                    <DownloadIcon />
                  </IconButton>
                }
              />
              <Divider />
              <CardContent>
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredPerformanceData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="throughput" 
                        stroke="#82ca9d" 
                        name="Throughput (req/min)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Model Performance Table */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Model Performance" />
              <Divider />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Model</TableCell>
                      <TableCell>Specialization</TableCell>
                      <TableCell>Latency (P50/P90/P99)</TableCell>
                      <TableCell>Throughput</TableCell>
                      <TableCell>Success Rate</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Drift</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockModels.map((model) => (
                      <TableRow key={model.id}>
                        <TableCell>{model.name}</TableCell>
                        <TableCell>{model.specialization}</TableCell>
                        <TableCell>
                          {model.performance.latency_p50} / {model.performance.latency_p90} / {model.performance.latency_p99} ms
                        </TableCell>
                        <TableCell>{model.performance.throughput} req/min</TableCell>
                        <TableCell>{model.performance.success_rate}%</TableCell>
                        <TableCell>
                          <Chip 
                            label={model.status} 
                            color={model.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={model.drift.status} 
                            size="small"
                            style={{ 
                              backgroundColor: getDriftStatusColor(model.drift.status), 
                              color: 'white' 
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render drift detection tab
  const renderDriftDetection = () => {
    return (
      <Box>
        <Grid container spacing={3}>
          {/* Drift Status Summary */}
          <Grid item xs={12}>
            <Alert 
              severity="warning"
              action={
                <Button color="inherit" size="small">
                  View All
                </Button>
              }
            >
              2 active drift alerts detected. Recommended actions available.
            </Alert>
          </Grid>
          
          {/* Drift Alerts */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Drift Alerts" 
                action={
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    size="small"
                  >
                    Refresh
                  </Button>
                }
              />
              <Divider />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Severity</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Detected</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockDriftAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Chip 
                            label={alert.severity} 
                            size="small"
                            style={{ backgroundColor: getSeverityColor(alert.severity), color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>{alert.model_name}</TableCell>
                        <TableCell>{alert.type.replace('_', ' ')}</TableCell>
                        <TableCell>{alert.description}</TableCell>
                        <TableCell>{new Date(alert.detected_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={alert.status} 
                            color={alert.status === 'open' ? 'error' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleDriftClick(alert)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
          
          {/* KIT-EVOLVE System */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="KIT-EVOLVE System" 
                subheader="Autonomous model retraining triggered by drift detection"
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Scheduled Retraining Jobs
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Model</TableCell>
                            <TableCell>Trigger</TableCell>
                            <TableCell>Scheduled</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>GPT-J-6B-Service</TableCell>
                            <TableCell>Data Drift</TableCell>
                            <TableCell>2025-08-01 08:00</TableCell>
                            <TableCell>
                              <Chip label="Scheduled" size="small" color="primary" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Llama-7B-Sales</TableCell>
                            <TableCell>Performance Drift</TableCell>
                            <TableCell>2025-08-02 12:00</TableCell>
                            <TableCell>
                              <Chip label="Scheduled" size="small" color="primary" />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Recent Retraining History
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Model</TableCell>
                            <TableCell>Completed</TableCell>
                            <TableCell>Improvement</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Mistral-7B-Automotive</TableCell>
                            <TableCell>2025-07-25 14:30</TableCell>
                            <TableCell>+3.2% accuracy</TableCell>
                            <TableCell>
                              <Chip label="Deployed" size="small" color="success" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Llama-7B-Sales</TableCell>
                            <TableCell>2025-07-15 09:45</TableCell>
                            <TableCell>+2.8% accuracy</TableCell>
                            <TableCell>
                              <Chip label="Deployed" size="small" color="success" />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              <Box p={2} display="flex" justifyContent="flex-end">
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<AutorenewIcon />}
                >
                  Configure Auto-Retraining
                </Button>
              </Box>
            </Card>
          </Grid>
          
          {/* Drift Monitoring Settings */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Drift Monitoring Settings" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Monitoring Frequency
                    </Typography>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Data Drift Check Frequency</InputLabel>
                      <Select
                        value="hourly"
                      >
                        <MenuItem value="hourly">Hourly</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Performance Drift Check Frequency</InputLabel>
                      <Select
                        value="daily"
                      >
                        <MenuItem value="hourly">Hourly</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Alert Thresholds
                    </Typography>
                    <FormControl fullWidth margin="normal">
                      <TextField
                        label="Data Drift Threshold"
                        type="number"
                        value="0.6"
                        helperText="Alert when drift score exceeds this value (0-1)"
                      />
                    </FormControl>
                    
                    <FormControl fullWidth margin="normal">
                      <TextField
                        label="Performance Drift Threshold (%)"
                        type="number"
                        value="10"
                        helperText="Alert when performance changes by this percentage"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              <Box p={2} display="flex" justifyContent="flex-end">
                <Button 
                  variant="contained" 
                  color="primary"
                >
                  Save Settings
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderCostOverview();
      case 1:
        return renderPerformanceMonitoring();
      case 2:
        return renderDriftDetection();
      default:
        return null;
    }
  };
  
  return (
    <Box className="cost-guard-dashboard">
      <Box className="dashboard-header" mb={3}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4">CostGuard Dashboard</Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Unified monitoring for training, fine-tuning, and inference
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" alignItems="center">
              <FormControl variant="outlined" size="small" sx={{ minWidth: 200, mr: 2 }}>
                <InputLabel>Model Filter</InputLabel>
                <Select
                  value={selectedModel}
                  onChange={handleModelChange}
                  label="Model Filter"
                >
                  <MenuItem value="all">All Models</MenuItem>
                  {mockModels.map(model => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Date Range"
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange(e.target.value, dateRange.end)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" sx={{ mr: 1 }}>to</Typography>
              <TextField
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange(dateRange.start, e.target.value)}
                size="small"
                sx={{ mr: 2 }}
              />
              
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 500);
                }}
              >
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {isLoading && <LinearProgress />}
      
      <Paper>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Cost Overview" icon={<TrendingDownIcon />} />
          <Tab label="Performance Monitoring" icon={<SpeedIcon />} />
          <Tab label="Drift Detection" icon={<NotificationsIcon />} />
        </Tabs>
        
        <Box p={3}>
          {renderTabContent()}
        </Box>
      </Paper>
      
      {/* Drift Alert Dialog */}
      <Dialog
        open={driftDialogOpen}
        onClose={() => setDriftDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedDrift && (
          <>
            <DialogTitle>
              Drift Alert: {selectedDrift.model_name}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert severity={
                    selectedDrift.severity === 'high' ? 'error' : 
                    selectedDrift.severity === 'medium' ? 'warning' : 'info'
                  }>
                    {selectedDrift.description}
                  </Alert>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Alert Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Model</strong></TableCell>
                          <TableCell>{selectedDrift.model_name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell>{selectedDrift.type.replace('_', ' ')}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Severity</strong></TableCell>
                          <TableCell>
                            <Chip 
                              label={selectedDrift.severity} 
                              size="small"
                              style={{ backgroundColor: getSeverityColor(selectedDrift.severity), color: 'white' }}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Detected</strong></TableCell>
                          <TableCell>{new Date(selectedDrift.detected_at).toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell>
                            <Chip 
                              label={selectedDrift.status} 
                              color={selectedDrift.status === 'open' ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Metrics
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        {Object.entries(selectedDrift.metrics).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell><strong>{key.replace('_', ' ')}</strong></TableCell>
                            <TableCell>{value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Recommended Action
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body1">
                      {selectedDrift.recommended_action}
                    </Typography>
                  </Paper>
                </Grid>
                
                {selectedDrift.resolution && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Resolution
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body1">
                        {selectedDrift.resolution}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedDrift.status === 'open' && (
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<AutorenewIcon />}
                >
                  Schedule Retraining
                </Button>
              )}
              <Button onClick={() => setDriftDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Optimization Dialog */}
      <Dialog
        open={optimizationDialogOpen}
        onClose={() => setOptimizationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOptimization && (
          <>
            <DialogTitle>
              Optimization: {selectedOptimization.type.replace('_', ' ')}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert severity="info">
                    {selectedOptimization.description}
                  </Alert>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Optimization Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Model</strong></TableCell>
                          <TableCell>{selectedOptimization.model_name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell>{selectedOptimization.type.replace('_', ' ')}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Complexity</strong></TableCell>
                          <TableCell>
                            <Chip 
                              label={selectedOptimization.complexity} 
                              size="small"
                              style={{ backgroundColor: getComplexityColor(selectedOptimization.complexity), color: 'white' }}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell>
                            <Chip 
                              label={selectedOptimization.status.replace('_', ' ')} 
                              size="small"
                              style={{ backgroundColor: getOptimizationStatusColor(selectedOptimization.status), color: 'white' }}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Estimated Impact
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Monthly Savings</strong></TableCell>
                          <TableCell>${selectedOptimization.estimated_savings.monthly}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Savings Percentage</strong></TableCell>
                          <TableCell>{selectedOptimization.estimated_savings.percentage}%</TableCell>
                        </TableRow>
                        {Object.entries(selectedOptimization.estimated_impact).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell><strong>{key.replace('_', ' ')}</strong></TableCell>
                            <TableCell>{value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Implementation Steps
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {selectedOptimization.type === 'quantization' && (
                      <ol>
                        <li>Create a test environment for the quantized model</li>
                        <li>Convert model to INT3 format using TensorRT</li>
                        <li>Run accuracy benchmarks on test dataset</li>
                        <li>Run performance benchmarks (latency, throughput)</li>
                        <li>If benchmarks meet criteria, deploy to staging</li>
                        <li>Monitor performance in staging for 24 hours</li>
                        <li>Deploy to production with gradual traffic shift</li>
                      </ol>
                    )}
                    
                    {selectedOptimization.type === 'caching' && (
                      <ol>
                        <li>Analyze query patterns to identify frequently asked questions</li>
                        <li>Implement Redis cache with appropriate TTL settings</li>
                        <li>Modify inference endpoint to check cache before model execution</li>
                        <li>Add cache hit/miss metrics to monitoring dashboard</li>
                        <li>Deploy to staging environment</li>
                        <li>Tune cache parameters based on hit rate</li>
                        <li>Deploy to production with monitoring</li>
                      </ol>
                    )}
                    
                    {selectedOptimization.type === 'distillation' && (
                      <ol>
                        <li>Collect representative dataset of service queries</li>
                        <li>Train teacher-student model using knowledge distillation</li>
                        <li>Optimize student model architecture (1.5B parameters)</li>
                        <li>Evaluate accuracy against original model</li>
                        <li>Implement routing logic to direct appropriate queries to distilled model</li>
                        <li>Deploy with A/B testing framework</li>
                        <li>Gradually increase traffic to distilled model</li>
                      </ol>
                    )}
                    
                    {selectedOptimization.type === 'autoscaling' && (
                      <ol>
                        <li>Analyze traffic patterns to identify peak and low usage periods</li>
                        <li>Configure time-based autoscaling rules in Kubernetes</li>
                        <li>Set minimum instance counts for each period</li>
                        <li>Implement graceful scaling procedures</li>
                        <li>Add monitoring for scaling events</li>
                        <li>Test scaling behavior in staging environment</li>
                        <li>Deploy to production with alerts for unexpected scaling events</li>
                      </ol>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedOptimization.status === 'recommended' && (
                <Button 
                  variant="contained" 
                  color="primary"
                >
                  Implement Optimization
                </Button>
              )}
              <Button onClick={() => setOptimizationDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default CostGuardDashboard;