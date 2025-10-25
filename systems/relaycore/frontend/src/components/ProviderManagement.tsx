import React, { useState, useEffect } from "react";
import {
  Server,
  Plus,
  Edit,
  Trash2,
  Settings,
  BarChart3,
  Clock,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: "openai" | "anthropic" | "neuroweaver" | "custom";
  endpoint: string;
  apiKey: string;
  status: "active" | "inactive" | "maintenance";
  priority: number;
  rateLimit: {
    requests: number;
    window: number; // minutes
  };
  costConfig: {
    inputCost: number;
    outputCost: number;
    currency: string;
  };
  models: string[];
  regions: string[];
  lastHealthCheck: string;
  uptime: number;
  averageResponseTime: number;
  errorRate: number;
}

const ProviderManagement: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    // Mock data - replace with real API calls
    setProviders([
      {
        id: "1",
        name: "OpenAI GPT-4",
        type: "openai",
        endpoint: "https://api.openai.com/v1",
        apiKey: "sk-****",
        status: "active",
        priority: 1,
        rateLimit: {
          requests: 500,
          window: 60,
        },
        costConfig: {
          inputCost: 0.00003,
          outputCost: 0.00006,
          currency: "USD",
        },
        models: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
        regions: ["us-east-1", "us-west-2", "eu-west-1"],
        lastHealthCheck: "2025-08-24T11:45:00Z",
        uptime: 99.9,
        averageResponseTime: 234,
        errorRate: 0.012,
      },
      {
        id: "2",
        name: "Anthropic Claude",
        type: "anthropic",
        endpoint: "https://api.anthropic.com/v1",
        apiKey: "sk-ant-****",
        status: "active",
        priority: 2,
        rateLimit: {
          requests: 300,
          window: 60,
        },
        costConfig: {
          inputCost: 0.000008,
          outputCost: 0.000024,
          currency: "USD",
        },
        models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
        regions: ["us-east-1", "eu-west-1"],
        lastHealthCheck: "2025-08-24T11:44:00Z",
        uptime: 99.7,
        averageResponseTime: 456,
        errorRate: 0.023,
      },
      {
        id: "3",
        name: "NeuroWeaver Custom",
        type: "neuroweaver",
        endpoint: "https://api.neuroweaver.com/v1",
        apiKey: "nw-****",
        status: "maintenance",
        priority: 3,
        rateLimit: {
          requests: 200,
          window: 60,
        },
        costConfig: {
          inputCost: 0.00001,
          outputCost: 0.00002,
          currency: "USD",
        },
        models: ["neuro-1", "neuro-2"],
        regions: ["us-central-1"],
        lastHealthCheck: "2025-08-24T11:30:00Z",
        uptime: 98.5,
        averageResponseTime: 123,
        errorRate: 0.005,
      },
    ]);
  }, []);

  const filteredProviders = providers.filter(
    (provider) => filterStatus === "all" || provider.status === filterStatus,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "inactive":
        return "text-red-600 bg-red-100";
      case "maintenance":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "inactive":
        return <XCircle className="h-4 w-4" />;
      case "maintenance":
        return <Clock className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  const ProviderCard = ({ provider }: { provider: Provider }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Server className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
            <p className="text-sm text-gray-600">
              {provider.type.toUpperCase()}
            </p>
          </div>
        </div>
        <div
          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(provider.status)}`}
        >
          {getStatusIcon(provider.status)}
          <span className="capitalize">{provider.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Activity className="h-4 w-4 text-blue-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600">Uptime</p>
          <p className="text-sm font-semibold">{provider.uptime}%</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Clock className="h-4 w-4 text-green-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600">Response</p>
          <p className="text-sm font-semibold">
            {provider.averageResponseTime}ms
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600">Error Rate</p>
          <p className="text-sm font-semibold">
            {(provider.errorRate * 100).toFixed(2)}%
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <DollarSign className="h-4 w-4 text-purple-600 mx-auto mb-1" />
          <p className="text-xs text-gray-600">Cost/Input</p>
          <p className="text-sm font-semibold">
            ${provider.costConfig.inputCost.toFixed(5)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>
          Rate Limit: {provider.rateLimit.requests} req/
          {provider.rateLimit.window}min
        </span>
        <span>Priority: {provider.priority}</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => {
            setSelectedProvider(provider);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          <Edit className="h-3 w-3" />
          <span>Edit</span>
        </button>
        <button className="flex items-center space-x-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
          <BarChart3 className="h-3 w-3" />
          <span>Analytics</span>
        </button>
        <button className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
          <Settings className="h-3 w-3" />
          <span>Settings</span>
        </button>
        <button className="flex items-center space-x-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
          <Trash2 className="h-3 w-3" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );

  const AddProviderButton = () => (
    <button
      onClick={() => {
        setSelectedProvider(null);
        setIsModalOpen(true);
      }}
      className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-8 hover:border-blue-400 hover:bg-blue-50 transition-colors"
    >
      <div className="text-center">
        <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Add New Provider
        </h3>
        <p className="text-sm text-gray-600">
          Configure a new AI provider endpoint
        </p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Provider Management
          </h1>
          <p className="text-gray-600 mt-2">
            Configure and monitor AI provider endpoints
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredProviders.length} of {providers.length} providers
          </div>
        </div>

        {/* Provider Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
          <AddProviderButton />
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {providers.filter((p) => p.status === "active").length}
              </div>
              <div className="text-sm text-gray-600">Active Providers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {providers.reduce((sum, p) => sum + p.rateLimit.requests, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Rate Limit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                $
                {(
                  providers.reduce(
                    (sum, p) => sum + p.costConfig.inputCost,
                    0,
                  ) * 1000000
                ).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                Avg Cost/Million Tokens
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(
                  providers.reduce((sum, p) => sum + p.averageResponseTime, 0) /
                    providers.length,
                )}
                ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Configuration Modal would go here */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {selectedProvider ? "Edit Provider" : "Add New Provider"}
            </h2>
            <p className="text-gray-600 mb-4">
              Provider configuration modal - implementation needed
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                {selectedProvider ? "Update" : "Add"} Provider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderManagement;


