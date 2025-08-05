FROM python:3.10-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements/template-system.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/template-system /app/src/template-system
COPY vertical_kits /app/vertical_kits

# Set environment variables
ENV PYTHONPATH=/app

# Run validation on startup
CMD ["python", "src/template-system/tools/validate_templates.py", "--directory", "vertical_kits/automotive/templates"]