/**
 * NeuroWeaver ModelCard Component
 * Displays individual model information and actions
 */

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  MoreVert as MoreIcon,
  PlayArrow as DeployIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  TrendingUp as MetricsIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

import { Model } from "../types/model";
import { apiClient } from "../utils/api";

interface ModelCardProps {
  model: Model;
  onUpdate: () => void;
  onDeploy: (modelId: string) => void;
  onDelete: (modelId: string) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  onUpdate,
  onDeploy,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);

    try {
      await apiClient.post(`/api/v1/models/${model.id}/deploy`, {
        deployment_config: {},
        register_with_relaycore: true,
      });
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to deploy model");
    } finally {
      setDeploying(false);
    }

    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/v1/models/${model.id}`);
      onDelete(model.id);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete model");
    }

    setDeleteDialogOpen(false);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed":
        return "success";
      case "training":
        return "warning";
      case "deploying":
        return "info";
      case "trained":
        return "primary";
      case "registered":
        return "default";
      default:
        return "error";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return <DeployIcon fontSize="small" />;
      case "training":
        return <MetricsIcon fontSize="small" />;
      case "deploying":
        return <DeployIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const canDeploy = model.status === "trained";
  const canStop = model.status === "deployed";
  const isProcessing = ["training", "deploying"].includes(model.status);

  return (
    <>
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Typography variant="h6" component="h2" noWrap>
              {model.name}
            </Typography>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
          </Box>

          {/* Status and Specialization */}
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Chip
              icon={getStatusIcon(model.status)}
              label={model.status.replace("_", " ").toUpperCase()}
              color={getStatusColor(model.status) as any}
              size="small"
            />
            <Chip
              label={model.specialization.replace("-", " ")}
              variant="outlined"
              size="small"
            />
          </Box>

          {/* Description */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {model.description}
          </Typography>

          {/* Progress bar for processing states */}
          {isProcessing && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {model.status === "training"
                  ? "Training in progress..."
                  : "Deploying..."}
              </Typography>
              <LinearProgress sx={{ mt: 0.5 }} />
            </Box>
          )}

          {/* Performance Metrics */}
          {model.performance_metrics && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Performance Metrics:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                {Object.entries(model.performance_metrics).map(
                  ([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${typeof value === "number" ? value.toFixed(3) : value}`}
                      size="small"
                      variant="outlined"
                    />
                  ),
                )}
              </Box>
            </Box>
          )}

          {/* Deployment Info */}
          {model.deployment_info && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Deployment:
              </Typography>
              <Typography variant="caption" color="text.primary">
                Endpoint: {model.deployment_info.endpoint || "N/A"}
              </Typography>
            </Box>
          )}

          {/* Timestamps */}
          <Box sx={{ mt: "auto" }}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Created: {format(new Date(model.created_at), "MMM dd, yyyy")}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Updated: {format(new Date(model.updated_at), "MMM dd, yyyy")}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Version: {model.version}
            </Typography>
          </Box>
        </CardContent>

        {/* Error Display */}
        {error && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Actions */}
        <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
          <Box>
            {canDeploy && (
              <Button
                size="small"
                variant="contained"
                startIcon={<DeployIcon />}
                onClick={handleDeploy}
                disabled={deploying}
              >
                {deploying ? "Deploying..." : "Deploy"}
              </Button>
            )}
            {canStop && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<StopIcon />}
                onClick={() => {
                  // Handle stop deployment

                }}
              >
                Stop
              </Button>
            )}
          </Box>

          <Button
            size="small"
            onClick={() => {
              // Navigate to model details
              window.open(`/models/${model.id}`, "_blank");
            }}
          >
            View Details
          </Button>
        </CardActions>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => window.open(`/models/${model.id}`, "_blank")}>
          <InfoIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>

        {canDeploy && (
          <MenuItem onClick={handleDeploy} disabled={deploying}>
            <DeployIcon sx={{ mr: 1 }} fontSize="small" />
            Deploy Model
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Model
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Model</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the model "{model.name}"? This
            action cannot be undone.
          </Typography>
          {model.status === "deployed" && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This model is currently deployed. Deleting it will stop all
              inference requests.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

