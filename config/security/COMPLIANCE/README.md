

# Compliance Artifact

s

This directory contains generated Software Bill of Materials (SBOM), license scan results and attribution files for the project.

#

# Contents

- `SBOM.spdx.json` – SPDX 2.3 SB

O

M

- `bom.cdx.json` – CycloneDX 1.5 SB

O

M


- `scancode.json` – License scan result

s

- `ATTRIBUTION.csv` – License and obligations matri

x

- `THIRD_PARTY_NOTICES.md` – Human-readable notice

s

- `NOTICE` – Aggregate notice fil

e

- `POLICY.yml` – License compliance polic

y

#

# Regeneratio

n

To regenerate these artifacts:

```bash
scripts/compliance/install_tools.sh
scripts/compliance/generate_sbom.sh
scripts/compliance/scan_licenses.sh
scripts/compliance/evaluate_policy.sh
scripts/compliance/format_artifacts.sh

```

#

# License Polic

y

This project follows a permissive license policy allowing MIT, Apache-2.0, BSD, and similar licenses while prohibiting copyleft licenses like GPL and AGP

L

.
