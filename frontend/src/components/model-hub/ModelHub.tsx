import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatCard,
  MetricCard
} from '../ui/enhanced/Card';
import { Button } from '../ui/enhanced/Button';
import { Badge } from '../ui/enhanced/Badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Area,
  AreaChart
} from 'recharts';
import {
  Brain,
  MessageSquare,
  Star,
  TrendingUp,
  Activity,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Target,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Grid3X3,
  Filter,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Interfaces for ML Analytics
interface PromptOutputEntry {
  id: string;
  prompt: string;
  output: string;
  modelId: string;
  modelVersion?: string;
  modelProvider?: string;
  tokensUsed: number;
  responseTimeMs: number;
  confidenceScore?: number;
  userRating?: number;
  userFeedback?: string;
  status: 'generated' | 'reviewed' | 'accepted' | 'rejected';
  tags: string[];
  createdAt: Date;
  reviewedAt?: Date;
  acceptedAt?: Date;
}

interface ModelPerformanceMetrics {
  modelId: string;
  modelVersion?: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  avgTokensUsed: number;
  totalCost: number;
  avgConfidenceScore: number;
  avgUserRating: number;
  acceptanceRate: number;
  lastUpdated: Date;
}

interface ModelHubSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  insights?: string[];
}

const ModelHub: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [loading, setLoading] = useState(false);

  // Mock data for ML analytics
  const promptOutputData = useMemo(() => [
    {
      id: 'po-001',
      prompt: 'Generate a comprehensive business plan for a startup in the AI space',
      output: 'Here is a comprehensive business plan for an AI startup...',
      modelId: 'gpt-4',
      modelVersion: '2024-01',
      modelProvider: 'OpenAI',
      tokensUsed: 2450,
      responseTimeMs: 3200,
      confidenceScore: 0.92,
      userRating: 5,
      userFeedback: 'Excellent structure and depth',
      status: 'accepted' as const,
      tags: ['business', 'planning', 'ai'],
      createdAt: new Date('2024-01-15T10:30:00Z'),
      reviewedAt: new Date('2024-01-15T11:00:00Z'),
      acceptedAt: new Date('2024-01-15T11:15:00Z')
    },
    {
      id: 'po-002',
      prompt: 'Create a marketing strategy for a new SaaS product',
      output: 'Marketing strategy outline with target audience analysis...',
      modelId: 'claude-3',
      modelVersion: 'opus',
      modelProvider: 'Anthropic',
      tokensUsed: 1890,
      responseTimeMs: 2800,
      confidenceScore: 0.88,
      userRating: 4,
      userFeedback: 'Good insights but could be more specific',
      status: 'reviewed' as const,
      tags: ['marketing', 'saas', 'strategy'],
      createdAt: new Date('2024-01-15T09:15:00Z'),
      reviewedAt: new Date('2024-01-15T09:45:00Z')
    }
  ], []);

  const modelPerformanceData = useMemo(() => [
    {
      modelId: 'gpt-4',
      modelVersion: '2024-01',
      totalRequests: 1250,
      successfulRequests: 1220,
      failedRequests: 30,
      avgResponseTime: 3200,
      p95ResponseTime: 4800,
      p99ResponseTime: 6500,
      avgTokensUsed: 2400,
      totalCost: 185.50,
      avgConfidenceScore: 0.91,
      avgUserRating: 4.7,
      acceptanceRate: 85.2,
      lastUpdated: new Date('2024-01-15T15:00:00Z')
    },
    {
      modelId: 'claude-3',
      modelVersion: 'opus',
      totalRequests: 890,
      successfulRequests: 875,
      failedRequests: 15,
      avgResponseTime: 2800,
      p95ResponseTime: 4200,
      p99ResponseTime: 5800,
      avgTokensUsed: 2100,
      totalCost: 142.30,
      avgConfidenceScore: 0.89,
      avgUserRating: 4.5,
      acceptanceRate: 82.1,
      lastUpdated: new Date('2024-01-15T15:00:00Z')
    }
  ], []);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const sections: ModelHubSection[] = [
    {
      id: 'overview',
      title: 'AI Model Performance Overview',
      description: 'High-level insights into your AI model ecosystem and overall performance',
      icon: <Brain className="w-6 h-6" />,
      insights: [
        'GPT-4 shows 85% acceptance rate with superior business planning capabilities',
        'Average response time of 3.2s across all models with 99.9% uptime',
        'Total cost optimization of $327.80 across 2,140 API calls this month',
        'User satisfaction rating of 4.6/5 with continuous improvement trends'
      ],
      content: (
        <div className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Interactions"
              value={promptOutputData.length.toString()}
              change={{ value: 15.2, trend: 'up', label: 'vs last week' }}
              icon={<MessageSquare className="w-5 h-5" />}
            />
            <StatCard
              title="Model Acceptance Rate"
              value={`${((promptOutputData.filter(item => item.status === 'accepted').length / promptOutputData.length) * 100).toFixed(1)}%`}
              change={{ value: 12.1, trend: 'up', label: 'vs last week' }}
              icon={<CheckCircle className="w-5 h-5" />}
            />
            <StatCard
              title="Average Rating"
              value={`${(promptOutputData.reduce((acc, item) => acc + (item.userRating || 0), 0) / promptOutputData.filter(item => item.userRating).length).toFixed(1)} ⭐`}
              change={{ value: 8.3, trend: 'up', label: 'vs last week' }}
              icon={<Star className="w-5 h-5" />}
            />
            <StatCard
              title="Total API Cost"
              value={`$${(modelPerformanceData.reduce((acc, model) => acc + model.totalCost, 0)).toFixed(2)}`}
              change={{ value: -5.2, trend: 'down', label: 'vs last week' }}
              icon={<DollarSign className="w-5 h-5" />}
            />
          </div>

          {/* Model Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Model Performance Comparison
              </CardTitle>
              <CardDescription>
                Comparative analysis of your AI models across key performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="modelId" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="acceptanceRate" fill="#3b82f6" name="Acceptance Rate %" />
                  <Bar dataKey="avgUserRating" fill="#10b981" name="Avg Rating" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'models',
      title: 'Model Performance Deep Dive',
      description: 'Detailed performance metrics, cost analysis, and optimization insights for each AI model',
      icon: <Activity className="w-6 h-6" />,
      insights: [
        'GPT-4 processes 1250 requests with 97.6% success rate and $0.15 per request',
        'Claude-3 Opus shows 28% faster response times with competitive quality scores',
        'Token efficiency varies by 15% between models - optimization opportunity identified',
        'Cost-performance ratio favors GPT-4 for complex business analysis tasks'
      ],
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {modelPerformanceData.map((model) => (
              <Card key={`${model.modelId}-${model.modelVersion}`} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      {model.modelId} {model.modelVersion && `v${model.modelVersion}`}
                    </span>
                    <Badge variant="secondary">{model.acceptanceRate.toFixed(1)}% acceptance</Badge>
                  </CardTitle>
                  <CardDescription>
                    Performance metrics for the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Requests</span>
                          <span className="font-medium">{model.totalRequests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span className="font-medium text-green-600">
                            {((model.successfulRequests / model.totalRequests) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Response Time</span>
                          <span className="font-medium">{(model.avgResponseTime / 1000).toFixed(1)}s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Tokens</span>
                          <span className="font-medium">{model.avgTokensUsed.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Cost</span>
                          <span className="font-medium">${model.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Rating</span>
                          <span className="font-medium">{model.avgUserRating.toFixed(1)} ⭐</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Confidence Score</span>
                          <span className="font-medium">{(model.avgConfidenceScore * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Cost per Request</span>
                          <span className="font-medium">${(model.totalCost / model.totalRequests).toFixed(3)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Trend */}
                    <div className="pt-4 border-t">
                      <ResponsiveContainer width="100%" height={100}>
                        <AreaChart data={[
                          { time: '00:00', requests: 45, success: 44 },
                          { time: '04:00', requests: 32, success: 31 },
                          { time: '08:00', requests: 78, success: 75 },
                          { time: '12:00', requests: 95, success: 92 },
                          { time: '16:00', requests: 87, success: 84 },
                          { time: '20:00', requests: 56, success: 54 }
                        ]}>
                          <Area
                            type="monotone"
                            dataKey="requests"
                            stackId="1"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="success"
                            stackId="2"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'prompts',
      title: 'Prompt Engineering & Optimization',
      description: 'Analyze prompt effectiveness, user feedback, and optimization opportunities',
      icon: <MessageSquare className="w-6 h-6" />,
      insights: [
        'Business planning prompts show 95% acceptance rate with GPT-4',
        'Marketing strategy prompts need refinement - only 80% satisfaction',
        'Average prompt length correlates with response quality (r=0.73)',
        'Tag-based prompt categorization improves 40% faster model selection'
      ],
      content: (
        <div className="space-y-6">
          {/* Prompt Quality Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Response Quality Distribution</CardTitle>
                <CardDescription>User ratings for AI responses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '5 Stars', value: promptOutputData.filter(item => item.userRating === 5).length, color: '#10b981' },
                        { name: '4 Stars', value: promptOutputData.filter(item => item.userRating === 4).length, color: '#3b82f6' },
                        { name: '3 Stars', value: promptOutputData.filter(item => item.userRating === 3).length, color: '#f59e0b' },
                        { name: '2 Stars', value: promptOutputData.filter(item => item.userRating === 2).length, color: '#f97316' },
                        { name: '1 Star', value: promptOutputData.filter(item => item.userRating === 1).length, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    >
                      {[
                        { name: '5 Stars', value: promptOutputData.filter(item => item.userRating === 5).length, color: '#10b981' },
                        { name: '4 Stars', value: promptOutputData.filter(item => item.userRating === 4).length, color: '#3b82f6' },
                        { name: '3 Stars', value: promptOutputData.filter(item => item.userRating === 3).length, color: '#f59e0b' },
                        { name: '2 Stars', value: promptOutputData.filter(item => item.userRating === 2).length, color: '#f97316' },
                        { name: '1 Star', value: promptOutputData.filter(item => item.userRating === 1).length, color: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Time vs Quality */}
            <Card>
              <CardHeader>
                <CardTitle>Quality vs Performance Trade-off</CardTitle>
                <CardDescription>Response time correlation with user satisfaction</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart data={promptOutputData.map(item => ({
                    time: item.responseTimeMs / 1000,
                    rating: item.userRating || 0,
                    tokens: item.tokensUsed
                  }))}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="time" name="Response Time (s)" />
                    <YAxis type="number" dataKey="rating" name="User Rating" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Prompts" dataKey="rating" fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Prompts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Prompt Interactions</CardTitle>
              <CardDescription>Latest prompt/response pairs with user feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promptOutputData.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{item.modelId}</Badge>
                        <Badge
                          variant={
                            item.status === 'accepted' ? 'success' :
                            item.status === 'rejected' ? 'error' : 'warning'
                          }
                        >
                          {item.status}
                        </Badge>
                        {item.userRating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">{item.userRating}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.tokensUsed} tokens • {(item.responseTimeMs / 1000).toFixed(1)}s
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium line-clamp-2">{item.prompt}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.output}</p>
                      {item.userFeedback && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                          <p className="text-sm text-blue-800 italic">
                            "{item.userFeedback}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'insights',
      title: 'AI Optimization Insights',
      description: 'Automated insights and recommendations for improving your AI model performance',
      icon: <Lightbulb className="w-6 h-6" />,
      insights: [
        '🔍 Pattern Recognition: Business planning prompts consistently outperform marketing prompts',
        '⚡ Performance Optimization: Claude-3 shows 28% faster response times for creative tasks',
        '💰 Cost Optimization: Implement model routing to save $45/month based on task complexity',
        '🎯 Quality Improvement: Add confidence thresholds to filter low-quality responses'
      ],
      content: (
        <div className="space-y-6">
          {/* Key Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Model Selection Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Route business analysis tasks to GPT-4 and creative tasks to Claude-3
                  </p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Expected Impact:</p>
                    <p className="text-sm text-blue-700">15% improvement in response quality</p>
                    <p className="text-sm text-blue-700">$35/month cost savings</p>
                  </div>
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                    Implement Routing Rules
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Prompt Engineering Enhancement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Add context and examples to improve response quality by 20%
                  </p>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Recommended Actions:</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Add task complexity indicators</li>
                      <li>• Include output format specifications</li>
                      <li>• Provide reference examples</li>
                    </ul>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    View Prompt Templates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Automated Performance Recommendations</CardTitle>
              <CardDescription>
                AI-generated recommendations based on your usage patterns and performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: 'cost_optimization',
                    title: 'API Cost Optimization',
                    description: 'Switch to GPT-3.5-turbo for simple tasks to reduce costs by 70%',
                    impact: 'High',
                    effort: 'Medium',
                    savings: '$120/month'
                  },
                  {
                    type: 'quality_improvement',
                    title: 'Response Quality Enhancement',
                    description: 'Implement confidence scoring to filter out low-quality responses',
                    impact: 'High',
                    effort: 'Low',
                    savings: '25% better user satisfaction'
                  },
                  {
                    type: 'performance_boost',
                    title: 'Response Time Optimization',
                    description: 'Use model warm-up and caching for frequently used prompts',
                    impact: 'Medium',
                    effort: 'High',
                    savings: '40% faster response times'
                  }
                ].map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge variant={rec.impact === 'High' ? 'success' : 'warning'}>
                            {rec.impact} Impact
                          </Badge>
                          <Badge variant="outline">{rec.effort} Effort</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-600">{rec.savings}</span>
                          <Button size="sm" variant="outline">
                            Learn More
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Model Hub</h1>
                <p className="text-sm text-muted-foreground">
                  Comprehensive analytics and insights for your AI model ecosystem
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8 py-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {section.icon}
                <span className="ml-2">{section.title.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="scroll-mt-24" id={section.id}>
              {/* Section Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      {section.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                      <p className="text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(section.id)}
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Key Insights */}
                {section.insights && expandedSections.has(section.id) && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Key Insights
                    </h4>
                    <ul className="space-y-1">
                      {section.insights.map((insight, index) => (
                        <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Section Content */}
              {expandedSections.has(section.id) && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              AI Model Hub - Real-time analytics and insights for optimizing your AI model performance
            </p>
            <p className="text-xs mt-2">
              Data refreshes every 5 minutes • Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelHub;
