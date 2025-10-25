/**
 * Enhanced ModelHub - Pre-defined Page
 * AI Model Optimization & ML Analytics (Whitepaper-style)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/enhanced/Card';
import { Button } from '../../../ui/enhanced/Button';
import { Badge } from '../../../ui/enhanced/Badge';
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
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Zap,
  Activity,
  BarChart3,
  Users,
  Lightbulb,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';

// Import scaffolded components
import { MLAnalyticsPanel } from '../scaffolding/components/MLAnalyticsPanel';

const EnhancedModelHub: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const modelPerformanceData = [
    { name: 'GPT-4', requests: 1250, successRate: 97.6, avgRating: 4.7, cost: 7.2 },
    { name: 'Claude-3', requests: 890, successRate: 98.2, avgRating: 4.6, cost: 4.8 },
    { name: 'GPT-3.5', requests: 650, successRate: 95.8, avgRating: 4.3, cost: 2.1 }
  ];

  const promptQualityData = [
    { name: '5 Stars', value: 40, count: 400 },
    { name: '4 Stars', value: 35, count: 350 },
    { name: '3 Stars', value: 15, count: 150 },
    { name: '2 Stars', value: 8, count: 80 },
    { name: '1 Star', value: 2, count: 20 }
  ];

  const costData = [
    { model: 'GPT-4', cost: 7.2, percentage: 45 },
    { model: 'Claude-3', cost: 4.8, percentage: 30 },
    { model: 'GPT-3.5', cost: 2.1, percentage: 13 },
    { model: 'Other', cost: 1.9, percentage: 12 }
  ];

  const optimizationOpportunities = [
    {
      type: 'Model Routing',
      description: 'Route creative tasks to Claude-3 for 28% better performance',
      savings: 2400,
      impact: 'high',
      effort: 'medium'
    },
    {
      type: 'Caching',
      description: 'Implement prompt caching for repeated queries',
      savings: 1800,
      impact: 'medium',
      effort: 'low'
    },
    {
      type: 'Batching',
      description: 'Batch similar requests for cost efficiency',
      savings: 1200,
      impact: 'medium',
      effort: 'medium'
    }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = (format: string) => {
    console.log(`Exporting data in ${format} format`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Model Hub</h1>
              <p className="text-muted-foreground">
                Model optimization and ML analytics for enhanced AI performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex gap-1 mt-4">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'performance', label: 'Model Performance', icon: Brain },
              { id: 'prompts', label: 'Prompt Analytics', icon: MessageSquare },
              { id: 'optimization', label: 'Cost Optimization', icon: DollarSign },
              { id: 'insights', label: 'AI Insights', icon: Lightbulb }
            ].map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection(section.id)}
                className="flex items-center gap-2"
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <section id="overview" className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">AI Model Performance Overview</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Comprehensive analytics and optimization insights for your AI models,
                combining performance metrics, cost analysis, and quality assessments.
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold">2</div>
                  <div className="text-sm text-muted-foreground">Active Models</div>
                  <Badge variant="success" className="mt-2">All Operational</Badge>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold">2,140</div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                  <Badge variant="info" className="mt-2">+15% this month</Badge>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Star className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold">4.6</div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                  <Badge variant="success" className="mt-2">⭐ Excellent</Badge>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold">$15.8</div>
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                  <Badge variant="warning" className="mt-2">Optimize Available</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Model Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Comparison</CardTitle>
                <CardDescription>Requests, success rates, and user ratings by model</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={modelPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="requests" fill="#3b82f6" name="Requests" />
                    <Bar yAxisId="right" dataKey="successRate" fill="#10b981" name="Success Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Model Performance Section */}
        {activeSection === 'performance' && (
          <section id="performance" className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">Model Performance Deep Dive</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Detailed performance analysis for each AI model, including response times,
                error rates, and quality metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* GPT-4 Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    GPT-4 Performance
                  </CardTitle>
                  <CardDescription>v2024-01 • Primary model for complex tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">1,250</div>
                      <div className="text-sm text-blue-600">Requests</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">97.6%</div>
                      <div className="text-sm text-green-600">Success Rate</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">3.2s</div>
                      <div className="text-sm text-purple-600">Avg Response</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">4.7</div>
                      <div className="text-sm text-yellow-600">User Rating</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cost Efficiency</span>
                      <Badge variant="warning">Medium</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Quality Score</span>
                      <Badge variant="success">High</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Speed</span>
                      <Badge variant="info">Medium</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Claude-3 Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-green-600" />
                    Claude-3 Performance
                  </CardTitle>
                  <CardDescription>Opus model • Optimized for creative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">890</div>
                      <div className="text-sm text-blue-600">Requests</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">98.2%</div>
                      <div className="text-sm text-green-600">Success Rate</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">2.8s</div>
                      <div className="text-sm text-purple-600">Avg Response</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">4.6</div>
                      <div className="text-sm text-yellow-600">User Rating</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cost Efficiency</span>
                      <Badge variant="success">High</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Quality Score</span>
                      <Badge variant="success">High</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Speed</span>
                      <Badge variant="success">High</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Response time and success rate trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { day: 'Mon', gpt4: 3.2, claude3: 2.8, success: 97.5 },
                    { day: 'Tue', gpt4: 3.4, claude3: 2.9, success: 97.8 },
                    { day: 'Wed', gpt4: 3.1, claude3: 2.7, success: 98.1 },
                    { day: 'Thu', gpt4: 3.3, claude3: 2.8, success: 97.9 },
                    { day: 'Fri', gpt4: 3.5, claude3: 3.0, success: 97.6 },
                    { day: 'Sat', gpt4: 3.0, claude3: 2.6, success: 98.3 },
                    { day: 'Sun', gpt4: 2.8, claude3: 2.5, success: 98.5 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="gpt4"
                      stroke="#3b82f6"
                      name="GPT-4 Response Time (s)"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="claude3"
                      stroke="#10b981"
                      name="Claude-3 Response Time (s)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="success"
                      stroke="#f59e0b"
                      name="Success Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Prompt Analytics Section */}
        {activeSection === 'prompts' && (
          <section id="prompts" className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">Prompt Engineering & Optimization</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Analysis of prompt effectiveness, user feedback, and optimization opportunities
                for improved AI responses.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quality Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Quality Distribution</CardTitle>
                  <CardDescription>User ratings for AI responses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={promptQualityData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, count }) => count > 0 ? `${name}: ${count}` : ''}
                      >
                        {promptQualityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Quality vs Performance Correlation */}
              <Card>
                <CardHeader>
                  <CardTitle>Quality vs Performance Analysis</CardTitle>
                  <CardDescription>Correlation between response quality and performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={[
                      { tokens: 2450, time: 3.2, rating: 5, model: 'gpt-4' },
                      { tokens: 1890, time: 2.8, rating: 4, model: 'claude-3' },
                      { tokens: 3200, time: 4.1, rating: 5, model: 'gpt-4' },
                      { tokens: 1560, time: 2.1, rating: 4, model: 'claude-3' },
                      { tokens: 2780, time: 3.8, rating: 3, model: 'gpt-4' }
                    ]}>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="time" name="Response Time (s)" />
                      <YAxis type="number" dataKey="rating" name="User Rating" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Prompts" dataKey="rating" fill="#3b82f6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Correlation: -0.45 (Moderate negative relationship - faster responses tend to be rated higher)
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Prompt Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Prompt Analytics Summary</CardTitle>
                <CardDescription>Key metrics and patterns from prompt usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">1,250</div>
                    <div className="text-sm text-muted-foreground">Total Prompts</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">890</div>
                    <div className="text-sm text-muted-foreground">Unique Prompts</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">4.6</div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">85.2%</div>
                    <div className="text-sm text-muted-foreground">Acceptance Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Cost Optimization Section */}
        {activeSection === 'optimization' && (
          <section id="optimization" className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">Cost Optimization & Efficiency</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Analyze and optimize your AI costs with intelligent recommendations
                for better efficiency and cost savings.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cost Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown by Model</CardTitle>
                  <CardDescription>API usage costs distributed across models</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={costData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="cost"
                        label={({ model, percentage }) => `${model}: ${percentage}%`}
                      >
                        {costData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Cost Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Trends</CardTitle>
                  <CardDescription>Daily cost patterns and optimization opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[
                      { day: 'Mon', cost: 2.1, requests: 420 },
                      { day: 'Tue', cost: 2.8, requests: 560 },
                      { day: 'Wed', cost: 2.4, requests: 480 },
                      { day: 'Thu', cost: 3.2, requests: 640 },
                      { day: 'Fri', cost: 3.8, requests: 760 },
                      { day: 'Sat', cost: 1.8, requests: 360 },
                      { day: 'Sun', cost: 1.5, requests: 300 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="cost"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="Daily Cost ($)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Optimization Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Opportunities</CardTitle>
                <CardDescription>AI-driven recommendations for cost savings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizationOpportunities.map((opportunity, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{opportunity.type}</h4>
                        <div className="flex gap-2">
                          <Badge variant={opportunity.impact === 'high' ? 'success' : 'info'}>
                            {opportunity.impact} impact
                          </Badge>
                          <Badge variant="outline">
                            {opportunity.effort} effort
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {opportunity.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-green-600">
                          Potential savings: ${opportunity.savings.toLocaleString()}/month
                        </div>
                        <Button size="sm" variant="outline">
                          <Target className="w-4 h-4 mr-1" />
                          Implement
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* AI Insights Section */}
        {activeSection === 'insights' && (
          <section id="insights" className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">AI Optimization Insights</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Intelligent recommendations and predictive insights for optimizing
                your AI models and improving overall performance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                  <CardDescription>AI-generated insights about model performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-green-800">Claude-3 Superior for Creative Tasks</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Claude-3 Opus shows 28% higher user satisfaction for creative writing and content generation tasks compared to GPT-4.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-blue-800">Response Time Optimization</h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      Responses under 2 seconds correlate with 23% higher user ratings. Consider model selection for faster tasks.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Optimization Insights</CardTitle>
                  <CardDescription>Recommendations for reducing AI costs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-medium text-yellow-800">Model Routing Opportunity</h4>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Routing creative tasks to Claude-3 could save $2,400/month while maintaining quality standards.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <h4 className="font-medium text-purple-800">Caching Implementation</h4>
                    </div>
                    <p className="text-sm text-purple-700">
                      Implementing prompt caching for repeated queries could reduce costs by 15-20%.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Predictive Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Predictive Analytics</CardTitle>
                <CardDescription>Forecasts and recommendations for future optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">+18%</div>
                    <div className="text-sm text-muted-foreground">Predicted cost savings</div>
                    <div className="text-xs text-muted-foreground mt-1">Next 3 months</div>
                  </div>

                  <div className="text-center p-6 border rounded-lg">
                    <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">4.8</div>
                    <div className="text-sm text-muted-foreground">Predicted avg rating</div>
                    <div className="text-xs text-muted-foreground mt-1">With optimizations</div>
                  </div>

                  <div className="text-center p-6 border rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">2.1s</div>
                    <div className="text-sm text-muted-foreground">Predicted response time</div>
                    <div className="text-xs text-muted-foreground mt-1">After optimization</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ML Analytics Integration */}
        <section className="border-t pt-12">
          <Card className="border-t-4 border-t-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                ML Analytics Integration
              </CardTitle>
              <CardDescription>
                Full ML analytics panel with real-time data and advanced visualizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MLAnalyticsPanel
                  data={{
                    models: [
                      { id: 'gpt-4', name: 'GPT-4', provider: 'openai', version: '2024-01', modelType: 'text', capabilities: ['text-generation'], supportedTasks: ['chat'], maxTokens: 8192, contextWindow: 8192, costPer1kTokens: 0.03, avgLatency: 3200, status: 'active' },
                      { id: 'claude-3', name: 'Claude 3 Opus', provider: 'anthropic', version: 'opus', modelType: 'text', capabilities: ['text-generation'], supportedTasks: ['chat'], maxTokens: 4096, contextWindow: 4096, costPer1kTokens: 0.015, avgLatency: 2800, status: 'active' }
                    ],
                    performance: [
                      {
                        modelId: 'gpt-4',
                        modelVersion: '2024-01',
                        timeRange: { from: new Date('2024-01-01'), to: new Date() },
                        totalRequests: 1250,
                        successfulRequests: 1220,
                        failedRequests: 30,
                        successRate: 97.6,
                        avgResponseTime: 3200,
                        p95ResponseTime: 4800,
                        p99ResponseTime: 6500,
                        minResponseTime: 800,
                        maxResponseTime: 12000,
                        totalTokensUsed: 240000,
                        promptTokens: 180000,
                        completionTokens: 60000,
                        avgTokensPerRequest: 192,
                        totalCost: 7.2,
                        avgCostPerRequest: 0.00576,
                        costPer1kTokens: 0.03,
                        avgConfidenceScore: 0.91,
                        avgUserRating: 4.7,
                        acceptanceRate: 85.2,
                        errorRate: 2.4,
                        topErrors: [],
                        hourlyMetrics: [],
                        lastUpdated: new Date()
                      }
                    ],
                    prompts: [],
                    promptAnalytics: {
                      totalPrompts: 1250,
                      uniquePrompts: 890,
                      avgPromptLength: 145,
                      avgOutputLength: 380,
                      categoryPerformance: [],
                      patterns: [],
                      qualityMetrics: {
                        avgRating: 4.6,
                        acceptanceRate: 85.2,
                        rejectionRate: 14.8,
                        improvementSuggestions: []
                      },
                      trendingTopics: []
                    },
                    experiments: [],
                    costOptimization: {
                      totalCost: 15.8,
                      projectedSavings: 3.2,
                      optimizationOpportunities: [],
                      costByModel: [],
                      costByTime: [],
                      recommendations: []
                    },
                    modelHealth: [],
                    summary: {
                      totalModels: 2,
                      activeModels: 2,
                      totalRequests: 2140,
                      avgResponseTime: 3000,
                      totalCost: 15.8,
                      avgRating: 4.6,
                      acceptanceRate: 85.2
                    }
                  }}
                  enableRealtime={true}
                  expanded={true}
                />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export { EnhancedModelHub };
