import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { MetricCard } from "../MetricCard";

interface Agent {
  id: string;
  name: string;
  agent_type: "support" | "analytics" | "automation" | "monitoring" | "custom";
  status: "active" | "idle" | "busy" | "error" | "offline";
  current_task?: string;
  memory_count: number;
  performance_score: number;
  last_active: string;
  capabilities: string[];
  tenant_id: string;
}

interface AgentTask {
  id: string;
  agent_id: string;
  task_type:
    | "classification"
    | "analysis"
    | "automation"
    | "monitoring"
    | "custom";
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  assigned_at: string;
  completed_at?: string;
  result?: {
    insights?: string[];
    [key: string]: unknown;
  };
  error_message?: string;
}

interface AgentMemory {
  id: string;
  agent_id: string;
  context_hash: string;
  memory_data: {
    context?: string;
    patterns?: string[];
    [key: string]: unknown;
  };
  importance_score: number;
  created_at: string;
  accessed_at?: string;
}

interface AgentMetrics {
  total_agents: number;
  active_agents: number;
  average_performance: number;
  total_tasks_completed: number;
  memory_utilization: number;
  coordination_efficiency: number;
}

const AutonomousAgentDashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "agents" | "tasks" | "memories" | "coordination"
  >("overview");
  const [selectedAgentType, setSelectedAgentType] = useState<string>("all");
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string>("all");

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockAgents: Agent[] = [
        {
          id: "1",
          name: "Support Agent Alpha",
          agent_type: "support",
          status: "active",
          current_task: "Customer ticket classification",
          memory_count: 1250,
          performance_score: 0.94,
          last_active: "2025-01-27T10:30:00Z",
          capabilities: ["NLP", "Classification", "Routing"],
          tenant_id: "tenant-1",
        },
        {
          id: "2",
          name: "Analytics Agent Beta",
          agent_type: "analytics",
          status: "busy",
          current_task: "Performance trend analysis",
          memory_count: 890,
          performance_score: 0.87,
          last_active: "2025-01-27T10:25:00Z",
          capabilities: ["Data Analysis", "Trend Detection", "Reporting"],
          tenant_id: "tenant-1",
        },
        {
          id: "3",
          name: "Automation Agent Gamma",
          agent_type: "automation",
          status: "idle",
          current_task: undefined,
          memory_count: 567,
          performance_score: 0.91,
          last_active: "2025-01-27T10:20:00Z",
          capabilities: [
            "Workflow Automation",
            "Task Execution",
            "Error Handling",
          ],
          tenant_id: "tenant-1",
        },
      ];

      const mockTasks: AgentTask[] = [
        {
          id: "1",
          agent_id: "1",
          task_type: "classification",
          status: "running",
          priority: "high",
          description:
            "Classify incoming support tickets by urgency and category",
          assigned_at: "2025-01-27T10:00:00Z",
        },
        {
          id: "2",
          agent_id: "2",
          task_type: "analysis",
          status: "completed",
          priority: "medium",
          description: "Analyze workflow performance metrics for Q4",
          assigned_at: "2025-01-27T09:00:00Z",
          completed_at: "2025-01-27T10:15:00Z",
          result: {
            insights: [
              "Performance improved 15%",
              "Bottleneck identified in step 3",
            ],
          },
        },
      ];

      const mockMemories: AgentMemory[] = [
        {
          id: "1",
          agent_id: "1",
          context_hash: "ctx_001",
          memory_data: {
            context: "Customer support patterns",
            patterns: ["urgent", "technical", "billing"],
          },
          importance_score: 0.85,
          created_at: "2025-01-27T08:00:00Z",
          accessed_at: "2025-01-27T10:30:00Z",
        },
      ];

      const mockMetrics: AgentMetrics = {
        total_agents: 12,
        active_agents: 8,
        average_performance: 0.89,
        total_tasks_completed: 1250,
        memory_utilization: 0.72,
        coordination_efficiency: 0.85,
      };

      setAgents(mockAgents);
      setTasks(mockTasks);
      setMemories(mockMemories);
      setMetrics(mockMetrics);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case "support":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "analytics":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "automation":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "monitoring":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "custom":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "idle":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "busy":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "offline":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "running":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const filteredAgents = agents.filter(
    (agent) =>
      selectedAgentType === "all" || agent.agent_type === selectedAgentType,
  );

  const filteredTasks = tasks.filter(
    (task) =>
      selectedTaskStatus === "all" || task.status === selectedTaskStatus,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-automotive-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-automotive-primary to-automotive-secondary bg-clip-text text-transparent">
              Autonomous Agent Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage AI agents, monitor performance, and coordinate multi-agent
              workflows
            </p>
          </div>
          <Button
            variant="default"
            size="lg"
            onClick={fetchAgentData}
            leftIcon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white dark:bg-neutral-800 rounded-lg p-1 shadow-sm">
        {[
          { id: "overview", label: "Overview", icon: "📊" },
          { id: "agents", label: "Agents", icon: "🤖" },
          { id: "tasks", label: "Tasks", icon: "📋" },
          { id: "memories", label: "Memories", icon: "🧠" },
          { id: "coordination", label: "Coordination", icon: "🔗" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(
                tab.id as
                  | "overview"
                  | "agents"
                  | "tasks"
                  | "memories"
                  | "coordination",
              )
            }
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-automotive-primary text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Total Agents"
              value={metrics?.total_agents.toString() || "0"}
              change="+2"
              changeType="positive"
              icon="🤖"
            />
            <MetricCard
              title="Active Agents"
              value={metrics?.active_agents.toString() || "0"}
              change="+1"
              changeType="positive"
              icon="🟢"
            />
            <MetricCard
              title="Avg Performance"
              value={`${((metrics?.average_performance || 0) * 100).toFixed(1)}%`}
              change="+2.3%"
              changeType="positive"
              icon="📈"
            />
            <MetricCard
              title="Tasks Completed"
              value={metrics?.total_tasks_completed.toLocaleString() || "0"}
              change="+15%"
              changeType="positive"
              icon="✅"
            />
            <MetricCard
              title="Memory Utilization"
              value={`${((metrics?.memory_utilization || 0) * 100).toFixed(1)}%`}
              change="+5.2%"
              changeType="positive"
              icon="🧠"
            />
            <MetricCard
              title="Coordination Efficiency"
              value={`${((metrics?.coordination_efficiency || 0) * 100).toFixed(1)}%`}
              change="+3.1%"
              changeType="positive"
              icon="🔗"
            />
          </div>

          {/* Quick Actions */}
          <Card variant="glass" interactive>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common agent management operations
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col justify-center"
                >
                  <svg
                    className="w-8 h-8 mb-2 text-automotive-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Deploy New Agent
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col justify-center"
                >
                  <svg
                    className="w-8 h-8 mb-2 text-automotive-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Assign Task
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col justify-center"
                >
                  <svg
                    className="w-8 h-8 mb-2 text-automotive-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  View Analytics
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col justify-center"
                >
                  <svg
                    className="w-8 h-8 mb-2 text-automotive-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Configure Settings
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "agents" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              AI Agents
            </h2>
            <div className="flex space-x-3">
              <select
                value={selectedAgentType}
                onChange={(e) => setSelectedAgentType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-automotive-primary focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="support">Support</option>
                <option value="analytics">Analytics</option>
                <option value="automation">Automation</option>
                <option value="monitoring">Monitoring</option>
                <option value="custom">Custom</option>
              </select>
              <Button variant="default" size="lg">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Deploy New Agent
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} variant="elevated" interactive>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {agent.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getAgentTypeColor(agent.agent_type)}`}
                        >
                          {agent.agent_type.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(agent.status)}`}
                        >
                          {agent.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div>
                          <span className="font-medium">
                            Performance Score:
                          </span>
                          <span
                            className={`ml-2 ${agent.performance_score >= 0.9 ? "text-green-600" : agent.performance_score >= 0.7 ? "text-yellow-600" : "text-red-600"}`}
                          >
                            {(agent.performance_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Memory Count:</span>
                          <span className="ml-2">
                            {agent.memory_count.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Last Active:</span>
                          <span className="ml-2">
                            {new Date(agent.last_active).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {agent.current_task && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Current Task:
                          </span>
                          <span className="ml-2 text-sm text-blue-700 dark:text-blue-300">
                            {agent.current_task}
                          </span>
                        </div>
                      )}
                      <div className="mt-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Capabilities:{" "}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {agent.capabilities.map((capability, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                            >
                              {capability}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Assign Task
                      </Button>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                      <Button variant="destructive" size="sm">
                        Deactivate
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Agent Tasks
            </h2>
            <div className="flex space-x-3">
              <select
                value={selectedTaskStatus}
                onChange={(e) => setSelectedTaskStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-automotive-primary focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button variant="default" size="lg">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create New Task
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} variant="outline">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getTaskStatusColor(task.status)}`}
                        >
                          {task.status.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          {task.task_type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 mb-2">
                        {task.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Agent ID:</span>
                          <span className="ml-2 font-mono">
                            {task.agent_id}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Assigned:</span>
                          <span className="ml-2">
                            {new Date(task.assigned_at).toLocaleString()}
                          </span>
                        </div>
                        {task.completed_at && (
                          <div>
                            <span className="font-medium">Completed:</span>
                            <span className="ml-2">
                              {new Date(task.completed_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      {task.result && (
                        <div className="mt-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Result:
                          </span>
                          <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                            {task.result.insights?.map(
                              (insight: string, index: number) => (
                                <div key={index}>• {insight}</div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                      {task.error_message && (
                        <div className="mt-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                          <span className="text-sm font-medium text-red-800 dark:text-red-200">
                            Error:
                          </span>
                          <span className="ml-2 text-sm text-red-700 dark:text-red-300">
                            {task.error_message}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {task.status === "pending" && (
                        <Button variant="outline" size="sm">
                          Start
                        </Button>
                      )}
                      {task.status === "running" && (
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      )}
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "memories" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Agent Memories
          </h2>

          <div className="grid gap-4">
            {memories.map((memory) => (
              <Card key={memory.id} variant="glass">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          MEMORY
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          Agent {memory.agent_id}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            memory.importance_score >= 0.8
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : memory.importance_score >= 0.6
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {memory.importance_score >= 0.8
                            ? "HIGH IMPORTANCE"
                            : memory.importance_score >= 0.6
                              ? "MEDIUM IMPORTANCE"
                              : "LOW IMPORTANCE"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div>
                          <span className="font-medium">Context Hash:</span>
                          <span className="ml-2 font-mono">
                            {memory.context_hash}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Importance Score:</span>
                          <span className="ml-2">
                            {(memory.importance_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>
                          <span className="ml-2">
                            {new Date(memory.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Memory Data:
                        </span>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(memory.memory_data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "coordination" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Multi-Agent Coordination
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Coordination Matrix</CardTitle>
                <CardDescription>
                  Agent interaction patterns and communication efficiency
                </CardDescription>
              </CardHeader>
              <div className="p-6 pt-0">
                <div className="space-y-4">
                  {[
                    {
                      agent1: "Support Alpha",
                      agent2: "Analytics Beta",
                      efficiency: 0.92,
                      interactions: 45,
                    },
                    {
                      agent1: "Analytics Beta",
                      agent2: "Automation Gamma",
                      efficiency: 0.87,
                      interactions: 32,
                    },
                    {
                      agent1: "Support Alpha",
                      agent2: "Automation Gamma",
                      efficiency: 0.78,
                      interactions: 28,
                    },
                  ].map((coordination, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg"
                    >
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {coordination.agent1} ↔ {coordination.agent2}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {coordination.interactions} interactions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-automotive-primary">
                          {(coordination.efficiency * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          efficiency
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Workflow Dependencies</CardTitle>
                <CardDescription>
                  Task dependencies and agent coordination requirements
                </CardDescription>
              </CardHeader>
              <div className="p-6 pt-0">
                <div className="space-y-3">
                  {[
                    {
                      workflow: "Customer Support",
                      agents: ["Support Alpha", "Analytics Beta"],
                      status: "active",
                    },
                    {
                      workflow: "Performance Analysis",
                      agents: ["Analytics Beta", "Automation Gamma"],
                      status: "pending",
                    },
                    {
                      workflow: "System Monitoring",
                      agents: ["Automation Gamma", "Support Alpha"],
                      status: "completed",
                    },
                  ].map((workflow, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {workflow.workflow}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {workflow.agents.join(" + ")}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          workflow.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : workflow.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {workflow.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutonomousAgentDashboard;


