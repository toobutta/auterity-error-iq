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

#### 🔴 Critical Priority
- **SECURITY**: Fix 3 moderate vulnerabilities in frontend dependencies
- **CODE QUALITY**: Fix 108 TypeScript linting errors
- **BACKEND**: Code quality assessment and fixes

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

- [Current Project Status](CURRENT_PROJECT_STATUS.md)
- [Enterprise SSO](docs/ENTERPRISE_SSO.md)
- [Realtime Monitoring](docs/REALTIME_MONITORING_IMPLEMENTATION.md)
- [Infrastructure](docs/AutoMatrix-IaC-Starter-Terraform.md)

---

**Repository:** https://github.com/toobutta/auterity-error-iq  
**Last Updated:** $(date)  
**Project Phase:** MVP Completion