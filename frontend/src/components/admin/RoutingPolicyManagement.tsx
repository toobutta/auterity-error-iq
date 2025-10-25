import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertCircle, Plus, Settings, TrendingUp, Users, Zap, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface RoutingPolicy {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: {
    serviceType?: string;
    modelType?: string;
    userTier?: string;
    costThreshold?: number;
    performanceRequirement?: string;
  };
  actions: {
    primaryProvider: string;
    fallbackProviders: string[];
    costOptimization: boolean;
    cachingEnabled: boolean;
  };
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
  usageStats?: {
    totalRequests: number;
    avgResponseTime: number;
    costSavings: number;
    successRate: number;
  };
}

interface Provider {
  id: string;
  name: string;
  type: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  costPerToken: number;
  avgResponseTime: number;
  capacity: number;
}

const RoutingPolicyManagement: React.FC = () => {
  const [policies, setPolicies] = useState<RoutingPolicy[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<RoutingPolicy | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for scaffolding
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPolicies([
        {
          id: 'policy-1',
          name: 'Enterprise High Priority',
          description: 'Optimized routing for enterprise users with high performance requirements',
          priority: 1,
          conditions: {
            userTier: 'enterprise',
            performanceRequirement: 'high'
          },
          actions: {
            primaryProvider: 'gpt-4-turbo',
            fallbackProviders: ['claude-3-opus', 'gpt-4'],
            costOptimization: false,
            cachingEnabled: true
          },
          status: 'active',
          createdAt: '2025-01-15T10:00:00Z',
          updatedAt: '2025-01-20T14:30:00Z',
          usageStats: {
            totalRequests: 1250,
            avgResponseTime: 2.3,
            costSavings: 15.5,
            successRate: 98.7
          }
        },
        {
          id: 'policy-2',
          name: 'Cost Optimized Standard',
          description: 'Balance cost and performance for standard tier users',
          priority: 2,
          conditions: {
            userTier: 'standard',
            costThreshold: 0.01
          },
          actions: {
            primaryProvider: 'gpt-3.5-turbo',
            fallbackProviders: ['claude-3-haiku', 'gpt-4'],
            costOptimization: true,
            cachingEnabled: true
          },
          status: 'active',
          createdAt: '2025-01-10T09:00:00Z',
          updatedAt: '2025-01-18T11:15:00Z',
          usageStats: {
            totalRequests: 3200,
            avgResponseTime: 3.1,
            costSavings: 28.3,
            successRate: 96.2
          }
        }
      ]);

      setProviders([
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          type: 'openai',
          status: 'healthy',
          costPerToken: 0.03,
          avgResponseTime: 2.1,
          capacity: 95
        },
        {
          id: 'claude-3-opus',
          name: 'Claude 3 Opus',
          type: 'anthropic',
          status: 'healthy',
          costPerToken: 0.015,
          avgResponseTime: 2.8,
          capacity: 88
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          type: 'openai',
          status: 'healthy',
          costPerToken: 0.002,
          avgResponseTime: 1.5,
          capacity: 100
        }
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800'
    };
    return variants[status as keyof typeof variants] || variants.draft;
  };

  const getProviderStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      unhealthy: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || variants.unhealthy;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routing Policy Management</h1>
          <p className="text-muted-foreground">
            Configure intelligent AI service routing based on performance, cost, and user requirements
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Routing Policy</DialogTitle>
              <DialogDescription>
                Configure routing rules for AI service requests based on conditions and preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="policy-name" className="text-right">
                  Name
                </Label>
                <Input id="policy-name" placeholder="Policy name" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="policy-desc" className="text-right">
                  Description
                </Label>
                <Input id="policy-desc" placeholder="Policy description" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">High (1)</SelectItem>
                    <SelectItem value="2">Medium (2)</SelectItem>
                    <SelectItem value="3">Low (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Create Policy
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.filter(p => p.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {policies.length} total policies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.reduce((sum, p) => sum + (p.usageStats?.totalRequests || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {policies.reduce((sum, p) => sum + (p.usageStats?.costSavings || 0), 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Providers</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.filter(p => p.status === 'healthy').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {providers.length} total providers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Routing Policies</TabsTrigger>
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Routing Policies</CardTitle>
              <CardDescription>
                Manage intelligent routing rules for AI service requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requests</TableHead>
                    <TableHead>Avg Response</TableHead>
                    <TableHead>Cost Savings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{policy.name}</div>
                          <div className="text-sm text-muted-foreground">{policy.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{policy.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(policy.status)}>
                          {policy.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{policy.usageStats?.totalRequests?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>{policy.usageStats?.avgResponseTime?.toFixed(1) || 'N/A'}s</TableCell>
                      <TableCell>{policy.usageStats?.costSavings?.toFixed(1) || 'N/A'}%</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setSelectedPolicy(policy)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Providers</CardTitle>
              <CardDescription>
                Monitor provider health and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost/Token</TableHead>
                    <TableHead>Avg Response</TableHead>
                    <TableHead>Capacity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium">{provider.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{provider.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getProviderStatusBadge(provider.status)}>
                          {provider.status}
                        </Badge>
                      </TableCell>
                      <TableCell>${provider.costPerToken}</TableCell>
                      <TableCell>{provider.avgResponseTime}s</TableCell>
                      <TableCell>{provider.capacity}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analytics Coming Soon</AlertTitle>
            <AlertDescription>
              Detailed routing analytics and performance insights will be available in the next update.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoutingPolicyManagement;
