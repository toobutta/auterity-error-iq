#!/bin/bash
# frontend-lint-fix.sh - Script to automatically fix TypeScript/React linting issues
# Usage: ./frontend-lint-fix.sh [--check-only]

set -e

cd "$(dirname "$0")/.."
FRONTEND_DIR="$(pwd)/frontend"

# Check if we're only checking or actually fixing
CHECK_ONLY=false
if [ "$1" == "--check-only" ]; then
  CHECK_ONLY=true
fi

echo "=== Auterity Frontend Linting Tool ==="
echo "Working directory: $FRONTEND_DIR"
echo ""

# Ensure we have the required tools
if ! command -v npm &> /dev/null; then
  echo "Error: npm is required but not installed."
  exit 1
fi

# Check if we're in the right directory structure
if [ ! -f "$FRONTEND_DIR/package.json" ]; then
  echo "Error: Could not find package.json in $FRONTEND_DIR"
  exit 1
fi

# Step 1: Run ESLint check or autofix
echo "Step 1: Running ESLint..."
cd "$FRONTEND_DIR"

if $CHECK_ONLY; then
  echo "Checking for linting issues..."
  npm run lint > lint-report.txt 2>&1 || true
else
  echo "Applying automatic fixes..."
  npm run lint -- --fix > lint-report.txt 2>&1 || true
fi

# Count remaining issues
ERRORS=$(grep -c "error" lint-report.txt || echo 0)
WARNINGS=$(grep -c "warning" lint-report.txt || echo 0)

# Step 2: Analyze remaining issues
echo "Step 2: Analyzing remaining issues..."

# Count by error type
echo "Most common error types:"
grep -o "@typescript-eslint/[a-z-]\+" lint-report.txt | sort | uniq -c | sort -nr | head -5

# Count by file
echo "Files with most issues:"
grep -o "/.*\.tsx\?:" lint-report.txt | sort | uniq -c | sort -nr | head -5

# Summary
echo ""
echo "=== Linting Summary ==="
echo "Total errors: $ERRORS"
echo "Total warnings: $WARNINGS"
echo "Full report saved to $FRONTEND_DIR/lint-report.txt"

# Generate TypeScript interface suggestions for 'any' types
if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "=== TypeScript Type Suggestions ==="
  echo "Files with 'any' type usage:"
  grep -l "no-explicit-any" lint-report.txt | sort

  echo ""
  echo "Suggested approach for fixing 'any' types:"
  echo "1. Create proper interfaces for API responses"
  echo "2. Use 'unknown' type where appropriate"
  echo "3. Use utility types like Partial<T>, Pick<T, K>, etc."

  # Example interface suggestion
  echo ""
  echo "Example interface for workflow data:"
  echo "interface WorkflowData {"
  echo "  id: string;"
  echo "  name: string;"
  echo "  nodes: WorkflowNode[];"
  echo "  edges: WorkflowEdge[];"
  echo "  metadata: Record<string, unknown>;"
  echo "}"
fi

echo ""
if $CHECK_ONLY; then
  echo "Run this script without --check-only to apply automatic fixes."
else
  echo "Automated fixes have been applied. Some issues require manual fixes."
fi

# Exit with error if there are still issues
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
  exit 1
fi

exit 0
