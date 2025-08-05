import React, { useState } from 'react';
import Layout from '../components/Layout';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Rating,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import MemoryIcon from '@mui/icons-material/Memory';
import SettingsIcon from '@mui/icons-material/Settings';
import CompareIcon from '@mui/icons-material/Compare';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`model-tabpanel-${index}`}
      aria-labelledby={`model-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `model-tab-${index}`,
    'aria-controls': `model-tabpanel-${index}`,
  };
}

// Sample model data
const models = [
  {
    id: 1,
    name: 'Service Advisor Model',
    description: 'Specialized model for automotive service advising',
    baseModel: 'Mistral-7B',
    type: 'QLoRA',
    size: '4.2 GB',
    created: '2025-07-25',
    lastModified: '2025-08-01',
    status: 'Deployed',
    metrics: {
      accuracy: 0.92,
      f1: 0.89,
      precision: 0.91,
      recall: 0.87,
    },
    tags: ['automotive', 'service', 'advisor'],
    favorite: true,
  },
  {
    id: 2,
    name: 'Sales Assistant Model',
    description: 'Specialized model for automotive sales assistance',
    baseModel: 'Llama-7B',
    type: 'QLoRA',
    size: '4.0 GB',
    created: '2025-07-20',
    lastModified: '2025-07-28',
    status: 'Deployed',
    metrics: {
      accuracy: 0.89,
      f1: 0.87,
      precision: 0.88,
      recall: 0.86,
    },
    tags: ['automotive', 'sales', 'assistant'],
    favorite: false,
  },
  {
    id: 3,
    name: 'Parts Inventory Model',
    description: 'Specialized model for parts inventory management',
    baseModel: 'Mistral-7B',
    type: 'QLoRA',
    size: '4.1 GB',
    created: '2025-07-15',
    lastModified: '2025-07-22',
    status: 'Deployed',
    metrics: {
      accuracy: 0.94,
      f1: 0.92,
      precision: 0.93,
      recall: 0.91,
    },
    tags: ['automotive', 'parts', 'inventory'],
    favorite: true,
  },
  {
    id: 4,
    name: 'Customer Support Model',
    description: 'Specialized model for customer support',
    baseModel: 'Llama-13B',
    type: 'QLoRA',
    size: '6.5 GB',
    created: '2025-07-10',
    lastModified: '2025-07-18',
    status: 'Training',
    metrics: {
      accuracy: 0.85,
      f1: 0.83,
      precision: 0.84,
      recall: 0.82,
    },
    tags: ['automotive', 'customer', 'support'],
    favorite: false,
  },
  {
    id: 5,
    name: 'Dealership Operations Model',
    description: 'Specialized model for dealership operations',
    baseModel: 'Mistral-7B',
    type: 'QLoRA',
    size: '4.3 GB',
    created: '2025-07-05',
    lastModified: '2025-07-12',
    status: 'Ready',
    metrics: {
      accuracy: 0.91,
      f1: 0.88,
      precision: 0.90,
      recall: 0.86,
    },
    tags: ['automotive', 'dealership', 'operations'],
    favorite: false,
  },
];

// Sample vertical kits
const verticalKits = [
  {
    id: 1,
    name: 'Automotive Dealership Kit',
    description: 'Complete kit for automotive dealership operations',
    models: ['Service Advisor Model', 'Sales Assistant Model', 'Parts Inventory Model'],
    templates: ['Service Advisor', 'Sales Assistant', 'Parts Inventory', 'Dealership Operations'],
    datasets: ['Service Records', 'Sales Conversations', 'Parts Inventory', 'Customer Feedback'],
    rating: 4.8,
    downloads: 1250,
    lastUpdated: '2025-08-01',
  },
  {
    id: 2,
    name: 'Automotive Service Kit',
    description: 'Specialized kit for automotive service departments',
    models: ['Service Advisor Model'],
    templates: ['Service Advisor', 'Maintenance Scheduler'],
    datasets: ['Service Records', 'Maintenance Procedures'],
    rating: 4.6,
    downloads: 980,
    lastUpdated: '2025-07-25',
  },
  {
    id: 3,
    name: 'Automotive Sales Kit',
    description: 'Specialized kit for automotive sales departments',
    models: ['Sales Assistant Model'],
    templates: ['Sales Assistant', 'Lead Management'],
    datasets: ['Sales Conversations', 'Customer Interactions'],
    rating: 4.5,
    downloads: 850,
    lastUpdated: '2025-07-20',
  },
];

// Sample training jobs
const trainingJobs = [
  {
    id: 1,
    name: 'Customer Support Model Training',
    model: 'Customer Support Model',
    dataset: 'Customer Support Conversations',
    status: 'In Progress',
    progress: 65,
    startTime: '2025-08-02 09:30:00',
    estimatedEndTime: '2025-08-02 14:30:00',
    epochs: '3/5',
    learningRate: '2e-5',
    batchSize: 8,
  },
  {
    id: 2,
    name: 'Sales Assistant Model Fine-tuning',
    model: 'Sales Assistant Model',
    dataset: 'Sales Conversations',
    status: 'Completed',
    progress: 100,
    startTime: '2025-08-01 14:00:00',
    estimatedEndTime: '2025-08-01 18:30:00',
    epochs: '5/5',
    learningRate: '3e-5',
    batchSize: 16,
  },
  {
    id: 3,
    name: 'Parts Inventory Model Update',
    model: 'Parts Inventory Model',
    dataset: 'Parts Inventory',
    status: 'Queued',
    progress: 0,
    startTime: 'Pending',
    estimatedEndTime: 'Unknown',
    epochs: '0/3',
    learningRate: '2e-5',
    batchSize: 8,
  },
];

export default function ModelGallery() {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [trainDialogOpen, setTrainDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [favorites, setFavorites] = useState<number[]>(models.filter(model => model.favorite).map(model => model.id));

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTrainDialogOpen = () => {
    setTrainDialogOpen(true);
  };

  const handleTrainDialogClose = () => {
    setTrainDialogOpen(false);
  };

  const handleDeployDialogOpen = () => {
    setDeployDialogOpen(true);
  };

  const handleDeployDialogClose = () => {
    setDeployDialogOpen(false);
  };

  const handleModelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedModel(event.target.value as string);
  };

  const handleDatasetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedDataset(event.target.value as string);
  };

  const toggleFavorite = (modelId: number) => {
    if (favorites.includes(modelId)) {
      setFavorites(favorites.filter(id => id !== modelId));
    } else {
      setFavorites([...favorites, modelId]);
    }
  };

  // Filter models based on search query
  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter vertical kits based on search query
  const filteredKits = verticalKits.filter(
    (kit) =>
      kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Model Gallery">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="model gallery tabs">
            <Tab label="Models" {...a11yProps(0)} />
            <Tab label="Vertical Kits" {...a11yProps(1)} />
            <Tab label="Training" {...a11yProps(2)} />
          </Tabs>
        </Box>

        {/* Models Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <TextField
              placeholder="Search models..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: '40%' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mr: 1 }}
                onClick={handleTrainDialogOpen}
              >
                Train Model
              </Button>
              <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={handleDeployDialogOpen}>
                Deploy Model
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {filteredModels.map((model) => (
              <Grid item xs={12} md={6} lg={4} key={model.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ModelTrainingIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="div">
                          {model.name}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => toggleFavorite(model.id)}
                      >
                        {favorites.includes(model.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {model.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Base: {model.baseModel}</Typography>
                      <Typography variant="body2">Type: {model.type}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Size: {model.size}</Typography>
                      <Typography variant="body2">
                        Status:{' '}
                        <Chip
                          label={model.status}
                          size="small"
                          color={
                            model.status === 'Deployed'
                              ? 'success'
                              : model.status === 'Ready'
                              ? 'primary'
                              : 'warning'
                          }
                        />
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" display="block">
                          Accuracy
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={model.metrics.accuracy * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" display="block">
                          F1 Score
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={model.metrics.f1 * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                      {model.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<VisibilityIcon />}>
                      Details
                    </Button>
                    <Button size="small" startIcon={<CloudDownloadIcon />}>
                      Download
                    </Button>
                    <Button size="small" startIcon={<PlayArrowIcon />}>
                      Deploy
                    </Button>
                    <Button size="small" startIcon={<CompareIcon />}>
                      Compare
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Vertical Kits Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <TextField
              placeholder="Search vertical kits..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: '40%' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Kit
            </Button>
          </Box>

          <Grid container spacing={3}>
            {filteredKits.map((kit) => (
              <Grid item xs={12} key={kit.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MemoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="div">
                          {kit.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={kit.rating} precision={0.1} readOnly size="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          ({kit.rating})
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {kit.description}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Models
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 1 }}>
                          {kit.models.map((model, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <ModelTrainingIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                              <Typography variant="body2">{model}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Templates
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 1 }}>
                          {kit.templates.map((template, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <SettingsIcon fontSize="small" sx={{ mr: 1, color: 'secondary.main' }} />
                              <Typography variant="body2">{template}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Datasets
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 1 }}>
                          {kit.datasets.map((dataset, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                              <StorageIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                              <Typography variant="body2">{dataset}</Typography>
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated: {kit.lastUpdated}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Downloads: {kit.downloads}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<VisibilityIcon />}>
                      View Details
                    </Button>
                    <Button size="small" startIcon={<CloudDownloadIcon />}>
                      Download Kit
                    </Button>
                    <Button size="small" startIcon={<PlayArrowIcon />}>
                      Deploy Kit
                    </Button>
                    <Button size="small" startIcon={<ShareIcon />}>
                      Share
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Training Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Model Training Jobs</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleTrainDialogOpen}>
              New Training Job
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="training jobs table">
              <TableHead>
                <TableRow>
                  <TableCell>Job Name</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Dataset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Est. End Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trainingJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.name}</TableCell>
                    <TableCell>{job.model}</TableCell>
                    <TableCell>{job.dataset}</TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        size="small"
                        color={
                          job.status === 'Completed'
                            ? 'success'
                            : job.status === 'In Progress'
                            ? 'primary'
                            : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={job.progress}
                            color={
                              job.status === 'Completed'
                                ? 'success'
                                : job.status === 'In Progress'
                                ? 'primary'
                                : 'secondary'
                            }
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">{`${Math.round(
                            job.progress
                          )}%`}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{job.startTime}</TableCell>
                    <TableCell>{job.estimatedEndTime}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {job.status === 'In Progress' && (
                        <IconButton size="small" color="error">
                          <StopIcon fontSize="small" />
                        </IconButton>
                      )}
                      {job.status === 'Completed' && (
                        <IconButton size="small" color="success">
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Training Resources
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    GPU Utilization
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={78}
                        color="primary"
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">78%</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Memory Utilization
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={65}
                        color="secondary"
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">65%</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Queue Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={25}
                        color="info"
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">1/4</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Box>

      {/* Train Model Dialog */}
      <Dialog open={trainDialogOpen} onClose={handleTrainDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Train New Model</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField label="Job Name" variant="outlined" fullWidth margin="normal" />
              <FormControl fullWidth margin="normal">
                <InputLabel>Base Model</InputLabel>
                <Select label="Base Model">
                  <MenuItem value="mistral-7b">Mistral-7B</MenuItem>
                  <MenuItem value="llama-7b">Llama-7B</MenuItem>
                  <MenuItem value="llama-13b">Llama-13B</MenuItem>
                  <MenuItem value="phi-2">Phi-2</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Dataset</InputLabel>
                <Select value={selectedDataset} onChange={handleDatasetChange} label="Dataset">
                  <MenuItem value="service_records">Service Records</MenuItem>
                  <MenuItem value="sales_conversations">Sales Conversations</MenuItem>
                  <MenuItem value="parts_inventory">Parts Inventory</MenuItem>
                  <MenuItem value="customer_feedback">Customer Feedback</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Training Method</InputLabel>
                <Select label="Training Method">
                  <MenuItem value="qlora">QLoRA</MenuItem>
                  <MenuItem value="lora">LoRA</MenuItem>
                  <MenuItem value="full">Full Fine-tuning</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Training Parameters
              </Typography>
              <TextField
                label="Learning Rate"
                variant="outlined"
                fullWidth
                margin="normal"
                defaultValue="2e-5"
              />
              <TextField label="Epochs" variant="outlined" fullWidth margin="normal" defaultValue="3" />
              <TextField label="Batch Size" variant="outlined" fullWidth margin="normal" defaultValue="8" />
              <TextField
                label="LoRA Rank"
                variant="outlined"
                fullWidth
                margin="normal"
                defaultValue="16"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Advanced Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="LoRA Alpha"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    defaultValue="32"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="LoRA Dropout"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    defaultValue="0.05"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Weight Decay"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    defaultValue="0.01"
                  />
                </Grid>
              </Grid>
              <TextField
                label="Tags (comma separated)"
                variant="outlined"
                fullWidth
                margin="normal"
                placeholder="automotive, service, advisor"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTrainDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleTrainDialogClose}>
            Start Training
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deploy Model Dialog */}
      <Dialog open={deployDialogOpen} onClose={handleDeployDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Deploy Model</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Model</InputLabel>
              <Select value={selectedModel} onChange={handleModelChange} label="Model">
                {models
                  .filter((model) => model.status === 'Ready')
                  .map((model) => (
                    <MenuItem key={model.id} value={model.name}>
                      {model.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Deployment Type</InputLabel>
              <Select label="Deployment Type">
                <MenuItem value="vllm">vLLM</MenuItem>
                <MenuItem value="triton">Triton</MenuItem>
                <MenuItem value="tgi">Text Generation Inference</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Quantization</InputLabel>
              <Select label="Quantization">
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="int8">INT8</MenuItem>
                <MenuItem value="int4">INT4</MenuItem>
                <MenuItem value="gptq">GPTQ</MenuItem>
                <MenuItem value="awq">AWQ</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Instance Type</InputLabel>
              <Select label="Instance Type">
                <MenuItem value="g4dn.xlarge">g4dn.xlarge</MenuItem>
                <MenuItem value="g5.xlarge">g5.xlarge</MenuItem>
                <MenuItem value="p3.2xlarge">p3.2xlarge</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Scaling Policy</InputLabel>
              <Select label="Scaling Policy">
                <MenuItem value="request-count-based">Request Count Based</MenuItem>
                <MenuItem value="latency-based">Latency Based</MenuItem>
                <MenuItem value="none">None</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeployDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleDeployDialogClose}>
            Deploy
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}