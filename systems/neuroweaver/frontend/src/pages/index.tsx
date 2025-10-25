/**
 * NeuroWeaver Frontend - Main Dashboard
 * Model management and monitoring interface
 */

import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Memory as ModelIcon,
  TrendingUp as MetricsIcon,
  CloudUpload as DeployIcon,
  Settings as ConfigIcon,
} from "@mui/icons-material";
import { useRouter } from "next/router";
import useSWR from "swr";

import { ModelCard } from "../components/ModelCard";
import { TemplateGallery } from "../components/TemplateGallery";
import { apiClient } from "../utils/api";
import { Model, ModelRegistrationRequest } from "../types/model";

const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

export default function Dashboard() {
  const router = useRouter();
  const [selectedSpecialization, setSelectedSpecialization] =
    useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [newModel, setNewModel] = useState<Partial<ModelRegistrationRequest>>({
    name: "",
    description: "",
    specialization: "automotive-sales",
    base_model: "gpt-3.5-turbo",
    auto_deploy: false,
  });

  // Fetch models data
  const {
    data: modelsData,
    error: modelsError,
    mutate: refetchModels,
  } = useSWR(
    `/api/v1/models?${selectedSpecialization !== "all" ? `specialization=${selectedSpecialization}` : ""}${selectedStatus !== "all" ? `&status=${selectedStatus}` : ""}`,
    fetcher,
    { refreshInterval: 5000 },
  );

  // Fetch service status
  const { data: statusData } = useSWR("/api/v1/status", fetcher);

  const models: Model[] = modelsData || [];
  const specializations = statusData?.available_specializations || [];

  const handleRegisterModel = async () => {
    try {
      await apiClient.post("/api/v1/models/register", newModel);
      setRegisterDialogOpen(false);
      setNewModel({
        name: "",
        description: "",
        specialization: "automotive-sales",
        base_model: "gpt-3.5-turbo",
        auto_deploy: false,
      });
      refetchModels();
    } catch (error) {

    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed":
        return "success";
      case "training":
        return "warning";
      case "failed":
        return "error";
      case "registered":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusCounts = () => {
    const counts = {
      total: models.length,
      deployed: models.filter((m) => m.status === "deployed").length,
      training: models.filter((m) => m.status === "training").length,
      failed: models.filter((m) => m.status.includes("failed")).length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (modelsError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load models data. Please check your connection and try
          again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          NeuroWeaver Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          AI Model Specialization for Automotive Domain
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Models" />
          <Tab label="Template Gallery" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Status Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <ModelIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h4">{statusCounts.total}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Models
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <DeployIcon color="success" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h4">
                        {statusCounts.deployed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Deployed
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MetricsIcon color="warning" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h4">
                        {statusCounts.training}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Training
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <ConfigIcon color="error" sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="h4">
                        {statusCounts.failed}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Failed
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Specialization</InputLabel>
                  <Select
                    value={selectedSpecialization}
                    label="Specialization"
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                  >
                    <MenuItem value="all">All Specializations</MenuItem>
                    {specializations.map((spec: any) => (
                      <MenuItem key={spec.name} value={spec.name}>
                        {spec.name
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Status"
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="registered">Registered</MenuItem>
                    <MenuItem value="training">Training</MenuItem>
                    <MenuItem value="trained">Trained</MenuItem>
                    <MenuItem value="deployed">Deployed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Models Grid */}
          <Grid container spacing={3}>
            {models.map((model) => (
              <Grid item xs={12} sm={6} md={4} key={model.id}>
                <ModelCard
                  model={model}
                  onUpdate={refetchModels}
                  onDeploy={(modelId) => {
                    // Handle deployment

                  }}
                  onDelete={(modelId) => {
                    // Handle deletion

                  }}
                />
              </Grid>
            ))}

            {models.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <ModelIcon
                    sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No models found
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Get started by registering your first AI model
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setRegisterDialogOpen(true)}
                  >
                    Register Model
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {/* Template Gallery Tab */}
      {activeTab === 1 && <TemplateGallery />}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add model"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => setRegisterDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Register Model Dialog */}
      <Dialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Register New Model</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Model Name"
              value={newModel.name}
              onChange={(e) =>
                setNewModel({ ...newModel, name: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newModel.description}
              onChange={(e) =>
                setNewModel({ ...newModel, description: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Specialization</InputLabel>
              <Select
                value={newModel.specialization}
                label="Specialization"
                onChange={(e) =>
                  setNewModel({ ...newModel, specialization: e.target.value })
                }
              >
                {specializations.map((spec: any) => (
                  <MenuItem key={spec.name} value={spec.name}>
                    {spec.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Base Model</InputLabel>
              <Select
                value={newModel.base_model}
                label="Base Model"
                onChange={(e) =>
                  setNewModel({ ...newModel, base_model: e.target.value })
                }
              >
                <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                <MenuItem value="gpt-4">GPT-4</MenuItem>
                <MenuItem value="claude-3-haiku">Claude 3 Haiku</MenuItem>
                <MenuItem value="claude-3-sonnet">Claude 3 Sonnet</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRegisterModel}
            variant="contained"
            disabled={!newModel.name || !newModel.description}
          >
            Register
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

