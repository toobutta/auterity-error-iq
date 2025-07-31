---
name: "Auto-Format Python Code"
description: "Automatically format Python code using Black and organize imports with isort"
trigger: "file_save"
filePattern: "backend/**/*.py"
---

# Auto-Format on Save Hook

Automatically format Python code using Black and organize imports with isort when backend Python files are saved.

```bash
cd backend
# Format the saved file
black "${SAVED_FILE}"
isort "${SAVED_FILE}"
# Run flake8 to check for any remaining issues
flake8 "${SAVED_FILE}" --max-line-length=88
echo "✅ Code formatted successfully"
```