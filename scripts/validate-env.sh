#!/bin/bash
# Environment Variable Validation Script

required_vars=(
    "POSTGRES_DB"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
    "REDIS_URL"
    "RABBITMQ_PASSWORD"
    "VAULT_TOKEN"
    "GRAFANA_PASSWORD"
    "OPENAI_API_KEY"
    "ANTHROPIC_API_KEY"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "ERROR: Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

echo "All required environment variables are set"
