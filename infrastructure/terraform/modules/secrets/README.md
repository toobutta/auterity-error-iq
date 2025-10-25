

# AWS Secrets Manager Module for Auterity Unifie

d

This Terraform module manages AWS Secrets Manager resources for the Auterity Unified platform, providing secure storage and management of sensitive information such as API keys, database credentials, and other secrets.

#

# Feature

s

- Creates and manages AWS Secrets Manager secret

s

- Supports automatic secret rotation via Lambda function

s

- Configures IAM policies for EKS to access secret

s

- Follows security best practices for secret managemen

t

#

# Usag

e

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

#

# Requirement

s

| Name      | Version  |
| -------

- - | ------

- - |

| terraform | >= 1.0.0 |

| aws       | >= 4.0.0

|

#

# Input

s

| Name                  | Description                                               | Type          | Default       | Required |
| -------------------

- - | -------------------------------------------------------

- - | -----------

- - | -----------

- - | :------: |

| aws_region            | The AWS region to deploy resources                        | `string`      | `"us-west-2"` |    no    |

| environment           | Environment name (e.g., development, staging, production) | `string`      | n/a           |   yes    |
| project_name          | Project name for resource naming and tagging              | `string`      | `"auterity"`  |    no    |
| initial_secret_values | Initial values for the secret (will be JSON encoded)      | `map(string)` | `{}`          |    no    |
| enable_rotation       | Whether to enable automatic secret rotation               | `bool`        | `false`       |    no    |
| rotation_days         | Number of days between automatic rotations                | `number`      | `30`          |    no    |
| eks_role_name         | Name of the EKS role that needs access to the secrets     | `string`      | `""`          |    no    |

#

# Output

s

| Name                | Description                                     |
| -----------------

- - | ---------------------------------------------

- - |

| secret_arn          | ARN of the created secret                       |
| secret_name         | Name of the created secret                      |
| eks_policy_arn      | ARN of the IAM policy for EKS to access secrets |
| rotation_lambda_arn | ARN of the Lambda function for secret rotation  |

#

# Implementation Note

s

1. **Secret Rotation**: When `enable_rotation` is set to `true`, the module creates a Lambda function to handle automatic rotation of secrets. You'll need to provide the Lambda function code in a ZIP file at `lambda/rotate-secrets.zip

`

.

2. **EKS Integration**: The module creates an IAM policy that can be attached to EKS node roles to allow pods to access secrets. Use the `eks_policy_arn` output to attach this policy to your EKS node rol

e

.

3. **Security Best Practices*

* :

   - Secrets are encrypted at rest using AWS KM

S

   - Access is restricted using IAM policie

s

   - Automatic rotation helps maintain securit

y

   - All resources are properly tagged for managemen

t

#

# Example: Integrating with External Secrets Operator in Kubernete

s

After deploying this module, you can use the External Secrets Operator in Kubernetes to access these secrets:

```

yaml
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
