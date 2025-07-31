# AutoMatrix AI Hub - Technology Stack Overview

**Document Version**: 1.0  
**Last Updated**: January 31, 2025  
**Maintained By**: Development Team  

## Executive Summary

AutoMatrix AI Hub is a workflow automation platform built for automotive dealerships, utilizing a modern full-stack architecture with AI integration. The system is containerized for easy deployment and scalability.

---

## Core Technology Stack

### Backend Framework & Runtime
- **FastAPI** v0.104.1 - Modern Python web framework for building APIs
  - **Vendor**: Sebastián Ramirez / FastAPI Team
  - **License**: MIT
  - **Purpose**: REST API development with automatic OpenAPI documentation
  - **Key Features**: Async support, automatic validation, dependency injection

- **Python** 3.11+ - Programming language runtime
  - **Vendor**: Python Software Foundation
  - **License**: Python Software Foundation License
  - **Purpose**: Backend application development

- **Uvicorn** v0.24.0 - ASGI server implementation
  - **Vendor**: Encode
  - **License**: BSD
  - **Purpose**: Production ASGI server for FastAPI applications

### Database & ORM
- **PostgreSQL** 15 - Primary database system
  - **Vendor**: PostgreSQL Global Development Group
  - **License**: PostgreSQL License (BSD-style)
  - **Purpose**: Primary data storage for workflows, users, and execution logs
  - **Configuration**: Containerized with persistent volumes

- **SQLAlchemy** v2.0.23 - Python ORM
  - **Vendor**: SQLAlchemy authors
  - **License**: MIT
  - **Purpose**: Database abstraction and ORM functionality

- **Alembic** v1.12.1 - Database migration tool
  - **Vendor**: SQLAlchemy authors
  - **License**: MIT
  - **Purpose**: Database schema versioning and migrations

- **psycopg2-binary** v2.9.9 - PostgreSQL adapter
  - **Vendor**: Federico Di Gregorio
  - **License**: LGPL
  - **Purpose**: PostgreSQL database connectivity

### AI & Machine Learning
- **OpenAI API** - AI workflow execution engine
  - **Vendor**: OpenAI
  - **Service Type**: Cloud API
  - **Purpose**: GPT-powered workflow step execution and natural language processing
  - **Integration**: Via openai Python client v1.3.7
  - **Cost Model**: Pay-per-token usage

### Authentication & Security
- **python-jose[cryptography]** v3.3.0 - JWT handling
  - **Vendor**: José Padilla
  - **License**: MIT
  - **Purpose**: JWT token creation and validation

- **passlib[bcrypt]** v1.7.4 - Password hashing
  - **Vendor**: Eli Collins
  - **License**: BSD
  - **Purpose**: Secure password hashing with bcrypt

### Frontend Framework & Build Tools
- **React** v18.2.0 - Frontend JavaScript library
  - **Vendor**: Meta (Facebook)
  - **License**: MIT
  - **Purpose**: User interface development

- **TypeScript** v5.2.2 - Type-safe JavaScript
  - **Vendor**: Microsoft
  - **License**: Apache 2.0
  - **Purpose**: Type safety and enhanced development experience

- **Vite** v4.5.0 - Build tool and development server
  - **Vendor**: Evan You / Vite Team
  - **License**: MIT
  - **Purpose**: Fast development server and production builds

- **React Router DOM** v6.18.0 - Client-side routing
  - **Vendor**: Remix Software
  - **License**: MIT
  - **Purpose**: Single-page application routing

### UI Components & Styling
- **Tailwind CSS** v3.3.5 - Utility-first CSS framework
  - **Vendor**: Tailwind Labs
  - **License**: MIT
  - **Purpose**: Responsive design and styling

- **React Flow Renderer** v10.3.17 - Workflow visualization
  - **Vendor**: webkid GmbH
  - **License**: MIT
  - **Purpose**: Drag-and-drop workflow builder interface

- **ReactFlow** v11.11.4 - Enhanced workflow components
  - **Vendor**: webkid GmbH
  - **License**: MIT
  - **Purpose**: Advanced workflow visualization features

### Data Visualization
- **Recharts** v3.1.0 - React charting library
  - **Vendor**: Recharts Group
  - **License**: MIT
  - **Purpose**: Dashboard charts and analytics visualization

