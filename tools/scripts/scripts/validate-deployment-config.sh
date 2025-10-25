#!/bin/bash

# Deployment configuration validation script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Validating deployment configuration...${NC}"

# Check if required files exist
required_files=(
    "docker-compose.prod.yml"
    "backend/Dockerfile.prod"
    "frontend/Dockerfile.prod"
    "nginx/nginx.conf"
    ".env.production"
    ".env.staging"
    "scripts/deploy.sh"
    "scripts/deploy-check.sh"
    "scripts/backup.sh"
    "DEPLOYMENT.md"
)

echo -e "${YELLOW}Checking required files...${NC}"
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file is missing${NC}"
        exit 1
    fi
done

# Check if scripts are executable
executable_scripts=(
    "scripts/deploy.sh"
    "scripts/deploy-check.sh"
    "scripts/backup.sh"
    "backend/start-production.sh"
)

echo -e "${YELLOW}Checking script permissions...${NC}"
for script in "${executable_scripts[@]}"; do
    if [ -x "$script" ]; then
        echo -e "${GREEN}✓ $script is executable${NC}"
    else
        echo -e "${RED}✗ $script is not executable${NC}"
        exit 1
    fi
done

# Validate docker-compose.prod.yml syntax
echo -e "${YELLOW}Validating docker-compose.prod.yml syntax...${NC}"
if command -v docker-compose > /dev/null 2>&1; then
    if docker-compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
        echo -e "${GREEN}✓ docker-compose.prod.yml syntax is valid${NC}"
    else
        echo -e "${RED}✗ docker-compose.prod.yml syntax is invalid${NC}"
        exit 1
    fi
elif command -v docker > /dev/null 2>&1 && docker compose version > /dev/null 2>&1; then
    if docker compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
        echo -e "${GREEN}✓ docker-compose.prod.yml syntax is valid${NC}"
    else
        echo -e "${RED}✗ docker-compose.prod.yml syntax is invalid${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}! Docker not available, skipping compose file validation${NC}"
fi

# Check environment file templates
echo -e "${YELLOW}Checking environment file templates...${NC}"
env_files=(".env.production" ".env.staging")
required_vars=("POSTGRES_PASSWORD" "OPENAI_API_KEY" "SECRET_KEY")

for env_file in "${env_files[@]}"; do
    echo -e "${YELLOW}Checking $env_file...${NC}"
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" "$env_file"; then
            echo -e "${GREEN}✓ $var is defined in $env_file${NC}"
        else
            echo -e "${RED}✗ $var is missing from $env_file${NC}"
            exit 1
        fi
    done
done

# Check backend production configuration
echo -e "${YELLOW}Checking backend production configuration...${NC}"
if grep -q "ENVIRONMENT.*os.getenv" backend/app/main.py; then
    echo -e "${GREEN}✓ Backend has production environment configuration${NC}"
else
    echo -e "${RED}✗ Backend missing production environment configuration${NC}"
    exit 1
fi

# Check if health check endpoints exist
echo -e "${YELLOW}Checking health check endpoints...${NC}"
if grep -q "@router.get.*health" backend/app/api/monitoring.py; then
    echo -e "${GREEN}✓ Health check endpoints exist${NC}"
else
    echo -e "${RED}✗ Health check endpoints missing${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 All deployment configuration checks passed!${NC}"
echo -e "${GREEN}Deployment configuration is ready for production use.${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Copy .env.production to .env and update with your values"
echo -e "2. Run: ./scripts/deploy.sh production"
echo -e "3. Run: ./scripts/deploy-check.sh"
echo -e "4. See DEPLOYMENT.md for detailed instructions"
