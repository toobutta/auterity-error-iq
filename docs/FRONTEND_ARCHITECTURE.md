# Frontend Architecture Documentation

**Document Version**: 1.0
**Last Updated**: August 8, 2025
**Maintained By**: Frontend Team

## Overview

The Auterity Unified Platform frontend is built with React 18, TypeScript, and Vite, providing a modern, performant, and type-safe user interface for workflow automation, AI routing management, and model training capabilities.

---

## Technology Stack

### Core Framework

- **React 18.2.0** - Component-based UI library with concurrent features
- **TypeScript 5.2.2** - Type-safe JavaScript development
- **Vite 7.0.6** - Modern build tool and development server
- **React Router DOM 6.18.0** - Client-side routing

### Styling & Design

- **Tailwind CSS 3.3.5** - Utility-first CSS framework
- **@tailwindcss/line-clamp** - Text truncation utilities
- **CSS Modules** - Component-scoped styling

### Data Visualization

- **React Flow 11.11.4** - Interactive workflow diagrams
- **Recharts 3.1.0** - Chart and data visualization library
- **ApexCharts 5.3.2** - Advanced charting capabilities
- **Plotly.js 3.0.3** - Scientific and statistical charts

### Development Tools

- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting
- **Vitest** - Fast unit testing framework
- **Testing Library** - Component testing utilities

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React Application                            │
├─────────────────────────────────────────────────────────────────────┤
│  App.tsx (Root Component)                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │   Providers     │ │     Router      │ │  Error Boundary │      │
│  │  • AuthProvider │ │  • Dashboard    │ │  • Global Error │      │
│  │  • ErrorProvider│ │  • Workflows    │ │    Handling     │      │
│  └─────────────────┘ │  • Templates    │ └─────────────────┘      │
│                      │  • Builder      │                          │
│                      └─────────────────┘                          │
├─────────────────────────────────────────────────────────────────────┤
│  Component Layer                                                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │   Core UI       │ │   Workflow      │ │   Monitoring    │      │
│  │  • Layout       │ │  • Builder      │ │  • Dashboards   │      │
│  │  • Auth Forms   │ │  • Execution    │ │  • Charts       │      │
│  │  • Navigation   │ │  • Templates    │ │  • Metrics      │      │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│  Shared Layer                                                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │     Hooks       │ │     Utils       │ │     Types       │      │
│  │  • useAuth      │ │  • API Client   │ │  • Interfaces   │      │
│  │  • useApi       │ │  • Formatters   │ │  • Enums        │      │
│  │  • useWorkflow  │ │  • Validators   │ │  • Models       │      │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── auth/            # Authentication components
│   │   ├── workflow-builder/ # Workflow building components
│   │   ├── charts/          # Data visualization components
│   │   ├── nodes/           # React Flow node components
│   │   └── __tests__/       # Component tests
│   ├── pages/               # Route-level page components
│   │   ├── Dashboard.tsx
│   │   ├── Workflows.tsx
│   │   ├── Templates.tsx
│   │   └── WorkflowBuilderPage.tsx
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── ErrorContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useWorkflow.ts
│   ├── api/                 # API service layer
│   │   ├── client.ts        # Axios configuration
│   │   ├── auth.ts          # Authentication API
│   │   ├── workflows.ts     # Workflow API
│   │   └── templates.ts     # Template API
│   ├── types/               # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── workflow.ts
│   │   └── api.ts
│   ├── utils/               # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── tests/               # Test utilities and setup
│   └── assets/              # Static assets
├── public/                  # Public static files
├── package.json             # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── .eslintrc.js           # ESLint configuration
```

---

## State Management

### 1. Context API Strategy

The application uses React Context for global state management, avoiding the complexity of external state management libraries while maintaining performance.

#### AuthContext

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  loading: boolean;
  error: string | null;
}
```

**Responsibilities**:

- User authentication state
- JWT token management
- Login/logout operations
- User session persistence

#### ErrorContext

```typescript
interface ErrorContextType {
  errors: ErrorRecord[];
  addError: (error: ErrorRecord) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  reportError: (error: Error, context: string) => void;
}
```

**Responsibilities**:

- Global error state management
- Error correlation and tracking
- User-friendly error display
- Error reporting to backend

### 2. Component State

Local component state is managed using:

- **useState** for simple state
- **useReducer** for complex state logic
- **useRef** for mutable references
- **useMemo/useCallback** for performance optimization

### 3. Server State

Server state management using:

- **Custom hooks** for API calls
- **SWR pattern** for data fetching
- **Optimistic updates** for better UX
- **Error boundaries** for error handling

---

## Component Architecture

### 1. Component Hierarchy

