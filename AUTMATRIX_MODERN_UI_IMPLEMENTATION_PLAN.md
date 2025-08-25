# 🚗 AutoMatrix AI Hub - Modern UI/UX Implementation Plan

## 🎯 Project Overview

**Platform**: AutoMatrix AI Hub - Automotive Dealership Workflow Automation
**Current Stack**: React 18.2.0 + TypeScript 5.2.2 + Vite 7.0.6 + TailwindCSS 3.3.5
**Core Features**: Drag-and-drop workflow builder, automotive-specific nodes, template system, real-time monitoring

## 🎨 Modern Design System Foundation

### **1. Automotive-Themed Color Palette**

```css
:root {
  /* Primary Automotive Colors */
  --automotive-blue: #1e40af; /* Professional Blue */
  --automotive-silver: #64748b; /* Metallic Silver */
  --automotive-gold: #f59e0b; /* Accent Gold */
  --automotive-red: #dc2626; /* Alert Red */
  --automotive-green: #059669; /* Success Green */

  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.12);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  --gradient-accent: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  --gradient-success: linear-gradient(135deg, #059669 0%, #10b981 100%);

  /* Dark Mode Support */
  --dark-bg: #0f172a;
  --dark-surface: #1e293b;
  --dark-text: #f8fafc;
}
```

### **2. Typography System**

```css
/* Inter Font Family for Modern Feel */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

.font-automotive {
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

/* Typography Scale */
.text-display {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
}
.text-heading-1 {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
}
.text-heading-2 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
}
.text-body-large {
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1.6;
}
.text-body {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6;
}
.text-caption {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
}
```

### **3. Modern Animation System**

```css
/* Micro-interactions */
.hover-lift {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Smooth transitions */
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.transition-bounce {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Loading animations */
@keyframes pulse-automotive {
  0%,
  100% {
    opacity: 1;
    background-color: var(--automotive-blue);
  }
  50% {
    opacity: 0.7;
    background-color: var(--automotive-silver);
  }
}
```

## 🏗️ Component Modernization Strategy

### **Phase 1: Core Infrastructure (Week 1)**

#### **1.1 Modern Design System Setup**

```typescript
// frontend/src/lib/design-tokens.ts
export const automotiveDesignTokens = {
  colors: {
    primary: {
      50: "#eff6ff",
      500: "#1e40af",
      900: "#1e3a8a",
    },
    automotive: {
      blue: "#1e40af",
      silver: "#64748b",
      gold: "#f59e0b",
      red: "#dc2626",
      green: "#059669",
    },
    semantic: {
      dealership: "#1e40af",
      inventory: "#059669",
      customer: "#f59e0b",
      service: "#8b5cf6",
      finance: "#06b6d4",
    },
  },
  spacing: {
    automotive: {
      compact: "4px",
      comfortable: "8px",
      spacious: "16px",
      dashboard: "24px",
    },
  },
  shadows: {
    automotive: {
      card: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      elevated: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      floating: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    },
  },
};
```

#### **1.2 Enhanced Utility Classes**

```css
/* frontend/src/styles/automotive-utilities.css */
@layer utilities {
  /* Glassmorphism */
  .glass-card {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 16px;
  }

  /* Automotive Gradients */
  .bg-automotive-primary {
    background: var(--gradient-primary);
  }
  .bg-automotive-accent {
    background: var(--gradient-accent);
  }
  .bg-automotive-success {
    background: var(--gradient-success);
  }

  /* Node Type Colors */
  .node-customer {
    @apply bg-yellow-50 border-yellow-200 text-yellow-800;
  }
  .node-inventory {
    @apply bg-green-50 border-green-200 text-green-800;
  }
  .node-service {
    @apply bg-purple-50 border-purple-200 text-purple-800;
  }
  .node-finance {
    @apply bg-cyan-50 border-cyan-200 text-cyan-800;
  }

  /* Interactive States */
  .interactive-hover {
    @apply transition-all duration-200 hover:scale-105 hover:shadow-lg;
  }

  /* Dashboard Metrics */
  .metric-card {
    @apply glass-card p-6 hover-lift transition-smooth;
  }
}
```

### **Phase 2: Navigation & Layout (Week 1-2)**

#### **2.1 Modern Layout.tsx Enhancement**

