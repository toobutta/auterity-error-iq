#!/bin/bash

# Workflow API Smoke Tests
API_BASE="http://localhost:5055"
API_KEY="dev-api-key-123"

echo "🧪 Running Workflow API Smoke Tests..."

# Health check (no auth required)
echo "1. Health check..."
curl -s "$API_BASE/health" | jq .

# Test export (ReactFlow → Canonical)
echo -e "\n2. Export ReactFlow to Canonical..."
EXPORT_RESPONSE=$(curl -s -X POST "$API_BASE/v1/workflows/export" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "id": "test-rf-workflow",
    "name": "Test ReactFlow",
    "nodes": [
      {
        "id": "node-1",
        "type": "input",
        "position": {"x": 100, "y": 100},
        "data": {"label": "Start"}
      }
    ],
    "edges": [],
    "viewport": {"x": 0, "y": 0, "zoom": 1}
  }')

echo "$EXPORT_RESPONSE" | jq .
WORKFLOW_ID=$(echo "$EXPORT_RESPONSE" | jq -r .id)
ETAG=$(echo "$EXPORT_RESPONSE" | jq -r .etag)

# Test get workflow
echo -e "\n3. Get workflow by ID..."
curl -s "$API_BASE/v1/workflows/$WORKFLOW_ID" \
  -H "x-api-key: $API_KEY" | jq .

# Test patch with ETag
echo -e "\n4. Patch workflow (move node)..."
curl -s -X PATCH "$API_BASE/v1/workflows/$WORKFLOW_ID" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "If-Match: $ETAG" \
  -d '[{"op": "replace", "path": "/nodes/0/position/x", "value": 200}]' | jq .

# Test import canonical
echo -e "\n5. Import canonical workflow..."
curl -s -X POST "$API_BASE/v1/workflows/import" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "version": "1.0.0",
    "id": "test-canonical",
    "nodes": [
      {
        "id": "node-1",
        "type": "start",
        "position": {"x": 50, "y": 50},
        "label": "Canonical Start"
      }
    ],
    "edges": []
  }' | jq .

echo -e "\n✅ Smoke tests completed!"
