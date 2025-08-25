# Auterity Unified - Secrets Management Module
# Created: July 2025

provider "aws" {
  region = var.aws_region
}

# AWS Secrets Manager Secret for API Keys
resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${var.environment}-${var.project_name}-api-keys"
  description = "API keys and credentials for ${var.project_name} in ${var.environment} environment"

  tags = {
    Name        = "${var.environment}-${var.project_name}-api-keys"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Initial version of the secret
resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id     = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode(var.initial_secret_values)
}

# Secret rotation configuration
resource "aws_secretsmanager_secret_rotation" "api_keys_rotation" {
  count = var.enable_rotation ? 1 : 0

  secret_id           = aws_secretsmanager_secret.api_keys.id
  rotation_lambda_arn = aws_lambda_function.rotate_secrets[0].arn

  rotation_rules {
    automatically_after_days = var.rotation_days
  }
}

# Lambda function for secret rotation
resource "aws_lambda_function" "rotate_secrets" {
  count = var.enable_rotation ? 1 : 0

  function_name = "${var.environment}-${var.project_name}-rotate-secrets"
  description   = "Lambda function to rotate secrets for ${var.project_name}"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_secrets_rotation[0].arn
  timeout       = 60

  filename         = "${path.module}/lambda/rotate-secrets.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/rotate-secrets.zip")

  environment {
    variables = {
      SECRET_ARN = aws_secretsmanager_secret.api_keys.arn
      PROJECT    = var.project_name
    }
  }

  tags = {
    Name        = "${var.environment}-${var.project_name}-rotate-secrets"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# IAM role for Lambda rotation function
resource "aws_iam_role" "lambda_secrets_rotation" {
  count = var.enable_rotation ? 1 : 0

  name = "${var.environment}-${var.project_name}-lambda-rotation-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.environment}-${var.project_name}-lambda-rotation-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# IAM policy for Lambda rotation function
resource "aws_iam_policy" "lambda_secrets_rotation" {
  count = var.enable_rotation ? 1 : 0

  name        = "${var.environment}-${var.project_name}-lambda-rotation-policy"
  description = "Policy for Lambda function to rotate secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.api_keys.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "lambda_secrets_rotation" {
  count = var.enable_rotation ? 1 : 0

  policy_arn = aws_iam_policy.lambda_secrets_rotation[0].arn
  role       = aws_iam_role.lambda_secrets_rotation[0].name
}

# IAM policy for EKS to access Secrets Manager
resource "aws_iam_policy" "eks_secrets_access" {
  name        = "${var.environment}-${var.project_name}-eks-secrets-access"
  description = "Policy to allow EKS to access Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.api_keys.arn
      }
    ]
  })

  tags = {
    Name        = "${var.environment}-${var.project_name}-eks-secrets-access"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}
