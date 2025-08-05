FROM python:3.10-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements/integration.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy integration tests
COPY integration_tests /app/integration_tests

# Set environment variables
ENV PYTHONPATH=/app

# Default command
CMD ["pytest", "integration_tests/", "--junitxml=integration-results.xml"]