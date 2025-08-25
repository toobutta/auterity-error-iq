# CodeQL Performance Optimization
param([switch]$Clean)

$codeqlPath = "$env:APPDATA\Kiro\User\globalStorage\github.vscode-codeql"
$dbPath = "$env:APPDATA\Kiro\User\workspaceStorage\94c6d85997ee018ae2a6c34bc1a26ec6\GitHub.vscode-codeql"

if ($Clean) {
    Write-Host "Cleaning CodeQL cache..."
    Remove-Item "$codeqlPath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$dbPath\*" -Recurse -Force -ErrorAction SilentlyContinue
}

# Pre-warm database
$codeqlExe = "$codeqlPath\distribution1\codeql\codeql.exe"
if (Test-Path $codeqlExe) {
    Write-Host "Pre-warming CodeQL database..."
    & $codeqlExe database info --format=json $dbPath\toobutta-auterity-error-iq\codeql_db | Out-Null
}

Write-Host "CodeQL optimization complete"
