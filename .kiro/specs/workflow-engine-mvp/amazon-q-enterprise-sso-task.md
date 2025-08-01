# AMAZON-Q-TASK: Enterprise SSO Implementation

## Task Overview
**Status:** 🚀 **READY FOR IMMEDIATE DELEGATION**  
**Assigned to:** Amazon Q (Claude 3.7)  
**Priority:** CRITICAL - Enterprise Feature  
**Complexity:** High  
**Estimated Timeline:** 3-4 days  
**Dependencies:** None - can work independently  

## Executive Summary
Implement comprehensive Enterprise Single Sign-On (SSO) capabilities for the Auterity Platform using AWS Cognito, IAM Identity Center, and enterprise identity providers. This task leverages Amazon Q's deep AWS expertise to deliver production-ready enterprise authentication.

## Current State Analysis
The platform currently uses basic JWT authentication with local user management:
- Frontend: React AuthContext with localStorage token management
- Backend: FastAPI JWT authentication with local user database
- API Client: Bearer token authentication with 401 handling

## Target Architecture
Transform the authentication system to support enterprise SSO while maintaining backward compatibility:
- **Primary:** SAML 2.0 and OIDC enterprise integration
- **Fallback:** Existing JWT system for non-enterprise users
- **MFA:** Delegated to enterprise identity providers
- **Session Management:** AWS Cognito User Pools with 8-hour sessions

## Technical Requirements

### 1. AWS Cognito User Pool Configuration
- Configure User Pool with enterprise identity provider integration
- Support both SAML 2.0 and OIDC protocols
- Implement attribute mapping for email, name, groups, roles
- Configure session duration and token refresh policies
- Enable MFA delegation to enterprise IdP

### 2. Enterprise Identity Provider Integration
- Support major enterprise IdPs (Active Directory, Azure AD, Okta, Ping Identity)
- SAML 2.0 metadata exchange and certificate management
- OIDC discovery and client configuration
- Attribute claim mapping and role synchronization
- Group-based access control implementation

### 3. Backend API Integration
- Modify FastAPI authentication to support Cognito JWT tokens
- Implement dual authentication support (Cognito + legacy JWT)
- Create user provisioning and role mapping logic
- Add enterprise user profile management
- Implement group-based authorization middleware

### 4. Frontend Authentication Flow
- Extend AuthContext to support enterprise SSO flows
- Implement Cognito Hosted UI integration
- Add enterprise login detection and routing
- Maintain backward compatibility with existing login forms
- Handle SSO session management and token refresh

### 5. Role-Based Access Control (RBAC)
Implement the following role hierarchy:
- **Admin:** Full platform access and user management
- **Developer:** Workflow creation, execution, and debugging
- **Data Analyst:** Read-only access to execution data and analytics
- **Compliance Officer:** Audit log access and compliance reporting
- **Custom Roles:** Configurable permissions for specific use cases

### 6. Security and Compliance
- Implement comprehensive audit logging with CloudTrail
- Add correlation ID tracking for all authentication events
- Configure session timeout and forced re-authentication
- Implement secure token storage and transmission
- Add brute force protection and anomaly detection

## Implementation Specifications

### Phase 1: AWS Infrastructure Setup (Day 1)
```yaml
# Cognito User Pool Configuration
UserPool:
  Name: "auterity-enterprise-users"
  Policies:
    PasswordPolicy:
      MinimumLength: 12
      RequireUppercase: true
      RequireLowercase: true
      RequireNumbers: true
      RequireSymbols: true
  MfaConfiguration: "OPTIONAL"  # Delegated to IdP
  Schema:
    - Name: "email"
      Required: true
      Mutable: false
    - Name: "groups"
      AttributeDataType: "String"
      Mutable: true
    - Name: "roles"
      AttributeDataType: "String"
      Mutable: true

# Identity Provider Configuration
IdentityProviders:
  SAML:
    ProviderName: "EnterpriseIdP"
    MetadataURL: "https://your-idp.com/metadata.xml"
    AttributeMapping:
      email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      given_name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
      family_name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
      groups: "http://schemas.microsoft.com/ws/2008/06/identity/claims/groups"
  
  OIDC:
    ProviderName: "EnterpriseOIDC"
    ClientId: "${OIDC_CLIENT_ID}"
    ClientSecret: "${OIDC_CLIENT_SECRET}"
    Issuer: "https://your-idp.com"
    AttributeMapping:
      email: "email"
      given_name: "given_name"
      family_name: "family_name"
      groups: "groups"
```

