#!/bin/bash

# Deployment health check script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL=${BACKEND_URL:-http://localhost:8000}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:3000}

echo -e "${GREEN}Running deployment health checks...${NC}"

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Checking $service_name at $url...${NC}"

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $service_name is healthy${NC}"
            return 0
        fi

        echo "Attempt $attempt/$max_attempts failed, retrying in 5 seconds..."
        sleep 5
        attempt=$((attempt + 1))
    done

    echo -e "${RED}✗ $service_name health check failed after $max_attempts attempts${NC}"
    return 1
}

# Function to check API endpoints
check_api_endpoints() {
    echo -e "${YELLOW}Checking API endpoints...${NC}"

    local endpoints=(
        "/api/monitoring/health"
        "/api/monitoring/metrics/system"
        "/docs"
    )

    for endpoint in "${endpoints[@]}"; do
        local url="${BACKEND_URL}${endpoint}"
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $endpoint is accessible${NC}"
        else
            echo -e "${RED}✗ $endpoint is not accessible${NC}"
            return 1
        fi
    done
}

# Function to check database connectivity
check_database() {
    echo -e "${YELLOW}Checking database connectivity...${NC}"

    local health_response
    health_response=$(curl -s "${BACKEND_URL}/api/monitoring/health")

    if echo "$health_response" | grep -q '"database":.*"healthy"'; then
        echo -e "${GREEN}✓ Database is healthy${NC}"
    else
        echo -e "${RED}✗ Database health check failed${NC}"
        echo "Response: $health_response"
        return 1
    fi
}

# Function to check container status
check_containers() {
    echo -e "${YELLOW}Checking container status...${NC}"

    if command -v docker-compose > /dev/null 2>&1; then
        local compose_file="docker-compose.prod.yml"
        if [ -f "$compose_file" ]; then
            local unhealthy_containers
            unhealthy_containers=$(docker-compose -f "$compose_file" ps --filter "health=unhealthy" -q)

            if [ -n "$unhealthy_containers" ]; then
                echo -e "${RED}✗ Found unhealthy containers:${NC}"
                docker-compose -f "$compose_file" ps --filter "health=unhealthy"
                return 1
            else
                echo -e "${GREEN}✓ All containers are healthy${NC}"
            fi
        else
            echo -e "${YELLOW}! docker-compose.prod.yml not found, skipping container check${NC}"
        fi
    else
        echo -e "${YELLOW}! docker-compose not available, skipping container check${NC}"
    fi
}

# Function to check system resources
check_resources() {
    echo -e "${YELLOW}Checking system resources...${NC}"

    # Check disk space
    local disk_usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$disk_usage" -gt 90 ]; then
        echo -e "${RED}✗ Disk usage is high: ${disk_usage}%${NC}"
        return 1
    else
        echo -e "${GREEN}✓ Disk usage is acceptable: ${disk_usage}%${NC}"
    fi

    # Check memory usage
    if command -v free > /dev/null 2>&1; then
        local memory_usage
        memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')

        if [ "$memory_usage" -gt 90 ]; then
            echo -e "${RED}✗ Memory usage is high: ${memory_usage}%${NC}"
            return 1
        else
            echo -e "${GREEN}✓ Memory usage is acceptable: ${memory_usage}%${NC}"
        fi
    fi
}

# Main health check execution
main() {
    local exit_code=0

    # Check services
    check_service "Backend" "${BACKEND_URL}/api/monitoring/health" || exit_code=1
    check_service "Frontend" "${FRONTEND_URL}/health" || exit_code=1

    # Check API endpoints
    check_api_endpoints || exit_code=1

    # Check database
    check_database || exit_code=1

    # Check containers
    check_containers || exit_code=1

    # Check system resources
    check_resources || exit_code=1

    # Summary
    if [ $exit_code -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All health checks passed! Deployment is healthy.${NC}"
    else
        echo -e "\n${RED}❌ Some health checks failed. Please review the issues above.${NC}"
    fi

    return $exit_code
}

# Run main function
main "$@"
