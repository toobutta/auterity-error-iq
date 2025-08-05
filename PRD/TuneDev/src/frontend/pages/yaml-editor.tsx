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
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

// Mock Monaco Editor component
const MonacoEditor = ({ value, onChange, language, theme, options }: any) => {
  return (
    <TextField
      multiline
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      variant="outlined"
      InputProps={{
        style: {
          fontFamily: 'monospace',
          fontSize: '14px',
          backgroundColor: theme === 'vs-dark' ? '#1e1e1e' : '#ffffff',
          color: theme === 'vs-dark' ? '#d4d4d4' : '#000000',
          height: '70vh',
        },
      }}
    />
  );
};

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
      id={`yaml-tabpanel-${index}`}
      aria-labelledby={`yaml-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `yaml-tab-${index}`,
    'aria-controls': `yaml-tabpanel-${index}`,
  };
}

// Sample YAML templates
const yamlTemplates = [
  {
    id: 1,
    name: 'Service Advisor Template',
    description: 'Template for service advisor model training and deployment',
    category: 'Automotive',
    lastModified: '2025-08-01',
    content: `metadata:
  name: "service_advisor"
  description: "Template for automotive service advising"
  category: "automotive"
  version: "1.0.0"
  author: "TuneDev"
  created_date: "2025-08-01"
  updated_date: "2025-08-01"
  tags:
    - "automotive"
    - "service"
    - "advisor"

template:
  task: "vertical-tune"
  vertical: "automotive"
  specialization: "service_advisor"
  model: "\${model}"
  method: "\${method}"
  dataset: "\${dataset}"
  parameters:
    epochs: "\${epochs}"
    learning_rate: "\${learning_rate}"
    batch_size: "\${batch_size}"
    lora_r: "\${lora_r}"
    lora_alpha: "\${lora_alpha}"
    lora_dropout: "\${lora_dropout}"
  evaluation:
    metrics: "\${metrics}"
    test_split: "\${test_split}"
  output:
    dir: "\${output_dir}"
    format: "\${output_format}"
  deployment:
    endpoint_type: "\${endpoint_type}"
    quantization: "\${quantization}"
    instance_type: "\${instance_type}"

example:
  task: "vertical-tune"
  vertical: "automotive"
  specialization: "service_advisor"
  model: "mistral-7b"
  method: "QLoRA"
  dataset: "./datasets/service_records.jsonl"
  parameters:
    epochs: 3
    learning_rate: 2e-4
    batch_size: 8
    lora_r: 16
    lora_alpha: 32
    lora_dropout: 0.05
  evaluation:
    metrics: ["accuracy", "f1"]
    test_split: 0.1
  output:
    dir: "./checkpoints/mistral-service-advisor"
    format: "safetensors"
  deployment:
    endpoint_type: "vllm"
    quantization: "int8"
    instance_type: "g4dn.xlarge"`,
  },
  {
    id: 2,
    name: 'Sales Assistant Template',
    description: 'Template for sales assistant model training and deployment',
    category: 'Automotive',
    lastModified: '2025-07-28',
    content: `metadata:
  name: "sales_assistant"
  description: "Template for automotive sales assistance"
  category: "automotive"
  version: "1.0.0"
  author: "TuneDev"
  created_date: "2025-07-25"
  updated_date: "2025-07-28"
  tags:
    - "automotive"
    - "sales"
    - "assistant"

template:
  task: "vertical-tune"
  vertical: "automotive"
  specialization: "sales_assistant"
  model: "\${model}"
  method: "\${method}"
  dataset: "\${dataset}"
  parameters:
    epochs: "\${epochs}"
    learning_rate: "\${learning_rate}"
    batch_size: "\${batch_size}"
    lora_r: "\${lora_r}"
    lora_alpha: "\${lora_alpha}"
    lora_dropout: "\${lora_dropout}"
  evaluation:
    metrics: "\${metrics}"
    test_split: "\${test_split}"
  output:
    dir: "\${output_dir}"
    format: "\${output_format}"
  deployment:
    endpoint_type: "\${endpoint_type}"
    quantization: "\${quantization}"
    instance_type: "\${instance_type}"

example:
  task: "vertical-tune"
  vertical: "automotive"
  specialization: "sales_assistant"
  model: "llama-7b"
  method: "QLoRA"
  dataset: "./datasets/sales_conversations.jsonl"
  parameters:
    epochs: 3
    learning_rate: 2e-4
    batch_size: 8
    lora_r: 16
    lora_alpha: 32
    lora_dropout: 0.05
  evaluation:
    metrics: ["accuracy", "f1", "rouge"]
    test_split: 0.1
  output:
    dir: "./checkpoints/llama-sales-assistant"
    format: "safetensors"
  deployment:
    endpoint_type: "vllm"
    quantization: "int8"
    instance_type: "g4dn.xlarge"`,
  },
  {
    id: 3,
    name: 'Parts Inventory Template',
    description: 'Template for parts inventory model training and deployment',
    category: 'Automotive',
    lastModified: '2025-07-20',
    content: `metadata:
  name: "parts_inventory"
  description: "Template for automotive parts inventory management"
  category: "automotive"
  version: "1.0.0"
  author: "TuneDev"
  created_date: "2025-07-15"
  updated_date: "2025-07-20"
  tags:
    - "automotive"
    - "parts"
    - "inventory"

template:
  task: "vertical-tune"
  vertical: "automotive"
  specialization: "parts_inventory"
  model: "\${model}"
  method: "\${method}"
  dataset: "\${dataset}"
  parameters:
    epochs: "\${epochs}"
    learning_rate: "\${learning_rate}"
    batch_size: "\${batch_size}"
    lora_r: "\${lora_r}"
    lora_alpha: "\${lora_alpha}"
    lora_dropout: "\${lora_dropout}"
  evaluation:
    metrics: "\${metrics}"
    test_split: "\${test_split}"
  output:
    dir: "\${output_dir}"
    format: "\${output_format}"
  deployment:
    endpoint_type: "\${endpoint_type}"
    quantization: "\${quantization}"
    instance_type: "\${instance_type}"

example:
  task: "vertical-tune"
  vertical: "automotive"
  specialization: "parts_inventory"
  model: "mistral-7b"
  method: "QLoRA"
  dataset: "./datasets/parts_inventory.jsonl"
  parameters:
    epochs: 3
    learning_rate: 2e-4
    batch_size: 8
    lora_r: 16
    lora_alpha: 32
    lora_dropout: 0.05
  evaluation:
    metrics: ["accuracy", "f1", "precision", "recall"]
    test_split: 0.1
  output:
    dir: "./checkpoints/mistral-parts-inventory"
    format: "safetensors"
  deployment:
    endpoint_type: "vllm"
    quantization: "int8"
    instance_type: "g4dn.xlarge"`,
  },
];

// Sample validation results
const validationResults = [
  {
    type: 'error',
    message: 'Required field "model" is missing',
    line: 12,
  },
  {
    type: 'warning',
    message: 'Value for learning_rate is outside recommended range',
    line: 15,
  },
  {
    type: 'info',
    message: 'Consider adding more evaluation metrics for better model assessment',
    line: 20,
  },
];

export default function YamlEditor() {
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorContent, setEditorContent] = useState(yamlTemplates[0].content);
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [editorTheme, setEditorTheme] = useState<string>('vs');
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTemplateSelect = (templateId: number) => {
    const template = yamlTemplates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setEditorContent(template.content);
    }
  };

  const handleEditorChange = (value: string) => {
    setEditorContent(value);
  };

  const handleThemeToggle = () => {
    setEditorTheme(editorTheme === 'vs' ? 'vs-dark' : 'vs');
  };

  const handleNewTemplateDialogOpen = () => {
    setNewTemplateDialogOpen(true);
  };

  const handleNewTemplateDialogClose = () => {
    setNewTemplateDialogOpen(false);
  };

  const handleTemplateNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateName(event.target.value);
  };

  const handleTemplateCategoryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTemplateCategory(event.target.value as string);
  };

  const handleCreateTemplate = () => {
    // Logic to create a new template would go here
    handleNewTemplateDialogClose();
  };

  // Filter templates based on search query
  const filteredTemplates = yamlTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="YAML Editor">
      <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
        {/* Left sidebar - Templates */}
        <Paper
          sx={{
            width: 300,
            p: 2,
            mr: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Templates</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleNewTemplateDialogOpen}
            >
              New
            </Button>
          </Box>
          <TextField
            placeholder="Search templates..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {filteredTemplates.map((template) => (
              <ListItem
                key={template.id}
                button
                selected={selectedTemplate === template.id}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <ListItemIcon>
                  <DescriptionIcon color={selectedTemplate === template.id ? 'primary' : 'inherit'} />
                </ListItemIcon>
                <ListItemText
                  primary={template.name}
                  secondary={
                    <>
                      <Typography variant="body2" component="span" color="text.secondary">
                        {template.category}
                      </Typography>
                      <br />
                      <Typography variant="caption" component="span" color="text.secondary">
                        Last modified: {template.lastModified}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Main editor area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="yaml editor tabs">
              <Tab label="Editor" {...a11yProps(0)} />
              <Tab label="Preview" {...a11yProps(1)} />
              <Tab label="Validation" {...a11yProps(2)} />
            </Tabs>
          </Box>

          {/* Editor Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Button variant="contained" startIcon={<SaveIcon />} sx={{ mr: 1 }}>
                  Save
                </Button>
                <Button variant="outlined" startIcon={<PlayArrowIcon />} sx={{ mr: 1 }}>
                  Validate
                </Button>
                <Button variant="outlined" startIcon={<DownloadIcon />}>
                  Download
                </Button>
              </Box>
              <Box>
                <Button variant="outlined" onClick={handleThemeToggle}>
                  {editorTheme === 'vs' ? 'Dark Theme' : 'Light Theme'}
                </Button>
              </Box>
            </Box>
            <MonacoEditor
              value={editorContent}
              onChange={handleEditorChange}
              language="yaml"
              theme={editorTheme}
              options={{
                selectOnLineNumbers: true,
                roundedSelection: false,
                readOnly: false,
                cursorStyle: 'line',
                automaticLayout: true,
              }}
            />
          </TabPanel>

          {/* Preview Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Template Preview
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Metadata
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" component="div">
                          <strong>Name:</strong> service_advisor
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Description:</strong> Template for automotive service advising
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Category:</strong> automotive
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Version:</strong> 1.0.0
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Author:</strong> TuneDev
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip label="automotive" size="small" />
                        <Chip label="service" size="small" />
                        <Chip label="advisor" size="small" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Configuration
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" component="div">
                          <strong>Task:</strong> vertical-tune
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Vertical:</strong> automotive
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Specialization:</strong> service_advisor
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Model:</strong> mistral-7b
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Method:</strong> QLoRA
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Parameters
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" component="div">
                            <strong>Epochs:</strong> 3
                          </Typography>
                          <Typography variant="body2" component="div">
                            <strong>Learning Rate:</strong> 2e-4
                          </Typography>
                          <Typography variant="body2" component="div">
                            <strong>Batch Size:</strong> 8
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" component="div">
                            <strong>LoRA R:</strong> 16
                          </Typography>
                          <Typography variant="body2" component="div">
                            <strong>LoRA Alpha:</strong> 32
                          </Typography>
                          <Typography variant="body2" component="div">
                            <strong>LoRA Dropout:</strong> 0.05
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" component="div">
                            <strong>Metrics:</strong> accuracy, f1
                          </Typography>
                          <Typography variant="body2" component="div">
                            <strong>Test Split:</strong> 0.1
                          </Typography>
                          <Typography variant="body2" component="div">
                            <strong>Output Format:</strong> safetensors
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Deployment
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" component="div">
                            <strong>Endpoint Type:</strong> vllm
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" component="div">
                            <strong>Quantization:</strong> int8
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" component="div">
                            <strong>Instance Type:</strong> g4dn.xlarge
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<PlayArrowIcon />}>
                        Deploy
                      </Button>
                      <Button size="small" startIcon={<ContentCopyIcon />}>
                        Copy Config
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          {/* Validation Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Validation Results
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {validationResults.map((result, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {result.type === 'error' && <ErrorIcon color="error" />}
                      {result.type === 'warning' && <WarningIcon color="warning" />}
                      {result.type === 'info' && <InfoIcon color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={result.message}
                      secondary={`Line ${result.line}`}
                      primaryTypographyProps={{
                        color:
                          result.type === 'error'
                            ? 'error'
                            : result.type === 'warning'
                            ? 'warning.main'
                            : 'info.main',
                      }}
                    />
                  </ListItem>
                ))}
                {validationResults.length === 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="No validation issues found"
                      primaryTypographyProps={{ color: 'success.main' }}
                    />
                  </ListItem>
                )}
              </List>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Schema Validation
              </Typography>
              <Card sx={{ mb: 2, bgcolor: 'success.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body1" color="success.contrastText">
                      Template schema is valid
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              <Typography variant="h6" gutterBottom>
                Best Practices
              </Typography>
              <Card sx={{ mb: 2, bgcolor: 'info.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="body1" color="info.contrastText">
                      Consider adding more evaluation metrics for comprehensive model assessment
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>
        </Box>
      </Box>

      {/* New Template Dialog */}
      <Dialog open={newTemplateDialogOpen} onClose={handleNewTemplateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Template</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Template Name"
              variant="outlined"
              fullWidth
              margin="normal"
              value={templateName}
              onChange={handleTemplateNameChange}
            />
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select value={templateCategory} onChange={handleTemplateCategoryChange} label="Category">
                <MenuItem value="automotive">Automotive</MenuItem>
                <MenuItem value="healthcare">Healthcare</MenuItem>
                <MenuItem value="finance">Finance</MenuItem>
                <MenuItem value="legal">Legal</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Base Template</InputLabel>
              <Select label="Base Template">
                <MenuItem value="service_advisor">Service Advisor Template</MenuItem>
                <MenuItem value="sales_assistant">Sales Assistant Template</MenuItem>
                <MenuItem value="parts_inventory">Parts Inventory Template</MenuItem>
                <MenuItem value="blank">Blank Template</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewTemplateDialogClose}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTemplate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}