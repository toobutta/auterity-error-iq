#!/bin/bash
# backend-lint-fix.sh - Script to automatically fix Python linting issues
# Usage: ./backend-lint-fix.sh [--check-only]

set -e

cd "$(dirname "$0")/.."
BACKEND_DIR="$(pwd)/backend"

# Check if we're only checking or actually fixing
CHECK_ONLY=false
if [ "$1" == "--check-only" ]; then
  CHECK_ONLY=true
fi

echo "=== Auterity Backend Linting Tool ==="
echo "Working directory: $BACKEND_DIR"
echo ""

# Ensure we have the required tools
if ! command -v python3 &> /dev/null; then
  echo "Error: python3 is required but not installed."
  exit 1
fi

# Check if required packages are installed
echo "Checking for required packages..."
REQUIRED_PACKAGES=("black" "isort" "flake8")
MISSING_PACKAGES=()

for package in "${REQUIRED_PACKAGES[@]}"; do
  if ! python3 -m pip list | grep -q "$package"; then
    MISSING_PACKAGES+=("$package")
  fi
done

if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
  echo "The following required packages are missing:"
  for package in "${MISSING_PACKAGES[@]}"; do
    echo "  - $package"
  done

  read -p "Would you like to install them now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    python3 -m pip install "${MISSING_PACKAGES[@]}"
  else
    echo "Cannot proceed without required packages."
    exit 1
  fi
fi

# Step 1: Check/Apply Black formatting
echo "Step 1: Checking Black formatting..."
if $CHECK_ONLY; then
  python3 -m black --check "$BACKEND_DIR/app"
  BLACK_STATUS=$?
else
  echo "Applying Black formatting..."
  python3 -m black "$BACKEND_DIR/app"
  BLACK_STATUS=$?
fi

# Step 2: Check/Fix import sorting
echo "Step 2: Checking import sorting with isort..."
if $CHECK_ONLY; then
  python3 -m isort --check-only "$BACKEND_DIR/app"
  ISORT_STATUS=$?
else
  echo "Fixing import sorting with isort..."
  python3 -m isort "$BACKEND_DIR/app"
  ISORT_STATUS=$?
fi

# Step 3: Check remaining flake8 issues
echo "Step 3: Checking remaining flake8 issues..."
python3 -m flake8 "$BACKEND_DIR/app" > flake8-report.txt
FLAKE8_STATUS=$?

# Summary
echo ""
echo "=== Linting Summary ==="
echo "Black formatting: $([ $BLACK_STATUS -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Import sorting: $([ $ISORT_STATUS -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Flake8 check: $([ $FLAKE8_STATUS -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL")"

if [ $FLAKE8_STATUS -ne 0 ]; then
  echo ""
  echo "Flake8 issues summary:"
  grep -o "E[0-9]\+\|W[0-9]\+" flake8-report.txt | sort | uniq -c | sort -nr
  echo "Full report saved to flake8-report.txt"
fi

echo ""
if $CHECK_ONLY; then
  echo "Run this script without --check-only to fix the issues automatically."
else
  echo "Automated fixes have been applied. Some issues may require manual fixes."
fi

# Exit with error if any tool failed
if [ $BLACK_STATUS -ne 0 ] || [ $ISORT_STATUS -ne 0 ] || [ $FLAKE8_STATUS -ne 0 ]; then
  exit 1
fi

exit 0
