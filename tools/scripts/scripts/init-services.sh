#!/bin/bash

# Initialize Vault
echo "Initializing Vault..."
docker-compose exec vault vault auth -method=userpass username=admin password=admin

# Create MLflow bucket in MinIO
echo "Creating MLflow bucket..."
docker-compose exec minio mc alias set myminio http://localhost:9000 minioadmin minioadmin123
docker-compose exec minio mc mb myminio/mlflow-artifacts

# Create Kafka topics
echo "Creating Kafka topics..."
docker-compose exec kafka kafka-topics --create --topic workflow-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
docker-compose exec kafka kafka-topics --create --topic error-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
docker-compose exec kafka kafka-topics --create --topic audit-events --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

# Initialize Loki datasource in Grafana
echo "Configuring Grafana datasources..."
curl -X POST \
  http://admin:admin123@localhost:3003/api/datasources \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Loki",
    "type": "loki",
    "url": "http://loki:3100",
    "access": "proxy"
  }'

echo "Services initialized successfully!"
