---
name: "Database Migration Check"
description: "Check if database models have changed and suggest creating migrations"
trigger: "file_save"
filePattern: "backend/app/models/*.py"
---

# Database Migration Check Hook

Check if database models have changed and suggest creating migrations to maintain schema consistency.

```bash
cd backend
# Check for model changes that might need migrations
echo "🗄️  Checking for model changes..."
alembic check
if [ $? -ne 0 ]; then
    echo "⚠️  Model changes detected. Consider running:"
    echo "   alembic revision --autogenerate -m 'describe your changes'"
    echo "   alembic upgrade head"
else
    echo "✅ Database schema is up to date"
fi
```