---
name: "🔒 Security Scan"
description: "Run comprehensive security checks on the codebase"
trigger: "manual"
---

# Security Check Hook

Run comprehensive security checks on the codebase to identify potential vulnerabilities and outdated dependencies.

```bash
echo "🔒 Running security scan..."

# Backend security checks
cd backend
echo "🐍 Scanning Python dependencies..."
if command -v pip-audit &> /dev/null; then
    pip-audit --desc --format=json > ../security-report.json
    echo "✅ Dependency audit complete"
else
    echo "⚠️  pip-audit not installed. Run: pip install pip-audit"
fi

echo "🔍 Scanning Python code for security issues..."
if command -v bandit &> /dev/null; then
    bandit -r app/ -f json -o ../bandit-report.json
    echo "✅ Code security scan complete"
else
    echo "⚠️  bandit not installed. Run: pip install bandit"
fi

# Frontend security checks
cd ../frontend
echo "📦 Scanning Node.js dependencies..."
npm audit --audit-level=moderate
if [ $? -eq 0 ]; then
    echo "✅ No moderate+ vulnerabilities found"
else
    echo "⚠️  Vulnerabilities found. Run: npm audit fix"
fi

echo ""
echo "🔒 Security scan complete!"
echo "📄 Check security-report.json and bandit-report.json for details"
```