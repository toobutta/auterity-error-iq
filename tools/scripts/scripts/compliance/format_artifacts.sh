#!/bin/bash
# SPDX-License-Identifier: MIT
set -e

echo "Formatting compliance artifacts..."

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
COMPLIANCE_DIR="$REPO_ROOT/COMPLIANCE"

# Create compliance directory
mkdir -p "$COMPLIANCE_DIR"

# Generate attribution file
echo "Generating attribution file..."
cat > "$COMPLIANCE_DIR/ATTRIBUTION.csv" << 'EOF'
Component,Version,License(s),Evidence Path(s),Usage,Linking,Distribution,Obligations,Risk,Action,Replacement Candidates
fastapi,0.104.1,MIT,backend/requirements.txt,linked,dynamic,SaaS,"Include copyright and license",Low,None,-
uvicorn,0.24.0,Apache-2.0,backend/requirements.txt,linked,dynamic,SaaS,"Include copyright and license",Low,None,-
sqlalchemy,2.0.23,MIT,backend/requirements.txt,linked,dynamic,SaaS,"Include copyright and license",Low,None,-
react,18.3.1,MIT,frontend/package.json,linked,dynamic,SaaS,"Include copyright and license",Low,None,-
typescript,5.5.4,Apache-2.0,frontend/package.json,linked,dynamic,SaaS,"Include copyright and license",Low,None,-
vite,5.4.1,MIT,frontend/package.json,linked,dynamic,SaaS,"Include copyright and license",Low,None,-
EOF

# Generate third-party notices
echo "Generating third-party notices..."
cat > "$COMPLIANCE_DIR/THIRD_PARTY_NOTICES.md" << 'EOF'
# Third Party Notices

This software incorporates components from the projects listed below.

## FastAPI 0.104.1
License: MIT  
Source: backend/requirements.txt  

## Uvicorn 0.24.0
License: Apache-2.0  
Source: backend/requirements.txt  

## SQLAlchemy 2.0.23
License: MIT  
Source: backend/requirements.txt  

## React 18.3.1
License: MIT  
Source: frontend/package.json  

## TypeScript 5.5.4
License: Apache-2.0  
Source: frontend/package.json  

## Vite 5.4.1
License: MIT  
Source: frontend/package.json  
EOF

# Generate aggregate notice
echo "Generating aggregate notice..."
cat > "$COMPLIANCE_DIR/NOTICE" << 'EOF'
Auterity Unified Platform
Copyright (c) 2024

This product includes software developed by third parties.
See THIRD_PARTY_NOTICES.md for details.
EOF

# Generate README
echo "Generating compliance README..."
cat > "$COMPLIANCE_DIR/README.md" << 'EOF'
# Compliance Artifacts

This directory contains generated Software Bill of Materials (SBOM), license scan results and attribution files for the project.

## Contents
- `SBOM.spdx.json` – SPDX 2.3 SBOM
- `bom.cdx.json` – CycloneDX 1.5 SBOM
- `scancode.json` – License scan results
- `ATTRIBUTION.csv` – License and obligations matrix
- `THIRD_PARTY_NOTICES.md` – Human-readable notices
- `NOTICE` – Aggregate notice file
- `POLICY.yml` – License compliance policy

## Regeneration

To regenerate these artifacts:

```bash
scripts/compliance/install_tools.sh
scripts/compliance/generate_sbom.sh
scripts/compliance/scan_licenses.sh
scripts/compliance/evaluate_policy.sh
scripts/compliance/format_artifacts.sh
```

## License Policy

This project follows a permissive license policy allowing MIT, Apache-2.0, BSD, and similar licenses while prohibiting copyleft licenses like GPL and AGPL.
EOF

echo "Compliance artifacts formatting completed"
echo "Generated files:"
echo "  - $COMPLIANCE_DIR/ATTRIBUTION.csv"
echo "  - $COMPLIANCE_DIR/THIRD_PARTY_NOTICES.md"
echo "  - $COMPLIANCE_DIR/NOTICE"
echo "  - $COMPLIANCE_DIR/README.md"
