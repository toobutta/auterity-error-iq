# NeuroWeaver Backend Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt requirements-training.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Install training dependencies (optional, can be skipped for inference-only)
ARG INSTALL_TRAINING=true
RUN if [ "$INSTALL_TRAINING" = "true" ]; then \
    pip install --no-cache-dir -r requirements-training.txt; \
    fi

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs /tmp/neuroweaver/models /tmp/neuroweaver/data

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app /tmp/neuroweaver
USER app

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/api/v1/health || exit 1

# Run application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]