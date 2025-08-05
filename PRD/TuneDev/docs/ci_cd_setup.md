# NeuroWeaver CI/CD Pipeline Setup Guide

This document provides instructions for setting up the CI/CD pipeline for the NeuroWeaver platform.

## Overview

The NeuroWeaver CI/CD pipeline is designed to support the template-first development approach and parallel development tracks. It automates the building, testing, integration, deployment, and monitoring of the platform components.

## Prerequisites

Before setting up the CI/CD pipeline, ensure you have:

1. **GitHub Repository**: A GitHub repository for the NeuroWeaver platform code
2. **AWS Account**: An AWS account with appropriate permissions
3. **Kubernetes Cluster**: An EKS cluster for deployment
4. **Docker Registry**: Access to Amazon ECR for storing Docker images
5. **Secrets Management**: GitHub Secrets configured for sensitive information

## GitHub Secrets Configuration

Configure the following secrets in your GitHub repository:

1. **AWS_ACCESS_KEY_ID**: AWS access key ID with permissions for ECR, S3, and EKS
2. **AWS_SECRET_ACCESS_KEY**: AWS secret access key
3. **AWS_REGION**: AWS region (e.g., us-west-2)
4. **AWS_ECR_REGISTRY**: ECR registry URL (e.g., 123456789012.dkr.ecr.us-west-2.amazonaws.com)
5. **SLACK_BOT_TOKEN**: Slack bot token for notifications
6. **SLACK_CHANNEL_ID**: Slack channel ID for notifications
7. **DOMAIN**: Domain name for the application (e.g., neuroweaver.io)

## CI/CD Pipeline Components

The CI/CD pipeline consists of the following components:

1. **GitHub Actions Workflows**: Located in `.github/workflows/`
   - `main.yml`: Main workflow for building, testing, and deploying
   - `template_system.yml`: Workflow for the template system
   - `auto_specializer.yml`: Workflow for the auto-specializer
   - `security_scan.yml`: Workflow for security scanning
   - `rollback.yml`: Workflow for rollback operations

2. **Docker Configuration**: Located in `docker/`
   - Dockerfiles for each component
   - docker-compose.yml for local development
   - docker-compose.integration.yml for integration testing

3. **Terraform Configuration**: Located in `terraform/`
   - Infrastructure as Code for AWS resources
   - Environment-specific configurations

4. **Helm Charts**: Located in `helm/`
   - Kubernetes deployment configuration
   - Environment-specific values files

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/neuroweaver.git
cd neuroweaver
```

### 2. Configure AWS CLI

```bash
aws configure
```

### 3. Create ECR Repositories

```bash
for repo in template-system auto-specializer inference-weaver dataset-refinement costguard-dashboard workflow-ui; do
  aws ecr create-repository --repository-name neuroweaver/$repo
done
```

### 4. Set Up Terraform Backend

Create an S3 bucket for Terraform state:

```bash
aws s3 mb s3://neuroweaver-terraform-state
```

Create a DynamoDB table for state locking:

```bash
aws dynamodb create-table \
  --table-name neuroweaver-terraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### 5. Initialize Terraform

```bash
cd terraform/development
terraform init
```

### 6. Apply Terraform Configuration

```bash
terraform apply
```

### 7. Configure kubectl

```bash
aws eks update-kubeconfig --name neuroweaver-dev --region us-west-2
```

### 8. Deploy with Helm

```bash
cd ../../
helm upgrade --install neuroweaver ./helm/neuroweaver \
  --namespace neuroweaver-development \
  --create-namespace \
  --set environment=development \
  --values ./helm/values-development.yaml
```

### 9. Verify Deployment

```bash
kubectl get pods -n neuroweaver-development
```

## CI/CD Pipeline Workflow

The CI/CD pipeline follows these stages:

1. **Build & Test**: Components are built and tested in parallel
2. **Integration**: Integration tests are run across components
3. **Deployment**: Components are deployed to the target environment
4. **Monitoring**: Deployment is monitored for issues

## Development Workflow

1. Create a feature branch from `develop`
2. Make changes and commit
3. Push changes to GitHub
4. Create a pull request to `develop`
5. CI/CD pipeline runs build and test stages
6. After approval, merge to `develop`
7. CI/CD pipeline deploys to development environment
8. For production releases, create a pull request from `develop` to `main`
9. After approval, merge to `main`
10. CI/CD pipeline deploys to production environment

## Monitoring and Alerts

The CI/CD pipeline includes monitoring and alerting:

1. **CloudWatch Dashboards**: For monitoring AWS resources
2. **Prometheus & Grafana**: For monitoring Kubernetes resources
3. **Slack Notifications**: For deployment and alert notifications

## Rollback Procedure

In case of deployment issues:

1. Go to GitHub Actions
2. Select the "Rollback" workflow
3. Run the workflow with the environment and version to rollback to
4. Monitor the rollback process

## Conclusion

This CI/CD pipeline setup provides a comprehensive framework for implementing the NeuroWeaver platform with a template-first approach. By leveraging parallel development tracks, automated testing, and streamlined deployment processes, the pipeline enables efficient development and reliable delivery of the platform components.