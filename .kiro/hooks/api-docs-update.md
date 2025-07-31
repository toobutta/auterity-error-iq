---
name: "API Documentation Update"
description: "Regenerate API documentation when routes or schemas change"
trigger: "file_save"
filePattern: "backend/app/{api/*.py,schemas.py}"
---

# API Documentation Update Hook

Regenerate API documentation when API routes or schemas change to keep docs in sync.

```bash
cd backend
echo "📚 Updating API documentation..."

# Check if server is already running on port 8000
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Using existing server for API docs"
    curl -s http://localhost:8000/openapi.json > ../docs/api-spec.json
else
    # Start temporary server to generate OpenAPI spec
    uvicorn app.main:app --host 0.0.0.0 --port 8001 &
    SERVER_PID=$!
    sleep 3
    
    # Export the OpenAPI spec
    curl -s http://localhost:8001/openapi.json > ../docs/api-spec.json
    
    # Kill the temporary server
    kill $SERVER_PID 2>/dev/null
fi

echo "✅ API documentation updated"
```