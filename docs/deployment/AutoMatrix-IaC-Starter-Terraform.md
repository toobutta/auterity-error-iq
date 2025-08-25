# AutoMatrix AI Hub – Terraform Starter

## Provider Setup

```hcl
provider "aws" {
  region = "us-west-2"
}

terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

## VPC

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  name    = "automatrix-vpc"
  cidr    = "10.0.0.0/16"

  azs             = ["us-west-2a", "us-west-2b"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.3.0/24", "10.0.4.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}
```

## RDS PostgreSQL

```hcl
resource "aws_db_instance" "automatrix_postgres" {
  engine         = "postgres"
  instance_class = "db.t3.medium"
  name           = "automatrixdb"
  username       = "admin"
  password       = "secure_password"
  allocated_storage = 20

  vpc_security_group_ids = [module.vpc.default_security_group_id]
  db_subnet_group_name   = module.vpc.database_subnet_group

  skip_final_snapshot = true
}
```

## Output

```hcl
output "db_endpoint" {
  value = aws_db_instance.automatrix_postgres.endpoint
}
```
