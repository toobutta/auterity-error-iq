# Example usage of the secrets module for Auterity Unified

provider "aws" {
  region = "us-west-2"
}

# Variables (in a real scenario, these would be in a separate variables.tf file)
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Module usage
module "secrets" {
  source = "../modules/secrets"

  aws_region     = "us-west-2"
  environment    = "production"
  project_name   = "auterity"

  initial_secret_values = {
    OPENAI_API_KEY    = var.openai_api_key,
    ANTHROPIC_API_KEY = var.anthropic_api_key,
    DATABASE_PASSWORD = var.database_password,
    JWT_SECRET        = random_password.jwt_secret.result
  }

  enable_rotation = true
  rotation_days   = 30
  eks_role_name   = "auterity-eks-node-role"  # This would typically come from your EKS module
}

# Generate a random JWT secret
resource "random_password" "jwt_secret" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Attach the secrets policy to the EKS node role
resource "aws_iam_role_policy_attachment" "eks_secrets" {
  policy_arn = module.secrets.eks_policy_arn
  role       = "auterity-eks-node-role"  # This would typically come from your EKS module
}

# Output the secret ARN and name (but not the values)
output "secret_arn" {
  description = "ARN of the created secret"
  value       = module.secrets.secret_arn
}

output "secret_name" {
  description = "Name of the created secret"
  value       = module.secrets.secret_name
}
