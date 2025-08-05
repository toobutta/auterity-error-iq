variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "development"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "dev.neuroweaver.io"
}