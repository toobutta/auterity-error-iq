/**
 * NeuroWeaver Template Gallery Component
 * Displays automotive templates with instantiation and comparison features
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Fab,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as InstantiateIcon,
  Compare as CompareIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Speed as PerformanceIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

import { apiClient } from "../utils/api";

interface AutomotiveTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  specialization: string;
  prompt_template: string;
  example_inputs: Array<Record<string, any>>;
  expected_outputs: string[];
  parameters: Record<string, any>;
  created_at: string;
  updated_at: string;
  version: string;
  is_active: boolean;
}

interface TemplateInstantiation {
  template_id: string;
  inputs: Record<string, any>;
  parameters: Record<string, any>;
}

export const TemplateGallery: React.FC = () => {
  const [templates, setTemplates] = useState<AutomotiveTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<
    AutomotiveTemplate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [specializationFilter, setSpecializationFilter] =
    useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dialog states
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    template: AutomotiveTemplate | null;
  }>({
    open: false,
    template: null,
  });
  const [instantiateDialog, setInstantiateDialog] = useState<{
    open: boolean;
    template: AutomotiveTemplate | null;
  }>({
    open: false,
    template: null,
  });
  const [compareDialog, setCompareDialog] = useState<{
    open: boolean;
    templates: AutomotiveTemplate[];
  }>({
    open: false,
    templates: [],
  });

  // Instantiation state
  const [instantiationInputs, setInstantiationInputs] = useState<
    Record<string, any>
  >({});
  const [instantiationResult, setInstantiationResult] = useState<string | null>(
    null,
  );
  const [instantiating, setInstantiating] = useState(false);

  // Comparison state
  const [selectedForComparison, setSelectedForComparison] = useState<
    Set<string>
  >(new Set());

  // Available categories and specializations
  const categories = ["all", "service", "sales", "parts", "finance"];
  const specializations = [
    "all",
    "service_advisor",
    "sales_assistant",
    "parts_inventory",
    "finance_advisor",
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [templates, categoryFilter, specializationFilter, searchQuery]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/v1/automotive/templates");
      setTemplates(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = templates;

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    // Specialization filter
    if (specializationFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.specialization === specializationFilter,
      );
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.specialization.toLowerCase().includes(query),
      );
    }

    setFilteredTemplates(filtered);
  };

  const handlePreview = (template: AutomotiveTemplate) => {
    setPreviewDialog({ open: true, template });
  };

  const handleInstantiate = (template: AutomotiveTemplate) => {
    setInstantiateDialog({ open: true, template });
    // Initialize inputs with example values
    if (template.example_inputs.length > 0) {
      setInstantiationInputs(template.example_inputs[0]);
    } else {
      setInstantiationInputs({});
    }
    setInstantiationResult(null);
  };

  const executeInstantiation = async () => {
    if (!instantiateDialog.template) return;

    try {
      setInstantiating(true);
      const response = await apiClient.post(
        "/api/v1/automotive/templates/instantiate",
        {
          template_id: instantiateDialog.template.id,
          inputs: instantiationInputs,
          parameters: instantiateDialog.template.parameters,
        },
      );
      setInstantiationResult(response.data.result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to instantiate template");
    } finally {
      setInstantiating(false);
    }
  };

  const handleCompareToggle = (templateId: string) => {
    const newSelected = new Set(selectedForComparison);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedForComparison(newSelected);
  };

  const openComparison = () => {
    const templatesToCompare = templates.filter((t) =>
      selectedForComparison.has(t.id),
    );
    setCompareDialog({ open: true, templates: templatesToCompare });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      service: "primary",
      sales: "success",
      parts: "warning",
      finance: "info",
    };
    return colors[category] || "default";
  };

  const getSpecializationIcon = (specialization: string) => {
    const icons: Record<string, React.ReactElement> = {
      service_advisor: <PerformanceIcon />,
      sales_assistant: <CategoryIcon />,
      parts_inventory: <CodeIcon />,
      finance_advisor: <DescriptionIcon />,
    };
    return icons[specialization] || <DescriptionIcon />;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <Typography>Loading templates...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Automotive Template Gallery
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Browse, preview, and instantiate automotive AI templates
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search templates"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, description..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category === "all"
                      ? "All Categories"
                      : category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Specialization</InputLabel>
              <Select
                value={specializationFilter}
                label="Specialization"
                onChange={(e) => setSpecializationFilter(e.target.value)}
              >
                {specializations.map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    {spec === "all"
                      ? "All Specializations"
                      : spec
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<CompareIcon />}
              onClick={openComparison}
              disabled={selectedForComparison.size < 2}
              fullWidth
            >
              Compare ({selectedForComparison.size})
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                /* Handle create new template */
              }}
              fullWidth
            >
              New Template
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Templates Grid */}
      <Grid container spacing={3}>
        {filteredTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Header with comparison checkbox */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    component="h2"
                    noWrap
                    sx={{ flexGrow: 1 }}
                  >
                    {template.name}
                  </Typography>
                  <Checkbox
                    size="small"
                    checked={selectedForComparison.has(template.id)}
                    onChange={() => handleCompareToggle(template.id)}
                    sx={{ ml: 1 }}
                  />
                </Box>

                {/* Category and Specialization */}
                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  <Chip
                    icon={getSpecializationIcon(template.specialization)}
                    label={template.category}
                    color={getCategoryColor(template.category)}
                    size="small"
                  />
                  <Chip
                    label={template.specialization.replace("_", " ")}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {/* Description */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {template.description}
                </Typography>

                {/* Example Inputs Count */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {template.example_inputs.length} example input
                  {template.example_inputs.length !== 1 ? "s" : ""}
                </Typography>

                {/* Version and Date */}
                <Box sx={{ mt: "auto", pt: 2 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Version {template.version} • Updated{" "}
                    {format(new Date(template.updated_at), "MMM dd, yyyy")}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions
                sx={{ justifyContent: "space-between", px: 2, pb: 2 }}
              >
                <Box>
                  <Tooltip title="Preview Template">
                    <IconButton
                      size="small"
                      onClick={() => handlePreview(template)}
                    >
                      <PreviewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Template">
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Button
                  size="small"
                  variant="contained"
                  startIcon={<InstantiateIcon />}
                  onClick={() => handleInstantiate(template)}
                >
                  Instantiate
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {filteredTemplates.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <FilterIcon
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No templates found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Try adjusting your filters or search query
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setCategoryFilter("all");
                  setSpecializationFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, template: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Template Preview: {previewDialog.template?.name}
        </DialogTitle>
        <DialogContent>
          {previewDialog.template && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {previewDialog.template.description}
              </Typography>

              <Typography variant="subtitle2" gutterBottom>
                Prompt Template
              </Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                >
                  {previewDialog.template.prompt_template}
                </Typography>
              </Paper>

              <Typography variant="subtitle2" gutterBottom>
                Example Inputs
              </Typography>
              {previewDialog.template.example_inputs.map((input, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Example {index + 1}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre>{JSON.stringify(input, null, 2)}</pre>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPreviewDialog({ open: false, template: null })}
          >
            Close
          </Button>
          {previewDialog.template && (
            <Button
              variant="contained"
              onClick={() => {
                setPreviewDialog({ open: false, template: null });
                handleInstantiate(previewDialog.template!);
              }}
            >
              Instantiate
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Instantiate Dialog */}
      <Dialog
        open={instantiateDialog.open}
        onClose={() => setInstantiateDialog({ open: false, template: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Instantiate Template: {instantiateDialog.template?.name}
        </DialogTitle>
        <DialogContent>
          {instantiateDialog.template && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Input Parameters
              </Typography>

              {/* Dynamic input fields based on example inputs */}
              {instantiateDialog.template.example_inputs.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {Object.keys(
                    instantiateDialog.template.example_inputs[0],
                  ).map((key) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <TextField
                        fullWidth
                        label={key
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        value={instantiationInputs[key] || ""}
                        onChange={(e) =>
                          setInstantiationInputs({
                            ...instantiationInputs,
                            [key]: e.target.value,
                          })
                        }
                        multiline={
                          key.includes("concern") || key.includes("description")
                        }
                        rows={
                          key.includes("concern") || key.includes("description")
                            ? 3
                            : 1
                        }
                      />
                    </Grid>
                  ))}
                </Grid>
              )}

              {instantiationResult && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Generated Response
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {instantiationResult}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setInstantiateDialog({ open: false, template: null })
            }
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={executeInstantiation}
            disabled={instantiating}
          >
            {instantiating ? "Generating..." : "Generate Response"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog
        open={compareDialog.open}
        onClose={() => setCompareDialog({ open: false, templates: [] })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Template Comparison ({compareDialog.templates.length} templates)
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {compareDialog.templates.map((template, index) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Typography variant="h6" gutterBottom>
                    {template.name}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={template.category}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={template.specialization.replace("_", " ")}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Parameters
                  </Typography>
                  <List dense>
                    {Object.entries(template.parameters).map(([key, value]) => (
                      <ListItem key={key} sx={{ py: 0 }}>
                        <ListItemText primary={key} secondary={String(value)} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="caption" color="text.secondary">
                    Version {template.version} •{" "}
                    {template.example_inputs.length} examples
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCompareDialog({ open: false, templates: [] })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

