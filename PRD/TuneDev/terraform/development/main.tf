provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "../modules/vpc"
  
  environment = "development"
  vpc_cidr    = "10.0.0.0/16"
}

module "eks" {
  source = "../modules/eks"
  
  environment     = "development"
  cluster_name    = "neuroweaver-dev"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  instance_types  = ["t3.medium"]
  min_size        = 1
  max_size        = 3
  desired_size    = 1
}

module "ecr" {
  source = "../modules/ecr"
  
  environment = "development"
  repositories = [
    "template-system",
    "auto-specializer",
    "inference-weaver",
    "dataset-refinement",
    "costguard-dashboard",
    "workflow-ui"
  ]
}

module "s3" {
  source = "../modules/s3"
  
  environment = "development"
  bucket_name = "neuroweaver-dev-data"
}

module "monitoring" {
  source = "../modules/monitoring"
  
  environment = "development"
  cluster_name = module.eks.cluster_name
}