```
App
├── AuthProvider
│   ├── ErrorProvider
│   │   ├── Router
│   │   │   ├── ProtectedRoute
│   │   │   │   ├── Layout
│   │   │   │   │   ├── Navigation
│   │   │   │   │   ├── Sidebar
│   │   │   │   │   └── MainContent
│   │   │   │   │       ├── Dashboard
│   │   │   │   │       ├── Workflows
│   │   │   │   │       ├── Templates
│   │   │   │   │       └── WorkflowBuilder
│   │   │   └── PublicRoute
│   │   │       ├── LoginForm
│   │   │       └── RegisterForm
```

### 2. Component Types

#### Page Components

- **Purpose**: Route-level components
- **Responsibilities**: Data fetching, page layout, SEO
- **Example**: `Dashboard.tsx`, `Workflows.tsx`

#### Feature Components

- **Purpose**: Business logic components
- **Responsibilities**: Feature-specific functionality
- **Example**: `WorkflowBuilder.tsx`, `TemplateLibrary.tsx`

#### UI Components

- **Purpose**: Reusable interface elements
- **Responsibilities**: Pure presentation logic
- **Example**: `Button.tsx`, `Modal.tsx`, `Card.tsx`

#### Layout Components

- **Purpose**: Structural components
- **Responsibilities**: Page structure and navigation
- **Example**: `Layout.tsx`, `Navigation.tsx`

### 3. Component Best Practices

```typescript
// Example: Well-structured component
interface WorkflowCardProps {
  workflow: Workflow;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExecute: (id: string) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  onEdit,
  onDelete,
  onExecute
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleExecute = useCallback(async () => {
    if (!workflow.id) return;

    try {
      setLoading(true);
      await onExecute(workflow.id);
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setLoading(false);
    }
  }, [workflow.id, onExecute]);

  return (
    <div className="workflow-card">
      {/* Component JSX */}
    </div>
  );
};

export default WorkflowCard;
```

---

## Data Flow Patterns

### 1. API Integration

```typescript
// API Service Layer
class WorkflowService {
  static async getWorkflows(): Promise<Workflow[]> {
    const response = await apiClient.get("/api/workflows");
    return response.data;
  }

  static async createWorkflow(data: CreateWorkflowData): Promise<Workflow> {
    const response = await apiClient.post("/api/workflows", data);
    return response.data;
  }

  static async executeWorkflow(id: string): Promise<ExecutionResult> {
    const response = await apiClient.post(`/api/workflows/${id}/execute`);
    return response.data;
  }
}

// Custom Hook Usage
const useWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await WorkflowService.getWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch workflows");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return { workflows, loading, error, refetch: fetchWorkflows };
};
```

### 2. Event Handling

```typescript
// Event handling patterns
const WorkflowBuilder: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Node manipulation handlers
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
    />
  );
};
```

---

## Performance Optimization

### 1. Code Splitting & Lazy Loading

```typescript
// Lazy loading for route-level components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Workflows = lazy(() => import('./pages/Workflows'));
const Templates = lazy(() => import('./pages/Templates'));

// Component-level lazy loading
const LazyReactFlow = lazy(() => import('reactflow'));

const WorkflowBuilder = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyReactFlow {...props} />
    </Suspense>
  );
};
```

### 2. Memoization Strategies

```typescript
// Component memoization
const WorkflowCard = React.memo<WorkflowCardProps>(
  ({ workflow, onEdit }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    return (
      prevProps.workflow.id === nextProps.workflow.id &&
      prevProps.workflow.updatedAt === nextProps.workflow.updatedAt
    );
  },
);

// Hook memoization
const useFilteredWorkflows = (workflows: Workflow[], filter: string) => {
  return useMemo(() => {
    if (!filter) return workflows;
    return workflows.filter((workflow) =>
      workflow.name.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [workflows, filter]);
};
```

### 3. Bundle Optimization

- **Tree Shaking**: Remove unused code
- **Chunk Splitting**: Separate vendor and app code
- **Dynamic Imports**: Load code on demand
- **Asset Optimization**: Compress images and fonts

---

## Testing Strategy

### 1. Unit Testing

```typescript
// Component testing example
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import WorkflowCard from '../WorkflowCard';

describe('WorkflowCard', () => {
  const mockWorkflow = {
    id: '1',
    name: 'Test Workflow',
    description: 'Test Description',
    status: 'active'
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onExecute: vi.fn()
  };

  it('renders workflow information correctly', () => {
    render(<WorkflowCard workflow={mockWorkflow} {...mockHandlers} />);

    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onExecute when execute button is clicked', async () => {
    render(<WorkflowCard workflow={mockWorkflow} {...mockHandlers} />);

    fireEvent.click(screen.getByText('Execute'));

    await waitFor(() => {
      expect(mockHandlers.onExecute).toHaveBeenCalledWith('1');
    });
  });
});
```

### 2. Integration Testing

