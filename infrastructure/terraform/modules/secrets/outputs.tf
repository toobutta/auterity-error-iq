output "secret_arn" {
  description = "ARN of the created secret"
  value       = aws_secretsmanager_secret.api_keys.arn
}

output "secret_name" {
  description = "Name of the created secret"
  value       = aws_secretsmanager_secret.api_keys.name
}

output "eks_policy_arn" {
  description = "ARN of the IAM policy for EKS to access secrets"
  value       = aws_iam_policy.eks_secrets_access.arn
}

output "rotation_lambda_arn" {
  description = "ARN of the Lambda function for secret rotation"
  value       = var.enable_rotation ? aws_lambda_function.rotate_secrets[0].arn : null
}
