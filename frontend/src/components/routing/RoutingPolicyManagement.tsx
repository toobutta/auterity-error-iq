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
import { AlertCircle, Plus, Settings, TrendingUp, Users, Zap, Shield, Loader2 } from 'lucide-react';
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
  const [isCreating, setIsCreating] = useState(false);

  // Form state for creating new policy
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    description: '',
    priority: 1,
    conditions: {
      userTier: '',
      serviceType: '',
      modelType: '',
      costThreshold: '',
      performanceRequirement: ''
    },
    actions: {
      primaryProvider: '',
      fallbackProviders: [],
      costOptimization: true,
      cachingEnabled: true
    },
    template: ''
  });

  // Load data from API
  useEffect(() => {
    loadPolicies();
    loadProviders();
  }, []);

  const loadPolicies = async () => {
    try {
      const response = await fetch('/api/routing/policies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      } else {
        console.error('Failed to load policies');
        // Fallback to empty array
        setPolicies([]);
      }
    } catch (error) {
      console.error('Error loading policies:', error);
      setPolicies([]);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/routing/providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      } else {
        console.error('Failed to load providers');
        setProviders([]);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createPolicy = async () => {
    setIsCreating(true);
    try {
      const policyData = {
        name: newPolicy.name,
        description: newPolicy.description,
        priority: newPolicy.priority,
        conditions: {
          user_tier: newPolicy.conditions.userTier,
          service_type: newPolicy.conditions.serviceType,
          model_type: newPolicy.conditions.modelType,
          cost_threshold: newPolicy.conditions.costThreshold ? parseFloat(newPolicy.conditions.costThreshold) : undefined,
          performance_requirement: newPolicy.conditions.performanceRequirement
        },
        actions: {
          primary_provider: newPolicy.actions.primaryProvider,
          fallback_providers: newPolicy.actions.fallbackProviders,
          cost_optimization: newPolicy.actions.costOptimization,
          caching_enabled: newPolicy.actions.cachingEnabled
        },
        template: newPolicy.template || undefined
      };

      const response = await fetch('/api/routing/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(policyData)
      });

      if (response.ok) {
        const createdPolicy = await response.json();
        setPolicies(prev => [...prev, createdPolicy]);
        setIsCreateDialogOpen(false);
        setNewPolicy({
          name: '',
          description: '',
          priority: 1,
          conditions: {
            userTier: '',
            serviceType: '',
            modelType: '',
            costThreshold: '',
            performanceRequirement: ''
          },
          actions: {
            primaryProvider: '',
            fallbackProviders: [],
            costOptimization: true,
            cachingEnabled: true
          },
          template: ''
        });
      } else {
        console.error('Failed to create policy');
      }
    } catch (error) {
      console.error('Error creating policy:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const togglePolicyStatus = async (policyId: string, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'active' ? 'deactivate' : 'activate';
      const response = await fetch(`/api/routing/policies/${policyId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      if (response.ok) {
        // Update local state
        setPolicies(prev => prev.map(policy =>
          policy.id === policyId
            ? { ...policy, status: currentStatus === 'active' ? 'inactive' : 'active' }
            : policy
        ));
      } else {
        console.error('Failed to toggle policy status');
      }
    } catch (error) {
      console.error('Error toggling policy status:', error);
    }
  };

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
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedPolicy(policy)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePolicyStatus(policy.id, policy.status)}
                          >
                            {policy.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
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

      {/* Create Policy Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-6 right-6 shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Policy
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Routing Policy</DialogTitle>
            <DialogDescription>
              Define intelligent routing rules for AI service requests
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="policy-name">Policy Name</Label>
                <Input
                  id="policy-name"
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter policy name"
                />
              </div>

              <div>
                <Label htmlFor="policy-description">Description</Label>
                <Input
                  id="policy-description"
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the routing policy"
                />
              </div>

              <div>
                <Label htmlFor="policy-priority">Priority</Label>
                <Select
                  value={newPolicy.priority.toString()}
                  onValueChange={(value) => setNewPolicy(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Highest Priority</SelectItem>
                    <SelectItem value="2">2 - High Priority</SelectItem>
                    <SelectItem value="3">3 - Medium Priority</SelectItem>
                    <SelectItem value="4">4 - Low Priority</SelectItem>
                    <SelectItem value="5">5 - Lowest Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Routing Conditions</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User Tier</Label>
                  <Select
                    value={newPolicy.conditions.userTier}
                    onValueChange={(value) => setNewPolicy(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, userTier: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Service Type</Label>
                  <Select
                    value={newPolicy.conditions.serviceType}
                    onValueChange={(value) => setNewPolicy(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, serviceType: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="completion">Completion</SelectItem>
                      <SelectItem value="embedding">Embedding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Model Type</Label>
                  <Select
                    value={newPolicy.conditions.modelType}
                    onValueChange={(value) => setNewPolicy(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, modelType: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Performance Requirement</Label>
                  <Select
                    value={newPolicy.conditions.performanceRequirement}
                    onValueChange={(value) => setNewPolicy(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, performanceRequirement: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any performance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Performance</SelectItem>
                      <SelectItem value="medium">Medium Performance</SelectItem>
                      <SelectItem value="low">Low Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Routing Actions</h3>

              <div className="space-y-4">
                <div>
                  <Label>Primary Provider</Label>
                  <Select
                    value={newPolicy.actions.primaryProvider}
                    onValueChange={(value) => setNewPolicy(prev => ({
                      ...prev,
                      actions: { ...prev.actions, primaryProvider: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name} (${provider.costPerToken}/token)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Optimization Settings</Label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newPolicy.actions.costOptimization}
                        onChange={(e) => setNewPolicy(prev => ({
                          ...prev,
                          actions: { ...prev.actions, costOptimization: e.target.checked }
                        }))}
                      />
                      <span className="text-sm">Cost Optimization</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newPolicy.actions.cachingEnabled}
                        onChange={(e) => setNewPolicy(prev => ({
                          ...prev,
                          actions: { ...prev.actions, cachingEnabled: e.target.checked }
                        }))}
                      />
                      <span className="text-sm">Response Caching</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={createPolicy}
                disabled={isCreating || !newPolicy.name.trim()}
              >
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isCreating ? 'Creating...' : 'Create Policy'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutingPolicyManagement;