```typescript
// frontend/src/components/Layout.tsx - Enhanced Version
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { DashboardIcon, WorkflowIcon, TemplateIcon, SettingsIcon } from './icons';

const ModernLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Modern Sidebar */}
      <aside className={`fixed left-0 top-0 h-full glass-card transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-automotive-primary rounded-lg flex items-center justify-center">
              🚗
            </div>
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-automotive-blue">AutoMatrix AI</h1>
            )}
          </div>
        </div>

        <nav className="mt-8 space-y-2 px-4">
          <NavItem icon={<DashboardIcon />} label="Dashboard" href="/dashboard" collapsed={sidebarCollapsed} />
          <NavItem icon={<WorkflowIcon />} label="Workflows" href="/workflows" collapsed={sidebarCollapsed} />
          <NavItem icon={<TemplateIcon />} label="Templates" href="/templates" collapsed={sidebarCollapsed} />
          <NavItem icon={<SettingsIcon />} label="Settings" href="/settings" collapsed={sidebarCollapsed} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top Bar */}
        <header className="h-16 glass-card flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            ☰
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <div className="w-8 h-8 rounded-full bg-automotive-gold"></div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
```

#### **2.2 Enhanced Navigation Component**

```typescript
// frontend/src/components/NavItem.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, href, collapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${
        isActive
          ? 'bg-automotive-primary text-white shadow-lg'
          : 'text-gray-600 hover:bg-white/10 hover:text-automotive-blue'
      }`}
    >
      <div className={`transition-transform duration-200 ${!collapsed && 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {!collapsed && (
        <span className="font-medium transition-all duration-200">{label}</span>
      )}
    </Link>
  );
};
```

### **Phase 3: Workflow Builder Modernization (Week 2-3)**

#### **3.1 Enhanced Workflow Builder UI**

```typescript
// frontend/src/components/workflow-builder/ModernWorkflowBuilder.tsx
import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge
} from 'reactflow';
import { ModernNodePalette } from './ModernNodePalette';
import { ModernCanvas } from './ModernCanvas';
import { WorkflowToolbar } from './WorkflowToolbar';

const ModernWorkflowBuilder: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modern Node Palette */}
      <ModernNodePalette
        onNodeSelect={setSelectedNodeType}
        selectedNodeType={selectedNodeType}
      />

      {/* Canvas Area */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <WorkflowToolbar
          onSave={() => {}}
          onTest={() => {}}
          onDeploy={() => {}}
        />

        {/* React Flow Canvas */}
        <div className="h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            className="bg-transparent"
            nodeTypes={{
              customerInquiry: CustomerInquiryNode,
              inventoryUpdate: InventoryUpdateNode,
              serviceSchedule: ServiceScheduleNode,
              financeApproval: FinanceApprovalNode,
            }}
          >
            <Background
              color="#64748b"
              gap={20}
              size={1}
              style={{ opacity: 0.1 }}
            />
            <Controls
              className="glass-card"
              showZoom={true}
              showFitView={true}
              showInteractive={true}
            />
            <MiniMap
              className="glass-card"
              nodeColor="#1e40af"
              maskColor="rgba(255, 255, 255, 0.2)"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};
```

#### **3.2 Modern Node Palette**

```typescript
// frontend/src/components/workflow-builder/ModernNodePalette.tsx
import React from 'react';
import { DragPreviewImage, useDrag } from 'react-dnd';

interface NodePaletteProps {
  onNodeSelect: (nodeType: string) => void;
  selectedNodeType: string | null;
}