### Phase 2: Backend Integration (Day 2)
```python
# backend/app/auth/cognito.py
from typing import Optional, Dict, Any
import boto3
from jose import jwt, JWTError
from fastapi import HTTPException, status
from app.models.user import User
from app.database import get_db

class CognitoAuthenticator:
    def __init__(self):
        self.cognito_client = boto3.client('cognito-idp')
        self.user_pool_id = os.getenv('COGNITO_USER_POOL_ID')
        self.client_id = os.getenv('COGNITO_CLIENT_ID')
        self.region = os.getenv('AWS_REGION', 'us-east-1')
        
    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify Cognito JWT token and extract user claims"""
        try:
            # Get Cognito public keys
            keys_url = f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}/.well-known/jwks.json"
            # Implement JWT verification logic
            
            # Extract user claims
            claims = jwt.get_unverified_claims(token)
            return claims
            
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
    
    async def provision_user(self, claims: Dict[str, Any]) -> User:
        """Provision or update user from Cognito claims"""
        email = claims.get('email')
        groups = claims.get('custom:groups', '').split(',')
        roles = claims.get('custom:roles', '').split(',')
        
        # Create or update user in local database
        # Map enterprise groups to local roles
        # Return User object
        pass

# backend/app/auth/middleware.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.auth.cognito import CognitoAuthenticator
from app.auth.jwt import JWTAuthenticator  # Existing JWT auth

security = HTTPBearer()
cognito_auth = CognitoAuthenticator()
jwt_auth = JWTAuthenticator()

async def get_current_user(token: str = Depends(security)):
    """Dual authentication support - Cognito or legacy JWT"""
    try:
        # Try Cognito first
        claims = await cognito_auth.verify_token(token.credentials)
        return await cognito_auth.provision_user(claims)
    except HTTPException:
        # Fallback to legacy JWT
        try:
            return await jwt_auth.get_current_user(token.credentials)
        except HTTPException:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
```

### Phase 3: Frontend Integration (Day 3)
```typescript
// frontend/src/auth/CognitoAuth.ts
import { CognitoAuth } from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';

export class EnterpriseSSOAuth {
  private cognitoAuth: CognitoAuth;
  
  constructor() {
    this.cognitoAuth = new CognitoAuth({
      domain: process.env.VITE_COGNITO_DOMAIN,
      clientId: process.env.VITE_COGNITO_CLIENT_ID,
      redirectSignIn: `${window.location.origin}/auth/callback`,
      redirectSignOut: `${window.location.origin}/login`,
      responseType: 'code',
      scope: ['openid', 'email', 'profile'],
    });
    
    // Listen for auth events
    Hub.listen('auth', this.handleAuthEvents);
  }
  
  async signInWithSSO(provider: 'SAML' | 'OIDC'): Promise<void> {
    try {
      await this.cognitoAuth.federatedSignIn({
        provider: provider === 'SAML' ? 'EnterpriseIdP' : 'EnterpriseOIDC'
      });
    } catch (error) {
      console.error('SSO sign-in error:', error);
      throw error;
    }
  }
  
  async getCurrentSession(): Promise<any> {
    try {
      return await this.cognitoAuth.currentSession();
    } catch (error) {
      return null;
    }
  }
  
  private handleAuthEvents = (data: any) => {
    const { payload } = data;
    switch (payload.event) {
      case 'signIn':
        console.log('User signed in:', payload.data);
        break;
      case 'signOut':
        console.log('User signed out');
        break;
      case 'tokenRefresh':
        console.log('Token refreshed');
        break;
    }
  };
}

// frontend/src/contexts/AuthContext.tsx - Enhanced version
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isEnterpriseUser: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithSSO: (provider: 'SAML' | 'OIDC') => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnterpriseUser, setIsEnterpriseUser] = useState(false);
  const ssoAuth = new EnterpriseSSOAuth();

  const loginWithSSO = async (provider: 'SAML' | 'OIDC') => {
    try {
      await ssoAuth.signInWithSSO(provider);
      // Handle redirect to Cognito Hosted UI
    } catch (error) {
      console.error('SSO login error:', error);
      throw error;
    }
  };

  // Enhanced initialization to check for both JWT and Cognito tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for Cognito session first
        const cognitoSession = await ssoAuth.getCurrentSession();
        if (cognitoSession) {
          const token = cognitoSession.getIdToken().getJwtToken();
          // Set user from Cognito claims
          setIsEnterpriseUser(true);
          return;
        }
        
        // Fallback to legacy JWT check
        const token = localStorage.getItem('access_token');
        if (token) {
          const currentUser = await AuthApi.getCurrentUser();
          setUser(currentUser);
          setIsEnterpriseUser(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Rest of the implementation...
};
```

