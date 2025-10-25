import React, { useState, useEffect } from "react";
import {
  Brain,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Square,
  Settings,
  BarChart3,
  Zap,
  Database,
  Cpu,
  Network,
} from "lucide-react";

interface TrainingJob {
  id: string;
  name: string;
  model: string;
  status: "running" | "completed" | "failed" | "paused" | "queued";
  progress: number;
  epochs: number;
  currentEpoch: number;
  loss: number;
  accuracy: number;
  eta: string;
  startTime: string;
  endTime?: string;
  dataset: string;
  parameters: {
    learningRate: number;
    batchSize: number;
    optimizer: string;
    layers: number;
  };
}

interface ModelMetrics {
  name: string;
  accuracy: number;
  loss: number;
  f1Score: number;
  precision: number;
  recall: number;
  trainingTime: string;
  modelSize: string;
  inferenceTime: number;
}

const ModelTrainingDashboard: React.FC = () => {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [activeTab, setActiveTab] = useState<
    "training" | "models" | "datasets"
  >("training");

  useEffect(() => {
    // Mock data - replace with real API calls
    setTrainingJobs([
      {
        id: "1",
        name: "GPT-4 Fine-tuning",
        model: "gpt-4",
        status: "running",
        progress: 67,
        epochs: 100,
        currentEpoch: 67,
        loss: 0.234,
        accuracy: 0.89,
        eta: "2h 15m",
        startTime: "2025-08-24T10:30:00Z",
        dataset: "customer-support-data",
        parameters: {
          learningRate: 0.0001,
          batchSize: 32,
          optimizer: "Adam",
          layers: 12,
        },
      },
      {
        id: "2",
        name: "Claude Sentiment Analysis",
        model: "claude-3-haiku",
        status: "completed",
        progress: 100,
        epochs: 50,
        currentEpoch: 50,
        loss: 0.123,
        accuracy: 0.95,
        eta: "0m",
        startTime: "2025-08-24T08:15:00Z",
        endTime: "2025-08-24T11:45:00Z",
        dataset: "sentiment-dataset",
        parameters: {
          learningRate: 0.001,
          batchSize: 64,
          optimizer: "SGD",
          layers: 8,
        },
      },
      {
        id: "3",
        name: "Custom Model Training",
        model: "neuro-1",
        status: "queued",
        progress: 0,
        epochs: 200,
        currentEpoch: 0,
        loss: 0,
        accuracy: 0,
        eta: "Pending",
        startTime: "2025-08-24T12:00:00Z",
        dataset: "large-dataset",
        parameters: {
          learningRate: 0.0005,
          batchSize: 128,
          optimizer: "AdamW",
          layers: 24,
        },
      },
    ]);

    setMetrics([
      {
        name: "Customer Support Model",
        accuracy: 0.92,
        loss: 0.156,
        f1Score: 0.89,
        precision: 0.91,
        recall: 0.87,
        trainingTime: "4h 32m",
        modelSize: "2.4 GB",
        inferenceTime: 234,
      },
      {
        name: "Sentiment Analysis Model",
        accuracy: 0.96,
        loss: 0.089,
        f1Score: 0.94,
        precision: 0.95,
        recall: 0.93,
        trainingTime: "2h 15m",
        modelSize: "1.1 GB",
        inferenceTime: 156,
      },
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "paused":
        return "text-yellow-600 bg-yellow-100";
      case "queued":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      case "paused":
        return <Pause className="h-4 w-4" />;
      case "queued":
        return <Clock className="h-4 w-4" />;
      default:
        return <Square className="h-4 w-4" />;
    }
  };

  const TrainingJobCard = ({ job }: { job: TrainingJob }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{job.name}</h3>
            <p className="text-sm text-gray-600">{job.model}</p>
          </div>
        </div>
        <div
          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}
        >
          {getStatusIcon(job.status)}
          <span className="capitalize">{job.status}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{job.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                job.status === "completed"
                  ? "bg-green-500"
                  : job.status === "failed"
                    ? "bg-red-500"
                    : job.status === "running"
                      ? "bg-blue-500"
                      : "bg-gray-400"
              }`}
              style={{ width: `${job.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900">
              {job.currentEpoch}/{job.epochs}
            </div>
            <div className="text-gray-600">Epoch</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900">
              {job.accuracy.toFixed(3)}
            </div>
            <div className="text-gray-600">Accuracy</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900">
              {job.loss.toFixed(3)}
            </div>
            <div className="text-gray-600">Loss</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="font-semibold text-gray-900">{job.eta}</div>
            <div className="text-gray-600">ETA</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-2 border-t">
          <button className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
            <BarChart3 className="h-3 w-3" />
            <span>View Details</span>
          </button>
          {job.status === "running" && (
            <button className="flex items-center space-x-1 px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors">
              <Pause className="h-3 w-3" />
              <span>Pause</span>
            </button>
          )}
          <button className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
            <Settings className="h-3 w-3" />
            <span>Configure</span>
          </button>
        </div>
      </div>
    </div>
  );

  const ModelMetricsCard = ({ model }: { model: ModelMetrics }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{model.name}</h3>
        <div className="flex items-center space-x-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Trained</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="font-semibold text-gray-900">
            {(model.accuracy * 100).toFixed(1)}%
          </div>
          <div className="text-gray-600">Accuracy</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="font-semibold text-gray-900">
            {model.f1Score.toFixed(3)}
          </div>
          <div className="text-gray-600">F1 Score</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="font-semibold text-gray-900">
            {model.inferenceTime}ms
          </div>
          <div className="text-gray-600">Inference</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="font-semibold text-gray-900">{model.modelSize}</div>
          <div className="text-gray-600">Size</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-3">
        <span>Training time: {model.trainingTime}</span>
        <span>Loss: {model.loss.toFixed(3)}</span>
      </div>
    </div>
  );

  const SystemOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Jobs</p>
            <p className="text-2xl font-bold text-blue-600">
              {trainingJobs.filter((j) => j.status === "running").length}
            </p>
          </div>
          <Play className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Completed Models
            </p>
            <p className="text-2xl font-bold text-green-600">
              {trainingJobs.filter((j) => j.status === "completed").length}
            </p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Avg Accuracy</p>
            <p className="text-2xl font-bold text-purple-600">
              {metrics.length > 0
                ? (
                    (metrics.reduce((sum, m) => sum + m.accuracy, 0) /
                      metrics.length) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-purple-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">GPU Utilization</p>
            <p className="text-2xl font-bold text-orange-600">78%</p>
          </div>
          <Cpu className="h-8 w-8 text-orange-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Model Training Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage AI model training jobs
          </p>
        </div>

        {/* System Overview */}
        <SystemOverview />

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: "training", label: "Training Jobs", icon: Brain },
              { key: "models", label: "Trained Models", icon: Database },
              { key: "datasets", label: "Datasets", icon: Network },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "training" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Active Training Jobs
              </h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Play className="h-4 w-4" />
                <span>Start New Job</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingJobs.map((job) => (
                <TrainingJobCard key={job.id} job={job} />
              ))}
            </div>

            {trainingJobs.length === 0 && (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Training Jobs
                </h3>
                <p className="text-gray-600 mb-4">
                  Start your first model training job
                </p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Start Training
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "models" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Trained Models
              </h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                <Zap className="h-4 w-4" />
                <span>Deploy Model</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {metrics.map((model, index) => (
                <ModelMetricsCard key={index} model={model} />
              ))}
            </div>

            {metrics.length === 0 && (
              <div className="text-center py-12">
                <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Trained Models
                </h3>
                <p className="text-gray-600">
                  Complete a training job to see your models here
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "datasets" && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Training Datasets
              </h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                <Database className="h-4 w-4" />
                <span>Upload Dataset</span>
              </button>
            </div>

            <div className="text-center py-12">
              <Network className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Dataset Management
              </h3>
              <p className="text-gray-600">
                Upload and manage training datasets for your models
              </p>
            </div>
          </div>
        )}

        {/* Performance Chart Placeholder */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Training Performance Analytics
          </h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Real-time training metrics and analytics
              </p>
              <p className="text-sm text-gray-400">
                Integration with monitoring stack needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelTrainingDashboard;

