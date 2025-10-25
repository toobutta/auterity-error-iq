# Workflow API Smoke Tests (PowerShell)

$API_BASE = "http://localhost:5055"
$API_KEY = "dev-api-key-123"

Write-Host "🧪 Running Workflow API Smoke Tests..." -ForegroundColor Cyan

# Health check (no auth required)
Write-Host "1. Health check..." -ForegroundColor Yellow
$healthResponse = Invoke-RestMethod -Uri "$API_BASE/health" -Method Get
$healthResponse | ConvertTo-Json

# Test export (ReactFlow → Canonical)
Write-Host "`n2. Export ReactFlow to Canonical..." -ForegroundColor Yellow
$exportBody = @{
    id = "test-rf-workflow"
    name = "Test ReactFlow"
    nodes = @(
        @{
            id = "node-1"
            type = "input"
            position = @{ x = 100; y = 100 }
            data = @{ label = "Start" }
        }
    )
    edges = @()
    viewport = @{ x = 0; y = 0; zoom = 1 }
} | ConvertTo-Json -Depth 10

$exportResponse = Invoke-RestMethod -Uri "$API_BASE/v1/workflows/export" -Method Post -Body $exportBody -ContentType "application/json" -Headers @{ "x-api-key" = $API_KEY }
$exportResponse | ConvertTo-Json -Depth 10

$workflowId = $exportResponse.id
$etag = $exportResponse.etag

# Test get workflow
Write-Host "`n3. Get workflow by ID..." -ForegroundColor Yellow
$getResponse = Invoke-RestMethod -Uri "$API_BASE/v1/workflows/$workflowId" -Method Get -Headers @{ "x-api-key" = $API_KEY }
$getResponse | ConvertTo-Json -Depth 10

# Test patch with ETag
Write-Host "`n4. Patch workflow (move node)..." -ForegroundColor Yellow
$patchBody = @(
    @{
        op = "replace"
        path = "/nodes/0/position/x"
        value = 200
    }
) | ConvertTo-Json -Depth 10

$patchResponse = Invoke-RestMethod -Uri "$API_BASE/v1/workflows/$workflowId" -Method Patch -Body $patchBody -ContentType "application/json" -Headers @{ "x-api-key" = $API_KEY; "If-Match" = $etag }
$patchResponse | ConvertTo-Json -Depth 10

# Test import canonical
Write-Host "`n5. Import canonical workflow..." -ForegroundColor Yellow
$importBody = @{
    version = "1.0.0"
    id = "test-canonical"
    nodes = @(
        @{
            id = "node-1"
            type = "start"
            position = @{ x = 50; y = 50 }
            label = "Canonical Start"
        }
    )
    edges = @()
} | ConvertTo-Json -Depth 10

$importResponse = Invoke-RestMethod -Uri "$API_BASE/v1/workflows/import" -Method Post -Body $importBody -ContentType "application/json" -Headers @{ "x-api-key" = $API_KEY }
$importResponse | ConvertTo-Json -Depth 10

Write-Host "`n✅ Smoke tests completed!" -ForegroundColor Green
