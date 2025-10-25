# Simple Cloud Deployment Health Check for Auterity Error IQ
# Checks Vercel (frontend) and Render (backend) deployments

param(
    [string]$VercelUrl = "https://auterity-error-iq.vercel.app",
    [string]$BackendUrl = "https://auterity-backend.onrender.com"
)

Write-Host "Checking Auterity Error IQ Cloud Deployments..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Yellow

# Function to check service
function Test-Service {
    param([string]$Name, [string]$Url)

    Write-Host "Checking $Name at $Url..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10
        Write-Host "✅ $Name is accessible (Status: $($response.StatusCode))" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ $Name is not accessible: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check Frontend (Vercel)
Write-Host "Frontend (Vercel):" -ForegroundColor Magenta
$frontendOk = Test-Service -Name "Frontend" -Url $VercelUrl

# Check Backend (Render)
Write-Host "Backend (Render):" -ForegroundColor Magenta
$backendOk = Test-Service -Name "Backend" -Url $BackendUrl

# Summary
Write-Host "Summary:" -ForegroundColor Cyan
if ($frontendOk -and $backendOk) {
    Write-Host "🎉 All deployments are healthy!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some services have issues." -ForegroundColor Yellow
}

Write-Host "Frontend: $VercelUrl" -ForegroundColor $(if ($frontendOk) { "Green" } else { "Red" })
Write-Host "Backend:  $BackendUrl" -ForegroundColor $(if ($backendOk) { "Green" } else { "Red" })
