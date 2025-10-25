

# 🎨 **Model Hub UI/UX Design Specificatio

n

* *

#

# **Overvie

w

* *

This document outlines the user interface and user experience design for the Auterity Model Hub. The design follows modern web application principles with a focus on usability, performance, and accessibility.

--

- #

# **🎯 Design Principle

s

* *

#

## **Core Principles

* *

1. **Intuitive Navigatio

n

* *

- Clear information hierarchy and logical flo

w

2. **Data-Driven Desig

n

* *

- Visual representations of complex dat

a

3. **Progressive Disclosur

e

* *

- Show essential info first, details on deman

d

4. **Responsive Experienc

e

* *

- Seamless experience across all device

s

5. **Accessibility Firs

t

* *

- WCAG 2.1 AA complian

c

e

6. **Performance Focuse

d

* *

- Fast loading and smooth interaction

s

#

## **Visual Language

* *

- **Color Palette**: Professional blue-based theme with semantic color

s

- **Typography**: Clear hierarchy with readable font

s

- **Spacing**: Consistent 8px grid syste

m

- **Shadows**: Subtle depth for layerin

g

- **Animations**: Purposeful micro-interaction

s

--

- #

# **🏗️ Component Architectur

e

* *

#

## **Layout Syste

m

* *

#

### **Main Layout

* *

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─ Top Navigation ──────────────────────────────────────┐ │
│ │ [Logo] [Search] [User Menu] [Notifications] [Settings] │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌─ Sidebar Navigation ─┐ ┌─ Main Content Area ──────────┐ │
│ │ • Dashboard          │ │                               │ │
│ │ • Model Catalog      │ │        [Page Content]         │ │
│ │ • Deployments        │ │                               │ │
│ │ • Analytics          │ │                               │ │
│ │ • Experiments        │ │                               │ │
│ │ • Marketplace        │ │                               │ │
│ │ • Cost Management    │ └───────────────────────────────┘ │
│ └──────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘

```

#

### **Responsive Breakpoints

* *

```

typescript
const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
};

```

--

- #

# **📱 Key Pages & Component

s

* *

#

## **

1. Dashboard Overvie

w

* *

#

### **Header Section

* *

```

tsx
const DashboardHeader = () => (
  <div className="flex items-center justify-between p-6 border-b bg-white">

    <div className="flex items-center gap-4">

      <Brain className="w-8 h-8 text-blue-600" />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Model Hub</h1>

        <p className="text-sm text-gray-600">

          Monitor and optimize your AI model ecosystem
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3">

      <SearchBar placeholder="Search models, deployments..." />
      <NotificationBell count={3} />
      <UserMenu user={currentUser} />
    </div>
  </div>
);

```

#

### **Key Metrics Cards

* *

```

tsx
const MetricCard = ({ title, value, change, icon, trend }) => (
  <Card className="p-6 hover:shadow-lg transition-shadow">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>

        <p className="text-3xl font-bold text-gray-900">{value}</p>

        <div className="flex items-center gap-1 mt-2">

          <TrendIcon trend={trend} />
          <span className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>

            {change.value}% {change.label}
          </span>
        </div>
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">

        {icon}
      </div>
    </div>
  </Card>
);

```

#

### **Quick Actions Bar

* *

```

tsx
const QuickActions = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">

    <ActionButton
      icon={<Plus className="w-5 h-5" />}

      title="Deploy Model"
      description="Create new deployment"
      onClick={() => navigate('/deployments/new')}
    />
    <ActionButton
      icon={<Search className="w-5 h-5" />}

      title="Browse Catalog"
      description="Find new models"
      onClick={() => navigate('/catalog')}
    />
    <ActionButton
      icon={<BarChart3 className="w-5 h-5" />}

      title="View Analytics"
      description="Performance insights"
      onClick={() => navigate('/analytics')}
    />
    <ActionButton
      icon={<Zap className="w-5 h-5" />}

      title="Run Experiment"
      description="A/B test models"
      onClick={() => navigate('/experiments/new')}
    />
  </div>
);

```

#

## **

2. Model Catalo

g

* *

#

### **Catalog Grid Layout

* *

```

