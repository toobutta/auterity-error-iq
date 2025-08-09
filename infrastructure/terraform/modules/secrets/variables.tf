variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., development, staging, production)"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "auterity"
}

variable "initial_secret_values" {
  description = "Initial values for the secret (will be JSON encoded)"
  type        = map(string)
  sensitive   = true
  default     = {}
}

variable "enable_rotation" {
  description = "Whether to enable automatic secret rotation"
  type        = bool
  default     = false
}

variable "rotation_days" {
  description = "Number of days between automatic rotations"
  type        = number
  default     = 30
  validation {
    condition     = var.rotation_days >= 1 && var.rotation_days <= 365
    error_message = "Rotation days must be between 1 and 365."
  }
}

variable "eks_role_name" {
  description = "Name of the EKS role that needs access to the secrets"
  type        = string
  default     = ""
}
