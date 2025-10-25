#!/bin/bash

# Health check script for Auterity Unified services
echo "Running health checks for Auterity Unified services..."

# Check database
echo -n "PostgreSQL: "
if docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

# Check Redis
echo -n "Redis: "
if docker-compose exec redis redis-cli ping | grep -q "PONG"; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

# Check Elasticsearch
echo -n "Elasticsearch: "
if curl -s http://localhost:9200/_cluster/health | grep -q "status"; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

# Check Kafka
echo -n "Kafka: "
if docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092 > /dev/null 2>&1; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

# Check Vault
echo -n "Vault: "
if curl -s http://localhost:8200/v1/sys/health | grep -q "initialized"; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

# Check MLflow
echo -n "MLflow: "
if curl -s http://localhost:5000/health | grep -q "status"; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

# Check OpenTelemetry Collector
echo -n "OpenTelemetry: "
if curl -s http://localhost:13133/ > /dev/null 2>&1; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

# Check Backend API
echo -n "Backend API: "
if curl -s http://localhost:8000/api/health | grep -q "status"; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

echo "Health check completed."
