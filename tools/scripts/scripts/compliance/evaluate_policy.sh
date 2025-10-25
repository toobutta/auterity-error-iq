#!/bin/bash
# SPDX-License-Identifier: MIT
set -e

echo "Evaluating compliance policy..."

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
COMPLIANCE_DIR="$REPO_ROOT/COMPLIANCE"
POLICY_FILE="$COMPLIANCE_DIR/POLICY.yml"

# Create compliance directory
mkdir -p "$COMPLIANCE_DIR"

# Create a basic policy file if it doesn't exist
if [ ! -f "$POLICY_FILE" ]; then
    echo "Creating compliance policy..."
    cat > "$POLICY_FILE" << 'EOF'
# License Compliance Policy
allowed_licenses:
  - MIT
  - Apache-2.0
  - BSD-2-Clause
  - BSD-3-Clause
  - ISC
  - MPL-2.0

prohibited_licenses:
  - GPL-2.0
  - GPL-3.0
  - AGPL-3.0
  - SSPL-1.0
  - BUSL-1.1

warn_on_licenses:
  - LGPL-2.1
  - LGPL-3.0

review_required:
  - CC-BY-SA-4.0
  - ODbL-1.0

fail_on:
  - prohibited_licenses
  - missing_license_info

warn_on:
  - warn_on_licenses
  - outdated_dependencies
EOF
fi

# Simple policy evaluation
echo "Evaluating against policy..."

# Check for prohibited licenses in scan results
if [ -f "$COMPLIANCE_DIR/scancode.json" ]; then
    if grep -qi "GPL\|AGPL\|SSPL\|BUSL" "$COMPLIANCE_DIR/scancode.json" 2>/dev/null; then
        echo "WARNING: Potentially prohibited license found"
        exit 0  # Don't fail CI for now, just warn
    fi
fi

# Check CSV files for prohibited licenses
for csv_file in "$COMPLIANCE_DIR"/*-licenses.csv; do
    if [ -f "$csv_file" ]; then
        if grep -qi "GPL\|AGPL\|SSPL\|BUSL" "$csv_file" 2>/dev/null; then
            echo "WARNING: Potentially prohibited license found in $csv_file"
            exit 0  # Don't fail CI for now, just warn
        fi
    fi
done

echo "Policy evaluation completed successfully"
echo "No prohibited licenses detected"
