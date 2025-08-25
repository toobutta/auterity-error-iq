---
name: "Frontend Lint & Type Check"
description: "Run ESLint and TypeScript type checking on frontend files"
trigger: "file_save"
filePattern: "frontend/src/**/*.{ts,tsx}"
---

# Frontend Lint and Type Check Hook

Run ESLint and TypeScript type checking on frontend files to catch errors immediately.

```bash
cd frontend
# Run ESLint on the saved file with auto-fix
npx eslint "${SAVED_FILE}" --fix

# Run TypeScript type checking
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ Frontend code looks good"
else
    echo "⚠️  TypeScript errors found"
fi
```
