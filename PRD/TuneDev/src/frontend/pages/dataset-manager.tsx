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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import StorageIcon from '@mui/icons-material/Storage';
import AutorenewIcon from '@mui/icons-material/Autorenew';

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
      id={`dataset-tabpanel-${index}`}
      aria-labelledby={`dataset-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `dataset-tab-${index}`,
    'aria-controls': `dataset-tabpanel-${index}`,
  };
}

// Sample dataset data
const datasets = [
  {
    id: 1,
    name: 'Service Records',
    description: 'Automotive service records for training service advisor models',
    type: 'JSONL',
    size: '1.2 GB',
    records: 10000,
    created: '2025-07-15',
    lastModified: '2025-08-01',
    status: 'Ready',
    tags: ['automotive', 'service', 'maintenance'],
  },
  {
    id: 2,
    name: 'Sales Conversations',
    description: 'Transcripts of sales conversations for training sales assistant models',
    type: 'JSONL',
    size: '850 MB',
    records: 7500,
    created: '2025-07-10',
    lastModified: '2025-07-28',
    status: 'Ready',
    tags: ['automotive', 'sales', 'conversations'],
  },
  {
    id: 3,
    name: 'Parts Inventory',
    description: 'Parts inventory data for training parts inventory models',
    type: 'CSV',
    size: '500 MB',
    records: 25000,
    created: '2025-07-05',
    lastModified: '2025-07-20',
    status: 'Ready',
    tags: ['automotive', 'parts', 'inventory'],
  },
  {
    id: 4,
    name: 'Customer Feedback',
    description: 'Customer feedback data for sentiment analysis',
    type: 'JSONL',
    size: '300 MB',
    records: 5000,
    created: '2025-07-01',
    lastModified: '2025-07-15',
    status: 'Processing',
    tags: ['automotive', 'feedback', 'sentiment'],
  },
  {
    id: 5,
    name: 'Vehicle Specifications',
    description: 'Vehicle specifications data for reference',
    type: 'CSV',
    size: '200 MB',
    records: 15000,
    created: '2025-06-25',
    lastModified: '2025-07-10',
    status: 'Ready',
    tags: ['automotive', 'vehicles', 'specifications'],
  },
];

// Sample refinement operations
const refinementOperations = [
  {
    id: 1,
    name: 'Service Records Cleaning',
    dataset: 'Service Records',
    operation: 'Data Cleaning',
    status: 'Completed',
    progress: 100,
    startTime: '2025-08-01 10:30:00',
    endTime: '2025-08-01 11:15:00',
  },
  {
    id: 2,
    name: 'Sales Conversations Filtering',
    dataset: 'Sales Conversations',
    operation: 'Content Filtering',
    status: 'Completed',
    progress: 100,
    startTime: '2025-07-28 14:20:00',
    endTime: '2025-07-28 15:05:00',
  },
  {
    id: 3,
    name: 'Customer Feedback Processing',
    dataset: 'Customer Feedback',
    operation: 'Text Normalization',
    status: 'In Progress',
    progress: 65,
    startTime: '2025-08-02 09:45:00',
    endTime: null,
  },
  {
    id: 4,
    name: 'Parts Inventory Deduplication',
    dataset: 'Parts Inventory',
    operation: 'Deduplication',
    status: 'Queued',
    progress: 0,
    startTime: null,
    endTime: null,
  },
];

export default function DatasetManager() {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [refinementDialogOpen, setRefinementDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedOperation, setSelectedOperation] = useState<string>('');

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
  };

  const handleRefinementDialogOpen = () => {
    setRefinementDialogOpen(true);
  };

  const handleRefinementDialogClose = () => {
    setRefinementDialogOpen(false);
  };

  const handleDatasetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedDataset(event.target.value as string);
  };

  const handleOperationChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedOperation(event.target.value as string);
  };

  // Filter datasets based on search query
  const filteredDatasets = datasets.filter(
    (dataset) =>
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Layout title="Dataset Manager">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dataset manager tabs">
            <Tab label="Datasets" {...a11yProps(0)} />
            <Tab label="Refinement" {...a11yProps(1)} />
            <Tab label="Analytics" {...a11yProps(2)} />
          </Tabs>
        </Box>

        {/* Datasets Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <TextField
              placeholder="Search datasets..."
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
                onClick={handleUploadDialogOpen}
              >
                Upload Dataset
              </Button>
              <Button variant="outlined" startIcon={<AutorenewIcon />} onClick={handleRefinementDialogOpen}>
                Refine Dataset
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {filteredDatasets.map((dataset) => (
              <Grid item xs={12} md={6} lg={4} key={dataset.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="div">
                        {dataset.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {dataset.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Type: {dataset.type}</Typography>
                      <Typography variant="body2">Size: {dataset.size}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Records: {dataset.records.toLocaleString()}</Typography>
                      <Typography variant="body2">
                        Status:{' '}
                        <Chip
                          label={dataset.status}
                          size="small"
                          color={dataset.status === 'Ready' ? 'success' : 'warning'}
                        />
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
                      {dataset.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<VisibilityIcon />}>
                      Preview
                    </Button>
                    <Button size="small" startIcon={<DownloadIcon />}>
                      Download
                    </Button>
                    <Button size="small" startIcon={<EditIcon />}>
                      Edit
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteIcon />}>
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Refinement Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Dataset Refinement Operations</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleRefinementDialogOpen}>
              New Refinement
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="refinement operations table">
              <TableHead>
                <TableRow>
                  <TableCell>Operation Name</TableCell>
                  <TableCell>Dataset</TableCell>
                  <TableCell>Operation Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {refinementOperations.map((operation) => (
                  <TableRow key={operation.id}>
                    <TableCell>{operation.name}</TableCell>
                    <TableCell>{operation.dataset}</TableCell>
                    <TableCell>{operation.operation}</TableCell>
                    <TableCell>
                      <Chip
                        label={operation.status}
                        size="small"
                        color={
                          operation.status === 'Completed'
                            ? 'success'
                            : operation.status === 'In Progress'
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
                            value={operation.progress}
                            color={
                              operation.status === 'Completed'
                                ? 'success'
                                : operation.status === 'In Progress'
                                ? 'primary'
                                : 'secondary'
                            }
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">{`${Math.round(
                            operation.progress
                          )}%`}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{operation.startTime || 'N/A'}</TableCell>
                    <TableCell>{operation.endTime || 'N/A'}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {operation.status !== 'Completed' && (
                        <IconButton size="small" color="secondary">
                          <AutorenewIcon fontSize="small" />
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
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Dataset Distribution
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Chart visualization will be displayed here
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Dataset Growth
                </Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Chart visualization will be displayed here
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Dataset Quality Metrics
                </Typography>
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="dataset quality metrics table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Dataset</TableCell>
                        <TableCell>Completeness</TableCell>
                        <TableCell>Consistency</TableCell>
                        <TableCell>Accuracy</TableCell>
                        <TableCell>Timeliness</TableCell>
                        <TableCell>Overall Quality</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {datasets.map((dataset) => (
                        <TableRow key={dataset.id}>
                          <TableCell>{dataset.name}</TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={Math.random() * 30 + 70}
                              sx={{ height: 10, borderRadius: 5 }}
                            />
                          </TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={Math.random() * 30 + 70}
                              sx={{ height: 10, borderRadius: 5 }}
                            />
                          </TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={Math.random() * 30 + 70}
                              sx={{ height: 10, borderRadius: 5 }}
                            />
                          </TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={Math.random() * 30 + 70}
                              sx={{ height: 10, borderRadius: 5 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${Math.round(Math.random() * 10 + 85)}%`}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>

      {/* Upload Dataset Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Dataset</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField label="Dataset Name" variant="outlined" fullWidth margin="normal" />
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ py: 2, border: '1px dashed grey' }}
              >
                Upload File
                <input type="file" hidden />
              </Button>
            </Box>
            <TextField
              label="Tags (comma separated)"
              variant="outlined"
              fullWidth
              margin="normal"
              placeholder="automotive, service, maintenance"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleUploadDialogClose}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refinement Dialog */}
      <Dialog open={refinementDialogOpen} onClose={handleRefinementDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>New Dataset Refinement</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField label="Operation Name" variant="outlined" fullWidth margin="normal" />
            <FormControl fullWidth margin="normal">
              <InputLabel>Dataset</InputLabel>
              <Select value={selectedDataset} onChange={handleDatasetChange} label="Dataset">
                {datasets.map((dataset) => (
                  <MenuItem key={dataset.id} value={dataset.name}>
                    {dataset.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Operation Type</InputLabel>
              <Select value={selectedOperation} onChange={handleOperationChange} label="Operation Type">
                <MenuItem value="Data Cleaning">Data Cleaning</MenuItem>
                <MenuItem value="Content Filtering">Content Filtering</MenuItem>
                <MenuItem value="Text Normalization">Text Normalization</MenuItem>
                <MenuItem value="Deduplication">Deduplication</MenuItem>
                <MenuItem value="Format Conversion">Format Conversion</MenuItem>
                <MenuItem value="Data Augmentation">Data Augmentation</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Operation Parameters"
              variant="outlined"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              placeholder='{"threshold": 0.8, "method": "standard"}'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRefinementDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleRefinementDialogClose}>
            Start Refinement
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}