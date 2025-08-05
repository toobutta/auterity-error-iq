# CLINE-TASK: Unified Authentication System Implementation

## Task Overview
Complete the implementation of the unified authentication system foundation for the three-system AI platform integration (AutoMatrix, RelayCore, NeuroWeaver).

## Current Status
Kiro has started the implementation with enhanced user models, role-based access control, and authentication utilities. The foundation is in place but needs completion and testing.

## Implementation Requirements

### 1. Database Migration
Create Alembic migration for the new authentication schema:
- Role-based access control tables (roles, permissions, user_roles, role_permissions)
- Enhanced user model with relationships
- Default roles and permissions seeding

**Files to create/modify:**
- `backend/alembic/versions/[timestamp]_add_rbac_system.py`

### 2. Complete Authentication Middleware
Implement authentication middleware for cross-system communication:
- Create middleware classes for FastAPI
- Add JWT token validation for cross-system requests
- Implement permission checking middleware

**Files to create:**
- `backend/app/middleware/auth_middleware.py`

### 3. RelayCore Authentication Integration
Create authentication client for RelayCore system:
- JWT token validation service
- Permission checking utilities
- Cross-system authentication helpers

**Files to create:**
- `systems/relaycore/src/middleware/unified-auth.ts`
- `systems/relaycore/src/services/auth-client.ts`

### 4. NeuroWeaver Authentication Integration
Create authentication client for NeuroWeaver system:
- JWT token validation service
- Permission checking utilities
- Cross-system authentication helpers

**Files to create:**
- `systems/neuroweaver/backend/app/middleware/unified_auth.py`
- `systems/neuroweaver/backend/app/services/auth_client.py`

### 5. Testing Implementation
Create comprehensive tests for the authentication system:
- Unit tests for authentication utilities
- Integration tests for cross-system authentication
- Role and permission management tests

**Files to create:**
- `backend/tests/test_unified_auth.py`
- `backend/tests/test_role_management.py`
- `backend/tests/integration/test_cross_system_auth.py`

## Technical Specifications

### Database Schema
The enhanced user model includes:
```python
# Already implemented in backend/app/models/user.py
- User model with roles relationship
- Role model with permissions relationship
- Permission model with system-specific permissions
- Association tables for many-to-many relationships
```

### JWT Token Structure
Cross-system tokens should include:
```json
{
  "sub": "user@example.com",
  "user_id": "uuid",
  "name": "User Name",
  "permissions": ["autmatrix:read", "relaycore:write"],
  "target_system": "relaycore",
  "type": "cross_system",
  "exp": 1234567890
}
```

### Permission Format
Permissions follow the pattern: `{system}:{action}`
- `autmatrix:read`, `autmatrix:write`, `autmatrix:admin`
- `relaycore:read`, `relaycore:write`, `relaycore:admin`
- `neuroweaver:read`, `neuroweaver:write`, `neuroweaver:admin`

### Default Roles
Create these default roles:
- **admin**: Full access to all systems
- **manager**: Read/write access to all systems
- **user**: Read/write to AutoMatrix, read-only to others
- **viewer**: Read-only access to all systems

## API Endpoints Already Implemented
The following endpoints are already implemented in `backend/app/api/auth.py`:
- `POST /auth/cross-system-token` - Get cross-system authentication token
- `GET /auth/roles` - List all roles (admin only)
- `POST /auth/roles` - Create new role (admin only)
- `GET /auth/permissions` - List all permissions (admin only)
- `POST /auth/users/{user_id}/roles` - Assign roles to user (admin only)
- `POST /auth/init-roles` - Initialize default roles and permissions

## Integration Points

### AutoMatrix Integration
- Update existing FastAPI middleware to use unified auth
- Ensure all workflow endpoints check appropriate permissions
- Maintain backward compatibility with existing authentication

### RelayCore Integration
- Create TypeScript authentication middleware
- Implement JWT token validation
- Add permission checking for routing rules

### NeuroWeaver Integration
- Create Python authentication middleware
- Implement JWT token validation
- Add permission checking for model operations

## Success Criteria
1. All three systems can authenticate users with unified JWT tokens
2. Role-based access control works across all systems
3. Cross-system authentication tokens work properly
4. All tests pass with >90% coverage
5. Database migration runs successfully
6. Default roles and permissions are created automatically

## Error Handling
- Implement proper HTTP status codes (401, 403, etc.)
- Provide clear error messages for authentication failures
- Log authentication events for security auditing
- Handle token expiration gracefully

## Security Requirements
- Use secure JWT signing with proper secret key management
- Implement proper password hashing (already using bcrypt)
- Validate all input data for security vulnerabilities
- Implement rate limiting for authentication endpoints
- Log all authentication and authorization events

## Files Already Modified by Kiro
- `backend/app/models/user.py` - Enhanced with RBAC models
- `backend/app/models/__init__.py` - Updated imports
- `backend/app/auth.py` - Enhanced authentication utilities
- `backend/app/schemas.py` - Added RBAC schemas
- `backend/app/api/auth.py` - Enhanced authentication endpoints

## Next Steps for Cline
1. Read the modified files to understand the current implementation
2. Create the database migration for RBAC system
3. Implement authentication middleware for all three systems
4. Create comprehensive tests
5. Test the integration across all three systems
6. Document any issues or improvements needed

## Requirements Reference
This task addresses requirements:
- 4.1: Single sign-on across all three platforms
- 4.2: JWT token refresh automatically across all systems  
- 4.3: User permissions propagate to all systems within 5 minutes
- 4.4: Clear error messages with recovery steps for authentication failures

## Time Estimate
Estimated completion time: 4-6 hours

## Priority
High - This is a foundational component needed for all other integrations