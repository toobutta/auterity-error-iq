import React, { useState, useEffect } from "react";
import {
  ConversationLogViewer,
  AgentLog,
  ModelTrainingJob,
} from "../components/agent-logs/ConversationLogViewer";
import { ModelTrainingDashboard } from "../components/agent-logs/ModelTrainingDashboard";
import { CorrelationPanel } from "../components/agent-logs/CorrelationPanel";
import { useNotificationHelpers } from "../components/notifications/NotificationSystem";

// Mock data for demonstration
const mockAgentLogs: AgentLog[] = [
  {
    id: "1",
    agentId: "agent-001",
    agentName: "AutoMatrix Assistant",
    sessionId: "session-001",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    message:
      "User asked about improving model accuracy for automotive diagnostics. Current model shows 85% accuracy on brake system diagnostics.",
    messageType: "assistant",
    modelId: "model-001",
    modelName: "AutoDiag-v2.1",
    tokens: 1250,
    response_time: 850,
    metadata: {
      userQuery: "How can we improve brake diagnostic accuracy?",
      suggestedActions: ["retrain_model", "increase_dataset"],
    },
  },
  {
    id: "2",
    agentId: "agent-001",
    agentName: "AutoMatrix Assistant",
    sessionId: "session-001",
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
    message:
      "Recommended retraining the model with additional brake sensor data to improve accuracy.",
    messageType: "assistant",
    modelId: "model-001",
    modelName: "AutoDiag-v2.1",
    tokens: 890,
    response_time: 650,
  },
  {
    id: "3",
    agentId: "agent-002",
    agentName: "Performance Monitor",
    sessionId: "session-002",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    message:
      "Model performance dropped below threshold (80%). Triggering automatic retraining.",
    messageType: "system",
    modelId: "model-001",
    modelName: "AutoDiag-v2.1",
    tokens: 0,
    response_time: 100,
  },
  {
    id: "4",
    agentId: "agent-003",
    agentName: "Training Coordinator",
    sessionId: "session-003",
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    message:
      "Started retraining AutoDiag-v2.1 with enhanced brake diagnostic dataset.",
    messageType: "system",
    modelId: "model-001",
    modelName: "AutoDiag-v2.1",
    tokens: 0,
    response_time: 50,
  },
];

const mockTrainingJobs: ModelTrainingJob[] = [
  {
    id: "job-001",
    modelId: "model-001",
    modelName: "AutoDiag-v2.1",
    status: "running",
    progress: 75,
    startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    parameters: {
      learningRate: 0.001,
      batchSize: 32,
      epochs: 100,
      dataset: "brake-diagnostics-enhanced-v2",
    },
    metrics: {
      accuracy: 0.87,
      loss: 0.156,
      f1Score: 0.85,
    },
    triggeredBy: {
      type: "agent_conversation",
      agentSessionId: "session-002",
      logId: "3",
    },
    logs: [
      "Starting training with enhanced brake diagnostic dataset",
      "Epoch 1/100 - Loss: 0.8524, Accuracy: 0.6789",
      "Epoch 25/100 - Loss: 0.3456, Accuracy: 0.8123",
      "Epoch 50/100 - Loss: 0.2134, Accuracy: 0.8567",
      "Epoch 75/100 - Loss: 0.1560, Accuracy: 0.8700",
    ],
  },
  {
    id: "job-002",
    modelId: "model-002",
    modelName: "EngineAnalyzer-v1.3",
    status: "completed",
    progress: 100,
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    parameters: {
      learningRate: 0.0005,
      batchSize: 64,
      epochs: 150,
      dataset: "engine-diagnostics-v3",
    },
    metrics: {
      accuracy: 0.92,
      loss: 0.087,
      f1Score: 0.91,
      precision: 0.9,
      recall: 0.93,
    },
    triggeredBy: {
      type: "schedule",
    },
    logs: [
      "Training completed successfully",
      "Final metrics: Accuracy: 92%, Loss: 0.087",
      "Model validation passed",
      "Model deployed to production",
    ],
  },
  {
    id: "job-003",
    modelId: "model-003",
    modelName: "TransmissionBot-v2.0",
    status: "failed",
    progress: 45,
    startTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    endTime: new Date(Date.now() - 5.5 * 60 * 60 * 1000), // 5.5 hours ago
    parameters: {
      learningRate: 0.01,
      batchSize: 128,
      epochs: 200,
      dataset: "transmission-patterns-v1",
    },
    triggeredBy: {
      type: "manual",
    },
    logs: [
      "Training started",
      "Epoch 1/200 - Loss: 1.2456, Accuracy: 0.4567",
      "ERROR: Learning rate too high, gradient explosion detected",
      "Training terminated due to instability",
    ],
  },
];

