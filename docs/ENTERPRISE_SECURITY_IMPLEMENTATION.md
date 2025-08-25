# Enterprise Security Implementation

## Overview

This document outlines the implementation of enterprise-grade security features for the Auterity platform, including SSO integration (SAML, OIDC), comprehensive audit logging, and multi-tenant architecture.

## Features Implemented

### 1. Multi-Tenant Architecture

#### Core Components

- **Tenant Model**: Complete tenant isolation with domain-based routing
- **Tenant Service**: Management of tenant lifecycle and configuration
- **Tenant Middleware**: Automatic tenant isolation and context injection

#### Key Features

- Domain-based tenant identification
- Subdomain routing support
- Tenant status management (active, suspended, inactive)
- Metadata storage for custom tenant configurations
- Tenant-scoped user management

#### API Endpoints

```
POST   /api/tenants/                    # Create tenant
GET    /api/tenants/                    # List tenants
GET    /api/tenants/{id}                # Get tenant details
PUT    /api/tenants/{id}                # Update tenant
DELETE /api/tenants/{id}                # Delete tenant (soft delete)
GET    /api/tenants/{id}/stats          # Tenant statistics
GET    /api/tenants/{id}/users          # Tenant users
```

### 2. SSO Integration

#### Supported Protocols

- **SAML 2.0**: Full SAML authentication flow with metadata support
- **OIDC/OAuth2**: OpenID Connect with authorization code flow

#### Core Components

- **SSO Service**: Handles authentication flows for both SAML and OIDC
- **SSO Configuration**: Per-tenant SSO provider configuration
- **Auto-provisioning**: Automatic user creation from SSO assertions

#### SAML Features

- AuthnRequest generation
- Assertion parsing and validation
- Metadata endpoint generation
- X.509 certificate validation
- Attribute mapping

#### OIDC Features

- Authorization code flow
- ID token validation
- Userinfo endpoint integration
- Well-known configuration endpoint

#### API Endpoints

```
GET    /api/sso/saml/login/{tenant_slug}     # Initiate SAML login
POST   /api/sso/saml/acs                     # SAML assertion consumer
GET    /api/sso/oidc/login/{tenant_slug}     # Initiate OIDC login
GET    /api/sso/oidc/callback                # OIDC callback
GET    /api/sso/metadata/{tenant_slug}/saml  # SAML metadata
GET    /.well-known/openid_configuration/{tenant_slug} # OIDC config
```

#### SSO Configuration Management

```
POST   /api/tenants/{id}/sso              # Configure SSO
GET    /api/tenants/{id}/sso              # Get SSO configurations
DELETE /api/tenants/{id}/sso/{provider}   # Disable SSO
```

### 3. Comprehensive Audit Logging

#### Core Components

- **Audit Service**: Centralized audit logging with multiple event types
- **Audit Middleware**: Automatic request/response logging
- **Audit Log Model**: Structured audit trail storage

#### Event Types Tracked

- **Authentication**: Login, logout, SSO events
- **User Management**: User creation, updates, role assignments
- **Workflow Events**: Workflow creation, execution, modifications
- **Template Events**: Template management operations
- **System Events**: Configuration changes, system operations
- **Security Events**: Failed authentications, permission violations
- **Data Access**: Resource access and modifications

#### Audit Log Structure

```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "event_type": "authentication",
  "resource_type": "user_session",
  "resource_id": "resource_uuid",
  "action": "login_success",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "session_id": "session_uuid",
  "old_values": {},
  "new_values": {},
  "metadata": {},
  "status": "success",
  "error_message": null,
  "timestamp": "2025-01-08T12:00:00Z"
}
```

#### API Endpoints

```
GET /api/tenants/{id}/audit-logs     # Get audit logs
GET /api/tenants/{id}/audit-summary  # Audit summary statistics
```

## Security Architecture

### Data Isolation

- **Tenant-level isolation**: All data scoped to tenant context
- **Row-level security**: Database queries automatically filtered by tenant
- **API-level enforcement**: Middleware ensures tenant context in all requests

### Authentication Flow

1. **Traditional Login**: Email/password with JWT tokens
2. **SAML Flow**:
   - Redirect to IdP
   - SAML assertion validation
   - User provisioning/authentication
   - JWT token generation
3. **OIDC Flow**:
   - Authorization code request
   - Token exchange
   - ID token validation
   - User provisioning/authentication
   - JWT token generation

### Authorization Model

- **Role-based access control (RBAC)**
- **System-level permissions** (autmatrix, relaycore, neuroweaver)
- **Cross-system token generation**
- **Tenant-scoped permissions**

## Database Schema

### New Tables

1. **tenants**: Tenant configuration and metadata
2. **sso_configurations**: SSO provider configurations per tenant
3. **audit_logs**: Comprehensive audit trail

### Modified Tables

1. **users**: Added tenant_id, SSO fields, last_login

### Relationships

- Users belong to tenants (many-to-one)
- SSO configurations belong to tenants (many-to-one)
- Audit logs belong to tenants (many-to-one)

## Configuration

### Environment Variables

```bash
# SSO Configuration
SAML_ENTITY_ID=auterity-platform
SAML_ACS_URL=https://api.auterity.com/api/sso/saml/acs
OIDC_REDIRECT_URI=https://api.auterity.com/api/sso/oidc/callback

# Audit Configuration
AUDIT_RETENTION_DAYS=365
AUDIT_LOG_LEVEL=INFO

# Tenant Configuration
DEFAULT_TENANT_DOMAIN=localhost
TENANT_ISOLATION_ENABLED=true
```

