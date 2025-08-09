# Secret Rotation Lambda Function

This directory contains the Lambda function code for rotating secrets in AWS Secrets Manager.

## Implementation

The actual implementation would need to be packaged as a ZIP file for deployment:

```bash
# Install dependencies
npm init -y
npm install aws-sdk

# Create ZIP file
zip -r rotate-secrets.zip index.js node_modules
```

## Customization

The rotation logic should be customized based on the type of secrets being rotated:

1. **API Keys**: For third-party API keys, you may need to call their API to generate new keys
2. **Database Credentials**: For database credentials, you'll need to connect to the database and update user passwords
3. **JWT Secrets**: For JWT signing keys, you may need to generate new cryptographic keys

## Testing

Before deploying to production, test the rotation function thoroughly:

```bash
aws secretsmanager test-rotate-secret \
    --secret-id your-secret-id \
    --client-request-token test-token
```

## Security Considerations

- The Lambda function should have minimal permissions (principle of least privilege)
- Ensure error handling doesn't expose sensitive information
- Consider implementing additional logging and monitoring for rotation events
