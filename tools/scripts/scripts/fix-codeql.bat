@echo off
REM Fix CodeQL CLI server issues

echo Stopping CodeQL processes...
taskkill /f /im codeql.exe 2>nul

echo Clearing CodeQL locks...
del "%APPDATA%\Kiro\User\globalStorage\github.vscode-codeql\*.lock" 2>nul
del "%APPDATA%\Kiro\User\workspaceStorage\94c6d85997ee018ae2a6c34bc1a26ec6\GitHub.vscode-codeql\*.lock" 2>nul

echo Restarting VS Code extension host...
code --disable-extension GitHub.vscode-codeql
timeout /t 2 >nul
code --enable-extension GitHub.vscode-codeql

echo CodeQL fix complete
