#!/bin/bash

# Production startup script for backend
set -e

echo "Starting AutoMatrix AI Hub Workflow Engine MVP in production mode..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
python -c "
import time
import sys
from app.database import check_database_connection

max_attempts = 30
attempt = 1

while attempt <= max_attempts:
    if check_database_connection():
        print('Database is ready!')
        sys.exit(0)

    print(f'Database not ready, attempt {attempt}/{max_attempts}')
    time.sleep(2)
    attempt += 1

print('Database connection failed after maximum attempts')
sys.exit(1)
"

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start the application with gunicorn for production
echo "Starting application server..."
exec gunicorn app.main:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --timeout 30 \
    --keep-alive 2 \
    --log-level info \
    --access-logfile - \
    --error-logfile -
