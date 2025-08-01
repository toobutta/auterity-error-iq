# 📚 KIRO KNOWLEDGE RESOURCES - AutoMatrix AI Hub

**Last Updated:** January 31, 2025  
**Purpose:** Comprehensive knowledge base for future development and maintenance

---

## 🎯 PROJECT OVERVIEW

### What is AutoMatrix AI Hub?
AutoMatrix AI Hub is a **workflow automation platform** designed specifically for automotive dealerships. The MVP demonstrates core AI-powered workflow capabilities through a streamlined interface, enabling dealerships to automate repetitive processes without technical expertise.

### Current Status
- **Phase:** MVP Complete - Critical Issues Resolution
- **Functionality:** 95% complete with all core features implemented
- **Quality Status:** Requires critical fixes before production deployment
- **Timeline:** Production-ready in 2-3 weeks after critical fixes

---

## 🏗️ ARCHITECTURE & TECHNOLOGY

### Technology Stack
```yaml
Backend:
  Framework: FastAPI (Python 3.11+)
  Database: PostgreSQL 15 with SQLAlchemy ORM
  AI Integration: OpenAI GPT-4 API
  Authentication: JWT-based with enterprise SSO support
  Migration: Alembic for database schema management

Frontend:
  Framework: React 18 with TypeScript
  Build Tool: Vite for fast development
  Styling: Tailwind CSS utility-first approach
  Workflow UI: React Flow for drag-and-drop interface
  Charts: Recharts for data visualization
  HTTP Client: Axios for API communication
  Testing: Vitest with React Testing Library

Development:
  Containerization: Docker and Docker Compose
  Code Quality: Black, Flake8, ESLint, Prettier
  Version Control: Git with conventional commits
  CI/CD: GitHub Actions (planned)
```

### Project Structure
```
AutoMatrix-AI-Hub/
├── backend/                 # FastAPI backend application
│   ├── app/                # Main application package
│   │   ├── api/           # API route handlers
│   │   ├── models/        # SQLAlchemy data models
│   │   ├── services/      # Business logic services
│   │   └── main.py        # Application entry point
│   ├── alembic/           # Database migrations
│   ├── tests/             # Backend test suite
│   └── requirements.txt   # Python dependencies
├── frontend/               # React frontend application
│   ├── src/               # Source code
│   │   ├── api/          # API client functions
│   │   ├── components/   # React component library
│   │   ├── contexts/     # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page-level components
│   │   ├── types/        # TypeScript definitions
│   │   └── utils/        # Utility functions
│   ├── package.json      # Node.js dependencies
│   └── vite.config.ts    # Build configuration
├── .kiro/                 # Kiro AI assistant configuration
│   ├── hooks/            # Development automation hooks
│   ├── specs/            # Project specifications
│   └── steering/         # AI assistant guidance
└── docker-compose.yml    # Development environment
```

---

## 🔧 DEVELOPMENT WORKFLOW

### Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd AutoMatrix-AI-Hub

# Copy environment configuration
cp .env.example .env

# Start development environment
docker-compose up -d

# Frontend development
cd frontend
npm install
npm run dev              # Development server on port 3000

# Backend development
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload  # Development server on port 8000
```

### Quality Assurance Commands
```bash
# Frontend quality checks
cd frontend
npm run lint             # ESLint + TypeScript checking
npm run type-check       # TypeScript compilation check
npm test                # Run test suite
npm run build           # Production build

# Backend quality checks
cd backend
black .                 # Code formatting
isort .                 # Import organization
flake8 .                # Linting and style check
pytest                  # Run test suite
alembic upgrade head    # Apply database migrations
```

### Development Best Practices
1. **Code Quality**: All code must pass linting and type checking
2. **Testing**: Maintain 90%+ test coverage for new features
3. **Documentation**: Update documentation for all API changes
4. **Security**: Never commit secrets or API keys
5. **Performance**: Monitor bundle size and runtime performance

---

## 📋 COMPONENT LIBRARY

### Core Components (Implemented)
```typescript
// Workflow Management
WorkflowBuilder.tsx          // Visual drag-and-drop workflow designer
WorkflowExecutionForm.tsx    // Dynamic form generation for workflow inputs
WorkflowExecutionResults.tsx // Results display with syntax highlighting
WorkflowExecutionHistory.tsx // History with filtering and pagination
ExecutionStatus.tsx          // Real-time execution status monitoring
ExecutionLogViewer.tsx       // Detailed execution log viewer

// Template System
TemplateLibrary.tsx          // Template browsing and search interface
TemplateCard.tsx             // Individual template preview cards
TemplateInstantiationForm.tsx // Template to workflow conversion
TemplatePreviewModal.tsx     // Detailed template preview modal
TemplateComparison.tsx       // Side-by-side template comparison

