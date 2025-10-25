#!/bin/bash
# SPDX-License-Identifier: MIT
set -e

echo "Installing compliance tools..."

# Create tools directory
TOOLS_DIR="$(pwd)/.compliance-tools"
mkdir -p "$TOOLS_DIR"

# Pinned versions for reproducibility
SYFT_VERSION="1.0.1"
TRIVY_VERSION="0.50.1"

OS=$(uname | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Map architecture names
case $ARCH in
    x86_64) ARCH="amd64" ;;
    arm64|aarch64) ARCH="arm64" ;;
esac

echo "Detected OS: $OS, Architecture: $ARCH"

# Install Syft for SBOM generation
if [ ! -f "$TOOLS_DIR/syft" ]; then
    echo "Installing Syft $SYFT_VERSION..."
    SYFT_URL="https://github.com/anchore/syft/releases/download/v${SYFT_VERSION}/syft_${SYFT_VERSION}_${OS}_${ARCH}.tar.gz"
    curl -sSL "$SYFT_URL" | tar -xz -C "$TOOLS_DIR" syft || {
        echo "Warning: Failed to install Syft from $SYFT_URL"
        echo "Continuing without Syft..."
    }
fi

# Install Trivy for vulnerability scanning
if [ ! -f "$TOOLS_DIR/trivy" ]; then
    echo "Installing Trivy $TRIVY_VERSION..."
    TRIVY_URL="https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_${OS}-${ARCH}.tar.gz"
    curl -sSL "$TRIVY_URL" | tar -xz -C "$TOOLS_DIR" trivy || {
        echo "Warning: Failed to install Trivy from $TRIVY_URL"
        echo "Continuing without Trivy..."
    }
fi

# Add tools to PATH for this session
export PATH="$TOOLS_DIR:$PATH"

echo "Compliance tools installation completed"
echo "Add $TOOLS_DIR to your PATH to use these tools"
