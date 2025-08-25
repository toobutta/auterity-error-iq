# Deploy Check

Manual hook to run pre-deployment checks.

```bash
echo "🚀 Running deployment checks..."
cd backend
python -m pytest tests/ --tb=short
echo "✅ Tests completed"
```
