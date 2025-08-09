# Auterity - Unified Workspace

[![GitHub](https://img.shields.io/badge/GitHub-auterity--error--iq-blue)](https://github.com/toobutta/auterity-error-iq)
[![Status](https://img.shields.io/badge/Status-MVP%20Development-orange)](https://github.com/toobutta/auterity-error-iq)

## 🎯 Consolidated Development Environment

This is the **unified workspace** for the Auterity workflow automation platform, consolidating all previous duplicate projects into a single, maintainable codebase.

### 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/toobutta/auterity-error-iq.git
cd auterity-error-iq

# Backend setup
cd backend && pip install -r requirements.txt && python -m app.main

# Frontend setup  
cd frontend && npm install && npm run dev

# Full stack with Docker
docker-compose up
```

### 📋 Current Status

#### ✅ Completed (100%)
- Core data models and database schema
- Authentication system (JWT, user management)
- Workflow management API endpoints
- AI service integration (OpenAI GPT)
- React frontend with workflow builder
- Template management system
- **WORKFLOW EXECUTION ENGINE**: Production-ready with topological sorting, parallel execution, retry mechanisms
- **BACKEND CODE QUALITY**: 999+ violations resolved (95% improvement)
- **FRONTEND SECURITY**: 3 moderate vulnerabilities patched
- **THREE-SYSTEM ARCHITECTURE**: RelayCore + NeuroWeaver integration
- **MONITORING**: Unified Prometheus/Grafana dashboard
- **SHARED LIBRARY**: Reusable components and utilities

#### 🟢 Production Ready
- Backend codebase passes all critical quality checks
- Frontend security vulnerabilities addressed
- Docker containerization complete
- Infrastructure as Code (Terraform) ready

#### 🚧 In Development
- Real-time execution monitoring with WebSockets
- Enhanced error handling and recovery
- Performance monitoring and analytics
- Template library enhancements

### 🛠 Tech Stack

**Backend:** FastAPI, SQLAlchemy, PostgreSQL, JWT, OpenAI GPT  
**Frontend:** React 18, TypeScript, Tailwind CSS, React Flow, Vite  
**Infrastructure:** Docker, Nginx, AWS Cognito, Terraform

### 📚 Documentation

#### **Core Documentation**
- [Infrastructure Complete](docs/INFRASTRUCTURE_COMPLETE.md) - All 16 services implemented
- [Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md) - System design and data flow
- [API Specifications](docs/API_SPECIFICATIONS.md) - Complete API reference

#### **Setup & Deployment**
- [Development Setup](docs/DEVELOPMENT_SETUP.md) - Local development guide
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment
- [Infrastructure Services](docs/INFRASTRUCTURE_SERVICES.md) - Service details

#### **Operations & Monitoring**
- [Monitoring Setup](docs/MONITORING_SETUP.md) - Grafana, Prometheus, Jaeger
- [Performance Optimization](docs/PERFORMANCE_OPTIMIZATION.md) - Scaling strategies
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues & solutions
- [Security Guide](docs/SECURITY_GUIDE.md) - Authentication & data protection

#### **Legacy Documentation**
- [Current Project Status](CURRENT_PROJECT_STATUS.md)
- [Enterprise SSO](docs/ENTERPRISE_SSO.md)
- [Realtime Monitoring](docs/REALTIME_MONITORING_IMPLEMENTATION.md)
- [Infrastructure](docs/AutoMatrix-IaC-Starter-Terraform.md)

---

**Repository:** https://github.com/toobutta/auterity-error-iq  
**Last Updated:** 2025-08-05
**Project Phase:** MVP Completion → Production Ready