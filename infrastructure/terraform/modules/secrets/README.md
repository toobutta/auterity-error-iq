# AWS Secrets Manager Module for Auterity Unified

This Terraform module manages AWS Secrets Manager resources for the Auterity Unified platform, providing secure storage and management of sensitive information such as API keys, database credentials, and other secrets.

## Features

- Creates and manages AWS Secrets Manager secrets
- Supports automatic secret rotation via Lambda functions
- Configures IAM policies for EKS to access secrets
- Follows security best practices for secret management

## Usage

```hcl
module "secrets" {
  source = "../modules/secrets"

  aws_region     = "us-west-2"
  environment    = "production"
  project_name   = "auterity"

  initial_secret_values = {
    OPENAI_API_KEY    = var.openai_api_key,
    ANTHROPIC_API_KEY = var.anthropic_api_key,
    DATABASE_PASSWORD = var.database_password
  }

  enable_rotation = true
  rotation_days   = 30
  eks_role_name   = module.eks.node_role_name
}
```

## Requirements

| Name      | Version  |
| --------- | -------- |
| terraform | >= 1.0.0 |
| aws       | >= 4.0.0 |

## Inputs

| Name                  | Description                                               | Type          | Default       | Required |
| --------------------- | --------------------------------------------------------- | ------------- | ------------- | :------: |
| aws_region            | The AWS region to deploy resources                        | `string`      | `"us-west-2"` |    no    |
| environment           | Environment name (e.g., development, staging, production) | `string`      | n/a           |   yes    |
| project_name          | Project name for resource naming and tagging              | `string`      | `"auterity"`  |    no    |
| initial_secret_values | Initial values for the secret (will be JSON encoded)      | `map(string)` | `{}`          |    no    |
| enable_rotation       | Whether to enable automatic secret rotation               | `bool`        | `false`       |    no    |
| rotation_days         | Number of days between automatic rotations                | `number`      | `30`          |    no    |
| eks_role_name         | Name of the EKS role that needs access to the secrets     | `string`      | `""`          |    no    |

## Outputs

| Name                | Description                                     |
| ------------------- | ----------------------------------------------- |
| secret_arn          | ARN of the created secret                       |
| secret_name         | Name of the created secret                      |
| eks_policy_arn      | ARN of the IAM policy for EKS to access secrets |
| rotation_lambda_arn | ARN of the Lambda function for secret rotation  |

## Implementation Notes

1. **Secret Rotation**: When `enable_rotation` is set to `true`, the module creates a Lambda function to handle automatic rotation of secrets. You'll need to provide the Lambda function code in a ZIP file at `lambda/rotate-secrets.zip`.

2. **EKS Integration**: The module creates an IAM policy that can be attached to EKS node roles to allow pods to access secrets. Use the `eks_policy_arn` output to attach this policy to your EKS node role.

3. **Security Best Practices**:
   - Secrets are encrypted at rest using AWS KMS
   - Access is restricted using IAM policies
   - Automatic rotation helps maintain security
   - All resources are properly tagged for management

## Example: Integrating with External Secrets Operator in Kubernetes

After deploying this module, you can use the External Secrets Operator in Kubernetes to access these secrets:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-keys
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: ClusterSecretStore
  target:
    name: api-keys
    creationPolicy: Owner
  data:
    - secretKey: OPENAI_API_KEY
      remoteRef:
        key: production-auterity-api-keys
        property: OPENAI_API_KEY
    - secretKey: ANTHROPIC_API_KEY
      remoteRef:
        key: production-auterity-api-keys
        property: ANTHROPIC_API_KEY
    - secretKey: DATABASE_PASSWORD
      remoteRef:
        key: production-auterity-api-keys
        property: DATABASE_PASSWORD
```