```typescript
// Hook testing
import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useWorkflows } from "../hooks/useWorkflows";

// Mock API
vi.mock("../api/workflows", () => ({
  WorkflowService: {
    getWorkflows: vi.fn(),
  },
}));

describe("useWorkflows", () => {
  it("fetches workflows on mount", async () => {
    const mockWorkflows = [{ id: "1", name: "Test" }];
    WorkflowService.getWorkflows.mockResolvedValue(mockWorkflows);

    const { result } = renderHook(() => useWorkflows());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.workflows).toEqual(mockWorkflows);
    });
  });
});
```

### 3. E2E Testing

```typescript
// Playwright E2E test example
import { test, expect } from "@playwright/test";

test("workflow creation flow", async ({ page }) => {
  await page.goto("/workflows");

  // Click create button
  await page.click('[data-testid="create-workflow"]');

  // Fill form
  await page.fill('[data-testid="workflow-name"]', "Test Workflow");
  await page.fill('[data-testid="workflow-description"]', "Test Description");

  // Submit form
  await page.click('[data-testid="submit-workflow"]');

  // Verify navigation to builder
  await expect(page).toHaveURL(/\/workflow-builder/);
});
```

---

## Error Handling

### 1. Error Boundaries

```typescript
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Report to error tracking service
    if (this.props.enableReporting) {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Send to monitoring service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      component: this.props.component,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 2. API Error Handling

```typescript
// Centralized API error handling
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response?.status === 401) {
      // Handle authentication errors
      localStorage.removeItem("token");
      window.location.href = "/login";
    } else if (response?.status >= 500) {
      // Handle server errors
      toast.error("Server error occurred. Please try again.");
    } else if (response?.status === 429) {
      // Handle rate limiting
      toast.warning("Too many requests. Please wait before trying again.");
    }

    return Promise.reject(error);
  },
);
```

---

## Security Considerations

### 1. Authentication & Authorization

```typescript
// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles
}) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.some(role => user.roles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### 2. Input Sanitization

```typescript
// Input validation and sanitization
import DOMPurify from "dompurify";

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

const validateWorkflowName = (name: string): ValidationResult => {
  const sanitized = sanitizeInput(name);

  if (!sanitized || sanitized.length < 3) {
    return { isValid: false, error: "Name must be at least 3 characters" };
  }

  if (sanitized.length > 100) {
    return { isValid: false, error: "Name must be less than 100 characters" };
  }

  return { isValid: true, value: sanitized };
};
```

### 3. Content Security Policy

```html
<!-- Content Security Policy headers -->
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.openai.com https://api.anthropic.com;
  font-src 'self';
  frame-src 'none';
"
/>
```

---

## Accessibility

### 1. ARIA Implementation

```typescript
// Accessible component example
const WorkflowStatusBadge: React.FC<{ status: WorkflowStatus }> = ({ status }) => {
  const statusConfig = {
    active: { color: 'green', label: 'Active' },
    inactive: { color: 'gray', label: 'Inactive' },
    error: { color: 'red', label: 'Error' }
  };

  const config = statusConfig[status];

  return (
    <span
      className={`badge badge-${config.color}`}
      role="status"
      aria-label={`Workflow status: ${config.label}`}
    >
      {config.label}
    </span>
  );
};
```

### 2. Keyboard Navigation

```typescript
// Keyboard navigation support
const WorkflowGrid: React.FC = () => {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
        setFocusedIndex(prev => Math.min(prev + 1, workflows.length - 1));
        break;
      case 'ArrowLeft':
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        onWorkflowSelect(workflows[focusedIndex]);
        break;
    }
  };

  return (
    <div
      role="grid"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {workflows.map((workflow, index) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          focused={index === focusedIndex}
          aria-rowindex={index + 1}
        />
      ))}
    </div>
  );
};
```

---

## Deployment & Build Process

### 1. Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          charts: ["recharts", "plotly.js"],
          flow: ["reactflow"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@components": resolve(__dirname, "src/components"),
      "@hooks": resolve(__dirname, "src/hooks"),
      "@types": resolve(__dirname, "src/types"),
    },
  },
});
```

### 2. Environment Configuration

```typescript
// Environment variables
interface EnvironmentConfig {
  REACT_APP_API_URL: string;
  REACT_APP_WS_URL: string;
  REACT_APP_ENVIRONMENT: "development" | "staging" | "production";
  REACT_APP_VERSION: string;
  REACT_APP_SENTRY_DSN?: string;
}

const config: EnvironmentConfig = {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  REACT_APP_WS_URL: process.env.REACT_APP_WS_URL || "ws://localhost:8000",
  REACT_APP_ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || "development",
  REACT_APP_VERSION: process.env.REACT_APP_VERSION || "1.0.0",
  REACT_APP_SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
};

export default config;
```

This comprehensive frontend documentation provides developers with the knowledge needed to understand, maintain, and extend the Auterity platform's user interface components and architecture.
