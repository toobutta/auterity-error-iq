/**
 * NeuroWeaver Training Progress Component
 * Real-time training progress monitoring and visualization
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  TrendingUp as MetricsIcon,
  Schedule as TimeIcon,
  Memory as ResourceIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

import { apiClient } from "../utils/api";

interface TrainingJob {
  id: string;
  model_id: string;
  status: string;
  progress_percent: number;
  current_epoch: number;
  total_epochs: number;
  current_loss: number;
  best_eval_loss: number;
  started_at: string;
  estimated_time_remaining: number;
  gpu_memory_used: number;
  cpu_usage_percent: number;
  error_message?: string;
}

interface TrainingMetrics {
  epoch: number;
  train_loss: number;
  eval_loss: number;
  timestamp: string;
}

interface TrainingProgressProps {
  jobId?: string;
  modelId?: string;
  onJobComplete?: (jobId: string) => void;
}

export const TrainingProgress: React.FC<TrainingProgressProps> = ({
  jobId,
  modelId,
  onJobComplete,
}) => {
  const [job, setJob] = useState<TrainingJob | null>(null);
  const [metrics, setMetrics] = useState<TrainingMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logsDialog, setLogsDialog] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (jobId) {
      loadTrainingJob();
    }
  }, [jobId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh && jobId && job?.status === "training") {
      interval = setInterval(() => {
        loadTrainingJob();
      }, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, jobId, job?.status]);

  const loadTrainingJob = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const response = await apiClient.get(
        `/api/v1/automotive/training/${jobId}/status`,
      );
      const jobData = response.data;

      setJob(jobData);

      // Check if job completed
      if (jobData.status === "completed" && onJobComplete) {
        onJobComplete(jobId);
      }

      // Load metrics history (simulated)
      if (jobData.current_epoch > 0) {
        const metricsData = generateMetricsHistory(jobData);
        setMetrics(metricsData);
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load training job");
    } finally {
      setLoading(false);
    }
  };

  const generateMetricsHistory = (jobData: TrainingJob): TrainingMetrics[] => {
    // Generate simulated metrics history
    const history: TrainingMetrics[] = [];
    const startLoss = 2.5;
    const endLoss = jobData.best_eval_loss || 0.5;

    for (let epoch = 1; epoch <= jobData.current_epoch; epoch++) {
      const progress = epoch / jobData.total_epochs;
      const trainLoss =
        startLoss -
        (startLoss - endLoss) * progress +
        (Math.random() - 0.5) * 0.1;
      const evalLoss = trainLoss + (Math.random() - 0.5) * 0.2;

      history.push({
        epoch,
        train_loss: Math.max(0.1, trainLoss),
        eval_loss: Math.max(0.1, evalLoss),
        timestamp: new Date(
          Date.now() - (jobData.current_epoch - epoch) * 60000,
        ).toISOString(),
      });
    }

    return history;
  };

  const cancelTraining = async () => {
    if (!jobId) return;

    try {
      await apiClient.post(`/api/v1/automotive/training/${jobId}/cancel`);
      await loadTrainingJob();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to cancel training");
    }
  };

  const loadLogs = async () => {
    if (!jobId) return;

    try {
      const response = await apiClient.get(
        `/api/v1/training/jobs/${jobId}/logs`,
      );
      setLogs(response.data.logs || []);
      setLogsDialog(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load logs");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "training":
        return "primary";
      case "failed":
        return "error";
      case "cancelled":
        return "warning";
      default:
        return "default";
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return "Unknown";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (!job) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Training Progress
          </Typography>
          <Typography color="text.secondary">
            {jobId ? "Loading training job..." : "No training job selected"}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Progress Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Typography variant="h6" component="h2">
              Training Progress
            </Typography>
            <Box>
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={loadTrainingJob}
                  disabled={loading}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="View Logs">
                <IconButton size="small" onClick={loadLogs}>
                  <MetricsIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Status and Progress */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Chip
                label={job.status.toUpperCase()}
                color={getStatusColor(job.status)}
                size="small"
                sx={{ mr: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Job ID: {job.id}
              </Typography>
            </Box>

            {job.status === "training" && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    Epoch {job.current_epoch} of {job.total_epochs}
                  </Typography>
                  <Typography variant="body2">
                    {Math.round(job.progress_percent)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={job.progress_percent}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}
          </Box>

          {/* Metrics Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Current Loss
                </Typography>
                <Typography variant="h6">
                  {job.current_loss ? job.current_loss.toFixed(4) : "N/A"}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Best Eval Loss
                </Typography>
                <Typography variant="h6">
                  {job.best_eval_loss ? job.best_eval_loss.toFixed(4) : "N/A"}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Time Remaining
                </Typography>
                <Typography variant="h6">
                  {formatTime(job.estimated_time_remaining)}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  GPU Memory
                </Typography>
                <Typography variant="h6">
                  {job.gpu_memory_used
                    ? `${job.gpu_memory_used.toFixed(1)}GB`
                    : "N/A"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Error Message */}
          {job.error_message && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">{job.error_message}</Typography>
            </Alert>
          )}

          {/* Actions */}
          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            {job.status === "training" && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<StopIcon />}
                onClick={cancelTraining}
              >
                Cancel Training
              </Button>
            )}

            <Button
              variant="outlined"
              startIcon={<MetricsIcon />}
              onClick={loadLogs}
            >
              View Logs
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Metrics Chart */}
      {metrics.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Training Metrics
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="train_loss"
                    stroke="#8884d8"
                    name="Training Loss"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="eval_loss"
                    stroke="#82ca9d"
                    name="Validation Loss"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Logs Dialog */}
      <Dialog
        open={logsDialog}
        onClose={() => setLogsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Training Logs</DialogTitle>
        <DialogContent>
          <Paper
            sx={{
              p: 2,
              bgcolor: "grey.900",
              color: "white",
              maxHeight: 400,
              overflow: "auto",
            }}
          >
            <Typography
              component="pre"
              sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
            >
              {logs.length > 0 ? logs.join("\n") : "No logs available"}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

