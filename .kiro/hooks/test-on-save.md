---
name: "Auto-Test on Save"
description: "Run relevant tests when backend Python files are saved"
trigger: "file_save"
filePattern: "backend/**/*.py"
excludePattern: "**/test_*.py,**/__pycache__/**"
---

# Auto-Test on Save Hook

Run relevant tests automatically when backend Python files are saved to catch regressions early.

```bash
cd backend
# Get the base filename without extension
BASE_NAME=$(basename "${SAVED_FILE}" .py)
TEST_FILE="tests/test_${BASE_NAME}.py"

# Run tests for the specific module that was changed
if [ -f "$TEST_FILE" ]; then
    echo "🧪 Running tests for ${BASE_NAME}..."
    python -m pytest "$TEST_FILE" -v
else
    echo "🧪 Running all tests..."
    python -m pytest tests/ -x --tb=short
fi
```