const automotiveNodeCategories = [
  {
    name: 'Customer Management',
    icon: '👥',
    color: 'bg-yellow-50 border-yellow-200',
    nodes: [
      { type: 'customerInquiry', name: 'Customer Inquiry', icon: '📞', description: 'Handle customer inquiries and leads' },
      { type: 'testDrive', name: 'Test Drive', icon: '🚗', description: 'Schedule and manage test drives' },
      { type: 'followUp', name: 'Follow Up', icon: '📧', description: 'Automated customer follow-up' }
    ]
  },
  {
    name: 'Inventory Management',
    icon: '📊',
    color: 'bg-green-50 border-green-200',
    nodes: [
      { type: 'inventoryUpdate', name: 'Inventory Update', icon: '📦', description: 'Update vehicle inventory' },
      { type: 'priceAlert', name: 'Price Alert', icon: '💰', description: 'Monitor pricing changes' },
      { type: 'reorderAlert', name: 'Reorder Alert', icon: '🔔', description: 'Automatic reorder notifications' }
    ]
  },
  {
    name: 'Service Department',
    icon: '🔧',
    color: 'bg-purple-50 border-purple-200',
    nodes: [
      { type: 'serviceSchedule', name: 'Service Schedule', icon: '📅', description: 'Schedule service appointments' },
      { type: 'maintenance', name: 'Maintenance Alert', icon: '⚠️', description: 'Scheduled maintenance reminders' },
      { type: 'warranty', name: 'Warranty Check', icon: '🛡️', description: 'Warranty validation' }
    ]
  },
  {
    name: 'Finance & Insurance',
    icon: '💳',
    color: 'bg-cyan-50 border-cyan-200',
    nodes: [
      { type: 'financeApproval', name: 'Finance Approval', icon: '✅', description: 'Finance application processing' },
      { type: 'insurance', name: 'Insurance Quote', icon: '🏠', description: 'Insurance quotation' },
      { type: 'creditCheck', name: 'Credit Check', icon: '📊', description: 'Credit score verification' }
    ]
  }
];