### SSO Provider Configuration Examples

#### SAML Configuration

```json
{
  "provider": "saml",
  "config": {
    "entity_id": "https://idp.company.com",
    "sso_url": "https://idp.company.com/sso",
    "x509_cert": "-----BEGIN CERTIFICATE-----...",
    "auto_provision_users": true,
    "default_role": "user",
    "attribute_mapping": {
      "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      "name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
    }
  }
}
```

#### OIDC Configuration

```json
{
  "provider": "oidc",
  "config": {
    "issuer": "https://auth.company.com",
    "client_id": "auterity-client",
    "client_secret": "client-secret",
    "redirect_uri": "https://api.auterity.com/api/sso/oidc/callback",
    "auto_provision_users": true,
    "default_role": "user"
  }
}
```

## Security Considerations

### Data Protection

- **Sensitive data redaction** in audit logs
- **Encrypted storage** of SSO credentials
- **Secure token handling** with proper expiration
- **HTTPS enforcement** for all SSO flows

### Compliance Features

- **Audit trail completeness** for compliance reporting
- **Data retention policies** configurable per tenant
- **Access logging** for all sensitive operations
- **Failed authentication tracking**

### Threat Mitigation

- **CSRF protection** for SSO flows
- **State parameter validation** in OIDC
- **SAML assertion validation** with signature verification
- **Rate limiting** on authentication endpoints
- **Session management** with proper timeout

## Deployment

### Database Migration

```bash
# Run the enterprise security migration
alembic upgrade 001_enterprise_security
```

### Dependencies Installation

```bash
pip install -r requirements.txt
```

### Initial Setup

1. Create default tenant
2. Configure SSO providers
3. Set up audit log retention
4. Configure tenant isolation middleware

## Monitoring and Alerting

### Key Metrics

- **Authentication success/failure rates**
- **SSO provider availability**
- **Audit log volume and patterns**
- **Tenant isolation violations**
- **Failed authorization attempts**

### Recommended Alerts

- Multiple failed authentication attempts
- SSO provider failures
- Audit log processing errors
- Tenant isolation violations
- Unusual access patterns

## API Usage Examples

### Creating a Tenant

```bash
curl -X POST "https://api.auterity.com/api/tenants/" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "slug": "acme",
    "domain": "acme.com",
    "sso_enabled": true,
    "audit_enabled": true
  }'
```

### Configuring SAML SSO

```bash
curl -X POST "https://api.auterity.com/api/tenants/$TENANT_ID/sso" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "saml",
    "config": {
      "entity_id": "https://idp.acme.com",
      "sso_url": "https://idp.acme.com/sso",
      "x509_cert": "-----BEGIN CERTIFICATE-----...",
      "auto_provision_users": true,
      "default_role": "user"
    }
  }'
```

### Initiating SSO Login

```bash
curl -X GET "https://api.auterity.com/api/sso/saml/login/acme?relay_state=dashboard"
```

### Retrieving Audit Logs

```bash
curl -X GET "https://api.auterity.com/api/tenants/$TENANT_ID/audit-logs?event_type=authentication&limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Testing

### Unit Tests

- SSO service authentication flows
- Tenant isolation middleware
- Audit logging service
- Schema validation

### Integration Tests

- End-to-end SSO flows
- Multi-tenant data isolation
- Audit log generation
- API endpoint security

### Security Tests

- Authentication bypass attempts
- Tenant isolation violations
- SSO assertion tampering
- Audit log integrity

## Maintenance

### Regular Tasks

- **Audit log cleanup** based on retention policies
- **SSO certificate renewal** monitoring
- **Tenant status reviews**
- **Security configuration audits**

### Backup Considerations

- **Tenant configuration backup**
- **SSO provider credentials**
- **Audit log archival**
- **User role assignments**

## Troubleshooting

### Common Issues

1. **SSO Authentication Failures**
   - Check certificate validity
   - Verify entity ID configuration
   - Validate assertion format

2. **Tenant Isolation Issues**
   - Verify middleware configuration
   - Check tenant context injection
   - Review database query filters

3. **Audit Log Problems**
   - Check middleware order
   - Verify database connectivity
   - Review log retention settings

### Debug Endpoints

- `/api/sso/metadata/{tenant_slug}/saml` - SAML metadata validation
- `/.well-known/openid_configuration/{tenant_slug}` - OIDC configuration
- `/api/tenants/{id}/stats` - Tenant health check

## Compliance and Standards

### Standards Compliance

- **SAML 2.0** specification compliance
- **OpenID Connect 1.0** specification compliance
- **OAuth 2.0** authorization framework
- **GDPR** data protection requirements
- **SOC 2** audit trail requirements

### Security Frameworks

- **OWASP** security best practices
- **NIST** cybersecurity framework
- **ISO 27001** information security management

---

**Implementation Status**: ✅ Complete
**Security Review**: ✅ Passed
**Documentation**: ✅ Complete
**Testing**: ✅ Comprehensive

This enterprise security implementation provides a robust foundation for multi-tenant SaaS operations with comprehensive audit trails and flexible SSO integration capabilities.
