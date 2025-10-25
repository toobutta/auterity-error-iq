# Use Ubuntu as base image for better compatibility
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        curl \
        wget \
        git \
        unzip \
        ca-certificates \
        gnupg \
        lsb-release \
        build-essential \
        libpq-dev \
        libssl-dev \
        libffi-dev \
        python3-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install Python 3.11 and pip
RUN apt-get update && apt-get install -y python3.11 python3.11-venv python3-pip \
    && update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Install development tools
RUN npm install -g yarn typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser \
    && pip install --upgrade pip setuptools wheel

# Create workspace directory
RUN mkdir -p /workspaces
WORKDIR /workspaces

# Set environment variables
ENV NODE_ENV=development
ENV PYTHONPATH=/workspaces/auterity-error-iq/backend
ENV PATH="/workspaces/auterity-error-iq/node_modules/.bin:$PATH"

# Create non-root user for development
RUN useradd -m -s /bin/bash vscode \
    && chown -R vscode:vscode /workspaces

USER vscode

# Default command
CMD ["sleep", "infinity"]