export const ModernNodePalette: React.FC<NodePaletteProps> = ({
  onNodeSelect,
  selectedNodeType
}) => {
  return (
    <div className="w-80 glass-card m-4 overflow-y-auto">
      <div className="p-4 border-b border-white/20">
        <h2 className="text-lg font-semibold text-automotive-blue flex items-center">
          🚗 <span className="ml-2">Automotive Nodes</span>
        </h2>
        <p className="text-sm text-gray-600 mt-1">Drag nodes to build workflows</p>
      </div>

      <div className="p-4 space-y-4">
        {automotiveNodeCategories.map((category) => (
          <div key={category.name} className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <span className="text-lg">{category.icon}</span>
              <span>{category.name}</span>
            </div>

            <div className="space-y-2">
              {category.nodes.map((node) => (
                <DraggableNode
                  key={node.type}
                  node={node}
                  categoryColor={category.color}
                  isSelected={selectedNodeType === node.type}
                  onSelect={() => onNodeSelect(node.type)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DraggableNode: React.FC<{
  node: any;
  categoryColor: string;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ node, categoryColor, isSelected, onSelect }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'workflow-node',
    item: { type: node.type, name: node.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-move transition-all duration-200 hover-lift ${
        categoryColor
      } ${
        isSelected
          ? 'ring-2 ring-automotive-blue shadow-lg'
          : 'hover:shadow-md'
      } ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{node.icon}</div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{node.name}</h4>
          <p className="text-xs text-gray-600 mt-1">{node.description}</p>
        </div>
      </div>
    </div>
  );
};
```

### **Phase 4: Dashboard Modernization (Week 3)**

#### **4.1 Modern Dashboard Page**

```typescript
// frontend/src/pages/ModernDashboard.tsx
import React, { Suspense } from 'react';
import { MetricCard } from '../components/MetricCard';
import { WorkflowStatusChart } from '../components/charts/WorkflowStatusChart';
import { RecentActivityFeed } from '../components/RecentActivityFeed';
import { QuickActions } from '../components/QuickActions';

const ModernDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">AutoMatrix AI Hub - Dealership Operations</p>
        </div>
        <QuickActions />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Workflows"
          value="147"
          change="+12%"
          changeType="positive"
          icon="🔄"
          gradient="bg-automotive-primary"
        />
        <MetricCard
          title="Customer Inquiries"
          value="89"
          change="+8%"
          changeType="positive"
          icon="📞"
          gradient="bg-automotive-accent"
        />
        <MetricCard
          title="Service Appointments"
          value="234"
          change="+15%"
          changeType="positive"
          icon="🔧"
          gradient="bg-automotive-success"
        />
        <MetricCard
          title="Monthly Revenue"
          value="$45.2k"
          change="+22%"
          changeType="positive"
          icon="💰"
          gradient="bg-gradient-to-r from-green-500 to-emerald-600"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Status Chart */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold mb-4">Workflow Performance</h2>
            <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading...</div>}>
              <WorkflowStatusChart />
            </Suspense>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <RecentActivityFeed />
        </div>
      </div>
    </div>
  );
};
```

#### **4.2 Modern Metric Card Component**

```typescript
// frontend/src/components/MetricCard.tsx
import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  gradient: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  gradient
}) => {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <div className="metric-card group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <p className={`text-sm font-medium ${changeColor} flex items-center`}>
              <span className="mr-1">
                {changeType === 'positive' ? '↗️' : changeType === 'negative' ? '↘️' : '→'}
              </span>
              {change}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-lg ${gradient} text-white text-2xl transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
      </div>

      {/* Subtle bottom border animation */}
      <div className="absolute bottom-0 left-0 w-0 h-1 bg-automotive-blue transition-all duration-300 group-hover:w-full rounded-full"></div>
    </div>
  );
};
```

### **Phase 5: Authentication & Forms (Week 4)**

#### **5.1 Modern Login Form**

```typescript
// frontend/src/components/auth/ModernLoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const ModernLoginForm: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-automotive-primary rounded-2xl mb-4">
            <span className="text-2xl text-white">🚗</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to AutoMatrix AI Hub</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-card p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-automotive-blue focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-automotive-blue focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-3 px-4 bg-automotive-primary text-white rounded-lg font-medium hover-lift transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-automotive-blue hover:text-automotive-blue/80">
                  Sign up
                </Link>
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
```

## 🎨 Advanced Features Implementation

### **1. Dark Mode System**

```typescript
// frontend/src/hooks/useTheme.ts
import { useState, useEffect, createContext, useContext } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    if (theme === 'auto') {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setIsDark(theme === 'dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### **2. Advanced Animation System**

```css
/* frontend/src/styles/animations.css */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

/* Utility classes */
.animate-slide-in-up {
  animation: slideInUp 0.5s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out;
}

.animate-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    110deg,
    transparent 40%,
    rgba(255, 255, 255, 0.5) 50%,
    transparent 60%
  );
  background-size: 200px 100%;
}
```

### **3. Responsive Grid System**

```css
/* frontend/src/styles/grid.css */
.automotive-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.automotive-grid-dashboard {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(12, 1fr);
}

.automotive-grid-workflow {
  display: grid;
  gap: 1rem;
  grid-template-columns: 320px 1fr;
  height: 100vh;
}

@media (max-width: 768px) {
  .automotive-grid-workflow {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}
```

## 📊 Implementation Timeline

### **Week 1: Foundation**

- [ ] Design system setup
- [ ] Modern utilities and animations
- [ ] Enhanced Layout and Navigation
- [ ] Theme system implementation

### **Week 2: Core Components**

- [ ] Workflow Builder modernization
- [ ] Node Palette enhancement
- [ ] Canvas and toolbar updates
- [ ] Drag-and-drop improvements

### **Week 3: Dashboard & Templates**

- [ ] Dashboard page modernization
- [ ] Metric cards and charts
- [ ] Template library enhancement
- [ ] Template preview modernization

### **Week 4: Authentication & Polish**

- [ ] Modern login/registration forms
- [ ] User management interface
- [ ] Settings and preferences
- [ ] Final polish and testing

## 🚀 Success Metrics

### **Performance Targets**

- [ ] Lighthouse Performance Score: 90+
- [ ] First Contentful Paint: <1.5s
- [ ] Cumulative Layout Shift: <0.1
- [ ] Bundle size reduction: 20%

### **User Experience Goals**

- [ ] 40% reduction in task completion time
- [ ] 90% user satisfaction score
- [ ] Mobile responsiveness: 100%
- [ ] Accessibility score: WCAG 2.2 AA

### **Technical Excellence**

- [ ] Component library: 100% TypeScript
- [ ] Test coverage: 85%+
- [ ] Storybook documentation: Complete
- [ ] Dark mode: Full support

## 🎯 Next Steps

1. **Immediate**: Start with design system foundation
2. **Priority**: Navigation and layout modernization
3. **Core**: Workflow builder enhancement
4. **Polish**: Authentication and final touches

This comprehensive plan transforms AutoMatrix AI Hub into a modern, automotive-focused workflow automation platform with sleek design, enhanced user experience, and professional aesthetics suitable for dealership operations.
