import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { MetricCard } from "../MetricCard";

interface VectorEmbedding {
  id: string;
  item_type: "workflow" | "ticket" | "template";
  item_id: string;
  content_hash: string;
  embedding_vector: number[];
  embedding_metadata: unknown;
  created_at: string;
}

interface SimilarityResult {
  id: string;
  similarity_score: number;
  item_type: string;
  item_id: string;
  content_preview: string;
  metadata: unknown;
}

interface SimilarityCluster {
  id: string;
  items: SimilarityResult[];
  average_similarity: number;
  cluster_size: number;
  primary_category: string;
}

interface VectorMetrics {
  total_embeddings: number;
  average_similarity: number;
  duplicate_detection_rate: number;
  processing_time_ms: number;
  clusters_found: number;
}

const VectorSimilarityDashboard: React.FC = () => {
  const [embeddings, setEmbeddings] = useState<VectorEmbedding[]>([]);
  const [similarityResults, setSimilarityResults] = useState<
    SimilarityResult[]
  >([]);
  const [clusters, setClusters] = useState<SimilarityCluster[]>([]);
  const [metrics, setMetrics] = useState<VectorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "embeddings" | "similarity" | "clusters"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemType, setSelectedItemType] = useState<string>("all");

  useEffect(() => {
    fetchVectorData();
  }, []);

  const fetchVectorData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      const mockEmbeddings: VectorEmbedding[] = [
        {
          id: "1",
          item_type: "workflow",
          item_id: "wf-001",
          content_hash: "abc123",
          embedding_vector: [0.1, 0.2, 0.3, 0.4, 0.5],
          embedding_metadata: {
            title: "Customer Support Workflow",
            category: "support",
          },
          created_at: "2025-01-27T10:00:00Z",
        },
        {
          id: "2",
          item_type: "workflow",
          item_id: "wf-002",
          content_hash: "def456",
          embedding_vector: [0.11, 0.21, 0.31, 0.41, 0.51],
          embedding_metadata: {
            title: "Customer Support Process",
            category: "support",
          },
          created_at: "2025-01-27T09:00:00Z",
        },
      ];

      const mockSimilarityResults: SimilarityResult[] = [
        {
          id: "1",
          similarity_score: 0.95,
          item_type: "workflow",
          item_id: "wf-002",
          content_preview:
            "Customer Support Process - Automated ticket routing...",
          metadata: { title: "Customer Support Process", category: "support" },
        },
        {
          id: "2",
          similarity_score: 0.87,
          item_type: "workflow",
          item_id: "wf-003",
          content_preview:
            "Support Ticket Management - Handle customer inquiries...",
          metadata: { title: "Support Ticket Management", category: "support" },
        },
      ];

      const mockClusters: SimilarityCluster[] = [
        {
          id: "1",
          items: mockSimilarityResults,
          average_similarity: 0.91,
          cluster_size: 3,
          primary_category: "support",
        },
      ];

      const mockMetrics: VectorMetrics = {
        total_embeddings: 1250,
        average_similarity: 0.78,
        duplicate_detection_rate: 0.15,
        processing_time_ms: 245,
        clusters_found: 8,
      };

      setEmbeddings(mockEmbeddings);
      setSimilarityResults(mockSimilarityResults);
      setClusters(mockClusters);
      setMetrics(mockMetrics);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return "text-red-600 dark:text-red-400";
    if (score >= 0.7) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 0.5) return "text-blue-600 dark:text-blue-400";
    return "text-green-600 dark:text-green-400";
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case "workflow":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ticket":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "template":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const filteredEmbeddings = embeddings.filter((embedding) => {
    const matchesSearch = embedding.embedding_metadata.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedItemType === "all" || embedding.item_type === selectedItemType;
    return matchesSearch && matchesType;
  });

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
              Vector Similarity Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered duplicate detection and similarity analysis using
              vector embeddings
            </p>
          </div>
          <Button
            variant="default"
            size="lg"
            onClick={fetchVectorData}
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
          { id: "embeddings", label: "Embeddings", icon: "🧠" },
          { id: "similarity", label: "Similarity", icon: "🔍" },
          { id: "clusters", label: "Clusters", icon: "📦" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <MetricCard
              title="Total Embeddings"
              value={metrics?.total_embeddings.toLocaleString() || "0"}
              change="+8%"
              changeType="positive"
              icon="🧠"
            />
            <MetricCard
              title="Avg Similarity"
              value={`${((metrics?.average_similarity || 0) * 100).toFixed(1)}%`}
              change="+3.2%"
              changeType="positive"
              icon="🎯"
            />
            <MetricCard
              title="Duplicate Rate"
              value={`${((metrics?.duplicate_detection_rate || 0) * 100).toFixed(1)}%`}
              change="-2.1%"
              changeType="positive"
              icon="🔄"
            />
            <MetricCard
              title="Processing Time"
              value={`${metrics?.processing_time_ms || 0}ms`}
              change="-12.3%"
              changeType="positive"
              icon="⚡"
            />
            <MetricCard
              title="Clusters Found"
              value={metrics?.clusters_found.toString() || "0"}
              change="+1"
              changeType="positive"
              icon="📦"
            />
          </div>

          {/* Quick Actions */}
          <Card variant="glass" interactive>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common vector similarity operations
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Search Similar
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Generate Embeddings
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
                  Configure Models
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "embeddings" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Vector Embeddings
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
              Generate New Embeddings
            </Button>
          </div>

          {/* Search and Filters */}
          <Card variant="outline">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Embeddings
                  </label>
                  <input
                    type="text"
                    placeholder="Search by title, content, or metadata..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-automotive-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Item Type
                  </label>
                  <select
                    value={selectedItemType}
                    onChange={(e) => setSelectedItemType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-automotive-primary focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="workflow">Workflows</option>
                    <option value="ticket">Tickets</option>
                    <option value="template">Templates</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Embeddings List */}
          <div className="grid gap-4">
            {filteredEmbeddings.map((embedding) => (
              <Card key={embedding.id} variant="elevated" interactive>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {embedding.embedding_metadata.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getItemTypeColor(embedding.item_type)}`}
                        >
                          {embedding.item_type.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          {embedding.embedding_metadata.category}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Item ID:</span>
                          <span className="ml-2 font-mono">
                            {embedding.item_id}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Content Hash:</span>
                          <span className="ml-2 font-mono">
                            {embedding.content_hash}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>
                          <span className="ml-2">
                            {new Date(
                              embedding.created_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Vector Dimensions: {embedding.embedding_vector.length}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Find Similar
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

      {activeTab === "similarity" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Similarity Results
            </h2>
            <Button variant="outline">View All Results</Button>
          </div>

          <div className="grid gap-4">
            {similarityResults.map((result) => (
              <Card key={result.id} variant="outline">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getItemTypeColor(result.item_type)}`}
                        >
                          {result.item_type.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            result.similarity_score >= 0.9
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : result.similarity_score >= 0.7
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {result.similarity_score >= 0.9
                            ? "HIGH SIMILARITY"
                            : result.similarity_score >= 0.7
                              ? "MEDIUM SIMILARITY"
                              : "LOW SIMILARITY"}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 mb-2">
                        {result.content_preview}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Similarity Score:</span>
                          <span
                            className={`ml-2 ${getSimilarityColor(result.similarity_score)}`}
                          >
                            {(result.similarity_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Item ID:</span>
                          <span className="ml-2 font-mono">
                            {result.item_id}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Category:</span>
                          <span className="ml-2">
                            {result.metadata.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                      <Button variant="outline" size="sm">
                        Merge
                      </Button>
                      <Button variant="outline" size="sm">
                        Ignore
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "clusters" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Similarity Clusters
          </h2>

          <div className="grid gap-6">
            {clusters.map((cluster) => (
              <Card key={cluster.id} variant="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cluster #{cluster.id}</CardTitle>
                      <CardDescription>
                        {cluster.cluster_size} items with{" "}
                        {cluster.primary_category} category
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-automotive-primary">
                        {(cluster.average_similarity * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Avg Similarity
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <div className="p-6 pt-0">
                  <div className="space-y-3">
                    {cluster.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {item.metadata.title}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {item.item_type} • {item.item_id}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${getSimilarityColor(item.similarity_score)}`}
                          >
                            {(item.similarity_score * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            similarity
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Cluster Actions
                      </span>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Review Cluster
                        </Button>
                        <Button variant="outline" size="sm">
                          Merge Items
                        </Button>
                        <Button variant="destructive" size="sm">
                          Dissolve
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VectorSimilarityDashboard;