- **ApexCharts** v5.3.2 - Interactive charts (root dependency)
  - **Vendor**: ApexCharts
  - **License**: MIT
  - **Purpose**: Advanced charting capabilities

- **Plotly.js** v3.0.3 - Scientific plotting library (root dependency)
  - **Vendor**: Plotly
  - **License**: MIT
  - **Purpose**: Complex data visualization

### HTTP Client & API Integration
- **Axios** v1.6.0 - HTTP client library
  - **Vendor**: Matt Zabriskie
  - **License**: MIT
  - **Purpose**: API communication between frontend and backend

### Code Quality & Development Tools

#### Backend Tools
- **Black** v23.11.0 - Python code formatter
  - **Vendor**: Python Software Foundation
  - **License**: MIT
  - **Configuration**: 88 character line length

- **Flake8** v6.1.0 - Python linter
  - **Vendor**: Python Code Quality Authority
  - **License**: MIT
  - **Purpose**: Code quality and style enforcement

- **isort** v5.12.0 - Python import sorter
  - **Vendor**: Timothy Crosley
  - **License**: MIT
  - **Purpose**: Import statement organization

#### Frontend Tools
- **ESLint** v8.53.0 - JavaScript/TypeScript linter
  - **Vendor**: ESLint Team
  - **License**: MIT
  - **Purpose**: Code quality and style enforcement

- **Prettier** v3.0.3 - Code formatter
  - **Vendor**: Prettier Team
  - **License**: MIT
  - **Purpose**: Consistent code formatting

### Testing Frameworks
- **pytest** v7.4.3 - Python testing framework
  - **Vendor**: Holger Krekel
  - **License**: MIT
  - **Purpose**: Backend unit and integration testing

- **pytest-asyncio** v0.21.1 - Async testing support
  - **Vendor**: pytest-asyncio contributors
  - **License**: Apache 2.0
  - **Purpose**: Testing async FastAPI endpoints

- **Vitest** v0.34.6 - Frontend testing framework
  - **Vendor**: Anthony Fu
  - **License**: MIT
  - **Purpose**: Fast unit testing for React components

- **@testing-library/react** v13.4.0 - React testing utilities
  - **Vendor**: Kent C. Dodds
  - **License**: MIT
  - **Purpose**: Component testing with user-centric approach

- **HTTPX** v0.25.2 - Async HTTP client for testing
  - **Vendor**: Encode
  - **License**: BSD
  - **Purpose**: API testing and mocking

---

## Infrastructure & Deployment

### Containerization
- **Docker** - Container platform
  - **Vendor**: Docker Inc.
  - **License**: Apache 2.0
  - **Purpose**: Application containerization and deployment
  - **Images Used**:
    - `postgres:15` - Database container
    - `nginx:alpine` - Web server and reverse proxy
    - Custom Python 3.11 images for backend
    - Custom Node.js images for frontend

- **Docker Compose** - Multi-container orchestration
  - **Vendor**: Docker Inc.
  - **License**: Apache 2.0
  - **Purpose**: Local development and production deployment orchestration

### Web Server & Reverse Proxy
- **Nginx** (Alpine) - Web server and reverse proxy
  - **Vendor**: Nginx Inc.
  - **License**: BSD-2-Clause
  - **Purpose**: Static file serving, reverse proxy, SSL termination
  - **Configuration**: Custom nginx.conf for production routing

### Production Server
- **Gunicorn** v21.2.0 - WSGI HTTP Server
  - **Vendor**: Benoit Chesneau
  - **License**: MIT
  - **Purpose**: Production Python application server

### Cloud Infrastructure (Planned)
- **Amazon Web Services (AWS)** - Cloud platform
  - **Vendor**: Amazon Web Services
  - **Service Type**: Cloud Infrastructure
  - **Planned Services**:
    - **EC2** - Virtual servers
    - **RDS PostgreSQL** - Managed database
    - **VPC** - Virtual private cloud
    - **Route 53** - DNS management
    - **Certificate Manager** - SSL certificates

- **Terraform** v1.3.0+ - Infrastructure as Code
  - **Vendor**: HashiCorp
  - **License**: MPL 2.0
  - **Purpose**: Cloud infrastructure provisioning and management

---

## Development Environment

### Package Managers
- **npm** - Node.js package manager
  - **Vendor**: npm Inc.
  - **License**: Artistic License 2.0
  - **Purpose**: Frontend dependency management

