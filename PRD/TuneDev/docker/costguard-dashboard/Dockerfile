# Build stage
FROM python:3.10-slim AS build

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements/costguard-dashboard.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/frontend/components/dashboard /app/src/frontend/components/dashboard

# Production stage
FROM python:3.10-slim

WORKDIR /app

# Copy installed packages from build stage
COPY --from=build /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages

# Copy application code
COPY --from=build /app /app

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8050

# Expose the port the app will run on
EXPOSE 8050

# Start the application
CMD ["python", "src/frontend/components/dashboard/app.py"]