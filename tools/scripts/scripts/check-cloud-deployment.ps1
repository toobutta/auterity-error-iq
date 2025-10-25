# Cloud Deployment Health Check Script for Auterity Error IQ
# This script checks the status of your Vercel (frontend) and Render (backend) deployments

param(
    [string]$VercelUrl = "https://auterity-error-iq.vercel.app",
    [string]$BackendUrl = "https://auterity-backend.onrender.com"
)

Write-Host "🔍 Checking Auterity Error IQ Cloud Deployments..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Yellow

# Function to check service health
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$Timeout = 10
    )

    Write-Host "Checking $ServiceName at $Url..." -ForegroundColor Yellow

    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $Timeout -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $ServiceName is healthy (Status: $($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  $ServiceName returned status: $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "❌ $ServiceName is not accessible: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to check API endpoints
function Test-ApiEndpoints {
    param([string]$BaseUrl)

    Write-Host "Testing API endpoints..." -ForegroundColor Yellow

    $endpoints = @(
        "/api/health",
        "/api/docs",
        "/health"
    )

    $allHealthy = $true

    foreach ($endpoint in $endpoints) {
        $url = $BaseUrl + $endpoint
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $endpoint - OK" -ForegroundColor Green
            } else {
                Write-Host "⚠️  $endpoint - Status: $($response.StatusCode)" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "❌ $endpoint - Failed: $($_.Exception.Message)" -ForegroundColor Red
            $allHealthy = $false
        }
    }

    return $allHealthy
}

# Check Frontend (Vercel)
Write-Host "`n🌐 Frontend Deployment Check (Vercel)" -ForegroundColor Magenta
Write-Host "-------------------------------------" -ForegroundColor Magenta
$frontendHealthy = Test-ServiceHealth -ServiceName "Frontend" -Url $VercelUrl

# Check Backend (Render)
Write-Host "`n🔧 Backend Deployment Check (Render)" -ForegroundColor Magenta
Write-Host "------------------------------------" -ForegroundColor Magenta
$backendHealthy = Test-ServiceHealth -ServiceName "Backend" -Url $BackendUrl

# Check API endpoints
if ($backendHealthy) {
    Write-Host "`n📡 API Endpoints Check" -ForegroundColor Magenta
    Write-Host "----------------------" -ForegroundColor Magenta
    $apiHealthy = Test-ApiEndpoints -BaseUrl $BackendUrl
} else {
    $apiHealthy = $false
}

# Summary
Write-Host "`n📊 Deployment Status Summary" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Yellow

$overallHealthy = $frontendHealthy -and $backendHealthy -and $apiHealthy

if ($overallHealthy) {
    Write-Host "🎉 All deployments are healthy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Frontend: $VercelUrl" -ForegroundColor Green
    Write-Host "✅ Backend:  $BackendUrl" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some services have issues. Please check the details above." -ForegroundColor Yellow
    Write-Host ""
    if (-not $frontendHealthy) {
        Write-Host "❌ Frontend: $VercelUrl" -ForegroundColor Red
    } else {
        Write-Host "✅ Frontend: $VercelUrl" -ForegroundColor Green
    }

    if (-not $backendHealthy) {
        Write-Host "❌ Backend:  $BackendUrl" -ForegroundColor Red
    } else {
        Write-Host "✅ Backend:  $BackendUrl" -ForegroundColor Green
    }
}

Write-Host "`n💡 Troubleshooting Tips:" -ForegroundColor Cyan
Write-Host "1. Check Vercel dashboard for frontend build logs"
Write-Host "2. Check Render dashboard for backend logs"
Write-Host "3. Verify environment variables are set correctly"
Write-Host "4. Check if the services are scaled to 0 instances"
Write-Host "5. Verify API endpoints are responding correctly"

Write-Host "`n🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "• Vercel Dashboard: https://vercel.com/dashboard"
Write-Host "• Render Dashboard: https://dashboard.render.com"
