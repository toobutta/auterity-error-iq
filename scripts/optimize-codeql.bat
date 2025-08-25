@echo off
REM CodeQL Performance Optimization

set CODEQL_PATH=%APPDATA%\Kiro\User\globalStorage\github.vscode-codeql
set DB_PATH=%APPDATA%\Kiro\User\workspaceStorage\94c6d85997ee018ae2a6c34bc1a26ec6\GitHub.vscode-codeql

if "%1"=="clean" (
    echo Cleaning CodeQL cache...
    rmdir /s /q "%CODEQL_PATH%" 2>nul
    rmdir /s /q "%DB_PATH%" 2>nul
)

set CODEQL_EXE=%CODEQL_PATH%\distribution1\codeql\codeql.exe
if exist "%CODEQL_EXE%" (
    echo Pre-warming CodeQL database...
    "%CODEQL_EXE%" database info --format=json "%DB_PATH%\toobutta-auterity-error-iq\codeql_db" >nul 2>&1
)

echo CodeQL optimization complete