// Dashboard & Analytics
Dashboard.tsx                // Main dashboard with key metrics
PerformanceDashboard.tsx     // Performance analytics and charts
LineChart.tsx / BarChart.tsx // Reusable chart components

// Error Handling & Recovery
ErrorBoundary.tsx            // Global error boundary component
ErrorContext.tsx             // Error state management context
WorkflowErrorDisplay.tsx     // Workflow-specific error handling
ErrorReportModal.tsx         // User error reporting interface
ErrorRecoveryGuide.tsx       // Step-by-step recovery assistance

// Authentication & Layout
Layout.tsx                   // Main application layout
AuthContext.tsx              // Authentication state management
```

### API Integration Patterns
```typescript
// API Client Structure
api/
├── client.ts              // Base HTTP client configuration
├── auth.ts               // Authentication endpoints
├── workflows.ts          // Workflow CRUD operations
├── templates.ts          // Template management
└── workflows.d.ts        // TypeScript type definitions

// Usage Pattern
import { workflowsApi } from '../api/workflows';

const MyComponent = () => {
  const [workflows, setWorkflows] = useState([]);
  
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const data = await workflowsApi.getWorkflows();
        setWorkflows(data);
      } catch (error) {
        // Handle error with ErrorContext
      }
    };
    fetchWorkflows();
  }, []);
};
```

### State Management Patterns
```typescript
// Context-based state management
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// Custom hooks for state access
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Component integration
const MyComponent = () => {
  const { user, login, logout } = useAuth();
  const { reportError } = useErrorHandler();
  
  // Component logic
};
```

---

## 🚨 CRITICAL ISSUES & SOLUTIONS

### Current Critical Issues (Must Fix Before Production)

#### 1. Security Vulnerabilities (CRITICAL 🔴)
```bash
Issue: 7 moderate security vulnerabilities in frontend dependencies
Impact: Exposes application to potential security attacks
Solution: Update dependencies with breaking change testing

Commands:
cd frontend
npm audit                    # View vulnerabilities
npm audit fix --force        # Fix with breaking changes
npm test                     # Validate functionality
```

#### 2. Backend Code Quality Crisis (CRITICAL 🔴)
```bash
Issue: 500+ linting violations making codebase unmaintainable
Impact: Prevents reliable maintenance and development
Solution: Apply systematic code quality fixes

Commands:
cd backend
python -m black .           # Format code
python -m isort .           # Organize imports
python -m flake8 .          # Check remaining violations
```

#### 3. Test Infrastructure Problems (HIGH 🟡)
```bash
Issue: 35 failed tests out of 250 total (14% failure rate)
Impact: Unreliable development workflow and CI/CD pipeline
Solution: Fix test infrastructure and memory issues

Commands:
cd frontend
npm test                    # Run tests
npm run test:coverage       # Generate coverage report
```

#### 4. Bundle Size Optimization (MEDIUM 🟡)
```bash
Issue: 1.5MB bundle size impacts user experience
Impact: Slow loading times and poor performance
Solution: Implement code splitting and optimization

Commands:
cd frontend
npm run build:analyze       # Analyze bundle size
npm run build              # Build optimized version
```

### Resolution Strategy
1. **Sequential Execution**: Fix issues in dependency order
2. **Quality Gates**: Validate each fix before proceeding
3. **Rollback Plans**: Maintain git branches for easy rollback
4. **Comprehensive Testing**: Manual and automated validation

---

## 🎯 TASK DELEGATION FRAMEWORK

### Tool Selection Guidelines

#### Cline (Development Implementation)
**Best For:**
- Component development with clear specifications
- Code quality fixes and refactoring
- Test infrastructure repair
- Bundle optimization and performance improvements

**Model Recommendations:**
- **Cerebras Qwen-3-32b**: Fast, efficient for standard development tasks
- **Cerebras llama-3.3-70b**: Complex logic and form handling
- **Claude-3.5-Sonnet**: Advanced analysis and architecture decisions

#### Amazon Q (AWS & Enterprise Features)
**Best For:**
- AWS architecture and deployment planning
- Enterprise authentication (SSO, SAML, OIDC)
- Security and compliance implementation
- Infrastructure as Code development

**Strengths:**
- Deep AWS service knowledge
- Enterprise authentication expertise
- Security best practices
- Cost optimization strategies

#### Kiro (Architecture & Strategy)
**Best For:**
- System architecture decisions
- Complex state management
- UX/UI design choices
- Multi-tool coordination
- Performance optimization strategy

### Task Specification Requirements
```markdown
# Task Specification Template

## Task Overview
- **Task Name**: Clear, descriptive name
- **Priority**: Critical/High/Medium/Low
- **Estimated Time**: Realistic time estimate
- **Complexity**: Low/Medium/High assessment

