#!/bin/bash

# Script to format the migration file with Black
# This ensures the file follows the project's code style

set -e

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Path to the migration file
MIGRATION_FILE="$PROJECT_ROOT/backend/alembic/versions/add_model_tracking_tables.py"

# Check if the file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

# Check if Black is installed
if ! command -v black &> /dev/null; then
    echo "Error: Black is not installed or not in PATH"
    echo "Please install Black using: pip install black"
    exit 1
fi

# Format the file with Black
echo "Formatting migration file with Black..."
black "$MIGRATION_FILE"

# Run Flake8 to check for any remaining issues
if command -v flake8 &> /dev/null; then
    echo "Checking for linting issues with Flake8..."
    flake8 "$MIGRATION_FILE" || echo "Flake8 found issues that need to be addressed manually."
else
    echo "Warning: Flake8 is not installed or not in PATH"
    echo "Install Flake8 using: pip install flake8"
fi

echo "Done!"
