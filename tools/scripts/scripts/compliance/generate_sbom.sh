#!/bin/bash
# SPDX-License-Identifier: MIT
set -e

echo "Generating Software Bill of Materials (SBOM)..."

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
TOOLS_DIR="$REPO_ROOT/.compliance-tools"
COMPLIANCE_DIR="$REPO_ROOT/COMPLIANCE"

# Create compliance directory
mkdir -p "$COMPLIANCE_DIR"

# Add tools to PATH
export PATH="$TOOLS_DIR:$PATH"

# Generate SBOM using Syft if available
if command -v syft >/dev/null 2>&1; then
    echo "Generating SPDX SBOM..."
    syft packages dir:"$REPO_ROOT" -o spdx-json --file "$COMPLIANCE_DIR/SBOM.spdx.json" || {
        echo "Warning: Syft SPDX generation failed, creating minimal SBOM"
        cat > "$COMPLIANCE_DIR/SBOM.spdx.json" << 'EOF'
{
  "spdxVersion": "SPDX-2.3",
  "dataLicense": "CC0-1.0",
  "SPDXID": "SPDXRef-DOCUMENT",
  "name": "auterity-unified-platform",
  "documentNamespace": "https://github.com/toobutta/auterity-error-iq",
  "creationInfo": {
    "created": "2025-08-28T00:00:00Z",
    "creators": ["Tool: minimal-sbom"]
  },
  "packages": []
}
EOF
    }

    echo "Generating CycloneDX SBOM..."
    syft packages dir:"$REPO_ROOT" -o cyclonedx-json --file "$COMPLIANCE_DIR/bom.cdx.json" || {
        echo "Warning: Syft CycloneDX generation failed, creating minimal SBOM"
        cat > "$COMPLIANCE_DIR/bom.cdx.json" << 'EOF'
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "serialNumber": "urn:uuid:00000000-0000-0000-0000-000000000000",
  "version": 1,
  "metadata": {
    "timestamp": "2025-08-28T00:00:00Z",
    "tools": [{"name": "minimal-sbom", "version": "1.0.0"}]
  },
  "components": []
}
EOF
    }
else
    echo "Warning: Syft not available, creating minimal SBOMs"
    
    # Create minimal SPDX SBOM
    cat > "$COMPLIANCE_DIR/SBOM.spdx.json" << 'EOF'
{
  "spdxVersion": "SPDX-2.3",
  "dataLicense": "CC0-1.0",
  "SPDXID": "SPDXRef-DOCUMENT",
  "name": "auterity-unified-platform",
  "documentNamespace": "https://github.com/toobutta/auterity-error-iq",
  "creationInfo": {
    "created": "2025-08-28T00:00:00Z",
    "creators": ["Tool: minimal-sbom"]
  },
  "packages": []
}
EOF

    # Create minimal CycloneDX SBOM
    cat > "$COMPLIANCE_DIR/bom.cdx.json" << 'EOF'
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "serialNumber": "urn:uuid:00000000-0000-0000-0000-000000000000",
  "version": 1,
  "metadata": {
    "timestamp": "2025-08-28T00:00:00Z",
    "tools": [{"name": "minimal-sbom", "version": "1.0.0"}]
  },
  "components": []
}
EOF
fi

echo "SBOM generation completed"
echo "Generated files:"
echo "  - $COMPLIANCE_DIR/SBOM.spdx.json"
echo "  - $COMPLIANCE_DIR/bom.cdx.json"