### Phase 4: Testing and Validation (Day 4)
```typescript
// Test scenarios implementation
const testScenarios = {
  async testLoginSuccess() {
    // Test successful SAML/OIDC login flow
    // Verify token exchange and user provisioning
    // Validate role mapping and permissions
  },
  
  async testRoleMapping() {
    // Test enterprise group to local role mapping
    // Verify permission inheritance
    // Test role-based access control
  },
  
  async testMFAChallenge() {
    // Test MFA delegation to enterprise IdP
    // Verify MFA bypass for trusted devices
    // Test MFA failure scenarios
  },
  
  async testExpiredSession() {
    // Test session timeout handling
    // Verify automatic token refresh
    // Test forced re-authentication
  },
  
  async testLoggingValidation() {
    // Verify CloudTrail logging
    // Test correlation ID tracking
    // Validate audit trail completeness
  }
};
```

## Configuration Files

### Environment Variables
```bash
# AWS Configuration
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_DOMAIN=auterity-sso.auth.us-east-1.amazoncognito.com

# Enterprise IdP Configuration
SAML_METADATA_URL=https://your-idp.com/metadata.xml
OIDC_ISSUER=https://your-idp.com
OIDC_CLIENT_ID=your-oidc-client-id
OIDC_CLIENT_SECRET=your-oidc-client-secret

# Security Configuration
SESSION_DURATION_HOURS=8
TOKEN_REFRESH_THRESHOLD_MINUTES=15
AUDIT_LOG_RETENTION_DAYS=90
```

### CloudFormation Template
```yaml
# infrastructure/cognito-sso.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Auterity Enterprise SSO Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    AllowedValues: ['development', 'staging', 'production']

Resources:
  UserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub 'auterity-${Environment}-users'
      # Complete Cognito configuration
      
  UserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      UserPoolId: !Ref UserPool
      # Client configuration
      
  IdentityPool:
    Type: AWS::Cognito::IdentityPool
    Properties:
      IdentityPoolName: !Sub 'auterity-${Environment}-identity'
      # Identity pool configuration

Outputs:
  UserPoolId:
    Value: !Ref UserPool
    Export:
      Name: !Sub '${AWS::StackName}-UserPoolId'
```

## Success Criteria
1. **Authentication Flow:** 100% success rate for SAML/OIDC login flows
2. **Role Mapping:** Accurate mapping of enterprise groups to platform roles
3. **Session Management:** Proper token refresh and session timeout handling
4. **Audit Logging:** Complete audit trail with correlation ID tracking
5. **Backward Compatibility:** Existing JWT authentication continues to work
6. **Security:** No security vulnerabilities in authentication flows
7. **Performance:** SSO login completes within 3 seconds
8. **Error Handling:** Graceful handling of all failure scenarios

## Deliverables
1. **AWS Infrastructure:** Complete Cognito and IAM configuration
2. **Backend Integration:** FastAPI authentication middleware and user provisioning
3. **Frontend Components:** Enhanced AuthContext and SSO login flows
4. **Configuration Templates:** CloudFormation/CDK templates for deployment
5. **Testing Suite:** Comprehensive test coverage for all scenarios
6. **Documentation:** Complete setup and configuration guide
7. **Security Review:** Security assessment and vulnerability analysis

## Risk Mitigation
- **Rollback Plan:** Ability to disable SSO and revert to JWT authentication
- **Gradual Rollout:** Feature flags for controlled enterprise user migration
- **Monitoring:** Real-time monitoring of authentication success rates
- **Support:** Comprehensive error messages and troubleshooting guides

## Integration Points
- **Current JWT System:** Maintain backward compatibility
- **User Database:** Sync enterprise users with local user records
- **API Authorization:** Extend existing role-based access control
- **Frontend Components:** Enhance existing login/logout flows
- **Monitoring:** Integrate with existing logging and monitoring infrastructure

This task is ready for immediate Amazon Q delegation and can be developed independently of current Cline work on security fixes.