- **pip** - Python package manager
  - **Vendor**: Python Packaging Authority
  - **License**: MIT
  - **Purpose**: Backend dependency management

### Development Tools
- **PostCSS** v8.4.31 - CSS processing tool
  - **Vendor**: Andrey Sitnik
  - **License**: MIT
  - **Purpose**: CSS transformation and optimization

- **Autoprefixer** v10.4.16 - CSS vendor prefixing
  - **Vendor**: Andrey Sitnik
  - **License**: MIT
  - **Purpose**: Automatic CSS vendor prefix addition

---

## Monitoring & Observability

### Health Monitoring
- **Built-in Health Checks** - Custom implementation
  - **Location**: `/api/monitoring/health`
  - **Purpose**: Application and database health monitoring
  - **Features**: System metrics, database connectivity, service status

### Logging
- **Python Logging** - Built-in Python logging
  - **Configuration**: Configurable log levels (DEBUG, INFO, WARNING, ERROR)
  - **Output**: Container logs via Docker

---

## Security & Compliance

### Authentication
- **JWT (JSON Web Tokens)** - Stateless authentication
  - **Algorithm**: HS256 (configurable)
  - **Expiration**: 30 minutes (configurable)
  - **Purpose**: Secure API authentication

### Password Security
- **bcrypt** - Password hashing algorithm
  - **Implementation**: Via passlib library
  - **Purpose**: Secure password storage

### CORS (Cross-Origin Resource Sharing)
- **FastAPI CORS Middleware** - Built-in CORS handling
  - **Configuration**: Environment-based allowed origins
  - **Purpose**: Secure cross-origin API access

---

## Environment Configuration

### Development Environment
- **Local Docker Compose** setup
- **Hot reload** enabled for both frontend and backend
- **Debug mode** enabled
- **SQLite** option for testing (in-memory)

### Staging Environment
- **Docker Compose** with production-like configuration
- **Debug logging** enabled
- **Extended token expiration** (60 minutes)
- **Staging database** isolation

### Production Environment
- **Docker Compose** with optimized settings
- **Resource limits** and health checks
- **SSL/TLS** support via Nginx
- **Secure environment variable** management
- **Automated backups** and monitoring

---

## Change Log

| Date | Version | Changes | Updated By |
|------|---------|---------|------------|
| 2025-01-31 | 1.0 | Initial technology stack documentation | Development Team |

---

## Vendor Contact Information

### Critical Service Providers

**OpenAI**
- **Service**: AI API for workflow execution
- **Support**: https://help.openai.com/
- **Status Page**: https://status.openai.com/
- **Billing**: Pay-per-use token model
- **SLA**: 99.9% uptime commitment

**Docker Inc.**
- **Service**: Container platform
- **Support**: https://docs.docker.com/
- **License**: Docker Desktop requires license for commercial use

### Open Source Dependencies
All other dependencies are open source with active community support. See individual package documentation for support channels and issue tracking.

---

## Risk Assessment & Mitigation

### High-Risk Dependencies
1. **OpenAI API** - Single point of failure for AI functionality
   - **Mitigation**: Implement fallback mechanisms and error handling
   - **Monitoring**: API rate limits and usage tracking

2. **PostgreSQL** - Critical data storage
   - **Mitigation**: Automated backups, health checks, and monitoring
   - **Recovery**: Database restore procedures documented

### Medium-Risk Dependencies
1. **React Flow Renderer** - Core UI component for workflow building
   - **Mitigation**: Version pinning and thorough testing
   - **Alternative**: ReactFlow v11 as backup option

### Maintenance Schedule
- **Security Updates**: Monthly review and updates
- **Dependency Updates**: Quarterly major version reviews
- **Database Backups**: Daily automated backups with 7-day retention

---

## Performance Considerations

### Backend Optimization
- **Async/await** throughout FastAPI application
- **Connection pooling** for database connections
- **Gunicorn** with multiple workers in production

### Frontend Optimization
- **Vite** for fast development and optimized builds
- **Code splitting** and lazy loading where applicable
- **Tailwind CSS** purging for minimal bundle size

### Database Optimization
- **PostgreSQL 15** with performance tuning
- **Connection pooling** via SQLAlchemy
- **Index optimization** for query performance

---

*This document should be reviewed and updated quarterly or when significant technology changes are made to the platform.*