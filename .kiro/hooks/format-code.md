---
name: Format Code
description: Format Python code with Black
trigger: file_save
filePattern: "**/*.py"
---

```bash
cd backend
black "${SAVED_FILE}"
echo "Formatted ${SAVED_FILE}"
```