tsx
const ModelCatalog = () => (
  <div className="space-y-6">

    {/

* Filters & Search */}

    <div className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg">

      <SearchInput
        placeholder="Search models..."
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <div className="flex gap-2">

        <SelectFilter
          label="Provider"
          options={['OpenAI', 'Anthropic', 'Google', 'Custom']}
          value={filters.provider}
          onChange={(value) => setFilters({...filters, provider: value})}
        />
        <SelectFilter
          label="Type"
          options={['Text', 'Vision', 'Multimodal', 'Embedding']}
          value={filters.type}
          onChange={(value) => setFilters({...filters, type: value})}
        />
        <SelectFilter
          label="Cost"
          options={['Free', '<$0.01', '$0.01-$0.10', '>$0.10']

}

          value={filters.cost}
          onChange={(value) => setFilters({...filters, cost: value})}
        />
      </div>
    </div>

    {/

* Results Grid */}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

      {models.map(model => (
        <ModelCard key={model.id} model={model} />
      ))}
    </div>

    {/

* Pagination */}

    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  </div>
);

```

#

### **Model Card Component

* *

```

tsx
const ModelCard = ({ model }) => (
  <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">

    <CardHeader className="pb-3">

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-3">

          <ModelIcon type={model.type} />
          <div>
            <h3 className="font-semibold text-lg">{model.name}</h3>

            <p className="text-sm text-gray-600">{model.provider}</p>

          </div>
        </div>
        <Badge variant={model.status === 'active' ? 'success' : 'secondary'}>
          {model.status}
        </Badge>
      </div>
    </CardHeader>

    <CardContent className="space-y-4">

      <p className="text-sm text-gray-700 line-clamp-2">

        {model.description}
      </p>

      <div className="flex flex-wrap gap-1">

        {model.capabilities.slice(0, 3).map(cap => (
          <Badge key={cap} variant="outline" size="sm">
            {cap}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">

        <div>
          <p className="text-xs text-gray-600">Latency</p>

          <p className="font-medium">{model.baselineMetrics.avgLatencyMs}ms</p>

        </div>
        <div>
          <p className="text-xs text-gray-600">Cost</p>

          <p className="font-medium">${model.baselineMetrics.costPer1kTokens}</p>

        </div>
        <div>
          <p className="text-xs text-gray-600">Rating</p>

          <div className="flex items-center justify-center gap-1">

            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />

            <span className="font-medium">{model.rating || 'N/A'}</span>

          </div>
        </div>
      </div>
    </CardContent>

    <CardFooter className="pt-3">

      <div className="flex gap-2 w-full">

        <Button variant="outline" size="sm" className="flex-1">

          <Eye className="w-4 h-4 mr-2" />

          View Details
        </Button>
        <Button size="sm" className="flex-1">

          <Rocket className="w-4 h-4 mr-2" />

          Deploy
        </Button>
      </div>
    </CardFooter>
  </Card>
);

```

#

## **

3. Model Detail Vie

w

* *

#

### **Tabbed Interface

* *

```

tsx
const ModelDetailView = ({ modelId }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'deployments', label: 'Deployments', icon: Server },
    { id: 'experiments', label: 'Experiments', icon: Flask },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="space-y-6">

      {/

* Header */}

      <ModelHeader model={model} />

      {/

* Tabs */}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">

          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">

              <tab.icon className="w-4 h-4" />

              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <ModelOverviewTab model={model} />
        </TabsContent>

        <TabsContent value="performance">
          <ModelPerformanceTab modelId={modelId} />
        </TabsContent>

        <TabsContent value="deployments">
          <ModelDeploymentsTab modelId={modelId} />
        </TabsContent>

        <TabsContent value="experiments">
          <ModelExperimentsTab modelId={modelId} />
        </TabsContent>

        <TabsContent value="settings">
          <ModelSettingsTab model={model} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

```

#

## **

4. Performance Analytics Dashboar

d

* *

#

### **Metrics Overview

* *

```

tsx
const PerformanceOverview = () => (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

    <MetricCard
      title="Total Requests"
      value="2,140"
      change={{ value: 15.2, trend: 'up', label: 'vs last week' }}

      icon={<Activity className="w-6 h-6 text-blue-600" />}

    />
    <MetricCard
      title="Avg Response Time"
      value="2.1s"

      change={{ value: -8.3, trend: 'down', label: 'vs last week' }

}

      icon={<Clock className="w-6 h-6 text-green-600" />}

    />
    <MetricCard
      title="Success Rate"
      value="97.6%"

      change={{ value: 2.1, trend: 'up', label: 'vs last week' }}

      icon={<CheckCircle className="w-6 h-6 text-green-600" />}

    />
    <MetricCard
      title="Total Cost"
      value="$15.80"

      change={{ value: -5.2, trend: 'down', label: 'vs last week' }

}

      icon={<DollarSign className="w-6 h-6 text-yellow-600" />}

    />
  </div>
);

```

#

### **Interactive Charts

* *

```

tsx
const PerformanceCharts = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

    {/

* Response Time Trends */}

    <Card>
      <CardHeader>
        <CardTitle>Response Time Trends</CardTitle>
        <CardDescription>Average response time over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="avgLatency"
              stroke="

#3b82f6"

              strokeWidth={2}
              dot={{ fill: '

#3b82f6', strokeWidth: 2, r: 4 }}

            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/

* Cost Breakdown */}

    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown by Model</CardTitle>
        <CardDescription>API costs distributed across models</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={costByModelData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="cost"
              label={({ name, percentage }) => `${name}: ${percentage}%`}
            >
              {costByModelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />

              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

```

#

## **

5. Deployment Managemen

t

* *

#

### **Deployment List

* *

```

tsx
const DeploymentList = () => (
  <div className="space-y-4">

    <div className="flex items-center justify-between">

      <h2 className="text-xl font-semibold">Active Deployments</h2>

      <Button>
        <Plus className="w-4 h-4 mr-2" />

        New Deployment
      </Button>
    </div>

    <div className="space-y-3">

      {deployments.map(deployment => (
        <DeploymentCard key={deployment.id} deployment={deployment} />
      ))}
    </div>
  </div>
);

```

#

### **Deployment Card

* *

```

tsx
const DeploymentCard = ({ deployment }) => (
  <Card className="hover:shadow-md transition-shadow">

    <CardContent className="p-6">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">

          <div className={`p-2 rounded-lg ${

            deployment.status === 'running' ? 'bg-green-100' :

            deployment.status === 'scaling' ? 'bg-yellow-100' :

            'bg-red-100'

          }`}>
            <Server className={`w-5 h-5 ${

              deployment.status === 'running' ? 'text-green-600' :

              deployment.status === 'scaling' ? 'text-yellow-600' :

              'text-red-600'

            }`} />
          </div>

          <div>
            <h3 className="font-medium">{deployment.modelName}</h3>

            <p className="text-sm text-gray-600">

              {deployment.environment} • {deployment.replicas} replicas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">

          <div className="text-right">

            <p className="text-sm font-medium">

              {deployment.requestsPerMinute} req/min
            </p>
            <p className="text-xs text-gray-600">

              {deployment.avgLatency}ms avg
            </p>
          </div>

          <Badge variant={
            deployment.status === 'running' ? 'success' :
            deployment.status === 'scaling' ? 'warning' :
            'error'
          }>
            {deployment.status}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />

              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />

                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />

                Configure
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BarChart3 className="w-4 h-4 mr-2" />

                View Metrics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">

                <Trash2 className="w-4 h-4 mr-2" />

                Stop Deployment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardContent>
  </Card>
);

```

#

## **

6. A/B Testing Interfac

e

* *

#

### **Experiment Builder

* *

```

tsx
const ExperimentBuilder = () => (
  <Card>
    <CardHeader>
      <CardTitle>Create A/B Test</CardTitle>
      <CardDescription>
        Compare different model versions or configurations
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-6">

      {/

* Basic Info */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="space-y-2">

          <Label htmlFor="name">Experiment Name</Label>
          <Input id="name" placeholder="e.g., GPT-4 vs Claude-3 comparison" />

        </div>
        <div className="space-y-2">

          <Label htmlFor="model">Base Model</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4</SelectItem>

              <SelectItem value="claude-3">Claude-3 Opus</SelectItem>

              <SelectItem value="custom">Custom Model</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/

* Variants */}

      <div className="space-y-4">

        <h3 className="text-lg font-medium">Test Variants</h3

>

        {variants.map((variant, index) => (
          <Card key={index} className="p-4">

            <div className="flex items-center justify-between mb-4">

              <h4 className="font-medium">Variant {inde

x

 + 1}</h4>

              <Button
                variant="outline"
                size="sm"
                onClick={() => removeVariant(index)}
              >
                <Trash2 className="w-4 h-4" />

              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="space-y-2">

                <Label>Name</Label>
                <Input
                  value={variant.name}
                  onChange={(e) => updateVariant(index, 'name', e.target.value)}
                  placeholder="e.g., High Temperature"
                />
              </div>
              <div className="space-y-2">

                <Label>Traffic %</Label>
                <Input
                  type="number"
                  value={variant.weight}
                  onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">

                <Label>Temperature</Label>
                <Input
                  type="number"
                  value={variant.config.temperature}
                  onChange={(e) => updateVariantConfig(index, 'temperature', e.target.value)}
                  min="0"
                  max="2"
                  step="0.1"

                />
              </div>
            </div>
          </Card>
        ))}

        <Button variant="outline" onClick={addVariant}>
          <Plus className="w-4 h-4 mr-2" />

          Add Variant
        </Button>
      </div>

      {/

* Success Metrics */}

      <div className="space-y-4">

        <h3 className="text-lg font-medium">Success Metrics</h3

>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="space-y-2">

            <Label>Primary Metric</Label>
            <Select value={primaryMetric} onValueChange={setPrimaryMetric}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user_rating">User Rating</SelectItem>
                <SelectItem value="response_time">Response Time</SelectItem>
                <SelectItem value="completion_rate">Completion Rate</SelectItem>
                <SelectItem value="cost_per_request">Cost per Request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">

            <Label>Statistical Significance</Label>
            <Select value={significance} onValueChange={setSignificance}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.8">80%</SelectItem>

                <SelectItem value="0.9">90%</SelectItem>

                <SelectItem value="0.95">95%</SelectItem>

                <SelectItem value="0.99">99%</SelectItem>

              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </CardContent>

    <CardFooter>
      <div className="flex gap-2 ml-auto">

        <Button variant="outline">Save Draft</Button>
        <Button>Start Experiment</Button>
      </div>
    </CardFooter>
  </Card>
);

```

#

## **

7. Cost Management Dashboar

d

* *

#

### **Budget Overview

* *

```

tsx
const BudgetOverview = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>Current spending vs budget</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">

          <div className="flex justify-between items-center">

            <span className="text-2xl font-bold">$2,450</span>

            <Badge variant="warning">85% used</Badge>
          </div>

          <Progress value={85} className="h-3" /

>

          <div className="text-sm text-gray-600">

            $550 remaining • Resets in 12 days
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Cost Trends</CardTitle>
        <CardDescription>Spending over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={costTrendData}>
            <Area
              type="monotone"
              dataKey="cost"
              stroke="

#3b82f6"

              fill="

#3b82f6"

              fillOpacity={0.2}

            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Optimization Potential</CardTitle>
        <CardDescription>Identified savings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">

          <div className="flex justify-between">

            <span className="text-sm">Model Routing</span>

            <span className="font-medium text-green-600">-$240/month</span>

          </div>
          <div className="flex justify-between">

            <span className="text-sm">Prompt Caching</span>

            <span className="font-medium text-green-600">-$180/month</span>

          </div>
          <div className="flex justify-between border-t pt-2">

            <span className="font-medium">Total Potential</span>

            <span className="font-bold text-green-600">-$420/month</span>

          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

```

--

- #

# **🎯 Interaction Pattern

s

* *

#

## **Navigation

* *

- **Top Navigation**: Global actions and user men

u

- **Sidebar**: Main navigation with icons and label

s

- **Breadcrumbs**: Context-aware navigation pat

h

- **Tabs**: Section-specific navigatio

n

#

## **Data Interaction

* *

- **Search**: Global search with filters and suggestion

s

- **Filtering**: Multi-select filters with quick preset

s

- **Sorting**: Click column headers to sor

t

- **Pagination**: Standard pagination with page size option

s

#

## **Feedback & Status

* *

- **Loading States**: Skeleton screens and progress indicator

s

- **Success/Error Messages**: Toast notifications with action

s

- **Empty States**: Helpful guidance when no data exist

s

- **Status Indicators**: Color-coded badges and icon

s

#

## **Modal & Overlay Patterns

* *

- **Confirmation Dialogs**: For destructive action

s

- **Form Modals**: For creating/editing resource

s

- **Detail Panels**: Slide-out panels for additional inf

o

- **Context Menus**: Right-click menus for quick action

s

--

- #

# **📱 Responsive Desig

n

* *

#

## **Mobile Layout

* *

```

┌─────────────────┐
│ [Menu] [Logo]   │  ← Collapsible navigation
├─────────────────┤
│                 │
│  Card View      │  ← Stacked cards
│                 │
├─────────────────┤
│                 │
│  Bottom Nav     │  ← Mobile navigation
│ [Home][Search]  │
│ [Deploy][More]  │
└─────────────────┘

```

#

## **Tablet Layout

* *

- Two-column layout for catalog and detail

s

- Collapsible sidebar navigatio

n

- Touch-friendly button size

s

- Swipe gestures for navigatio

n

#

## **Desktop Layout

* *

- Multi-column layouts with fixed sideba

r

- Keyboard shortcuts for power user

s

- Hover states and tooltip

s

- Drag-and-drop functionalit

y

--

- #

# **♿ Accessibility Feature

s

* *

#

## **WCAG 2.1 AA Complianc

e

* *

- **Keyboard Navigation**: Full keyboard suppor

t

- **Screen Reader Support**: ARIA labels and description

s

- **Color Contrast**: Minimum 4.5:1 contrast rat

i

o

- **Focus Management**: Visible focus indicator

s

- **Semantic HTML**: Proper heading hierarchy and landmark

s

#

## **Inclusive Design

* *

- **Font Scaling**: Responsive typograph

y

- **Touch Targets**: Minimum 44px touch target

s

- **Error Handling**: Clear error messages and recovery option

s

- **Loading States**: Informative loading indicator

s

- **Progressive Enhancement**: Core functionality works without JavaScrip

t

--

- #

# **🎨 Design Token

s

* *

#

## **Color System

* *

```

typescript
const colors = {
  // Primary
  primary: {
    50: '

#eff6ff',

    100: '

#dbeafe',

    500: '

#3b82f6',

    600: '

#2563eb',

    900: '

#1e3a8a'

  },

  // Semantic
  success: '

#10b981',

  warning: '

#f59e0b',

  error: '

#ef4444',

  info: '

#3b82f6'

,

  // Neutral
  gray: {
    50: '

#f9fafb',

    100: '

#f3f4f6',

    500: '

#6b7280',

    900: '

#111827'

  }
};

```

#

## **Typography Scale

* *

```

typescript
const typography = {
  fontSize: {
    xs: '0.75rem',    // 12px

    sm: '0.875rem',   // 14px

    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px

    xl: '1.25rem',    // 20px

    '2xl': '1.5rem',  // 24px

    '3xl': '1.875rem', // 30px

    '4xl': '2.25rem'  // 36px

  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};

```

#

## **Spacing Scale

* *

```

typescript
const spacing = {
  1: '0.25rem',   // 4px

  2: '0.5rem',    // 8px

  3: '0.75rem',   // 12px

  4: '1rem',      // 16px
  6: '1.5rem',    // 24px

  8: '2rem',      // 32px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  24: '6rem'      // 96px
};

```

--

- #

# **🔄 Animation & Transition

s

* *

#

## **Micro-interactions

* *

- **Hover States**: Subtle scale and shadow change

s

- **Loading States**: Smooth skeleton animation

s

- **Page Transitions**: Slide transitions between section

s

- **Button Interactions**: Scale and color transition

s

#

## **Data Visualizations

* *

- **Chart Animations**: Progressive loading of data point

s

- **Metric Updates**: Smooth number transition

s

- **Status Changes**: Color transitions for status update

s

--

- *This UI/UX specification provides a comprehensive design system for the Model Hub, ensuring consistency, usability, and an exceptional user experience across all components and interactions

.

*