const AgentModelCorrelationPage: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<AgentLog | undefined>();
  const [selectedJob, setSelectedJob] = useState<
    ModelTrainingJob | undefined
  >();
  const [activeTab, setActiveTab] = useState<
    "logs" | "training" | "correlation"
  >("correlation");
  const [logs] = useState<AgentLog[]>(mockAgentLogs);
  const [trainingJobs, setTrainingJobs] =
    useState<ModelTrainingJob[]>(mockTrainingJobs);

  const { success, info } = useNotificationHelpers();

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update running job progress
      setTrainingJobs((prev) =>
        prev.map((job) => {
          if (job.status === "running" && job.progress < 100) {
            const newProgress = Math.min(job.progress + Math.random() * 5, 100);
            const newJob = { ...job, progress: Math.round(newProgress) };

            // Update metrics as training progresses
            if (
              job.metrics &&
              job.metrics.accuracy !== undefined &&
              job.metrics.loss !== undefined
            ) {
              newJob.metrics = {
                ...job.metrics,
                accuracy: Math.min(
                  job.metrics.accuracy + Math.random() * 0.01,
                  0.95,
                ),
                loss: Math.max(job.metrics.loss - Math.random() * 0.01, 0.05),
              };
            }

            // Complete job when progress reaches 100
            if (newProgress >= 100) {
              newJob.status = "completed";
              newJob.endTime = new Date();
              success(
                "Training Completed",
                `${job.modelName} training finished successfully!`,
              );
            }

            return newJob;
          }
          return job;
        }),
      );
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [success]);

  // Handle log selection
  const handleLogSelect = (log: AgentLog) => {
    setSelectedLog(log);
    setActiveTab("correlation");
    info("Log Selected", `Selected conversation from ${log.agentName}`);
  };

  // Handle job selection
  const handleJobSelect = (job: ModelTrainingJob) => {
    setSelectedJob(job);
    setActiveTab("correlation");
    info("Training Job Selected", `Selected ${job.modelName} training job`);
  };

  // Calculate statistics
  const stats = {
    totalLogs: logs.length,
    totalJobs: trainingJobs.length,
    runningJobs: trainingJobs.filter((job) => job.status === "running").length,
    completedJobs: trainingJobs.filter((job) => job.status === "completed")
      .length,
    failedJobs: trainingJobs.filter((job) => job.status === "failed").length,
    averageAccuracy:
      trainingJobs
        .filter((job) => job.metrics?.accuracy)
        .reduce((sum, job) => sum + job.metrics!.accuracy! * 100, 0) /
        trainingJobs.filter((job) => job.metrics?.accuracy).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Agent & Model Correlation Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and correlate agent conversations with model training
              activities
            </p>
          </div>

          {/* Real-time indicator */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 dark:text-green-400">
              Live Updates
            </span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalLogs}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Agent Logs
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.totalJobs}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Training Jobs
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.runningJobs}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              Running
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.completedJobs}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Completed
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.failedJobs}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.averageAccuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">
              Avg Accuracy
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("correlation")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "correlation"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              🔗 Correlation Analysis
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "logs"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              💬 Agent Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab("training")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "training"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              🤖 Model Training ({trainingJobs.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "correlation" && (
            <CorrelationPanel
              logs={logs}
              trainingJobs={trainingJobs}
              selectedLog={selectedLog}
              selectedJob={selectedJob}
              onLogSelect={handleLogSelect}
              onJobSelect={handleJobSelect}
            />
          )}

          {activeTab === "logs" && (
            <ConversationLogViewer
              logs={logs}
              onLogSelect={handleLogSelect}
              selectedLogId={selectedLog?.id}
              enableFiltering={true}
              enableSearch={true}
            />
          )}

          {activeTab === "training" && (
            <ModelTrainingDashboard
              jobs={trainingJobs}
              onJobSelect={handleJobSelect}
              selectedJobId={selectedJob?.id}
              enableFiltering={true}
              enableActions={true}
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick Actions
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                success(
                  "Export Started",
                  "Exporting correlation data to CSV...",
                );
              }}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              📊 Export Data
            </button>
            <button
              onClick={() => {
                info("Refresh", "Refreshing all data...");
                // In a real app, this would refetch data
              }}
              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => {
                info("Settings", "Opening correlation settings...");
              }}
              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentModelCorrelationPage;


