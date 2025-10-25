#!/bin/bash
# SPDX-License-Identifier: MIT
set -e

echo "Running pre-commit compliance checks..."

# Basic SPDX header check for staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(py|js|ts|tsx|sh)$' || true)

if [ -n "$STAGED_FILES" ]; then
    echo "Checking SPDX headers in staged files..."
    MISSING_HEADERS=""
    
    for file in $STAGED_FILES; do
        if [ -f "$file" ] && ! head -n 5 "$file" | grep -q "SPDX-License-Identifier"; then
            MISSING_HEADERS="$MISSING_HEADERS\n  $file"
        fi
    done
    
    if [ -n "$MISSING_HEADERS" ]; then
        echo "WARNING: The following files are missing SPDX headers:$MISSING_HEADERS"
        echo "Consider adding SPDX-License-Identifier headers to new files."
        # Don't fail for now, just warn
    fi
fi

# Check for potential license issues in diff
if git diff --cached | grep -iE '(GPL|AGPL|SSPL|BUSL)' >/dev/null 2>&1; then
    echo "WARNING: Potential prohibited license reference detected in staged changes"
    # Don't fail for now, just warn
fi

echo "Pre-commit compliance checks completed"
