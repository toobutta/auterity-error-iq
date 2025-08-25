#!/bin/bash
# Hook: Format Python Code
# Trigger: file_save
# Pattern: **/*.py

cd backend
black "${SAVED_FILE}"
echo "✅ Formatted ${SAVED_FILE}"
