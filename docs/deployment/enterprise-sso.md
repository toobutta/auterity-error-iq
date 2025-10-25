

# Enterprise SSO Integratio

n

#

# Overvie

w

Complete enterprise SSO authentication system with AWS Cognito, SAML 2.0, and OIDC support for AutoMatrix AI Hub

.

#

# Feature

s

- **Dual Authentication**: Enterprise SS

O

 + legacy JWT fallbac

k

- **Multi-IdP Support**: Active Directory, Azure AD, Okta, Google Workspac

e

- **Role-Based Access Control**: Admin, Developer, Data Analyst, Compliance Office

r

- **8-hour Sessions**: Automatic token refres

h

- **Audit Logging**: Complete authentication audit trai

l

- **Zero Downtime**: Backward compatible with existing syste

m

#

# Quick Deploymen

t

#

##

 1. Deploy Infrastructu

r

e

```bash
./scripts/deploy-sso.sh productio

n

```

#

##

 2. Configure Environme

n

t

```

bash
cp .env.sso .env

# Update .env with your specific values

```

#

##

 3. Configure Identity Provide

r

s

Access AWS Cognito Console and add your SAML/OIDC providers:

- **SAML**: Upload metadata XML from your Id

P

- **OIDC**: Configure client credentials and endpoint

s

#

##

 4. Update Applicati

o

n

```

bash

# Backend

cd backend && pip install -r requirements.tx

t

# Frontend

cd frontend && npm install

```

#

# Role Mappin

g

- **admin**: Full system access, user management, audit log

s

- **developer**: Read/write workflows, execute workflow

s

- **data_analyst**: Read access, reports, data expor

t

- **compliance_officer**: Read access, audit logs, compliance report

s

- **user**: Basic read acces

s

#

# API Endpoint

s

- `POST /api/auth/validate

`

 - Validate authentication toke

n

- `GET /api/auth/user/profile

`

 - Get user profil

e

- `POST /api/auth/logout

`

 - Logout use

r

#

# Frontend Integratio

n

```

typescript
import { useAuth } from "./contexts/AuthContext";

const { user, hasPermission, logout } = useAuth();

if (hasPermission("manage_users")) {
  // Show admin features
}

```

#

# Security Feature

s

- JWT token validation with 8-hour expir

y

- Automatic token refres

h

- Secure logout with IdP session terminatio

n

- Role-based permission syste

m

- Audit logging for all authentication event

s

#

# Monitorin

g

- CloudTrail integration for audit log

s

- Health check endpoint

s

- Authentication metric

s

- Session monitorin

g

#

# Troubleshootin

g

1. **Token validation fails**: Check Cognito User Pool configurati

o

n

2. **SSO redirect fails**: Verify callback URLs in IdP and Cogni

t

o

3. **Role mapping issues**: Check custom attributes in User Pool sche

m

a

4. **Session timeout**: Verify token validity periods in Cognito client settin

g

s
