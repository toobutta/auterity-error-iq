# Security Guide

## Authentication & Authorization

### JWT Tokens
- Expiration: 24 hours
- Refresh tokens: 7 days
- Algorithm: HS256
- Claims: user_id, email, roles

### API Security
```python
# Protected endpoint example
@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"user": current_user.email}
```

## Secrets Management

### Vault Integration
```python
# Store secret
await vault_service.store_secret("api/openai", {"key": "sk-..."})

# Retrieve secret
secret = await vault_service.get_secret("api/openai")
```

### Environment Variables
- Never commit secrets to git
- Use `.env` files for local development
- Use Vault for production secrets

## Data Protection

### Database Security
- Encrypted connections (SSL)
- Row-level security policies
- Regular backups with encryption
- Access logging

### API Security
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention

## Network Security

### Container Security
- Non-root users
- Minimal base images
- Security scanning
- Network isolation

### TLS/SSL
```nginx
# Nginx configuration
ssl_certificate /path/to/cert.pem;
ssl_certificate_key /path/to/key.pem;
ssl_protocols TLSv1.2 TLSv1.3;
```

## Monitoring & Auditing

### Security Events
- Failed login attempts
- Unauthorized access
- Data modifications
- System changes

### Compliance
- GDPR data handling
- Audit trail maintenance
- Access control reviews
- Security assessments