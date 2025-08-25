---
name: "Workflow Engine Validation"
description: "Validate workflow engine and AI service functionality"
trigger: "file_save"
filePattern: "backend/app/services/{workflow_engine,ai_service}.py"
---

# Workflow Engine Validation Hook

Run workflow engine validation tests to ensure core functionality works after changes to critical services.

```bash
cd backend
echo "⚙️  Validating workflow engine..."

# Run the workflow validation script
python validate_workflow_engine.py
WORKFLOW_EXIT=$?

# Run AI service validation
python validate_ai_service.py
AI_EXIT=$?

# Run specific workflow tests
python -m pytest tests/test_workflow_engine.py tests/test_ai_service.py -v
TEST_EXIT=$?

if [ $WORKFLOW_EXIT -eq 0 ] && [ $AI_EXIT -eq 0 ] && [ $TEST_EXIT -eq 0 ]; then
    echo "✅ All workflow validations passed"
else
    echo "❌ Some validations failed - check implementation"
fi
```
