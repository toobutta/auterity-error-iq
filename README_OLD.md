# Auterity - Unified AI Platform

[![GitHub](https://img.shields.io/badge/GitHub-auterity--error--iq-blue)](https://github.com/toobutta/auterity-error-iq)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-green)](https://github.com/toobutta/auterity-error-iq)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

## 🎯 Enterprise AI Platform with Open-Source Components

Auterity is a **production-ready AI platform** that integrates three powerful open-source components into a unified system for enterprise workflow automation, AI routing, and model management.

## 🏗️ **Open-Source Components**

### **RelayCore** - AI Request Router & Cost Optimizer
[![RelayCore](https://img.shields.io/badge/component-RelayCore-blue)](docs/components/relaycore/README.md)
[![Docker](https://img.shields.io/badge/docker-available-blue)](https://hub.docker.com/r/auterity/relaycore)

**Intelligent AI routing with cost optimization**
- Multi-provider routing (OpenAI, Anthropic, Claude)
- Real-time cost optimization and budget management
- IDE plugins for VSCode, JetBrains, Claude CLI
- **Location**: `/systems/relaycore/`

### **NeuroWeaver** - ML Model Management Platform  
[![NeuroWeaver](https://img.shields.io/badge/component-NeuroWeaver-green)](docs/components/neuroweaver/README.md)
[![Docker](https://img.shields.io/badge/docker-available-green)](https://hub.docker.com/r/auterity/neuroweaver)

**Specialized AI model training and deployment**
- Automated fine-tuning with AutoRLAIF
- Industry-adaptive templates and profile kits
- Model registry and performance monitoring
- **Location**: `/systems/neuroweaver/`

### **AutoMatrix** - Visual Workflow Automation
[![AutoMatrix](https://img.shields.io/badge/component-AutoMatrix-orange)](docs/components/autmatrix/README.md)
[![Docker](https://img.shields.io/badge/docker-available-orange)](https://hub.docker.com/r/auterity/autmatrix)

**Drag-and-drop workflow builder with AI integration**
- Visual workflow designer with React Flow
- Template system with parameterization
- Real-time execution monitoring
- **Location**: `/backend/` + `/frontend/`

### **Shared Library** - Reusable Components
[![Shared](https://img.shields.io/badge/component-Shared-purple)](docs/components/shared/README.md)
[![NPM](https://img.shields.io/badge/npm-available-purple)](https://www.npmjs.com/package/@auterity/shared)

**Cross-system UI components and utilities**
- Design system with industry-adaptive themes
- Reusable React components
- Cross-system API clients
- **Location**: `/shared/`

## 📖 **Component Documentation**

**Comprehensive documentation for each open-source component:**

| Component | Overview | API Docs | Contributing | Deployment |
|-----------|----------|----------|--------------|------------|
| **RelayCore** | [📖 README](docs/components/relaycore/README.md) | [🔧 API](docs/components/relaycore/API.md) | [🤝 Guide](docs/components/relaycore/CONTRIBUTING.md) | [🚀 Deploy](docs/components/relaycore/DEPLOYMENT.md) |
| **NeuroWeaver** | [📖 README](docs/components/neuroweaver/README.md) | [🔧 API](docs/components/neuroweaver/API.md) | [🤝 Guide](docs/components/neuroweaver/CONTRIBUTING.md) | [🚀 Deploy](docs/components/neuroweaver/DEPLOYMENT.md) |
| **AutoMatrix** | [📖 README](docs/components/autmatrix/README.md) | [🔧 API](docs/components/autmatrix/API.md) | [🤝 Guide](docs/components/autmatrix/CONTRIBUTING.md) | [🚀 Deploy](docs/components/autmatrix/DEPLOYMENT.md) |
| **Shared Library** | [📖 README](docs/components/shared/README.md) | [🔧 Components](docs/components/shared/COMPONENTS.md) | [🤝 Guide](docs/components/shared/CONTRIBUTING.md) | [📦 NPM](https://www.npmjs.com/package/@auterity/shared) |

**📋 [Complete Component Overview](OPEN_SOURCE_COMPONENTS_README.md)**

## 🚀 **Quick Start Options**

### **Option 1: Full Platform (Recommended)**
```bash
# Clone and run complete platform
git clone https://github.com/toobutta/auterity-error-iq.git
cd auterity-error-iq
docker-compose up
```

### **Option 2: Individual Components**
```bash
# RelayCore only (AI Router)
docker run -p 3001:3001 auterity/relaycore:latest

# NeuroWeaver only (ML Platform)
docker run -p 3002:3002 auterity/neuroweaver:latest

# AutoMatrix only (Workflow Engine)
docker-compose -f docker-compose.component.yml up autmatrix
```

### **Option 3: Development Setup**
```bash
# Backend development
cd backend && pip install -r requirements.txt && python -m app.main

# Frontend development
cd frontend && npm install && npm run dev

# RelayCore development
cd systems/relaycore && npm install && npm run dev
```

## 📊 **Component Status**

| Component | Status | Version | Tests | Coverage | Docker | NPM |
|-----------|--------|---------|-------|----------|--------|---------|
| **RelayCore** | ✅ Stable | v1.2.0 | ✅ Passing | 92% | ✅ Available | - |
| **NeuroWeaver** | ✅ Stable | v1.1.0 | ✅ Passing | 88% | ✅ Available | - |
| **AutoMatrix** | ✅ Stable | v1.3.0 | ⚠️ Fixing | 85% | ✅ Available | - |
| **Shared Library** | ✅ Stable | v1.0.5 | ✅ Passing | 95% | - | ✅ Available |

### ✅ **Production Ready Features**
- **Three-System Architecture**: Unified AI platform with integrated components
- **Enterprise Security**: JWT authentication, SSO support, audit logging
- **Cost Optimization**: Intelligent AI routing reduces costs by 40%
- **Model Management**: Automated training and deployment pipeline
- **Visual Workflows**: Drag-and-drop builder with real-time monitoring
- **Monitoring Stack**: Prometheus, Grafana, Jaeger integration
- **Container Ready**: Docker images for all components
- **Quality Assured**: 999+ code violations resolved, security vulnerabilities patched

### 🚧 **Active Development**
- Real-time WebSocket monitoring
- Enhanced error recovery systems
- Advanced analytics and reporting
- Mobile application support

## 🛠 **Technology Stack**

### **Backend Technologies**
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and message broker
- **OpenAI GPT** - AI model integration
- **LiteLLM** - Multi-model proxy

### **Frontend Technologies**
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS
- **React Flow** - Interactive node graphs
- **Vite** - Fast build tool
- **Recharts** - Data visualization

### **Infrastructure & DevOps**
- **Docker** - Containerization
- **Kubernetes** - Container orchestration
- **Terraform** - Infrastructure as Code
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards
- **Jaeger** - Distributed tracing

## 📚 **Documentation**

### **🔧 Component Documentation**
- **[Component Overview](docs/components/README.md)** - All open-source components
- **[RelayCore Docs](docs/components/relaycore/README.md)** - AI routing and cost optimization
- **[NeuroWeaver Docs](docs/components/neuroweaver/README.md)** - ML model management
- **[AutoMatrix Docs](docs/components/autmatrix/README.md)** - Workflow automation
- **[Shared Library Docs](docs/components/shared/README.md)** - Reusable components

### **🏗️ Architecture & Integration**
- **[Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md)** - System design and data flow
- **[API Specifications](docs/API_SPECIFICATIONS.md)** - Complete API reference
- **[Integration Guide](docs/components/integration/CROSS_SYSTEM.md)** - Cross-component integration

### **🚀 Setup & Deployment**
- **[Development Setup](docs/DEVELOPMENT_SETUP.md)** - Local development guide
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Infrastructure Services](docs/INFRASTRUCTURE_SERVICES.md)** - Service details

### **📊 Operations & Monitoring**
- **[Monitoring Setup](docs/MONITORING_SETUP.md)** - Grafana, Prometheus, Jaeger
- **[Performance Optimization](docs/PERFORMANCE_OPTIMIZATION.md)** - Scaling strategies
- **[Security Guide](docs/SECURITY_GUIDE.md)** - Authentication & data protection
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues & solutions

## 🤝 **Contributing**

We welcome contributions to any component! Each has specific guidelines:

- **[General Contributing Guide](CONTRIBUTING.md)** - Overall contribution process
- **[RelayCore Contributing](docs/components/relaycore/CONTRIBUTING.md)** - AI router contributions
- **[NeuroWeaver Contributing](docs/components/neuroweaver/CONTRIBUTING.md)** - ML platform contributions
- **[AutoMatrix Contributing](docs/components/autmatrix/CONTRIBUTING.md)** - Workflow engine contributions
- **[Shared Library Contributing](docs/components/shared/CONTRIBUTING.md)** - Component library contributions

### **🏷️ Issue Labels**
Use these labels when creating issues:
- `component:relaycore` - RelayCore AI router issues
- `component:neuroweaver` - NeuroWeaver ML platform issues
- `component:autmatrix` - AutoMatrix workflow engine issues
- `component:shared` - Shared library issues
- `component:integration` - Cross-system integration issues

## 🔗 **Links & Resources**

- **[Open-Source Components Guide](OPEN_SOURCE_COMPONENTS_README.md)** - Detailed component information
- **[GitHub Issues](https://github.com/toobutta/auterity-error-iq/issues)** - Report bugs or request features
- **[GitHub Discussions](https://github.com/toobutta/auterity-error-iq/discussions)** - Community discussions
- **[Project Structure](PROJECT_STRUCTURE_COMPREHENSIVE.md)** - Complete project organization

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Component Issues**: Use component-specific labels when creating issues
- **General Questions**: Use GitHub Discussions
- **Documentation**: Check component-specific documentation first
- **Security Issues**: Please report privately via GitHub Security tab

---

**🎯 Made with ❤️ by the Auterity team and open-source contributors**

**Repository:** https://github.com/toobutta/auterity-error-iq  
**Last Updated:** February 2025  
**Status:** Production Ready with Active Open-Source Development