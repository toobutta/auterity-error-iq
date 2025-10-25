import { useState, useEffect } from "react";
import DOMPurify from "dompurify";

interface Agent {
  id: string;
  type: string;
  status: "active" | "inactive" | "error";
  lastActivity: string;
  capabilities: string[];
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "running" | "completed" | "failed";
  startTime: string;
  result?: Record<string, unknown>;
}

interface RAGQuery {
  query: string;
  domain?: string;
  topK: number;
  useQA: boolean;
}

export default function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [workflowExecutions, setWorkflowExecutions] = useState<
    WorkflowExecution[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Agent registration state
  const [newAgent, setNewAgent] = useState({
    id: "",
    type: "autmatrix",
    llmConfig: {
      provider: "openai",
      model: "gpt-4",
      temperature: 0.7,
    },
  });

  // Workflow execution state
  const [workflowRequest, setWorkflowRequest] = useState({
    workflowId: "",
    inputData: "{}",
    coordinationStrategy: "sequential",
    agentIds: [] as string[],
  });

  // RAG query state
  const [ragQuery, setRAGQuery] = useState<RAGQuery>({
    query: "",
    domain: "",
    topK: 5,
    useQA: true,
  });

  const [ragResults, setRAGResults] = useState<{
    answer?: string;
    confidence?: number;
    documents?: Array<{
      title?: string;
      content: string;
      score: number;
      source?: string;
    }>;
  } | null>(null);

  useEffect(() => {
    loadAgentStatus();
  }, []);

  const loadAgentStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/agents/status", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load agent status");

      const data = await response.json();

      // Transform the service status into agent list
      const agentList: Agent[] = [];
      if (data.services?.agent_orchestrator) {
        data.services.agent_orchestrator.agent_ids?.forEach((id: string) => {
          agentList.push({
            id,
            type: id.includes("autmatrix")
              ? "autmatrix"
              : id.includes("relaycore")
                ? "relaycore"
                : "neuroweaver",
            status: "active",
            lastActivity: new Date().toISOString(),
            capabilities: ["workflow", "automation"],
          });
        });
      }

      setAgents(agentList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const registerAgent = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/agents/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(newAgent),
      });

      if (!response.ok) throw new Error("Failed to register agent");

      await loadAgentStatus();
      setNewAgent({
        id: "",
        type: "autmatrix",
        llmConfig: { provider: "openai", model: "gpt-4", temperature: 0.7 },
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async () => {
    try {
      setLoading(true);
      const inputData = JSON.parse(workflowRequest.inputData);

      const response = await fetch("/api/agents/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          ...workflowRequest,
          inputData,
        }),
      });

      if (!response.ok) throw new Error("Failed to execute workflow");

      const result = await response.json();

      const newExecution: WorkflowExecution = {
        id: Date.now().toString(),
        workflowId: workflowRequest.workflowId,
        status: "completed",
        startTime: new Date().toISOString(),
        result,
      };

      setWorkflowExecutions((prev) => [newExecution, ...prev.slice(0, 9)]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const queryRAG = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/agents/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(ragQuery),
      });

      if (!response.ok) throw new Error("Failed to query RAG");

      const result = await response.json();
      setRAGResults(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case "autmatrix":
        return "🤖";
      case "relaycore":
        return "📡";
      case "neuroweaver":
        return "🧠";
      default:
        return "⚙️";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agent Management Dashboard</h1>
        <button
          onClick={loadAgentStatus}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          ⚠️ {error}
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {["overview", "agents", "workflows", "rag"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Agents
                  </p>
                  <p className="text-2xl font-bold">
                    {agents.filter((a) => a.status === "active").length}
                  </p>
                  <p className="text-xs text-gray-500">
                    {agents.length} total registered
                  </p>
                </div>
                <div className="text-2xl">🤖</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Recent Executions
                  </p>
                  <p className="text-2xl font-bold">
                    {workflowExecutions.length}
                  </p>
                  <p className="text-xs text-gray-500">Last 24 hours</p>
                </div>
                <div className="text-2xl">▶️</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Security Status
                  </p>
                  <p className="text-2xl font-bold text-green-600">Secure</p>
                  <p className="text-xs text-gray-500">No threats detected</p>
                </div>
                <div className="text-2xl">🛡️</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">RAG Index</p>
                  <p className="text-2xl font-bold">Ready</p>
                  <p className="text-xs text-gray-500">Documents indexed</p>
                </div>
                <div className="text-2xl">🔍</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
            <div className="space-y-2">
              {workflowExecutions.slice(0, 5).map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        execution.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {execution.status}
                    </span>
                    <span className="text-sm">
                      Workflow: {execution.workflowId}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(execution.startTime).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {workflowExecutions.length === 0 && (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "agents" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Register New Agent</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Agent ID"
                  value={newAgent.id}
                  onChange={(e) =>
                    setNewAgent((prev) => ({ ...prev, id: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={newAgent.type}
                  onChange={(e) =>
                    setNewAgent((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="autmatrix">AutoMatrix</option>
                  <option value="relaycore">RelayCore</option>
                  <option value="neuroweaver">NeuroWeaver</option>
                </select>
                <button
                  onClick={registerAgent}
                  disabled={loading || !newAgent.id}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Register Agent
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Registered Agents</h3>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getAgentIcon(agent.type)}
                      </span>
                      <span className="font-medium">{agent.id}</span>
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                        {agent.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}
                      />
                      <span className="text-sm text-gray-500">
                        {agent.status}
                      </span>
                    </div>
                  </div>
                ))}
                {agents.length === 0 && (
                  <p className="text-sm text-gray-500">No agents registered</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "workflows" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Execute Workflow</h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Workflow ID"
                  value={workflowRequest.workflowId}
                  onChange={(e) =>
                    setWorkflowRequest((prev) => ({
                      ...prev,
                      workflowId: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={workflowRequest.coordinationStrategy}
                  onChange={(e) =>
                    setWorkflowRequest((prev) => ({
                      ...prev,
                      coordinationStrategy: e.target.value,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="sequential">Sequential</option>
                  <option value="parallel">Parallel</option>
                  <option value="hierarchical">Hierarchical</option>
                </select>
              </div>
              <textarea
                placeholder="Input data (JSON)"
                value={workflowRequest.inputData}
                onChange={(e) =>
                  setWorkflowRequest((prev) => ({
                    ...prev,
                    inputData: e.target.value,
                  }))
                }
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md resize-none"
              />
              <button
                onClick={executeWorkflow}
                disabled={loading || !workflowRequest.workflowId}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Execute Workflow
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Execution History</h3>
            <div className="space-y-2">
              {workflowExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="p-3 border rounded space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          execution.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {execution.status}
                      </span>
                      <span className="font-medium">
                        {execution.workflowId}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(execution.startTime).toLocaleString()}
                    </span>
                  </div>
                  {execution.result && (
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {DOMPurify.sanitize(
                        JSON.stringify(execution.result, null, 2),
                        { ALLOWED_TAGS: [] },
                      )}
                    </pre>
                  )}
                </div>
              ))}
              {workflowExecutions.length === 0 && (
                <p className="text-sm text-gray-500">
                  No workflow executions yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "rag" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">RAG Query Interface</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter your query..."
                value={ragQuery.query}
                onChange={(e) =>
                  setRAGQuery((prev) => ({ ...prev, query: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  type="text"
                  placeholder="Domain (optional)"
                  value={ragQuery.domain}
                  onChange={(e) =>
                    setRAGQuery((prev) => ({ ...prev, domain: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="number"
                  placeholder="Top K results"
                  value={ragQuery.topK}
                  onChange={(e) =>
                    setRAGQuery((prev) => ({
                      ...prev,
                      topK: parseInt(e.target.value) || 5,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="flex items-center space-x-2 px-3 py-2">
                  <input
                    type="checkbox"
                    id="useQA"
                    checked={ragQuery.useQA}
                    onChange={(e) =>
                      setRAGQuery((prev) => ({
                        ...prev,
                        useQA: e.target.checked,
                      }))
                    }
                  />
                  <label htmlFor="useQA" className="text-sm">
                    Use Q&A
                  </label>
                </div>
              </div>
              <button
                onClick={queryRAG}
                disabled={loading || !ragQuery.query}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Query RAG
              </button>
            </div>
          </div>

          {ragResults && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Query Results</h3>
              <div className="space-y-4">
                {ragResults.answer && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-medium text-blue-900">Answer:</h4>
                    <p className="text-blue-800">
                      {DOMPurify.sanitize(ragResults.answer, {
                        ALLOWED_TAGS: [],
                      })}
                    </p>
                    {ragResults.confidence && (
                      <p className="text-sm text-blue-600 mt-1">
                        Confidence: {(ragResults.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                )}

                {ragResults.documents && ragResults.documents.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Source Documents:</h4>
                    <div className="space-y-2">
                      {ragResults.documents.map((doc, index: number) => (
                        <div key={index} className="p-2 border rounded">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">
                              {doc.title || "Untitled"}
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                              {(doc.score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {DOMPurify.sanitize(doc.content, {
                              ALLOWED_TAGS: [],
                            })}
                          </p>
                          {doc.source && (
                            <p className="text-xs text-gray-500 mt-1">
                              Source:{" "}
                              {DOMPurify.sanitize(doc.source, {
                                ALLOWED_TAGS: [],
                              })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


