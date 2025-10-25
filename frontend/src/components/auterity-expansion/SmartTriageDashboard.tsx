import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { MetricCard } from "../MetricCard";

interface TriageRule {
  id: string;
  name: string;
  rule_type: "ml" | "rule_based" | "hybrid";
  confidence_threshold: number;
  priority: number;
  is_active: boolean;
  created_at: string;
  conditions: unknown;
  routing_logic: unknown;
}

interface TriageResult {
  id: string;
  input_content: string;
  predicted_routing: string;
  confidence_score: number;
  human_override?: string;
  processing_time_ms: number;
  created_at: string;
}

interface TriageMetrics {
  total_requests: number;
  average_confidence: number;
  human_override_rate: number;
  average_processing_time: number;
  accuracy_rate: number;
}

const SmartTriageDashboard: React.FC = () => {
  const [triageRules, setTriageRules] = useState<TriageRule[]>([]);
  const [recentResults, setRecentResults] = useState<TriageResult[]>([]);
  const [metrics, setMetrics] = useState<TriageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "rules" | "results" | "analytics"
  >("overview");

  useEffect(() => {
    // TODO: Replace with actual API calls
    fetchTriageData();
  }, []);

  const fetchTriageData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockRules: TriageRule[] = [
        {
          id: "1",
          name: "High Priority Support",
          rule_type: "hybrid",
          confidence_threshold: 0.85,
          priority: 1,
          is_active: true,
          created_at: "2025-01-27T10:00:00Z",
          conditions: { category: "support", urgency: "high" },
          routing_logic: { route_to: "senior_support", escalation: true },
        },
        {
          id: "2",
          name: "Technical Issues",
          rule_type: "ml",
          confidence_threshold: 0.75,
          priority: 2,
          is_active: true,
          created_at: "2025-01-27T09:00:00Z",
          conditions: { category: "technical", complexity: "medium" },
          routing_logic: { route_to: "tech_support", auto_assign: true },
        },
      ];

      const mockResults: TriageResult[] = [
        {
          id: "1",
          input_content: "Urgent support needed for critical system failure",
          predicted_routing: "senior_support",
          confidence_score: 0.92,
          processing_time_ms: 150,
          created_at: "2025-01-27T10:30:00Z",
        },
        {
          id: "2",
          input_content: "General inquiry about product features",
          predicted_routing: "general_support",
          confidence_score: 0.78,
          processing_time_ms: 120,
          created_at: "2025-01-27T10:25:00Z",
        },
      ];

      const mockMetrics: TriageMetrics = {
        total_requests: 1250,
        average_confidence: 0.84,
        human_override_rate: 0.12,
        average_processing_time: 135,
        accuracy_rate: 0.88,
      };

      setTriageRules(mockRules);
      setRecentResults(mockResults);
      setMetrics(mockMetrics);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case "ml":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "rule_based":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "hybrid":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return "text-green-600 dark:text-green-400";
    if (score >= 0.7) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

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
              Smart Triage Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered workflow routing and intelligent task triage
            </p>
          </div>
          <Button
            variant="default"
            size="lg"
            onClick={fetchTriageData}
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
          { id: "rules", label: "Triage Rules", icon: "⚙️" },
          { id: "results", label: "Recent Results", icon: "📋" },
          { id: "analytics", label: "Analytics", icon: "📈" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(
                tab.id as "overview" | "rules" | "results" | "analytics",
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Requests"
              value={metrics?.total_requests.toLocaleString() || "0"}
              change="+12%"
              changeType="positive"
              icon="📨"
            />
            <MetricCard
              title="Avg Confidence"
              value={`${((metrics?.average_confidence || 0) * 100).toFixed(1)}%`}
              change="+2.3%"
              changeType="positive"
              icon="🎯"
            />
            <MetricCard
              title="Human Override Rate"
              value={`${((metrics?.human_override_rate || 0) * 100).toFixed(1)}%`}
              change="-5.2%"
              changeType="positive"
              icon="👤"
            />
            <MetricCard
              title="Avg Processing Time"
              value={`${metrics?.average_processing_time || 0}ms`}
              change="-8.1%"
              changeType="positive"
              icon="⚡"
            />
          </div>

          {/* Quick Actions */}
          <Card variant="glass" interactive>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common triage operations</CardDescription>
            </CardHeader>
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Create New Rule
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

      {activeTab === "rules" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Triage Rules
            </h2>
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
              Add New Rule
            </Button>
          </div>

          <div className="grid gap-4">
            {triageRules.map((rule) => (
              <Card key={rule.id} variant="elevated" interactive>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {rule.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getRuleTypeColor(rule.rule_type)}`}
                        >
                          {rule.rule_type.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rule.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {rule.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">
                            Confidence Threshold:
                          </span>
                          <span
                            className={`ml-2 ${getConfidenceColor(rule.confidence_threshold)}`}
                          >
                            {(rule.confidence_threshold * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Priority:</span>
                          <span className="ml-2">{rule.priority}</span>
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>
                          <span className="ml-2">
                            {new Date(rule.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Duplicate
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

      {activeTab === "results" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Recent Triage Results
            </h2>
            <Button variant="outline">View All Results</Button>
          </div>

          <div className="grid gap-4">
            {recentResults.map((result) => (
              <Card key={result.id} variant="outline">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-gray-100 mb-2">
                        {result.input_content}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Routing:</span>
                          <span className="ml-2 text-automotive-primary">
                            {result.predicted_routing}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span>
                          <span
                            className={`ml-2 ${getConfidenceColor(result.confidence_score)}`}
                          >
                            {(result.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Processing Time:</span>
                          <span className="ml-2">
                            {result.processing_time_ms}ms
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>
                          <span className="ml-2">
                            {new Date(result.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                      <Button variant="outline" size="sm">
                        Override
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Triage Analytics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Confidence Distribution</CardTitle>
                <CardDescription>
                  Distribution of confidence scores across all triage decisions
                </CardDescription>
              </CardHeader>
              <div className="p-6 pt-0">
                <div className="space-y-3">
                  {[
                    {
                      range: "90-100%",
                      count: 45,
                      percentage: 36,
                      color: "bg-green-500",
                    },
                    {
                      range: "80-89%",
                      count: 38,
                      percentage: 30,
                      color: "bg-blue-500",
                    },
                    {
                      range: "70-79%",
                      count: 25,
                      percentage: 20,
                      color: "bg-yellow-500",
                    },
                    {
                      range: "60-69%",
                      count: 12,
                      percentage: 10,
                      color: "bg-orange-500",
                    },
                    {
                      range: "Below 60%",
                      count: 5,
                      percentage: 4,
                      color: "bg-red-500",
                    },
                  ].map((item) => (
                    <div
                      key={item.range}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                        {item.range}
                      </div>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-12 text-sm text-gray-600 dark:text-gray-400 text-right">
                        {item.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card variant="glass">
              <CardHeader>
                <CardTitle>Processing Time Trends</CardTitle>
                <CardDescription>
                  Average processing time over the last 7 days
                </CardDescription>
              </CardHeader>
              <div className="p-6 pt-0">
                <div className="space-y-3">
                  {[
                    { day: "Mon", time: 120, trend: "down" },
                    { day: "Tue", time: 135, trend: "up" },
                    { day: "Wed", time: 110, trend: "down" },
                    { day: "Thu", time: 145, trend: "up" },
                    { day: "Fri", time: 125, trend: "down" },
                    { day: "Sat", time: 130, trend: "up" },
                    { day: "Sun", time: 115, trend: "down" },
                  ].map((item) => (
                    <div
                      key={item.day}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.day}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {item.time}ms
                        </span>
                        <svg
                          className={`w-4 h-4 ${
                            item.trend === "down"
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {item.trend === "down" ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          )}
                        </svg>
                      </div>
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

export default SmartTriageDashboard;