## Technical Requirements
- **Files to Create/Modify**: Specific file paths
- **API Integration**: Required endpoints and data flow
- **Dependencies**: Prerequisites and blockers
- **Success Criteria**: Measurable acceptance criteria

## Implementation Details
- **Component Interface**: TypeScript interfaces
- **Styling Requirements**: Tailwind classes and responsive design
- **Error Handling**: Specific error scenarios to handle
- **Testing Requirements**: Unit and integration test expectations

## Quality Standards
- **TypeScript**: Strict typing, no 'any' types
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: Bundle size impact, optimization requirements
- **Documentation**: Code comments and usage examples
```

---

## 🔍 MONITORING & MAINTENANCE

### Health Monitoring Metrics
```yaml
Security:
  - Dependency vulnerabilities: 0 (currently 7)
  - Exposed secrets: 0
  - Authentication failures: <1%

Code Quality:
  - TypeScript errors: 0 (currently 19)
  - Linting violations: 0 (currently 500+)
  - Test coverage: >90% (currently ~80%)

Performance:
  - Bundle size: <1MB (currently 1.5MB)
  - Build time: <2 minutes
  - Test execution: <30 seconds

Reliability:
  - Test success rate: >95% (currently 82.4%)
  - Uptime: >99.9%
  - Error rate: <0.1%
```

### Automated Quality Gates
```bash
# Pre-commit hooks
npm audit                    # Security check
npm run lint                # Code quality
npm run type-check          # TypeScript compliance
npm test                    # Test reliability

# CI/CD pipeline checks
npm run build               # Build success
npm run test:coverage       # Coverage requirements
docker build .              # Container build
```

### Maintenance Schedule
- **Daily**: Automated security scans and dependency checks
- **Weekly**: Code quality review and test coverage analysis
- **Monthly**: Performance optimization and bundle size review
- **Quarterly**: Architecture review and technology updates

---

## 📖 LEARNING RESOURCES

### Key Documentation
- **FastAPI**: https://fastapi.tiangolo.com/
- **React 18**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Flow**: https://reactflow.dev/
- **Vitest**: https://vitest.dev/

### Best Practices References
- **React Patterns**: https://reactpatterns.com/
- **TypeScript Best Practices**: https://typescript-eslint.io/
- **API Design**: https://restfulapi.net/
- **Security Guidelines**: https://owasp.org/

### Troubleshooting Guides
- **Common TypeScript Errors**: Fix 'any' types, missing imports
- **Test Failures**: Mock configuration, memory issues
- **Build Issues**: Dependency conflicts, bundle optimization
- **Performance Problems**: Bundle analysis, code splitting

---

## 🚀 FUTURE ROADMAP

### Phase 1: Critical Fixes (Weeks 1-2)
- ✅ Security vulnerability resolution
- ✅ Backend code quality improvements
- ✅ Test infrastructure repair
- ✅ Bundle size optimization

### Phase 2: Enterprise Features (Weeks 3-4)
- 🚀 Enterprise SSO implementation
- 🚀 Production AWS deployment
- 🚀 Advanced monitoring and logging
- 🚀 Performance optimization

### Phase 3: Advanced Features (Months 2-3)
- 📋 Multi-tenant architecture
- 📋 Advanced workflow templates
- 📋 Integration marketplace
- 📋 Mobile application

### Phase 4: Scale & Optimize (Months 4-6)
- 📋 Microservices architecture
- 📋 Advanced analytics and reporting
- 📋 AI model fine-tuning
- 📋 Enterprise integrations

---

## 💡 SUCCESS PATTERNS

### What Works Well
1. **Component-based Architecture**: Modular, reusable components
2. **TypeScript Integration**: Strong typing prevents runtime errors
3. **Context-based State Management**: Clean, predictable state flow
4. **Comprehensive Error Handling**: User-friendly error experiences
5. **Automated Quality Checks**: Consistent code quality standards

### Common Pitfalls to Avoid
1. **Excessive 'any' Types**: Reduces TypeScript benefits
2. **Large Bundle Sizes**: Impacts user experience
3. **Inconsistent Error Handling**: Confuses users
4. **Missing Test Coverage**: Leads to production bugs
5. **Security Vulnerabilities**: Exposes application to attacks

### Development Velocity Tips
1. **Use Existing Patterns**: Follow established component patterns
2. **Leverage Type Definitions**: Reuse existing TypeScript interfaces
3. **Implement Error Boundaries**: Graceful error handling
4. **Write Tests First**: Prevents regression issues
5. **Monitor Bundle Size**: Keep performance optimal

---

**🎯 BOTTOM LINE:** This knowledge resource provides comprehensive guidance for maintaining and extending the AutoMatrix AI Hub platform. Use it as a reference for development decisions, troubleshooting, and future planning.